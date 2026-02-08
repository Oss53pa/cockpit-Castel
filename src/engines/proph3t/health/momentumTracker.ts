// ============================================================================
// PROPH3T ENGINE V2 — MOMENTUM TRACKER
// Suit le momentum et l'énergie du projet
// ============================================================================

import type { Action, Jalon } from '../../../types';
import type { VelocityMetrics } from '../velocity/velocityAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

export type MomentumState = 'accelerating' | 'cruising' | 'slowing' | 'stalling' | 'recovering';

export interface MomentumDataPoint {
  date: Date;
  score: number; // 0-100
  velocity: number;
  completionsToday: number;
  blockersCount: number;
  state: MomentumState;
}

export interface MomentumAnalysis {
  currentMomentum: number; // 0-100
  state: MomentumState;
  trend: 'rising' | 'stable' | 'falling';
  energyLevel: 'high' | 'medium' | 'low';
  consistency: number; // 0-100, régularité du momentum
  history: MomentumDataPoint[];
  insights: MomentumInsight[];
  forecast: MomentumForecast;
}

export interface MomentumInsight {
  type: 'positive' | 'negative' | 'neutral';
  message: string;
  impact: 'high' | 'medium' | 'low';
}

export interface MomentumForecast {
  nextWeek: MomentumState;
  confidence: number;
  factors: string[];
}

export interface MomentumConfig {
  historyDays: number;
  minDataPoints: number;
  smoothingWindow: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: MomentumConfig = {
  historyDays: 30,
  minDataPoints: 7,
  smoothingWindow: 3,
};

// ============================================================================
// MOMENTUM TRACKER
// ============================================================================

export class MomentumTracker {
  private config: MomentumConfig;
  private history: MomentumDataPoint[] = [];

