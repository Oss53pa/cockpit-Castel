/**
 * useMonthlyReportData — Hook de données live pour le Rapport Mensuel
 * Remplace toutes les données statiques par des données DB en temps réel.
 */

import { useMemo } from 'react';
import {
  useActions,
  useJalons,
  useRisques,
  useDashboardKPIs,
  useBudgetSynthese,
  useConfidenceScore,
  useCurrentSite,
  useUsers,
  useCOPILTrends,
} from '@/hooks';
import { useBudgetParCategorie } from '@/hooks/useBudget';
import {
  useAvancementGlobal,
  useMeteoProjet,
  useComparaisonAxes,
  useAvancementParAxe,
} from '@/hooks/useDashboard';
import { PROJET_CONFIG } from '@/data/constants';
import { AXES_V5, METEO_CONFIG } from '@/components/rapports/ExcoMensuelV5/constants';
import type { Axe } from '@/types';
import { getUserFullName } from '@/hooks/useUsers';

// ============================================================================
// HELPERS
// ============================================================================

const f2 = (v: number) => Math.round(v * 100) / 100;

function formatDateShort(d: string): string {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short.' });
}

function mapMeteoInfo(meteo: string): { label: string; emoji: string; key: string } {
  if (meteo === 'rouge') return { label: 'Critique', emoji: '🌩️', key: 'stormy' };
  if (meteo === 'orange') return { label: 'Alerte', emoji: '🌧️', key: 'rainy' };
  if (meteo === 'jaune') return { label: 'Vigilance', emoji: '⛅', key: 'cloudy' };
  return { label: 'Favorable', emoji: '☀️', key: 'sunny' };
}

function mapJalonDisplayStatus(statut: string, datePrevue: string, todayStr: string): string {
  if (statut === 'atteint') return 'done';
  if (statut === 'depasse' || (datePrevue < todayStr && statut !== 'atteint')) return 'compromised';
  if (statut === 'en_danger') return 'atrisk';
  return 'ontrack';
}

// ============================================================================
// TYPES EXPORTÉS
// ============================================================================

export interface MonthlyKPI {
  label: string;
  value: string;
  sub: string;
  trend: string;
  dir: string;
  icon: string;
  target: string;
  onTrack: boolean;
}

export interface MonthlySync {
  construction: number;
  mobilisation: number;
  ecart: number;
  ecartDays: number;
  status: string;
}

export interface MonthlyAxe {
  code: string;
  name: string;
  pct: number;
  done: number;
  total: number;
  late: number;
  janPct: number;
  status: string;
  keyFact: string;
  blocker: string;
}

export interface MonthlyRisk {
  score: number;
  title: string;
  pi: string;
  evolution: 'stable' | 'up' | 'down';
  owner: string;
  mitigation: string;
  impact: string;
}

export interface MonthlyMilestone {
  name: string;
  axe: string;
  date: string;
  status: string;
}

export interface MonthlyDecision {
  urgency: 'critical' | 'high';
  title: string;
  context: string;
  deadline: string;
  owner: string;
}

export interface MonthlyAction {
  title: string;
  axe: string;
  date: string;
  owner: string;
  priority: 'critical' | 'high' | 'medium';
}

export interface MonthlyProjection {
  velocity: number;
  estimatedEnd: string;
  target: string;
  daysLate: number;
  requiredVelocity: number;
}

export interface MonthlyBudget {
  prevu: number;
  engage: number;
  realise: number;
  resteAEngager: number;
  lines: Array<{ cat: string; prevu: number; engage: number; pct: number }>;
}

