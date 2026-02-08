// ============================================================================
// PROPH3T ENGINE V2 — DECISION TRACKER
// Suivi des décisions prises en réunion
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export type DecisionStatus = 'pending' | 'approved' | 'rejected' | 'deferred' | 'implemented';
export type DecisionImpact = 'critical' | 'high' | 'medium' | 'low';

export interface Decision {
  id: string;
  title: string;
  description: string;
  context: string;
  madeAt: Date;
  madeBy: string[];
  meetingRef?: string;
  status: DecisionStatus;
  impact: DecisionImpact;
  category: string;
  options: DecisionOption[];
  selectedOption?: string;
  rationale?: string;
  consequences: string[];
  linkedActions: string[];
  linkedCommitments: string[];
  reviewDate?: Date;
  expiryDate?: Date;
  tags: string[];
  history: DecisionHistoryEntry[];
}

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  pros: string[];
  cons: string[];
  estimatedCost?: number;
  estimatedDuration?: number;
  risks: string[];
  isRecommended: boolean;
}

export interface DecisionHistoryEntry {
  timestamp: Date;
  action: 'created' | 'status_changed' | 'option_selected' | 'reviewed' | 'updated';
  details: string;
  by?: string;
}

export interface DecisionStats {
  total: number;
  byStatus: Record<DecisionStatus, number>;
  byImpact: Record<DecisionImpact, number>;
  avgDecisionTime: number; // jours entre création et approbation
  pendingCount: number;
  implementedRate: number;
}

export interface DecisionSearchFilters {
  status?: DecisionStatus[];
  impact?: DecisionImpact[];
  category?: string;
  madeBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
}

// ============================================================================
// DECISION TRACKER
// ============================================================================

