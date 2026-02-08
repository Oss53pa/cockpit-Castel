// ============================================================================
// PROPH3T ENGINE V2 — PROJECTION ENGINE
// Projections avancées basées sur la vélocité et le burn rate
// ============================================================================

import type { VelocityMetrics, VelocityTrend } from './velocityAnalyzer';
import type { BurnRateMetrics, BurnProjection } from './burnRateCalculator';

// ============================================================================
// TYPES
// ============================================================================

export interface ProjectionInput {
  velocity: VelocityMetrics;
  burnRate: BurnRateMetrics;
  remainingWork: number; // Actions/tâches restantes
  projectEndDate: Date;
}

export interface CompletionProjection {
  estimatedCompletionDate: Date;
  confidenceInterval: {
    lower: Date;
    upper: Date;
  };
  probability: {
    onTime: number;
    delayed: number;
    atRisk: number;
  };
  requiredVelocity: number; // Pour finir à temps
  currentVsRequired: number; // Ratio
  analysis: string;
}

export interface IntegratedProjection {
  schedule: CompletionProjection;
  budget: BurnProjection;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  scenarios: {
    bestCase: ScenarioOutcome;
    likelyCase: ScenarioOutcome;
    worstCase: ScenarioOutcome;
  };
}

export interface ScenarioOutcome {
  name: string;
  completionDate: Date;
  totalCost: number;
  remainingWorkAtEnd: number;
  probability: number;
  description: string;
}

export interface SensitivityAnalysis {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  currentValue: number;
  breakEvenValue: number;
  recommendation: string;
}

// ============================================================================
// PROJECTION ENGINE
// ============================================================================

export class ProjectionEngine {
  // ---------------------------------------------------------------------------
  // PROJECTION DE COMPLÉTION
  // ---------------------------------------------------------------------------

  /**
   * Calcule la projection de date de complétion
   */
  projectCompletion(input: ProjectionInput): CompletionProjection {
    const { velocity, remainingWork, projectEndDate } = input;

    // Vélocité quotidienne
    const dailyVelocity = velocity.currentVelocity;

    // Jours restants jusqu'à la deadline
    const daysToDeadline = Math.max(0, Math.ceil(
      (projectEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    ));

    // Date estimée de complétion
    let daysToComplete: number;
    if (dailyVelocity > 0) {
      daysToComplete = Math.ceil(remainingWork / dailyVelocity);
    } else {
      daysToComplete = Infinity;
    }

    const estimatedCompletionDate = new Date();
    estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + (isFinite(daysToComplete) ? daysToComplete : 365));

    // Intervalle de confiance basé sur la variabilité
    const variabilityFactor = this.calculateVariabilityFactor(velocity.dataPoints.map(dp => dp.velocity));
    const lowerDays = Math.max(1, Math.floor(daysToComplete * (1 - variabilityFactor)));
    const upperDays = Math.ceil(daysToComplete * (1 + variabilityFactor));

    const lowerDate = new Date();
    lowerDate.setDate(lowerDate.getDate() + lowerDays);

    const upperDate = new Date();
    upperDate.setDate(upperDate.getDate() + upperDays);

    // Vélocité requise pour finir à temps
    const requiredVelocity = daysToDeadline > 0 ? remainingWork / daysToDeadline : Infinity;
    const currentVsRequired = requiredVelocity > 0 ? dailyVelocity / requiredVelocity : 0;

    // Probabilités
    const probability = this.calculateProbabilities(
      estimatedCompletionDate,
      projectEndDate,
      variabilityFactor
    );

    // Analyse
    let analysis: string;
    if (currentVsRequired >= 1.2) {
      analysis = 'Le projet est en avance sur le planning. La vélocité actuelle permet d\'absorber des imprévus.';
    } else if (currentVsRequired >= 1.0) {
      analysis = 'Le projet est dans les temps avec une marge limitée. Maintenir la vélocité actuelle est essentiel.';
    } else if (currentVsRequired >= 0.8) {
      analysis = 'Légère alerte: la vélocité actuelle est insuffisante. Une augmentation de 20% est nécessaire.';
    } else if (currentVsRequired >= 0.5) {
      analysis = 'Risque modéré: vélocité insuffisante. Des mesures correctives sont recommandées.';
    } else {
      analysis = 'Risque critique: la vélocité doit doubler pour respecter les délais. Réévaluer le scope.';
    }

    return {
      estimatedCompletionDate,
      confidenceInterval: { lower: lowerDate, upper: upperDate },
      probability,
      requiredVelocity: Math.round(requiredVelocity * 100) / 100,
      currentVsRequired: Math.round(currentVsRequired * 100) / 100,
      analysis,
    };
  }