export interface MonthlyReportData {
  month: string;
  generated: string;
  weather: string;
  weatherLabel: string;
  weatherEmoji: string;
  weatherSummary: string;
  kpis: MonthlyKPI[];
  sync: MonthlySync;
  trendMonthly: Array<{ m: string; pct: number }>;
  trendIdeal: Array<{ m: string; pct: number }>;
  axes: MonthlyAxe[];
  budget: MonthlyBudget;
  risks: MonthlyRisk[];
  riskStats: { critical: number; high: number; moderate: number };
  milestonesCurrent: MonthlyMilestone[];
  milestonesNext: MonthlyMilestone[];
  currentMonthLabel: string;
  nextMonthLabel: string;
  actions: MonthlyAction[];
  decisions: MonthlyDecision[];
  achievements: string[];
  projection: MonthlyProjection;
  confidenceScore: ReturnType<typeof useConfidenceScore>;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useMonthlyReportData(): MonthlyReportData | null {
  const allActions = useActions();
  const allJalons = useJalons();
  const allRisques = useRisques();
  const users = useUsers();
  const kpis = useDashboardKPIs();
  const trends = useCOPILTrends(1);
  const avancementGlobal = useAvancementGlobal();
  const meteoProjet = useMeteoProjet();
  const comparaisonAxes = useComparaisonAxes();
  const avancementParAxe = useAvancementParAxe();
  const budgetSynthese = useBudgetSynthese();
  const budgetParCategorie = useBudgetParCategorie();
  const confidenceScore = useConfidenceScore();
  const currentSite = useCurrentSite();

  return useMemo(() => {
    if (!allActions || !allJalons || !kpis) return null;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Dates du projet
    const openingDate = currentSite?.dateOuverture ?? PROJET_CONFIG.jalonsClés.softOpening;
    const opening = new Date(openingDate);
    const projectStart = new Date(PROJET_CONFIG.dateDebut);
    const totalDays = (opening.getTime() - projectStart.getTime()) / 86400000;
    const elapsedDays = Math.max(1, (now.getTime() - projectStart.getTime()) / 86400000);

    // Nom du mois
    const monthRaw = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const month = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1);
    const generated = now.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }) + ' à ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // User lookup
    const getUserName = (responsableId: number | undefined) => {
      if (!responsableId) return 'N/A';
      const user = users.find(u => u.id === responsableId);
      return user ? getUserFullName(user) : 'N/A';
    };

    // ---- MÉTÉO ----
    const meteoInfo = mapMeteoInfo(meteoProjet);
    const actionsEnRetard = allActions.filter(
      a => a.statut !== 'termine' && a.statut !== 'annule' && a.date_fin_prevue && a.date_fin_prevue < todayStr
    );
    const risquesActifs = allRisques.filter(r => r.status !== 'closed' && r.status !== 'ferme');
    const axesA0 = AXES_V5.filter(ax => {
      const avPar = avancementParAxe.find(a => a.axe === ax.dbCode);
      return (avPar?.avancement ?? 0) === 0;
    }).map(ax => ax.labelCourt);

    let weatherSummary = `Le projet affiche un avancement global de ${f2(avancementGlobal)}%.`;
    if (Math.abs(comparaisonAxes.ecart) > 1) {
      const direction = comparaisonAxes.ecart > 0 ? 'en avance sur' : 'en retard sur';
      weatherSummary += ` La mobilisation est ${direction} le chantier (${f2(Math.abs(comparaisonAxes.ecart))} pts d'écart).`;
    }
    if (axesA0.length > 0) {
      weatherSummary += ` Les axes ${axesA0.join(' et ')} à 0% constituent un point de vigilance.`;
    }
    if (budgetSynthese.engage === 0 && budgetSynthese.prevu > 0) {
      weatherSummary += ` Le budget n'est pas encore engagé.`;
    }

    // ---- KPIs ----
    const budgetM = f2(budgetSynthese.prevu / 1_000_000);
    const budgetEngageM = f2(budgetSynthese.engage / 1_000_000);
    const budgetRealiseM = f2(budgetSynthese.realise / 1_000_000);

    // Projection
    const velocity = avancementGlobal > 0 ? f2(avancementGlobal / (elapsedDays / 30)) : 0;
    const daysNeeded = avancementGlobal > 0 ? (100 / avancementGlobal) * elapsedDays : totalDays * 2;
    const finEstimee = new Date(projectStart.getTime() + daysNeeded * 86400000);
    const retardJours = Math.max(0, Math.ceil((finEstimee.getTime() - opening.getTime()) / 86400000));
    const remainingDays = Math.max(1, (opening.getTime() - now.getTime()) / 86400000);
    const requiredVelocity = f2((100 - avancementGlobal) / (remainingDays / 30));

    const idealPct = f2(Math.min(100, (elapsedDays / totalDays) * 100));

