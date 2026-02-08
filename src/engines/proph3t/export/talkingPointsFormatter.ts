// ============================================================================
// PROPH3T ENGINE V2 — TALKING POINTS FORMATTER
// Formate les points de discussion pour différents formats de sortie
// ============================================================================

import type { GeneratedTalkingPoint } from '../meetings/talkingPointsGenerator';

// ============================================================================
// TYPES
// ============================================================================

export type OutputFormat = 'markdown' | 'html' | 'text' | 'slides' | 'email' | 'teams';

export interface FormatterConfig {
  includeMetrics: boolean;
  includeRecommendations: boolean;
  maxPointsPerSection: number;
  language: 'fr' | 'en';
  brandingEnabled: boolean;
  brandingLogo?: string;
  brandingColors?: { primary: string; secondary: string };
}

export interface FormattedOutput {
  format: OutputFormat;
  content: string;
  metadata: {
    generatedAt: Date;
    pointCount: number;
    sections: string[];
  };
}

export interface SlideContent {
  title: string;
  bullets: string[];
  notes?: string;
  hasChart?: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: FormatterConfig = {
  includeMetrics: true,
  includeRecommendations: true,
  maxPointsPerSection: 5,
  language: 'fr',
  brandingEnabled: false,
};

// ============================================================================
// TALKING POINTS FORMATTER
// ============================================================================

export class TalkingPointsFormatter {
  private config: FormatterConfig;

