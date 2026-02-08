// ============================================================================
// PROPH3T ENGINE V2 — TALKING POINTS GENERATOR
// Génère des points de discussion adaptés à l'audience
// ============================================================================

import type { Action, Jalon, Risque } from '../../../types';
import type { Alert } from '../reporters/alertManager';

// ============================================================================
// TYPES
// ============================================================================

export type Audience = 'executive' | 'management' | 'technical' | 'operational' | 'stakeholder';
export type CommunicationTone = 'formal' | 'concise' | 'detailed' | 'actionable';

export interface TalkingPointConfig {
  audience: Audience;
  tone: CommunicationTone;
  maxPoints: number;
  includeMetrics: boolean;
  includeRecommendations: boolean;
  language: 'fr' | 'en';
}

export interface GeneratedTalkingPoint {
  id: string;
  order: number;
  headline: string;
  detail: string;
  metrics?: Array<{ label: string; value: string }>;
  recommendation?: string;
  references: string[];
  urgency: 'immediate' | 'this_week' | 'this_month' | 'informational';
  tags: string[];
}

export interface TalkingPointsOutput {
  generatedAt: Date;
  audience: Audience;
  points: GeneratedTalkingPoint[];
  summary: string;
  keyMessage: string;
}

// ============================================================================
// AUDIENCE PROFILES
// ============================================================================

const AUDIENCE_PROFILES: Record<Audience, {
  focusAreas: string[];
  detailLevel: 'high' | 'medium' | 'low';
  metricsPreference: string[];
  avoidTopics: string[];
}> = {
  executive: {
    focusAreas: ['budget', 'timeline', 'risks', 'strategic_impact'],
    detailLevel: 'low',
    metricsPreference: ['CPI', 'SPI', 'ROI', 'budget_variance'],
    avoidTopics: ['technical_details', 'operational_minutiae'],
  },
  management: {
    focusAreas: ['progress', 'blockers', 'resources', 'risks', 'decisions'],
    detailLevel: 'medium',
    metricsPreference: ['completion_rate', 'velocity', 'resource_utilization'],
    avoidTopics: ['implementation_details'],
  },
  technical: {
    focusAreas: ['technical_issues', 'architecture', 'quality', 'dependencies'],
    detailLevel: 'high',
    metricsPreference: ['defect_rate', 'test_coverage', 'performance_metrics'],
    avoidTopics: ['budget_details', 'stakeholder_politics'],
  },
  operational: {
    focusAreas: ['tasks', 'deadlines', 'blockers', 'coordination'],
    detailLevel: 'high',
    metricsPreference: ['tasks_completed', 'tasks_remaining', 'daily_velocity'],
    avoidTopics: ['strategic_discussions', 'budget'],
  },
  stakeholder: {
    focusAreas: ['value_delivery', 'timeline', 'quality', 'communication'],
    detailLevel: 'low',
    metricsPreference: ['milestone_completion', 'quality_score', 'satisfaction'],
    avoidTopics: ['internal_issues', 'technical_details', 'budget_breakdown'],
  },
};

// ============================================================================
// TALKING POINTS GENERATOR
// ============================================================================

export class TalkingPointsGenerator {
  private config: TalkingPointConfig;

  constructor(config: Partial<TalkingPointConfig> = {}) {
    this.config = {
      audience: 'management',
      tone: 'concise',
      maxPoints: 5,
      includeMetrics: true,
      includeRecommendations: true,
      language: 'fr',
      ...config,
    };
  }

  // ---------------------------------------------------------------------------
  // GÉNÉRATION
  // ---------------------------------------------------------------------------

  generate(data: {
    actions: Action[];
    jalons: Jalon[];
    risques: Risque[];
    alerts: Alert[];
    projectMetrics?: Record<string, number>;
  }): TalkingPointsOutput {
    const profile = AUDIENCE_PROFILES[this.config.audience];
    const points: GeneratedTalkingPoint[] = [];
    let order = 0;

    // 1. Points sur le planning/timeline
    if (profile.focusAreas.includes('timeline') || profile.focusAreas.includes('progress')) {
      const timelinePoint = this.generateTimelinePoint(data.jalons, data.actions, profile);
      if (timelinePoint) {
        points.push({ ...timelinePoint, order: ++order });
      }
    }

    // 2. Points sur le budget (si pertinent pour l'audience)
    if (profile.focusAreas.includes('budget') && data.projectMetrics?.budgetConsumed !== undefined) {
      const budgetPoint = this.generateBudgetPoint(data.projectMetrics, profile);
      if (budgetPoint) {
        points.push({ ...budgetPoint, order: ++order });
      }
    }

    // 3. Points sur les risques
    if (profile.focusAreas.includes('risks')) {
      const riskPoint = this.generateRiskPoint(data.risques, profile);
      if (riskPoint) {
        points.push({ ...riskPoint, order: ++order });
      }
    }

    // 4. Points sur les blocages
    if (profile.focusAreas.includes('blockers') || profile.focusAreas.includes('technical_issues')) {
      const blockerPoint = this.generateBlockerPoint(data.actions, data.alerts, profile);
      if (blockerPoint) {
        points.push({ ...blockerPoint, order: ++order });
      }
    }

    // 5. Points sur les décisions à prendre
    if (profile.focusAreas.includes('decisions')) {
      const decisionPoint = this.generateDecisionPoint(data, profile);
      if (decisionPoint) {
        points.push({ ...decisionPoint, order: ++order });
      }
    }

    // Limiter au nombre max configuré
    const finalPoints = points.slice(0, this.config.maxPoints);

    // Générer le message clé et le résumé
    const keyMessage = this.generateKeyMessage(finalPoints, data);
    const summary = this.generateSummary(finalPoints);

    return {
      generatedAt: new Date(),
      audience: this.config.audience,
      points: finalPoints,
      summary,
      keyMessage,
    };
  }

