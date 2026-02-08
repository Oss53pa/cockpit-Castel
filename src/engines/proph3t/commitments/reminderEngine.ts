// ============================================================================
// PROPH3T ENGINE V2 — REMINDER ENGINE
// Génère et gère les rappels pour les engagements
// ============================================================================

import type { Commitment, CommitmentReminder, CommitmentPriority } from './commitmentTracker';

// ============================================================================
// TYPES
// ============================================================================

export interface ReminderConfig {
  // Délais avant échéance pour les rappels (en jours)
  reminderDelays: Record<CommitmentPriority, number[]>;
  // Délai pour les engagements en retard (en jours)
  overdueReminderInterval: number;
  // Max rappels par engagement
  maxRemindersPerCommitment: number;
  // Canaux par défaut
  defaultChannels: ('in_app' | 'email')[];
  // Heures d'envoi (format 24h)
  sendHours: { start: number; end: number };
  // Jours ouvrés uniquement
  workdaysOnly: boolean;
}

export interface PendingReminder {
  commitmentId: string;
  commitment: Commitment;
  reminder: CommitmentReminder;
  daysUntilDue: number;
  isOverdue: boolean;
  priority: CommitmentPriority;
}

export interface ReminderBatch {
  immediate: PendingReminder[];
  scheduled: PendingReminder[];
  skipped: Array<{ commitmentId: string; reason: string }>;
}

export interface ReminderTemplate {
  subject: string;
  body: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: ReminderConfig = {
  reminderDelays: {
    critical: [7, 3, 1, 0], // J-7, J-3, J-1, Jour J
    high: [5, 2, 0],       // J-5, J-2, Jour J
    medium: [3, 1],        // J-3, J-1
    low: [1],              // J-1
  },
  overdueReminderInterval: 2, // Rappel tous les 2 jours
  maxRemindersPerCommitment: 10,
  defaultChannels: ['in_app'],
  sendHours: { start: 8, end: 18 },
  workdaysOnly: true,
};

// ============================================================================
// REMINDER ENGINE
// ============================================================================

export class ReminderEngine {
  private config: ReminderConfig;

  constructor(config: Partial<ReminderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ---------------------------------------------------------------------------
  // GÉNÉRATION DE RAPPELS
  // ---------------------------------------------------------------------------

  /**
   * Génère les rappels planifiés pour un engagement
   */
  generateReminders(commitment: Commitment): CommitmentReminder[] {
    const delays = this.config.reminderDelays[commitment.priority];
    const reminders: CommitmentReminder[] = [];
    const dueDate = new Date(commitment.dueDate);

    for (const days of delays) {
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - days);

      // Ajuster aux heures ouvrées
      reminderDate.setHours(this.config.sendHours.start, 0, 0, 0);

      // Skip si la date est passée
      if (reminderDate <= new Date()) continue;

      // Skip week-ends si configuré
      if (this.config.workdaysOnly) {
        while (reminderDate.getDay() === 0 || reminderDate.getDay() === 6) {
          reminderDate.setDate(reminderDate.getDate() - 1);
        }
      }

      reminders.push({
        id: `REM-${commitment.id}-${days}d`,
        scheduledFor: reminderDate,
        sent: false,
        channel: 'in_app',
      });
    }

    return reminders.slice(0, this.config.maxRemindersPerCommitment);
  }