  constructor(config: Partial<FormatterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ---------------------------------------------------------------------------
  // FORMATAGE
  // ---------------------------------------------------------------------------

  /**
   * Formate les talking points dans le format demandé
   */
  format(
    points: GeneratedTalkingPoint[],
    format: OutputFormat,
    title: string = 'Points de Discussion'
  ): FormattedOutput {
    let content: string;

    switch (format) {
      case 'markdown':
        content = this.toMarkdown(points, title);
        break;
      case 'html':
        content = this.toHtml(points, title);
        break;
      case 'text':
        content = this.toPlainText(points, title);
        break;
      case 'slides':
        content = this.toSlides(points, title);
        break;
      case 'email':
        content = this.toEmail(points, title);
        break;
      case 'teams':
        content = this.toTeamsMessage(points, title);
        break;
      default:
        content = this.toPlainText(points, title);
    }

    const sections = [...new Set(points.map(p => p.tags[0] || 'general'))];

    return {
      format,
      content,
      metadata: {
        generatedAt: new Date(),
        pointCount: points.length,
        sections,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // FORMATS SPÉCIFIQUES
  // ---------------------------------------------------------------------------

  private toMarkdown(points: GeneratedTalkingPoint[], title: string): string {
    const lines: string[] = [];

    lines.push(`# ${title}`);
    lines.push('');
    lines.push(`*Généré le ${new Date().toLocaleString('fr-FR')}*`);
    lines.push('');

    // Grouper par urgence
    const byUrgency = this.groupByUrgency(points);

    for (const [urgency, urgencyPoints] of Object.entries(byUrgency)) {
      if (urgencyPoints.length === 0) continue;

      lines.push(`## ${this.formatUrgencyLabel(urgency as any)}`);
      lines.push('');

      for (const point of urgencyPoints.slice(0, this.config.maxPointsPerSection)) {
        lines.push(`### ${point.headline}`);
        lines.push('');
        lines.push(point.detail);
        lines.push('');

        if (this.config.includeMetrics && point.metrics && point.metrics.length > 0) {
          lines.push('**Métriques:**');
          for (const m of point.metrics) {
            lines.push(`- ${m.label}: **${m.value}**`);
          }
          lines.push('');
        }

        if (this.config.includeRecommendations && point.recommendation) {
          lines.push(`> 💡 ${point.recommendation}`);
          lines.push('');
        }

        lines.push('---');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  private toHtml(points: GeneratedTalkingPoint[], title: string): string {
    const colors = this.config.brandingColors || { primary: '#2563eb', secondary: '#1e40af' };

    let html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: ${colors.primary}; border-bottom: 2px solid ${colors.secondary}; padding-bottom: 10px; }
        h2 { color: ${colors.secondary}; margin-top: 30px; }
        h3 { color: #374151; }
        .point { background: #f9fafb; border-left: 4px solid ${colors.primary}; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }
        .metrics { background: #fff; padding: 10px; border-radius: 4px; margin-top: 10px; }
        .recommendation { background: #fef3c7; padding: 10px; border-radius: 4px; margin-top: 10px; }
        .urgent { border-left-color: #dc2626; }
        .this_week { border-left-color: #f59e0b; }
        .meta { color: #6b7280; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <p class="meta">Généré le ${new Date().toLocaleString('fr-FR')}</p>
`;

    const byUrgency = this.groupByUrgency(points);

    for (const [urgency, urgencyPoints] of Object.entries(byUrgency)) {
      if (urgencyPoints.length === 0) continue;

      html += `<h2>${this.formatUrgencyLabel(urgency as any)}</h2>`;

      for (const point of urgencyPoints.slice(0, this.config.maxPointsPerSection)) {
        html += `<div class="point ${urgency}">`;
        html += `<h3>${this.escapeHtml(point.headline)}</h3>`;
        html += `<p>${this.escapeHtml(point.detail)}</p>`;

        if (this.config.includeMetrics && point.metrics && point.metrics.length > 0) {
          html += '<div class="metrics"><strong>Métriques:</strong><ul>';
          for (const m of point.metrics) {
            html += `<li>${this.escapeHtml(m.label)}: <strong>${this.escapeHtml(m.value)}</strong></li>`;
          }
          html += '</ul></div>';
        }

        if (this.config.includeRecommendations && point.recommendation) {
          html += `<div class="recommendation">💡 ${this.escapeHtml(point.recommendation)}</div>`;
        }

        html += '</div>';
      }
    }

    html += '</body></html>';
    return html;
  }

  private toPlainText(points: GeneratedTalkingPoint[], title: string): string {
    const lines: string[] = [];

    lines.push(title.toUpperCase());
    lines.push('='.repeat(title.length));
    lines.push('');
    lines.push(`Généré le ${new Date().toLocaleString('fr-FR')}`);
    lines.push('');

    const byUrgency = this.groupByUrgency(points);

    for (const [urgency, urgencyPoints] of Object.entries(byUrgency)) {
      if (urgencyPoints.length === 0) continue;

      lines.push(`--- ${this.formatUrgencyLabel(urgency as any).toUpperCase()} ---`);
      lines.push('');

      for (const point of urgencyPoints.slice(0, this.config.maxPointsPerSection)) {
        lines.push(`* ${point.headline}`);
        lines.push(`  ${point.detail}`);

        if (this.config.includeMetrics && point.metrics && point.metrics.length > 0) {
          for (const m of point.metrics) {
            lines.push(`  - ${m.label}: ${m.value}`);
          }
        }

        if (this.config.includeRecommendations && point.recommendation) {
          lines.push(`  >> ${point.recommendation}`);
        }

        lines.push('');
      }
    }

    return lines.join('\n');
  }

  private toSlides(points: GeneratedTalkingPoint[], title: string): string {
    // Format MARP markdown pour slides
    const lines: string[] = [];

    lines.push('---');
    lines.push('marp: true');
    lines.push('theme: default');
    lines.push('paginate: true');
    lines.push('---');
    lines.push('');

    // Slide titre
    lines.push(`# ${title}`);
    lines.push('');
    lines.push(`*${new Date().toLocaleDateString('fr-FR')}*`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // Slide sommaire
    lines.push('# Sommaire');
    lines.push('');
    const urgentCount = points.filter(p => p.urgency === 'immediate').length;
    const weekCount = points.filter(p => p.urgency === 'this_week').length;
    lines.push(`- ${urgentCount} point(s) urgent(s)`);
    lines.push(`- ${weekCount} point(s) de la semaine`);
    lines.push(`- ${points.length - urgentCount - weekCount} autres points`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // Slides par point
    for (const point of points.slice(0, 10)) {
      lines.push(`# ${point.headline}`);
      lines.push('');
      lines.push(point.detail);
      lines.push('');

      if (this.config.includeMetrics && point.metrics && point.metrics.length > 0) {
        lines.push('## Métriques');
        for (const m of point.metrics) {
          lines.push(`- **${m.label}**: ${m.value}`);
        }
        lines.push('');
      }

      if (this.config.includeRecommendations && point.recommendation) {
        lines.push(`> ${point.recommendation}`);
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }

    return lines.join('\n');
  }

  private toEmail(points: GeneratedTalkingPoint[], title: string): string {
    const lines: string[] = [];

    lines.push(`Objet: ${title} - ${new Date().toLocaleDateString('fr-FR')}`);
    lines.push('');
    lines.push('Bonjour,');
    lines.push('');
    lines.push('Veuillez trouver ci-dessous les points clés à discuter:');
    lines.push('');

    // Points urgents en premier
    const urgent = points.filter(p => p.urgency === 'immediate');
    if (urgent.length > 0) {
      lines.push('⚠️ POINTS URGENTS:');
      for (const point of urgent) {
        lines.push(`• ${point.headline}`);
        lines.push(`  ${point.detail}`);
      }
      lines.push('');
    }

    // Autres points
    const others = points.filter(p => p.urgency !== 'immediate').slice(0, 5);
    if (others.length > 0) {
      lines.push('AUTRES POINTS:');
      for (const point of others) {
        lines.push(`• ${point.headline}`);
      }
      lines.push('');
    }

    lines.push('Cordialement,');
    lines.push('[Signature]');

    return lines.join('\n');
  }

  private toTeamsMessage(points: GeneratedTalkingPoint[], title: string): string {
    // Format Adaptive Card JSON pour Microsoft Teams
    const urgent = points.filter(p => p.urgency === 'immediate');
    const others = points.filter(p => p.urgency !== 'immediate').slice(0, 3);

    const card = {
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'TextBlock',
          text: title,
          weight: 'bolder',
          size: 'large',
        },
        {
          type: 'TextBlock',
          text: new Date().toLocaleDateString('fr-FR'),
          isSubtle: true,
        },
      ],
    };

    if (urgent.length > 0) {
      (card.body as any[]).push({
        type: 'TextBlock',
        text: '⚠️ Points urgents',
        weight: 'bolder',
        color: 'attention',
      });

      for (const point of urgent) {
        (card.body as any[]).push({
          type: 'TextBlock',
          text: `• ${point.headline}`,
          wrap: true,
        });
      }
    }

    if (others.length > 0) {
      (card.body as any[]).push({
        type: 'TextBlock',
        text: 'Autres points',
        weight: 'bolder',
      });

      for (const point of others) {
        (card.body as any[]).push({
          type: 'TextBlock',
          text: `• ${point.headline}`,
          wrap: true,
        });
      }
    }

    return JSON.stringify(card, null, 2);
  }

  // ---------------------------------------------------------------------------
  // UTILITAIRES
  // ---------------------------------------------------------------------------

  private groupByUrgency(points: GeneratedTalkingPoint[]): Record<string, GeneratedTalkingPoint[]> {
    const grouped: Record<string, GeneratedTalkingPoint[]> = {
      immediate: [],
      this_week: [],
      this_month: [],
      informational: [],
    };

    for (const point of points) {
      if (grouped[point.urgency]) {
        grouped[point.urgency].push(point);
      } else {
        grouped.informational.push(point);
      }
    }

    return grouped;
  }

  private formatUrgencyLabel(urgency: 'immediate' | 'this_week' | 'this_month' | 'informational'): string {
    const labels = {
      immediate: '🔴 Action immédiate',
      this_week: '🟠 Cette semaine',
      this_month: '🟡 Ce mois',
      informational: '🔵 Information',
    };
    return labels[urgency] || urgency;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ---------------------------------------------------------------------------
  // CONFIGURATION
  // ---------------------------------------------------------------------------

  setConfig(config: Partial<FormatterConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): FormatterConfig {
    return { ...this.config };
  }
}

export default TalkingPointsFormatter;
