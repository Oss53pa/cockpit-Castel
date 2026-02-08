// ============================================================================
// PROPH3T ENGINE V2 — PROJECT MEMORY
// ============================================================================
// Mémoire persistante du projet pour apprentissage continu
// ============================================================================

import type {
  Prediction,
  PrescriptiveAction,
  ProjectState,
  SimulationResult,
  Anomaly,
} from '../core/types';
import { PatternStore, type Pattern, type PatternMatch } from './patternStore';
import { FeedbackLoop, type Feedback, type FeedbackStats, type LearningInsight } from './feedbackLoop';

// ============================================================================
// TYPES
// ============================================================================

export interface MemorySnapshot {
  timestamp: Date;
  stateHash: string;
  keyMetrics: Record<string, number>;
  activePredictions: number;
  activeAnomalies: number;
  pendingActions: number;
}

export interface HistoricalEvent {
  id: string;
  timestamp: Date;
  type: 'prediction_created' | 'action_taken' | 'anomaly_detected' | 'pattern_matched' | 'milestone_reached';
  title: string;
  details: Record<string, unknown>;
  impact?: 'positive' | 'negative' | 'neutral';
}

export interface ProjectTimeline {
  events: HistoricalEvent[];
  milestones: Milestone[];
  keyDecisions: Decision[];
}

export interface Milestone {
  id: string;
  name: string;
  plannedDate: Date;
  actualDate?: Date;
  status: 'pending' | 'achieved' | 'delayed' | 'missed';
  variance?: number; // Jours d'écart
}

export interface Decision {
  id: string;
  timestamp: Date;
  description: string;
  rationale: string;
  predictedOutcome: string;
  actualOutcome?: string;
  wasSuccessful?: boolean;
}

