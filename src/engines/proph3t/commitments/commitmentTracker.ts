// ============================================================================
// PROPH3T ENGINE V2 — COMMITMENT TRACKER
// Suivi des engagements pris en réunion et leur réalisation
// ============================================================================

import type { Action } from '../../../types';

// ============================================================================
// TYPES
// ============================================================================

export type CommitmentStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
export type CommitmentSource = 'meeting' | 'email' | 'verbal' | 'document' | 'other';
export type CommitmentPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Commitment {
  id: string;
  title: string;
  description: string;
  owner: string;
  stakeholder?: string;
  source: CommitmentSource;
  sourceRef?: string; // ID réunion, email, etc.
  createdAt: Date;
  dueDate: Date;
  completedAt?: Date;
  status: CommitmentStatus;
  priority: CommitmentPriority;
  linkedActionId?: string;
  linkedJalonId?: string;
  notes: string[];
  reminders: CommitmentReminder[];
  history: CommitmentHistoryEntry[];
}

export interface CommitmentReminder {
  id: string;
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
  channel: 'in_app' | 'email';
}

export interface CommitmentHistoryEntry {
  timestamp: Date;
  action: 'created' | 'updated' | 'status_changed' | 'reminder_sent' | 'escalated';
  details: string;
  by?: string;
}

export interface CommitmentStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  cancelled: number;
  completionRate: number;
  avgCompletionTime: number; // jours
  overdueRate: number;
}

export interface CommitmentByOwner {
  owner: string;
  commitments: Commitment[];
  stats: {
    total: number;
    completed: number;
    overdue: number;
    reliabilityScore: number;
  };
}

// ============================================================================
// COMMITMENT TRACKER
// ============================================================================

export class CommitmentTracker {
  private commitments: Map<string, Commitment> = new Map();

  // ---------------------------------------------------------------------------
  // CRUD OPERATIONS
  // ---------------------------------------------------------------------------

