import type { Action, Jalon, Risque, MeteoProjet } from '@/types';
import { getDaysUntil } from './utils';

// ============================================================================
// PROGRESS CALCULATIONS
// ============================================================================

export function calculateActionProgress(actions: Action[]): number {
  if (actions.length === 0) return 0;
  return actions.reduce((sum, a) => sum + a.avancement, 0) / actions.length;
}

export function calculateWeightedProgress(
  actions: Action[],
  getWeight: (action: Action) => number = () => 1
): number {
  if (actions.length === 0) return 0;

  const totalWeight = actions.reduce((sum, a) => sum + getWeight(a), 0);
  if (totalWeight === 0) return 0;

  const weightedSum = actions.reduce(
    (sum, a) => sum + a.avancement * getWeight(a),
    0
  );
  return weightedSum / totalWeight;
}

// ============================================================================
// METEO (PROJECT HEALTH) CALCULATIONS
// ============================================================================

export interface MeteoFactors {
  alertesCritiques: number;
  alertesHautes: number;
  actionsEnRetard: number;
  risquesCritiques: number;
  depassementsBudget: number;
}

export function calculateMeteo(factors: MeteoFactors): MeteoProjet {
  const {
    alertesCritiques,
    alertesHautes,
    actionsEnRetard,
    risquesCritiques,
    depassementsBudget,
  } = factors;

  // Rouge: Critical issues
  if (
    alertesCritiques >= 3 ||
    actionsEnRetard >= 5 ||
    risquesCritiques >= 2 ||
    depassementsBudget >= 2
  ) {
    return 'rouge';
  }

  // Jaune: Warning level
  if (
    alertesCritiques >= 1 ||
    alertesHautes >= 3 ||
    actionsEnRetard >= 2 ||
    risquesCritiques >= 1 ||
    depassementsBudget >= 1
  ) {
    return 'jaune';
  }

  // Vert: All good
  return 'vert';
}

export function getMeteoColor(meteo: MeteoProjet): string {
  switch (meteo) {
    case 'vert':
      return 'bg-success-500';
    case 'jaune':
      return 'bg-warning-500';
    case 'rouge':
      return 'bg-error-500';
  }
}

export function getMeteoLabel(meteo: MeteoProjet): string {
  switch (meteo) {
    case 'vert':
      return 'Favorable';
    case 'jaune':
      return 'Vigilance';
    case 'rouge':
      return 'Critique';
  }
}

// ============================================================================
// RISK CALCULATIONS
// ============================================================================

export function calculateRiskScore(
  probabilite: 1 | 2 | 3 | 4,
  impact: 1 | 2 | 3 | 4
): number {
  return probabilite * impact;
}

export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 12) return 'critical';
  if (score >= 9) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

export function getRiskColor(score: number): string {
  const level = getRiskLevel(score);
  switch (level) {
    case 'critical':
      return 'bg-error-500 text-white';
    case 'high':
      return 'bg-warning-500 text-white';
    case 'medium':
      return 'bg-info-500 text-white';
    case 'low':
      return 'bg-success-500 text-white';
  }
}

export function buildRiskMatrix(risques: Risque[]): number[][] {
  // 4x4 matrix: [impact][probabilite] = count
  const matrix = Array(4)
    .fill(null)
    .map(() => Array(4).fill(0));

  risques.forEach((r) => {
    if (r.status === 'open') {
      matrix[r.impact - 1][r.probabilite - 1]++;
    }
  });

  return matrix;
}

// ============================================================================
// BUDGET / EVM CALCULATIONS
// ============================================================================

export function calculateBudgetVariance(
  prevu: number,
  realise: number
): { value: number; percent: number } {
  const value = realise - prevu;
  const percent = prevu > 0 ? (value / prevu) * 100 : 0;
  return { value, percent };
}

export function calculateSPI(EV: number, PV: number): number {
  return PV > 0 ? EV / PV : 0;
}

export function calculateCPI(EV: number, AC: number): number {
  return AC > 0 ? EV / AC : 0;
}

export function interpretSPI(spi: number): 'ahead' | 'on_track' | 'behind' {
  if (spi > 1.05) return 'ahead';
  if (spi >= 0.95) return 'on_track';
  return 'behind';
}

export function interpretCPI(cpi: number): 'under_budget' | 'on_budget' | 'over_budget' {
  if (cpi > 1.05) return 'under_budget';
  if (cpi >= 0.95) return 'on_budget';
  return 'over_budget';
}

// ============================================================================
// DATE CALCULATIONS
// ============================================================================

export function isActionLate(action: Action): boolean {
  if (action.statut === 'termine') return false;
  return getDaysUntil(action.date_fin_prevue) < 0;
}

export function getActionDaysLate(action: Action): number {
  if (action.statut === 'termine') return 0;
  const days = getDaysUntil(action.date_fin_prevue);
  return days < 0 ? Math.abs(days) : 0;
}

export function isJalonAtRisk(
  jalon: Jalon,
  actionsProgress: number,
  daysThreshold = 15,
  progressThreshold = 80
): boolean {
  if (jalon.statut === 'atteint') return false;
  const daysUntil = getDaysUntil(jalon.date_prevue);
  return daysUntil < daysThreshold && actionsProgress < progressThreshold;
}

// ============================================================================
// TREND CALCULATIONS
// ============================================================================

export type Trend = 'up' | 'down' | 'stable';

export function calculateTrend(
  current: number,
  previous: number,
  threshold = 5
): Trend {
  const diff = current - previous;
  if (diff > threshold) return 'up';
  if (diff < -threshold) return 'down';
  return 'stable';
}

export function getTrendIcon(trend: Trend): string {
  switch (trend) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    case 'stable':
      return '→';
  }
}

export function getTrendColor(trend: Trend, isPositive = true): string {
  if (trend === 'stable') return 'text-primary-500';
  if (trend === 'up') {
    return isPositive ? 'text-success-500' : 'text-error-500';
  }
  return isPositive ? 'text-error-500' : 'text-success-500';
}