export interface MemoryExport {
  version: string;
  exportedAt: Date;
  snapshots: MemorySnapshot[];
  events: HistoricalEvent[];
  patterns: Pattern[];
  feedbackData: ReturnType<FeedbackLoop['exportLearningData']>;
  timeline: ProjectTimeline;
}

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class ProjectMemory {
  private patternStore: PatternStore;
  private feedbackLoop: FeedbackLoop;
  private snapshots: MemorySnapshot[] = [];
  private events: HistoricalEvent[] = [];
  private timeline: ProjectTimeline = {
    events: [],
    milestones: [],
    keyDecisions: [],
  };
  private maxSnapshots = 365 * 2; // 2 ans
  private maxEvents = 10000;

  constructor() {
    this.patternStore = new PatternStore();
    this.feedbackLoop = new FeedbackLoop();
  }

  // ============================================================================
  // PATTERN STORE ACCESS
  // ============================================================================

  /**
   * Détecte les patterns dans l'état actuel
   */
  public detectPatterns(metrics: Record<string, number>): PatternMatch[] {
    return this.patternStore.detectPatterns(metrics);
  }

  /**
   * Enregistre un nouveau pattern appris
   */
  public learnPattern(
    name: string,
    description: string,
    conditions: Parameters<PatternStore['learnPattern']>[2],
    category: Parameters<PatternStore['learnPattern']>[3],
    tags?: string[]
  ): Pattern {
    return this.patternStore.learnPattern(name, description, conditions, category, tags);
  }

  /**
   * Enregistre un outcome pour un pattern
   */
  public recordPatternOutcome(
    patternId: string,
    outcome: Parameters<PatternStore['recordOutcome']>[1]
  ): void {
    this.patternStore.recordOutcome(patternId, outcome);
  }

  // ============================================================================
  // FEEDBACK LOOP ACCESS
  // ============================================================================

  /**
   * Enregistre un feedback utilisateur
   */
  public recordFeedback(feedback: Omit<Feedback, 'id' | 'createdAt'>): Feedback {
    const fb = this.feedbackLoop.recordFeedback(feedback);

    // Enregistrer comme événement
    this.recordEvent({
      type: 'action_taken',
      title: `Feedback: ${feedback.rating}`,
      details: {
        targetId: feedback.targetId,
        targetType: feedback.targetType,
        rating: feedback.rating,
      },
      impact: feedback.rating === 'accurate' ? 'positive' :
              feedback.rating === 'inaccurate' ? 'negative' : 'neutral',
    });

    return fb;
  }

  /**
   * Récupère les statistiques de feedback
   */
  public getFeedbackStats(filters?: Parameters<FeedbackLoop['getStats']>[0]): FeedbackStats {
    return this.feedbackLoop.getStats(filters);
  }

  /**
   * Génère des insights d'apprentissage
   */
  public getLearningInsights(): LearningInsight[] {
    return this.feedbackLoop.generateInsights();
  }

  /**
   * Applique la calibration aux prédictions
   */
  public calibratePredictions(predictions: Prediction[]): Prediction[] {
    return predictions.map(pred => ({
      ...pred,
      confidence: this.feedbackLoop.applyCalibration(pred.confidence, pred.type),
    }));
  }

  // ============================================================================
  // SNAPSHOTS
  // ============================================================================

  /**
   * Enregistre un snapshot de l'état du projet
   */
  public recordSnapshot(state: ProjectState): void {
    const snapshot: MemorySnapshot = {
      timestamp: new Date(),
      stateHash: this.hashState(state),
      keyMetrics: {
        avancement: state.currentMetrics.avancementGlobal,
        budget: state.currentMetrics.budgetRealise,
        occupation: state.currentMetrics.tauxOccupation,
        actionsRetard: state.currentMetrics.actionsEnRetard,
        joursRestants: state.currentMetrics.joursRestants,
      },
      activePredictions: 0, // Sera mis à jour
      activeAnomalies: 0,
      pendingActions: 0,
    };

    this.snapshots.push(snapshot);
    this.patternStore.recordSnapshot(snapshot.keyMetrics);

    // Limiter la taille
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  /**
   * Récupère les snapshots récents
   */
  public getRecentSnapshots(count = 30): MemorySnapshot[] {
    return this.snapshots.slice(-count);
  }

  /**
   * Calcule les tendances depuis les snapshots
   */
  public calculateTrends(days = 30): Record<string, { current: number; previous: number; trend: string }> {
    const recent = this.snapshots.slice(-days);
    const previous = this.snapshots.slice(-days * 2, -days);

    if (recent.length === 0) return {};

    const trends: Record<string, { current: number; previous: number; trend: string }> = {};

    const metrics = ['avancement', 'budget', 'occupation', 'actionsRetard', 'joursRestants'];

    for (const metric of metrics) {
      const currentAvg = recent.reduce((sum, s) => sum + (s.keyMetrics[metric] || 0), 0) / recent.length;
      const previousAvg = previous.length > 0
        ? previous.reduce((sum, s) => sum + (s.keyMetrics[metric] || 0), 0) / previous.length
        : currentAvg;

      const diff = ((currentAvg - previousAvg) / Math.max(1, previousAvg)) * 100;

      trends[metric] = {
        current: Math.round(currentAvg * 100) / 100,
        previous: Math.round(previousAvg * 100) / 100,
        trend: diff > 5 ? 'up' : diff < -5 ? 'down' : 'stable',
      };
    }

    return trends;
  }

  // ============================================================================
  // EVENTS & TIMELINE
  // ============================================================================

  /**
   * Enregistre un événement dans l'historique
   */
  public recordEvent(event: Omit<HistoricalEvent, 'id' | 'timestamp'>): HistoricalEvent {
    const fullEvent: HistoricalEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.events.push(fullEvent);
    this.timeline.events.push(fullEvent);

    // Limiter la taille
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    return fullEvent;
  }

  /**
   * Enregistre une prédiction créée
   */
  public recordPrediction(prediction: Prediction): void {
    this.recordEvent({
      type: 'prediction_created',
      title: prediction.title,
      details: {
        predictionId: prediction.id,
        type: prediction.type,
        probability: prediction.probability,
        impact: prediction.impact,
        confidence: prediction.confidence.value,
      },
      impact: prediction.impact === 'critical' ? 'negative' :
              prediction.impact === 'high' ? 'negative' : 'neutral',
    });
  }

  /**
   * Enregistre une anomalie détectée
   */
  public recordAnomaly(anomaly: Anomaly): void {
    this.recordEvent({
      type: 'anomaly_detected',
      title: `Anomalie: ${anomaly.metric}`,
      details: {
        anomalyId: anomaly.id,
        metric: anomaly.metric,
        severity: anomaly.severity,
        value: anomaly.currentValue,
        expected: anomaly.expectedValue,
      },
      impact: anomaly.severity === 'critical' ? 'negative' :
              anomaly.severity === 'high' ? 'negative' : 'neutral',
    });
  }

  /**
   * Enregistre un pattern matché
   */
  public recordPatternMatch(match: PatternMatch): void {
    this.recordEvent({
      type: 'pattern_matched',
      title: `Pattern détecté: ${match.pattern.name}`,
      details: {
        patternId: match.pattern.id,
        matchScore: match.matchScore,
        matchedConditions: match.matchedConditions,
        likelyOutcome: match.likelyOutcome?.description,
      },
      impact: match.likelyOutcome?.impactType === 'positive' ? 'positive' :
              match.likelyOutcome?.impactType === 'negative' ? 'negative' : 'neutral',
    });
  }

  /**
   * Ajoute un milestone au timeline
   */
  public addMilestone(milestone: Omit<Milestone, 'id'>): Milestone {
    const full: Milestone = {
      ...milestone,
      id: `milestone-${Date.now()}`,
    };
    this.timeline.milestones.push(full);
    return full;
  }

  /**
   * Met à jour un milestone
   */
  public updateMilestone(
    id: string,
    update: Partial<Pick<Milestone, 'actualDate' | 'status' | 'variance'>>
  ): void {
    const milestone = this.timeline.milestones.find(m => m.id === id);
    if (milestone) {
      Object.assign(milestone, update);

      // Enregistrer comme événement
      if (update.status === 'achieved') {
        this.recordEvent({
          type: 'milestone_reached',
          title: `Jalon atteint: ${milestone.name}`,
          details: { milestoneId: id, variance: update.variance },
          impact: 'positive',
        });
      }
    }
  }

  /**
   * Enregistre une décision clé
   */
  public recordDecision(decision: Omit<Decision, 'id' | 'timestamp'>): Decision {
    const full: Decision = {
      ...decision,
      id: `decision-${Date.now()}`,
      timestamp: new Date(),
    };
    this.timeline.keyDecisions.push(full);
    return full;
  }

  /**
   * Récupère le timeline complet
   */
  public getTimeline(): ProjectTimeline {
    return {
      events: [...this.timeline.events].sort((a, b) =>
        b.timestamp.getTime() - a.timestamp.getTime()
      ),
      milestones: [...this.timeline.milestones].sort((a, b) =>
        a.plannedDate.getTime() - b.plannedDate.getTime()
      ),
      keyDecisions: [...this.timeline.keyDecisions].sort((a, b) =>
        b.timestamp.getTime() - a.timestamp.getTime()
      ),
    };
  }

  /**
   * Récupère les événements récents
   */
  public getRecentEvents(count = 50): HistoricalEvent[] {
    return this.events.slice(-count).reverse();
  }

  // ============================================================================
  // CONTEXT RETRIEVAL
  // ============================================================================

  /**
   * Récupère le contexte pour une nouvelle analyse
   */
  public getAnalysisContext(): {
    recentPatterns: PatternMatch[];
    recentEvents: HistoricalEvent[];
    feedbackStats: FeedbackStats;
    trends: ReturnType<ProjectMemory['calculateTrends']>;
    insights: LearningInsight[];
  } {
    const latestSnapshot = this.snapshots[this.snapshots.length - 1];

    return {
      recentPatterns: latestSnapshot
        ? this.patternStore.detectPatterns(latestSnapshot.keyMetrics)
        : [],
      recentEvents: this.getRecentEvents(20),
      feedbackStats: this.feedbackLoop.getStats(),
      trends: this.calculateTrends(),
      insights: this.feedbackLoop.generateInsights(),
    };
  }

  /**
   * Recherche dans l'historique
   */
  public searchHistory(query: {
    type?: HistoricalEvent['type'];
    since?: Date;
    until?: Date;
    impactFilter?: 'positive' | 'negative' | 'neutral';
    limit?: number;
  }): HistoricalEvent[] {
    let results = [...this.events];

    if (query.type) {
      results = results.filter(e => e.type === query.type);
    }
    if (query.since) {
      results = results.filter(e => e.timestamp >= query.since!);
    }
    if (query.until) {
      results = results.filter(e => e.timestamp <= query.until!);
    }
    if (query.impactFilter) {
      results = results.filter(e => e.impact === query.impactFilter);
    }

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return query.limit ? results.slice(0, query.limit) : results;
  }

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  /**
   * Exporte toute la mémoire pour persistance
   */
  public export(): MemoryExport {
    return {
      version: '2.0',
      exportedAt: new Date(),
      snapshots: this.snapshots,
      events: this.events,
      patterns: this.patternStore.exportPatterns(),
      feedbackData: this.feedbackLoop.exportLearningData(),
      timeline: this.timeline,
    };
  }

  /**
   * Importe une mémoire sauvegardée
   */
  public import(data: MemoryExport): void {
    if (data.version !== '2.0') {
      console.warn(`Version de mémoire ${data.version} peut nécessiter migration`);
    }

    this.snapshots = data.snapshots || [];
    this.events = data.events || [];
    this.timeline = data.timeline || { events: [], milestones: [], keyDecisions: [] };

    if (data.patterns) {
      this.patternStore.importPatterns(data.patterns);
    }
    if (data.feedbackData) {
      this.feedbackLoop.importLearningData(data.feedbackData);
    }
  }

  /**
   * Efface la mémoire (reset)
   */
  public clear(): void {
    this.snapshots = [];
    this.events = [];
    this.timeline = { events: [], milestones: [], keyDecisions: [] };
    // PatternStore et FeedbackLoop gardent leurs patterns prédéfinis
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  private hashState(state: ProjectState): string {
    // Hash simple pour détecter les changements
    const key = [
      state.currentMetrics.avancementGlobal,
      state.currentMetrics.budgetRealise,
      state.currentMetrics.tauxOccupation,
      state.currentMetrics.actionsTerminees,
    ].join('-');

    return btoa(key).substring(0, 16);
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default ProjectMemory;
