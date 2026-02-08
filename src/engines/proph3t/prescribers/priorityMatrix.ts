// ============================================================================
// PROPH3T ENGINE V2 — MATRICE DE PRIORITÉ EISENHOWER
// ============================================================================
// Classification des actions selon urgence et importance
// ============================================================================

import type { PrescriptiveAction, ConfidenceScore } from '../core/types';
import { PRIORITY_THRESHOLDS, getConfidenceLevel } from '../core/constants';

// ============================================================================
// TYPES
// ============================================================================

export type EisenhowerQuadrant = 'do_first' | 'schedule' | 'delegate' | 'eliminate';

export interface PriorityScore {
  urgency: number; // 0-100
  importance: number; // 0-100
  quadrant: EisenhowerQuadrant;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  reasoning: string[];
}

export interface PrioritizedAction extends PrescriptiveAction {
  priorityScore: PriorityScore;
  rank: number;
}

export interface UrgencyFactors {
  daysUntilDeadline: number;
  cascadeRisk: number; // 0-100
  blocksOthers: boolean;
  externalDependency: boolean;
  regulatoryCompliance: boolean;
}

export interface ImportanceFactors {
  financialImpact: number; // en FCFA
  strategicAlignment: number; // 0-100
  stakeholderVisibility: 'high' | 'medium' | 'low';
  reversibility: 'reversible' | 'partially_reversible' | 'irreversible';
  affectsOpeningDate: boolean;
}

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class PriorityMatrix {
  private readonly urgencyWeights = {
    deadline: 0.35,
    cascadeRisk: 0.25,
    blocking: 0.20,
    external: 0.10,
    regulatory: 0.10,
  };

  private readonly importanceWeights = {
    financial: 0.30,
    strategic: 0.25,
    visibility: 0.20,
    reversibility: 0.15,
    opening: 0.10,
  };

  /**
   * Classe une liste d'actions selon la matrice Eisenhower
   */
  public prioritize(actions: PrescriptiveAction[]): PrioritizedAction[] {
    const scored = actions.map(action => this.scoreAction(action));

    // Tri par score combiné (urgence + importance)
    scored.sort((a, b) => {
      const scoreA = a.priorityScore.urgency + a.priorityScore.importance;
      const scoreB = b.priorityScore.urgency + b.priorityScore.importance;
      return scoreB - scoreA;
    });

    // Assigner les rangs
    return scored.map((action, index) => ({
      ...action,
      rank: index + 1,
    }));
  }

  /**
   * Score une action individuelle
   */
  public scoreAction(action: PrescriptiveAction): Omit<PrioritizedAction, 'rank'> {
    const urgencyFactors = this.extractUrgencyFactors(action);
    const importanceFactors = this.extractImportanceFactors(action);

    const urgency = this.calculateUrgency(urgencyFactors);
    const importance = this.calculateImportance(importanceFactors);
    const quadrant = this.determineQuadrant(urgency, importance);
    const priority = this.determinePriority(quadrant, urgency, importance);
    const reasoning = this.generateReasoning(urgencyFactors, importanceFactors);

    return {
      ...action,
      priority,
      priorityScore: {
        urgency,
        importance,
        quadrant,
        priority,
        reasoning,
      },
    };
  }

  /**
   * Filtre les actions par quadrant
   */
  public filterByQuadrant(
    actions: PrioritizedAction[],
    quadrant: EisenhowerQuadrant
  ): PrioritizedAction[] {
    return actions.filter(a => a.priorityScore.quadrant === quadrant);
  }

  /**
   * Retourne les actions P0 et P1 (à faire immédiatement)
   */
  public getCriticalActions(actions: PrioritizedAction[]): PrioritizedAction[] {
    return actions.filter(a =>
      a.priorityScore.priority === 'P0' ||
      a.priorityScore.priority === 'P1'
    );
  }

  /**
   * Génère un résumé de la distribution des priorités
   */
  public getSummary(actions: PrioritizedAction[]): {
    byQuadrant: Record<EisenhowerQuadrant, number>;
    byPriority: Record<string, number>;
    averageUrgency: number;
    averageImportance: number;
  } {
    const byQuadrant: Record<EisenhowerQuadrant, number> = {
      do_first: 0,
      schedule: 0,
      delegate: 0,
      eliminate: 0,
    };

    const byPriority: Record<string, number> = {
      P0: 0,
      P1: 0,
      P2: 0,
      P3: 0,
    };

    let totalUrgency = 0;
    let totalImportance = 0;

    for (const action of actions) {
      byQuadrant[action.priorityScore.quadrant]++;
      byPriority[action.priorityScore.priority]++;
      totalUrgency += action.priorityScore.urgency;
      totalImportance += action.priorityScore.importance;
    }

    return {
      byQuadrant,
      byPriority,
      averageUrgency: actions.length > 0 ? totalUrgency / actions.length : 0,
      averageImportance: actions.length > 0 ? totalImportance / actions.length : 0,
    };
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  private extractUrgencyFactors(action: PrescriptiveAction): UrgencyFactors {
    // Extraire les jours jusqu'à deadline depuis les tags ou le contexte
    let daysUntilDeadline = 30; // Default
    if (action.tags?.includes('urgence-24h')) daysUntilDeadline = 1;
    else if (action.tags?.includes('urgence-48h')) daysUntilDeadline = 2;
    else if (action.tags?.includes('urgence-7j')) daysUntilDeadline = 7;
    else if (action.priority === 'P0') daysUntilDeadline = 3;
    else if (action.priority === 'P1') daysUntilDeadline = 7;

    // Cascade risk basé sur le module cible
    let cascadeRisk = 30;
    if (action.targetModule === 'planning') cascadeRisk = 70;
    else if (action.targetModule === 'budget') cascadeRisk = 60;
    else if (action.targetModule === 'commercialisation') cascadeRisk = 50;

    return {
      daysUntilDeadline,
      cascadeRisk,
      blocksOthers: action.tags?.includes('bloquant') ?? false,
      externalDependency: action.tags?.includes('externe') ?? false,
      regulatoryCompliance: action.tags?.includes('réglementaire') ?? false,
    };
  }

  private extractImportanceFactors(action: PrescriptiveAction): ImportanceFactors {
    // Estimer l'impact financier depuis costOfInaction
    let financialImpact = 0;
    if (action.costOfInaction) {
      const match = action.costOfInaction.match(/(\d+(?:[.,]\d+)?)\s*(M|Md|k)?/i);
      if (match) {
        financialImpact = parseFloat(match[1].replace(',', '.'));
        if (match[2]?.toLowerCase() === 'md') financialImpact *= 1_000_000_000;
        else if (match[2]?.toLowerCase() === 'm') financialImpact *= 1_000_000;
        else if (match[2]?.toLowerCase() === 'k') financialImpact *= 1_000;
      }
    }

    // Alignement stratégique
    let strategicAlignment = 50;
    if (action.targetModule === 'commercialisation') strategicAlignment = 80;
    if (action.tags?.includes('ouverture')) strategicAlignment = 90;
    if (action.tags?.includes('ancre')) strategicAlignment = 85;

    // Visibilité stakeholder
    let stakeholderVisibility: 'high' | 'medium' | 'low' = 'medium';
    if (action.priority === 'P0') stakeholderVisibility = 'high';
    if (action.tags?.includes('exco') || action.tags?.includes('direction')) {
      stakeholderVisibility = 'high';
    }

    return {
      financialImpact,
      strategicAlignment,
      stakeholderVisibility,
      reversibility: 'partially_reversible',
      affectsOpeningDate: action.tags?.includes('ouverture') ??
        action.targetModule === 'planning',
    };
  }

  private calculateUrgency(factors: UrgencyFactors): number {
    const { deadline, cascadeRisk, blocking, external, regulatory } = this.urgencyWeights;

    // Score deadline (plus c'est proche, plus c'est urgent)
    let deadlineScore = 100;
    if (factors.daysUntilDeadline > 30) deadlineScore = 20;
    else if (factors.daysUntilDeadline > 14) deadlineScore = 40;
    else if (factors.daysUntilDeadline > 7) deadlineScore = 60;
    else if (factors.daysUntilDeadline > 3) deadlineScore = 80;
    // sinon 100

    // Score cascade
    const cascadeScore = factors.cascadeRisk;

    // Scores booléens
    const blockingScore = factors.blocksOthers ? 100 : 0;
    const externalScore = factors.externalDependency ? 80 : 0;
    const regulatoryScore = factors.regulatoryCompliance ? 100 : 0;

    return Math.round(
      deadlineScore * deadline +
      cascadeScore * cascadeRisk +
      blockingScore * blocking +
      externalScore * external +
      regulatoryScore * regulatory
    );
  }

  private calculateImportance(factors: ImportanceFactors): number {
    const { financial, strategic, visibility, reversibility, opening } = this.importanceWeights;

    // Score financier (logarithmique)
    let financialScore = 0;
    if (factors.financialImpact >= 1_000_000_000) financialScore = 100;
    else if (factors.financialImpact >= 100_000_000) financialScore = 80;
    else if (factors.financialImpact >= 10_000_000) financialScore = 60;
    else if (factors.financialImpact >= 1_000_000) financialScore = 40;
    else if (factors.financialImpact > 0) financialScore = 20;

    // Score stratégique
    const strategicScore = factors.strategicAlignment;

    // Score visibilité
    const visibilityScore =
      factors.stakeholderVisibility === 'high' ? 100 :
      factors.stakeholderVisibility === 'medium' ? 50 : 20;

    // Score réversibilité (irréversible = plus important)
    const reversibilityScore =
      factors.reversibility === 'irreversible' ? 100 :
      factors.reversibility === 'partially_reversible' ? 50 : 20;

    // Score ouverture
    const openingScore = factors.affectsOpeningDate ? 100 : 0;

    return Math.round(
      financialScore * financial +
      strategicScore * strategic +
      visibilityScore * visibility +
      reversibilityScore * reversibility +
      openingScore * opening
    );
  }

  private determineQuadrant(urgency: number, importance: number): EisenhowerQuadrant {
    const urgentThreshold = PRIORITY_THRESHOLDS.P1; // 70
    const importantThreshold = PRIORITY_THRESHOLDS.P1;

    if (urgency >= urgentThreshold && importance >= importantThreshold) {
      return 'do_first';
    } else if (urgency < urgentThreshold && importance >= importantThreshold) {
      return 'schedule';
    } else if (urgency >= urgentThreshold && importance < importantThreshold) {
      return 'delegate';
    } else {
      return 'eliminate';
    }
  }

  private determinePriority(
    quadrant: EisenhowerQuadrant,
    urgency: number,
    importance: number
  ): 'P0' | 'P1' | 'P2' | 'P3' {
    if (quadrant === 'do_first') {
      // P0 si très urgent ET très important
      if (urgency >= PRIORITY_THRESHOLDS.P0 && importance >= PRIORITY_THRESHOLDS.P0) {
        return 'P0';
      }
      return 'P1';
    } else if (quadrant === 'schedule') {
      return 'P2';
    } else if (quadrant === 'delegate') {
      return 'P2';
    } else {
      return 'P3';
    }
  }

  private generateReasoning(
    urgency: UrgencyFactors,
    importance: ImportanceFactors
  ): string[] {
    const reasons: string[] = [];

    // Raisons d'urgence
    if (urgency.daysUntilDeadline <= 3) {
      reasons.push(`Deadline imminent (${urgency.daysUntilDeadline} jours)`);
    }
    if (urgency.cascadeRisk >= 60) {
      reasons.push('Risque élevé d\'effet cascade');
    }
    if (urgency.blocksOthers) {
      reasons.push('Bloque d\'autres actions');
    }
    if (urgency.regulatoryCompliance) {
      reasons.push('Contrainte réglementaire');
    }

    // Raisons d'importance
    if (importance.financialImpact >= 100_000_000) {
      reasons.push(`Impact financier significatif (${this.formatAmount(importance.financialImpact)})`);
    }
    if (importance.strategicAlignment >= 80) {
      reasons.push('Fort alignement stratégique');
    }
    if (importance.stakeholderVisibility === 'high') {
      reasons.push('Haute visibilité stakeholders');
    }
    if (importance.affectsOpeningDate) {
      reasons.push('Impacte la date d\'ouverture');
    }

    return reasons.length > 0 ? reasons : ['Priorité standard'];
  }

  private formatAmount(amount: number): string {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} Md FCFA`;
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)} M FCFA`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} k FCFA`;
    return `${amount.toFixed(0)} FCFA`;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default PriorityMatrix;
