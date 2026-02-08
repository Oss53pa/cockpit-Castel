// ============================================================================
// PROPH3T ENGINE V2 — BURN RATE CALCULATOR
// Calcule le taux de consommation budget et prévisions
// ============================================================================

import type { BudgetItem } from '../../../types';

// ============================================================================
// TYPES
// ============================================================================

export interface BurnRateDataPoint {
  date: Date;
  cumulativeSpent: number;
  cumulativePlanned: number;
  dailyRate: number;
  runningAverageRate: number;
}

export interface BurnRateMetrics {
  currentBurnRate: number; // €/jour
  averageBurnRate: number;
  peakBurnRate: number;
  totalSpent: number;
  totalBudget: number;
  remainingBudget: number;
  percentConsumed: number;
  dataPoints: BurnRateDataPoint[];
}

export interface BurnProjection {
  exhaustionDate: Date | null;
  daysUntilExhaustion: number | null;
  projectedEndSpend: number;
  variance: number; // vs budget initial
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  scenarios: {
    optimistic: BurnScenario;
    realistic: BurnScenario;
    pessimistic: BurnScenario;
  };
}

export interface BurnScenario {
  name: string;
  burnRateMultiplier: number;
  exhaustionDate: Date | null;
  projectedTotal: number;
  probability: number;
}

export interface CategoryBurn {
  category: string;
  spent: number;
  budget: number;
  burnRate: number;
  percentConsumed: number;
  projectedOverrun: number;
}

// ============================================================================
// BURN RATE CALCULATOR
// ============================================================================

export class BurnRateCalculator {
  private projectEndDate: Date;

  constructor(projectEndDate: Date) {
    this.projectEndDate = projectEndDate;
  }

  // ---------------------------------------------------------------------------
  // CALCUL DU BURN RATE
  // ---------------------------------------------------------------------------

