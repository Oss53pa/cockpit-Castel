// ============================================================================
// PROPH3T ENGINE V2 — RELIABILITY SCORER
// Évalue la fiabilité des acteurs basée sur l'historique des engagements
// ============================================================================

import type { Commitment, CommitmentStatus } from './commitmentTracker';

// ============================================================================
// TYPES
// ============================================================================

export interface ReliabilityScore {
  owner: string;
  overallScore: number; // 0-100
  components: {
    completionRate: number;
    onTimeRate: number;
    responsiveness: number;
    consistency: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  confidence: number; // 0-1, basé sur le nombre de données
  lastCalculated: Date;
  history: ReliabilityHistoryPoint[];
}

export interface ReliabilityHistoryPoint {
  date: Date;
  score: number;
  commitmentCount: number;
}

export interface ReliabilityFactors {
  // Poids des différents facteurs (total = 1)
  completionWeight: number;
  onTimeWeight: number;
  responsivenessWeight: number;
  consistencyWeight: number;
  // Paramètres de calcul
  recentBias: number; // 0-1, importance des engagements récents
  minDataPoints: number; // Minimum de données pour une confiance élevée
}

export interface ReliabilityComparison {
  owners: string[];
  scores: Record<string, ReliabilityScore>;
  ranking: Array<{ owner: string; score: number; rank: number }>;
  averageScore: number;
  topPerformer: string;
  needsAttention: string[];
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_FACTORS: ReliabilityFactors = {
  completionWeight: 0.35,
  onTimeWeight: 0.30,
  responsivenessWeight: 0.20,
  consistencyWeight: 0.15,
  recentBias: 0.7,
  minDataPoints: 5,
};

// ============================================================================
// RELIABILITY SCORER
// ============================================================================

export class ReliabilityScorer {
  private factors: ReliabilityFactors;
  private scoreCache: Map<string, ReliabilityScore> = new Map();

  constructor(factors: Partial<ReliabilityFactors> = {}) {
    this.factors = { ...DEFAULT_FACTORS, ...factors };
  }

  // ---------------------------------------------------------------------------
  // CALCUL DU SCORE
  // ---------------------------------------------------------------------------

  calculateScore(owner: string, commitments: Commitment[]): ReliabilityScore {
    const ownerCommitments = commitments.filter(c => c.owner === owner);

    if (ownerCommitments.length === 0) {
      return this.createDefaultScore(owner);
    }

    const components = {
      completionRate: this.calculateCompletionRate(ownerCommitments),
      onTimeRate: this.calculateOnTimeRate(ownerCommitments),
      responsiveness: this.calculateResponsiveness(ownerCommitments),
      consistency: this.calculateConsistency(ownerCommitments),
    };

    const overallScore =
      components.completionRate * this.factors.completionWeight +
      components.onTimeRate * this.factors.onTimeWeight +
      components.responsiveness * this.factors.responsivenessWeight +
      components.consistency * this.factors.consistencyWeight;

    const previousScore = this.scoreCache.get(owner);
    const trend = this.calculateTrend(previousScore, overallScore);
    const confidence = Math.min(ownerCommitments.length / this.factors.minDataPoints, 1);

    const score: ReliabilityScore = {
      owner,
      overallScore: Math.round(overallScore * 10) / 10,
      components,
      trend,
      confidence,
      lastCalculated: new Date(),
      history: previousScore
        ? [...previousScore.history.slice(-11), { date: new Date(), score: overallScore, commitmentCount: ownerCommitments.length }]
        : [{ date: new Date(), score: overallScore, commitmentCount: ownerCommitments.length }],
    };

    this.scoreCache.set(owner, score);
    return score;
  }

  private calculateCompletionRate(commitments: Commitment[]): number {
    const completable = commitments.filter(c => c.status !== 'cancelled');
    if (completable.length === 0) return 100;

    const completed = completable.filter(c => c.status === 'completed').length;
    return (completed / completable.length) * 100;
  }

  private calculateOnTimeRate(commitments: Commitment[]): number {
    const completed = commitments.filter(c => c.status === 'completed' && c.completedAt);
    if (completed.length === 0) return 100;

    const onTime = completed.filter(c => {
      const due = new Date(c.dueDate).getTime();
      const actual = new Date(c.completedAt!).getTime();
      return actual <= due;
    }).length;

    return (onTime / completed.length) * 100;
  }

  private calculateResponsiveness(commitments: Commitment[]): number {
    // Score basé sur le temps moyen entre création et première action
    const withHistory = commitments.filter(c => c.history.length > 1);
    if (withHistory.length === 0) return 80; // Score par défaut

    const responseTimes = withHistory.map(c => {
      const created = new Date(c.createdAt).getTime();
      const firstAction = c.history.find(h => h.action !== 'created');
      if (!firstAction) return 24 * 60 * 60 * 1000; // 1 jour par défaut
      return new Date(firstAction.timestamp).getTime() - created;
    });

    const avgResponseHours = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / (1000 * 60 * 60);

    // Score inversement proportionnel au temps de réponse (1h = 100, 24h = 50, 72h+ = 20)
    if (avgResponseHours <= 1) return 100;
    if (avgResponseHours <= 24) return 100 - ((avgResponseHours - 1) / 23) * 50;
    if (avgResponseHours <= 72) return 50 - ((avgResponseHours - 24) / 48) * 30;
    return 20;
  }