    const dKpis: MonthlyKPI[] = [
      {
        label: 'Avancement global', value: `${f2(avancementGlobal)}%`,
        sub: `${kpis.actionsTerminees} actions terminées`,
        trend: trends?.avancementProjet ? `${(trends.avancementProjet as any).delta > 0 ? '+' : ''}${f2((trends.avancementProjet as any).delta ?? 0)}pts` : 'stable',
        dir: (trends?.avancementProjet as any)?.direction ?? 'stable',
        icon: '📊', target: `${idealPct}%`, onTrack: avancementGlobal >= idealPct,
      },
      {
        label: 'Actions terminées', value: `${kpis.actionsTerminees} / ${kpis.totalActions}`,
        sub: `${kpis.totalActions > 0 ? f2((kpis.actionsTerminees / kpis.totalActions) * 100) : 0}% du total`,
        trend: `+${kpis.actionsTerminees}`, dir: kpis.actionsTerminees > 0 ? 'up' : 'stable',
        icon: '✅', target: `${kpis.totalActions}/${kpis.totalActions}`, onTrack: false,
      },
      {
        label: 'Jalons atteints', value: `${kpis.jalonsAtteints} / ${kpis.jalonsTotal}`,
        sub: `${allJalons.filter(j => j.date_prevue.startsWith(todayStr.slice(0, 7))).length} jalons ce mois`,
        trend: kpis.jalonsAtteints > 0 ? `+${kpis.jalonsAtteints}` : 'stable',
        dir: kpis.jalonsAtteints > 0 ? 'up' : 'stable',
        icon: '🎯', target: `${kpis.jalonsTotal}/${kpis.jalonsTotal}`, onTrack: false,
      },
      {
        label: "Taux d'occupation", value: `${f2(kpis.tauxOccupation)}%`,
        sub: 'Baux signés/cibles',
        trend: (trends?.occupation as any)?.direction === 'up' ? `+${f2((trends.occupation as any).delta ?? 0)}pts` : 'stable',
        dir: (trends?.occupation as any)?.direction ?? 'stable',
        icon: '🏢', target: '50%', onTrack: kpis.tauxOccupation >= 50,
      },
      {
        label: 'Budget engagé', value: budgetEngageM > 0 ? `${budgetEngageM}M` : '0 FCFA',
        sub: `sur ${budgetM}M prévus`,
        trend: budgetEngageM > 0 ? `${f2(budgetSynthese.tauxEngagement)}%` : 'stable',
        dir: budgetEngageM > 0 ? 'up' : 'stable',
        icon: '💰', target: `${budgetM}M`, onTrack: budgetSynthese.tauxEngagement >= 50,
      },
      {
        label: 'Retard projeté', value: retardJours > 0 ? `~${retardJours}j` : "À l'heure",
        sub: 'à vélocité actuelle',
        trend: retardJours > 0 ? 'attention' : 'OK',
        dir: retardJours > 0 ? 'down' : 'up',
        icon: '⏱️', target: '0j', onTrack: retardJours === 0,
      },
    ];

    // ---- SYNC ----
    const ecartDays = Math.abs(comparaisonAxes.ecart) > 0 && avancementGlobal > 0
      ? Math.round(Math.abs(comparaisonAxes.ecart) / (avancementGlobal / elapsedDays))
      : 0;
    const sync: MonthlySync = {
      construction: f2(comparaisonAxes.technique.avancement),
      mobilisation: f2(comparaisonAxes.commercial.avancement),
      ecart: f2(comparaisonAxes.ecart),
      ecartDays: Math.min(ecartDays, 999),
      status: comparaisonAxes.estSynchronise ? 'ok' : 'attention',
    };

    // ---- TREND MENSUEL ----
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const startMonth = projectStart.getMonth();
    const startYear = projectStart.getFullYear();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const totalMonths = (opening.getFullYear() - startYear) * 12 + opening.getMonth() - startMonth;

    const trendMonthly: Array<{ m: string; pct: number }> = [];
    const trendIdeal: Array<{ m: string; pct: number }> = [];
    let mIdx = 0;
    for (let y = startYear; y <= currentYear; y++) {
      const mStart = y === startYear ? startMonth : 0;
      const mEnd = y === currentYear ? currentMonth : 11;
      for (let m = mStart; m <= mEnd; m++) {
        const isCurrentMonth = y === currentYear && m === currentMonth;
        const idealPctM = f2(Math.min(100, (mIdx / Math.max(1, totalMonths)) * 100));
        const realPctM = isCurrentMonth
          ? f2(avancementGlobal)
          : f2(avancementGlobal * (mIdx / Math.max(1, (currentYear - startYear) * 12 + currentMonth - startMonth)));
        trendMonthly.push({ m: monthNames[m], pct: realPctM });
        trendIdeal.push({ m: monthNames[m], pct: idealPctM });
        mIdx++;
      }
    }

