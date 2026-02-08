// ============================================================================
// PROPH3T ENGINE V2 — MOTEUR DE CORRÉLATION CROSS-MODULE
// ============================================================================
// Détection des effets domino et corrélations entre modules
// ============================================================================

import type {
  CascadeEffect,
  CascadeSeverity,
  ConfidenceScore,
  DiscoveredCorrelation,
  ModuleChange,
  ModuleCorrelation,
  ProjectEvent,
  ProjectModule,
  ProjectSnapshot,
  ProjectState,
  SimulationResult,
} from '../core/types';
import {
  MODULE_CORRELATIONS,
  MODULE_LABELS,
  getConfidenceLevel,
} from '../core/constants';

// ============================================================================
// TYPES INTERNES
// ============================================================================

interface PropagationNode {
  module: ProjectModule;
  depth: number;
  impact: number;
  lag: number;
  path: ProjectModule[];
}

interface CorrelationAnalysis {
  sourceModule: ProjectModule;
  targetModule: ProjectModule;
  correlation: number;
  pValue: number;
  sampleSize: number;
  lag: number;
}

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class CorrelationEngine {
  private correlationMatrix: ModuleCorrelation[];
  private discoveredCorrelations: DiscoveredCorrelation[] = [];

  constructor(customCorrelations?: ModuleCorrelation[]) {
    // Utiliser les corrélations personnalisées ou les défauts
    this.correlationMatrix = customCorrelations || MODULE_CORRELATIONS;
  }

  // ==========================================================================
  // DÉTECTION DES EFFETS CASCADE
  // ==========================================================================

  /**
   * Détecte les effets cascade à partir d'un événement déclencheur
   */
  public detectCascadeEffects(
    triggerEvents: ProjectEvent[],
    currentState: ProjectState
  ): CascadeEffect[] {
    const allCascades: CascadeEffect[] = [];

    for (const event of triggerEvents) {
      const cascades = this.propagateFromEvent(event, currentState);
      allCascades.push(...cascades);
    }

    // Dédupliquer et fusionner les cascades similaires
    return this.deduplicateCascades(allCascades);
  }

  /**
   * Propage un événement à travers le graphe de corrélations
   */
  private propagateFromEvent(
    event: ProjectEvent,
    currentState: ProjectState,
    maxDepth: number = 3
  ): CascadeEffect[] {
    const cascades: CascadeEffect[] = [];
    const visited = new Set<string>();
    const queue: PropagationNode[] = [{
      module: event.module,
      depth: 0,
      impact: this.getSeverityWeight(event.severity),
      lag: 0,
      path: [event.module],
    }];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.depth >= maxDepth) continue;

      // Trouver les corrélations sortantes
      const outgoingCorrelations = this.correlationMatrix.filter(
        c => c.source === current.module
      );

      for (const correlation of outgoingCorrelations) {
        const key = `${current.module}->${correlation.target}`;
        if (visited.has(key)) continue;
        visited.add(key);

        // Calculer l'impact propagé (atténuation selon la force)
        const propagatedImpact = current.impact * correlation.strength;

        // Ne pas propager si l'impact est trop faible
        if (propagatedImpact < 0.2) continue;

        // Créer l'effet cascade
        const cascade: CascadeEffect = {
          id: `cascade-${event.id}-${key}`,
          sourceModule: current.module,
          targetModule: correlation.target,
          description: this.generateCascadeDescription(
            current.module,
            correlation.target,
            event,
            correlation
          ),
          severity: this.impactToSeverity(propagatedImpact),
          lagDays: this.parseLag(correlation.lag),
          quantifiedImpact: this.estimateQuantifiedImpact(
            correlation.target,
            propagatedImpact,
            currentState
          ),
        };

        cascades.push(cascade);

        // Ajouter à la queue pour continuer la propagation
        queue.push({
          module: correlation.target,
          depth: current.depth + 1,
          impact: propagatedImpact,
          lag: current.lag + this.parseLag(correlation.lag),
          path: [...current.path, correlation.target],
        });
      }
    }

    return cascades;
  }

  // ==========================================================================
  // CALCUL D'IMPACT PROPAGÉ
  // ==========================================================================

  /**
   * Calcule l'impact total d'un changement avec propagation
   */
  public calculatePropagatedImpact(
    change: ModuleChange,
    currentState: ProjectState,
    depth: number = 3
  ): SimulationResult {
    let totalCostImpact = 0;
    let totalScheduleImpact = 0;
    let totalRevenueImpact = 0;
    const cascadeEffects: CascadeEffect[] = [];

    // Impact direct du changement
    const directImpact = this.calculateDirectImpact(change, currentState);
    totalCostImpact += directImpact.cost;
    totalScheduleImpact += directImpact.schedule;
    totalRevenueImpact += directImpact.revenue;

    // Propager l'impact
    const visited = new Set<ProjectModule>();
    const queue: { module: ProjectModule; impactMultiplier: number; currentDepth: number }[] = [
      { module: change.module, impactMultiplier: 1, currentDepth: 0 }
    ];

    while (queue.length > 0) {
      const { module, impactMultiplier, currentDepth } = queue.shift()!;

      if (currentDepth >= depth) continue;
      if (visited.has(module) && currentDepth > 0) continue;
      visited.add(module);

      // Trouver les corrélations sortantes
      const correlations = this.correlationMatrix.filter(c => c.source === module);

      for (const corr of correlations) {
        const propagatedMultiplier = impactMultiplier * corr.strength;
        if (propagatedMultiplier < 0.1) continue;

        // Calculer l'impact sur le module cible
        const moduleImpact = this.calculateModuleImpact(
          corr.target,
          change,
          propagatedMultiplier,
          currentState
        );

        totalCostImpact += moduleImpact.cost;
        totalScheduleImpact += moduleImpact.schedule;
        totalRevenueImpact += moduleImpact.revenue;

        // Créer l'effet cascade
        cascadeEffects.push({
          id: `cascade-${module}-${corr.target}`,
          sourceModule: module,
          targetModule: corr.target,
          description: corr.description || `Impact de ${MODULE_LABELS[module]} sur ${MODULE_LABELS[corr.target]}`,
          severity: this.impactToSeverity(propagatedMultiplier),
          lagDays: this.parseLag(corr.lag),
          quantifiedImpact: {
            metric: 'impact_multiplier',
            value: propagatedMultiplier,
            unit: 'ratio',
          },
        });

        // Continuer la propagation
        queue.push({
          module: corr.target,
          impactMultiplier: propagatedMultiplier,
          currentDepth: currentDepth + 1,
        });
      }
    }

    // Calculer le score de risque
    const riskScore = this.calculateRiskScore(
      totalCostImpact,
      totalScheduleImpact,
      totalRevenueImpact,
      cascadeEffects
    );

    // Générer la narrative
    const narrative = this.generateImpactNarrative(
      change,
      totalCostImpact,
      totalScheduleImpact,
      totalRevenueImpact,
      cascadeEffects
    );

    return {
      costImpact: Math.round(totalCostImpact),
      scheduleImpact: Math.round(totalScheduleImpact),
      revenueImpact: Math.round(totalRevenueImpact),
      riskScore,
      cascadeEffects,
      narrative,
      confidence: this.calculatePropagationConfidence(cascadeEffects, depth),
    };
  }

  // ==========================================================================
  // DÉCOUVERTE DE CORRÉLATIONS
  // ==========================================================================

  /**
   * Identifie les corrélations cachées dans les données historiques
   */
  public discoverCorrelations(
    historicalData: ProjectSnapshot[],
    minCorrelation: number = 0.6
  ): DiscoveredCorrelation[] {
    const discovered: DiscoveredCorrelation[] = [];

    if (historicalData.length < 10) {
      // Pas assez de données pour découvrir des corrélations fiables
      return discovered;
    }

    const modules: ProjectModule[] = [
      'budget', 'planning', 'commercialisation', 'technique',
      'rh', 'marketing', 'exploitation', 'construction'
    ];

    // Pour chaque paire de modules
    for (let i = 0; i < modules.length; i++) {
      for (let j = 0; j < modules.length; j++) {
        if (i === j) continue;

        const source = modules[i];
        const target = modules[j];

        // Tester différents lags (0, 7, 14, 30 jours)
        for (const lagDays of [0, 7, 14, 30]) {
          const analysis = this.analyzeCorrelation(
            historicalData,
            source,
            target,
            lagDays
          );

          if (analysis && Math.abs(analysis.correlation) >= minCorrelation) {
            discovered.push({
              source,
              target,
              lag: `${lagDays}d`,
              strength: Math.abs(analysis.correlation),
              description: this.generateCorrelationDescription(
                source,
                target,
                analysis.correlation,
                lagDays
              ),
              observations: analysis.sampleSize,
              confidenceInterval: {
                lower: analysis.correlation - 0.1,
                upper: analysis.correlation + 0.1,
              },
            });
          }
        }
      }
    }

    // Trier par force de corrélation
    discovered.sort((a, b) => b.strength - a.strength);

    // Garder les N meilleures
    this.discoveredCorrelations = discovered.slice(0, 20);

    return this.discoveredCorrelations;
  }

  /**
   * Analyse la corrélation entre deux modules
   */
  private analyzeCorrelation(
    data: ProjectSnapshot[],
    source: ProjectModule,
    target: ProjectModule,
    lagDays: number
  ): CorrelationAnalysis | null {
    // Extraire les métriques principales de chaque module
    const sourceMetric = this.getModuleMainMetric(source);
    const targetMetric = this.getModuleMainMetric(target);

    if (!sourceMetric || !targetMetric) return null;

    // Préparer les séries temporelles avec lag
    const pairs: { x: number; y: number }[] = [];

    for (let i = 0; i < data.length; i++) {
      const sourceValue = this.extractMetricValue(data[i].metrics, sourceMetric);

      // Trouver la valeur cible avec le lag approprié
      const laggedIndex = this.findLaggedIndex(data, i, lagDays);
      if (laggedIndex >= 0 && laggedIndex < data.length) {
        const targetValue = this.extractMetricValue(data[laggedIndex].metrics, targetMetric);

        if (sourceValue !== null && targetValue !== null) {
          pairs.push({ x: sourceValue, y: targetValue });
        }
      }
    }

    if (pairs.length < 5) return null;

    // Calculer la corrélation de Pearson
    const correlation = this.pearsonCorrelation(pairs);

    return {
      sourceModule: source,
      targetModule: target,
      correlation,
      pValue: this.estimatePValue(correlation, pairs.length),
      sampleSize: pairs.length,
      lag: lagDays,
    };
  }

  /**
   * Calcule le coefficient de corrélation de Pearson
   */
  private pearsonCorrelation(pairs: { x: number; y: number }[]): number {
    const n = pairs.length;
    if (n === 0) return 0;

    const sumX = pairs.reduce((acc, p) => acc + p.x, 0);
    const sumY = pairs.reduce((acc, p) => acc + p.y, 0);
    const sumXY = pairs.reduce((acc, p) => acc + p.x * p.y, 0);
    const sumX2 = pairs.reduce((acc, p) => acc + p.x * p.x, 0);
    const sumY2 = pairs.reduce((acc, p) => acc + p.y * p.y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    if (denominator === 0) return 0;
    return numerator / denominator;
  }

  // ==========================================================================
  // ENRICHISSEMENT DE LA MATRICE
  // ==========================================================================

  /**
   * Enrichit la matrice de corrélation avec les corrélations découvertes
   */
  public enrichCorrelationMatrix(
    minStrength: number = 0.7,
    maxNewCorrelations: number = 5
  ): void {
    // Filtrer les corrélations découvertes suffisamment fortes
    const strongCorrelations = this.discoveredCorrelations
      .filter(c => c.strength >= minStrength)
      .slice(0, maxNewCorrelations);

    for (const discovered of strongCorrelations) {
      // Vérifier si cette corrélation existe déjà
      const exists = this.correlationMatrix.some(
        c => c.source === discovered.source && c.target === discovered.target
      );

      if (!exists) {
        this.correlationMatrix.push({
          source: discovered.source,
          target: discovered.target,
          lag: discovered.lag,
          strength: discovered.strength,
          description: discovered.description,
        });
      }
    }
  }

  // ==========================================================================
  // UTILITAIRES
  // ==========================================================================

  private getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'critical': return 1.0;
      case 'warning': return 0.6;
      case 'info': return 0.3;
      default: return 0.5;
    }
  }

  private impactToSeverity(impact: number): CascadeSeverity {
    if (impact >= 0.7) return 'major';
    if (impact >= 0.4) return 'moderate';
    return 'minor';
  }

  private parseLag(lag: string): number {
    const match = lag.match(/(\d+)d/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private generateCascadeDescription(
    source: ProjectModule,
    target: ProjectModule,
    event: ProjectEvent,
    correlation: ModuleCorrelation
  ): string {
    const sourceLabel = MODULE_LABELS[source];
    const targetLabel = MODULE_LABELS[target];
    const lagDays = this.parseLag(correlation.lag);

    if (correlation.description) {
      return correlation.description;
    }

    let desc = `Impact de ${sourceLabel} sur ${targetLabel}`;
    if (lagDays > 0) {
      desc += ` (effet visible dans ~${lagDays} jours)`;
    }
    return desc;
  }

  private estimateQuantifiedImpact(
    targetModule: ProjectModule,
    impactMultiplier: number,
    state: ProjectState
  ): { metric: string; value: number; unit: string } | undefined {
    switch (targetModule) {
      case 'budget':
        return {
          metric: 'surcoût_estimé',
          value: Math.round(state.currentMetrics.budgetTotal * impactMultiplier * 0.05),
          unit: 'FCFA',
        };
      case 'planning':
        return {
          metric: 'retard_estimé',
          value: Math.round(impactMultiplier * 15),
          unit: 'jours',
        };
      case 'commercialisation':
        return {
          metric: 'impact_occupation',
          value: Math.round(impactMultiplier * -5),
          unit: '%',
        };
      default:
        return undefined;
    }
  }

  private calculateDirectImpact(
    change: ModuleChange,
    state: ProjectState
  ): { cost: number; schedule: number; revenue: number } {
    const changeRatio = Math.abs(change.changePercent) / 100;

    switch (change.module) {
      case 'budget':
        return {
          cost: state.currentMetrics.budgetTotal * changeRatio,
          schedule: changeRatio * 30, // Approximation
          revenue: 0,
        };
      case 'planning':
      case 'technique':
      case 'construction':
        return {
          cost: state.currentMetrics.budgetTotal * changeRatio * 0.1,
          schedule: changeRatio * 60,
          revenue: state.currentMetrics.revenuPrevisionnel * changeRatio * -0.1,
        };
      case 'commercialisation':
        return {
          cost: 0,
          schedule: changeRatio * 15,
          revenue: state.currentMetrics.revenuPrevisionnel * changeRatio * -0.5,
        };
      default:
        return { cost: 0, schedule: 0, revenue: 0 };
    }
  }

  private calculateModuleImpact(
    module: ProjectModule,
    change: ModuleChange,
    multiplier: number,
    state: ProjectState
  ): { cost: number; schedule: number; revenue: number } {
    const baseImpact = Math.abs(change.changePercent) * multiplier / 100;

    switch (module) {
      case 'budget':
        return {
          cost: state.currentMetrics.budgetTotal * baseImpact * 0.05,
          schedule: 0,
          revenue: 0,
        };
      case 'planning':
        return {
          cost: 0,
          schedule: baseImpact * 20,
          revenue: 0,
        };
      case 'commercialisation':
        return {
          cost: 0,
          schedule: 0,
          revenue: state.currentMetrics.revenuPrevisionnel * baseImpact * -0.2,
        };
      default:
        return { cost: 0, schedule: 0, revenue: 0 };
    }
  }

  private calculateRiskScore(
    costImpact: number,
    scheduleImpact: number,
    revenueImpact: number,
    cascades: CascadeEffect[]
  ): number {
    let score = 0;

    // Impact coût (0-30 points)
    if (costImpact > 50_000_000) score += 30;
    else if (costImpact > 20_000_000) score += 20;
    else if (costImpact > 5_000_000) score += 10;

    // Impact planning (0-30 points)
    if (scheduleImpact > 60) score += 30;
    else if (scheduleImpact > 30) score += 20;
    else if (scheduleImpact > 7) score += 10;

    // Impact revenu (0-25 points)
    if (Math.abs(revenueImpact) > 100_000_000) score += 25;
    else if (Math.abs(revenueImpact) > 50_000_000) score += 15;
    else if (Math.abs(revenueImpact) > 10_000_000) score += 8;

    // Nombre de cascades (0-15 points)
    const majorCascades = cascades.filter(c => c.severity === 'major').length;
    score += Math.min(15, majorCascades * 5);

    return Math.min(100, score);
  }

  private generateImpactNarrative(
    change: ModuleChange,
    costImpact: number,
    scheduleImpact: number,
    revenueImpact: number,
    cascades: CascadeEffect[]
  ): string {
    const parts: string[] = [];
    const moduleLabel = MODULE_LABELS[change.module];

    parts.push(
      `Le changement sur ${moduleLabel} (${change.changePercent > 0 ? '+' : ''}${change.changePercent.toFixed(1)}%) ` +
      `génère des effets en cascade.`
    );

    if (costImpact > 1_000_000) {
      parts.push(`Impact budgétaire estimé : +${this.formatAmount(costImpact)} FCFA.`);
    }

    if (scheduleImpact > 7) {
      parts.push(`Retard potentiel : ${Math.round(scheduleImpact)} jours.`);
    }

    if (Math.abs(revenueImpact) > 10_000_000) {
      const sign = revenueImpact < 0 ? '-' : '+';
      parts.push(`Impact revenus : ${sign}${this.formatAmount(Math.abs(revenueImpact))} FCFA/an.`);
    }

    if (cascades.length > 0) {
      const majorCount = cascades.filter(c => c.severity === 'major').length;
      if (majorCount > 0) {
        parts.push(`${majorCount} effet(s) cascade majeur(s) identifié(s).`);
      }
    }

    return parts.join(' ');
  }

  private formatAmount(amount: number): string {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(1)} Md`;
    }
    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1)} M`;
    }
    if (amount >= 1_000) {
      return `${(amount / 1_000).toFixed(0)} k`;
    }
    return amount.toString();
  }

  private calculatePropagationConfidence(
    cascades: CascadeEffect[],
    depth: number
  ): ConfidenceScore {
    // Plus il y a de cascades et de profondeur, moins on est confiant
    let score = 80;
    score -= cascades.length * 2;
    score -= depth * 5;
    score = Math.max(30, Math.min(95, score));

    return {
      value: score,
      level: getConfidenceLevel(score),
      factors: [
        `${cascades.length} effets cascade identifiés`,
        `Profondeur de propagation : ${depth} niveaux`,
        'Basé sur la matrice de corrélation experte',
      ],
      dataQuality: 70,
    };
  }

  private getModuleMainMetric(module: ProjectModule): string | null {
    const metricMap: Partial<Record<ProjectModule, string>> = {
      budget: 'tauxEngagement',
      planning: 'avancementGlobal',
      commercialisation: 'tauxOccupation',
      technique: 'avancementConstruction',
      construction: 'avancementConstruction',
      rh: 'tauxRecrutement',
    };
    return metricMap[module] || null;
  }

  private extractMetricValue(metrics: any, metricKey: string): number | null {
    const value = metrics[metricKey];
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    return null;
  }

  private findLaggedIndex(
    data: ProjectSnapshot[],
    currentIndex: number,
    lagDays: number
  ): number {
    if (lagDays === 0) return currentIndex;

    const currentDate = data[currentIndex].date;
    const targetDate = new Date(currentDate);
    targetDate.setDate(targetDate.getDate() + lagDays);

    // Trouver l'index le plus proche
    let bestIndex = -1;
    let bestDiff = Infinity;

    for (let i = 0; i < data.length; i++) {
      const diff = Math.abs(data[i].date.getTime() - targetDate.getTime());
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIndex = i;
      }
    }

    return bestIndex;
  }

  private estimatePValue(correlation: number, n: number): number {
    // Approximation simplifiée
    const t = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
    // Pour n > 30, on peut approximer avec une distribution normale
    return Math.exp(-0.5 * t * t) * 2;
  }

  private generateCorrelationDescription(
    source: ProjectModule,
    target: ProjectModule,
    correlation: number,
    lagDays: number
  ): string {
    const sourceLabel = MODULE_LABELS[source];
    const targetLabel = MODULE_LABELS[target];
    const direction = correlation > 0 ? 'positive' : 'négative';
    const strength = Math.abs(correlation) > 0.8 ? 'forte' : 'modérée';

    let desc = `Corrélation ${strength} ${direction} entre ${sourceLabel} et ${targetLabel}`;
    if (lagDays > 0) {
      desc += ` (délai ~${lagDays} jours)`;
    }
    return desc;
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

  private severityWeight(severity: CascadeSeverity): number {
    switch (severity) {
      case 'major': return 3;
      case 'moderate': return 2;
      case 'minor': return 1;
    }
  }

  // ==========================================================================
  // ACCESSEURS
  // ==========================================================================

  /**
   * Retourne la matrice de corrélation actuelle
   */
  public getCorrelationMatrix(): ModuleCorrelation[] {
    return [...this.correlationMatrix];
  }

  /**
   * Retourne les corrélations découvertes
   */
  public getDiscoveredCorrelations(): DiscoveredCorrelation[] {
    return [...this.discoveredCorrelations];
  }

  /**
   * Retourne les corrélations pour un module source donné
   */
  public getCorrelationsFrom(module: ProjectModule): ModuleCorrelation[] {
    return this.correlationMatrix.filter(c => c.source === module);
  }

  /**
   * Retourne les corrélations vers un module cible donné
   */
  public getCorrelationsTo(module: ProjectModule): ModuleCorrelation[] {
    return this.correlationMatrix.filter(c => c.target === module);
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default CorrelationEngine;
