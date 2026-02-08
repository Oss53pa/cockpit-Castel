// ============================================================================
// PROPH3T ENGINE V2 — INSIGHT NARRATOR
// ============================================================================
// Génération de narratifs intelligents pour les rapports
// ============================================================================

import type {
  Prediction,
  Anomaly,
  CascadeEffect,
  ProjectState,
  ConfidenceScore,
} from '../core/types';
import type { PrioritizedAction } from '../prescribers/priorityMatrix';
import type { EVMResult } from '../predictors/costPredictor';
import type { PatternMatch } from '../memory/patternStore';
import type { LearningInsight } from '../memory/feedbackLoop';

// ============================================================================
// TYPES
// ============================================================================

export interface NarrativeSection {
  id: string;
  title: string;
  content: string;
  level: 'header' | 'subheader' | 'body' | 'highlight' | 'warning' | 'critical';
  icon?: string;
  data?: Record<string, unknown>;
}

export interface ExecutiveSummary {
  headline: string;
  keyPoints: string[];
  bottomLine: string;
  confidenceStatement: string;
}

export interface ModuleNarrative {
  module: string;
  status: 'healthy' | 'attention' | 'critical';
  summary: string;
  details: string[];
  recommendations: string[];
}

export interface TrendNarrative {
  metric: string;
  direction: 'improving' | 'stable' | 'deteriorating';
  narrative: string;
  implication: string;
}

export interface NarrativeContext {
  state: ProjectState;
  predictions: Prediction[];
  anomalies: Anomaly[];
  cascades: CascadeEffect[];
  actions: PrioritizedAction[];
  evm: EVMResult;
  patterns?: PatternMatch[];
  insights?: LearningInsight[];
}

// ============================================================================
// TEMPLATES DE NARRATION
// ============================================================================

