// ============================================================================
// PROPH3T ENGINE V2 — VELOCITY ANALYZER
// Analyse la vélocité du projet et des équipes
// ============================================================================

import type { Action, Jalon } from '../../../types';

// ============================================================================
// TYPES
// ============================================================================

export type VelocityUnit = 'actions' | 'story_points' | 'budget_consumed' | 'milestones';

export interface VelocityDataPoint {
  periodStart: Date;
  periodEnd: Date;
  completed: number;
  planned: number;
  velocity: number; // completed / period_length
  efficiency: number; // completed / planned (0-1)
}

export interface VelocityTrend {
  direction: 'accelerating' | 'stable' | 'decelerating';
  changePercent: number;
  confidence: number;
  forecast: number[]; // Prochaines périodes
}

export interface VelocityMetrics {
  currentVelocity: number;
  averageVelocity: number;
  peakVelocity: number;
  minVelocity: number;
  trend: VelocityTrend;
  dataPoints: VelocityDataPoint[];
  unit: VelocityUnit;
  periodDays: number;
}

export interface TeamVelocity {
  teamOrOwner: string;
  metrics: VelocityMetrics;
  rank: number;
  isAboveAverage: boolean;
}

export interface VelocityConfig {
  periodDays: number; // Durée d'une période (par défaut: 7 jours/sprint)
  minPeriodsForTrend: number; // Minimum de périodes pour calculer une tendance
  forecastPeriods: number; // Nombre de périodes à prévoir
  smoothingFactor: number; // Pour le lissage exponentiel (0-1)
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: VelocityConfig = {
  periodDays: 7,
  minPeriodsForTrend: 3,
  forecastPeriods: 4,
  smoothingFactor: 0.3,
};

// ============================================================================
// VELOCITY ANALYZER
// ============================================================================

export class VelocityAnalyzer {
  private config: VelocityConfig;