    // ---- AXES ----
    const axes: MonthlyAxe[] = AXES_V5.map(axeConfig => {
      const axeCode = axeConfig.dbCode as Axe;
      const avPar = avancementParAxe.find(a => a.axe === axeCode);
      const axeActions = allActions.filter(a => a.axe === axeCode);
      const done = axeActions.filter(a => a.statut === 'termine').length;
      const late = axeActions.filter(
        a => a.statut !== 'termine' && a.statut !== 'annule' && a.date_fin_prevue && a.date_fin_prevue < todayStr
      ).length;
      const blocked = axeActions.filter(a => a.statut === 'bloque').length;

      let status = 'progress';
      if (axeActions.length === 0 || ((avPar?.avancement ?? 0) === 0 && done === 0)) status = 'notstarted';
      else if (blocked > 0 || late > axeActions.length * 0.4) status = 'blocked';
      else if (late > 0) status = 'slow';

      // Key fact
      let keyFact = 'En cours de démarrage';
      const inProgress = axeActions.filter(a => a.statut === 'en_cours');
      if (done > 0) keyFact = `${done} action${done > 1 ? 's' : ''} terminée${done > 1 ? 's' : ''}`;
      else if (inProgress.length > 0) keyFact = inProgress[0].titre.slice(0, 60);
      else if (axeActions.length === 0) keyFact = 'Aucune action planifiée';

      // Blocker
      const blockedActions = axeActions.filter(a => a.points_blocage);
      let blocker = 'RAS';
      if (blockedActions.length > 0) blocker = blockedActions[0].points_blocage!;
      else if (late > 0) blocker = `${late} action${late > 1 ? 's' : ''} en retard`;

      return {
        code: axeConfig.labelCourt,
        name: axeConfig.label,
        pct: f2(avPar?.avancement ?? 0),
        done,
        total: axeActions.length,
        late,
        janPct: 0,
        status,
        keyFact,
        blocker,
      };
    });

    // ---- BUDGET ----
    const budgetLines = Object.entries(budgetParCategorie ?? {})
      .map(([cat, vals]) => ({
        cat,
        prevu: f2((vals as any).prevu / 1_000_000),
        engage: f2((vals as any).engage / 1_000_000),
        pct: (vals as any).prevu > 0 ? f2(((vals as any).realise / (vals as any).prevu) * 100) : 0,
      }))
      .filter(l => l.prevu > 0)
      .sort((a, b) => b.prevu - a.prevu);

    const budget: MonthlyBudget = {
      prevu: budgetM,
      engage: budgetEngageM,
      realise: budgetRealiseM,
      resteAEngager: f2((budgetSynthese.prevu - budgetSynthese.engage) / 1_000_000),
      lines: budgetLines,
    };

