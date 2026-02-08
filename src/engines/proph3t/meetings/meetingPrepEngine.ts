// ============================================================================
// PROPH3T ENGINE V2 — MEETING PREP ENGINE
// Prépare automatiquement le contenu des réunions projet
// ============================================================================

import type { Action, Jalon, Risque } from '../../../types';
import type { Commitment } from '../commitments/commitmentTracker';
import type { Alert } from '../reporters/alertManager';

// ============================================================================
// TYPES
// ============================================================================

export type MeetingType = 'exco' | 'comite_pilotage' | 'point_hebdo' | 'revue_technique' | 'crise' | 'custom';

export interface MeetingConfig {
  type: MeetingType;
  name: string;
  duration: number; // minutes
  participants: MeetingParticipant[];
  agenda: AgendaItem[];
  frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'adhoc';
}

export interface MeetingParticipant {
  name: string;
  role: string;
  email?: string;
  isRequired: boolean;
}

export interface AgendaItem {
  order: number;
  title: string;
  duration: number; // minutes
  presenter?: string;
  type: 'info' | 'discussion' | 'decision' | 'action_review';
}

export interface MeetingPrep {
  meetingType: MeetingType;
  preparedAt: Date;
  summary: MeetingSummary;
  talkingPoints: TalkingPoint[];
  decisions: DecisionPoint[];
  risksToDiscuss: RiskHighlight[];
  actionsReview: ActionReviewItem[];
  commitmentsStatus: CommitmentReviewItem[];
  alertsOverview: AlertOverview;
  suggestedAgenda: AgendaItem[];
  attachments: string[];
}

export interface MeetingSummary {
  headline: string;
  projectHealth: 'green' | 'yellow' | 'red';
  keyMetrics: Array<{ label: string; value: string; trend: 'up' | 'down' | 'stable' }>;
  periodHighlights: string[];
  concerns: string[];
}

export interface TalkingPoint {
  id: string;
  topic: string;
  context: string;
  suggestedPosition: string;
  priority: 'must_mention' | 'should_mention' | 'nice_to_have';
  relatedEntities: string[];
}

export interface DecisionPoint {
  id: string;
  question: string;
  context: string;
  options: Array<{ label: string; pros: string[]; cons: string[] }>;
  recommendation?: string;
  deadline?: Date;
  impact: 'high' | 'medium' | 'low';
}

export interface RiskHighlight {
  risk: Risque;
  reason: string;
  suggestedAction: string;
}

export interface ActionReviewItem {
  action: Action;
  status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
  commentary: string;
}

export interface CommitmentReviewItem {
  commitment: Commitment;
  status: 'on_track' | 'at_risk' | 'overdue';
  daysRemaining: number;
}

export interface AlertOverview {
  critical: number;
  high: number;
  medium: number;
  topAlerts: Alert[];
}

// ============================================================================
// DEFAULT MEETING CONFIGS
// ============================================================================

