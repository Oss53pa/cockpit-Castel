// ============================================================================
// PROPH3T ENGINE V2 — FEEDBACK LOOP
// ============================================================================
// Système d'apprentissage par retour utilisateur
// ============================================================================

import type { Prediction, PrescriptiveAction, ConfidenceScore } from '../core/types';
import { getConfidenceLevel } from '../core/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface Feedback {
  id: string;
  targetId: string; // ID de la prédiction ou action concernée
  targetType: 'prediction' | 'action' | 'pattern';
  rating: FeedbackRating;
  comment?: string;
  outcome?: FeedbackOutcome;
  createdAt: Date;
  userId?: string;
}

export type FeedbackRating = 'accurate' | 'partially_accurate' | 'inaccurate' | 'not_applicable';

export interface FeedbackOutcome {
  wasActionTaken: boolean;
  actualResult: string;
  impactObserved: 'positive' | 'negative' | 'neutral' | 'unknown';
  daysToResolve?: number;
}

export interface FeedbackStats {
  totalFeedbacks: number;
  byRating: Record<FeedbackRating, number>;
  accuracyRate: number;
  actionTakenRate: number;
  averageResolutionDays: number;
  recentTrend: 'improving' | 'stable' | 'declining';
}

export interface LearningInsight {
  type: 'confidence_adjustment' | 'pattern_discovery' | 'action_effectiveness';
  description: string;
  recommendation: string;
  confidence: number;
  basedOn: number; // Nombre de feedbacks analysés
}