    // ---- RISQUES ----
    const risks: MonthlyRisk[] = risquesActifs
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 5)
      .map(r => ({
        score: r.score ?? 0,
        title: r.titre,
        pi: `P${r.probabilite ?? '?'}×I${r.impact ?? '?'}`,
        evolution: 'stable' as const,
        owner: r.responsable ?? 'N/A',
        mitigation: r.mesures_attenuation ?? '❌ À définir',
        impact: r.description?.slice(0, 100) ?? '',
      }));

    const riskStats = {
      critical: risquesActifs.filter(r => (r.score ?? 0) >= 16).length,
      high: risquesActifs.filter(r => (r.score ?? 0) >= 9 && (r.score ?? 0) < 16).length,
      moderate: risquesActifs.filter(r => (r.score ?? 0) < 9).length,
    };

    // ---- JALONS ----
    const currentMonthStr = todayStr.slice(0, 7);
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthStr = nextMonthDate.toISOString().split('T')[0].slice(0, 7);
    const currentMonthLabelRaw = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const nextMonthLabelRaw = nextMonthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    const milestonesCurrent: MonthlyMilestone[] = allJalons
      .filter(j => j.date_prevue.startsWith(currentMonthStr))
      .sort((a, b) => a.date_prevue.localeCompare(b.date_prevue))
      .map(j => ({
        name: j.titre,
        axe: AXES_V5.find(ax => ax.dbCode === j.axe)?.labelCourt ?? j.axe,
        date: formatDateShort(j.date_prevue),
        status: mapJalonDisplayStatus(j.statut, j.date_prevue, todayStr),
      }));

    const milestonesNext: MonthlyMilestone[] = allJalons
      .filter(j => j.date_prevue.startsWith(nextMonthStr))
      .sort((a, b) => a.date_prevue.localeCompare(b.date_prevue))
      .map(j => ({
        name: j.titre,
        axe: AXES_V5.find(ax => ax.dbCode === j.axe)?.labelCourt ?? j.axe,
        date: formatDateShort(j.date_prevue),
        status: mapJalonDisplayStatus(j.statut, j.date_prevue, todayStr),
      }));

    // ---- ACTIONS PLAN M+1 ----
    const planActions: MonthlyAction[] = allActions
      .filter(a => a.statut !== 'termine' && a.statut !== 'annule')
      .sort((a, b) => {
        const priOrd: Record<string, number> = { critique: 0, haute: 1, moyenne: 2, basse: 3 };
        return (priOrd[a.priorite] ?? 4) - (priOrd[b.priorite] ?? 4);
      })
      .slice(0, 8)
      .map(a => ({
        title: a.titre,
        axe: AXES_V5.find(ax => ax.dbCode === a.axe)?.labelCourt ?? a.axe,
        date: formatDateShort(a.date_fin_prevue),
        owner: getUserName(a.responsableId),
        priority: (a.priorite === 'critique' ? 'critical' : a.priorite === 'haute' ? 'high' : 'medium') as 'critical' | 'high' | 'medium',
      }));

    // ---- DÉCISIONS ----
    const pendingDecisions: MonthlyDecision[] = allActions
      .filter(a => a.decisions_attendues && a.decisions_attendues.length > 0 && a.statut !== 'termine')
      .sort((a, b) => {
        const priOrd: Record<string, number> = { critique: 0, haute: 1, moyenne: 2, basse: 3 };
        return (priOrd[a.priorite] ?? 4) - (priOrd[b.priorite] ?? 4);
      })
      .slice(0, 5)
      .map(a => ({
        urgency: (a.priorite === 'critique' ? 'critical' : 'high') as 'critical' | 'high',
        title: a.titre,
        context: a.decisions_attendues?.map(dd => typeof dd === 'string' ? dd : (dd as any).description ?? '').join('. ') ?? '',
        deadline: formatDateShort(a.date_fin_prevue),
        owner: getUserName(a.responsableId),
      }));

    // ---- RÉALISATIONS ----
    const achievements = allActions
      .filter(a => a.statut === 'termine' && a.date_fin_reelle && a.date_fin_reelle.startsWith(currentMonthStr))
      .map(a => a.titre);
    if (achievements.length === 0) {
      // Fallback: dernières actions terminées
      allActions
        .filter(a => a.statut === 'termine')
        .sort((a, b) => (b.date_fin_reelle ?? '').localeCompare(a.date_fin_reelle ?? ''))
        .slice(0, 3)
        .forEach(a => achievements.push(a.titre));
    }

    // ---- PROJECTION ----
    const projection: MonthlyProjection = {
      velocity,
      estimatedEnd: finEstimee.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      target: opening.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      daysLate: retardJours,
      requiredVelocity,
    };

    return {
      month,
      generated,
      weather: meteoInfo.key,
      weatherLabel: meteoInfo.label,
      weatherEmoji: meteoInfo.emoji,
      weatherSummary,
      kpis: dKpis,
      sync,
      trendMonthly,
      trendIdeal,
      axes,
      budget,
      risks,
      riskStats,
      milestonesCurrent,
      milestonesNext,
      currentMonthLabel: currentMonthLabelRaw.charAt(0).toUpperCase() + currentMonthLabelRaw.slice(1),
      nextMonthLabel: nextMonthLabelRaw.charAt(0).toUpperCase() + nextMonthLabelRaw.slice(1) + ' (à venir)',
      actions: planActions,
      decisions: pendingDecisions,
      achievements,
      projection,
      confidenceScore,
    };
  }, [
    allActions, allJalons, allRisques, users, kpis, trends,
    avancementGlobal, meteoProjet, comparaisonAxes, avancementParAxe,
    budgetSynthese, budgetParCategorie, confidenceScore, currentSite,
  ]);
}
