// ============================================================================
// PROPH3T ENGINE V2 — REPORT CATALOG (ADDENDUM)
// ============================================================================
// Catalogue des 7 types de rapports disponibles
// ============================================================================

import type { ProjectState, ExcoReport } from '../core/types';
import type { ReportContext } from './excoReportGenerator';

// ============================================================================
// TYPES
// ============================================================================

export type ReportType =
  | 'executive_summary'
  | 'budget_detail'
  | 'schedule_status'
  | 'commercial_analysis'
  | 'risk_register'
  | 'action_plan'
  | 'full_monthly';

export interface ReportDefinition {
  id: ReportType;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'on_demand';
  targetAudience: string[];
  estimatedPages: number;
  requiredData: string[];
  icon: string;
}

export interface ReportTemplate {
  id: string;
  type: ReportType;
  title: string;
  sections: ReportTemplateSection[];
  footer?: string;
  branding?: ReportBranding;
}

export interface ReportTemplateSection {
  id: string;
  title: string;
  type: 'narrative' | 'table' | 'chart' | 'metrics' | 'list' | 'custom';
  required: boolean;
  dataBinding: string;
  customRenderer?: string;
}

export interface ReportBranding {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

export interface ScheduledReport {
  id: string;
  reportType: ReportType;
  cronExpression: string;
  recipients: string[];
  format: 'pdf' | 'html' | 'markdown';
  enabled: boolean;
  lastGenerated?: Date;
  nextScheduled?: Date;
}

// ============================================================================
// CATALOGUE DES RAPPORTS
// ============================================================================

export const REPORT_CATALOG: ReportDefinition[] = [
  {
    id: 'executive_summary',
    name: 'Résumé Exécutif',
    description: 'Vue d\'ensemble condensée pour la direction. Statut global, KPIs clés, et actions prioritaires.',
    frequency: 'weekly',
    targetAudience: ['Direction', 'EXCO', 'Actionnaires'],
    estimatedPages: 1,
    requiredData: ['metrics', 'predictions', 'actions'],
    icon: '📊',
  },
  {
    id: 'budget_detail',
    name: 'Rapport Budget Détaillé',
    description: 'Analyse complète du budget: EVM, écarts, prévisions, et recommandations.',
    frequency: 'monthly',
    targetAudience: ['DAF', 'Contrôle de gestion', 'Direction'],
    estimatedPages: 5,
    requiredData: ['budget', 'evm', 'historicalMetrics'],
    icon: '💰',
  },
  {
    id: 'schedule_status',
    name: 'Suivi Planning',
    description: 'État d\'avancement, actions en retard, chemin critique, et projections.',
    frequency: 'weekly',
    targetAudience: ['Chef de projet', 'Direction travaux', 'EXCO'],
    estimatedPages: 3,
    requiredData: ['actions', 'jalons', 'predictions'],
    icon: '📅',
  },
  {
    id: 'commercial_analysis',
    name: 'Analyse Commerciale',
    description: 'Performance commerciale: taux d\'occupation, baux, revenus projetés.',
    frequency: 'weekly',
    targetAudience: ['Direction commerciale', 'EXCO', 'Investisseurs'],
    estimatedPages: 4,
    requiredData: ['commercial', 'anchorTenant', 'revenueProjections'],
    icon: '🏪',
  },
  {
    id: 'risk_register',
    name: 'Registre des Risques',
    description: 'Inventaire des risques, probabilités, impacts, et plans de mitigation.',
    frequency: 'monthly',
    targetAudience: ['EXCO', 'Comité des risques', 'Auditeurs'],
    estimatedPages: 6,
    requiredData: ['predictions', 'anomalies', 'cascades'],
    icon: '⚡',
  },
  {
    id: 'action_plan',
    name: 'Plan d\'Action Prioritaire',
    description: 'Liste structurée des actions à mener, priorisées selon la matrice Eisenhower.',
    frequency: 'weekly',
    targetAudience: ['Équipes opérationnelles', 'Chefs de service'],
    estimatedPages: 2,
    requiredData: ['actions', 'predictions'],
    icon: '✅',
  },
  {
    id: 'full_monthly',
    name: 'Rapport Mensuel Complet',
    description: 'Rapport exhaustif couvrant tous les aspects du projet. Destiné aux revues mensuelles.',
    frequency: 'monthly',
    targetAudience: ['EXCO', 'Conseil d\'administration', 'Investisseurs'],
    estimatedPages: 15,
    requiredData: ['all'],
    icon: '📖',
  },
];

// ============================================================================
// TEMPLATES DE RAPPORTS
// ============================================================================

export const REPORT_TEMPLATES: Record<ReportType, ReportTemplate> = {
  executive_summary: {
    id: 'tpl-executive',
    type: 'executive_summary',
    title: 'Résumé Exécutif - COCKPIT COSMOS',
    sections: [
      { id: 'status', title: 'Statut Global', type: 'metrics', required: true, dataBinding: 'overallStatus' },
      { id: 'kpis', title: 'KPIs Clés', type: 'metrics', required: true, dataBinding: 'keyMetrics' },
      { id: 'alerts', title: 'Alertes', type: 'list', required: false, dataBinding: 'criticalPredictions' },
      { id: 'actions', title: 'Actions Prioritaires', type: 'list', required: true, dataBinding: 'topActions' },
    ],
  },
  budget_detail: {
    id: 'tpl-budget',
    type: 'budget_detail',
    title: 'Rapport Budget Détaillé',
    sections: [
      { id: 'evm', title: 'Analyse EVM', type: 'metrics', required: true, dataBinding: 'evm' },
      { id: 'variance', title: 'Analyse des Écarts', type: 'table', required: true, dataBinding: 'budgetVariance' },
      { id: 'forecast', title: 'Prévisions', type: 'chart', required: true, dataBinding: 'budgetForecast' },
      { id: 'cashflow', title: 'Trésorerie', type: 'chart', required: false, dataBinding: 'cashflow' },
      { id: 'recommendations', title: 'Recommandations', type: 'narrative', required: true, dataBinding: 'budgetActions' },
    ],
  },
  schedule_status: {
    id: 'tpl-schedule',
    type: 'schedule_status',
    title: 'Suivi Planning',
    sections: [
      { id: 'progress', title: 'Avancement Global', type: 'metrics', required: true, dataBinding: 'progress' },
      { id: 'milestones', title: 'Jalons', type: 'table', required: true, dataBinding: 'milestones' },
      { id: 'critical', title: 'Chemin Critique', type: 'list', required: true, dataBinding: 'criticalPath' },
      { id: 'late', title: 'Actions en Retard', type: 'table', required: true, dataBinding: 'lateActions' },
      { id: 'projection', title: 'Date de Fin Projetée', type: 'narrative', required: true, dataBinding: 'scheduleProjection' },
    ],
  },
  commercial_analysis: {
    id: 'tpl-commercial',
    type: 'commercial_analysis',
    title: 'Analyse Commerciale',
    sections: [
      { id: 'occupancy', title: 'Taux d\'Occupation', type: 'chart', required: true, dataBinding: 'occupancy' },
      { id: 'anchor', title: 'Locataire Ancre', type: 'narrative', required: true, dataBinding: 'anchorStatus' },
      { id: 'leases', title: 'Baux Signés', type: 'table', required: true, dataBinding: 'leases' },
      { id: 'pipeline', title: 'Pipeline Commercial', type: 'table', required: false, dataBinding: 'commercialPipeline' },
      { id: 'revenue', title: 'Revenus Projetés', type: 'chart', required: true, dataBinding: 'revenueProjection' },
    ],
  },
  risk_register: {
    id: 'tpl-risk',
    type: 'risk_register',
    title: 'Registre des Risques',
    sections: [
      { id: 'heatmap', title: 'Matrice des Risques', type: 'chart', required: true, dataBinding: 'riskHeatmap' },
      { id: 'top-risks', title: 'Top 10 Risques', type: 'table', required: true, dataBinding: 'topRisks' },
      { id: 'new', title: 'Nouveaux Risques', type: 'list', required: false, dataBinding: 'newRisks' },
      { id: 'mitigations', title: 'Plans de Mitigation', type: 'table', required: true, dataBinding: 'mitigationPlans' },
      { id: 'trends', title: 'Évolution', type: 'chart', required: false, dataBinding: 'riskTrends' },
    ],
  },
  action_plan: {
    id: 'tpl-actions',
    type: 'action_plan',
    title: 'Plan d\'Action Prioritaire',
    sections: [
      { id: 'p0', title: 'Priorité Absolue (P0)', type: 'list', required: true, dataBinding: 'p0Actions' },
      { id: 'p1', title: 'Haute Priorité (P1)', type: 'list', required: true, dataBinding: 'p1Actions' },
      { id: 'p2', title: 'À Planifier (P2)', type: 'list', required: false, dataBinding: 'p2Actions' },
      { id: 'owners', title: 'Attribution', type: 'table', required: false, dataBinding: 'actionOwners' },
    ],
  },
  full_monthly: {
    id: 'tpl-monthly',
    type: 'full_monthly',
    title: 'Rapport Mensuel Complet',
    sections: [
      { id: 'executive', title: 'Résumé Exécutif', type: 'narrative', required: true, dataBinding: 'executiveSummary' },
      { id: 'budget', title: 'Budget', type: 'custom', required: true, dataBinding: 'budgetSection' },
      { id: 'schedule', title: 'Planning', type: 'custom', required: true, dataBinding: 'scheduleSection' },
      { id: 'commercial', title: 'Commercial', type: 'custom', required: true, dataBinding: 'commercialSection' },
      { id: 'risks', title: 'Risques', type: 'custom', required: true, dataBinding: 'riskSection' },
      { id: 'actions', title: 'Plan d\'Action', type: 'custom', required: true, dataBinding: 'actionSection' },
      { id: 'outlook', title: 'Perspectives', type: 'narrative', required: true, dataBinding: 'outlook' },
      { id: 'appendix', title: 'Annexes', type: 'custom', required: false, dataBinding: 'appendix' },
    ],
  },
};

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class ReportCatalog {
  private scheduledReports: Map<string, ScheduledReport> = new Map();
  private customTemplates: Map<string, ReportTemplate> = new Map();

  public getCatalog(): ReportDefinition[] {
    return REPORT_CATALOG;
  }

  public getReportDefinition(type: ReportType): ReportDefinition | undefined {
    return REPORT_CATALOG.find(r => r.id === type);
  }

  public getTemplate(type: ReportType): ReportTemplate {
    return this.customTemplates.get(type) || REPORT_TEMPLATES[type];
  }

  public registerCustomTemplate(type: ReportType, template: ReportTemplate): void {
    this.customTemplates.set(type, template);
  }

  public scheduleReport(config: Omit<ScheduledReport, 'id' | 'lastGenerated' | 'nextScheduled'>): ScheduledReport {
    const id = `scheduled-${config.reportType}-${Date.now()}`;
    const scheduled: ScheduledReport = {
      ...config,
      id,
      nextScheduled: this.calculateNextRun(config.cronExpression),
    };

    this.scheduledReports.set(id, scheduled);
    return scheduled;
  }

  public unscheduleReport(id: string): boolean {
    return this.scheduledReports.delete(id);
  }

  public getScheduledReports(): ScheduledReport[] {
    return Array.from(this.scheduledReports.values());
  }

  public getDueReports(): ScheduledReport[] {
    const now = new Date();
    return Array.from(this.scheduledReports.values())
      .filter(r => r.enabled && r.nextScheduled && r.nextScheduled <= now);
  }

  public markGenerated(id: string): void {
    const report = this.scheduledReports.get(id);
    if (report) {
      report.lastGenerated = new Date();
      report.nextScheduled = this.calculateNextRun(report.cronExpression);
    }
  }

  public suggestReports(context: {
    dayOfWeek: number;
    dayOfMonth: number;
    hasUrgentIssues: boolean;
    lastReportDate?: Date;
  }): ReportType[] {
    const suggestions: ReportType[] = [];

    if (context.hasUrgentIssues) {
      suggestions.push('executive_summary');
    }

    if (context.dayOfWeek === 1) {
      suggestions.push('schedule_status', 'action_plan');
    }

    if (context.dayOfMonth === 1) {
      suggestions.push('full_monthly', 'budget_detail', 'risk_register');
    }

    if (context.lastReportDate) {
      const daysSince = Math.floor(
        (Date.now() - context.lastReportDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince >= 7 && !suggestions.includes('executive_summary')) {
        suggestions.push('executive_summary');
      }
    }

    return [...new Set(suggestions)];
  }

  private calculateNextRun(cronExpression: string): Date {
    const now = new Date();
    const parts = cronExpression.split(' ');

    if (parts.length !== 5) {
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(8, 0, 0, 0);
      return next;
    }

    const [minute, hour] = parts;
    const next = new Date(now);
    next.setHours(parseInt(hour) || 8, parseInt(minute) || 0, 0, 0);

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default ReportCatalog;
