// ============================================================================
// PROPH3T ENGINE V2 — ALERT MANAGER
// ============================================================================
// Gestion centralisée des alertes avec priorisation et escalade
// ============================================================================

import type { Prediction, Anomaly, PrescriptiveAction } from '../core/types';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export type AlertLevel = 'info' | 'warning' | 'critical' | 'emergency';
export type AlertChannel = 'ui' | 'email' | 'sms' | 'webhook';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'escalated';

export interface Alert {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
  source: 'prediction' | 'anomaly' | 'cascade' | 'threshold' | 'pattern';
  sourceId: string;
  module: string;
  timestamp: Date;
  status: AlertStatus;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  escalationHistory: EscalationEvent[];
  metadata: Record<string, unknown>;
  suggestedActions: string[];
  autoResolveCondition?: string;
}

export interface EscalationEvent {
  timestamp: Date;
  fromLevel: AlertLevel;
  toLevel: AlertLevel;
  reason: string;
  notifiedChannels: AlertChannel[];
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (context: AlertContext) => boolean;
  level: AlertLevel;
  messageTemplate: string;
  channels: AlertChannel[];
  escalationMinutes?: number; // Minutes avant escalade
  autoResolve?: boolean;
}

export interface AlertContext {
  predictions: Prediction[];
  anomalies: Anomaly[];
  metrics: Record<string, number>;
  previousAlerts: Alert[];
}

export interface AlertSummary {
  total: number;
  byLevel: Record<AlertLevel, number>;
  byStatus: Record<AlertStatus, number>;
  byModule: Record<string, number>;
  criticalCount: number;
  unresolvedCount: number;
  averageResolutionTimeHours: number;
}

// ============================================================================
// RÈGLES D'ALERTE PRÉDÉFINIES
// ============================================================================

