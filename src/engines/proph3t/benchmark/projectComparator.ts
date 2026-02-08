// ============================================================================
// PROPH3T ENGINE V2 — PROJECT COMPARATOR
// Comparaison avec des benchmarks et projets similaires
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export interface ProjectMetrics {
  id: string;
  name: string;
  type: string;
  startDate: Date;
  endDate?: Date;
  duration?: number; // jours
  budget: number;
  actualCost?: number;
  cpi?: number;
  spi?: number;
  completionRate: number;
  riskCount: number;
  delayDays: number;
  teamSize: number;
  complexity: 'low' | 'medium' | 'high' | 'very_high';
}

export interface BenchmarkData {
  id: string;
  name: string;
  source: 'internal' | 'industry' | 'custom';
  metrics: {
    avgDuration: number;
    avgBudgetVariance: number;
    avgCpi: number;
    avgSpi: number;
    avgDelayDays: number;
    successRate: number;
  };
  sampleSize: number;
  lastUpdated: Date;
}

export interface ComparisonResult {
  currentProject: ProjectMetrics;
  benchmark: BenchmarkData;
  comparisons: MetricComparison[];
  overallScore: number;
  percentile: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface MetricComparison {
  metric: string;
  currentValue: number;
  benchmarkValue: number;
  variance: number; // %
  status: 'better' | 'similar' | 'worse';
  insight: string;
}

export interface TrendComparison {
  metric: string;
  periods: Array<{
    date: Date;
    projectValue: number;
    benchmarkValue: number;
  }>;
  projectTrend: 'improving' | 'stable' | 'declining';
  benchmarkTrend: 'improving' | 'stable' | 'declining';
  convergence: 'converging' | 'diverging' | 'parallel';
}

// ============================================================================
// INDUSTRY BENCHMARKS
// ============================================================================

const INDUSTRY_BENCHMARKS: BenchmarkData[] = [
  {
    id: 'benchmark-construction',
    name: 'Projets de Construction (Industrie)',
    source: 'industry',
    metrics: {
      avgDuration: 365,
      avgBudgetVariance: 15,
      avgCpi: 0.92,
      avgSpi: 0.88,
      avgDelayDays: 45,
      successRate: 72,
    },
    sampleSize: 1500,
    lastUpdated: new Date('2024-01-01'),
  },
  {
    id: 'benchmark-it',
    name: 'Projets IT (Industrie)',
    source: 'industry',
    metrics: {
      avgDuration: 180,
      avgBudgetVariance: 25,
      avgCpi: 0.85,
      avgSpi: 0.82,
      avgDelayDays: 30,
      successRate: 65,
    },
    sampleSize: 5000,
    lastUpdated: new Date('2024-01-01'),
  },
  {
    id: 'benchmark-hotel',
    name: 'Projets Hôteliers (Industrie)',
    source: 'industry',
    metrics: {
      avgDuration: 540,
      avgBudgetVariance: 18,
      avgCpi: 0.90,
      avgSpi: 0.85,
      avgDelayDays: 60,
      successRate: 70,
    },
    sampleSize: 500,
    lastUpdated: new Date('2024-01-01'),
  },
];

// ============================================================================
// PROJECT COMPARATOR
// ============================================================================

export class ProjectComparator {
  private customBenchmarks: BenchmarkData[] = [];
  private historicalProjects: ProjectMetrics[] = [];

  // ---------------------------------------------------------------------------
  // COMPARAISON
  // ---------------------------------------------------------------------------