  private calculateVariabilityFactor(velocities: number[]): number {
    if (velocities.length < 2) return 0.3; // Default 30%

    const mean = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const variance = velocities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / velocities.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient de variation, plafonné à 50%
    return Math.min(0.5, mean > 0 ? stdDev / mean : 0.3);
  }

  private calculateProbabilities(
    estimated: Date,
    deadline: Date,
    variability: number
  ): { onTime: number; delayed: number; atRisk: number } {
    const diffDays = (deadline.getTime() - estimated.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays > 30) {
      return { onTime: 0.9, delayed: 0.08, atRisk: 0.02 };
    } else if (diffDays > 14) {
      return { onTime: 0.75, delayed: 0.2, atRisk: 0.05 };
    } else if (diffDays > 0) {
      return { onTime: 0.6, delayed: 0.3, atRisk: 0.1 };
    } else if (diffDays > -7) {
      return { onTime: 0.3, delayed: 0.5, atRisk: 0.2 };
    } else if (diffDays > -14) {
      return { onTime: 0.1, delayed: 0.5, atRisk: 0.4 };
    } else {
      return { onTime: 0.05, delayed: 0.25, atRisk: 0.7 };
    }
  }

  // ---------------------------------------------------------------------------
  // PROJECTION INTÉGRÉE
  // ---------------------------------------------------------------------------

  /**
   * Combine les projections schedule et budget
   */
  projectIntegrated(input: ProjectionInput, burnProjection: BurnProjection): IntegratedProjection {
    const schedule = this.projectCompletion(input);

    // Calcul du risque global
    const scheduleRisk = this.assessScheduleRisk(schedule);
    const budgetRisk = burnProjection.riskLevel;
    const overallRisk = this.combineRisks(scheduleRisk, budgetRisk);

    // Génération des recommandations
    const recommendations = this.generateRecommendations(schedule, burnProjection, input);

    // Scénarios
    const scenarios = this.generateScenarios(input, schedule, burnProjection);

    return {
      schedule,
      budget: burnProjection,
      overallRisk,
      recommendations,
      scenarios,
    };
  }

  private assessScheduleRisk(schedule: CompletionProjection): 'low' | 'medium' | 'high' | 'critical' {
    if (schedule.probability.onTime >= 0.8) return 'low';
    if (schedule.probability.onTime >= 0.6) return 'medium';
    if (schedule.probability.onTime >= 0.3) return 'high';
    return 'critical';
  }

  private combineRisks(
    scheduleRisk: 'low' | 'medium' | 'high' | 'critical',
    budgetRisk: 'low' | 'medium' | 'high' | 'critical'
  ): 'low' | 'medium' | 'high' | 'critical' {
    const riskOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    const maxRisk = Math.max(riskOrder[scheduleRisk], riskOrder[budgetRisk]);

    // Augmenter d'un niveau si les deux risques sont élevés
    if (riskOrder[scheduleRisk] >= 2 && riskOrder[budgetRisk] >= 2) {
      return 'critical';
    }

    const risks: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
    return risks[maxRisk];
  }

  private generateRecommendations(
    schedule: CompletionProjection,
    burn: BurnProjection,
    input: ProjectionInput
  ): string[] {
    const recs: string[] = [];

    // Recommandations schedule
    if (schedule.currentVsRequired < 0.8) {
      recs.push('Augmenter la vélocité: envisager des ressources supplémentaires ou réduire le scope');
    }
    if (schedule.currentVsRequired < 1.0 && input.velocity.trend.direction === 'decelerating') {
      recs.push('Attention: vélocité en baisse. Identifier et résoudre les blocages');
    }

    // Recommandations budget
    if (burn.riskLevel === 'critical' || burn.riskLevel === 'high') {
      recs.push('Réviser le budget: identifier les postes à optimiser en priorité');
    }
    if (burn.variance > 0) {
      recs.push(`Anticiper un dépassement de ${Math.round(burn.variance).toLocaleString('fr-FR')}€`);
    }

    // Recommandations combinées
    if (schedule.probability.atRisk > 0.3 && burn.riskLevel !== 'low') {
      recs.push('Double alerte schedule/budget: organiser une réunion de crise');
    }

    if (recs.length === 0) {
      recs.push('Projet sous contrôle. Maintenir le rythme actuel.');
    }

    return recs;
  }

