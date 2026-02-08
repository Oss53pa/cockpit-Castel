// ============================================================================
// PROPH3T ENGINE V2 — NARRATIVE GENERATOR
// Génère des récits narratifs à partir des événements projet
// ============================================================================

import type { JournalEntry, JournalSummary } from './projectJournal';

// ============================================================================
// TYPES
// ============================================================================

export type NarrativeStyle = 'executive' | 'detailed' | 'storytelling' | 'bullet_points';
export type NarrativeTone = 'formal' | 'neutral' | 'optimistic' | 'cautious';

export interface NarrativeConfig {
  style: NarrativeStyle;
  tone: NarrativeTone;
  maxLength: number; // caractères
  includeMetrics: boolean;
  includeRecommendations: boolean;
  highlightThreshold: 'all' | 'high' | 'critical';
}

export interface Narrative {
  id: string;
  title: string;
  subtitle?: string;
  introduction: string;
  sections: NarrativeSection[];
  conclusion: string;
  keyTakeaways: string[];
  generatedAt: Date;
  config: NarrativeConfig;
}

export interface NarrativeSection {
  title: string;
  content: string;
  highlights?: string[];
  metrics?: Array<{ label: string; value: string }>;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: NarrativeConfig = {
  style: 'executive',
  tone: 'neutral',
  maxLength: 5000,
  includeMetrics: true,
  includeRecommendations: true,
  highlightThreshold: 'high',
};

// ============================================================================
// NARRATIVE GENERATOR
// ============================================================================

export class NarrativeGenerator {
  private config: NarrativeConfig;