const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'rule-budget-critical',
    name: 'Dépassement budget critique',
    condition: (ctx) => ctx.predictions.some(p =>
      p.type === 'cost' && p.impact === 'critical' && p.probability > 70
    ),
    level: 'critical',
    messageTemplate: 'Dépassement budgétaire critique détecté. Action immédiate requise.',
    channels: ['ui', 'email'],
    escalationMinutes: 120,
  },
  {
    id: 'rule-anchor-delay',
    name: 'Risque locataire ancre',
    condition: (ctx) =>
      ctx.metrics.joursRestants < 180 &&
      ctx.metrics.anchorSigned === 0,
    level: 'critical',
    messageTemplate: 'Locataire ancre non signé à moins de 6 mois de l\'ouverture.',
    channels: ['ui', 'email'],
    escalationMinutes: 60,
  },
  {
    id: 'rule-schedule-delay',
    name: 'Retard planning significatif',
    condition: (ctx) => ctx.predictions.some(p =>
      p.type === 'schedule' && p.impact === 'high'
    ),
    level: 'warning',
    messageTemplate: 'Retard significatif détecté sur le planning.',
    channels: ['ui'],
    escalationMinutes: 240,
  },
  {
    id: 'rule-occupancy-low',
    name: 'Taux occupation insuffisant',
    condition: (ctx) =>
      ctx.metrics.tauxOccupation < 50 &&
      ctx.metrics.joursRestants < 120,
    level: 'critical',
    messageTemplate: 'Taux d\'occupation < 50% à moins de 4 mois de l\'ouverture.',
    channels: ['ui', 'email'],
    escalationMinutes: 180,
  },
  {
    id: 'rule-anomaly-critical',
    name: 'Anomalie critique détectée',
    condition: (ctx) => ctx.anomalies.some(a => a.severity === 'critical'),
    level: 'critical',
    messageTemplate: 'Anomalie critique détectée nécessitant investigation.',
    channels: ['ui'],
  },
  {
    id: 'rule-cascade-effect',
    name: 'Effet cascade détecté',
    condition: (ctx) => ctx.predictions.filter(p =>
      p.triggerConditions?.some(t => t.includes('cascade'))
    ).length >= 2,
    level: 'warning',
    messageTemplate: 'Effets cascade détectés entre plusieurs modules.',
    channels: ['ui'],
  },
];

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class AlertManager {
  private alerts: Map<string, Alert> = new Map();
  private rules: AlertRule[] = [...DEFAULT_ALERT_RULES];
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Évalue le contexte et génère les alertes nécessaires
   */
  public evaluate(context: AlertContext): Alert[] {
    const newAlerts: Alert[] = [];
    const now = new Date();

    for (const rule of this.rules) {
      try {
        if (rule.condition(context)) {
          // Vérifier si une alerte similaire existe déjà
          const existingAlert = this.findSimilarAlert(rule.id);

          if (!existingAlert) {
            const alert = this.createAlert(rule, context, now);
            this.alerts.set(alert.id, alert);
            newAlerts.push(alert);

            // Programmer l'escalade si nécessaire
            if (rule.escalationMinutes) {
              this.scheduleEscalation(alert, rule.escalationMinutes);
            }
          }
        }
      } catch (error) {
        logger.warn(`Erreur évaluation règle ${rule.id}:`, error);
      }
    }

    // Vérifier les alertes à auto-résoudre
    this.checkAutoResolve(context);

    return newAlerts;
  }

  /**
   * Crée une alerte depuis une prédiction
   */
  public createFromPrediction(prediction: Prediction): Alert {
    const now = new Date();
    const level = this.mapImpactToLevel(prediction.impact);

    const alert: Alert = {
      id: `alert-pred-${prediction.id}`,
      level,
      title: prediction.title,
      message: prediction.description,
      source: 'prediction',
      sourceId: prediction.id,
      module: prediction.sourceModule,
      timestamp: now,
      status: 'active',
      escalationHistory: [],
      metadata: {
        probability: prediction.probability,
        confidence: prediction.confidence.value,
        timeHorizon: prediction.timeHorizon,
      },
      suggestedActions: prediction.mitigationActions?.map(a => a.action) || [],
    };

    this.alerts.set(alert.id, alert);
    return alert;
  }

  /**
   * Crée une alerte depuis une anomalie
   */
  public createFromAnomaly(anomaly: Anomaly): Alert {
    const now = new Date();
    const level = this.mapSeverityToLevel(anomaly.severity);

    const alert: Alert = {
      id: `alert-anom-${anomaly.id}`,
      level,
      title: `Anomalie: ${anomaly.metric}`,
      message: anomaly.description,
      source: 'anomaly',
      sourceId: anomaly.id,
      module: this.inferModuleFromMetric(anomaly.metric),
      timestamp: now,
      status: 'active',
      escalationHistory: [],
      metadata: {
        currentValue: anomaly.currentValue,
        expectedValue: anomaly.expectedValue,
        deviation: anomaly.deviation,
        isEscalating: anomaly.isEscalating,
      },
      suggestedActions: anomaly.prescribedActions?.map(a => a.action) || [],
    };

    this.alerts.set(alert.id, alert);
    return alert;
  }

  /**
   * Acquitte une alerte
   */
  public acknowledge(alertId: string, userId?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;

    // Annuler l'escalade programmée
    const timer = this.escalationTimers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(alertId);
    }

    return true;
  }

  /**
   * Résout une alerte
   */
  public resolve(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();

    // Annuler l'escalade programmée
    const timer = this.escalationTimers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(alertId);
    }

    return true;
  }

  /**
   * Escalade une alerte au niveau supérieur
   */
  public escalate(alertId: string, reason: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    const fromLevel = alert.level;
    const toLevel = this.getNextLevel(fromLevel);

    if (toLevel === fromLevel) return false; // Déjà au max

    alert.level = toLevel;
    alert.status = 'escalated';
    alert.escalationHistory.push({
      timestamp: new Date(),
      fromLevel,
      toLevel,
      reason,
      notifiedChannels: this.getChannelsForLevel(toLevel),
    });

    return true;
  }

  /**
   * Récupère toutes les alertes actives
   */
  public getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(a => a.status === 'active' || a.status === 'escalated')
      .sort((a, b) => {
        const levelOrder = { emergency: 0, critical: 1, warning: 2, info: 3 };
        return levelOrder[a.level] - levelOrder[b.level];
      });
  }

  /**
   * Récupère les alertes par niveau
   */
  public getAlertsByLevel(level: AlertLevel): Alert[] {
    return Array.from(this.alerts.values())
      .filter(a => a.level === level && a.status !== 'resolved');
  }

  /**
   * Récupère les alertes par module
   */
  public getAlertsByModule(module: string): Alert[] {
    return Array.from(this.alerts.values())
      .filter(a => a.module === module && a.status !== 'resolved');
  }

  /**
   * Génère un résumé des alertes
   */
  public getSummary(): AlertSummary {
    const alerts = Array.from(this.alerts.values());

    const byLevel: Record<AlertLevel, number> = {
      info: 0,
      warning: 0,
      critical: 0,
      emergency: 0,
    };

    const byStatus: Record<AlertStatus, number> = {
      active: 0,
      acknowledged: 0,
      resolved: 0,
      escalated: 0,
    };

    const byModule: Record<string, number> = {};

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    for (const alert of alerts) {
      byLevel[alert.level]++;
      byStatus[alert.status]++;

      if (!byModule[alert.module]) byModule[alert.module] = 0;
      byModule[alert.module]++;

      if (alert.resolvedAt && alert.timestamp) {
        totalResolutionTime += alert.resolvedAt.getTime() - alert.timestamp.getTime();
        resolvedCount++;
      }
    }

    return {
      total: alerts.length,
      byLevel,
      byStatus,
      byModule,
      criticalCount: byLevel.critical + byLevel.emergency,
      unresolvedCount: byStatus.active + byStatus.escalated,
      averageResolutionTimeHours: resolvedCount > 0
        ? Math.round(totalResolutionTime / resolvedCount / (1000 * 60 * 60))
        : 0,
    };
  }

  /**
   * Ajoute une règle d'alerte personnalisée
   */
  public addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  /**
   * Supprime une règle d'alerte
   */
  public removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index === -1) return false;
    this.rules.splice(index, 1);
    return true;
  }

  /**
   * Nettoie les alertes résolues anciennes
   */
  public cleanup(olderThanDays = 30): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    let cleaned = 0;
    for (const [id, alert] of this.alerts) {
      if (alert.status === 'resolved' && alert.resolvedAt && alert.resolvedAt < cutoff) {
        this.alerts.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  private createAlert(rule: AlertRule, context: AlertContext, now: Date): Alert {
    // Trouver la source qui a déclenché la règle
    let sourceId = rule.id;
    let source: Alert['source'] = 'threshold';
    let module = 'général';

    // Essayer de trouver la prédiction/anomalie source
    const triggeringPred = context.predictions.find(p =>
      p.type === 'cost' && p.impact === 'critical'
    );
    if (triggeringPred) {
      sourceId = triggeringPred.id;
      source = 'prediction';
      module = triggeringPred.sourceModule;
    }

    const triggeringAnomaly = context.anomalies.find(a =>
      a.severity === 'critical'
    );
    if (triggeringAnomaly) {
      sourceId = triggeringAnomaly.id;
      source = 'anomaly';
      module = this.inferModuleFromMetric(triggeringAnomaly.metric);
    }

    return {
      id: `alert-${rule.id}-${now.getTime()}`,
      level: rule.level,
      title: rule.name,
      message: rule.messageTemplate,
      source,
      sourceId,
      module,
      timestamp: now,
      status: 'active',
      escalationHistory: [],
      metadata: { ruleId: rule.id },
      suggestedActions: [],
      autoResolveCondition: rule.autoResolve ? 'Condition de déclenchement non remplie' : undefined,
    };
  }

  private findSimilarAlert(ruleId: string): Alert | undefined {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    return Array.from(this.alerts.values()).find(a =>
      a.metadata.ruleId === ruleId &&
      a.status !== 'resolved' &&
      a.timestamp > oneHourAgo
    );
  }

  private scheduleEscalation(alert: Alert, minutes: number): void {
    const timer = setTimeout(() => {
      if (alert.status === 'active') {
        this.escalate(alert.id, 'Non acquitté après ' + minutes + ' minutes');
      }
    }, minutes * 60 * 1000);

    this.escalationTimers.set(alert.id, timer);
  }

  private checkAutoResolve(context: AlertContext): void {
    for (const [id, alert] of this.alerts) {
      if (alert.status !== 'active' || !alert.autoResolveCondition) continue;

      // Trouver la règle originale
      const rule = this.rules.find(r => r.id === alert.metadata.ruleId);
      if (rule && !rule.condition(context)) {
        // La condition n'est plus remplie, résoudre automatiquement
        this.resolve(id);
      }
    }
  }

  private mapImpactToLevel(impact: string): AlertLevel {
    switch (impact) {
      case 'critical': return 'critical';
      case 'high': return 'warning';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  }

  private mapSeverityToLevel(severity: string): AlertLevel {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'warning';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  }

  private getNextLevel(current: AlertLevel): AlertLevel {
    switch (current) {
      case 'info': return 'warning';
      case 'warning': return 'critical';
      case 'critical': return 'emergency';
      case 'emergency': return 'emergency';
    }
  }

  private getChannelsForLevel(level: AlertLevel): AlertChannel[] {
    switch (level) {
      case 'emergency': return ['ui', 'email', 'sms'];
      case 'critical': return ['ui', 'email'];
      case 'warning': return ['ui'];
      case 'info': return ['ui'];
    }
  }

  private inferModuleFromMetric(metric: string): string {
    const metricLower = metric.toLowerCase();
    if (metricLower.includes('budget') || metricLower.includes('cost')) return 'budget';
    if (metricLower.includes('occupation') || metricLower.includes('commercial')) return 'commercialisation';
    if (metricLower.includes('planning') || metricLower.includes('action')) return 'planning';
    if (metricLower.includes('risque')) return 'risques';
    return 'général';
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default AlertManager;
