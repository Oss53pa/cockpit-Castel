// ============================================================================
// HOOK: useProph3tDashboard
// Agrège les données réelles de la DB pour le dashboard Proph3t
// ============================================================================

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { Action, Jalon, Alerte, Risque, BudgetItem } from '@/types';
import type { Alert, AlertSummary, AlertLevel, AlertStatus } from '@/engines/proph3t/reporters/alertManager';
import type { ReliabilityScore, ReliabilityComparison } from '@/engines/proph3t/commitments/reliabilityScorer';
import type { VelocityMetrics, TeamVelocity } from '@/engines/proph3t/velocity/velocityAnalyzer';
import type { BurnRateMetrics, BurnProjection } from '@/engines/proph3t/velocity/burnRateCalculator';
import type { FatigueAssessment, TeamFatigue } from '@/engines/proph3t/health/fatigueDetector';
import type { MomentumAnalysis } from '@/engines/proph3t/health/momentumTracker';
import type { JournalEntry, JournalSummary, JournalEntryType, JournalEntryImportance } from '@/engines/proph3t/journal/projectJournal';

// ============================================================================
// TYPES
// ============================================================================

export interface Proph3tDashboardData {
  isLoading: boolean;

  // Alertes
  alerts: Alert[];
  alertSummary: AlertSummary;

  // Fiabilité
  reliabilityScores: Record<string, ReliabilityScore>;
  reliabilityComparison: ReliabilityComparison;

  // Vélocité
  velocityMetrics: VelocityMetrics;
  teamVelocity: TeamVelocity[];
  burnRateMetrics: BurnRateMetrics;
  burnProjections: BurnProjection[];

  // Santé
  fatigueAssessment: FatigueAssessment;
  teamFatigue: TeamFatigue[];
  momentumAnalysis: MomentumAnalysis;

  // Journal
  journalEntries: JournalEntry[];
  journalSummary: JournalSummary;

