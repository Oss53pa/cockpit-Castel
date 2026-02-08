// ============================================================================
// PROPH3T ENGINE V2 — FATIGUE DETECTOR
// Détecte les signes de fatigue projet et équipe
// ============================================================================

import type { Action, Jalon } from '../../../types';
import type { VelocityMetrics } from '../velocity/velocityAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

export type FatigueLevel = 'healthy' | 'mild' | 'moderate' | 'severe' | 'critical';
export type FatigueIndicator =
  | 'velocity_decline'
  | 'quality_degradation'
  | 'deadline_slippage'
  | 'rework_increase'
  | 'communication_drop'
  | 'scope_creep'
  | 'overdue_accumulation';

export interface FatigueSignal {
  indicator: FatigueIndicator;
  severity: number; // 0-100
  trend: 'worsening' | 'stable' | 'improving';
  evidence: string[];
  detectedAt: Date;
}

export interface FatigueAssessment {
  overallLevel: FatigueLevel;
  overallScore: number; // 0-100 (100 = très fatigué)
  signals: FatigueSignal[];
  recommendations: string[];
  riskFactors: string[];
  protectiveFactors: string[];
  assessedAt: Date;
}

export interface TeamFatigue {
  teamOrOwner: string;
  fatigueScore: number;
  workload: number; // Actions assignées
  overdueCount: number;
  completionRate: number;
  signals: FatigueIndicator[];
}

export interface FatigueConfig {
  velocityDeclineThreshold: number; // % de baisse considéré comme alerte
  overdueThreshold: number; // % d'actions en retard
  reworkThreshold: number; // % de tâches réouvertes
  lookbackDays: number; // Période d'analyse
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: FatigueConfig = {
  velocityDeclineThreshold: 20,
  overdueThreshold: 15,
  reworkThreshold: 10,
  lookbackDays: 30,
};

// ============================================================================
// FATIGUE DETECTOR
// ============================================================================

export class FatigueDetector {
  private config: FatigueConfig;