const TEMPLATES = {
  // Budget
  budgetHealthy: 'Le budget est sous contrôle avec un CPI de {cpi}. Les dépenses sont en ligne avec les prévisions.',
  budgetWarning: 'Attention au budget: le CPI de {cpi} indique une dérive de {deviation}%. Des mesures correctives sont recommandées.',
  budgetCritical: 'ALERTE BUDGET: Le CPI de {cpi} révèle un dépassement de {deviation}%. L\'estimation à terminaison s\'élève à {eac} FCFA.',

  // Planning
  scheduleOnTrack: 'Le planning est respecté. {remaining} jours restants avant l\'ouverture avec {lateActions} actions en retard.',
  scheduleWarning: 'Le planning présente des tensions: {lateActions} actions en retard et {criticalActions} sur le chemin critique.',
  scheduleCritical: 'ALERTE PLANNING: {delay} jours de retard accumulés. La date d\'ouverture est compromise sans action immédiate.',

  // Commercial
  commercialExcellent: 'Excellente performance commerciale: {occupancy}% d\'occupation avec l\'ancre signé.',
  commercialGood: 'Commercialisation en bonne voie: {occupancy}% d\'occupation. {gap}% restant pour atteindre l\'objectif.',
  commercialWarning: 'Vigilance commerciale: seulement {occupancy}% d\'occupation à {remaining} jours de l\'ouverture.',
  commercialCritical: 'ALERTE COMMERCIALE: {occupancy}% d\'occupation et l\'ancre non signé. Risque majeur sur les revenus.',

  // Actions
  actionsSummary: '{p0Count} actions priorité absolue et {p1Count} actions haute priorité identifiées.',
  noUrgentActions: 'Aucune action urgente requise. Maintenir le suivi standard.',

  // Patterns
  patternDetected: 'Pattern reconnu: "{patternName}". Basé sur l\'historique, {likelyOutcome}.',
  noPatterns: 'Aucun pattern historique significatif détecté.',

  // Cascades
  cascadeWarning: '{count} effets cascade détectés entre les modules. Impact total estimé: {impact}%.',
  noCascades: 'Pas d\'effet cascade critique détecté. Les modules évoluent de façon indépendante.',
};

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class InsightNarrator {
  /**
   * Génère un résumé exécutif
   */
  public generateExecutiveSummary(context: NarrativeContext): ExecutiveSummary {
    const { state, predictions, actions, evm } = context;

    // Déterminer le statut global
    const criticalPredictions = predictions.filter(p => p.impact === 'critical');
    const p0Actions = actions.filter(a => a.priority === 'P0');

    // Construire le headline
    let headline: string;
    if (criticalPredictions.length === 0 && p0Actions.length === 0) {
      headline = 'Projet en bonne santé - Suivi standard recommandé';
    } else if (criticalPredictions.length > 2 || p0Actions.length > 3) {
      headline = 'ATTENTION REQUISE - Plusieurs points critiques identifiés';
    } else {
      headline = 'Vigilance accrue - Points de tension détectés';
    }

    // Points clés
    const keyPoints: string[] = [];

    // Budget
    if (evm.cpi < 0.9) {
      keyPoints.push(`Budget: Dépassement de ${((1 - evm.cpi) * 100).toFixed(0)}% (CPI: ${evm.cpi.toFixed(2)})`);
    } else if (evm.cpi >= 1) {
      keyPoints.push(`Budget: Sous contrôle (CPI: ${evm.cpi.toFixed(2)})`);
    }

    // Planning
    const daysRemaining = state.currentMetrics.joursRestants;
    const lateActions = state.currentMetrics.actionsEnRetard;
    if (lateActions > state.currentMetrics.actionsTotal * 0.2) {
      keyPoints.push(`Planning: ${lateActions} actions en retard (${Math.round(lateActions / state.currentMetrics.actionsTotal * 100)}%)`);
    } else {
      keyPoints.push(`Planning: ${daysRemaining} jours restants, situation maîtrisée`);
    }

    // Commercial
    const occupancy = state.currentMetrics.tauxOccupation;
    const anchorSigned = state.anchorTenant?.signed ?? false;
    if (occupancy < 50 || !anchorSigned) {
      const anchorStatus = anchorSigned ? '' : ' - Ancre non signé';
      keyPoints.push(`Commercial: ${occupancy.toFixed(0)}% occupation${anchorStatus}`);
    } else {
      keyPoints.push(`Commercial: ${occupancy.toFixed(0)}% occupation - En bonne voie`);
    }

    // Bottom line
    let bottomLine: string;
    if (p0Actions.length > 0) {
      bottomLine = `${p0Actions.length} action(s) priorité absolue à traiter immédiatement`;
    } else if (actions.filter(a => a.priority === 'P1').length > 0) {
      bottomLine = `${actions.filter(a => a.priority === 'P1').length} action(s) haute priorité à planifier cette semaine`;
    } else {
      bottomLine = 'Continuer le suivi régulier des indicateurs';
    }

    // Confidence statement
    const avgConfidence = this.calculateAverageConfidence(predictions);
    const confidenceStatement = `Niveau de confiance des analyses: ${avgConfidence}% (${this.getConfidenceLabel(avgConfidence)})`;

    return {
      headline,
      keyPoints,
      bottomLine,
      confidenceStatement,
    };
  }

  /**
   * Génère un narratif par module
   */
  public generateModuleNarratives(context: NarrativeContext): ModuleNarrative[] {
    return [
      this.generateBudgetNarrative(context),
      this.generateScheduleNarrative(context),
      this.generateCommercialNarrative(context),
      this.generateRiskNarrative(context),
    ];
  }

  /**
   * Génère un narratif de tendances
   */
  public generateTrendNarratives(
    context: NarrativeContext,
    trends: Record<string, { current: number; previous: number; trend: string }>
  ): TrendNarrative[] {
    const narratives: TrendNarrative[] = [];

    for (const [metric, data] of Object.entries(trends)) {
      const direction = data.trend === 'up' ? 'improving' :
        data.trend === 'down' ? 'deteriorating' : 'stable';

      let narrative: string;
      let implication: string;

      switch (metric) {
        case 'avancement':
          narrative = direction === 'improving'
            ? `L'avancement progresse bien (+${(data.current - data.previous).toFixed(1)}%)`
            : direction === 'deteriorating'
              ? `L'avancement ralentit (${(data.current - data.previous).toFixed(1)}%)`
              : `L'avancement est stable à ${data.current.toFixed(1)}%`;
          implication = direction === 'deteriorating'
            ? 'Surveiller les blocages potentiels'
            : 'Maintenir le rythme actuel';
          break;

        case 'occupation':
          narrative = direction === 'improving'
            ? `Le taux d'occupation progresse (+${(data.current - data.previous).toFixed(0)} points)`
            : direction === 'deteriorating'
              ? `Le taux d'occupation stagne ou régresse`
              : `Le taux d'occupation est stable à ${data.current.toFixed(0)}%`;
          implication = data.current < 60
            ? 'Intensifier les efforts commerciaux'
            : 'Continuer la stratégie actuelle';
          break;

        case 'actionsRetard':
          narrative = direction === 'deteriorating'
            ? `Le nombre d'actions en retard augmente (${data.current})`
            : direction === 'improving'
              ? `Les retards se résorbent (${data.current} actions)`
              : `Le nombre de retards est stable`;
          implication = data.current > 10
            ? 'Prioriser la résorption des retards'
            : 'Situation normale';
          break;

        default:
          continue;
      }

      narratives.push({ metric, direction, narrative, implication });
    }

    return narratives;
  }

  /**
   * Génère un narratif pour les patterns détectés
   */
  public generatePatternNarrative(patterns: PatternMatch[]): NarrativeSection | null {
    if (patterns.length === 0) {
      return null;
    }

    const topPattern = patterns[0];
    const outcomeText = topPattern.likelyOutcome
      ? `Issue probable: ${topPattern.likelyOutcome.description} (${topPattern.likelyOutcome.probability}% de probabilité)`
      : 'Issue à surveiller';

    return {
      id: 'pattern-narrative',
      title: 'Patterns Historiques Détectés',
      content: `**${topPattern.pattern.name}**: ${topPattern.pattern.description}. ` +
        `Score de correspondance: ${topPattern.matchScore}%. ${outcomeText}.`,
      level: topPattern.likelyOutcome?.impactType === 'negative' ? 'warning' : 'body',
      icon: '🔍',
      data: {
        patternCount: patterns.length,
        topMatchScore: topPattern.matchScore,
      },
    };
  }

  /**
   * Génère un narratif pour les cascades
   */
  public generateCascadeNarrative(cascades: CascadeEffect[]): NarrativeSection | null {
    if (cascades.length === 0) {
      return null;
    }

    const totalImpact = cascades.reduce((sum, c) => sum + c.propagatedImpact, 0);
    const avgImpact = totalImpact / cascades.length;

    const moduleSet = new Set<string>();
    for (const cascade of cascades) {
      moduleSet.add(cascade.sourceModule);
      moduleSet.add(cascade.targetModule);
    }

    return {
      id: 'cascade-narrative',
      title: 'Effets Cascade Inter-Modules',
      content: `${cascades.length} effet(s) cascade détecté(s) affectant ${moduleSet.size} modules. ` +
        `Impact moyen propagé: ${avgImpact.toFixed(0)}%. ` +
        `Les interactions entre modules nécessitent une coordination renforcée.`,
      level: avgImpact > 30 ? 'warning' : 'body',
      icon: '🌊',
      data: {
        cascadeCount: cascades.length,
        averageImpact: avgImpact,
        modulesAffected: Array.from(moduleSet),
      },
    };
  }

  /**
   * Génère une section de recommandations priorisées
   */
  public generateRecommendationsNarrative(actions: PrioritizedAction[]): NarrativeSection[] {
    const sections: NarrativeSection[] = [];

    // P0 - Priorité absolue
    const p0 = actions.filter(a => a.priority === 'P0');
    if (p0.length > 0) {
      sections.push({
        id: 'reco-p0',
        title: 'Actions Priorité Absolue (P0)',
        content: p0.map((a, i) => `${i + 1}. **${a.action}** - ${a.rationale}`).join('\n\n'),
        level: 'critical',
        icon: '🚨',
        data: { count: p0.length, actions: p0.map(a => a.action) },
      });
    }

    // P1 - Haute priorité
    const p1 = actions.filter(a => a.priority === 'P1');
    if (p1.length > 0) {
      sections.push({
        id: 'reco-p1',
        title: 'Actions Haute Priorité (P1)',
        content: p1.slice(0, 5).map((a, i) => `${i + 1}. **${a.action}** - ${a.rationale}`).join('\n\n'),
        level: 'warning',
        icon: '⚠️',
        data: { count: p1.length, actions: p1.slice(0, 5).map(a => a.action) },
      });
    }

    // P2 - À planifier
    const p2 = actions.filter(a => a.priority === 'P2');
    if (p2.length > 0) {
      sections.push({
        id: 'reco-p2',
        title: 'Actions à Planifier (P2)',
        content: `${p2.length} action(s) identifiée(s) pour planification cette semaine.`,
        level: 'body',
        icon: '📋',
        data: { count: p2.length },
      });
    }

    return sections;
  }

  /**
   * Génère un narratif complet structuré
   */
  public generateFullNarrative(context: NarrativeContext): NarrativeSection[] {
    const sections: NarrativeSection[] = [];

    // Résumé exécutif
    const summary = this.generateExecutiveSummary(context);
    sections.push({
      id: 'executive-summary',
      title: summary.headline,
      content: summary.keyPoints.join('\n\n') + '\n\n**Conclusion**: ' + summary.bottomLine,
      level: 'header',
      icon: '📊',
      data: { confidence: summary.confidenceStatement },
    });

    // Modules
    const moduleNarratives = this.generateModuleNarratives(context);
    for (const mod of moduleNarratives) {
      sections.push({
        id: `module-${mod.module}`,
        title: `${this.getModuleIcon(mod.module)} ${this.getModuleLabel(mod.module)}`,
        content: mod.summary + (mod.details.length > 0 ? '\n\n' + mod.details.join('\n') : ''),
        level: mod.status === 'critical' ? 'critical' :
          mod.status === 'attention' ? 'warning' : 'body',
      });
    }

    // Patterns
    if (context.patterns && context.patterns.length > 0) {
      const patternSection = this.generatePatternNarrative(context.patterns);
      if (patternSection) sections.push(patternSection);
    }

    // Cascades
    if (context.cascades.length > 0) {
      const cascadeSection = this.generateCascadeNarrative(context.cascades);
      if (cascadeSection) sections.push(cascadeSection);
    }

    // Recommandations
    sections.push(...this.generateRecommendationsNarrative(context.actions));

    return sections;
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  private generateBudgetNarrative(context: NarrativeContext): ModuleNarrative {
    const { evm, predictions, actions } = context;

    let status: ModuleNarrative['status'] = 'healthy';
    let summary: string;
    const details: string[] = [];
    const recommendations: string[] = [];

    const deviation = Math.round((1 - evm.cpi) * 100);

    if (evm.cpi < 0.85) {
      status = 'critical';
      summary = TEMPLATES.budgetCritical
        .replace('{cpi}', evm.cpi.toFixed(2))
        .replace('{deviation}', deviation.toString())
        .replace('{eac}', this.formatAmount(evm.eac));
    } else if (evm.cpi < 0.95) {
      status = 'attention';
      summary = TEMPLATES.budgetWarning
        .replace('{cpi}', evm.cpi.toFixed(2))
        .replace('{deviation}', deviation.toString());
    } else {
      summary = TEMPLATES.budgetHealthy.replace('{cpi}', evm.cpi.toFixed(2));
    }

    // Détails
    details.push(`Interprétation EVM: ${evm.interpretation}`);
    if (evm.alerts.length > 0) {
      details.push(...evm.alerts);
    }

    // Recommandations depuis les actions
    const budgetActions = actions.filter(a => a.targetModule === 'budget');
    recommendations.push(...budgetActions.slice(0, 3).map(a => a.action));

    return { module: 'budget', status, summary, details, recommendations };
  }

  private generateScheduleNarrative(context: NarrativeContext): ModuleNarrative {
    const { state, predictions, actions } = context;
    const { joursRestants, actionsEnRetard, actionsCritiques } = state.currentMetrics;

    let status: ModuleNarrative['status'] = 'healthy';
    let summary: string;
    const details: string[] = [];
    const recommendations: string[] = [];

    // Trouver la prédiction de retard
    const delayPred = predictions.find(p =>
      p.type === 'schedule' && p.title.includes('jours')
    );
    const delay = delayPred
      ? parseInt(delayPred.title.match(/(\d+)\s*jours/)?.[1] || '0')
      : 0;

    if (delay > 30 || actionsCritiques > 5) {
      status = 'critical';
      summary = TEMPLATES.scheduleCritical.replace('{delay}', delay.toString());
    } else if (actionsEnRetard > 10 || delay > 7) {
      status = 'attention';
      summary = TEMPLATES.scheduleWarning
        .replace('{lateActions}', actionsEnRetard.toString())
        .replace('{criticalActions}', actionsCritiques.toString());
    } else {
      summary = TEMPLATES.scheduleOnTrack
        .replace('{remaining}', joursRestants.toString())
        .replace('{lateActions}', actionsEnRetard.toString());
    }

    // Détails
    if (delay > 0) {
      details.push(`Date de fin projetée: +${delay} jours`);
    }
    details.push(`Actions critiques: ${actionsCritiques}`);

    // Recommandations
    const scheduleActions = actions.filter(a => a.targetModule === 'planning');
    recommendations.push(...scheduleActions.slice(0, 3).map(a => a.action));

    return { module: 'planning', status, summary, details, recommendations };
  }

  private generateCommercialNarrative(context: NarrativeContext): ModuleNarrative {
    const { state, actions } = context;
    const { tauxOccupation, joursRestants, nombreBaux, nombreLots } = state.currentMetrics;
    const anchorSigned = state.anchorTenant?.signed ?? false;

    let status: ModuleNarrative['status'] = 'healthy';
    let summary: string;
    const details: string[] = [];
    const recommendations: string[] = [];

    if (tauxOccupation < 50 || (!anchorSigned && joursRestants < 180)) {
      status = 'critical';
      summary = TEMPLATES.commercialCritical
        .replace('{occupancy}', tauxOccupation.toFixed(0));
    } else if (tauxOccupation < 70) {
      status = 'attention';
      summary = TEMPLATES.commercialWarning
        .replace('{occupancy}', tauxOccupation.toFixed(0))
        .replace('{remaining}', joursRestants.toString());
    } else if (anchorSigned) {
      summary = TEMPLATES.commercialExcellent
        .replace('{occupancy}', tauxOccupation.toFixed(0));
    } else {
      summary = TEMPLATES.commercialGood
        .replace('{occupancy}', tauxOccupation.toFixed(0))
        .replace('{gap}', (80 - tauxOccupation).toFixed(0));
    }

    // Détails
    details.push(`Baux signés: ${nombreBaux}/${nombreLots}`);
    details.push(`Locataire ancre: ${anchorSigned ? 'Signé ✓' : 'Non signé ⚠️'}`);

    // Recommandations
    const commercialActions = actions.filter(a => a.targetModule === 'commercialisation');
    recommendations.push(...commercialActions.slice(0, 3).map(a => a.action));

    return { module: 'commercialisation', status, summary, details, recommendations };
  }

  private generateRiskNarrative(context: NarrativeContext): ModuleNarrative {
    const { predictions, anomalies, cascades } = context;

    const criticalCount = predictions.filter(p => p.impact === 'critical').length +
      anomalies.filter(a => a.severity === 'critical').length;
    const cascadeCount = cascades.length;

    let status: ModuleNarrative['status'] = 'healthy';
    let summary: string;
    const details: string[] = [];

    if (criticalCount > 2 || cascadeCount > 3) {
      status = 'critical';
      summary = `${criticalCount} risque(s) critique(s) et ${cascadeCount} effet(s) cascade détecté(s). Attention maximale requise.`;
    } else if (criticalCount > 0 || cascadeCount > 0) {
      status = 'attention';
      summary = `${criticalCount} risque(s) significatif(s) identifié(s). Vigilance recommandée.`;
    } else {
      summary = 'Aucun risque critique détecté. Situation normale.';
    }

    // Détails
    if (anomalies.length > 0) {
      details.push(`${anomalies.length} anomalie(s) détectée(s)`);
    }
    if (predictions.length > 0) {
      details.push(`${predictions.length} prédiction(s) active(s)`);
    }

    return { module: 'risques', status, summary, details, recommendations: [] };
  }

  private calculateAverageConfidence(predictions: Prediction[]): number {
    if (predictions.length === 0) return 70;
    const sum = predictions.reduce((acc, p) => acc + p.confidence.value, 0);
    return Math.round(sum / predictions.length);
  }

  private getConfidenceLabel(score: number): string {
    if (score >= 80) return 'Élevé';
    if (score >= 60) return 'Modéré';
    return 'Faible';
  }

  private getModuleIcon(module: string): string {
    switch (module) {
      case 'budget': return '💰';
      case 'planning': return '📅';
      case 'commercialisation': return '🏪';
      case 'risques': return '⚡';
      default: return '📋';
    }
  }

  private getModuleLabel(module: string): string {
    switch (module) {
      case 'budget': return 'Budget & Coûts';
      case 'planning': return 'Planning & Délais';
      case 'commercialisation': return 'Commercialisation';
      case 'risques': return 'Risques & Alertes';
      default: return module;
    }
  }

  private formatAmount(amount: number): string {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} Md`;
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)} M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} k`;
    return amount.toFixed(0);
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default InsightNarrator;