  constructor(config: Partial<MomentumConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ---------------------------------------------------------------------------
  // ANALYSE DU MOMENTUM
  // ---------------------------------------------------------------------------

  analyze(data: {
    actions: Action[];
    jalons: Jalon[];
    velocity?: VelocityMetrics;
  }): MomentumAnalysis {
    // Calculer le momentum actuel
    const currentMomentum = this.calculateMomentum(data);

    // Mettre à jour l'historique
    this.updateHistory(currentMomentum, data);

    // Déterminer l'état
    const state = this.determineState(currentMomentum, this.history);

    // Calculer la tendance
    const trend = this.calculateTrend();

    // Évaluer le niveau d'énergie
    const energyLevel = this.evaluateEnergy(currentMomentum, state);

    // Calculer la consistance
    const consistency = this.calculateConsistency();

    // Générer les insights
    const insights = this.generateInsights(data, currentMomentum, state);

    // Prédire le futur
    const forecast = this.forecastMomentum(data);

    return {
      currentMomentum,
      state,
      trend,
      energyLevel,
      consistency,
      history: this.history.slice(-this.config.historyDays),
      insights,
      forecast,
    };
  }

  private calculateMomentum(data: { actions: Action[]; jalons: Jalon[]; velocity?: VelocityMetrics }): number {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Facteur 1: Complétions récentes (40%)
    const recentCompletions = data.actions.filter(a =>
      a.statut === 'termine' && a.date_reelle &&
      new Date(a.date_reelle) >= weekAgo
    ).length;
    const completionFactor = Math.min(100, recentCompletions * 10);

    // Facteur 2: Vélocité relative (30%)
    let velocityFactor = 50; // Par défaut
    if (data.velocity && data.velocity.averageVelocity > 0) {
      const ratio = data.velocity.currentVelocity / data.velocity.averageVelocity;
      velocityFactor = Math.min(100, ratio * 50);
    }

    // Facteur 3: Absence de blocages (20%)
    const blockedCount = data.actions.filter(a => a.statut === 'bloque').length;
    const blockerFactor = Math.max(0, 100 - blockedCount * 20);

    // Facteur 4: Jalons récents (10%)
    const recentJalons = data.jalons.filter(j =>
      j.statut === 'termine' && j.date_reelle &&
      new Date(j.date_reelle) >= weekAgo
    ).length;
    const jalonFactor = Math.min(100, recentJalons * 30);

    // Calcul pondéré
    const momentum = (
      completionFactor * 0.4 +
      velocityFactor * 0.3 +
      blockerFactor * 0.2 +
      jalonFactor * 0.1
    );

    return Math.round(momentum);
  }

  private updateHistory(momentum: number, data: { actions: Action[] }): void {
    const now = new Date();

    const point: MomentumDataPoint = {
      date: now,
      score: momentum,
      velocity: data.actions.filter(a =>
        a.statut === 'termine' && a.date_reelle &&
        new Date(a.date_reelle).toDateString() === now.toDateString()
      ).length,
      completionsToday: data.actions.filter(a =>
        a.statut === 'termine' && a.date_reelle &&
        new Date(a.date_reelle).toDateString() === now.toDateString()
      ).length,
      blockersCount: data.actions.filter(a => a.statut === 'bloque').length,
      state: this.scoreToState(momentum),
    };

    this.history.push(point);

    // Garder seulement l'historique configuré
    const cutoffDate = new Date(now.getTime() - this.config.historyDays * 24 * 60 * 60 * 1000);
    this.history = this.history.filter(p => new Date(p.date) >= cutoffDate);
  }

  private determineState(current: number, history: MomentumDataPoint[]): MomentumState {
    if (history.length < 2) {
      return this.scoreToState(current);
    }

    const recent = history.slice(-5);
    const avgRecent = recent.reduce((sum, p) => sum + p.score, 0) / recent.length;

    if (current > avgRecent + 10) {
      return 'accelerating';
    } else if (current > avgRecent - 5) {
      return 'cruising';
    } else if (current > avgRecent - 15) {
      // Vérifier si on se remet d'un creux
      const older = history.slice(-10, -5);
      if (older.length > 0) {
        const avgOlder = older.reduce((sum, p) => sum + p.score, 0) / older.length;
        if (avgOlder < avgRecent - 5) {
          return 'recovering';
        }
      }
      return 'slowing';
    } else {
      return 'stalling';
    }
  }

  private scoreToState(score: number): MomentumState {
    if (score >= 70) return 'accelerating';
    if (score >= 50) return 'cruising';
    if (score >= 30) return 'slowing';
    return 'stalling';
  }

  private calculateTrend(): 'rising' | 'stable' | 'falling' {
    if (this.history.length < this.config.minDataPoints) {
      return 'stable';
    }

    const recent = this.history.slice(-7);
    const older = this.history.slice(-14, -7);

    if (recent.length === 0 || older.length === 0) return 'stable';

    const avgRecent = recent.reduce((sum, p) => sum + p.score, 0) / recent.length;
    const avgOlder = older.reduce((sum, p) => sum + p.score, 0) / older.length;

    if (avgRecent > avgOlder + 5) return 'rising';
    if (avgRecent < avgOlder - 5) return 'falling';
    return 'stable';
  }

  private evaluateEnergy(momentum: number, state: MomentumState): 'high' | 'medium' | 'low' {
    if (momentum >= 70 || state === 'accelerating') return 'high';
    if (momentum >= 40 && state !== 'stalling') return 'medium';
    return 'low';
  }

  private calculateConsistency(): number {
    if (this.history.length < this.config.minDataPoints) {
      return 50; // Valeur par défaut
    }

    const scores = this.history.map(p => p.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Consistance inversement proportionnelle à l'écart-type
    // 100 = très consistant (stdDev = 0), décroît avec la variabilité
    return Math.max(0, Math.round(100 - stdDev * 2));
  }

  private generateInsights(
    data: { actions: Action[] },
    momentum: number,
    state: MomentumState
  ): MomentumInsight[] {
    const insights: MomentumInsight[] = [];

    // Insight sur l'état actuel
    if (state === 'accelerating') {
      insights.push({
        type: 'positive',
        message: 'Le projet prend de la vitesse - bon moment pour capitaliser',
        impact: 'high',
      });
    } else if (state === 'stalling') {
      insights.push({
        type: 'negative',
        message: 'Momentum en perte de vitesse - intervention recommandée',
        impact: 'high',
      });
    } else if (state === 'recovering') {
      insights.push({
        type: 'positive',
        message: 'Le projet se remet d\'un creux - maintenir les efforts',
        impact: 'medium',
      });
    }

    // Insight sur les blocages
    const blockedCount = data.actions.filter(a => a.statut === 'bloque').length;
    if (blockedCount > 3) {
      insights.push({
        type: 'negative',
        message: `${blockedCount} actions bloquées freinent le momentum`,
        impact: 'high',
      });
    }

    // Insight sur la consistance
    const consistency = this.calculateConsistency();
    if (consistency < 50) {
      insights.push({
        type: 'neutral',
        message: 'Momentum irrégulier - chercher plus de stabilité',
        impact: 'medium',
      });
    } else if (consistency > 80) {
      insights.push({
        type: 'positive',
        message: 'Momentum très consistant - bonne prédictibilité',
        impact: 'low',
      });
    }

    return insights;
  }

  private forecastMomentum(data: { actions: Action[] }): MomentumForecast {
    const factors: string[] = [];
    let predictedState: MomentumState = 'cruising';
    let confidence = 0.5;

    // Analyser les tendances
    const trend = this.calculateTrend();

    if (trend === 'rising') {
      predictedState = 'accelerating';
      factors.push('Tendance haussière observée');
      confidence += 0.1;
    } else if (trend === 'falling') {
      predictedState = 'slowing';
      factors.push('Tendance baissière observée');
      confidence += 0.1;
    }

    // Analyser les blocages
    const blockedCount = data.actions.filter(a => a.statut === 'bloque').length;
    if (blockedCount > 5) {
      predictedState = 'stalling';
      factors.push('Nombreux blocages en cours');
      confidence += 0.15;
    } else if (blockedCount === 0) {
      if (predictedState !== 'slowing') {
        predictedState = 'cruising';
      }
      factors.push('Aucun blocage actif');
      confidence += 0.1;
    }

    // Analyser les échéances proches
    const now = new Date();
    const upcomingActions = data.actions.filter(a =>
      a.statut !== 'termine' && a.date_prevue &&
      new Date(a.date_prevue) < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    ).length;

    if (upcomingActions > 10) {
      factors.push('Nombreuses échéances la semaine prochaine');
    }

    return {
      nextWeek: predictedState,
      confidence: Math.min(0.9, confidence),
      factors,
    };
  }

  // ---------------------------------------------------------------------------
  // COMPARAISONS
  // ---------------------------------------------------------------------------

  /**
   * Compare le momentum actuel avec l'historique
   */
  compareToHistory(): {
    vsLastWeek: number;
    vsLastMonth: number;
    bestMomentum: number;
    worstMomentum: number;
    bestDate?: Date;
    worstDate?: Date;
  } {
    if (this.history.length === 0) {
      return {
        vsLastWeek: 0,
        vsLastMonth: 0,
        bestMomentum: 0,
        worstMomentum: 0,
      };
    }

    const current = this.history[this.history.length - 1]?.score || 0;

    // Moyenne semaine dernière
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekPoints = this.history.filter(p => new Date(p.date) <= weekAgo);
    const avgLastWeek = lastWeekPoints.length > 0
      ? lastWeekPoints.reduce((sum, p) => sum + p.score, 0) / lastWeekPoints.length
      : current;

    // Moyenne mois dernier
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const lastMonthPoints = this.history.filter(p => new Date(p.date) <= monthAgo);
    const avgLastMonth = lastMonthPoints.length > 0
      ? lastMonthPoints.reduce((sum, p) => sum + p.score, 0) / lastMonthPoints.length
      : current;

    // Best et worst
    let best = this.history[0];
    let worst = this.history[0];
    for (const point of this.history) {
      if (point.score > best.score) best = point;
      if (point.score < worst.score) worst = point;
    }

    return {
      vsLastWeek: Math.round(current - avgLastWeek),
      vsLastMonth: Math.round(current - avgLastMonth),
      bestMomentum: best.score,
      worstMomentum: worst.score,
      bestDate: best.date,
      worstDate: worst.date,
    };
  }

  // ---------------------------------------------------------------------------
  // UTILITAIRES
  // ---------------------------------------------------------------------------

  getHistory(): MomentumDataPoint[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  setHistory(history: MomentumDataPoint[]): void {
    this.history = history;
  }
}

export default MomentumTracker;