  constructor(config: Partial<VelocityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ---------------------------------------------------------------------------
  // CALCUL DE VÉLOCITÉ
  // ---------------------------------------------------------------------------

  /**
   * Calcule la vélocité basée sur les actions
   */
  analyzeActionVelocity(actions: Action[], startDate: Date, endDate: Date): VelocityMetrics {
    const dataPoints = this.buildDataPoints(actions, startDate, endDate);
    return this.calculateMetrics(dataPoints, 'actions');
  }

  /**
   * Calcule la vélocité basée sur les jalons
   */
  analyzeJalonVelocity(jalons: Jalon[], startDate: Date, endDate: Date): VelocityMetrics {
    const completedJalons = jalons.filter(j => j.statut === 'termine' && j.date_reelle);

    // Convertir en format similaire aux actions
    const jalonAsActions = completedJalons.map(j => ({
      date_reelle: j.date_reelle,
      date_prevue: j.date_prevue,
      statut: j.statut,
    }));

    const dataPoints = this.buildDataPointsFromCompletions(jalonAsActions, startDate, endDate);
    return this.calculateMetrics(dataPoints, 'milestones');
  }

  private buildDataPoints(actions: Action[], startDate: Date, endDate: Date): VelocityDataPoint[] {
    const dataPoints: VelocityDataPoint[] = [];
    const periodMs = this.config.periodDays * 24 * 60 * 60 * 1000;

    let currentStart = new Date(startDate);

    while (currentStart < endDate) {
      const currentEnd = new Date(Math.min(currentStart.getTime() + periodMs, endDate.getTime()));

      const completedInPeriod = actions.filter(a => {
        if (a.statut !== 'termine' || !a.date_reelle) return false;
        const completionDate = new Date(a.date_reelle);
        return completionDate >= currentStart && completionDate < currentEnd;
      }).length;

      const plannedInPeriod = actions.filter(a => {
        if (!a.date_prevue) return false;
        const plannedDate = new Date(a.date_prevue);
        return plannedDate >= currentStart && plannedDate < currentEnd;
      }).length;

      const periodDays = (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24);

      dataPoints.push({
        periodStart: new Date(currentStart),
        periodEnd: new Date(currentEnd),
        completed: completedInPeriod,
        planned: Math.max(plannedInPeriod, 1), // Éviter division par zéro
        velocity: completedInPeriod / periodDays,
        efficiency: plannedInPeriod > 0 ? completedInPeriod / plannedInPeriod : 1,
      });

      currentStart = new Date(currentEnd);
    }

    return dataPoints;
  }

  private buildDataPointsFromCompletions(
    items: Array<{ date_reelle?: string | null; date_prevue?: string | null; statut?: string }>,
    startDate: Date,
    endDate: Date
  ): VelocityDataPoint[] {
    const dataPoints: VelocityDataPoint[] = [];
    const periodMs = this.config.periodDays * 24 * 60 * 60 * 1000;

    let currentStart = new Date(startDate);

    while (currentStart < endDate) {
      const currentEnd = new Date(Math.min(currentStart.getTime() + periodMs, endDate.getTime()));

      const completedInPeriod = items.filter(item => {
        if (!item.date_reelle) return false;
        const completionDate = new Date(item.date_reelle);
        return completionDate >= currentStart && completionDate < currentEnd;
      }).length;

      const plannedInPeriod = items.filter(item => {
        if (!item.date_prevue) return false;
        const plannedDate = new Date(item.date_prevue);
        return plannedDate >= currentStart && plannedDate < currentEnd;
      }).length;

      const periodDays = (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24);

      dataPoints.push({
        periodStart: new Date(currentStart),
        periodEnd: new Date(currentEnd),
        completed: completedInPeriod,
        planned: Math.max(plannedInPeriod, 1),
        velocity: completedInPeriod / periodDays,
        efficiency: plannedInPeriod > 0 ? completedInPeriod / plannedInPeriod : 1,
      });

      currentStart = new Date(currentEnd);
    }

    return dataPoints;
  }

  private calculateMetrics(dataPoints: VelocityDataPoint[], unit: VelocityUnit): VelocityMetrics {
    if (dataPoints.length === 0) {
      return this.createEmptyMetrics(unit);
    }

    const velocities = dataPoints.map(dp => dp.velocity);
    const currentVelocity = velocities[velocities.length - 1];
    const averageVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const peakVelocity = Math.max(...velocities);
    const minVelocity = Math.min(...velocities);

    const trend = this.calculateTrend(velocities);

    return {
      currentVelocity: Math.round(currentVelocity * 100) / 100,
      averageVelocity: Math.round(averageVelocity * 100) / 100,
      peakVelocity: Math.round(peakVelocity * 100) / 100,
      minVelocity: Math.round(minVelocity * 100) / 100,
      trend,
      dataPoints,
      unit,
      periodDays: this.config.periodDays,
    };
  }

  private calculateTrend(velocities: number[]): VelocityTrend {
    if (velocities.length < this.config.minPeriodsForTrend) {
      return {
        direction: 'stable',
        changePercent: 0,
        confidence: 0,
        forecast: [],
      };
    }

    // Calcul de la tendance par régression linéaire simple
    const n = velocities.length;
    const indices = velocities.map((_, i) => i);

    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = velocities.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * velocities[i], 0);
    const sumXX = indices.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Direction de la tendance
    const changePercent = velocities[0] > 0 ? (slope / velocities[0]) * 100 : 0;
    let direction: 'accelerating' | 'stable' | 'decelerating';

    if (changePercent > 5) {
      direction = 'accelerating';
    } else if (changePercent < -5) {
      direction = 'decelerating';
    } else {
      direction = 'stable';
    }

    // Confiance basée sur R²
    const yMean = sumY / n;
    const ssTotal = velocities.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssResidual = velocities.reduce((sum, y, i) => {
      const predicted = intercept + slope * i;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

    // Prévisions
    const forecast: number[] = [];
    for (let i = 0; i < this.config.forecastPeriods; i++) {
      const predicted = intercept + slope * (n + i);
      forecast.push(Math.max(0, Math.round(predicted * 100) / 100));
    }

    return {
      direction,
      changePercent: Math.round(changePercent * 10) / 10,
      confidence: Math.round(rSquared * 100) / 100,
      forecast,
    };
  }

  private createEmptyMetrics(unit: VelocityUnit): VelocityMetrics {
    return {
      currentVelocity: 0,
      averageVelocity: 0,
      peakVelocity: 0,
      minVelocity: 0,
      trend: {
        direction: 'stable',
        changePercent: 0,
        confidence: 0,
        forecast: [],
      },
      dataPoints: [],
      unit,
      periodDays: this.config.periodDays,
    };
  }

  // ---------------------------------------------------------------------------
  // VÉLOCITÉ PAR ÉQUIPE/RESPONSABLE
  // ---------------------------------------------------------------------------

  analyzeByOwner(actions: Action[], startDate: Date, endDate: Date): TeamVelocity[] {
    const owners = [...new Set(actions.map(a => a.responsable).filter(Boolean))];
    const results: TeamVelocity[] = [];

    for (const owner of owners) {
      const ownerActions = actions.filter(a => a.responsable === owner);
      const metrics = this.analyzeActionVelocity(ownerActions, startDate, endDate);
      results.push({
        teamOrOwner: owner!,
        metrics,
        rank: 0,
        isAboveAverage: false,
      });
    }

    // Calculer les rangs et la moyenne
    const avgVelocity = results.length > 0
      ? results.reduce((sum, r) => sum + r.metrics.averageVelocity, 0) / results.length
      : 0;

    results
      .sort((a, b) => b.metrics.averageVelocity - a.metrics.averageVelocity)
      .forEach((r, i) => {
        r.rank = i + 1;
        r.isAboveAverage = r.metrics.averageVelocity > avgVelocity;
      });

    return results;
  }

  // ---------------------------------------------------------------------------
  // COMPARAISONS
  // ---------------------------------------------------------------------------

  /**
   * Compare la vélocité actuelle vs historique
   */
  compareToHistorical(current: VelocityMetrics): {
    vsAverage: number;
    vsPeak: number;
    percentile: number;
    assessment: string;
  } {
    const vsAverage = current.averageVelocity > 0
      ? ((current.currentVelocity - current.averageVelocity) / current.averageVelocity) * 100
      : 0;

    const vsPeak = current.peakVelocity > 0
      ? (current.currentVelocity / current.peakVelocity) * 100
      : 0;

    // Calculer le percentile
    const sortedVelocities = current.dataPoints.map(dp => dp.velocity).sort((a, b) => a - b);
    const rank = sortedVelocities.findIndex(v => v >= current.currentVelocity);
    const percentile = sortedVelocities.length > 0
      ? (rank / sortedVelocities.length) * 100
      : 50;

    let assessment: string;
    if (vsAverage > 20) {
      assessment = 'Performance exceptionnelle - bien au-dessus de la moyenne';
    } else if (vsAverage > 5) {
      assessment = 'Bonne performance - légèrement au-dessus de la moyenne';
    } else if (vsAverage > -5) {
      assessment = 'Performance normale - proche de la moyenne';
    } else if (vsAverage > -20) {
      assessment = 'Performance en baisse - légèrement sous la moyenne';
    } else {
      assessment = 'Performance préoccupante - bien en dessous de la moyenne';
    }

    return {
      vsAverage: Math.round(vsAverage * 10) / 10,
      vsPeak: Math.round(vsPeak * 10) / 10,
      percentile: Math.round(percentile),
      assessment,
    };
  }

  // ---------------------------------------------------------------------------
  // CONFIGURATION
  // ---------------------------------------------------------------------------

  updateConfig(newConfig: Partial<VelocityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): VelocityConfig {
    return { ...this.config };
  }
}

export default VelocityAnalyzer;