  /**
   * Compare le projet actuel avec un benchmark
   */
  compare(project: ProjectMetrics, benchmarkId?: string): ComparisonResult {
    // Sélectionner le benchmark approprié
    const benchmark = benchmarkId
      ? this.getBenchmark(benchmarkId)
      : this.selectBestBenchmark(project);

    if (!benchmark) {
      throw new Error('Aucun benchmark disponible pour la comparaison');
    }

    // Calculer les comparaisons métriques
    const comparisons = this.calculateComparisons(project, benchmark);

    // Score global
    const overallScore = this.calculateOverallScore(comparisons);

    // Percentile (basé sur les projets historiques)
    const percentile = this.calculatePercentile(project, overallScore);

    // Forces et faiblesses
    const strengths = comparisons
      .filter(c => c.status === 'better')
      .map(c => `${c.metric}: ${c.insight}`);

    const weaknesses = comparisons
      .filter(c => c.status === 'worse')
      .map(c => `${c.metric}: ${c.insight}`);

    // Recommandations
    const recommendations = this.generateRecommendations(comparisons, project);

    return {
      currentProject: project,
      benchmark,
      comparisons,
      overallScore,
      percentile,
      strengths,
      weaknesses,
      recommendations,
    };
  }

  private selectBestBenchmark(project: ProjectMetrics): BenchmarkData | null {
    // Sélectionner le benchmark le plus pertinent basé sur le type de projet
    const allBenchmarks = [...INDUSTRY_BENCHMARKS, ...this.customBenchmarks];

    // Correspondance par type
    const typeMatch = allBenchmarks.find(b =>
      b.name.toLowerCase().includes(project.type.toLowerCase())
    );

    if (typeMatch) return typeMatch;

    // Sinon, utiliser le benchmark général de construction
    return allBenchmarks.find(b => b.id === 'benchmark-construction') || allBenchmarks[0];
  }

  private calculateComparisons(project: ProjectMetrics, benchmark: BenchmarkData): MetricComparison[] {
    const comparisons: MetricComparison[] = [];

    // CPI
    if (project.cpi !== undefined) {
      const variance = ((project.cpi - benchmark.metrics.avgCpi) / benchmark.metrics.avgCpi) * 100;
      comparisons.push({
        metric: 'Indice de Performance des Coûts (CPI)',
        currentValue: project.cpi,
        benchmarkValue: benchmark.metrics.avgCpi,
        variance,
        status: variance > 5 ? 'better' : variance < -5 ? 'worse' : 'similar',
        insight: variance > 5
          ? 'Performance budgétaire supérieure au benchmark'
          : variance < -5
            ? 'Performance budgétaire inférieure - optimisations possibles'
            : 'Performance budgétaire dans la norme',
      });
    }

    // SPI
    if (project.spi !== undefined) {
      const variance = ((project.spi - benchmark.metrics.avgSpi) / benchmark.metrics.avgSpi) * 100;
      comparisons.push({
        metric: 'Indice de Performance Planning (SPI)',
        currentValue: project.spi,
        benchmarkValue: benchmark.metrics.avgSpi,
        variance,
        status: variance > 5 ? 'better' : variance < -5 ? 'worse' : 'similar',
        insight: variance > 5
          ? 'Avancement supérieur au planning de référence'
          : variance < -5
            ? 'Retard par rapport au planning - accélérer si possible'
            : 'Avancement conforme aux attentes',
      });
    }

    // Retard
    const delayVariance = ((benchmark.metrics.avgDelayDays - project.delayDays) / benchmark.metrics.avgDelayDays) * 100;
    comparisons.push({
      metric: 'Retard cumulé (jours)',
      currentValue: project.delayDays,
      benchmarkValue: benchmark.metrics.avgDelayDays,
      variance: -delayVariance, // Inversé car moins de retard = mieux
      status: project.delayDays < benchmark.metrics.avgDelayDays * 0.8 ? 'better'
        : project.delayDays > benchmark.metrics.avgDelayDays * 1.2 ? 'worse'
          : 'similar',
      insight: project.delayDays < benchmark.metrics.avgDelayDays
        ? 'Moins de retard que la moyenne du secteur'
        : 'Retard supérieur à la moyenne - analyser les causes',
    });

    // Variance budget (si coût réel disponible)
    if (project.actualCost !== undefined) {
      const budgetVariance = ((project.actualCost - project.budget) / project.budget) * 100;
      const benchVariance = benchmark.metrics.avgBudgetVariance;
      comparisons.push({
        metric: 'Variance Budget (%)',
        currentValue: budgetVariance,
        benchmarkValue: benchVariance,
        variance: benchVariance - budgetVariance,
        status: budgetVariance < benchVariance * 0.8 ? 'better'
          : budgetVariance > benchVariance * 1.2 ? 'worse'
            : 'similar',
        insight: budgetVariance < benchVariance
          ? 'Maîtrise budgétaire supérieure au benchmark'
          : 'Dépassement budgétaire au-dessus de la moyenne',
      });
    }

    // Taux de complétion
    const expectedCompletion = this.calculateExpectedCompletion(project);
    const completionGap = project.completionRate - expectedCompletion;
    comparisons.push({
      metric: 'Taux de complétion vs attendu',
      currentValue: project.completionRate,
      benchmarkValue: expectedCompletion,
      variance: completionGap,
      status: completionGap > 5 ? 'better' : completionGap < -10 ? 'worse' : 'similar',
      insight: completionGap > 5
        ? 'Avancement supérieur aux attentes temporelles'
        : completionGap < -10
          ? 'Retard d\'avancement significatif'
          : 'Avancement conforme au calendrier',
    });

    return comparisons;
  }