  createCommitment(data: Omit<Commitment, 'id' | 'createdAt' | 'status' | 'history' | 'reminders'>): Commitment {
    const id = `CMT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date();

    const commitment: Commitment = {
      ...data,
      id,
      createdAt: now,
      status: 'pending',
      reminders: [],
      history: [{
        timestamp: now,
        action: 'created',
        details: `Engagement créé: ${data.title}`,
      }],
    };

    this.commitments.set(id, commitment);
    return commitment;
  }

  updateCommitment(id: string, updates: Partial<Commitment>): Commitment | null {
    const commitment = this.commitments.get(id);
    if (!commitment) return null;

    const updated: Commitment = {
      ...commitment,
      ...updates,
      history: [
        ...commitment.history,
        {
          timestamp: new Date(),
          action: 'updated',
          details: `Mise à jour: ${Object.keys(updates).join(', ')}`,
        },
      ],
    };

    this.commitments.set(id, updated);
    return updated;
  }

  changeStatus(id: string, newStatus: CommitmentStatus, by?: string): Commitment | null {
    const commitment = this.commitments.get(id);
    if (!commitment) return null;

    const updated: Commitment = {
      ...commitment,
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date() : commitment.completedAt,
      history: [
        ...commitment.history,
        {
          timestamp: new Date(),
          action: 'status_changed',
          details: `Statut: ${commitment.status} → ${newStatus}`,
          by,
        },
      ],
    };

    this.commitments.set(id, updated);
    return updated;
  }

  deleteCommitment(id: string): boolean {
    return this.commitments.delete(id);
  }

  // ---------------------------------------------------------------------------
  // QUERIES
  // ---------------------------------------------------------------------------

  getCommitment(id: string): Commitment | undefined {
    return this.commitments.get(id);
  }

  getAllCommitments(): Commitment[] {
    return Array.from(this.commitments.values());
  }

  getCommitmentsByOwner(owner: string): Commitment[] {
    return this.getAllCommitments().filter(c => c.owner === owner);
  }

  getCommitmentsByStatus(status: CommitmentStatus): Commitment[] {
    return this.getAllCommitments().filter(c => c.status === status);
  }

  getOverdueCommitments(): Commitment[] {
    const now = new Date();
    return this.getAllCommitments().filter(c =>
      c.status !== 'completed' &&
      c.status !== 'cancelled' &&
      new Date(c.dueDate) < now
    );
  }

  getUpcomingCommitments(days: number = 7): Commitment[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.getAllCommitments().filter(c =>
      c.status !== 'completed' &&
      c.status !== 'cancelled' &&
      new Date(c.dueDate) >= now &&
      new Date(c.dueDate) <= futureDate
    );
  }

  // ---------------------------------------------------------------------------
  // ANALYTICS
  // ---------------------------------------------------------------------------

  calculateStats(): CommitmentStats {
    const all = this.getAllCommitments();
    const completed = all.filter(c => c.status === 'completed');
    const overdue = this.getOverdueCommitments();

    // Calcul du temps moyen de complétion
    const completionTimes = completed
      .filter(c => c.completedAt)
      .map(c => {
        const created = new Date(c.createdAt).getTime();
        const completed = new Date(c.completedAt!).getTime();
        return (completed - created) / (1000 * 60 * 60 * 24);
      });
    const avgCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

    return {
      total: all.length,
      pending: all.filter(c => c.status === 'pending').length,
      inProgress: all.filter(c => c.status === 'in_progress').length,
      completed: completed.length,
      overdue: overdue.length,
      cancelled: all.filter(c => c.status === 'cancelled').length,
      completionRate: all.length > 0 ? (completed.length / all.length) * 100 : 0,
      avgCompletionTime,
      overdueRate: all.length > 0 ? (overdue.length / all.length) * 100 : 0,
    };
  }

  getCommitmentsByOwnerWithStats(): CommitmentByOwner[] {
    const owners = new Map<string, Commitment[]>();

    for (const commitment of this.getAllCommitments()) {
      const existing = owners.get(commitment.owner) || [];
      owners.set(commitment.owner, [...existing, commitment]);
    }

    return Array.from(owners.entries()).map(([owner, commitments]) => {
      const completed = commitments.filter(c => c.status === 'completed').length;
      const overdue = commitments.filter(c =>
        c.status !== 'completed' && c.status !== 'cancelled' &&
        new Date(c.dueDate) < new Date()
      ).length;

      return {
        owner,
        commitments,
        stats: {
          total: commitments.length,
          completed,
          overdue,
          reliabilityScore: commitments.length > 0
            ? ((completed / commitments.length) * 100) - (overdue * 5)
            : 100,
        },
      };
    });
  }

  // ---------------------------------------------------------------------------
  // LINKING
  // ---------------------------------------------------------------------------

  linkToAction(commitmentId: string, actionId: string): Commitment | null {
    return this.updateCommitment(commitmentId, { linkedActionId: actionId });
  }

  linkToJalon(commitmentId: string, jalonId: string): Commitment | null {
    return this.updateCommitment(commitmentId, { linkedJalonId: jalonId });
  }

  getCommitmentsForAction(actionId: string): Commitment[] {
    return this.getAllCommitments().filter(c => c.linkedActionId === actionId);
  }

  getCommitmentsForJalon(jalonId: string): Commitment[] {
    return this.getAllCommitments().filter(c => c.linkedJalonId === jalonId);
  }

  // ---------------------------------------------------------------------------
  // IMPORT/EXPORT
  // ---------------------------------------------------------------------------

  exportData(): Commitment[] {
    return this.getAllCommitments();
  }

  importData(commitments: Commitment[]): void {
    for (const commitment of commitments) {
      this.commitments.set(commitment.id, commitment);
    }
  }

  // ---------------------------------------------------------------------------
  // AUTO-DETECTION
  // ---------------------------------------------------------------------------

  /**
   * Auto-détecte les engagements en retard et met à jour leur statut
   */
  autoUpdateOverdueStatus(): Commitment[] {
    const updated: Commitment[] = [];
    const now = new Date();

    for (const commitment of this.getAllCommitments()) {
      if (
        (commitment.status === 'pending' || commitment.status === 'in_progress') &&
        new Date(commitment.dueDate) < now
      ) {
        const result = this.changeStatus(commitment.id, 'overdue', 'system');
        if (result) updated.push(result);
      }
    }

    return updated;
  }

  /**
   * Crée automatiquement un engagement depuis une action
   */
  createFromAction(action: Action, owner: string): Commitment {
    return this.createCommitment({
      title: action.nom,
      description: action.description || '',
      owner,
      source: 'document',
      sourceRef: action.id_action,
      dueDate: action.date_prevue ? new Date(action.date_prevue) : new Date(),
      priority: this.mapActionPriorityToCommitment(action.priorite),
      linkedActionId: action.id_action,
      notes: [],
    });
  }

  private mapActionPriorityToCommitment(priority?: number): CommitmentPriority {
    if (!priority) return 'medium';
    if (priority >= 4) return 'critical';
    if (priority >= 3) return 'high';
    if (priority >= 2) return 'medium';
    return 'low';
  }
}

export default CommitmentTracker;
