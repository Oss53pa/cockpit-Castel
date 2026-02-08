// ============================================================================
// PROPH3T ENGINE V2 — PRÉDICTEUR DE RISQUES
// ============================================================================
// Prédiction de risques avec scoring de confiance
// ============================================================================

import type {
  Prediction,
  PredictionType,
  ImpactLevel,
  TrendDirection,
  TimeHorizon,
  ConfidenceScore,
  PrescriptiveAction,
  ProjectState,
  ProjectMetrics,
} from '../core/types';
import { getConfidenceLevel, IMPACT_THRESHOLDS } from '../core/constants';

// ============================================================================
// TYPES INTERNES
// ============================================================================

interface RiskIndicator {
  id: string;
  name: string;
  evaluate: (state: ProjectState) => RiskEvaluation | null;
  category: 'budget' | 'planning' | 'commercial' | 'technique' | 'rh';
}

interface RiskEvaluation {
  probability: number;
  impact: ImpactLevel;
  title: string;
  description: string;
  triggerConditions: string[];
  timeHorizon: TimeHorizon;
  trend: TrendDirection;
  mitigationSuggestions: string[];
  confidenceFactors: string[];
  dataQuality: number;
}

// ============================================================================
// INDICATEURS DE RISQUES
// ============================================================================

const RISK_INDICATORS: RiskIndicator[] = [
  // ==================== BUDGET ====================
  {
    id: 'risk-budget-overrun',
    name: 'Dépassement budgétaire',
    category: 'budget',
    evaluate: (state) => {
      const { tauxEngagement, tauxRealisation, budgetEngage, budgetTotal } = state.currentMetrics;

      // Risque si engagement > réalisation de plus de 20 points
      const ecart = tauxEngagement - tauxRealisation;
      if (ecart < 20) return null;

      const probability = Math.min(95, 40 + ecart);
      return {
        probability,
        impact: ecart > 40 ? 'critical' : ecart > 30 ? 'high' : 'medium',
        title: 'Risque de dépassement budgétaire',
        description: `L'écart entre engagement (${tauxEngagement.toFixed(0)}%) et réalisation (${tauxRealisation.toFixed(0)}%) atteint ${ecart.toFixed(0)} points, signalant un risque de surcoût.`,
        triggerConditions: [
          `Écart engagement/réalisation > 20 points`,
          `Taux d'engagement élevé (${tauxEngagement.toFixed(0)}%)`,
        ],
        timeHorizon: '30d',
        trend: ecart > 30 ? 'deteriorating' : 'stable',
        mitigationSuggestions: [
          'Auditer les engagements non réalisés',
          'Négocier les conditions de paiement',
          'Identifier les postes à risque de dépassement',
        ],
        confidenceFactors: ['Basé sur écart engagement/réalisation'],
        dataQuality: 85,
      };
    },
  },
  {
    id: 'risk-budget-underspend',
    name: 'Sous-consommation budgétaire',
    category: 'budget',
    evaluate: (state) => {
      const { tauxEngagement, joursRestants } = state.currentMetrics;
      const avancementAttendu = Math.max(0, 100 - (joursRestants / 365) * 100);

      // Risque si engagement très en dessous de l'avancement attendu
      if (tauxEngagement >= avancementAttendu - 15) return null;

      const ecart = avancementAttendu - tauxEngagement;
      const probability = Math.min(90, 30 + ecart);

      return {
        probability,
        impact: ecart > 30 ? 'high' : 'medium',
        title: 'Sous-engagement budgétaire',
        description: `Le taux d'engagement (${tauxEngagement.toFixed(0)}%) est en retard de ${ecart.toFixed(0)} points par rapport à l'avancement attendu.`,
        triggerConditions: [
          `Engagement < avancement attendu de ${ecart.toFixed(0)} pts`,
          'Risque de blocage des travaux',
        ],
        timeHorizon: '30d',
        trend: 'deteriorating',
        mitigationSuggestions: [
          'Accélérer les procédures d\'engagement',
          'Débloquer les validations en attente',
          'Anticiper les commandes critiques',
        ],
        confidenceFactors: ['Comparaison avancement vs engagement'],
        dataQuality: 80,
      };
    },
  },

  // ==================== PLANNING ====================
  {
    id: 'risk-schedule-delay',
    name: 'Retard planning',
    category: 'planning',
    evaluate: (state) => {
      const { actionsEnRetard, actionsTotal, joursRestants } = state.currentMetrics;

      if (actionsTotal === 0) return null;
      const tauxRetard = (actionsEnRetard / actionsTotal) * 100;

      if (tauxRetard < 10) return null;

      const probability = Math.min(95, 20 + tauxRetard * 2);
      const urgencyFactor = joursRestants < 90 ? 1.5 : 1;

      return {
        probability: Math.min(95, probability * urgencyFactor),
        impact: tauxRetard > 25 ? 'critical' : tauxRetard > 15 ? 'high' : 'medium',
        title: 'Accumulation de retards',
        description: `${actionsEnRetard} actions en retard sur ${actionsTotal} (${tauxRetard.toFixed(0)}%). Risque d'impact sur la date d'ouverture.`,
        triggerConditions: [
          `${actionsEnRetard} actions en retard`,
          `Taux de retard: ${tauxRetard.toFixed(0)}%`,
          joursRestants < 90 ? 'Moins de 90 jours avant ouverture' : '',
        ].filter(Boolean),
        timeHorizon: joursRestants < 60 ? '7d' : '30d',
        trend: tauxRetard > 20 ? 'deteriorating' : 'stable',
        mitigationSuggestions: [
          'Prioriser les actions critiques',
          'Réaffecter les ressources',
          'Organiser des réunions de déblocage quotidiennes',
        ],
        confidenceFactors: ['Basé sur taux de retard des actions'],
        dataQuality: 90,
      };
    },
  },
  {
    id: 'risk-critical-path',
    name: 'Chemin critique menacé',
    category: 'planning',
    evaluate: (state) => {
      const { actionsCritiques, joursRestants } = state.currentMetrics;

      if (actionsCritiques < 3) return null;

      const probability = Math.min(90, 30 + actionsCritiques * 10);

      return {
        probability,
        impact: actionsCritiques > 5 ? 'critical' : 'high',
        title: 'Chemin critique sous tension',
        description: `${actionsCritiques} actions critiques identifiées. Tout retard sur ces actions impactera directement la date d'ouverture.`,
        triggerConditions: [
          `${actionsCritiques} actions sur le chemin critique`,
          `${joursRestants} jours avant ouverture`,
        ],
        timeHorizon: '7d',
        trend: 'deteriorating',
        mitigationSuggestions: [
          'Focus total sur les actions critiques',
          'Assigner les meilleurs ressources',
          'Prévoir des plans B pour chaque action',
        ],
        confidenceFactors: ['Analyse du chemin critique'],
        dataQuality: 85,
      };
    },
  },

  // ==================== COMMERCIAL ====================
  {
    id: 'risk-occupancy-shortfall',
    name: 'Taux d\'occupation insuffisant',
    category: 'commercial',
    evaluate: (state) => {
      const { tauxOccupation, joursRestants } = state.currentMetrics;

      // Objectif: 80% à l'ouverture, courbe linéaire attendue
      const objectifActuel = Math.min(80, Math.max(0, 80 - (joursRestants / 365) * 80));
      const ecart = objectifActuel - tauxOccupation;

      if (ecart < 10) return null;

      const probability = Math.min(90, 25 + ecart * 2);

      return {
        probability,
        impact: ecart > 25 ? 'critical' : ecart > 15 ? 'high' : 'medium',
        title: 'Taux d\'occupation en dessous de la trajectoire',
        description: `Taux actuel (${tauxOccupation.toFixed(0)}%) en retard de ${ecart.toFixed(0)} pts par rapport à l'objectif (${objectifActuel.toFixed(0)}%).`,
        triggerConditions: [
          `Occupation: ${tauxOccupation.toFixed(0)}%`,
          `Objectif: ${objectifActuel.toFixed(0)}%`,
          `Écart: ${ecart.toFixed(0)} points`,
        ],
        timeHorizon: '60d',
        trend: ecart > 20 ? 'deteriorating' : 'stable',
        mitigationSuggestions: [
          'Intensifier la prospection',
          'Réviser les conditions commerciales',
          'Accélérer les négociations en cours',
          'Proposer des incitations temporaires',
        ],
        confidenceFactors: ['Projection linéaire vers objectif 80%'],
        dataQuality: 75,
      };
    },
  },
  {
    id: 'risk-anchor-delay',
    name: 'Retard locataire ancre',
    category: 'commercial',
    evaluate: (state) => {
      const { joursRestants } = state.currentMetrics;
      const anchorSigned = state.anchorTenant?.signed ?? false;

      // Si ancre signé, pas de risque
      if (anchorSigned) return null;

      // Risque croissant si pas signé et < 9 mois avant ouverture
      if (joursRestants > 270) return null; // Plus de 9 mois

      const moisRestants = joursRestants / 30;
      const probability = Math.min(90, 100 - moisRestants * 10);

      return {
        probability,
        impact: moisRestants < 3 ? 'critical' : moisRestants < 6 ? 'high' : 'medium',
        title: 'Locataire ancre non signé',
        description: `Le bail du locataire ancre n'est pas signé à ${moisRestants.toFixed(0)} mois de l'ouverture. Risque majeur pour l'attractivité du centre.`,
        triggerConditions: [
          'Bail ancre non signé',
          `${moisRestants.toFixed(0)} mois avant ouverture`,
        ],
        timeHorizon: '90d',
        trend: 'deteriorating',
        mitigationSuggestions: [
          'Prioriser la négociation avec l\'ancre',
          'Préparer des alternatives (plan B)',
          'Évaluer l\'impact sur les autres locataires',
        ],
        confidenceFactors: ['Statut signature locataire ancre'],
        dataQuality: 95,
      };
    },
  },

  // ==================== TECHNIQUE ====================
  {
    id: 'risk-sync-desync',
    name: 'Désynchronisation CC/Mobilisation',
    category: 'technique',
    evaluate: (state) => {
      const { ecartSync, avancementConstruction, avancementMobilisation } = state.currentMetrics;

      if (Math.abs(ecartSync) < 15) return null;

      const probability = Math.min(85, 30 + Math.abs(ecartSync) * 2);
      const direction = ecartSync > 0 ? 'construction en avance' : 'mobilisation en avance';

      return {
        probability,
        impact: Math.abs(ecartSync) > 25 ? 'high' : 'medium',
        title: 'Désynchronisation Construction/Mobilisation',
        description: `Écart de ${Math.abs(ecartSync).toFixed(0)} points (${direction}). Construction: ${avancementConstruction.toFixed(0)}%, Mobilisation: ${avancementMobilisation.toFixed(0)}%.`,
        triggerConditions: [
          `Écart sync: ${ecartSync.toFixed(0)} pts`,
          direction,
        ],
        timeHorizon: '30d',
        trend: Math.abs(ecartSync) > 20 ? 'deteriorating' : 'stable',
        mitigationSuggestions: ecartSync > 0
          ? ['Accélérer les actions de mobilisation', 'Sécuriser les signatures en attente']
          : ['Débloquer les points techniques', 'Accélérer le chantier'],
        confidenceFactors: ['Calcul écart CC/Mobilisation'],
        dataQuality: 90,
      };
    },
  },

  // ==================== RH ====================
  {
    id: 'risk-understaffing',
    name: 'Sous-effectif',
    category: 'rh',
    evaluate: (state) => {
      const { effectifActuel, effectifCible, tauxRecrutement, joursRestants } = state.currentMetrics;

      if (effectifCible === 0) return null;

      const ecart = ((effectifCible - effectifActuel) / effectifCible) * 100;
      if (ecart < 20) return null;

      const moisRestants = joursRestants / 30;
      const probability = Math.min(85, ecart + (moisRestants < 6 ? 20 : 0));

      return {
        probability,
        impact: ecart > 40 ? 'high' : 'medium',
        title: 'Sous-effectif pour l\'ouverture',
        description: `Effectif actuel (${effectifActuel}) à ${(100 - ecart).toFixed(0)}% de la cible (${effectifCible}). Taux de recrutement: ${tauxRecrutement.toFixed(0)}%.`,
        triggerConditions: [
          `Effectif: ${effectifActuel}/${effectifCible}`,
          `${ecart.toFixed(0)}% de postes à pourvoir`,
        ],
        timeHorizon: '90d',
        trend: tauxRecrutement < 50 ? 'deteriorating' : 'stable',
        mitigationSuggestions: [
          'Intensifier le recrutement',
          'Faire appel à l\'intérim',
          'Prioriser les postes critiques',
          'Prévoir des formations accélérées',
        ],
        confidenceFactors: ['Ratio effectif actuel/cible'],
        dataQuality: 85,
      };
    },
  },
];

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class RiskPredictor {
  private previousPredictions: Prediction[] = [];

  /**
   * Génère les prédictions de risques
   */
  public predict(state: ProjectState): Prediction[] {
    const predictions: Prediction[] = [];
    const now = new Date();

    for (const indicator of RISK_INDICATORS) {
      const evaluation = indicator.evaluate(state);

      if (evaluation && evaluation.probability >= 20) {
        const prediction = this.createPrediction(
          indicator,
          evaluation,
          state,
          now
        );
        predictions.push(prediction);
      }
    }

    // Trier par score de risque (probabilité × impact)
    predictions.sort((a, b) => {
      const scoreA = a.probability * this.getImpactWeight(a.impact);
      const scoreB = b.probability * this.getImpactWeight(b.impact);
      return scoreB - scoreA;
    });

    // Calculer les tendances par rapport aux prédictions précédentes
    this.updateTrends(predictions);
    this.previousPredictions = predictions;

    return predictions;
  }

  /**
   * Crée une prédiction à partir d'une évaluation
   */
  private createPrediction(
    indicator: RiskIndicator,
    evaluation: RiskEvaluation,
    state: ProjectState,
    now: Date
  ): Prediction {
    const confidence = this.calculateConfidence(evaluation, state);

    return {
      id: `${indicator.id}-${now.getTime()}`,
      type: 'risk' as PredictionType,
      title: evaluation.title,
      description: evaluation.description,
      probability: Math.round(evaluation.probability),
      impact: evaluation.impact,
      confidence,
      timeHorizon: evaluation.timeHorizon,
      triggerConditions: evaluation.triggerConditions,
      mitigationActions: this.generateMitigationActions(
        indicator,
        evaluation,
        confidence
      ),
      trend: evaluation.trend,
      historicalBasis: this.findHistoricalBasis(indicator.id),
      createdAt: now,
      sourceModule: this.categoryToModule(indicator.category),
    };
  }

  /**
   * Calcule le score de confiance
   */
  private calculateConfidence(
    evaluation: RiskEvaluation,
    state: ProjectState
  ): ConfidenceScore {
    let score = evaluation.dataQuality;

    // Bonus si beaucoup de données historiques
    if (state.historicalMetrics.length >= 30) score += 10;
    else if (state.historicalMetrics.length >= 14) score += 5;

    // Bonus si probabilité très haute ou très basse (plus certain)
    if (evaluation.probability > 80 || evaluation.probability < 30) {
      score += 5;
    }

    score = Math.min(100, score);

    return {
      value: score,
      level: getConfidenceLevel(score),
      factors: evaluation.confidenceFactors,
      dataQuality: evaluation.dataQuality,
    };
  }

  /**
   * Génère les actions de mitigation
   */
  private generateMitigationActions(
    indicator: RiskIndicator,
    evaluation: RiskEvaluation,
    confidence: ConfidenceScore
  ): PrescriptiveAction[] {
    return evaluation.mitigationSuggestions.map((suggestion, index) => ({
      id: `action-${indicator.id}-${index}`,
      action: suggestion,
      rationale: `Mitigation pour: ${evaluation.title}`,
      expectedOutcome: 'Réduction de la probabilité ou de l\'impact du risque',
      costOfInaction: evaluation.impact === 'critical'
        ? 'Risque majeur de matérialisation avec impact critique'
        : 'Aggravation probable du risque',
      priority: index === 0 ? (evaluation.impact === 'critical' ? 'P0' : 'P1') : 'P2',
      effort: index === 0 ? 'medium' : 'low',
      confidence: {
        ...confidence,
        value: Math.max(50, confidence.value - 10),
        level: getConfidenceLevel(Math.max(50, confidence.value - 10)),
      },
      targetModule: this.categoryToModule(indicator.category),
      tags: ['mitigation', indicator.category],
    }));
  }

  /**
   * Met à jour les tendances en comparant avec les prédictions précédentes
   */
  private updateTrends(predictions: Prediction[]): void {
    for (const pred of predictions) {
      const previous = this.previousPredictions.find(
        p => p.id.split('-').slice(0, -1).join('-') === pred.id.split('-').slice(0, -1).join('-')
      );

      if (previous) {
        if (pred.probability > previous.probability + 5) {
          pred.trend = 'deteriorating';
        } else if (pred.probability < previous.probability - 5) {
          pred.trend = 'improving';
        }
      }
    }
  }

  /**
   * Trouve une base historique pour le risque
   */
  private findHistoricalBasis(indicatorId: string): string | undefined {
    // Pour l'instant, retourne des références statiques
    const historicalRefs: Record<string, string> = {
      'risk-budget-overrun': 'Projet Mall Dakar 2023: +18% dépassement',
      'risk-schedule-delay': 'Tendance sectorielle: 15% de retard moyen',
      'risk-occupancy-shortfall': 'Benchmark régional: 72% occupation moyenne à l\'ouverture',
    };
    return historicalRefs[indicatorId];
  }

  private getImpactWeight(impact: ImpactLevel): number {
    switch (impact) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
    }
  }

  private categoryToModule(category: string): any {
    const mapping: Record<string, string> = {
      budget: 'budget',
      planning: 'planning',
      commercial: 'commercialisation',
      technique: 'technique',
      rh: 'rh',
    };
    return mapping[category] || 'technique';
  }

  /**
   * Retourne les risques critiques
   */
  public getCriticalRisks(predictions: Prediction[]): Prediction[] {
    return predictions.filter(p => p.impact === 'critical' && p.probability >= 60);
  }

  /**
   * Retourne les risques en dégradation
   */
  public getDeterioratingRisks(predictions: Prediction[]): Prediction[] {
    return predictions.filter(p => p.trend === 'deteriorating');
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default RiskPredictor;