  private generateTimelinePoint(
    jalons: Jalon[],
    actions: Action[],
    profile: typeof AUDIENCE_PROFILES['executive']
  ): Omit<GeneratedTalkingPoint, 'order'> | null {
    const now = new Date();
    const upcomingJalons = jalons.filter(j =>
      j.statut !== 'termine' && j.date_prevue &&
      new Date(j.date_prevue) < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    );

    const completedActions = actions.filter(a => a.statut === 'termine').length;
    const totalActions = actions.length;
    const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

    const overdueActions = actions.filter(a =>
      a.statut !== 'termine' && a.date_prevue && new Date(a.date_prevue) < now
    ).length;

    let headline: string;
    let detail: string;
    let urgency: GeneratedTalkingPoint['urgency'];

    if (overdueActions > totalActions * 0.15) {
      headline = `Alerte planning: ${overdueActions} actions en retard`;
      detail = `${completionRate}% des actions sont terminées. ${overdueActions} actions dépassent leur échéance, impactant potentiellement les jalons à venir.`;
      urgency = 'immediate';
    } else if (upcomingJalons.length > 0) {
      headline = `${upcomingJalons.length} jalon(s) à venir dans les 30 jours`;
      detail = `Avancement global: ${completionRate}%. Prochains jalons: ${upcomingJalons.slice(0, 2).map(j => j.nom).join(', ')}.`;
      urgency = 'this_month';
    } else {
      headline = `Avancement du projet: ${completionRate}%`;
      detail = `${completedActions} actions terminées sur ${totalActions}. Planning sous contrôle.`;
      urgency = 'informational';
    }

    const metrics = this.config.includeMetrics ? [
      { label: 'Avancement', value: `${completionRate}%` },
      { label: 'Actions en retard', value: `${overdueActions}` },
    ] : undefined;

    return {
      id: 'tp-timeline',
      headline,
      detail,
      metrics,
      recommendation: overdueActions > 0 ? 'Prioriser la résolution des actions en retard' : undefined,
      references: upcomingJalons.map(j => j.id_jalon),
      urgency,
      tags: ['planning', 'avancement'],
    };
  }

  private generateBudgetPoint(
    metrics: Record<string, number>,
    profile: typeof AUDIENCE_PROFILES['executive']
  ): Omit<GeneratedTalkingPoint, 'order'> | null {
    const cpi = metrics.cpi;
    const budgetConsumed = metrics.budgetConsumed || 0;

    if (cpi === undefined) return null;

    let headline: string;
    let detail: string;
    let urgency: GeneratedTalkingPoint['urgency'];

    if (cpi < 0.9) {
      headline = `Alerte budget: CPI à ${cpi.toFixed(2)}`;
      detail = `Indice de performance des coûts inférieur au seuil d'alerte. Révision budgétaire recommandée.`;
      urgency = 'immediate';
    } else if (cpi < 0.95) {
      headline = `Budget sous surveillance: CPI à ${cpi.toFixed(2)}`;
      detail = `Performance budgétaire légèrement en dessous des prévisions. Suivi rapproché conseillé.`;
      urgency = 'this_week';
    } else {
      headline = `Budget maîtrisé: CPI à ${cpi.toFixed(2)}`;
      detail = `La consommation budgétaire est conforme aux prévisions.`;
      urgency = 'informational';
    }

    return {
      id: 'tp-budget',
      headline,
      detail,
      metrics: this.config.includeMetrics ? [
        { label: 'CPI', value: cpi.toFixed(2) },
        { label: 'Consommé', value: `${Math.round(budgetConsumed)}%` },
      ] : undefined,
      recommendation: cpi < 0.95 ? 'Analyser les écarts et identifier les optimisations possibles' : undefined,
      references: [],
      urgency,
      tags: ['budget', 'finance'],
    };
  }

