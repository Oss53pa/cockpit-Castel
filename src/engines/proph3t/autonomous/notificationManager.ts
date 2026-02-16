// ============================================================================
// PROPH3T ENGINE V2 — NOTIFICATION MANAGER (ADDENDUM)
// ============================================================================
// Gestion centralisée des notifications utilisateur
// ============================================================================

import type { Prediction, Anomaly } from '../core/types';
import type { Alert, AlertLevel } from '../reporters/alertManager';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push' | 'webhook';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Notification {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  channel: NotificationChannel;
  status: NotificationStatus;
  createdAt: Date;
  sentAt?: Date;
  readAt?: Date;
  expiresAt?: Date;
  sourceType: 'alert' | 'prediction' | 'task' | 'system' | 'custom';
  sourceId?: string;
  actions?: NotificationAction[];
  metadata?: Record<string, unknown>;
  recipient?: string;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  primary?: boolean;
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    in_app: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
    webhook: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
  priorities: {
    low: NotificationChannel[];
    normal: NotificationChannel[];
    high: NotificationChannel[];
    urgent: NotificationChannel[];
  };
  digest: {
    enabled: boolean;
    frequency: 'hourly' | 'daily' | 'weekly';
    time?: string;
  };
}

export interface NotificationStats {
  total: number;
  byStatus: Record<NotificationStatus, number>;
  byChannel: Record<NotificationChannel, number>;
  byPriority: Record<NotificationPriority, number>;
  unreadCount: number;
  sentToday: number;
  failedToday: number;
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  headers?: Record<string, string>;
  retries?: number;
}

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class NotificationManager {
  private notifications: Map<string, Notification> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private webhookConfig: WebhookConfig | null = null;
  private sentToday = 0;
  private failedToday = 0;
  private lastDayReset: number = new Date().getDate();

  private channelHandlers: Map<NotificationChannel, (notification: Notification) => Promise<boolean>> = new Map();

  constructor() {
    this.channelHandlers.set('in_app', async (n) => {
      n.status = 'delivered';
      return true;
    });
  }

  public registerChannelHandler(
    channel: NotificationChannel,
    handler: (notification: Notification) => Promise<boolean>
  ): void {
    this.channelHandlers.set(channel, handler);
  }

  public configureWebhook(config: WebhookConfig): void {
    this.webhookConfig = config;

    this.channelHandlers.set('webhook', async (notification) => {
      if (!this.webhookConfig) return false;

      try {
        const response = await fetch(this.webhookConfig.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.webhookConfig.secret && { 'X-Webhook-Secret': this.webhookConfig.secret }),
            ...this.webhookConfig.headers,
          },
          body: JSON.stringify({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            timestamp: notification.createdAt.toISOString(),
            metadata: notification.metadata,
          }),
        });

        return response.ok;
      } catch (error) {
        logger.error('[NotificationManager] Webhook error:', error);
        return false;
      }
    });
  }

  public async notify(
    title: string,
    message: string,
    options: {
      priority?: NotificationPriority;
      channel?: NotificationChannel;
      sourceType?: Notification['sourceType'];
      sourceId?: string;
      actions?: NotificationAction[];
      recipient?: string;
      expiresIn?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<Notification> {
    const now = new Date();
    const id = `notif-${now.getTime()}-${Math.random().toString(36).substr(2, 9)}`;

    const notification: Notification = {
      id,
      title,
      message,
      priority: options.priority || 'normal',
      channel: options.channel || 'in_app',
      status: 'pending',
      createdAt: now,
      sourceType: options.sourceType || 'custom',
      sourceId: options.sourceId,
      actions: options.actions,
      recipient: options.recipient,
      metadata: options.metadata,
    };

    if (options.expiresIn) {
      notification.expiresAt = new Date(now.getTime() + options.expiresIn * 60 * 1000);
    }

    this.notifications.set(id, notification);

    if (options.recipient && this.isInQuietHours(options.recipient) && options.priority !== 'urgent') {
      notification.status = 'pending';
      return notification;
    }

    await this.send(notification);

    return notification;
  }

  public async notifyFromAlert(alert: Alert, recipient?: string): Promise<Notification> {
    const priority = this.alertLevelToPriority(alert.level);

    return this.notify(alert.title, alert.message, {
      priority,
      channel: priority === 'urgent' ? 'email' : 'in_app',
      sourceType: 'alert',
      sourceId: alert.id,
      recipient,
      actions: alert.suggestedActions.slice(0, 2).map((action, i) => ({
        id: `action-${i}`,
        label: action.substring(0, 30),
        action: action,
        primary: i === 0,
      })),
      metadata: {
        alertLevel: alert.level,
        module: alert.module,
      },
    });
  }

  public async notifyFromPrediction(prediction: Prediction, recipient?: string): Promise<Notification> {
    const priority = prediction.impact === 'critical' ? 'urgent' :
      prediction.impact === 'high' ? 'high' : 'normal';

    return this.notify(
      `Prédiction: ${prediction.title}`,
      prediction.description,
      {
        priority,
        sourceType: 'prediction',
        sourceId: prediction.id,
        recipient,
        metadata: {
          probability: prediction.probability,
          impact: prediction.impact,
          confidence: prediction.confidence.value,
        },
      }
    );
  }

  public markAsRead(id: string): boolean {
    const notification = this.notifications.get(id);
    if (!notification) return false;

    notification.status = 'read';
    notification.readAt = new Date();
    return true;
  }

  public markAllAsRead(recipient?: string): number {
    let count = 0;
    for (const notification of this.notifications.values()) {
      if (notification.status !== 'read') {
        if (!recipient || notification.recipient === recipient) {
          notification.status = 'read';
          notification.readAt = new Date();
          count++;
        }
      }
    }
    return count;
  }

  public getUnread(recipient?: string): Notification[] {
    const now = new Date();
    return Array.from(this.notifications.values())
      .filter(n => {
        if (n.status === 'read') return false;
        if (n.expiresAt && n.expiresAt < now) return false;
        if (recipient && n.recipient !== recipient) return false;
        return true;
      })
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }

  public getAll(options?: {
    recipient?: string;
    status?: NotificationStatus;
    priority?: NotificationPriority;
    limit?: number;
  }): Notification[] {
    let result = Array.from(this.notifications.values());

    if (options?.recipient) {
      result = result.filter(n => n.recipient === options.recipient);
    }
    if (options?.status) {
      result = result.filter(n => n.status === options.status);
    }
    if (options?.priority) {
      result = result.filter(n => n.priority === options.priority);
    }

    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  public getStats(): NotificationStats {
    this.resetDailyCountersIfNeeded();

    const stats: NotificationStats = {
      total: this.notifications.size,
      byStatus: { pending: 0, sent: 0, delivered: 0, read: 0, failed: 0 },
      byChannel: { in_app: 0, email: 0, sms: 0, push: 0, webhook: 0 },
      byPriority: { low: 0, normal: 0, high: 0, urgent: 0 },
      unreadCount: 0,
      sentToday: this.sentToday,
      failedToday: this.failedToday,
    };

    for (const notification of this.notifications.values()) {
      stats.byStatus[notification.status]++;
      stats.byChannel[notification.channel]++;
      stats.byPriority[notification.priority]++;

      if (notification.status !== 'read') {
        stats.unreadCount++;
      }
    }

    return stats;
  }

  public setPreferences(userId: string, prefs: Partial<NotificationPreferences>): void {
    const existing = this.preferences.get(userId) || this.getDefaultPreferences(userId);
    this.preferences.set(userId, { ...existing, ...prefs });
  }

  public getPreferences(userId: string): NotificationPreferences {
    return this.preferences.get(userId) || this.getDefaultPreferences(userId);
  }

  public cleanup(olderThanDays = 30): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    let cleaned = 0;
    for (const [id, notification] of this.notifications) {
      if (notification.createdAt < cutoff || (notification.expiresAt && notification.expiresAt < new Date())) {
        this.notifications.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  private async send(notification: Notification): Promise<boolean> {
    const handler = this.channelHandlers.get(notification.channel);

    if (!handler) {
      logger.warn(`[NotificationManager] Pas de handler pour canal ${notification.channel}`);
      notification.status = 'failed';
      this.failedToday++;
      return false;
    }

    try {
      notification.status = 'sent';
      notification.sentAt = new Date();

      const success = await handler(notification);

      if (success) {
        notification.status = 'delivered';
        this.sentToday++;
      } else {
        notification.status = 'failed';
        this.failedToday++;
      }

      return success;
    } catch (error) {
      logger.error(`[NotificationManager] Erreur envoi:`, error);
      notification.status = 'failed';
      this.failedToday++;
      return false;
    }
  }

  private isInQuietHours(userId: string): boolean {
    const prefs = this.preferences.get(userId);
    if (!prefs?.quietHours?.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = prefs.quietHours.start.split(':').map(Number);
    const [endH, endM] = prefs.quietHours.end.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes > endMinutes) {
      return currentTime >= startMinutes || currentTime < endMinutes;
    }

    return currentTime >= startMinutes && currentTime < endMinutes;
  }

  private alertLevelToPriority(level: AlertLevel): NotificationPriority {
    switch (level) {
      case 'emergency': return 'urgent';
      case 'critical': return 'urgent';
      case 'warning': return 'high';
      case 'info': return 'normal';
      default: return 'normal';
    }
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      channels: {
        in_app: true,
        email: true,
        sms: false,
        push: true,
        webhook: false,
      },
      priorities: {
        low: ['in_app'],
        normal: ['in_app', 'push'],
        high: ['in_app', 'push', 'email'],
        urgent: ['in_app', 'push', 'email', 'sms'],
      },
      digest: {
        enabled: false,
        frequency: 'daily',
      },
    };
  }

  private resetDailyCountersIfNeeded(): void {
    const today = new Date().getDate();
    if (today !== this.lastDayReset) {
      this.sentToday = 0;
      this.failedToday = 0;
      this.lastDayReset = today;
    }
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default NotificationManager;