  private generateScenarios(
    input: ProjectionInput,
    schedule: CompletionProjection,
    burn: BurnProjection
  ): { bestCase: ScenarioOutcome; likelyCase: ScenarioOutcome; worstCase: ScenarioOutcome } {
    const { velocity, burnRate, remainingWork, projectEndDate } = input;

    // Best case: +30% vélocité, -15% coûts
    const bestDays = Math.ceil(remainingWork / (velocity.currentVelocity * 1.3));
    const bestDate = new Date();
    bestDate.setDate(bestDate.getDate() + bestDays);
    const bestCost = burnRate.totalSpent + (burnRate.currentBurnRate * 0.85 * bestDays);

    // Likely case: vélocité actuelle
    const likelyDate = schedule.estimatedCompletionDate;
    const likelyCost = burn.projectedEndSpend;

    // Worst case: -20% vélocité, +25% coûts
    const worstDays = Math.ceil(remainingWork / (velocity.currentVelocity * 0.8));
    const worstDate = new Date();
    worstDate.setDate(worstDate.getDate() + worstDays);
    const worstCost = burnRate.totalSpent + (burnRate.currentBurnRate * 1.25 * worstDays);

    return {
      bestCase: {
        name: 'Optimiste',
        completionDate: bestDate,
        totalCost: Math.round(bestCost),
        remainingWorkAtEnd: 0,
        probability: 0.15,
        description: 'Vélocité augmentée, pas de blocages majeurs',
      },
      likelyCase: {
        name: 'Réaliste',
        completionDate: likelyDate,
        totalCost: Math.round(likelyCost),
        remainingWorkAtEnd: 0,
        probability: 0.6,
        description: 'Continuation du rythme actuel',
      },
      worstCase: {
        name: 'Pessimiste',
        completionDate: worstDate,
        totalCost: Math.round(worstCost),
        remainingWorkAtEnd: Math.round(remainingWork * 0.1),
        probability: 0.25,
        description: 'Blocages, retards et dépassements',
      },
    };
  }

  // ---------------------------------------------------------------------------
  // ANALYSE DE SENSIBILITÉ
  // ---------------------------------------------------------------------------

  /**
   * Analyse l'impact des différents facteurs sur les projections
   */
  analyzeSensitivity(input: ProjectionInput): SensitivityAnalysis[] {
    const { velocity, burnRate, remainingWork, projectEndDate } = input;
    const analyses: SensitivityAnalysis[] = [];

    // Sensibilité à la vélocité
    const daysToDeadline = Math.max(1, Math.ceil(
      (projectEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    ));
    const requiredVelocity = remainingWork / daysToDeadline;

    analyses.push({
      factor: 'Vélocité',
      impact: velocity.currentVelocity < requiredVelocity ? 'high' : 'medium',
      currentValue: velocity.currentVelocity,
      breakEvenValue: requiredVelocity,
      recommendation: velocity.currentVelocity < requiredVelocity
        ? `Augmenter la vélocité de ${Math.round((requiredVelocity - velocity.currentVelocity) / velocity.currentVelocity * 100)}%`
        : 'Vélocité suffisante, maintenir le rythme',
    });

    // Sensibilité au burn rate
    const targetBurnRate = burnRate.remainingBudget / daysToDeadline;
    analyses.push({
      factor: 'Burn Rate',
      impact: burnRate.currentBurnRate > targetBurnRate * 1.2 ? 'high' : 'medium',
      currentValue: burnRate.currentBurnRate,
      breakEvenValue: targetBurnRate,
      recommendation: burnRate.currentBurnRate > targetBurnRate
        ? `Réduire le burn rate de ${Math.round((burnRate.currentBurnRate - targetBurnRate) / burnRate.currentBurnRate * 100)}%`
        : 'Budget sous contrôle',
    });

    // Sensibilité au scope
    const maxWorkWithCurrentVelocity = velocity.currentVelocity * daysToDeadline;
    analyses.push({
      factor: 'Scope (travail restant)',
      impact: remainingWork > maxWorkWithCurrentVelocity ? 'high' : 'low',
      currentValue: remainingWork,
      breakEvenValue: maxWorkWithCurrentVelocity,
      recommendation: remainingWork > maxWorkWithCurrentVelocity
        ? `Réduire le scope de ${Math.round((remainingWork - maxWorkWithCurrentVelocity) / remainingWork * 100)}% ou reporter`
        : 'Scope gérable avec les ressources actuelles',
    });

    return analyses;
  }
}

export default ProjectionEngine;