const DEFAULT_MEETINGS: Record<MeetingType, Partial<MeetingConfig>> = {
  exco: {
    name: 'Comité Exécutif',
    duration: 60,
    agenda: [
      { order: 1, title: 'Synthèse projet', duration: 10, type: 'info' },
      { order: 2, title: 'Points de blocage', duration: 15, type: 'discussion' },
      { order: 3, title: 'Décisions à prendre', duration: 20, type: 'decision' },
      { order: 4, title: 'Prochaines étapes', duration: 15, type: 'action_review' },
    ],
    frequency: 'monthly',
  },
  comite_pilotage: {
    name: 'Comité de Pilotage',
    duration: 90,
    agenda: [
      { order: 1, title: 'Avancement global', duration: 20, type: 'info' },
      { order: 2, title: 'Budget et planning', duration: 20, type: 'info' },
      { order: 3, title: 'Risques et alertes', duration: 15, type: 'discussion' },
      { order: 4, title: 'Points d\'arbitrage', duration: 25, type: 'decision' },
      { order: 5, title: 'Plan d\'action', duration: 10, type: 'action_review' },
    ],
    frequency: 'biweekly',
  },
  point_hebdo: {
    name: 'Point Hebdomadaire',
    duration: 30,
    agenda: [
      { order: 1, title: 'Tour de table', duration: 10, type: 'info' },
      { order: 2, title: 'Blocages', duration: 10, type: 'discussion' },
      { order: 3, title: 'Actions semaine', duration: 10, type: 'action_review' },
    ],
    frequency: 'weekly',
  },
  revue_technique: {
    name: 'Revue Technique',
    duration: 60,
    agenda: [
      { order: 1, title: 'État technique', duration: 20, type: 'info' },
      { order: 2, title: 'Problèmes techniques', duration: 25, type: 'discussion' },
      { order: 3, title: 'Solutions proposées', duration: 15, type: 'decision' },
    ],
    frequency: 'weekly',
  },
  crise: {
    name: 'Cellule de Crise',
    duration: 45,
    agenda: [
      { order: 1, title: 'Situation', duration: 10, type: 'info' },
      { order: 2, title: 'Analyse causes', duration: 15, type: 'discussion' },
      { order: 3, title: 'Plan d\'action immédiat', duration: 20, type: 'decision' },
    ],
    frequency: 'adhoc',
  },
  custom: {
    name: 'Réunion personnalisée',
    duration: 60,
    agenda: [],
    frequency: 'adhoc',
  },
};

// ============================================================================
// MEETING PREP ENGINE
// ============================================================================

export class MeetingPrepEngine {
  // ---------------------------------------------------------------------------
  // PRÉPARATION DE RÉUNION
  // ---------------------------------------------------------------------------

  /**
   * Prépare le contenu complet pour une réunion
   */
  prepareMeeting(
    meetingType: MeetingType,
    data: {
      actions: Action[];
      jalons: Jalon[];
      risques: Risque[];
      commitments: Commitment[];
      alerts: Alert[];
      projectMetrics?: {
        cpi?: number;
        spi?: number;
        tauxOccupation?: number;
        budgetConsumed?: number;
      };
    }
  ): MeetingPrep {
    const config = DEFAULT_MEETINGS[meetingType];

    return {
      meetingType,
      preparedAt: new Date(),
      summary: this.generateSummary(data, meetingType),
      talkingPoints: this.generateTalkingPoints(data, meetingType),
      decisions: this.identifyDecisions(data),
      risksToDiscuss: this.highlightRisks(data.risques),
      actionsReview: this.reviewActions(data.actions),
      commitmentsStatus: this.reviewCommitments(data.commitments),
      alertsOverview: this.summarizeAlerts(data.alerts),
      suggestedAgenda: config.agenda || [],
      attachments: this.suggestAttachments(meetingType),
    };
  }