export class DecisionTracker {
  private decisions: Map<string, Decision> = new Map();

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  createDecision(data: Omit<Decision, 'id' | 'madeAt' | 'status' | 'history'>): Decision {
    const id = `DEC-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date();

    const decision: Decision = {
      ...data,
      id,
      madeAt: now,
      status: 'pending',
      history: [{
        timestamp: now,
        action: 'created',
        details: `Décision créée: ${data.title}`,
      }],
    };

    this.decisions.set(id, decision);
    return decision;
  }

  updateDecision(id: string, updates: Partial<Decision>, by?: string): Decision | null {
    const decision = this.decisions.get(id);
    if (!decision) return null;

    const updated: Decision = {
      ...decision,
      ...updates,
      history: [
        ...decision.history,
        {
          timestamp: new Date(),
          action: 'updated',
          details: `Mise à jour: ${Object.keys(updates).join(', ')}`,
          by,
        },
      ],
    };

    this.decisions.set(id, updated);
    return updated;
  }

  selectOption(id: string, optionId: string, rationale: string, by?: string): Decision | null {
    const decision = this.decisions.get(id);
    if (!decision) return null;

    const option = decision.options.find(o => o.id === optionId);
    if (!option) return null;

    const updated: Decision = {
      ...decision,
      selectedOption: optionId,
      rationale,
      status: 'approved',
      history: [
        ...decision.history,
        {
          timestamp: new Date(),
          action: 'option_selected',
          details: `Option sélectionnée: "${option.label}"`,
          by,
        },
        {
          timestamp: new Date(),
          action: 'status_changed',
          details: 'Statut: pending → approved',
          by,
        },
      ],
    };

    this.decisions.set(id, updated);
    return updated;
  }

  changeStatus(id: string, newStatus: DecisionStatus, by?: string): Decision | null {
    const decision = this.decisions.get(id);
    if (!decision) return null;

    const updated: Decision = {
      ...decision,
      status: newStatus,
      history: [
        ...decision.history,
        {
          timestamp: new Date(),
          action: 'status_changed',
          details: `Statut: ${decision.status} → ${newStatus}`,
          by,
        },
      ],
    };

    this.decisions.set(id, updated);
    return updated;
  }

  deleteDecision(id: string): boolean {
    return this.decisions.delete(id);
  }

  // ---------------------------------------------------------------------------
  // QUERIES
  // ---------------------------------------------------------------------------

  getDecision(id: string): Decision | undefined {
    return this.decisions.get(id);
  }

  getAllDecisions(): Decision[] {
    return Array.from(this.decisions.values());
  }

  searchDecisions(filters: DecisionSearchFilters): Decision[] {
    return this.getAllDecisions().filter(d => {
      if (filters.status && !filters.status.includes(d.status)) return false;
      if (filters.impact && !filters.impact.includes(d.impact)) return false;
      if (filters.category && d.category !== filters.category) return false;
      if (filters.madeBy && !d.madeBy.includes(filters.madeBy)) return false;
      if (filters.dateFrom && new Date(d.madeAt) < filters.dateFrom) return false;
      if (filters.dateTo && new Date(d.madeAt) > filters.dateTo) return false;
      if (filters.tags && !filters.tags.some(t => d.tags.includes(t))) return false;
      return true;
    });
  }

  getPendingDecisions(): Decision[] {
    return this.getAllDecisions().filter(d => d.status === 'pending');
  }

  getDecisionsForReview(): Decision[] {
    const now = new Date();
    return this.getAllDecisions().filter(d =>
      d.reviewDate && new Date(d.reviewDate) <= now && d.status !== 'implemented'
    );
  }

  getExpiringDecisions(days: number = 30): Decision[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.getAllDecisions().filter(d =>
      d.expiryDate && new Date(d.expiryDate) <= futureDate && d.status !== 'implemented'
    );
  }

  // ---------------------------------------------------------------------------
  // ANALYTICS
  // ---------------------------------------------------------------------------

  calculateStats(): DecisionStats {
    const all = this.getAllDecisions();

    const byStatus: Record<DecisionStatus, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      deferred: 0,
      implemented: 0,
    };

    const byImpact: Record<DecisionImpact, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const decisionTimes: number[] = [];

    for (const d of all) {
      byStatus[d.status]++;
      byImpact[d.impact]++;

      // Temps de décision (création → approbation)
      if (d.status === 'approved' || d.status === 'implemented') {
        const approved = d.history.find(h => h.action === 'status_changed' && h.details.includes('approved'));
        if (approved) {
          const days = (new Date(approved.timestamp).getTime() - new Date(d.madeAt).getTime()) / (1000 * 60 * 60 * 24);
          decisionTimes.push(days);
        }
      }
    }

    const avgDecisionTime = decisionTimes.length > 0
      ? decisionTimes.reduce((a, b) => a + b, 0) / decisionTimes.length
      : 0;

    const implemented = all.filter(d => d.status === 'implemented').length;

    return {
      total: all.length,
      byStatus,
      byImpact,
      avgDecisionTime: Math.round(avgDecisionTime * 10) / 10,
      pendingCount: byStatus.pending,
      implementedRate: all.length > 0 ? Math.round((implemented / all.length) * 100) : 0,
    };
  }

  /**
   * Analyse l'impact des décisions par catégorie
   */
  analyzeByCategory(): Array<{
    category: string;
    count: number;
    avgImpact: number;
    implementationRate: number;
  }> {
    const categories = new Map<string, Decision[]>();

    for (const d of this.getAllDecisions()) {
      const existing = categories.get(d.category) || [];
      categories.set(d.category, [...existing, d]);
    }

    const impactScore = { critical: 4, high: 3, medium: 2, low: 1 };

    return Array.from(categories.entries()).map(([category, decisions]) => {
      const avgImpact = decisions.reduce((sum, d) => sum + impactScore[d.impact], 0) / decisions.length;
      const implemented = decisions.filter(d => d.status === 'implemented').length;

      return {
        category,
        count: decisions.length,
        avgImpact: Math.round(avgImpact * 10) / 10,
        implementationRate: Math.round((implemented / decisions.length) * 100),
      };
    }).sort((a, b) => b.count - a.count);
  }

  // ---------------------------------------------------------------------------
  // LINKING
  // ---------------------------------------------------------------------------

  linkToAction(decisionId: string, actionId: string): Decision | null {
    const decision = this.decisions.get(decisionId);
    if (!decision) return null;

    if (!decision.linkedActions.includes(actionId)) {
      return this.updateDecision(decisionId, {
        linkedActions: [...decision.linkedActions, actionId],
      });
    }
    return decision;
  }

  linkToCommitment(decisionId: string, commitmentId: string): Decision | null {
    const decision = this.decisions.get(decisionId);
    if (!decision) return null;

    if (!decision.linkedCommitments.includes(commitmentId)) {
      return this.updateDecision(decisionId, {
        linkedCommitments: [...decision.linkedCommitments, commitmentId],
      });
    }
    return decision;
  }

  // ---------------------------------------------------------------------------
  // IMPORT/EXPORT
  // ---------------------------------------------------------------------------

  exportData(): Decision[] {
    return this.getAllDecisions();
  }

  importData(decisions: Decision[]): void {
    for (const decision of decisions) {
      this.decisions.set(decision.id, decision);
    }
  }
}

export default DecisionTracker;