  private generateRiskPoint(
    risques: Risque[],
    profile: typeof AUDIENCE_PROFILES['executive']
  ): Omit<GeneratedTalkingPoint, 'order'> | null {
    const activeRisks = risques.filter(r => r.statut === 'actif');
    const criticalRisks = activeRisks.filter(r => r.criticite && r.criticite >= 15);
    const highRisks = activeRisks.filter(r => r.criticite && r.criticite >= 9 && r.criticite < 15);

    if (activeRisks.length === 0) return null;

    let headline: string;
    let detail: string;
    let urgency: GeneratedTalkingPoint['urgency'];

    if (criticalRisks.length > 0) {
      headline = `${criticalRisks.length} risque(s) critique(s) actif(s)`;
      detail = `Risques nécessitant une attention immédiate: ${criticalRisks.slice(0, 2).map(r => r.description?.substring(0, 40)).join('; ')}...`;
      urgency = 'immediate';
    } else if (highRisks.length > 0) {
      headline = `${highRisks.length} risque(s) élevé(s) à surveiller`;
      detail = `Risques sous surveillance active. Plans de mitigation en place.`;
      urgency = 'this_week';
    } else {
      headline = `${activeRisks.length} risque(s) actif(s) sous contrôle`;
      detail = `Registre des risques à jour. Aucune escalade nécessaire.`;
      urgency = 'informational';
    }

    return {
      id: 'tp-risks',
      headline,
      detail,
      metrics: this.config.includeMetrics ? [
        { label: 'Risques critiques', value: `${criticalRisks.length}` },
        { label: 'Risques élevés', value: `${highRisks.length}` },
      ] : undefined,
      recommendation: criticalRisks.length > 0 ? 'Valider les plans de mitigation en comité' : undefined,
      references: [...criticalRisks, ...highRisks].map(r => r.id_risque),
      urgency,
      tags: ['risques', 'mitigation'],
    };
  }

  private generateBlockerPoint(
    actions: Action[],
    alerts: Alert[],
    profile: typeof AUDIENCE_PROFILES['executive']
  ): Omit<GeneratedTalkingPoint, 'order'> | null {
    const blockedActions = actions.filter(a => a.statut === 'bloque');
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'active');

    if (blockedActions.length === 0 && criticalAlerts.length === 0) return null;

    let headline: string;
    let detail: string;

    if (blockedActions.length > 0) {
      headline = `${blockedActions.length} point(s) de blocage identifié(s)`;
      detail = `Actions bloquées: ${blockedActions.slice(0, 3).map(a => a.nom).join(', ')}${blockedActions.length > 3 ? '...' : ''}`;
    } else {
      headline = `${criticalAlerts.length} alerte(s) critique(s) active(s)`;
      detail = `Alertes nécessitant une intervention: ${criticalAlerts.slice(0, 2).map(a => a.title).join(', ')}`;
    }

    return {
      id: 'tp-blockers',
      headline,
      detail,
      recommendation: 'Arbitrage nécessaire pour débloquer la situation',
      references: [...blockedActions.map(a => a.id_action), ...criticalAlerts.map(a => a.id)],
      urgency: 'immediate',
      tags: ['blocage', 'arbitrage'],
    };
  }

  private generateDecisionPoint(
    data: any,
    profile: typeof AUDIENCE_PROFILES['executive']
  ): Omit<GeneratedTalkingPoint, 'order'> | null {
    // Identifier les situations nécessitant des décisions
    const blockedActions = data.actions.filter((a: Action) => a.statut === 'bloque');
    const criticalRisks = data.risques.filter((r: Risque) => r.criticite && r.criticite >= 15);

    const decisionsNeeded = blockedActions.length + criticalRisks.length;

    if (decisionsNeeded === 0) return null;

    return {
      id: 'tp-decisions',
      headline: `${decisionsNeeded} décision(s) en attente`,
      detail: `Points nécessitant arbitrage ou validation pour permettre l'avancement du projet.`,
      recommendation: 'Prévoir un temps dédié aux décisions pendant la réunion',
      references: [],
      urgency: 'this_week',
      tags: ['décisions', 'arbitrage'],
    };
  }

  private generateKeyMessage(points: GeneratedTalkingPoint[], data: any): string {
    const immediatePoints = points.filter(p => p.urgency === 'immediate');

    if (immediatePoints.length > 0) {
      return `⚠️ ${immediatePoints.length} point(s) critique(s) nécessitant une attention immédiate`;
    }

    const completedActions = data.actions.filter((a: Action) => a.statut === 'termine').length;
    const totalActions = data.actions.length;
    const rate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

    if (rate >= 80) {
      return `✅ Projet en bonne voie - ${rate}% d'avancement`;
    } else if (rate >= 50) {
      return `📊 Avancement nominal - ${rate}% réalisé, suivi actif des risques`;
    } else {
      return `📋 Phase initiale - ${rate}% d'avancement, planning en cours de stabilisation`;
    }
  }

  private generateSummary(points: GeneratedTalkingPoint[]): string {
    if (points.length === 0) {
      return 'Aucun point particulier à remonter. Projet sous contrôle.';
    }

    const headlines = points.slice(0, 3).map(p => p.headline);
    return `Points clés: ${headlines.join(' | ')}`;
  }

  // ---------------------------------------------------------------------------
  // CONFIGURATION
  // ---------------------------------------------------------------------------

  setAudience(audience: Audience): void {
    this.config.audience = audience;
  }

  setConfig(config: Partial<TalkingPointConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export default TalkingPointsGenerator;