  // Stats globales
  globalStats: {
    actionsTotal: number;
    actionsTerminees: number;
    actionsEnRetard: number;
    actionsBloquees: number;
    jalonsTotal: number;
    jalonsAtteints: number;
    jalonsEnRetard: number;
    budgetTotal: number;
    budgetConsomme: number;
    risquesActifs: number;
    risquesCritiques: number;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function mapCriticiteToLevel(criticite: string): AlertLevel {
  switch (criticite) {
    case 'critical': return 'critical';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'info';
    default: return 'info';
  }
}

function mapAlerteToProph3tAlert(alerte: Alerte): Alert {
  return {
    id: String(alerte.id),
    level: mapCriticiteToLevel(alerte.criticite),
    title: alerte.titre,
    message: alerte.message,
    source: 'threshold',
    sourceId: String(alerte.entiteId || ''),
    module: alerte.entiteType || 'General',
    timestamp: new Date(alerte.createdAt),
    status: alerte.traitee ? 'resolved' : (alerte.lu ? 'acknowledged' : 'active') as AlertStatus,
    acknowledgedAt: alerte.lu ? new Date(alerte.createdAt) : undefined,
    resolvedAt: alerte.traitee && alerte.traiteeAt ? new Date(alerte.traiteeAt) : undefined,
    escalationHistory: [],
    metadata: {},
    suggestedActions: [],
  };
}

function getOwnerFromAction(action: Action): string {
  return action.responsable || action.pilote || 'Non assigné';
}

function calculateReliabilityForOwner(
  owner: string,
  actions: Action[]
): ReliabilityScore {
  const ownerActions = actions.filter(a => getOwnerFromAction(a) === owner);
  const total = ownerActions.length;

  if (total === 0) {
    return {
      owner,
      overallScore: 50,
      components: { completionRate: 50, onTimeRate: 50, responsiveness: 50, consistency: 50 },
      trend: 'stable',
      confidence: 0.1,
      sampleSize: 0,
      lastUpdated: new Date(),
      history: [],
    };
  }

  const completed = ownerActions.filter(a => a.statut === 'termine').length;
  const completionRate = (completed / total) * 100;

  // On time = terminées avant ou à la date prévue
  const onTime = ownerActions.filter(a => {
    if (a.statut !== 'termine' || !a.date_fin_reelle || !a.date_fin_prevue) return false;
    return new Date(a.date_fin_reelle) <= new Date(a.date_fin_prevue);
  }).length;
  const onTimeRate = completed > 0 ? (onTime / completed) * 100 : 50;

  // Responsiveness = inverse des actions bloquées
  const blocked = ownerActions.filter(a => a.statut === 'bloque').length;
  const responsiveness = Math.max(0, 100 - (blocked / total) * 100);

  // Consistency = écart type de l'avancement (inversé)
  const avancements = ownerActions.map(a => a.avancement || 0);
  const avgAvancement = avancements.reduce((a, b) => a + b, 0) / avancements.length;
  const variance = avancements.reduce((acc, val) => acc + Math.pow(val - avgAvancement, 2), 0) / avancements.length;
  const stdDev = Math.sqrt(variance);
  const consistency = Math.max(0, 100 - stdDev);

  const overallScore = (completionRate * 0.4 + onTimeRate * 0.3 + responsiveness * 0.2 + consistency * 0.1);

  return {
    owner,
    overallScore: Math.round(overallScore),
    components: {
      completionRate: Math.round(completionRate),
      onTimeRate: Math.round(onTimeRate),
      responsiveness: Math.round(responsiveness),
      consistency: Math.round(consistency),
    },
    trend: 'stable',
    confidence: Math.min(0.9, total / 10),
    sampleSize: total,
    lastUpdated: new Date(),
    history: [],
  };
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useProph3tDashboard(): Proph3tDashboardData {
  // Récupérer les données brutes de la DB
  const actionsData = useLiveQuery(() => db.actions.toArray());
  const jalonsData = useLiveQuery(() => db.jalons.toArray());
  const alertesData = useLiveQuery(() => db.alertes.toArray());
  const budgetData = useLiveQuery(() => db.budget.toArray());
  const risquesData = useLiveQuery(() => db.risques.toArray());

  return useMemo(() => {
    const actions = actionsData ?? [];
    const jalons = jalonsData ?? [];
    const alertes = alertesData ?? [];
    const budget = budgetData ?? [];
    const risques = risquesData ?? [];

    const isLoading = actionsData === undefined;

    // ========================================================================
    // STATS GLOBALES
    // ========================================================================
    const today = new Date();
    const actionsEnRetard = actions.filter(a => {
      if (a.statut === 'termine') return false;
      return a.date_fin_prevue && new Date(a.date_fin_prevue) < today;
    });
    const jalonsEnRetard = jalons.filter(j => {
      if (j.statut === 'atteint') return false;
      return j.date_prevue && new Date(j.date_prevue) < today;
    });

    const globalStats = {
      actionsTotal: actions.length,
      actionsTerminees: actions.filter(a => a.statut === 'termine').length,
      actionsEnRetard: actionsEnRetard.length,
      actionsBloquees: actions.filter(a => a.statut === 'bloque').length,
      jalonsTotal: jalons.length,
      jalonsAtteints: jalons.filter(j => j.statut === 'atteint').length,
      jalonsEnRetard: jalonsEnRetard.length,
      budgetTotal: budget.reduce((s, b) => s + (b.montantPrevu || 0), 0),
      budgetConsomme: budget.reduce((s, b) => s + (b.montantRealise || 0), 0),
      risquesActifs: risques.filter(r => r.status !== 'closed' && r.status !== 'ferme').length,
      risquesCritiques: risques.filter(r => (r.score ?? 0) >= 12).length,
    };

    // ========================================================================
    // ALERTES
    // ========================================================================
    const alerts: Alert[] = alertes.map(mapAlerteToProph3tAlert);

    const alertSummary: AlertSummary = {
      total: alerts.length,
      byLevel: {
        emergency: alerts.filter(a => a.level === 'emergency').length,
        critical: alerts.filter(a => a.level === 'critical').length,
        warning: alerts.filter(a => a.level === 'warning').length,
        info: alerts.filter(a => a.level === 'info').length,
      },
      byStatus: {
        active: alerts.filter(a => a.status === 'active').length,
        acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
        resolved: alerts.filter(a => a.status === 'resolved').length,
        escalated: alerts.filter(a => a.status === 'escalated').length,
      },
      byModule: {},
      criticalCount: alerts.filter(a => a.level === 'critical' || a.level === 'emergency').length,
      unresolvedCount: alerts.filter(a => a.status !== 'resolved').length,
      averageResolutionTimeHours: 12,
    };

    // ========================================================================
    // FIABILITE PAR RESPONSABLE
    // ========================================================================
    const owners = [...new Set(actions.map(getOwnerFromAction))].filter(o => o !== 'Non assigné');
    const reliabilityScores: Record<string, ReliabilityScore> = {};

    for (const owner of owners) {
      reliabilityScores[owner] = calculateReliabilityForOwner(owner, actions);
    }

    const ranking = Object.values(reliabilityScores)
      .sort((a, b) => b.overallScore - a.overallScore)
      .map((score, index) => ({
        owner: score.owner,
        score: score.overallScore,
        rank: index + 1,
      }));

    const avgScore = ranking.length > 0
      ? ranking.reduce((s, r) => s + r.score, 0) / ranking.length
      : 0;

    const reliabilityComparison: ReliabilityComparison = {
      owners,
      scores: reliabilityScores,
      ranking,
      averageScore: Math.round(avgScore),
      topPerformer: ranking[0]?.owner,
      needsAttention: ranking.filter(r => r.score < 60).map(r => r.owner),
    };

    // ========================================================================
    // VELOCITE
    // ========================================================================
    const actionsTermineesRecemment = actions.filter(a => {
      if (a.statut !== 'termine' || !a.date_fin_reelle) return false;
      const finDate = new Date(a.date_fin_reelle);
      const daysAgo = (today.getTime() - finDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    });

    const weeklyCompleted = actionsTermineesRecemment.length / 4; // ~4 semaines
    const avgAvancement = actions.length > 0
      ? actions.reduce((s, a) => s + (a.avancement || 0), 0) / actions.length
      : 0;

    const velocityMetrics: VelocityMetrics = {
      currentVelocity: Math.round(weeklyCompleted * 10) / 10,
      averageVelocity: Math.round(weeklyCompleted * 10) / 10,
      maxVelocity: Math.round(weeklyCompleted * 1.5 * 10) / 10,
      minVelocity: Math.round(weeklyCompleted * 0.5 * 10) / 10,
      trend: { direction: 'stable', percentage: 0, confidence: 0.7 },
      weeklyData: [],
      forecastedVelocity: Math.round(weeklyCompleted * 10) / 10,
      capacityUtilization: avgAvancement / 100,
    };

    // Vélocité par axe (équipe)
    const axes = [...new Set(actions.map(a => a.axe))];
    const teamVelocity: TeamVelocity[] = axes.map(axe => {
      const axeActions = actions.filter(a => a.axe === axe);
      const completed = axeActions.filter(a => a.statut === 'termine').length;
      const velocity = axeActions.length > 0 ? (completed / axeActions.length) * 5 : 0;

      const axeLabel = axe.replace('axe', 'Axe ').replace('_', ' - ');

      return {
        teamName: axeLabel,
        currentVelocity: Math.round(velocity * 10) / 10,
        averageVelocity: Math.round(velocity * 10) / 10,
        trend: { direction: 'stable' as const, percentage: 0, confidence: 0.7 },
        members: axeActions.length,
      };
    });

    // ========================================================================
    // BURN RATE
    // ========================================================================
    const budgetTotal = globalStats.budgetTotal;
    const budgetConsomme = globalStats.budgetConsomme;
    const percentUsed = budgetTotal > 0 ? Math.round((budgetConsomme / budgetTotal) * 100) : 0;
    const remaining = budgetTotal - budgetConsomme;

    // Estimation simple : 6 mois restants
    const monthlyRate = budgetConsomme / 4; // Basé sur 4 mois écoulés
    const runwayMonths = monthlyRate > 0 ? remaining / monthlyRate : 12;
    const exhaustionDate = new Date();
    exhaustionDate.setMonth(exhaustionDate.getMonth() + Math.floor(runwayMonths));

    const burnRateMetrics: BurnRateMetrics = {
      currentBurnRate: Math.round(monthlyRate),
      averageBurnRate: Math.round(monthlyRate),
      totalBudget: budgetTotal,
      totalSpent: budgetConsomme,
      remaining,
      percentUsed,
      burnTrend: { direction: 'stable', percentage: 0 },
      monthlyData: [],
      runwayMonths: Math.round(runwayMonths * 10) / 10,
      exhaustionDate,
    };

    const burnProjections: BurnProjection[] = [
      {
        scenario: 'optimistic',
        exhaustionDate: new Date(exhaustionDate.getTime() + 60 * 24 * 60 * 60 * 1000),
        finalSpend: budgetTotal * 0.95,
        monthlyRate: monthlyRate * 0.85,
        remainingBudget: budgetTotal * 0.05,
      },
      {
        scenario: 'realistic',
        exhaustionDate,
        finalSpend: budgetTotal,
        monthlyRate,
        remainingBudget: 0,
      },
      {
        scenario: 'pessimistic',
        exhaustionDate: new Date(exhaustionDate.getTime() - 30 * 24 * 60 * 60 * 1000),
        finalSpend: budgetTotal * 1.1,
        monthlyRate: monthlyRate * 1.15,
        remainingBudget: -budgetTotal * 0.1,
      },
    ];

    // ========================================================================
    // FATIGUE & MOMENTUM
    // ========================================================================
    const blockedRatio = actions.length > 0 ? globalStats.actionsBloquees / actions.length : 0;
    const overdueRatio = actions.length > 0 ? globalStats.actionsEnRetard / actions.length : 0;
    const fatigueScore = Math.round((blockedRatio + overdueRatio) * 50);

    const fatigueAssessment: FatigueAssessment = {
      overallLevel: fatigueScore > 50 ? 'high' : fatigueScore > 25 ? 'moderate' : 'low',
      score: fatigueScore,
      signals: [],
      teamAreas: axes.filter(a => {
        const axeActions = actions.filter(act => act.axe === a);
        const blocked = axeActions.filter(act => act.statut === 'bloque').length;
        return blocked > 0;
      }),
      trend: 'stable',
      recommendations: fatigueScore > 25 ? [
        'Identifier les causes de blocage',
        'Prioriser le déblocage des actions critiques',
      ] : [],
    };

    const teamFatigue: TeamFatigue[] = axes.slice(0, 3).map(axe => {
      const axeActions = actions.filter(a => a.axe === axe);
      const blocked = axeActions.filter(a => a.statut === 'bloque').length;
      const score = axeActions.length > 0 ? Math.round((blocked / axeActions.length) * 100) : 0;

      return {
        team: axe.replace('axe', 'Axe ').replace('_', ' - '),
        fatigueLevel: score > 50 ? 'high' : score > 25 ? 'moderate' : 'low',
        score,
        primaryIndicators: blocked > 0 ? ['overdue_accumulation'] : [],
        recommendation: score > 50 ? 'Action urgente requise' : score > 25 ? 'Surveillance recommandée' : 'Aucune action nécessaire',
      };
    });

    // Momentum basé sur avancement global
    const momentumScore = Math.round(avgAvancement);
    const momentumAnalysis: MomentumAnalysis = {
      currentState: momentumScore > 70 ? 'cruising' : momentumScore > 40 ? 'slowing' : 'stalling',
      score: momentumScore,
      velocity: velocityMetrics.currentVelocity,
      acceleration: 0,
      dataPoints: [],
      insights: [
        {
          type: momentumScore > 50 ? 'positive' : 'neutral',
          message: `Avancement global à ${momentumScore}%`,
          impact: momentumScore > 70 ? 'Bonne progression' : 'Progression à surveiller',
        },
      ],
      forecast: {
        nextWeek: momentumScore > 50 ? 'cruising' : 'slowing',
        confidence: 0.7,
        risks: globalStats.actionsBloquees > 0 ? [`${globalStats.actionsBloquees} action(s) bloquée(s)`] : [],
      },
    };

    // ========================================================================
    // JOURNAL (basé sur alertes récentes)
    // ========================================================================
    const journalEntries: JournalEntry[] = alertes
      .slice(0, 20)
      .map(a => ({
        id: `je-${a.id}`,
        type: (a.type === 'action_bloquee' ? 'action_blocked' :
               a.type === 'jalon_approche' ? 'schedule_alert' :
               a.type === 'risque_critique' ? 'risk_identified' :
               a.type === 'depassement_budget' ? 'budget_alert' :
               'manual_note') as JournalEntryType,
        title: a.titre,
        content: a.message,
        timestamp: new Date(a.createdAt),
        importance: (a.criticite === 'critical' ? 'critical' :
                    a.criticite === 'high' ? 'high' :
                    a.criticite === 'medium' ? 'medium' : 'low') as JournalEntryImportance,
        category: a.entiteType || 'general',
        tags: [a.type],
        isAutoGenerated: true,
      }));

    const journalSummary: JournalSummary = {
      totalEntries: journalEntries.length,
      byType: {
        milestone_completed: 0,
        milestone_delayed: 0,
        action_completed: 0,
        action_blocked: journalEntries.filter(e => e.type === 'action_blocked').length,
        risk_identified: journalEntries.filter(e => e.type === 'risk_identified').length,
        risk_mitigated: 0,
        decision_made: 0,
        issue_raised: 0,
        issue_resolved: 0,
        budget_alert: journalEntries.filter(e => e.type === 'budget_alert').length,
        schedule_alert: journalEntries.filter(e => e.type === 'schedule_alert').length,
        team_update: 0,
        external_event: 0,
        lesson_learned: 0,
        manual_note: journalEntries.filter(e => e.type === 'manual_note').length,
      },
      byImportance: {
        critical: journalEntries.filter(e => e.importance === 'critical').length,
        high: journalEntries.filter(e => e.importance === 'high').length,
        medium: journalEntries.filter(e => e.importance === 'medium').length,
        low: journalEntries.filter(e => e.importance === 'low').length,
      },
      dateRange: {
        start: journalEntries.length > 0 ? journalEntries[journalEntries.length - 1].timestamp : new Date(),
        end: journalEntries.length > 0 ? journalEntries[0].timestamp : new Date(),
      },
      highlights: journalEntries.filter(e => e.importance === 'critical' || e.importance === 'high').slice(0, 3),
      trends: [],
    };

    return {
      isLoading,
      alerts,
      alertSummary,
      reliabilityScores,
      reliabilityComparison,
      velocityMetrics,
      teamVelocity,
      burnRateMetrics,
      burnProjections,
      fatigueAssessment,
      teamFatigue,
      momentumAnalysis,
      journalEntries,
      journalSummary,
      globalStats,
    };
  }, [actionsData, jalonsData, alertesData, budgetData, risquesData]);
}

export default useProph3tDashboard;