  /**
   * Identifie les rappels à envoyer maintenant
   */
  getDueReminders(commitments: Commitment[]): ReminderBatch {
    const now = new Date();
    const batch: ReminderBatch = {
      immediate: [],
      scheduled: [],
      skipped: [],
    };

    for (const commitment of commitments) {
      // Skip les engagements terminés ou annulés
      if (commitment.status === 'completed' || commitment.status === 'cancelled') {
        continue;
      }

      const dueDate = new Date(commitment.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysUntilDue < 0;

      // Vérifier les rappels existants
      for (const reminder of commitment.reminders) {
        if (reminder.sent) continue;

        const reminderTime = new Date(reminder.scheduledFor);

        if (reminderTime <= now) {
          // Check si dans les heures d'envoi
          const currentHour = now.getHours();
          if (currentHour >= this.config.sendHours.start && currentHour < this.config.sendHours.end) {
            batch.immediate.push({
              commitmentId: commitment.id,
              commitment,
              reminder,
              daysUntilDue,
              isOverdue,
              priority: commitment.priority,
            });
          } else {
            batch.skipped.push({
              commitmentId: commitment.id,
              reason: 'Hors heures d\'envoi',
            });
          }
        } else {
          batch.scheduled.push({
            commitmentId: commitment.id,
            commitment,
            reminder,
            daysUntilDue,
            isOverdue,
            priority: commitment.priority,
          });
        }
      }

      // Générer rappel pour retard si nécessaire
      if (isOverdue) {
        const lastReminderSent = commitment.reminders
          .filter(r => r.sent)
          .sort((a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime())[0];

        const shouldSendOverdueReminder = !lastReminderSent ||
          (now.getTime() - new Date(lastReminderSent.sentAt!).getTime()) >
          (this.config.overdueReminderInterval * 24 * 60 * 60 * 1000);

        if (shouldSendOverdueReminder && commitment.reminders.length < this.config.maxRemindersPerCommitment) {
          batch.immediate.push({
            commitmentId: commitment.id,
            commitment,
            reminder: {
              id: `REM-${commitment.id}-overdue-${Date.now()}`,
              scheduledFor: now,
              sent: false,
              channel: 'in_app',
            },
            daysUntilDue,
            isOverdue: true,
            priority: commitment.priority,
          });
        }
      }
    }

    // Trier par priorité
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    batch.immediate.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return batch;
  }

  // ---------------------------------------------------------------------------
  // TEMPLATES
  // ---------------------------------------------------------------------------

  generateReminderTemplate(reminder: PendingReminder): ReminderTemplate {
    const { commitment, daysUntilDue, isOverdue } = reminder;

    if (isOverdue) {
      const daysOverdue = Math.abs(daysUntilDue);
      return {
        subject: `[RETARD] Engagement en retard: ${commitment.title}`,
        body: `L'engagement "${commitment.title}" est en retard de ${daysOverdue} jour(s).

Responsable: ${commitment.owner}
Date prévue: ${new Date(commitment.dueDate).toLocaleDateString('fr-FR')}
Priorité: ${this.formatPriority(commitment.priority)}

${commitment.description}

Merci de mettre à jour le statut de cet engagement.`,
        urgencyLevel: daysOverdue > 7 ? 'critical' : daysOverdue > 3 ? 'high' : 'medium',
      };
    }

    if (daysUntilDue === 0) {
      return {
        subject: `[AUJOURD'HUI] Échéance: ${commitment.title}`,
        body: `L'engagement "${commitment.title}" arrive à échéance aujourd'hui.

Responsable: ${commitment.owner}
Priorité: ${this.formatPriority(commitment.priority)}

${commitment.description}`,
        urgencyLevel: commitment.priority === 'critical' ? 'critical' : 'high',
      };
    }

    if (daysUntilDue <= 2) {
      return {
        subject: `[RAPPEL] Échéance proche: ${commitment.title}`,
        body: `L'engagement "${commitment.title}" arrive à échéance dans ${daysUntilDue} jour(s).

Responsable: ${commitment.owner}
Date prévue: ${new Date(commitment.dueDate).toLocaleDateString('fr-FR')}
Priorité: ${this.formatPriority(commitment.priority)}

${commitment.description}`,
        urgencyLevel: commitment.priority === 'critical' ? 'high' : 'medium',
      };
    }

    return {
      subject: `[INFO] Rappel engagement: ${commitment.title}`,
      body: `Rappel: L'engagement "${commitment.title}" est prévu pour le ${new Date(commitment.dueDate).toLocaleDateString('fr-FR')} (dans ${daysUntilDue} jours).

Responsable: ${commitment.owner}
Priorité: ${this.formatPriority(commitment.priority)}

${commitment.description}`,
      urgencyLevel: 'low',
    };
  }

  private formatPriority(priority: CommitmentPriority): string {
    const labels = {
      critical: 'Critique',
      high: 'Haute',
      medium: 'Moyenne',
      low: 'Basse',
    };
    return labels[priority];
  }

  // ---------------------------------------------------------------------------
  // ESCALADE
  // ---------------------------------------------------------------------------

  /**
   * Détermine si un engagement nécessite une escalade
   */
  shouldEscalate(commitment: Commitment): {
    shouldEscalate: boolean;
    reason?: string;
    level: 'warning' | 'alert' | 'critical';
  } {
    const now = new Date();
    const dueDate = new Date(commitment.dueDate);
    const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    // Engagement critique en retard
    if (commitment.priority === 'critical' && daysOverdue > 0) {
      return {
        shouldEscalate: true,
        reason: `Engagement critique en retard de ${daysOverdue} jour(s)`,
        level: daysOverdue > 3 ? 'critical' : 'alert',
      };
    }

    // Engagement haute priorité en retard de plus de 3 jours
    if (commitment.priority === 'high' && daysOverdue > 3) {
      return {
        shouldEscalate: true,
        reason: `Engagement important en retard de ${daysOverdue} jour(s)`,
        level: daysOverdue > 7 ? 'critical' : 'alert',
      };
    }

    // Tout engagement en retard de plus de 7 jours
    if (daysOverdue > 7) {
      return {
        shouldEscalate: true,
        reason: `Engagement en retard de ${daysOverdue} jour(s)`,
        level: daysOverdue > 14 ? 'critical' : 'warning',
      };
    }

    // Trop de rappels envoyés sans réponse
    const sentReminders = commitment.reminders.filter(r => r.sent).length;
    if (sentReminders >= 5) {
      return {
        shouldEscalate: true,
        reason: `${sentReminders} rappels envoyés sans réponse`,
        level: 'warning',
      };
    }

    return { shouldEscalate: false, level: 'warning' };
  }

  // ---------------------------------------------------------------------------
  // CONFIGURATION
  // ---------------------------------------------------------------------------

  updateConfig(newConfig: Partial<ReminderConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ReminderConfig {
    return { ...this.config };
  }
}

export default ReminderEngine;