  private calculateConsistency(commitments: Commitment[]): number {
    // Calcule l'écart-type des délais de livraison
    const completed = commitments.filter(c => c.status === 'completed' && c.completedAt);
    if (completed.length < 2) return 80; // Score par défaut

    const delays = completed.map(c => {
      const due = new Date(c.dueDate).getTime();
      const actual = new Date(c.completedAt!).getTime();
      return (actual - due) / (1000 * 60 * 60 * 24); // Délai en jours
    });

    const mean = delays.reduce((a, b) => a + b, 0) / delays.length;
    const variance = delays.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / delays.length;
    const stdDev = Math.sqrt(variance);

    // Score inversement proportionnel à l'écart-type (0 = 100, 7+ jours = 20)
    if (stdDev <= 0.5) return 100;
    if (stdDev <= 3) return 100 - (stdDev / 3) * 30;
    if (stdDev <= 7) return 70 - ((stdDev - 3) / 4) * 50;
    return 20;
  }

  private calculateTrend(previous: ReliabilityScore | undefined, current: number): 'improving' | 'stable' | 'declining' {
    if (!previous || previous.history.length < 2) return 'stable';

    const diff = current - previous.overallScore;
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  private createDefaultScore(owner: string): ReliabilityScore {
    return {
      owner,
      overallScore: 100,
      components: {
        completionRate: 100,
        onTimeRate: 100,
        responsiveness: 100,
        consistency: 100,
      },
      trend: 'stable',
      confidence: 0,
      lastCalculated: new Date(),
      history: [],
    };
  }

  // ---------------------------------------------------------------------------
  // COMPARAISONS
  // ---------------------------------------------------------------------------

  compareReliability(commitments: Commitment[]): ReliabilityComparison {
    const owners = [...new Set(commitments.map(c => c.owner))];
    const scores: Record<string, ReliabilityScore> = {};

    for (const owner of owners) {
      scores[owner] = this.calculateScore(owner, commitments);
    }

    const ranking = owners
      .map(owner => ({ owner, score: scores[owner].overallScore, rank: 0 }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    const averageScore = owners.length > 0
      ? ranking.reduce((sum, r) => sum + r.score, 0) / owners.length
      : 0;

    return {
      owners,
      scores,
      ranking,
      averageScore: Math.round(averageScore * 10) / 10,
      topPerformer: ranking[0]?.owner || '',
      needsAttention: ranking.filter(r => r.score < 70).map(r => r.owner),
    };
  }

  // ---------------------------------------------------------------------------
  // PRÉDICTIONS
  // ---------------------------------------------------------------------------

  /**
   * Prédit la probabilité qu'un engagement soit livré à temps
   */
  predictOnTimeDelivery(owner: string, commitments: Commitment[]): {
    probability: number;
    factors: string[];
    recommendation: string;
  } {
    const score = this.calculateScore(owner, commitments);

    // Base: le taux de livraison à temps historique
    let probability = score.components.onTimeRate / 100;
    const factors: string[] = [];

    // Ajustements
    if (score.trend === 'improving') {
      probability = Math.min(probability * 1.1, 1);
      factors.push('Tendance positive récente (+10%)');
    } else if (score.trend === 'declining') {
      probability *= 0.9;
      factors.push('Tendance négative récente (-10%)');
    }

    if (score.confidence < 0.5) {
      factors.push('Données insuffisantes (confiance faible)');
    }

    const currentOverdue = commitments.filter(c =>
      c.owner === owner &&
      c.status !== 'completed' &&
      c.status !== 'cancelled' &&
      new Date(c.dueDate) < new Date()
    ).length;

    if (currentOverdue > 2) {
      probability *= 0.8;
      factors.push(`${currentOverdue} engagements en retard actuels (-20%)`);
    }

    // Recommandation
    let recommendation = '';
    if (probability >= 0.8) {
      recommendation = 'Livraison à temps probable. Suivi standard recommandé.';
    } else if (probability >= 0.6) {
      recommendation = 'Risque modéré de retard. Prévoir un suivi régulier.';
    } else if (probability >= 0.4) {
      recommendation = 'Risque élevé de retard. Mettre en place un suivi rapproché et des rappels.';
    } else {
      recommendation = 'Très forte probabilité de retard. Envisager un support supplémentaire ou une réaffectation.';
    }

    return {
      probability: Math.round(probability * 100) / 100,
      factors,
      recommendation,
    };
  }

  // ---------------------------------------------------------------------------
  // UTILITAIRES
  // ---------------------------------------------------------------------------

  getScoreFromCache(owner: string): ReliabilityScore | undefined {
    return this.scoreCache.get(owner);
  }

  clearCache(): void {
    this.scoreCache.clear();
  }

  updateFactors(newFactors: Partial<ReliabilityFactors>): void {
    this.factors = { ...this.factors, ...newFactors };
  }
}

export default ReliabilityScorer;