  constructor(config: Partial<FatigueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ---------------------------------------------------------------------------
  // ÉVALUATION GLOBALE
  // ---------------------------------------------------------------------------

  assess(data: {
    actions: Action[];
    jalons: Jalon[];
    velocity?: VelocityMetrics;
  }): FatigueAssessment {
    const signals: FatigueSignal[] = [];

    // Détecter chaque indicateur
    const velocitySignal = this.detectVelocityDecline(data.velocity);
    if (velocitySignal) signals.push(velocitySignal);

    const overdueSignal = this.detectOverdueAccumulation(data.actions);
    if (overdueSignal) signals.push(overdueSignal);

    const slippageSignal = this.detectDeadlineSlippage(data.jalons);
    if (slippageSignal) signals.push(slippageSignal);

    const reworkSignal = this.detectReworkIncrease(data.actions);
    if (reworkSignal) signals.push(reworkSignal);

    const scopeSignal = this.detectScopeCreep(data.actions);
    if (scopeSignal) signals.push(scopeSignal);

    // Calculer le score global
    const overallScore = this.calculateOverallScore(signals);
    const overallLevel = this.scoreToLevel(overallScore);

    // Générer les recommandations
    const recommendations = this.generateRecommendations(signals, overallLevel);
    const riskFactors = this.identifyRiskFactors(signals, data);
    const protectiveFactors = this.identifyProtectiveFactors(signals, data);

    return {
      overallLevel,
      overallScore,
      signals,
      recommendations,
      riskFactors,
      protectiveFactors,
      assessedAt: new Date(),
    };
  }

  private detectVelocityDecline(velocity?: VelocityMetrics): FatigueSignal | null {
    if (!velocity || velocity.dataPoints.length < 3) return null;

    const recent = velocity.currentVelocity;
    const avg = velocity.averageVelocity;

    if (avg === 0) return null;

    const decline = ((avg - recent) / avg) * 100;

    if (decline > this.config.velocityDeclineThreshold) {
      return {
        indicator: 'velocity_decline',
        severity: Math.min(100, decline * 2),
        trend: velocity.trend.direction === 'decelerating' ? 'worsening' : 'stable',
        evidence: [
          `Vélocité actuelle: ${recent.toFixed(2)} vs moyenne: ${avg.toFixed(2)}`,
          `Baisse de ${decline.toFixed(1)}%`,
        ],
        detectedAt: new Date(),
      };
    }

    return null;
  }

  private detectOverdueAccumulation(actions: Action[]): FatigueSignal | null {
    const now = new Date();
    const activeActions = actions.filter(a => a.statut !== 'termine' && a.statut !== 'annule');
    const overdueActions = activeActions.filter(a =>
      a.date_prevue && new Date(a.date_prevue) < now
    );

    if (activeActions.length === 0) return null;

    const overdueRate = (overdueActions.length / activeActions.length) * 100;

    if (overdueRate > this.config.overdueThreshold) {
      // Calculer l'ancienneté moyenne des retards
      const avgDaysOverdue = overdueActions.reduce((sum, a) => {
        const daysLate = Math.ceil((now.getTime() - new Date(a.date_prevue!).getTime()) / (1000 * 60 * 60 * 24));
        return sum + daysLate;
      }, 0) / overdueActions.length;

      return {
        indicator: 'overdue_accumulation',
        severity: Math.min(100, overdueRate * 2 + avgDaysOverdue),
        trend: avgDaysOverdue > 7 ? 'worsening' : 'stable',
        evidence: [
          `${overdueActions.length} actions en retard sur ${activeActions.length} actives (${overdueRate.toFixed(1)}%)`,
          `Retard moyen: ${avgDaysOverdue.toFixed(1)} jours`,
        ],
        detectedAt: new Date(),
      };
    }

    return null;
  }

  private detectDeadlineSlippage(jalons: Jalon[]): FatigueSignal | null {
    const completedJalons = jalons.filter(j => j.statut === 'termine' && j.date_reelle && j.date_prevue);

    if (completedJalons.length < 3) return null;

    const slippages = completedJalons.map(j => {
      const planned = new Date(j.date_prevue!).getTime();
      const actual = new Date(j.date_reelle!).getTime();
      return (actual - planned) / (1000 * 60 * 60 * 24);
    });

    const avgSlippage = slippages.reduce((a, b) => a + b, 0) / slippages.length;
    const recentSlippages = slippages.slice(-3);
    const recentAvg = recentSlippages.reduce((a, b) => a + b, 0) / recentSlippages.length;

    if (avgSlippage > 5) {
      return {
        indicator: 'deadline_slippage',
        severity: Math.min(100, avgSlippage * 5),
        trend: recentAvg > avgSlippage ? 'worsening' : recentAvg < avgSlippage * 0.5 ? 'improving' : 'stable',
        evidence: [
          `Glissement moyen des jalons: ${avgSlippage.toFixed(1)} jours`,
          `Tendance récente: ${recentAvg > avgSlippage ? 'en hausse' : 'stable ou amélioration'}`,
        ],
        detectedAt: new Date(),
      };
    }

    return null;
  }

  private detectReworkIncrease(actions: Action[]): FatigueSignal | null {
    // Détecter les actions qui ont été réouvertes (passées à termine puis revenues)
    const actionsWithHistory = actions.filter(a => a.historique && a.historique.length > 2);

    let reworkCount = 0;
    for (const action of actionsWithHistory) {
      const statusChanges = action.historique?.filter(h =>
        h.champ === 'statut' && h.ancienne_valeur === 'termine'
      ) || [];
      if (statusChanges.length > 0) {
        reworkCount++;
      }
    }

    if (actions.length === 0) return null;

    const reworkRate = (reworkCount / actions.length) * 100;

    if (reworkRate > this.config.reworkThreshold) {
      return {
        indicator: 'rework_increase',
        severity: Math.min(100, reworkRate * 5),
        trend: 'stable',
        evidence: [
          `${reworkCount} action(s) réouvertes après complétion (${reworkRate.toFixed(1)}%)`,
          'Indicateur potentiel de qualité insuffisante ou exigences changeantes',
        ],
        detectedAt: new Date(),
      };
    }

    return null;
  }

  private detectScopeCreep(actions: Action[]): FatigueSignal | null {
    const now = new Date();
    const lookbackDate = new Date(now.getTime() - this.config.lookbackDays * 24 * 60 * 60 * 1000);

    // Compter les actions créées récemment
    const recentActions = actions.filter(a => {
      const created = a.historique?.find(h => h.champ === 'creation');
      return created && new Date(created.date) > lookbackDate;
    });

    const originalCount = actions.length - recentActions.length;
    if (originalCount === 0) return null;

    const growthRate = (recentActions.length / originalCount) * 100;

    if (growthRate > 20) {
      return {
        indicator: 'scope_creep',
        severity: Math.min(100, growthRate * 2),
        trend: 'worsening',
        evidence: [
          `${recentActions.length} nouvelles actions ajoutées sur les ${this.config.lookbackDays} derniers jours`,
          `Croissance de ${growthRate.toFixed(1)}% du périmètre`,
        ],
        detectedAt: new Date(),
      };
    }

    return null;
  }

  private calculateOverallScore(signals: FatigueSignal[]): number {
    if (signals.length === 0) return 0;

    // Moyenne pondérée par sévérité
    const weights: Record<FatigueIndicator, number> = {
      velocity_decline: 1.5,
      overdue_accumulation: 1.3,
      deadline_slippage: 1.2,
      rework_increase: 1.0,
      scope_creep: 1.1,
      quality_degradation: 1.4,
      communication_drop: 0.8,
    };

    let totalWeight = 0;
    let weightedSum = 0;

    for (const signal of signals) {
      const weight = weights[signal.indicator] || 1;
      weightedSum += signal.severity * weight;
      totalWeight += weight;
    }

    return Math.min(100, Math.round(weightedSum / totalWeight));
  }

  private scoreToLevel(score: number): FatigueLevel {
    if (score < 20) return 'healthy';
    if (score < 40) return 'mild';
    if (score < 60) return 'moderate';
    if (score < 80) return 'severe';
    return 'critical';
  }

  private generateRecommendations(signals: FatigueSignal[], level: FatigueLevel): string[] {
    const recs: string[] = [];

    for (const signal of signals) {
      switch (signal.indicator) {
        case 'velocity_decline':
          recs.push('Analyser les causes de la baisse de vélocité (blocages, fatigue, complexité)');
          if (signal.severity > 50) {
            recs.push('Envisager un allègement temporaire de la charge');
          }
          break;
        case 'overdue_accumulation':
          recs.push('Organiser une session de désengorgement des retards');
          recs.push('Réévaluer les priorités et reporter si nécessaire');
          break;
        case 'deadline_slippage':
          recs.push('Revoir les estimations et ajouter des marges de sécurité');
          break;
        case 'rework_increase':
          recs.push('Renforcer la revue qualité avant validation');
          recs.push('Clarifier les critères d\'acceptation');
          break;
        case 'scope_creep':
          recs.push('Mettre en place un contrôle strict des changements de périmètre');
          recs.push('Documenter et valider tout ajout de scope');
          break;
      }
    }

    // Recommandations générales selon le niveau
    if (level === 'severe' || level === 'critical') {
      recs.push('Organiser une rétrospective d\'urgence');
      recs.push('Envisager un arrêt temporaire pour consolidation');
    }

    return [...new Set(recs)]; // Dédupliquer
  }

  private identifyRiskFactors(signals: FatigueSignal[], data: any): string[] {
    const factors: string[] = [];

    if (signals.some(s => s.trend === 'worsening')) {
      factors.push('Tendances négatives en cours');
    }

    const overdueActions = data.actions.filter((a: Action) =>
      a.statut !== 'termine' && a.date_prevue && new Date(a.date_prevue) < new Date()
    );
    if (overdueActions.length > 10) {
      factors.push('Volume élevé d\'actions en retard');
    }

    if (signals.length > 3) {
      factors.push('Multiple signaux de fatigue simultanés');
    }

    return factors;
  }

  private identifyProtectiveFactors(signals: FatigueSignal[], data: any): string[] {
    const factors: string[] = [];

    if (signals.some(s => s.trend === 'improving')) {
      factors.push('Certains indicateurs en amélioration');
    }

    const completionRate = data.actions.filter((a: Action) => a.statut === 'termine').length / data.actions.length;
    if (completionRate > 0.6) {
      factors.push('Taux de complétion satisfaisant');
    }

    if (signals.length <= 1) {
      factors.push('Peu de signaux de fatigue détectés');
    }

    return factors;
  }

  // ---------------------------------------------------------------------------
  // ANALYSE PAR ÉQUIPE
  // ---------------------------------------------------------------------------

  analyzeByTeam(actions: Action[]): TeamFatigue[] {
    const owners = new Map<string, Action[]>();

    for (const action of actions) {
      if (action.responsable) {
        const existing = owners.get(action.responsable) || [];
        owners.set(action.responsable, [...existing, action]);
      }
    }

    const now = new Date();
    const results: TeamFatigue[] = [];

    for (const [owner, ownerActions] of owners) {
      const overdue = ownerActions.filter(a =>
        a.statut !== 'termine' && a.date_prevue && new Date(a.date_prevue) < now
      );
      const completed = ownerActions.filter(a => a.statut === 'termine');

      const signals: FatigueIndicator[] = [];
      let fatigueScore = 0;

      const overdueRate = ownerActions.length > 0 ? (overdue.length / ownerActions.length) * 100 : 0;
      if (overdueRate > this.config.overdueThreshold) {
        signals.push('overdue_accumulation');
        fatigueScore += overdueRate;
      }

      // Charge de travail
      const activeCount = ownerActions.filter(a => a.statut !== 'termine' && a.statut !== 'annule').length;
      if (activeCount > 10) {
        fatigueScore += (activeCount - 10) * 5;
      }

      results.push({
        teamOrOwner: owner,
        fatigueScore: Math.min(100, Math.round(fatigueScore)),
        workload: activeCount,
        overdueCount: overdue.length,
        completionRate: ownerActions.length > 0 ? Math.round((completed.length / ownerActions.length) * 100) : 0,
        signals,
      });
    }

    return results.sort((a, b) => b.fatigueScore - a.fatigueScore);
  }

  // ---------------------------------------------------------------------------
  // CONFIGURATION
  // ---------------------------------------------------------------------------

  updateConfig(config: Partial<FatigueConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export default FatigueDetector;
