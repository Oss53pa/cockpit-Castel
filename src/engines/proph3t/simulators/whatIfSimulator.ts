// ============================================================================
// PROPH3T ENGINE V2 — SIMULATEUR WHAT-IF
// ============================================================================
// Moteur de simulation de scénarios avec calcul d'impact en cascade
// ============================================================================

import type {
  WhatIfScenario,
  ScenarioVariable,
  SimulationResult,
  CascadeEffect,
  DeltaResult,
  ConfidenceScore,
  ProjectState,
  ScenarioComparison,
  MonteCarloResult,
  VarianceRange,
} from '../core/types';
import {
  PREBUILT_SCENARIOS,
  getConfidenceLevel,
  MODULE_LABELS,
  MONTE_CARLO_CONFIG,
} from '../core/constants';
import { CorrelationEngine } from '../analyzers/correlationEngine';

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class WhatIfSimulator {
  private correlationEngine: CorrelationEngine;

  constructor(correlationEngine?: CorrelationEngine) {
    this.correlationEngine = correlationEngine || new CorrelationEngine();
  }

  // ==========================================================================
  // SIMULATION PRINCIPALE
  // ==========================================================================

  /**
   * Simule un scénario complet et retourne les résultats
   */
  public simulate(
    scenario: WhatIfScenario,
    baselineState: ProjectState
  ): SimulationResult {
    // 1. Calculer les impacts directs de chaque variable
    let totalCostImpact = 0;
    let totalScheduleImpact = 0;
    let totalRevenueImpact = 0;
    const allCascades: CascadeEffect[] = [];

    for (const variable of scenario.variables) {
      const directImpact = this.calculateDirectVariableImpact(
        variable,
        baselineState
      );

      totalCostImpact += directImpact.cost;
      totalScheduleImpact += directImpact.schedule;
      totalRevenueImpact += directImpact.revenue;

      // 2. Propager via le moteur de corrélation
      const change = {
        module: variable.module,
        parameter: variable.parameter,
        oldValue: variable.baselineValue,
        newValue: variable.scenarioValue,
        changePercent: this.calculateChangePercent(variable),
        changedAt: new Date(),
      };

      const propagatedImpact = this.correlationEngine.calculatePropagatedImpact(
        change,
        baselineState,
        3 // Profondeur max
      );

      totalCostImpact += propagatedImpact.costImpact * 0.5; // Pondérer les cascades
      totalScheduleImpact += propagatedImpact.scheduleImpact * 0.5;
      totalRevenueImpact += propagatedImpact.revenueImpact * 0.5;
      allCascades.push(...propagatedImpact.cascadeEffects);
    }

    // 3. Dédupliquer les cascades
    const uniqueCascades = this.deduplicateCascades(allCascades);

    // 4. Calculer le score de risque
    const riskScore = this.calculateRiskScore(
      totalCostImpact,
      totalScheduleImpact,
      totalRevenueImpact,
      uniqueCascades,
      baselineState
    );

    // 5. Générer la narrative
    const narrative = this.generateNarrative(
      scenario,
      totalCostImpact,
      totalScheduleImpact,
      totalRevenueImpact,
      uniqueCascades
    );

    // 6. Calculer la confiance
    const confidence = this.calculateSimulationConfidence(
      scenario,
      uniqueCascades
    );

    return {
      costImpact: Math.round(totalCostImpact),
      scheduleImpact: Math.round(totalScheduleImpact),
      revenueImpact: Math.round(totalRevenueImpact),
      riskScore,
      cascadeEffects: uniqueCascades,
      narrative,
      confidence,
    };
  }

  /**
   * Simule et compare au baseline
   */
  public simulateWithComparison(
    scenario: WhatIfScenario,
    baselineState: ProjectState
  ): WhatIfScenario {
    const results = this.simulate(scenario, baselineState);

    // Calculer les deltas par rapport au baseline
    const comparedToBaseline: DeltaResult = {
      costDelta: results.costImpact,
      costDeltaPercent: (results.costImpact / baselineState.currentMetrics.budgetTotal) * 100,
      scheduleDelta: results.scheduleImpact,
      scheduleDeltaPercent: (results.scheduleImpact / baselineState.currentMetrics.joursRestants) * 100,
      revenueDelta: results.revenueImpact,
      revenueDeltaPercent: baselineState.currentMetrics.revenuPrevisionnel > 0
        ? (results.revenueImpact / baselineState.currentMetrics.revenuPrevisionnel) * 100
        : 0,
      riskScoreDelta: results.riskScore - 50, // Baseline assumé à 50
    };

    return {
      ...scenario,
      results,
      comparedToBaseline,
    };
  }

  // ==========================================================================
  // SCÉNARIOS PRÉ-CONSTRUITS
  // ==========================================================================

  /**
   * Retourne les scénarios pré-construits pour un type de projet
   */
  public getPrebuiltScenarios(projectType: string = 'shopping_center'): WhatIfScenario[] {
    return PREBUILT_SCENARIOS.map(config => ({
      id: config.id,
      name: config.name,
      description: config.description,
      category: config.category,
      variables: config.variables,
      isPrebuilt: true,
      results: {
        costImpact: 0,
        scheduleImpact: 0,
        revenueImpact: 0,
        riskScore: 0,
        cascadeEffects: [],
        narrative: '',
        confidence: { value: 0, level: 'low', factors: [], dataQuality: 0 },
      },
      comparedToBaseline: {
        costDelta: 0,
        costDeltaPercent: 0,
        scheduleDelta: 0,
        scheduleDeltaPercent: 0,
        revenueDelta: 0,
        revenueDeltaPercent: 0,
        riskScoreDelta: 0,
      },
    }));
  }

  /**
   * Construit un scénario personnalisé
   */
  public buildCustomScenario(
    name: string,
    description: string,
    variables: ScenarioVariable[]
  ): WhatIfScenario {
    return {
      id: `custom-${Date.now()}`,
      name,
      description,
      category: 'custom',
      variables,
      isPrebuilt: false,
      results: {
        costImpact: 0,
        scheduleImpact: 0,
        revenueImpact: 0,
        riskScore: 0,
        cascadeEffects: [],
        narrative: '',
        confidence: { value: 0, level: 'low', factors: [], dataQuality: 0 },
      },
      comparedToBaseline: {
        costDelta: 0,
        costDeltaPercent: 0,
        scheduleDelta: 0,
        scheduleDeltaPercent: 0,
        revenueDelta: 0,
        revenueDeltaPercent: 0,
        riskScoreDelta: 0,
      },
    };
  }

  // ==========================================================================
  // COMPARAISON DE SCÉNARIOS
  // ==========================================================================

  /**
   * Compare plusieurs scénarios côte à côte
   */
  public compareScenarios(
    scenarios: WhatIfScenario[],
    baselineState: ProjectState
  ): ScenarioComparison {
    // Simuler chaque scénario
    const simulatedScenarios = scenarios.map(s =>
      this.simulateWithComparison(s, baselineState)
    );

    // Créer la matrice de comparaison
    const comparisonMatrix = simulatedScenarios.map((scenario, index) => {
      const costRank = this.calculateRank(
        simulatedScenarios,
        s => s.results.costImpact,
        index,
        true // Lower is better
      );
      const scheduleRank = this.calculateRank(
        simulatedScenarios,
        s => s.results.scheduleImpact,
        index,
        true
      );
      const revenueRank = this.calculateRank(
        simulatedScenarios,
        s => s.results.revenueImpact,
        index,
        false // Higher is better (less negative)
      );

      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        costRank,
        scheduleRank,
        revenueRank,
        overallRank: Math.round((costRank + scheduleRank + revenueRank) / 3),
      };
    });

    // Identifier le meilleur et le pire scénario
    const sortedByOverall = [...comparisonMatrix].sort(
      (a, b) => a.overallRank - b.overallRank
    );

    const bestCase = sortedByOverall[0]?.scenarioName || '';
    const worstCase = sortedByOverall[sortedByOverall.length - 1]?.scenarioName || '';

    // Générer la recommandation
    const recommendation = this.generateComparisonRecommendation(
      simulatedScenarios,
      comparisonMatrix
    );

    return {
      scenarios: simulatedScenarios,
      bestCase,
      worstCase,
      recommendation,
      comparisonMatrix,
    };
  }

  // ==========================================================================
  // MONTE CARLO
  // ==========================================================================

  /**
   * Simulation Monte Carlo simplifiée
   */
  public monteCarloSimulation(
    baseScenario: WhatIfScenario,
    baselineState: ProjectState,
    varianceRanges: VarianceRange[],
    iterations: number = MONTE_CARLO_CONFIG.defaultIterations
  ): MonteCarloResult {
    const startTime = Date.now();
    const results: { cost: number; schedule: number; revenue: number }[] = [];

    // Limiter les itérations
    const actualIterations = Math.min(iterations, MONTE_CARLO_CONFIG.maxIterations);

    for (let i = 0; i < actualIterations; i++) {
      // Créer une variation du scénario
      const variedScenario = this.applyVariance(baseScenario, varianceRanges);

      // Simuler
      const simResult = this.simulate(variedScenario, baselineState);

      results.push({
        cost: simResult.costImpact,
        schedule: simResult.scheduleImpact,
        revenue: simResult.revenueImpact,
      });
    }

    // Calculer les statistiques
    const costs = results.map(r => r.cost).sort((a, b) => a - b);
    const schedules = results.map(r => r.schedule).sort((a, b) => a - b);
    const revenues = results.map(r => r.revenue).sort((a, b) => a - b);

    const executionTimeMs = Date.now() - startTime;

    return {
      iterations: actualIterations,
      costImpact: {
        mean: this.mean(costs),
        median: this.median(costs),
        p10: this.percentile(costs, 10),
        p90: this.percentile(costs, 90),
        stdDev: this.stdDev(costs),
      },
      scheduleImpact: {
        mean: this.mean(schedules),
        median: this.median(schedules),
        p10: this.percentile(schedules, 10),
        p90: this.percentile(schedules, 90),
        stdDev: this.stdDev(schedules),
      },
      revenueImpact: {
        mean: this.mean(revenues),
        median: this.median(revenues),
        p10: this.percentile(revenues, 10),
        p90: this.percentile(revenues, 90),
        stdDev: this.stdDev(revenues),
      },
      probabilityOfSuccess: this.calculateSuccessProbability(results),
      executionTimeMs,
    };
  }

  // ==========================================================================
  // CALCULS D'IMPACT
  // ==========================================================================

  private calculateDirectVariableImpact(
    variable: ScenarioVariable,
    state: ProjectState
  ): { cost: number; schedule: number; revenue: number } {
    const delta = variable.scenarioValue - variable.baselineValue;
    const deltaPct = this.calculateChangePercent(variable);

    switch (variable.module) {
      case 'budget':
        return this.calculateBudgetImpact(variable, delta, deltaPct, state);
      case 'planning':
      case 'technique':
      case 'construction':
        return this.calculateScheduleImpact(variable, delta, deltaPct, state);
      case 'commercialisation':
        return this.calculateCommercialImpact(variable, delta, deltaPct, state);
      default:
        return { cost: 0, schedule: 0, revenue: 0 };
    }
  }

  private calculateBudgetImpact(
    variable: ScenarioVariable,
    delta: number,
    deltaPct: number,
    state: ProjectState
  ): { cost: number; schedule: number; revenue: number } {
    const budgetTotal = state.currentMetrics.budgetTotal;

    if (variable.parameter.includes('multiplier')) {
      // C'est un multiplicateur (ex: 1.15 = +15%)
      const surcoût = budgetTotal * (variable.scenarioValue - 1);
      return {
        cost: surcoût,
        schedule: Math.round(deltaPct * 2), // Approximation
        revenue: 0,
      };
    }

    return {
      cost: delta,
      schedule: 0,
      revenue: 0,
    };
  }

  private calculateScheduleImpact(
    variable: ScenarioVariable,
    delta: number,
    deltaPct: number,
    state: ProjectState
  ): { cost: number; schedule: number; revenue: number } {
    const budgetTotal = state.currentMetrics.budgetTotal;
    const revenuMensuel = state.currentMetrics.revenuPrevisionnel / 12;

    if (variable.parameter.includes('delay')) {
      // Retard en jours
      const joursRetard = variable.scenarioValue;
      const surcoûtPortage = (budgetTotal * 0.005) * (joursRetard / 30); // 0.5% par mois
      const manqueGagner = (revenuMensuel / 30) * joursRetard;

      return {
        cost: surcoûtPortage,
        schedule: joursRetard,
        revenue: -manqueGagner,
      };
    }

    if (variable.parameter.includes('multiplier')) {
      // Multiplicateur de ressources (accélération)
      const surcoût = budgetTotal * 0.1 * (variable.scenarioValue - 1);
      const joursGagnés = -Math.round(state.currentMetrics.joursRestants * 0.1 * (variable.scenarioValue - 1));

      return {
        cost: surcoût,
        schedule: joursGagnés,
        revenue: 0,
      };
    }

    return { cost: 0, schedule: 0, revenue: 0 };
  }

  private calculateCommercialImpact(
    variable: ScenarioVariable,
    delta: number,
    deltaPct: number,
    state: ProjectState
  ): { cost: number; schedule: number; revenue: number } {
    const revenuAnnuel = state.currentMetrics.revenuPrevisionnel;

    if (variable.parameter.includes('occupancy')) {
      // Impact sur le taux d'occupation
      const impactRevenu = revenuAnnuel * (delta / 100);
      return {
        cost: 0,
        schedule: 0,
        revenue: impactRevenu,
      };
    }

    if (variable.parameter.includes('anchor')) {
      // Impact locataire ancre
      if (variable.scenarioValue === 0) {
        // Désistement ancre
        const perteDirecte = revenuAnnuel * 0.2 * 0.7; // 20% surface, -30% loyer
        const perteIndirecte = revenuAnnuel * 0.15; // Impact attractivité
        return {
          cost: 0,
          schedule: 30, // Retard probable
          revenue: -(perteDirecte + perteIndirecte),
        };
      }
    }

    if (variable.parameter.includes('delay')) {
      // Retard signature
      const impactRetard = revenuAnnuel * (variable.scenarioValue / 365);
      return {
        cost: 0,
        schedule: variable.scenarioValue,
        revenue: -impactRetard,
      };
    }

    return { cost: 0, schedule: 0, revenue: 0 };
  }

  // ==========================================================================
  // UTILITAIRES
  // ==========================================================================

  private calculateChangePercent(variable: ScenarioVariable): number {
    if (variable.baselineValue === 0) {
      return variable.scenarioValue > 0 ? 100 : 0;
    }
    return ((variable.scenarioValue - variable.baselineValue) / variable.baselineValue) * 100;
  }

  private calculateRiskScore(
    costImpact: number,
    scheduleImpact: number,
    revenueImpact: number,
    cascades: CascadeEffect[],
    state: ProjectState
  ): number {
    let score = 50; // Base

    // Impact coût
    const costPct = (costImpact / state.currentMetrics.budgetTotal) * 100;
    if (costPct > 15) score += 20;
    else if (costPct > 10) score += 15;
    else if (costPct > 5) score += 10;

    // Impact planning
    if (scheduleImpact > 60) score += 25;
    else if (scheduleImpact > 30) score += 15;
    else if (scheduleImpact > 14) score += 8;

    // Impact revenu
    const revPct = Math.abs(revenueImpact / Math.max(1, state.currentMetrics.revenuPrevisionnel)) * 100;
    if (revPct > 20) score += 15;
    else if (revPct > 10) score += 10;

    // Cascades
    const majorCascades = cascades.filter(c => c.severity === 'major').length;
    score += majorCascades * 3;

    return Math.min(100, Math.round(score));
  }

  private generateNarrative(
    scenario: WhatIfScenario,
    costImpact: number,
    scheduleImpact: number,
    revenueImpact: number,
    cascades: CascadeEffect[]
  ): string {
    const parts: string[] = [];

    parts.push(`Scénario "${scenario.name}" :`);

    if (costImpact > 0) {
      parts.push(`surcoût de ${this.formatAmount(costImpact)} FCFA`);
    }

    if (scheduleImpact > 0) {
      parts.push(`retard de ${scheduleImpact} jours`);
    } else if (scheduleImpact < 0) {
      parts.push(`gain de ${Math.abs(scheduleImpact)} jours`);
    }

    if (revenueImpact < 0) {
      parts.push(`perte de revenus de ${this.formatAmount(Math.abs(revenueImpact))} FCFA/an`);
    }

    if (cascades.length > 0) {
      const majorCount = cascades.filter(c => c.severity === 'major').length;
      if (majorCount > 0) {
        parts.push(`${majorCount} effet(s) cascade majeur(s)`);
      }
    }

    return parts.join(', ').replace(/:,/, ':') + '.';
  }

  private calculateSimulationConfidence(
    scenario: WhatIfScenario,
    cascades: CascadeEffect[]
  ): ConfidenceScore {
    let score = 75;

    // Pénalité si beaucoup de variables
    score -= scenario.variables.length * 5;

    // Pénalité si beaucoup de cascades
    score -= cascades.length * 2;

    // Bonus si scénario pré-construit (validé)
    if (scenario.isPrebuilt) score += 10;

    score = Math.max(40, Math.min(90, score));

    return {
      value: score,
      level: getConfidenceLevel(score),
      factors: [
        `${scenario.variables.length} variable(s) modifiée(s)`,
        `${cascades.length} effet(s) cascade`,
        scenario.isPrebuilt ? 'Scénario validé' : 'Scénario personnalisé',
      ],
      dataQuality: scenario.isPrebuilt ? 80 : 65,
    };
  }

  private deduplicateCascades(cascades: CascadeEffect[]): CascadeEffect[] {
    const seen = new Map<string, CascadeEffect>();
    for (const cascade of cascades) {
      const key = `${cascade.sourceModule}->${cascade.targetModule}`;
      const existing = seen.get(key);
      if (!existing || this.severityWeight(cascade.severity) > this.severityWeight(existing.severity)) {
        seen.set(key, cascade);
      }
    }
    return Array.from(seen.values());
  }

  private severityWeight(severity: string): number {
    switch (severity) {
      case 'major': return 3;
      case 'moderate': return 2;
      case 'minor': return 1;
      default: return 0;
    }
  }

  private calculateRank(
    scenarios: WhatIfScenario[],
    getValue: (s: WhatIfScenario) => number,
    currentIndex: number,
    lowerIsBetter: boolean
  ): number {
    const values = scenarios.map(getValue);
    const sorted = [...values].sort((a, b) => lowerIsBetter ? a - b : b - a);
    return sorted.indexOf(values[currentIndex]) + 1;
  }

  private generateComparisonRecommendation(
    scenarios: WhatIfScenario[],
    matrix: any[]
  ): string {
    const best = matrix.find(m => m.overallRank === 1);
    if (!best) return 'Analyse insuffisante pour formuler une recommandation.';

    const bestScenario = scenarios.find(s => s.id === best.scenarioId);
    if (!bestScenario) return '';

    return `Le scénario "${bestScenario.name}" présente le meilleur équilibre risque/impact. ` +
      `Impact coût: ${this.formatAmount(bestScenario.results.costImpact)} FCFA, ` +
      `retard: ${bestScenario.results.scheduleImpact} jours.`;
  }

  private applyVariance(
    scenario: WhatIfScenario,
    varianceRanges: VarianceRange[]
  ): WhatIfScenario {
    const variedVariables = scenario.variables.map(v => {
      const range = varianceRanges.find(
        r => r.variable === v.parameter && r.module === v.module
      );

      if (!range) return v;

      let variedValue: number;
      switch (range.distribution) {
        case 'uniform':
          variedValue = range.min + Math.random() * (range.max - range.min);
          break;
        case 'normal':
          variedValue = this.randomNormal(
            (range.min + range.max) / 2,
            (range.max - range.min) / 4
          );
          break;
        case 'triangular':
        default:
          variedValue = this.randomTriangular(
            range.min,
            (range.min + range.max) / 2,
            range.max
          );
      }

      return { ...v, scenarioValue: variedValue };
    });

    return { ...scenario, variables: variedVariables };
  }

  private randomNormal(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
  }

  private randomTriangular(min: number, mode: number, max: number): number {
    const u = Math.random();
    const fc = (mode - min) / (max - min);
    if (u < fc) {
      return min + Math.sqrt(u * (max - min) * (mode - min));
    }
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }

  private mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private median(sortedValues: number[]): number {
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2
      ? sortedValues[mid]
      : (sortedValues[mid - 1] + sortedValues[mid]) / 2;
  }

  private percentile(sortedValues: number[], p: number): number {
    const index = (p / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sortedValues[lower];
    return sortedValues[lower] * (upper - index) + sortedValues[upper] * (index - lower);
  }

  private stdDev(values: number[]): number {
    const avg = this.mean(values);
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  private calculateSuccessProbability(
    results: { cost: number; schedule: number; revenue: number }[]
  ): number {
    // Définir le succès : coût < 10% budget, retard < 30j, revenus > -10%
    const successCount = results.filter(r =>
      r.cost < 50_000_000 && r.schedule < 30 && r.revenue > -50_000_000
    ).length;
    return (successCount / results.length) * 100;
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

export default WhatIfSimulator;