  /**
   * Calcule les métriques de burn rate à partir des dépenses budget
   */
  calculateBurnRate(budgetItems: BudgetItem[], startDate: Date, endDate: Date = new Date()): BurnRateMetrics {
    const dataPoints = this.buildBurnDataPoints(budgetItems, startDate, endDate);

    const totalBudget = budgetItems.reduce((sum, b) => sum + (b.montant_budgete || 0), 0);
    const totalSpent = budgetItems.reduce((sum, b) => sum + (b.montant_engage || 0), 0);

    if (dataPoints.length === 0) {
      return {
        currentBurnRate: 0,
        averageBurnRate: 0,
        peakBurnRate: 0,
        totalSpent,
        totalBudget,
        remainingBudget: totalBudget - totalSpent,
        percentConsumed: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        dataPoints: [],
      };
    }

    const dailyRates = dataPoints.map(dp => dp.dailyRate);
    const currentBurnRate = dailyRates[dailyRates.length - 1];
    const averageBurnRate = dailyRates.reduce((a, b) => a + b, 0) / dailyRates.length;
    const peakBurnRate = Math.max(...dailyRates);

    return {
      currentBurnRate: Math.round(currentBurnRate * 100) / 100,
      averageBurnRate: Math.round(averageBurnRate * 100) / 100,
      peakBurnRate: Math.round(peakBurnRate * 100) / 100,
      totalSpent,
      totalBudget,
      remainingBudget: totalBudget - totalSpent,
      percentConsumed: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 1000) / 10 : 0,
      dataPoints,
    };
  }

  private buildBurnDataPoints(budgetItems: BudgetItem[], startDate: Date, endDate: Date): BurnRateDataPoint[] {
    const dataPoints: BurnRateDataPoint[] = [];
    const totalBudget = budgetItems.reduce((sum, b) => sum + (b.montant_budgete || 0), 0);

    // Pour simplifier, on utilise le montant engagé réparti linéairement
    const totalSpent = budgetItems.reduce((sum, b) => sum + (b.montant_engage || 0), 0);
    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Créer des points hebdomadaires
    const weeksCount = Math.ceil(daysDiff / 7);
    const weeklySpend = totalSpent / weeksCount;

    let cumulativeSpent = 0;
    let currentDate = new Date(startDate);
    const runningRates: number[] = [];

    for (let week = 0; week < weeksCount; week++) {
      const weekEnd = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (weekEnd > endDate) break;

      cumulativeSpent += weeklySpend;
      const expectedProgress = (week + 1) / weeksCount;
      const cumulativePlanned = totalBudget * expectedProgress * (totalSpent / totalBudget || 0.5);

      const dailyRate = weeklySpend / 7;
      runningRates.push(dailyRate);

      const runningAverageRate = runningRates.reduce((a, b) => a + b, 0) / runningRates.length;

      dataPoints.push({
        date: new Date(weekEnd),
        cumulativeSpent: Math.round(cumulativeSpent * 100) / 100,
        cumulativePlanned: Math.round(cumulativePlanned * 100) / 100,
        dailyRate: Math.round(dailyRate * 100) / 100,
        runningAverageRate: Math.round(runningAverageRate * 100) / 100,
      });

      currentDate = weekEnd;
    }

    return dataPoints;
  }

  // ---------------------------------------------------------------------------
  // PROJECTIONS
  // ---------------------------------------------------------------------------

  /**
   * Projette la date d'épuisement du budget et les scénarios
   */
  projectBurn(metrics: BurnRateMetrics): BurnProjection {
    const { remainingBudget, averageBurnRate, currentBurnRate } = metrics;

    // Date d'épuisement basée sur le burn rate actuel
    let exhaustionDate: Date | null = null;
    let daysUntilExhaustion: number | null = null;

    if (currentBurnRate > 0 && remainingBudget > 0) {
      daysUntilExhaustion = Math.ceil(remainingBudget / currentBurnRate);
      exhaustionDate = new Date();
      exhaustionDate.setDate(exhaustionDate.getDate() + daysUntilExhaustion);
    }

    // Projection jusqu'à la fin du projet
    const daysToProjectEnd = Math.max(0, Math.ceil(
      (this.projectEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    ));
    const projectedEndSpend = metrics.totalSpent + (currentBurnRate * daysToProjectEnd);
    const variance = projectedEndSpend - metrics.totalBudget;

    // Niveau de risque
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    const overrunPercent = metrics.totalBudget > 0 ? (variance / metrics.totalBudget) * 100 : 0;

    if (overrunPercent <= 0) {
      riskLevel = 'low';
    } else if (overrunPercent <= 10) {
      riskLevel = 'medium';
    } else if (overrunPercent <= 25) {
      riskLevel = 'high';
    } else {
      riskLevel = 'critical';
    }

    // Scénarios
    const scenarios = {
      optimistic: this.createScenario('Optimiste', 0.8, metrics, daysToProjectEnd),
      realistic: this.createScenario('Réaliste', 1.0, metrics, daysToProjectEnd),
      pessimistic: this.createScenario('Pessimiste', 1.25, metrics, daysToProjectEnd),
    };

    return {
      exhaustionDate,
      daysUntilExhaustion,
      projectedEndSpend: Math.round(projectedEndSpend * 100) / 100,
      variance: Math.round(variance * 100) / 100,
      riskLevel,
      scenarios,
    };
  }

  private createScenario(
    name: string,
    multiplier: number,
    metrics: BurnRateMetrics,
    daysToEnd: number
  ): BurnScenario {
    const adjustedRate = metrics.currentBurnRate * multiplier;
    const projectedTotal = metrics.totalSpent + (adjustedRate * daysToEnd);

    let exhaustionDate: Date | null = null;
    if (adjustedRate > 0 && metrics.remainingBudget > 0) {
      const daysToExhaustion = Math.ceil(metrics.remainingBudget / adjustedRate);
      exhaustionDate = new Date();
      exhaustionDate.setDate(exhaustionDate.getDate() + daysToExhaustion);
    }

    // Probabilités simplifiées
    const probability = name === 'Réaliste' ? 0.6 : name === 'Optimiste' ? 0.2 : 0.2;

    return {
      name,
      burnRateMultiplier: multiplier,
      exhaustionDate,
      projectedTotal: Math.round(projectedTotal * 100) / 100,
      probability,
    };
  }

  // ---------------------------------------------------------------------------
  // ANALYSE PAR CATÉGORIE
  // ---------------------------------------------------------------------------

  analyzeByCategory(budgetItems: BudgetItem[]): CategoryBurn[] {
    const categories = new Map<string, BudgetItem[]>();

    for (const item of budgetItems) {
      const category = item.categorie || 'Non catégorisé';
      const existing = categories.get(category) || [];
      categories.set(category, [...existing, item]);
    }

    const results: CategoryBurn[] = [];

    for (const [category, items] of categories) {
      const spent = items.reduce((sum, i) => sum + (i.montant_engage || 0), 0);
      const budget = items.reduce((sum, i) => sum + (i.montant_budgete || 0), 0);
      const percentConsumed = budget > 0 ? (spent / budget) * 100 : 0;

      // Calculer le burn rate par catégorie
      const daysSinceStart = 90; // Simplification: 90 jours
      const burnRate = spent / daysSinceStart;

      // Projection de dépassement
      const daysRemaining = Math.max(0, Math.ceil(
        (this.projectEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ));
      const projectedTotal = spent + (burnRate * daysRemaining);
      const projectedOverrun = Math.max(0, projectedTotal - budget);

      results.push({
        category,
        spent: Math.round(spent * 100) / 100,
        budget: Math.round(budget * 100) / 100,
        burnRate: Math.round(burnRate * 100) / 100,
        percentConsumed: Math.round(percentConsumed * 10) / 10,
        projectedOverrun: Math.round(projectedOverrun * 100) / 100,
      });
    }

    return results.sort((a, b) => b.percentConsumed - a.percentConsumed);
  }

  // ---------------------------------------------------------------------------
  // ALERTES
  // ---------------------------------------------------------------------------

  /**
   * Génère des alertes basées sur le burn rate
   */
  generateAlerts(metrics: BurnRateMetrics, projection: BurnProjection): Array<{
    type: 'budget_exhaustion' | 'overrun_risk' | 'burn_spike' | 'underspend';
    severity: 'info' | 'warning' | 'critical';
    message: string;
  }> {
    const alerts: Array<{
      type: 'budget_exhaustion' | 'overrun_risk' | 'burn_spike' | 'underspend';
      severity: 'info' | 'warning' | 'critical';
      message: string;
    }> = [];

    // Alerte épuisement budget avant fin projet
    if (projection.exhaustionDate && projection.exhaustionDate < this.projectEndDate) {
      const daysEarly = Math.ceil(
        (this.projectEndDate.getTime() - projection.exhaustionDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        type: 'budget_exhaustion',
        severity: 'critical',
        message: `Budget épuisé ${daysEarly} jours avant la fin du projet (${projection.exhaustionDate.toLocaleDateString('fr-FR')})`,
      });
    }

    // Alerte risque de dépassement
    if (projection.variance > 0) {
      const overrunPercent = metrics.totalBudget > 0 ? (projection.variance / metrics.totalBudget) * 100 : 0;
      alerts.push({
        type: 'overrun_risk',
        severity: overrunPercent > 15 ? 'critical' : 'warning',
        message: `Risque de dépassement de ${Math.round(projection.variance).toLocaleString('fr-FR')}€ (${Math.round(overrunPercent)}%)`,
      });
    }

    // Alerte pic de dépenses
    if (metrics.currentBurnRate > metrics.averageBurnRate * 1.5) {
      alerts.push({
        type: 'burn_spike',
        severity: 'warning',
        message: `Burn rate actuel (${metrics.currentBurnRate.toLocaleString('fr-FR')}€/jour) supérieur de 50% à la moyenne`,
      });
    }

    // Alerte sous-consommation
    if (metrics.percentConsumed < 30 && projection.daysUntilExhaustion && projection.daysUntilExhaustion > 365) {
      alerts.push({
        type: 'underspend',
        severity: 'info',
        message: `Sous-consommation détectée: seulement ${metrics.percentConsumed}% du budget utilisé`,
      });
    }

    return alerts;
  }

  // ---------------------------------------------------------------------------
  // CONFIGURATION
  // ---------------------------------------------------------------------------

  setProjectEndDate(date: Date): void {
    this.projectEndDate = date;
  }
}

export default BurnRateCalculator;