export interface CalibrationResult {
  predictionType: string;
  originalConfidence: number;
  adjustedConfidence: number;
  adjustmentReason: string;
  sampleSize: number;
}

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class FeedbackLoop {
  private feedbacks: Map<string, Feedback> = new Map();
  private predictionAccuracy: Map<string, number[]> = new Map(); // type -> [accuracy scores]
  private actionEffectiveness: Map<string, number[]> = new Map(); // actionId -> [effectiveness]
  private confidenceAdjustments: Map<string, number> = new Map(); // type -> adjustment factor

  /**
   * Enregistre un feedback utilisateur
   */
  public recordFeedback(feedback: Omit<Feedback, 'id' | 'createdAt'>): Feedback {
    const id = `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullFeedback: Feedback = {
      ...feedback,
      id,
      createdAt: new Date(),
    };

    this.feedbacks.set(id, fullFeedback);
    this.updateLearningData(fullFeedback);

    return fullFeedback;
  }

  /**
   * Récupère les statistiques de feedback
   */
  public getStats(filters?: { targetType?: string; since?: Date }): FeedbackStats {
    let feedbackList = Array.from(this.feedbacks.values());

    // Appliquer les filtres
    if (filters?.targetType) {
      feedbackList = feedbackList.filter(f => f.targetType === filters.targetType);
    }
    if (filters?.since) {
      feedbackList = feedbackList.filter(f => f.createdAt >= filters.since!);
    }

    // Calculer les statistiques
    const byRating: Record<FeedbackRating, number> = {
      accurate: 0,
      partially_accurate: 0,
      inaccurate: 0,
      not_applicable: 0,
    };

    let actionsTaken = 0;
    let totalResolutionDays = 0;
    let resolutionCount = 0;

    for (const feedback of feedbackList) {
      byRating[feedback.rating]++;

      if (feedback.outcome?.wasActionTaken) {
        actionsTaken++;
        if (feedback.outcome.daysToResolve !== undefined) {
          totalResolutionDays += feedback.outcome.daysToResolve;
          resolutionCount++;
        }
      }
    }

    const total = feedbackList.length;
    const accuracyRate = total > 0
      ? ((byRating.accurate + byRating.partially_accurate * 0.5) / total) * 100
      : 0;

    // Calculer la tendance récente (30 derniers jours vs précédents)
    const recentTrend = this.calculateTrend(feedbackList);

    return {
      totalFeedbacks: total,
      byRating,
      accuracyRate: Math.round(accuracyRate),
      actionTakenRate: total > 0 ? Math.round((actionsTaken / total) * 100) : 0,
      averageResolutionDays: resolutionCount > 0
        ? Math.round(totalResolutionDays / resolutionCount)
        : 0,
      recentTrend,
    };
  }

  /**
   * Calibre les niveaux de confiance basé sur les feedbacks
   */
  public calibrateConfidence(predictionType: string): CalibrationResult | null {
    const accuracyScores = this.predictionAccuracy.get(predictionType);
    if (!accuracyScores || accuracyScores.length < 5) {
      return null; // Pas assez de données
    }

    const averageAccuracy = accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length;

    // Calculer l'ajustement
    // Si accuracy moyenne est 80% mais confiance affichée était 90%, ajuster à la baisse
    const recentAccuracy = accuracyScores.slice(-10);
    const recentAvg = recentAccuracy.reduce((a, b) => a + b, 0) / recentAccuracy.length;

    const currentAdjustment = this.confidenceAdjustments.get(predictionType) || 1.0;
    let newAdjustment: number;
    let reason: string;

    if (recentAvg < 60) {
      newAdjustment = Math.max(0.7, currentAdjustment * 0.95);
      reason = 'Précision faible - confiance réduite';
    } else if (recentAvg > 85) {
      newAdjustment = Math.min(1.2, currentAdjustment * 1.05);
      reason = 'Haute précision - confiance augmentée';
    } else {
      newAdjustment = currentAdjustment;
      reason = 'Précision dans la norme - pas d\'ajustement';
    }

    this.confidenceAdjustments.set(predictionType, newAdjustment);

    return {
      predictionType,
      originalConfidence: currentAdjustment * 100,
      adjustedConfidence: newAdjustment * 100,
      adjustmentReason: reason,
      sampleSize: accuracyScores.length,
    };
  }

  /**
   * Applique la calibration à un score de confiance
   */
  public applyCalibration(
    confidence: ConfidenceScore,
    predictionType: string
  ): ConfidenceScore {
    const adjustment = this.confidenceAdjustments.get(predictionType) || 1.0;
    const adjustedValue = Math.min(95, Math.max(20, Math.round(
      confidence.value * adjustment
    )));

    return {
      ...confidence,
      value: adjustedValue,
      level: getConfidenceLevel(adjustedValue),
      factors: [
        ...confidence.factors,
        `Calibré (facteur: ${adjustment.toFixed(2)})`,
      ],
    };
  }

  /**
   * Génère des insights d'apprentissage
   */
  public generateInsights(): LearningInsight[] {
    const insights: LearningInsight[] = [];
    const stats = this.getStats();

    // Insight sur la précision globale
    if (stats.accuracyRate < 60 && stats.totalFeedbacks >= 10) {
      insights.push({
        type: 'confidence_adjustment',
        description: `Taux de précision bas (${stats.accuracyRate}%) sur ${stats.totalFeedbacks} prédictions`,
        recommendation: 'Revoir les seuils de détection et les sources de données',
        confidence: 80,
        basedOn: stats.totalFeedbacks,
      });
    }

    // Insight sur les actions non prises
    if (stats.actionTakenRate < 40 && stats.totalFeedbacks >= 10) {
      insights.push({
        type: 'action_effectiveness',
        description: `Seulement ${stats.actionTakenRate}% des actions recommandées sont appliquées`,
        recommendation: 'Simplifier les recommandations ou améliorer leur pertinence',
        confidence: 75,
        basedOn: stats.totalFeedbacks,
      });
    }

    // Insights par type de prédiction
    for (const [type, scores] of this.predictionAccuracy) {
      if (scores.length < 5) continue;

      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const recentAvg = scores.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, scores.length);

      if (recentAvg < avg - 15) {
        insights.push({
          type: 'confidence_adjustment',
          description: `Dégradation de la précision pour les prédictions "${type}"`,
          recommendation: `Recalibrer le module de prédiction ${type}`,
          confidence: 70,
          basedOn: scores.length,
        });
      }
    }

    // Insights sur l'efficacité des actions
    for (const [actionId, effectiveness] of this.actionEffectiveness) {
      if (effectiveness.length < 3) continue;

      const avg = effectiveness.reduce((a, b) => a + b, 0) / effectiveness.length;

      if (avg > 80) {
        insights.push({
          type: 'action_effectiveness',
          description: `L'action "${actionId}" montre une haute efficacité (${avg.toFixed(0)}%)`,
          recommendation: 'Promouvoir cette action en priorité pour des situations similaires',
          confidence: 85,
          basedOn: effectiveness.length,
        });
      }
    }

    return insights;
  }

  /**
   * Retourne les feedbacks pour une cible spécifique
   */
  public getFeedbacksFor(targetId: string): Feedback[] {
    return Array.from(this.feedbacks.values())
      .filter(f => f.targetId === targetId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Exporte les données d'apprentissage
   */
  public exportLearningData(): {
    feedbacks: Feedback[];
    predictionAccuracy: Record<string, number[]>;
    actionEffectiveness: Record<string, number[]>;
    confidenceAdjustments: Record<string, number>;
  } {
    return {
      feedbacks: Array.from(this.feedbacks.values()),
      predictionAccuracy: Object.fromEntries(this.predictionAccuracy),
      actionEffectiveness: Object.fromEntries(this.actionEffectiveness),
      confidenceAdjustments: Object.fromEntries(this.confidenceAdjustments),
    };
  }

  /**
   * Importe des données d'apprentissage sauvegardées
   */
  public importLearningData(data: {
    feedbacks?: Feedback[];
    predictionAccuracy?: Record<string, number[]>;
    actionEffectiveness?: Record<string, number[]>;
    confidenceAdjustments?: Record<string, number>;
  }): void {
    if (data.feedbacks) {
      for (const fb of data.feedbacks) {
        this.feedbacks.set(fb.id, fb);
      }
    }
    if (data.predictionAccuracy) {
      for (const [type, scores] of Object.entries(data.predictionAccuracy)) {
        this.predictionAccuracy.set(type, scores);
      }
    }
    if (data.actionEffectiveness) {
      for (const [id, scores] of Object.entries(data.actionEffectiveness)) {
        this.actionEffectiveness.set(id, scores);
      }
    }
    if (data.confidenceAdjustments) {
      for (const [type, adj] of Object.entries(data.confidenceAdjustments)) {
        this.confidenceAdjustments.set(type, adj);
      }
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  private updateLearningData(feedback: Feedback): void {
    // Mettre à jour les scores de précision
    if (feedback.targetType === 'prediction') {
      const accuracyScore = this.ratingToScore(feedback.rating);
      const type = this.extractPredictionType(feedback.targetId);

      const existing = this.predictionAccuracy.get(type) || [];
      existing.push(accuracyScore);
      // Garder les 100 derniers
      if (existing.length > 100) existing.shift();
      this.predictionAccuracy.set(type, existing);
    }

    // Mettre à jour l'efficacité des actions
    if (feedback.targetType === 'action' && feedback.outcome) {
      const effectivenessScore = this.outcomeToScore(feedback.outcome);

      const existing = this.actionEffectiveness.get(feedback.targetId) || [];
      existing.push(effectivenessScore);
      if (existing.length > 50) existing.shift();
      this.actionEffectiveness.set(feedback.targetId, existing);
    }
  }

  private ratingToScore(rating: FeedbackRating): number {
    switch (rating) {
      case 'accurate': return 100;
      case 'partially_accurate': return 60;
      case 'inaccurate': return 0;
      case 'not_applicable': return 50; // Neutre
    }
  }

  private outcomeToScore(outcome: FeedbackOutcome): number {
    if (!outcome.wasActionTaken) return 50; // Pas de donnée

    switch (outcome.impactObserved) {
      case 'positive': return 100;
      case 'neutral': return 60;
      case 'negative': return 20;
      case 'unknown': return 50;
    }
  }

  private extractPredictionType(predictionId: string): string {
    // Extraire le type depuis l'ID (ex: "cost-eac-overrun-123" -> "cost")
    const match = predictionId.match(/^(\w+)-/);
    return match ? match[1] : 'unknown';
  }

  private calculateTrend(feedbacks: Feedback[]): 'improving' | 'stable' | 'declining' {
    if (feedbacks.length < 10) return 'stable';

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recent = feedbacks.filter(f => f.createdAt >= thirtyDaysAgo);
    const older = feedbacks.filter(f => f.createdAt >= sixtyDaysAgo && f.createdAt < thirtyDaysAgo);

    if (recent.length < 3 || older.length < 3) return 'stable';

    const recentAccuracy = recent.reduce((sum, f) => sum + this.ratingToScore(f.rating), 0) / recent.length;
    const olderAccuracy = older.reduce((sum, f) => sum + this.ratingToScore(f.rating), 0) / older.length;

    if (recentAccuracy > olderAccuracy + 10) return 'improving';
    if (recentAccuracy < olderAccuracy - 10) return 'declining';
    return 'stable';
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default FeedbackLoop;
