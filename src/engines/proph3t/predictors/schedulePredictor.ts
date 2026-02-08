// ============================================================================
// PROPH3T ENGINE V2 — PRÉDICTEUR DE PLANNING
// ============================================================================
// Prévision des délais avec scoring de confiance
// ============================================================================

import type {
  Prediction,
  ConfidenceScore,
  ProjectState,
  ScheduleAnalysis,
  TrendDirection,
} from '../core/types';
import { getConfidenceLevel } from '../core/constants';

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class SchedulePredictor {
  /**
   * Génère les prédictions de planning
   */
  public predict(state: ProjectState): Prediction[] {
    const predictions: Prediction[] = [];
    const now = new Date();

    // Analyse du planning
    const analysis = this.analyzeSchedule(state);

    // Prédiction 1: Retard global
    if (analysis.delayAccumulated > 7) {
      predictions.push({
        id: `schedule-delay-${now.getTime()}`,
        type: 'schedule',
        title: `Retard cumulé de ${analysis.delayAccumulated} jours`,
        description: `Le projet accumule ${analysis.delayAccumulated} jours de retard. ${analysis.criticalActionsLate} actions critiques sont en retard.`,
        probability: Math.min(90, 50 + analysis.delayAccumulated),
        impact: analysis.delayAccumulated > 30 ? 'critical' : analysis.delayAccumulated > 14 ? 'high' : 'medium',
        confidence: this.calculateConfidence(state, analysis),
        timeHorizon: '30d',
        triggerConditions: [
          `Retard cumulé: ${analysis.delayAccumulated} jours`,
          `Actions critiques en retard: ${analysis.criticalActionsLate}`,
        ],
        mitigationActions: this.generateScheduleMitigations(analysis),
        trend: analysis.trend,
        createdAt: now,
        sourceModule: 'planning',
      });
    }

    // Prédiction 2: Date de fin projetée
    const softOpeningDate = new Date(state.dates.softOpening);
    const projectedDate = new Date(analysis.projectedEndDate);

    if (projectedDate > softOpeningDate) {
      const delayDays = Math.ceil((projectedDate.getTime() - softOpeningDate.getTime()) / (1000 * 60 * 60 * 24));

      predictions.push({
        id: `schedule-projection-${now.getTime()}`,
        type: 'schedule',
        title: `Ouverture projetée avec ${delayDays} jours de retard`,
        description: `La date de fin projetée est le ${this.formatDate(projectedDate)}, soit ${delayDays} jours après le soft opening prévu.`,
        probability: Math.min(85, 40 + delayDays / 2),
        impact: delayDays > 60 ? 'critical' : delayDays > 30 ? 'high' : 'medium',
        confidence: this.calculateConfidence(state, analysis),
        timeHorizon: '90d',
        triggerConditions: [
          `Date projetée: ${this.formatDate(projectedDate)}`,
          `Soft opening prévu: ${this.formatDate(softOpeningDate)}`,
        ],
        mitigationActions: [{
          id: 'schedule-acceleration',
          action: 'Élaborer un plan d\'accélération',
          rationale: `Récupérer ${delayDays} jours de retard`,
          expectedOutcome: 'Retour sur planning initial ou date révisée validée',
          costOfInaction: `Report de l'ouverture de ${delayDays} jours minimum`,
          priority: delayDays > 30 ? 'P0' : 'P1',
          effort: 'high',
          confidence: { value: 70, level: 'high', factors: [], dataQuality: 75 },
          targetModule: 'planning',
          tags: ['planning', 'accélération'],
        }],
        trend: analysis.trend,
        createdAt: now,
        sourceModule: 'planning',
      });
    }

    // Prédiction 3: Vélocité d'exécution
    const velocityPred = this.predictVelocity(state, analysis);
    if (velocityPred) {
      predictions.push({
        ...velocityPred,
        id: `schedule-velocity-${now.getTime()}`,
        createdAt: now,
      } as Prediction);
    }

    return predictions;
  }

  /**
   * Retourne l'analyse du planning
   */
  public getStatus(state: ProjectState): ScheduleAnalysis {
    return this.analyzeSchedule(state);
  }

  /**
   * Analyse le planning
   */
  private analyzeSchedule(state: ProjectState): ScheduleAnalysis {
    const {
      joursRestants,
      actionsEnRetard,
      actionsCritiques,
      avancementGlobal,
      actionsTotal,
      actionsTerminees,
    } = state.currentMetrics;

    // Calculer le retard accumulé (estimé)
    const avancementAttendu = Math.max(0, 100 - (joursRestants / 365) * 100);
    const ecartAvancement = avancementAttendu - avancementGlobal;
    const delayAccumulated = Math.max(0, Math.round(ecartAvancement * 3.65)); // Approximation

    // Calculer la date de fin projetée
    const today = new Date(state.dates.today);
    const targetDate = new Date(state.dates.softOpening);
    const joursInitiaux = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + delayAccumulated;

    const projectedEndDate = new Date(today);
    projectedEndDate.setDate(projectedEndDate.getDate() + joursInitiaux + delayAccumulated);

    // Déterminer la tendance
    let trend: TrendDirection = 'stable';
    if (state.historicalMetrics.length >= 7) {
      const recentRetards = state.historicalMetrics.slice(-7).map(m => m.actionsEnRetard);
      const avgRecent = recentRetards.reduce((a, b) => a + b, 0) / recentRetards.length;
      if (actionsEnRetard > avgRecent * 1.2) trend = 'deteriorating';
      else if (actionsEnRetard < avgRecent * 0.8) trend = 'improving';
    }

    // Alertes
    const alerts: string[] = [];
    if (actionsEnRetard > actionsTotal * 0.15) {
      alerts.push(`${Math.round((actionsEnRetard / actionsTotal) * 100)}% des actions en retard`);
    }
    if (actionsCritiques > 5) {
      alerts.push(`${actionsCritiques} actions sur chemin critique`);
    }
    if (delayAccumulated > 14) {
      alerts.push(`Retard cumulé: ${delayAccumulated} jours`);
    }

    return {
      daysRemaining: joursRestants,
      delayAccumulated,
      criticalPathActions: actionsCritiques,
      criticalActionsLate: Math.min(actionsCritiques, actionsEnRetard),
      projectedEndDate: projectedEndDate.toISOString().split('T')[0],
      trend,
      alerts,
    };
  }

  private calculateConfidence(state: ProjectState, analysis: ScheduleAnalysis): ConfidenceScore {
    let score = 70;

    // Plus d'historique = plus de confiance
    if (state.historicalMetrics.length >= 30) score += 15;
    else if (state.historicalMetrics.length >= 14) score += 8;

    // Moins d'actions en retard = plus de confiance dans la projection
    const tauxRetard = state.currentMetrics.actionsEnRetard / Math.max(1, state.currentMetrics.actionsTotal);
    if (tauxRetard < 0.1) score += 10;
    else if (tauxRetard > 0.25) score -= 10;

    score = Math.min(95, Math.max(40, score));

    return {
      value: score,
      level: getConfidenceLevel(score),
      factors: [
        `${state.historicalMetrics.length} points d'historique`,
        `Taux de retard: ${(tauxRetard * 100).toFixed(0)}%`,
      ],
      dataQuality: Math.min(90, 60 + state.historicalMetrics.length),
    };
  }

  private generateScheduleMitigations(analysis: ScheduleAnalysis): any[] {
    const actions = [];

    if (analysis.criticalActionsLate > 0) {
      actions.push({
        id: 'critical-focus',
        action: 'Focus quotidien sur les actions critiques en retard',
        rationale: `${analysis.criticalActionsLate} actions critiques bloquent le chemin critique`,
        expectedOutcome: 'Déblocage des actions critiques sous 48h',
        costOfInaction: `Chaque jour de retard sur le chemin critique = 1 jour de retard ouverture`,
        priority: 'P0',
        effort: 'high',
        confidence: { value: 85, level: 'very_high', factors: [], dataQuality: 90 },
        targetModule: 'planning',
        tags: ['planning', 'critique'],
      });
    }

    if (analysis.delayAccumulated > 14) {
      actions.push({
        id: 'parallel-tracks',
        action: 'Paralléliser les tâches séquentielles',
        rationale: `Récupérer ${analysis.delayAccumulated} jours de retard`,
        expectedOutcome: 'Réduction du retard de 30-50%',
        costOfInaction: 'Retard incompressible si pas d\'action',
        priority: 'P1',
        effort: 'high',
        confidence: { value: 70, level: 'high', factors: [], dataQuality: 75 },
        targetModule: 'planning',
        tags: ['planning', 'accélération'],
      });
    }

    actions.push({
      id: 'weekly-review',
      action: 'Instituer une revue planning hebdomadaire',
      rationale: 'Détecter les dérives au plus tôt',
      expectedOutcome: 'Anticipation des retards et actions correctives rapides',
      costOfInaction: 'Accumulation silencieuse des retards',
      priority: 'P2',
      effort: 'low',
      confidence: { value: 80, level: 'high', factors: [], dataQuality: 85 },
      targetModule: 'planning',
      tags: ['planning', 'gouvernance'],
    });

    return actions;
  }

  private predictVelocity(state: ProjectState, analysis: ScheduleAnalysis): Partial<Prediction> | null {
    if (state.historicalMetrics.length < 7) return null;

    // Calculer la vélocité (actions terminées par semaine)
    const recentMetrics = state.historicalMetrics.slice(-7);
    const actionsCompletedRecently = state.currentMetrics.actionsTerminees -
      (recentMetrics[0]?.actionsTerminees || 0);

    const weeklyVelocity = actionsCompletedRecently;
    const actionsRestantes = state.currentMetrics.actionsTotal - state.currentMetrics.actionsTerminees;
    const semainesNecessaires = weeklyVelocity > 0 ? actionsRestantes / weeklyVelocity : Infinity;
    const semainesDisponibles = analysis.daysRemaining / 7;

    if (semainesNecessaires <= semainesDisponibles * 1.1) return null;

    const deficit = Math.ceil((semainesNecessaires - semainesDisponibles) * weeklyVelocity);

    return {
      type: 'schedule',
      title: `Vélocité insuffisante: ${deficit} actions à risque`,
      description: `À la vélocité actuelle (${weeklyVelocity} actions/semaine), il faudrait ${semainesNecessaires.toFixed(0)} semaines pour terminer. Seulement ${semainesDisponibles.toFixed(0)} disponibles.`,
      probability: Math.min(85, 50 + (deficit / actionsRestantes) * 50),
      impact: deficit > actionsRestantes * 0.3 ? 'high' : 'medium',
      confidence: {
        value: 65,
        level: 'medium',
        factors: ['Basé sur vélocité des 7 derniers jours'],
        dataQuality: 70,
      },
      timeHorizon: '30d',
      triggerConditions: [
        `Vélocité: ${weeklyVelocity} actions/semaine`,
        `Actions restantes: ${actionsRestantes}`,
        `Semaines disponibles: ${semainesDisponibles.toFixed(0)}`,
      ],
      mitigationActions: [{
        id: 'velocity-boost',
        action: 'Plan d\'accélération de vélocité',
        rationale: `Besoin d'augmenter la vélocité de ${Math.round((semainesNecessaires / semainesDisponibles - 1) * 100)}%`,
        expectedOutcome: 'Vélocité alignée avec les besoins',
        costOfInaction: `${deficit} actions ne seront pas terminées à temps`,
        priority: 'P1',
        effort: 'high',
        confidence: { value: 65, level: 'medium', factors: [], dataQuality: 70 },
        targetModule: 'planning',
        tags: ['planning', 'vélocité'],
      }],
      trend: weeklyVelocity < 3 ? 'deteriorating' : 'stable',
      sourceModule: 'planning',
    };
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default SchedulePredictor;
