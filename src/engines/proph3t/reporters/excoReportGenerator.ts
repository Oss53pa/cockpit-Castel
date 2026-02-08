// ============================================================================
// PROPH3T ENGINE V2 — EXCO REPORT GENERATOR
// ============================================================================
// Génération de rapports pour le comité exécutif (EXCO)
// ============================================================================

import type {
  Prediction,
  Anomaly,
  CascadeEffect,
  ProjectState,
  ExcoReport,
  ExcoSection,
} from '../core/types';
import type { PrioritizedAction } from '../prescribers/priorityMatrix';
import type { EVMResult } from '../predictors/costPredictor';
import type { PatternMatch } from '../memory/patternStore';
import {
  InsightNarrator,
  type ExecutiveSummary,
  type ModuleNarrative,
  type NarrativeSection,
} from './insightNarrator';

// ============================================================================
// TYPES
// ============================================================================

export interface ReportConfig {
  includePredictions?: boolean;
  includeAnomalies?: boolean;
  includeCascades?: boolean;
  includeActions?: boolean;
  includeCharts?: boolean;
  includeAppendix?: boolean;
  maxPredictions?: number;
  maxActions?: number;
  format?: 'full' | 'summary' | 'executive';
}

export interface ReportContext {
  state: ProjectState;
  predictions: Prediction[];
  anomalies: Anomaly[];
  cascades: CascadeEffect[];
  actions: PrioritizedAction[];
  evm: EVMResult;
  patterns?: PatternMatch[];
  trends?: Record<string, { current: number; previous: number; trend: string }>;
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'gauge' | 'radar';
  title: string;
  data: Record<string, unknown>;
}

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class ExcoReportGenerator {
  private narrator: InsightNarrator;

  constructor() {
    this.narrator = new InsightNarrator();
  }

  /**
   * Génère un rapport EXCO complet
   */
  public generate(context: ReportContext, config: ReportConfig = {}): ExcoReport {
    const {
      includePredictions = true,
      includeAnomalies = true,
      includeCascades = true,
      includeActions = true,
      includeCharts = true,
      includeAppendix = true,
      maxPredictions = 10,
      maxActions = 15,
      format = 'full',
    } = config;

    const now = new Date();
    const sections: ExcoSection[] = [];

    // 1. Résumé exécutif (toujours inclus)
    const executiveSummary = this.narrator.generateExecutiveSummary({
      state: context.state,
      predictions: context.predictions,
      anomalies: context.anomalies,
      cascades: context.cascades,
      actions: context.actions,
      evm: context.evm,
    });

    sections.push(this.buildExecutiveSummarySection(executiveSummary, context.evm));

    // 2. Modules status
    const moduleNarratives = this.narrator.generateModuleNarratives({
      state: context.state,
      predictions: context.predictions,
      anomalies: context.anomalies,
      cascades: context.cascades,
      actions: context.actions,
      evm: context.evm,
    });

    sections.push(this.buildModulesSection(moduleNarratives, context));

    // 3. Prédictions clés
    if (includePredictions && context.predictions.length > 0) {
      sections.push(this.buildPredictionsSection(
        context.predictions.slice(0, maxPredictions)
      ));
    }

    // 4. Anomalies
    if (includeAnomalies && context.anomalies.length > 0 && format !== 'executive') {
      sections.push(this.buildAnomaliesSection(context.anomalies));
    }

    // 5. Cascades
    if (includeCascades && context.cascades.length > 0 && format !== 'executive') {
      sections.push(this.buildCascadesSection(context.cascades));
    }

    // 6. Actions recommandées
    if (includeActions && context.actions.length > 0) {
      sections.push(this.buildActionsSection(
        context.actions.slice(0, maxActions)
      ));
    }

    // 7. Patterns (si disponibles)
    if (context.patterns && context.patterns.length > 0 && format === 'full') {
      sections.push(this.buildPatternsSection(context.patterns));
    }

    // 8. Graphiques
    const charts: ChartData[] = [];
    if (includeCharts) {
      charts.push(...this.generateCharts(context));
    }

    // Calculer le score global
    const overallScore = this.calculateOverallScore(context);
    const overallStatus = overallScore >= 70 ? 'healthy' :
      overallScore >= 50 ? 'warning' : 'critical';

    // Générer les insights
    const insights = this.generateKeyInsights(context, moduleNarratives);

    // Recommandations top
    const topRecommendations = context.actions
      .filter(a => a.priority === 'P0' || a.priority === 'P1')
      .slice(0, 5)
      .map(a => a.action);

    return {
      generatedAt: now,
      period: {
        from: this.getReportStartDate(context.state),
        to: now,
      },
      overallStatus,
      overallScore,
      sections,
      charts,
      insights,
      topRecommendations,
      metadata: {
        version: '2.0',
        format,
        predictionsCount: context.predictions.length,
        anomaliesCount: context.anomalies.length,
        actionsCount: context.actions.length,
      },
    };
  }

  /**
   * Génère un rapport résumé (une page)
   */
  public generateSummary(context: ReportContext): ExcoReport {
    return this.generate(context, {
      format: 'summary',
      includePredictions: true,
      includeAnomalies: false,
      includeCascades: false,
      includeActions: true,
      includeCharts: false,
      includeAppendix: false,
      maxPredictions: 5,
      maxActions: 5,
    });
  }

  /**
   * Génère un rapport exécutif (très condensé)
   */
  public generateExecutive(context: ReportContext): ExcoReport {
    return this.generate(context, {
      format: 'executive',
      includePredictions: true,
      includeAnomalies: false,
      includeCascades: false,
      includeActions: true,
      includeCharts: true,
      includeAppendix: false,
      maxPredictions: 3,
      maxActions: 5,
    });
  }

  /**
   * Exporte le rapport au format Markdown
   */
  public toMarkdown(report: ExcoReport): string {
    const lines: string[] = [];

    // En-tête
    lines.push('# Rapport EXCO - COCKPIT COSMOS');
    lines.push(`*Généré le ${report.generatedAt.toLocaleDateString('fr-FR')}*`);
    lines.push('');
    lines.push(`**Statut global**: ${this.getStatusEmoji(report.overallStatus)} ${report.overallStatus.toUpperCase()} (Score: ${report.overallScore}/100)`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // Sections
    for (const section of report.sections) {
      lines.push(`## ${section.title}`);
      lines.push('');
      lines.push(section.narrative);
      lines.push('');

      // Points clés
      if (section.keyPoints && section.keyPoints.length > 0) {
        for (const point of section.keyPoints) {
          lines.push(`- ${point}`);
        }
        lines.push('');
      }

      // Métriques
      if (section.metrics && Object.keys(section.metrics).length > 0) {
        lines.push('**Métriques:**');
        for (const [key, value] of Object.entries(section.metrics)) {
          lines.push(`- ${key}: ${value}`);
        }
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }

    // Insights
    if (report.insights.length > 0) {
      lines.push('## Insights Clés');
      lines.push('');
      for (const insight of report.insights) {
        lines.push(`- ${insight}`);
      }
      lines.push('');
    }

    // Recommandations
    if (report.topRecommendations.length > 0) {
      lines.push('## Recommandations Prioritaires');
      lines.push('');
      for (let i = 0; i < report.topRecommendations.length; i++) {
        lines.push(`${i + 1}. ${report.topRecommendations[i]}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Exporte le rapport au format HTML simplifié
   */
  public toHTML(report: ExcoReport): string {
    const statusClass = report.overallStatus === 'critical' ? 'critical' :
      report.overallStatus === 'warning' ? 'warning' : 'healthy';

    let html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport EXCO - COCKPIT COSMOS</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a1a1a; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }
    h2 { color: #333; margin-top: 30px; }
    .status { padding: 10px 20px; border-radius: 8px; display: inline-block; font-weight: bold; }
    .status.healthy { background: #d4edda; color: #155724; }
    .status.warning { background: #fff3cd; color: #856404; }
    .status.critical { background: #f8d7da; color: #721c24; }
    .section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
    .metric { display: inline-block; margin: 5px 10px; padding: 5px 10px; background: #e9ecef; border-radius: 4px; }
    ul { padding-left: 20px; }
    .recommendation { margin: 10px 0; padding: 10px; background: #e7f1ff; border-left: 4px solid #0066cc; }
  </style>
</head>
<body>
  <h1>🏢 Rapport EXCO - COCKPIT COSMOS</h1>
  <p><em>Généré le ${report.generatedAt.toLocaleDateString('fr-FR', { dateStyle: 'full' })}</em></p>
  <div class="status ${statusClass}">
    ${this.getStatusEmoji(report.overallStatus)} ${report.overallStatus.toUpperCase()} - Score: ${report.overallScore}/100
  </div>
`;

    for (const section of report.sections) {
      html += `
  <div class="section">
    <h2>${section.title}</h2>
    <p>${section.narrative}</p>
`;
      if (section.keyPoints && section.keyPoints.length > 0) {
        html += '<ul>';
        for (const point of section.keyPoints) {
          html += `<li>${point}</li>`;
        }
        html += '</ul>';
      }

      if (section.metrics && Object.keys(section.metrics).length > 0) {
        html += '<div>';
        for (const [key, value] of Object.entries(section.metrics)) {
          html += `<span class="metric"><strong>${key}:</strong> ${value}</span>`;
        }
        html += '</div>';
      }
      html += '</div>';
    }

    if (report.topRecommendations.length > 0) {
      html += '<h2>📌 Recommandations Prioritaires</h2>';
      for (let i = 0; i < report.topRecommendations.length; i++) {
        html += `<div class="recommendation"><strong>${i + 1}.</strong> ${report.topRecommendations[i]}</div>`;
      }
    }

    html += `
</body>
</html>`;

    return html;
  }

  // ============================================================================
  // MÉTHODES PRIVÉES - CONSTRUCTION DES SECTIONS
  // ============================================================================

  private buildExecutiveSummarySection(
    summary: ExecutiveSummary,
    evm: EVMResult
  ): ExcoSection {
    return {
      id: 'executive-summary',
      title: '📊 Résumé Exécutif',
      status: summary.headline.includes('ATTENTION') ? 'warning' :
        summary.headline.includes('critique') ? 'critical' : 'healthy',
      narrative: summary.headline + '\n\n' + summary.bottomLine,
      keyPoints: summary.keyPoints,
      metrics: {
        'CPI': evm.cpi.toFixed(2),
        'SPI': evm.spi.toFixed(2),
        'Interprétation': evm.interpretation,
      },
    };
  }

  private buildModulesSection(
    narratives: ModuleNarrative[],
    context: ReportContext
  ): ExcoSection {
    const worstStatus = narratives.some(n => n.status === 'critical') ? 'critical' :
      narratives.some(n => n.status === 'attention') ? 'warning' : 'healthy';

    const narrative = narratives.map(n =>
      `**${this.getModuleLabel(n.module)}**: ${n.summary}`
    ).join('\n\n');

    const keyPoints = narratives.flatMap(n => n.recommendations.slice(0, 2));

    return {
      id: 'modules-overview',
      title: '🏗️ Vue d\'ensemble par Module',
      status: worstStatus,
      narrative,
      keyPoints,
      metrics: {
        'Avancement': `${context.state.currentMetrics.avancementGlobal.toFixed(1)}%`,
        'Jours restants': context.state.currentMetrics.joursRestants.toString(),
        'Occupation': `${context.state.currentMetrics.tauxOccupation.toFixed(0)}%`,
      },
    };
  }

  private buildPredictionsSection(predictions: Prediction[]): ExcoSection {
    const criticalCount = predictions.filter(p => p.impact === 'critical').length;

    const narrative = predictions.length > 0
      ? `${predictions.length} prédiction(s) active(s), dont ${criticalCount} critique(s).`
      : 'Aucune prédiction significative.';

    const keyPoints = predictions.slice(0, 5).map(p =>
      `${this.getImpactEmoji(p.impact)} ${p.title} (${p.probability}% de probabilité)`
    );

    return {
      id: 'predictions',
      title: '🔮 Prédictions Clés',
      status: criticalCount > 0 ? 'critical' : predictions.length > 3 ? 'warning' : 'healthy',
      narrative,
      keyPoints,
      metrics: {
        'Total': predictions.length.toString(),
        'Critiques': criticalCount.toString(),
        'Horizon moyen': this.calculateAverageHorizon(predictions),
      },
    };
  }

  private buildAnomaliesSection(anomalies: Anomaly[]): ExcoSection {
    const criticalCount = anomalies.filter(a => a.severity === 'critical').length;

    const narrative = anomalies.length > 0
      ? `${anomalies.length} anomalie(s) détectée(s) nécessitant attention.`
      : 'Aucune anomalie significative.';

    const keyPoints = anomalies.slice(0, 5).map(a =>
      `${this.getSeverityEmoji(a.severity)} ${a.metric}: ${a.description}`
    );

    return {
      id: 'anomalies',
      title: '⚠️ Anomalies Détectées',
      status: criticalCount > 0 ? 'critical' : anomalies.length > 0 ? 'warning' : 'healthy',
      narrative,
      keyPoints,
      metrics: {
        'Total': anomalies.length.toString(),
        'Critiques': criticalCount.toString(),
        'En escalade': anomalies.filter(a => a.isEscalating).length.toString(),
      },
    };
  }

  private buildCascadesSection(cascades: CascadeEffect[]): ExcoSection {
    const avgImpact = cascades.length > 0
      ? cascades.reduce((sum, c) => sum + c.propagatedImpact, 0) / cascades.length
      : 0;

    const narrative = cascades.length > 0
      ? `${cascades.length} effet(s) cascade identifié(s) entre modules.`
      : 'Pas d\'effet cascade significatif.';

    const keyPoints = cascades.slice(0, 3).map(c =>
      `${c.sourceModule} → ${c.targetModule}: Impact ${c.propagatedImpact.toFixed(0)}%`
    );

    return {
      id: 'cascades',
      title: '🌊 Effets Cascade',
      status: avgImpact > 40 ? 'critical' : avgImpact > 20 ? 'warning' : 'healthy',
      narrative,
      keyPoints,
      metrics: {
        'Nombre': cascades.length.toString(),
        'Impact moyen': `${avgImpact.toFixed(0)}%`,
      },
    };
  }

  private buildActionsSection(actions: PrioritizedAction[]): ExcoSection {
    const p0Count = actions.filter(a => a.priority === 'P0').length;
    const p1Count = actions.filter(a => a.priority === 'P1').length;

    const narrative = p0Count > 0
      ? `${p0Count} action(s) priorité absolue et ${p1Count} haute priorité identifiées.`
      : p1Count > 0
        ? `${p1Count} action(s) haute priorité à traiter cette semaine.`
        : 'Actions de suivi standard recommandées.';

    const keyPoints = actions
      .filter(a => a.priority === 'P0' || a.priority === 'P1')
      .slice(0, 5)
      .map(a => `[${a.priority}] ${a.action}`);

    return {
      id: 'actions',
      title: '✅ Plan d\'Action',
      status: p0Count > 0 ? 'critical' : p1Count > 2 ? 'warning' : 'healthy',
      narrative,
      keyPoints,
      metrics: {
        'P0': p0Count.toString(),
        'P1': p1Count.toString(),
        'Total': actions.length.toString(),
      },
    };
  }

  private buildPatternsSection(patterns: PatternMatch[]): ExcoSection {
    const narrative = patterns.length > 0
      ? `${patterns.length} pattern(s) historique(s) reconnu(s).`
      : 'Aucun pattern significatif détecté.';

    const keyPoints = patterns.slice(0, 3).map(p =>
      `${p.pattern.name} (${p.matchScore}% correspondance)`
    );

    return {
      id: 'patterns',
      title: '🔍 Patterns Historiques',
      status: patterns.some(p => p.likelyOutcome?.impactType === 'negative') ? 'warning' : 'healthy',
      narrative,
      keyPoints,
    };
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  private generateCharts(context: ReportContext): ChartData[] {
    const charts: ChartData[] = [];

    // Gauge de santé globale
    charts.push({
      type: 'gauge',
      title: 'Score Global',
      data: {
        value: this.calculateOverallScore(context),
        max: 100,
        thresholds: [
          { value: 50, color: '#dc3545' },
          { value: 70, color: '#ffc107' },
          { value: 100, color: '#28a745' },
        ],
      },
    });

    // Radar des modules
    charts.push({
      type: 'radar',
      title: 'Performance par Module',
      data: {
        labels: ['Budget', 'Planning', 'Commercial', 'Risques'],
        values: [
          context.evm.cpi * 100,
          Math.max(0, 100 - context.state.currentMetrics.actionsEnRetard * 2),
          context.state.currentMetrics.tauxOccupation,
          100 - context.predictions.filter(p => p.impact === 'critical').length * 20,
        ],
      },
    });

    // Distribution des priorités
    charts.push({
      type: 'pie',
      title: 'Distribution des Actions',
      data: {
        labels: ['P0', 'P1', 'P2', 'P3'],
        values: [
          context.actions.filter(a => a.priority === 'P0').length,
          context.actions.filter(a => a.priority === 'P1').length,
          context.actions.filter(a => a.priority === 'P2').length,
          context.actions.filter(a => a.priority === 'P3').length,
        ],
      },
    });

    return charts;
  }

  private calculateOverallScore(context: ReportContext): number {
    let score = 100;

    // Budget impact (max -30)
    if (context.evm.cpi < 0.9) score -= 20;
    else if (context.evm.cpi < 0.95) score -= 10;

    // Schedule impact (max -25)
    const lateRatio = context.state.currentMetrics.actionsEnRetard /
      Math.max(1, context.state.currentMetrics.actionsTotal);
    score -= Math.min(25, lateRatio * 100);

    // Commercial impact (max -25)
    if (context.state.currentMetrics.tauxOccupation < 50) score -= 20;
    else if (context.state.currentMetrics.tauxOccupation < 70) score -= 10;
    if (!context.state.anchorTenant?.signed) score -= 10;

    // Risk impact (max -20)
    const criticalPreds = context.predictions.filter(p => p.impact === 'critical').length;
    score -= Math.min(20, criticalPreds * 5);

    return Math.max(0, Math.round(score));
  }

  private generateKeyInsights(
    context: ReportContext,
    moduleNarratives: ModuleNarrative[]
  ): string[] {
    const insights: string[] = [];

    // Modules critiques
    const criticalModules = moduleNarratives.filter(m => m.status === 'critical');
    if (criticalModules.length > 0) {
      insights.push(`${criticalModules.length} module(s) en situation critique: ${criticalModules.map(m => this.getModuleLabel(m.module)).join(', ')}`);
    }

    // Prédictions à haute probabilité
    const highProbPreds = context.predictions.filter(p => p.probability >= 80);
    if (highProbPreds.length > 0) {
      insights.push(`${highProbPreds.length} prédiction(s) à forte probabilité (>80%) nécessitent attention immédiate`);
    }

    // Cascades significatives
    if (context.cascades.length > 2) {
      insights.push(`Interdépendances fortes détectées: ${context.cascades.length} effets cascade actifs`);
    }

    // Patterns
    if (context.patterns && context.patterns.length > 0) {
      const negativePatterns = context.patterns.filter(p => p.likelyOutcome?.impactType === 'negative');
      if (negativePatterns.length > 0) {
        insights.push(`Pattern(s) historique(s) à impact négatif détecté(s) - action préventive recommandée`);
      }
    }

    return insights;
  }

  private getReportStartDate(state: ProjectState): Date {
    // Par défaut, début du mois
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getModuleLabel(module: string): string {
    switch (module) {
      case 'budget': return 'Budget';
      case 'planning': return 'Planning';
      case 'commercialisation': return 'Commercial';
      case 'risques': return 'Risques';
      default: return module;
    }
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'healthy': return '🟢';
      case 'warning': return '🟡';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  }

  private getImpactEmoji(impact: string): string {
    switch (impact) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  private getSeverityEmoji(severity: string): string {
    return this.getImpactEmoji(severity);
  }

  private calculateAverageHorizon(predictions: Prediction[]): string {
    if (predictions.length === 0) return 'N/A';

    // Extraire les jours des horizons
    const days = predictions.map(p => {
      const match = p.timeHorizon.match(/(\d+)/);
      return match ? parseInt(match[1]) : 30;
    });

    const avg = days.reduce((a, b) => a + b, 0) / days.length;
    return `${Math.round(avg)}j`;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default ExcoReportGenerator;