  private calculateExpectedCompletion(project: ProjectMetrics): number {
    if (!project.endDate || !project.startDate) return 50;

    const totalDuration = project.endDate.getTime() - project.startDate.getTime();
    const elapsed = Date.now() - project.startDate.getTime();

    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }

  private calculateOverallScore(comparisons: MetricComparison[]): number {
    if (comparisons.length === 0) return 50;

    let score = 50; // Base

    for (const comp of comparisons) {
      if (comp.status === 'better') score += 10;
      else if (comp.status === 'worse') score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculatePercentile(project: ProjectMetrics, score: number): number {
    // Simplification: basé sur le score global
    // Dans une implémentation réelle, comparer avec l'historique
    if (score >= 80) return 90;
    if (score >= 70) return 75;
    if (score >= 60) return 60;
    if (score >= 50) return 50;
    if (score >= 40) return 35;
    return 20;
  }

  private generateRecommendations(comparisons: MetricComparison[], project: ProjectMetrics): string[] {
    const recommendations: string[] = [];

    for (const comp of comparisons) {
      if (comp.status === 'worse') {
        switch (comp.metric) {
          case 'Indice de Performance des Coûts (CPI)':
            recommendations.push('Revoir les estimations budgétaires et identifier les postes de surcoût');
            break;
          case 'Indice de Performance Planning (SPI)':
            recommendations.push('Analyser le chemin critique et envisager des accélérations');
            break;
          case 'Retard cumulé (jours)':
            recommendations.push('Mettre en place un plan de rattrapage avec des jalons intermédiaires');
            break;
          case 'Variance Budget (%)':
            recommendations.push('Établir un suivi budgétaire hebdomadaire et des alertes précoces');
            break;
        }
      }
    }

    if (project.complexity === 'very_high' && comparisons.some(c => c.status === 'worse')) {
      recommendations.push('Compte tenu de la complexité élevée, envisager un audit externe');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintenir les bonnes pratiques actuelles');
      recommendations.push('Documenter les facteurs de succès pour les futurs projets');
    }

    return recommendations;
  }

  // ---------------------------------------------------------------------------
  // TENDANCES
  // ---------------------------------------------------------------------------

  /**
   * Compare les tendances dans le temps
   */
  compareTrends(
    projectHistory: Array<{ date: Date; metrics: Partial<ProjectMetrics> }>,
    benchmarkId: string,
    metric: keyof ProjectMetrics
  ): TrendComparison | null {
    const benchmark = this.getBenchmark(benchmarkId);
    if (!benchmark || projectHistory.length < 2) return null;

    const periods = projectHistory.map(h => ({
      date: h.date,
      projectValue: (h.metrics[metric] as number) || 0,
      benchmarkValue: this.getBenchmarkMetricValue(benchmark, metric),
    }));

    // Calculer les tendances
    const projectTrend = this.calculateTrend(periods.map(p => p.projectValue));
    const benchmarkTrend = 'stable' as const; // Benchmark généralement stable

    // Convergence
    const first = periods[0];
    const last = periods[periods.length - 1];
    const initialGap = Math.abs(first.projectValue - first.benchmarkValue);
    const finalGap = Math.abs(last.projectValue - last.benchmarkValue);

    let convergence: 'converging' | 'diverging' | 'parallel';
    if (finalGap < initialGap * 0.8) {
      convergence = 'converging';
    } else if (finalGap > initialGap * 1.2) {
      convergence = 'diverging';
    } else {
      convergence = 'parallel';
    }

    return {
      metric: String(metric),
      periods,
      projectTrend,
      benchmarkTrend,
      convergence,
    };
  }

  private calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 2) return 'stable';

    const first = values.slice(0, Math.ceil(values.length / 2));
    const second = values.slice(Math.ceil(values.length / 2));

    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;

    const change = ((avgSecond - avgFirst) / avgFirst) * 100;

    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  private getBenchmarkMetricValue(benchmark: BenchmarkData, metric: keyof ProjectMetrics): number {
    const mapping: Record<string, number> = {
      cpi: benchmark.metrics.avgCpi,
      spi: benchmark.metrics.avgSpi,
      delayDays: benchmark.metrics.avgDelayDays,
      duration: benchmark.metrics.avgDuration,
    };
    return mapping[metric as string] || 0;
  }

  // ---------------------------------------------------------------------------
  // GESTION DES BENCHMARKS
  // ---------------------------------------------------------------------------

  getBenchmark(id: string): BenchmarkData | undefined {
    return [...INDUSTRY_BENCHMARKS, ...this.customBenchmarks].find(b => b.id === id);
  }

  getAllBenchmarks(): BenchmarkData[] {
    return [...INDUSTRY_BENCHMARKS, ...this.customBenchmarks];
  }

  addCustomBenchmark(benchmark: BenchmarkData): void {
    benchmark.source = 'custom';
    this.customBenchmarks.push(benchmark);
  }

  // ---------------------------------------------------------------------------
  // PROJETS HISTORIQUES
  // ---------------------------------------------------------------------------

  addHistoricalProject(project: ProjectMetrics): void {
    this.historicalProjects.push(project);
  }

  getHistoricalProjects(): ProjectMetrics[] {
    return [...this.historicalProjects];
  }

  /**
   * Crée un benchmark personnalisé à partir des projets historiques
   */
  createBenchmarkFromHistory(name: string): BenchmarkData | null {
    if (this.historicalProjects.length < 3) return null;

    const projects = this.historicalProjects;

    const avgMetric = (fn: (p: ProjectMetrics) => number | undefined): number => {
      const values = projects.map(fn).filter((v): v is number => v !== undefined);
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    };

    const benchmark: BenchmarkData = {
      id: `benchmark-custom-${Date.now()}`,
      name,
      source: 'internal',
      metrics: {
        avgDuration: avgMetric(p => p.duration),
        avgBudgetVariance: avgMetric(p => p.actualCost && p.budget ? ((p.actualCost - p.budget) / p.budget) * 100 : undefined),
        avgCpi: avgMetric(p => p.cpi),
        avgSpi: avgMetric(p => p.spi),
        avgDelayDays: avgMetric(p => p.delayDays),
        successRate: (projects.filter(p => p.completionRate >= 90).length / projects.length) * 100,
      },
      sampleSize: projects.length,
      lastUpdated: new Date(),
    };

    this.customBenchmarks.push(benchmark);
    return benchmark;
  }
}

export default ProjectComparator;