  private generateSummary(data: any, meetingType: MeetingType): MeetingSummary {
    const { actions, jalons, risques, projectMetrics } = data;

    // Calcul de la santé projet
    const completedActions = actions.filter((a: Action) => a.statut === 'termine').length;
    const totalActions = actions.length;
    const overdueActions = actions.filter((a: Action) =>
      a.statut !== 'termine' && a.date_prevue && new Date(a.date_prevue) < new Date()
    ).length;

    let projectHealth: 'green' | 'yellow' | 'red' = 'green';
    if (overdueActions > totalActions * 0.2 || (projectMetrics?.cpi && projectMetrics.cpi < 0.9)) {
      projectHealth = 'red';
    } else if (overdueActions > totalActions * 0.1 || (projectMetrics?.cpi && projectMetrics.cpi < 0.95)) {
      projectHealth = 'yellow';
    }

    // Métriques clés
    const keyMetrics = [
      {
        label: 'Avancement actions',
        value: `${totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0}%`,
        trend: 'stable' as const,
      },
      {
        label: 'Actions en retard',
        value: `${overdueActions}`,
        trend: overdueActions > 0 ? 'down' as const : 'stable' as const,
      },
    ];

    if (projectMetrics?.cpi) {
      keyMetrics.push({
        label: 'CPI',
        value: projectMetrics.cpi.toFixed(2),
        trend: projectMetrics.cpi >= 1 ? 'up' as const : 'down' as const,
      });
    }

    if (projectMetrics?.spi) {
      keyMetrics.push({
        label: 'SPI',
        value: projectMetrics.spi.toFixed(2),
        trend: projectMetrics.spi >= 1 ? 'up' as const : 'down' as const,
      });
    }

    // Headline adapté au type de réunion
    let headline = '';
    if (projectHealth === 'green') {
      headline = 'Projet sous contrôle - Trajectoire nominale';
    } else if (projectHealth === 'yellow') {
      headline = 'Vigilance requise - Points d\'attention identifiés';
    } else {
      headline = 'Alerte projet - Actions correctives nécessaires';
    }

    // Highlights et concerns
    const highlights: string[] = [];
    const concerns: string[] = [];

    const recentCompletions = actions.filter((a: Action) =>
      a.statut === 'termine' && a.date_reelle &&
      new Date(a.date_reelle) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    if (recentCompletions > 0) {
      highlights.push(`${recentCompletions} action(s) terminée(s) cette semaine`);
    }

    const upcomingJalons = jalons.filter((j: Jalon) =>
      j.statut !== 'termine' && j.date_prevue &&
      new Date(j.date_prevue) < new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    );
    if (upcomingJalons.length > 0) {
      highlights.push(`${upcomingJalons.length} jalon(s) à venir dans les 2 prochaines semaines`);
    }

    if (overdueActions > 0) {
      concerns.push(`${overdueActions} action(s) en retard`);
    }

    const criticalRisks = risques.filter((r: Risque) => r.criticite && r.criticite >= 15);
    if (criticalRisks.length > 0) {
      concerns.push(`${criticalRisks.length} risque(s) critique(s) actif(s)`);
    }

    return {
      headline,
      projectHealth,
      keyMetrics,
      periodHighlights: highlights,
      concerns,
    };
  }

  private generateTalkingPoints(data: any, meetingType: MeetingType): TalkingPoint[] {
    const points: TalkingPoint[] = [];
    const { actions, jalons, risques, alerts } = data;

    // Point sur les alertes critiques
    const criticalAlerts = alerts.filter((a: Alert) => a.severity === 'critical');
    if (criticalAlerts.length > 0) {
      points.push({
        id: 'tp-alerts',
        topic: 'Alertes critiques en cours',
        context: `${criticalAlerts.length} alerte(s) critique(s) nécessitent une attention immédiate`,
        suggestedPosition: 'Présenter les alertes et les actions de mitigation prévues',
        priority: 'must_mention',
        relatedEntities: criticalAlerts.map((a: Alert) => a.id),
      });
    }

    // Point sur les jalons proches
    const imminentJalons = jalons.filter((j: Jalon) =>
      j.statut !== 'termine' && j.date_prevue &&
      new Date(j.date_prevue) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
    if (imminentJalons.length > 0) {
      points.push({
        id: 'tp-jalons',
        topic: 'Jalons imminents',
        context: `${imminentJalons.length} jalon(s) prévu(s) dans la semaine`,
        suggestedPosition: 'Confirmer la tenue des dates ou alerter sur les risques de décalage',
        priority: meetingType === 'exco' ? 'must_mention' : 'should_mention',
        relatedEntities: imminentJalons.map((j: Jalon) => j.id_jalon),
      });
    }

    // Point sur les blocages
    const blockedActions = actions.filter((a: Action) => a.statut === 'bloque');
    if (blockedActions.length > 0) {
      points.push({
        id: 'tp-blocages',
        topic: 'Points de blocage',
        context: `${blockedActions.length} action(s) bloquée(s)`,
        suggestedPosition: 'Demander arbitrage ou ressources pour débloquer',
        priority: 'must_mention',
        relatedEntities: blockedActions.map((a: Action) => a.id_action),
      });
    }

    // Point sur les risques élevés (selon type de réunion)
    if (meetingType === 'exco' || meetingType === 'comite_pilotage') {
      const highRisks = risques.filter((r: Risque) => r.criticite && r.criticite >= 12);
      if (highRisks.length > 0) {
        points.push({
          id: 'tp-risques',
          topic: 'Risques majeurs',
          context: `${highRisks.length} risque(s) de niveau élevé ou critique`,
          suggestedPosition: 'Présenter les plans de mitigation et demander validation',
          priority: 'should_mention',
          relatedEntities: highRisks.map((r: Risque) => r.id_risque),
        });
      }
    }

    return points.sort((a, b) => {
      const priorityOrder = { must_mention: 0, should_mention: 1, nice_to_have: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private identifyDecisions(data: any): DecisionPoint[] {
    const decisions: DecisionPoint[] = [];
    const { actions, risques } = data;

    // Décisions sur actions bloquées
    const blocked = actions.filter((a: Action) => a.statut === 'bloque');
    for (const action of blocked.slice(0, 3)) {
      decisions.push({
        id: `dec-${action.id_action}`,
        question: `Comment débloquer l'action "${action.nom}" ?`,
        context: action.description || 'Action bloquée nécessitant une décision',
        options: [
          { label: 'Allouer ressources supplémentaires', pros: ['Résolution rapide'], cons: ['Coût additionnel'] },
          { label: 'Réduire le scope', pros: ['Maintien délai'], cons: ['Fonctionnalité réduite'] },
          { label: 'Reporter', pros: ['Pas de surcoût immédiat'], cons: ['Impact planning'] },
        ],
        impact: 'high',
      });
    }

    // Décisions sur risques critiques
    const criticalRisks = risques.filter((r: Risque) => r.criticite && r.criticite >= 15 && r.statut === 'actif');
    for (const risk of criticalRisks.slice(0, 2)) {
      decisions.push({
        id: `dec-risk-${risk.id_risque}`,
        question: `Stratégie face au risque "${risk.description?.substring(0, 50)}..." ?`,
        context: risk.description || '',
        options: [
          { label: 'Mitiger (investir)', pros: ['Réduit probabilité'], cons: ['Coût'] },
          { label: 'Transférer', pros: ['Externalise le risque'], cons: ['Perte de contrôle'] },
          { label: 'Accepter', pros: ['Pas de coût immédiat'], cons: ['Exposition maintenue'] },
        ],
        impact: 'high',
      });
    }

    return decisions;
  }

  private highlightRisks(risques: Risque[]): RiskHighlight[] {
    return risques
      .filter(r => r.statut === 'actif' && r.criticite && r.criticite >= 9)
      .sort((a, b) => (b.criticite || 0) - (a.criticite || 0))
      .slice(0, 5)
      .map(risk => ({
        risk,
        reason: risk.criticite && risk.criticite >= 15
          ? 'Criticité maximale - attention immédiate requise'
          : 'Risque élevé nécessitant un suivi rapproché',
        suggestedAction: risk.plan_mitigation || 'Définir un plan de mitigation',
      }));
  }

  private reviewActions(actions: Action[]): ActionReviewItem[] {
    const now = new Date();
    return actions
      .filter(a => a.statut !== 'termine' && a.date_prevue)
      .slice(0, 10)
      .map(action => {
        const dueDate = new Date(action.date_prevue!);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        let status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
        let commentary: string;

        if (action.statut === 'termine') {
          status = 'completed';
          commentary = 'Terminée';
        } else if (action.statut === 'bloque') {
          status = 'delayed';
          commentary = 'Bloquée - intervention requise';
        } else if (daysUntilDue < 0) {
          status = 'delayed';
          commentary = `En retard de ${Math.abs(daysUntilDue)} jour(s)`;
        } else if (daysUntilDue <= 3) {
          status = 'at_risk';
          commentary = `Échéance dans ${daysUntilDue} jour(s)`;
        } else {
          status = 'on_track';
          commentary = `Dans les temps (J-${daysUntilDue})`;
        }

        return { action, status, commentary };
      });
  }

  private reviewCommitments(commitments: Commitment[]): CommitmentReviewItem[] {
    const now = new Date();
    return commitments
      .filter(c => c.status !== 'completed' && c.status !== 'cancelled')
      .slice(0, 10)
      .map(commitment => {
        const dueDate = new Date(commitment.dueDate);
        const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        let status: 'on_track' | 'at_risk' | 'overdue';
        if (daysRemaining < 0) {
          status = 'overdue';
        } else if (daysRemaining <= 3) {
          status = 'at_risk';
        } else {
          status = 'on_track';
        }

        return { commitment, status, daysRemaining };
      });
  }

  private summarizeAlerts(alerts: Alert[]): AlertOverview {
    const active = alerts.filter(a => a.status === 'active');
    return {
      critical: active.filter(a => a.severity === 'critical').length,
      high: active.filter(a => a.severity === 'high').length,
      medium: active.filter(a => a.severity === 'medium').length,
      topAlerts: active
        .sort((a, b) => {
          const order = { critical: 0, high: 1, medium: 2, low: 3 };
          return order[a.severity] - order[b.severity];
        })
        .slice(0, 5),
    };
  }

  private suggestAttachments(meetingType: MeetingType): string[] {
    const attachments: Record<MeetingType, string[]> = {
      exco: ['Dashboard synthèse', 'Planning macro', 'Budget summary'],
      comite_pilotage: ['Rapport d\'avancement', 'Registre des risques', 'Planning détaillé', 'État budget'],
      point_hebdo: ['Liste des actions', 'Points de blocage'],
      revue_technique: ['Documentation technique', 'Schémas d\'architecture'],
      crise: ['Analyse d\'impact', 'Plan d\'action immédiat'],
      custom: [],
    };
    return attachments[meetingType];
  }

  // ---------------------------------------------------------------------------
  // EXPORT
  // ---------------------------------------------------------------------------

  /**
   * Exporte la préparation en format texte
   */
  exportToText(prep: MeetingPrep): string {
    const lines: string[] = [];

    lines.push(`# Préparation réunion - ${prep.meetingType.toUpperCase()}`);
    lines.push(`Généré le ${prep.preparedAt.toLocaleDateString('fr-FR')} à ${prep.preparedAt.toLocaleTimeString('fr-FR')}`);
    lines.push('');

    // Summary
    lines.push('## Synthèse');
    lines.push(`**${prep.summary.headline}** (Santé: ${prep.summary.projectHealth})`);
    lines.push('');
    lines.push('### Métriques clés');
    for (const m of prep.summary.keyMetrics) {
      lines.push(`- ${m.label}: ${m.value} ${m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→'}`);
    }
    lines.push('');

    // Talking points
    if (prep.talkingPoints.length > 0) {
      lines.push('## Points à aborder');
      for (const tp of prep.talkingPoints) {
        lines.push(`### [${tp.priority}] ${tp.topic}`);
        lines.push(tp.context);
        lines.push(`> ${tp.suggestedPosition}`);
        lines.push('');
      }
    }

    // Decisions
    if (prep.decisions.length > 0) {
      lines.push('## Décisions à prendre');
      for (const d of prep.decisions) {
        lines.push(`### ${d.question}`);
        lines.push(d.context);
        lines.push('');
      }
    }

    return lines.join('\n');
  }
}

export default MeetingPrepEngine;