  constructor(config: Partial<NarrativeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ---------------------------------------------------------------------------
  // GÉNÉRATION DE RÉCIT
  // ---------------------------------------------------------------------------

  /**
   * Génère un récit narratif à partir des entrées de journal
   */
  generateNarrative(entries: JournalEntry[], summary: JournalSummary): Narrative {
    const title = this.generateTitle(summary);
    const introduction = this.generateIntroduction(summary);
    const sections = this.generateSections(entries, summary);
    const conclusion = this.generateConclusion(entries, summary);
    const keyTakeaways = this.extractKeyTakeaways(entries, summary);

    return {
      id: `narrative-${Date.now()}`,
      title,
      subtitle: this.generateSubtitle(summary),
      introduction,
      sections,
      conclusion,
      keyTakeaways,
      generatedAt: new Date(),
      config: this.config,
    };
  }

  private generateTitle(summary: JournalSummary): string {
    const start = summary.period.start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const end = summary.period.end.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    if (start === end) {
      return `Rapport de Projet - ${start}`;
    }
    return `Rapport de Projet - ${start} à ${end}`;
  }

  private generateSubtitle(summary: JournalSummary): string {
    const criticalCount = summary.byImportance.critical || 0;
    const highCount = summary.byImportance.high || 0;

    if (criticalCount > 0) {
      return `${criticalCount} événement(s) critique(s) nécessitant attention`;
    }
    if (highCount > 3) {
      return `Période dense avec ${highCount} événements majeurs`;
    }
    return `${summary.totalEntries} événements documentés`;
  }

  private generateIntroduction(summary: JournalSummary): string {
    const parts: string[] = [];

    // Phrase d'accroche selon le ton
    switch (this.config.tone) {
      case 'formal':
        parts.push(`Ce rapport couvre la période du ${summary.period.start.toLocaleDateString('fr-FR')} au ${summary.period.end.toLocaleDateString('fr-FR')}.`);
        break;
      case 'optimistic':
        parts.push(`Voici les avancées significatives réalisées entre le ${summary.period.start.toLocaleDateString('fr-FR')} et le ${summary.period.end.toLocaleDateString('fr-FR')}.`);
        break;
      case 'cautious':
        parts.push(`Ce rapport analyse les événements et risques survenus du ${summary.period.start.toLocaleDateString('fr-FR')} au ${summary.period.end.toLocaleDateString('fr-FR')}.`);
        break;
      default:
        parts.push(`Période analysée : ${summary.period.start.toLocaleDateString('fr-FR')} - ${summary.period.end.toLocaleDateString('fr-FR')}.`);
    }

    // Statistiques clés
    parts.push(`Au total, ${summary.totalEntries} événements ont été enregistrés.`);

    const milestoneCount = (summary.byType.milestone_completed || 0);
    const blockedCount = (summary.byType.action_blocked || 0);

    if (milestoneCount > 0) {
      parts.push(`${milestoneCount} jalon(s) ont été atteints.`);
    }
    if (blockedCount > 0) {
      parts.push(`${blockedCount} blocage(s) ont été identifiés.`);
    }

    return parts.join(' ');
  }

  private generateSections(entries: JournalEntry[], summary: JournalSummary): NarrativeSection[] {
    const sections: NarrativeSection[] = [];

    // Section: Jalons et Avancement
    const milestoneEntries = entries.filter(e =>
      e.type === 'milestone_completed' || e.type === 'milestone_delayed'
    );
    if (milestoneEntries.length > 0) {
      sections.push(this.createMilestoneSection(milestoneEntries));
    }

    // Section: Problèmes et Blocages
    const issueEntries = entries.filter(e =>
      e.type === 'action_blocked' || e.type === 'issue_raised' || e.type === 'issue_resolved'
    );
    if (issueEntries.length > 0) {
      sections.push(this.createIssueSection(issueEntries));
    }

    // Section: Risques
    const riskEntries = entries.filter(e =>
      e.type === 'risk_identified' || e.type === 'risk_mitigated'
    );
    if (riskEntries.length > 0) {
      sections.push(this.createRiskSection(riskEntries));
    }

    // Section: Décisions
    const decisionEntries = entries.filter(e => e.type === 'decision_made');
    if (decisionEntries.length > 0) {
      sections.push(this.createDecisionSection(decisionEntries));
    }

    // Section: Alertes Budget/Planning
    const alertEntries = entries.filter(e =>
      e.type === 'budget_alert' || e.type === 'schedule_alert'
    );
    if (alertEntries.length > 0) {
      sections.push(this.createAlertSection(alertEntries));
    }

    return sections;
  }

  private createMilestoneSection(entries: JournalEntry[]): NarrativeSection {
    const completed = entries.filter(e => e.type === 'milestone_completed');
    const delayed = entries.filter(e => e.type === 'milestone_delayed');

    let content = '';

    if (this.config.style === 'bullet_points') {
      content = entries.map(e => `• ${e.title}`).join('\n');
    } else {
      if (completed.length > 0) {
        content += `${completed.length} jalon(s) ont été atteints avec succès : `;
        content += completed.map(e => e.title.replace('Jalon atteint: ', '')).join(', ') + '. ';
      }
      if (delayed.length > 0) {
        content += `Attention : ${delayed.length} jalon(s) accusent un retard : `;
        content += delayed.map(e => e.title.replace('Jalon en retard: ', '')).join(', ') + '.';
      }
    }

    return {
      title: 'Jalons et Avancement',
      content,
      highlights: delayed.length > 0 ? delayed.map(e => e.title) : undefined,
      metrics: this.config.includeMetrics ? [
        { label: 'Complétés', value: `${completed.length}` },
        { label: 'En retard', value: `${delayed.length}` },
      ] : undefined,
    };
  }

  private createIssueSection(entries: JournalEntry[]): NarrativeSection {
    const blocked = entries.filter(e => e.type === 'action_blocked');
    const raised = entries.filter(e => e.type === 'issue_raised');
    const resolved = entries.filter(e => e.type === 'issue_resolved');

    let content = '';

    if (this.config.style === 'bullet_points') {
      content = entries.map(e => `• ${e.title}`).join('\n');
    } else {
      const totalIssues = blocked.length + raised.length;
      content = `${totalIssues} problème(s) ont été identifiés durant cette période. `;
      if (resolved.length > 0) {
        content += `${resolved.length} ont été résolus. `;
      }
      if (blocked.length > 0) {
        content += `${blocked.length} action(s) sont actuellement bloquées et nécessitent une intervention.`;
      }
    }

    return {
      title: 'Problèmes et Blocages',
      content,
      highlights: blocked.map(e => e.title),
    };
  }

  private createRiskSection(entries: JournalEntry[]): NarrativeSection {
    const identified = entries.filter(e => e.type === 'risk_identified');
    const mitigated = entries.filter(e => e.type === 'risk_mitigated');

    let content = '';

    if (this.config.style === 'bullet_points') {
      content = entries.map(e => `• ${e.title}`).join('\n');
    } else {
      if (identified.length > 0) {
        content += `${identified.length} nouveau(x) risque(s) ont été identifiés. `;
      }
      if (mitigated.length > 0) {
        content += `${mitigated.length} risque(s) ont été mitigés avec succès.`;
      }
    }

    return {
      title: 'Gestion des Risques',
      content,
      highlights: identified.filter(e => e.importance === 'critical').map(e => e.title),
    };
  }

  private createDecisionSection(entries: JournalEntry[]): NarrativeSection {
    let content = '';

    if (this.config.style === 'bullet_points') {
      content = entries.map(e => `• ${e.title}: ${e.content}`).join('\n');
    } else {
      content = `${entries.length} décision(s) importante(s) ont été prises : `;
      content += entries.map(e => e.title).join('; ') + '.';
    }

    return {
      title: 'Décisions Clés',
      content,
    };
  }

  private createAlertSection(entries: JournalEntry[]): NarrativeSection {
    const budgetAlerts = entries.filter(e => e.type === 'budget_alert');
    const scheduleAlerts = entries.filter(e => e.type === 'schedule_alert');

    let content = '';

    if (budgetAlerts.length > 0) {
      content += `${budgetAlerts.length} alerte(s) budget ont été déclenchées. `;
    }
    if (scheduleAlerts.length > 0) {
      content += `${scheduleAlerts.length} alerte(s) planning ont été émises.`;
    }

    return {
      title: 'Alertes',
      content,
      highlights: entries.map(e => e.title),
    };
  }

  private generateConclusion(entries: JournalEntry[], summary: JournalSummary): string {
    const parts: string[] = [];

    const criticalCount = summary.byImportance.critical || 0;
    const completedMilestones = summary.byType.milestone_completed || 0;

    switch (this.config.tone) {
      case 'optimistic':
        if (completedMilestones > 0) {
          parts.push(`Cette période a vu ${completedMilestones} jalon(s) atteints, témoignant de la bonne dynamique du projet.`);
        }
        if (criticalCount > 0) {
          parts.push(`${criticalCount} point(s) d'attention restent à traiter pour maintenir cette trajectoire positive.`);
        } else {
          parts.push('Le projet évolue favorablement sans blocage majeur.');
        }
        break;

      case 'cautious':
        if (criticalCount > 0) {
          parts.push(`${criticalCount} événement(s) critique(s) nécessitent une attention immédiate.`);
        }
        parts.push('Une vigilance continue est recommandée pour les semaines à venir.');
        break;

      default:
        parts.push(`En résumé, ${summary.totalEntries} événements ont marqué cette période.`);
        if (criticalCount > 0) {
          parts.push(`${criticalCount} élément(s) critique(s) requièrent un suivi prioritaire.`);
        }
    }

    if (this.config.includeRecommendations) {
      parts.push('Les prochaines étapes sont détaillées dans le plan d\'action associé.');
    }

    return parts.join(' ');
  }

  private extractKeyTakeaways(entries: JournalEntry[], summary: JournalSummary): string[] {
    const takeaways: string[] = [];

    // Basé sur les highlights
    const critical = entries.filter(e => e.importance === 'critical');
    for (const entry of critical.slice(0, 3)) {
      takeaways.push(entry.title);
    }

    // Métriques clés
    const milestonesDone = summary.byType.milestone_completed || 0;
    const milestonesDelayed = summary.byType.milestone_delayed || 0;

    if (milestonesDone > 0) {
      takeaways.push(`${milestonesDone} jalon(s) complété(s)`);
    }
    if (milestonesDelayed > 0) {
      takeaways.push(`${milestonesDelayed} jalon(s) en retard`);
    }

    return takeaways.slice(0, 5);
  }

  // ---------------------------------------------------------------------------
  // EXPORT
  // ---------------------------------------------------------------------------

  /**
   * Exporte le récit en format Markdown
   */
  toMarkdown(narrative: Narrative): string {
    const lines: string[] = [];

    lines.push(`# ${narrative.title}`);
    if (narrative.subtitle) {
      lines.push(`*${narrative.subtitle}*`);
    }
    lines.push('');
    lines.push('## Introduction');
    lines.push(narrative.introduction);
    lines.push('');

    for (const section of narrative.sections) {
      lines.push(`## ${section.title}`);
      lines.push(section.content);

      if (section.metrics && section.metrics.length > 0) {
        lines.push('');
        lines.push('| Métrique | Valeur |');
        lines.push('|----------|--------|');
        for (const m of section.metrics) {
          lines.push(`| ${m.label} | ${m.value} |`);
        }
      }

      if (section.highlights && section.highlights.length > 0) {
        lines.push('');
        lines.push('**Points d\'attention :**');
        for (const h of section.highlights) {
          lines.push(`- ${h}`);
        }
      }

      lines.push('');
    }

    lines.push('## Conclusion');
    lines.push(narrative.conclusion);
    lines.push('');

    if (narrative.keyTakeaways.length > 0) {
      lines.push('## Points Clés');
      for (const t of narrative.keyTakeaways) {
        lines.push(`- ${t}`);
      }
    }

    lines.push('');
    lines.push(`---`);
    lines.push(`*Généré le ${narrative.generatedAt.toLocaleString('fr-FR')}*`);

    return lines.join('\n');
  }

  // ---------------------------------------------------------------------------
  // CONFIGURATION
  // ---------------------------------------------------------------------------

  setConfig(config: Partial<NarrativeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): NarrativeConfig {
    return { ...this.config };
  }
}

export default NarrativeGenerator;
