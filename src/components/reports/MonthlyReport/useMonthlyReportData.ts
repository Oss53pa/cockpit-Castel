/**
 * useMonthlyReportData -- Hook de donnees live pour le Rapport Mensuel
 * Remplace toutes les donnees statiques par des donnees DB en temps reel.
 *
 * Shape de retour exactement alignee sur le `const d` original du fichier
 * tmp_original_monthly.tsx, enrichie de champs supplementaires consommes
 * par MonthlyReport.tsx (riskStats, milestonesCurrent, milestonesNext,
 * currentMonthLabel, nextMonthLabel).
 */

import { useMemo } from 'react';
import { useActions } from '@/hooks/useActions';
import { useJalons } from '@/hooks/useJalons';
import { useRisques } from '@/hooks/useRisques';
import { useUsers, getUserFullName } from '@/hooks/useUsers';
import {
  useDashboardKPIs,
  useAvancementGlobal,
  useMeteoProjet,
  useComparaisonAxes,
  useAvancementParAxe,
  useCOPILTrends,
} from '@/hooks/useDashboard';
import { useBudgetSynthese, useBudgetParCategorie } from '@/hooks/useBudget';
import { useConfidenceScore } from '@/hooks/useConfidenceScore';
import { useCurrentSite } from '@/hooks/useSites';
import { PROJET_CONFIG } from '@/data/constants';
import { AXES_V5 } from '@/components/rapports/ExcoMensuelV5/constants';
import type { Axe } from '@/types';

// ============================================================================
// HELPERS
// ============================================================================

/** Round to 2 decimal places */
const f2 = (v: number) => Math.round(v * 100) / 100;

/** Format an ISO date string to short French date (e.g. "9 fevr.") */
function formatDateShort(d: string): string {
  if (!d) return '\u2014';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Map meteo projet value (vert/jaune/orange/rouge) to report-facing labels.
 * Returns a weather key matching the original static shape
 * (sunny | cloudy | rainy | stormy), plus label and emoji.
 */
function mapMeteoInfo(meteo: string): { key: string; label: string; emoji: string } {
  if (meteo === 'rouge') return { key: 'stormy', label: 'Critique', emoji: '\uD83C\uDF29\uFE0F' };
  if (meteo === 'orange') return { key: 'rainy', label: 'Alerte', emoji: '\uD83C\uDF27\uFE0F' };
  if (meteo === 'jaune') return { key: 'cloudy', label: 'Vigilance', emoji: '\u26C5' };
  return { key: 'sunny', label: 'Favorable', emoji: '\u2600\uFE0F' };
}

/**
 * Map a jalon DB statut + date to a display status string
 * matching the original shape: "done" | "ontrack" | "atrisk" | "compromised"
 */
function mapJalonDisplayStatus(statut: string, datePrevue: string, todayStr: string): string {
  if (statut === 'atteint') return 'done';
  if (statut === 'en_approche') return 'atrisk';
  if (statut === 'en_danger' || statut === 'depasse') return 'compromised';
  // a_venir but date already passed => compromised
  if (datePrevue < todayStr && statut !== 'atteint') return 'compromised';
  return 'ontrack';
}

// ============================================================================
// EXPORTED TYPES
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
  // --- Core header ---
  month: string;
  generated: string;

  // --- Weather ---
  weather: string;
  weatherLabel: string;
  weatherEmoji: string;
  weatherSummary: string;

  // --- KPIs ---
  kpis: MonthlyKPI[];

  // --- Sync ---
  sync: MonthlySync;

  // --- Trend lines ---
  trendMonthly: Array<{ m: string; pct: number }>;
  trendIdeal: Array<{ m: string; pct: number }>;

  // --- Axes ---
  axes: MonthlyAxe[];

  // --- Budget ---
  budget: MonthlyBudget;

  // --- Risks ---
  risks: MonthlyRisk[];
  riskStats: { critical: number; high: number; moderate: number };

  // --- Milestones ---
  milestonesCurrent: MonthlyMilestone[];
  milestonesNext: MonthlyMilestone[];
  currentMonthLabel: string;
  nextMonthLabel: string;

  // --- Actions plan ---
  actions: MonthlyAction[];

  // --- Decisions ---
  decisions: MonthlyDecision[];

  // --- Achievements ---
  achievements: string[];

  // --- Projection ---
  projection: MonthlyProjection;

  // --- Confidence score (nullable) ---
  confidenceScore: {
    score: number;
    status: string;
    trend: 'up' | 'down' | 'stable';
  } | null;
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
    // Wait for essential data to load
    if (!allActions || !allJalons || !kpis) return null;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // ------------------------------------------------------------------
    // Project dates
    // ------------------------------------------------------------------
    const openingDateStr = currentSite?.dateOuverture ?? PROJET_CONFIG.jalonsClés.softOpening;
    const opening = new Date(openingDateStr);
    const projectStart = new Date(PROJET_CONFIG.dateDebut);
    const totalDays = (opening.getTime() - projectStart.getTime()) / 86_400_000;
    const elapsedDays = Math.max(1, (now.getTime() - projectStart.getTime()) / 86_400_000);

    // ------------------------------------------------------------------
    // Month / generated
    // ------------------------------------------------------------------
    const monthRaw = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const month = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1);

    const generated =
      now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' \u00e0 ' +
      now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // ------------------------------------------------------------------
    // User lookup helper
    // ------------------------------------------------------------------
    const getUserName = (responsableId: number | undefined): string => {
      if (!responsableId) return 'N/A';
      const user = users.find(u => u.id === responsableId);
      return user ? getUserFullName(user) : 'N/A';
    };

    // ------------------------------------------------------------------
    // METEO / WEATHER
    // ------------------------------------------------------------------
    const meteoInfo = mapMeteoInfo(meteoProjet);

    const actionsEnRetard = allActions.filter(
      a => a.statut !== 'termine' && a.statut !== 'annule' && a.date_fin_prevue && a.date_fin_prevue < todayStr,
    );

    const risquesActifs = allRisques.filter(r => r.status !== 'closed' && r.status !== 'ferme');

    // Axes at 0%
    const axesA0 = AXES_V5.filter(ax => {
      const avPar = avancementParAxe.find(a => a.axe === ax.dbCode);
      return (avPar?.avancement ?? 0) === 0;
    }).map(ax => ax.labelCourt);

    let weatherSummary = `Le projet affiche un avancement global de ${f2(avancementGlobal)}%.`;
    if (Math.abs(comparaisonAxes.ecart) > 1) {
      const direction = comparaisonAxes.ecart > 0 ? 'en avance sur' : 'en retard sur';
      weatherSummary += ` La mobilisation est ${direction} le chantier (${f2(Math.abs(comparaisonAxes.ecart))} pts d'\u00e9cart).`;
    }
    if (axesA0.length > 0) {
      weatherSummary += ` Les axes ${axesA0.join(' et ')} \u00e0 0% constituent un point de vigilance.`;
    }
    if (budgetSynthese.engage === 0 && budgetSynthese.prevu > 0) {
      weatherSummary += ` Le budget n'est pas encore engag\u00e9.`;
    }

    // ------------------------------------------------------------------
    // KPIs
    // ------------------------------------------------------------------
    const budgetM = f2(budgetSynthese.prevu / 1_000_000);
    const budgetEngageM = f2(budgetSynthese.engage / 1_000_000);
    const budgetRealiseM = f2(budgetSynthese.realise / 1_000_000);

    // Ideal progress based on elapsed time
    const idealPct = f2(Math.min(100, (elapsedDays / totalDays) * 100));

    // Projection calculations (used in KPI #6 and projection section)
    const velocity = avancementGlobal > 0 ? f2(avancementGlobal / (elapsedDays / 30)) : 0;
    const daysNeeded = avancementGlobal > 0
      ? (100 / avancementGlobal) * elapsedDays
      : totalDays * 2;
    const finEstimee = new Date(projectStart.getTime() + daysNeeded * 86_400_000);
    const retardJours = Math.max(0, Math.ceil((finEstimee.getTime() - opening.getTime()) / 86_400_000));
    const remainingDays = Math.max(1, (opening.getTime() - now.getTime()) / 86_400_000);
    const requiredVelocity = f2((100 - avancementGlobal) / (remainingDays / 30));

    // Trend deltas from COPIL trends
    const avancementDelta = trends?.avancementProjet
      ? f2(trends.avancementProjet.currentValue - trends.avancementProjet.previousValue)
      : 0;
    const avancementDir = trends?.avancementProjet?.direction ?? 'stable';

    // Jalons this month count for sub text
    const jalonsThisMonth = allJalons.filter(j => j.date_prevue.startsWith(todayStr.slice(0, 7))).length;

    const dKpis: MonthlyKPI[] = [
      {
        label: 'Avancement global',
        value: `${f2(avancementGlobal)}%`,
        sub: `${kpis.actionsTerminees} actions termin\u00e9es`,
        trend: avancementDelta !== 0 ? `${avancementDelta > 0 ? '+' : ''}${avancementDelta}pts` : 'stable',
        dir: avancementDir,
        icon: '\uD83D\uDCCA',
        target: `${idealPct}%`,
        onTrack: avancementGlobal >= idealPct,
      },
      {
        label: 'Actions termin\u00e9es',
        value: `${kpis.actionsTerminees} / ${kpis.totalActions}`,
        sub: `${kpis.totalActions > 0 ? f2((kpis.actionsTerminees / kpis.totalActions) * 100) : 0}% du total`,
        trend: kpis.actionsTerminees > 0 ? `+${kpis.actionsTerminees}` : 'stable',
        dir: kpis.actionsTerminees > 0 ? 'up' : 'stable',
        icon: '\u2705',
        target: `${Math.round(kpis.totalActions * 0.1)}/${kpis.totalActions}`,
        onTrack: false,
      },
      {
        label: 'Jalons atteints',
        value: `${kpis.jalonsAtteints} / ${kpis.jalonsTotal}`,
        sub: `${jalonsThisMonth} jalons ce mois`,
        trend: kpis.jalonsAtteints > 0 ? `+${kpis.jalonsAtteints}` : 'stable',
        dir: kpis.jalonsAtteints > 0 ? 'up' : 'stable',
        icon: '\uD83C\uDFAF',
        target: `${kpis.jalonsTotal}/${kpis.jalonsTotal}`,
        onTrack: false,
      },
      {
        label: "Taux d'occupation",
        value: `${f2(kpis.tauxOccupation)}%`,
        sub: 'Baux sign\u00e9s/cibles',
        trend: 'stable',
        dir: 'stable',
        icon: '\uD83C\uDFE2',
        target: '50%',
        onTrack: kpis.tauxOccupation >= 50,
      },
      {
        label: 'Budget engag\u00e9',
        value: budgetEngageM > 0 ? `${budgetEngageM}M` : '0 FCFA',
        sub: `sur ${budgetM}M pr\u00e9vus`,
        trend: budgetEngageM > 0 ? `${f2(budgetSynthese.tauxEngagement)}%` : 'stable',
        dir: budgetEngageM > 0 ? 'up' : 'stable',
        icon: '\uD83D\uDCB0',
        target: `${budgetM}M`,
        onTrack: budgetSynthese.tauxEngagement >= 50,
      },
      {
        label: 'Retard projet\u00e9',
        value: retardJours > 0 ? `~${retardJours}j` : "\u00c0 l'heure",
        sub: '\u00e0 v\u00e9locit\u00e9 actuelle',
        trend: retardJours > 0 ? 'attention' : 'OK',
        dir: retardJours > 0 ? 'down' : 'up',
        icon: '\u23F1\uFE0F',
        target: '0j',
        onTrack: retardJours === 0,
      },
    ];

    // ------------------------------------------------------------------
    // SYNC
    // ------------------------------------------------------------------
    const ecartDays =
      Math.abs(comparaisonAxes.ecart) > 0 && avancementGlobal > 0
        ? Math.round(Math.abs(comparaisonAxes.ecart) / (avancementGlobal / elapsedDays))
        : 0;

    const sync: MonthlySync = {
      construction: f2(comparaisonAxes.technique.avancement),
      mobilisation: f2(comparaisonAxes.commercial.avancement),
      ecart: f2(comparaisonAxes.ecart),
      ecartDays: Math.min(ecartDays, 999),
      status: comparaisonAxes.estSynchronise ? 'ok' : 'attention',
    };

    // ------------------------------------------------------------------
    // TREND MONTHLY / IDEAL
    // ------------------------------------------------------------------
    const monthNames = ['Jan', 'F\u00e9v', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Ao\u00fb', 'Sep', 'Oct', 'Nov', 'D\u00e9c'];
    const startMonth = projectStart.getMonth();
    const startYear = projectStart.getFullYear();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const totalMonths = (opening.getFullYear() - startYear) * 12 + opening.getMonth() - startMonth;
    const elapsedMonths = (currentYear - startYear) * 12 + currentMonth - startMonth;

    const trendMonthly: Array<{ m: string; pct: number }> = [];
    const trendIdeal: Array<{ m: string; pct: number }> = [];
    let mIdx = 0;

    for (let y = startYear; y <= currentYear; y++) {
      const mStart = y === startYear ? startMonth : 0;
      const mEnd = y === currentYear ? currentMonth : 11;
      for (let m = mStart; m <= mEnd; m++) {
        const isCurrentMonth = y === currentYear && m === currentMonth;
        const idealPctM = f2(Math.min(100, (mIdx / Math.max(1, totalMonths)) * 100));
        // Approximate real pct: linear interpolation from 0 to current avancement
        const realPctM = isCurrentMonth
          ? f2(avancementGlobal)
          : f2(avancementGlobal * (mIdx / Math.max(1, elapsedMonths)));
        trendMonthly.push({ m: monthNames[m], pct: realPctM });
        trendIdeal.push({ m: monthNames[m], pct: idealPctM });
        mIdx++;
      }
    }

    // ------------------------------------------------------------------
    // AXES
    // ------------------------------------------------------------------
    const axes: MonthlyAxe[] = AXES_V5.map(axeConfig => {
      const axeCode = axeConfig.dbCode as Axe;
      const avPar = avancementParAxe.find(a => a.axe === axeCode);
      const axeActions = allActions.filter(a => a.axe === axeCode);
      const done = axeActions.filter(a => a.statut === 'termine').length;
      const late = axeActions.filter(
        a => a.statut !== 'termine' && a.statut !== 'annule' && a.date_fin_prevue && a.date_fin_prevue < todayStr,
      ).length;
      const blocked = axeActions.filter(a => a.statut === 'bloque').length;

      const pct = f2(avPar?.avancement ?? 0);

      // Status determination
      let status = 'progress';
      if (axeActions.length === 0 || (pct === 0 && done === 0)) {
        status = 'notstarted';
      } else if (blocked > 0 || late > axeActions.length * 0.4) {
        status = 'blocked';
      } else if (late > 0) {
        status = 'slow';
      }

      // Estimate previous month pct:
      // If we have velocity data and more than 1 elapsed month, approximate
      const janPct = elapsedMonths > 0
        ? f2(Math.max(0, pct - (pct / Math.max(1, elapsedMonths))))
        : 0;

      // Key fact
      let keyFact = 'En cours de d\u00e9marrage';
      const inProgress = axeActions.filter(a => a.statut === 'en_cours');
      if (done > 0) {
        keyFact = `${done} action${done > 1 ? 's' : ''} termin\u00e9e${done > 1 ? 's' : ''}`;
      } else if (inProgress.length > 0) {
        keyFact = inProgress[0].titre.slice(0, 60);
      } else if (axeActions.length === 0) {
        keyFact = 'Aucune action planifi\u00e9e';
      }

      // Blocker
      const blockedActions = axeActions.filter(a => a.points_blocage);
      let blocker = 'RAS';
      if (blockedActions.length > 0) {
        blocker = blockedActions[0].points_blocage!;
      } else if (late > 0) {
        blocker = `${late} action${late > 1 ? 's' : ''} en retard`;
      }

      return {
        code: axeConfig.labelCourt,
        name: axeConfig.label,
        pct,
        done,
        total: axeActions.length,
        late,
        janPct,
        status,
        keyFact,
        blocker,
      };
    });

    // ------------------------------------------------------------------
    // BUDGET
    // ------------------------------------------------------------------
    const budgetLines = Object.entries(budgetParCategorie ?? {})
      .map(([cat, vals]) => {
        const v = vals as { prevu: number; engage: number; realise: number };
        return {
          cat,
          prevu: f2(v.prevu / 1_000_000),
          engage: f2(v.engage / 1_000_000),
          pct: v.prevu > 0 ? f2((v.realise / v.prevu) * 100) : 0,
        };
      })
      .filter(l => l.prevu > 0)
      .sort((a, b) => b.prevu - a.prevu);

    const budget: MonthlyBudget = {
      prevu: budgetM,
      engage: budgetEngageM,
      realise: budgetRealiseM,
      resteAEngager: f2((budgetSynthese.prevu - budgetSynthese.engage) / 1_000_000),
      lines: budgetLines,
    };

    // ------------------------------------------------------------------
    // RISKS
    // ------------------------------------------------------------------
    const risks: MonthlyRisk[] = risquesActifs
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 5)
      .map(r => ({
        score: r.score ?? 0,
        title: r.titre,
        pi: `P${r.probabilite ?? '?'}\u00d7I${r.impact ?? '?'}`,
        evolution: 'stable' as const,
        owner: r.responsable ?? 'N/A',
        mitigation: r.mesures_attenuation ?? '\u274C \u00c0 d\u00e9finir',
        impact: r.description?.slice(0, 100) ?? '',
      }));

    const riskStats = {
      critical: risquesActifs.filter(r => (r.score ?? 0) >= 16).length,
      high: risquesActifs.filter(r => (r.score ?? 0) >= 10 && (r.score ?? 0) < 16).length,
      moderate: risquesActifs.filter(r => (r.score ?? 0) < 10).length,
    };

    // ------------------------------------------------------------------
    // MILESTONES (current month & next month)
    // ------------------------------------------------------------------
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

    // ------------------------------------------------------------------
    // ACTIONS (priority plan for next period)
    // ------------------------------------------------------------------
    const priOrd: Record<string, number> = { critique: 0, haute: 1, moyenne: 2, basse: 3 };

    const planActions: MonthlyAction[] = allActions
      .filter(a => a.statut !== 'termine' && a.statut !== 'annule')
      .sort((a, b) => (priOrd[a.priorite] ?? 4) - (priOrd[b.priorite] ?? 4))
      .slice(0, 8)
      .map(a => ({
        title: a.titre,
        axe: AXES_V5.find(ax => ax.dbCode === a.axe)?.labelCourt ?? a.axe,
        date: formatDateShort(a.date_fin_prevue),
        owner: getUserName(a.responsableId),
        priority: (
          a.priorite === 'critique' ? 'critical'
          : a.priorite === 'haute' ? 'high'
          : 'medium'
        ) as 'critical' | 'high' | 'medium',
      }));

    // ------------------------------------------------------------------
    // DECISIONS
    // ------------------------------------------------------------------
    const pendingDecisions: MonthlyDecision[] = allActions
      .filter(a => a.decisions_attendues && a.decisions_attendues.length > 0 && a.statut !== 'termine')
      .sort((a, b) => (priOrd[a.priorite] ?? 4) - (priOrd[b.priorite] ?? 4))
      .slice(0, 5)
      .map(a => ({
        urgency: (a.priorite === 'critique' ? 'critical' : 'high') as 'critical' | 'high',
        title: a.titre,
        context:
          a.decisions_attendues
            ?.map(dd => (typeof dd === 'string' ? dd : (dd as any).description ?? ''))
            .join('. ') ?? '',
        deadline: formatDateShort(a.date_fin_prevue),
        owner: getUserName(a.responsableId),
      }));

    // ------------------------------------------------------------------
    // ACHIEVEMENTS (actions completed this month)
    // ------------------------------------------------------------------
    const achievements = allActions
      .filter(a => a.statut === 'termine' && a.date_fin_reelle && a.date_fin_reelle.startsWith(currentMonthStr))
      .map(a => a.titre);

    // Fallback: if no achievements this month, show latest completed actions
    if (achievements.length === 0) {
      allActions
        .filter(a => a.statut === 'termine')
        .sort((a, b) => (b.date_fin_reelle ?? '').localeCompare(a.date_fin_reelle ?? ''))
        .slice(0, 3)
        .forEach(a => achievements.push(a.titre));
    }

    // ------------------------------------------------------------------
    // PROJECTION
    // ------------------------------------------------------------------
    const projection: MonthlyProjection = {
      velocity,
      estimatedEnd: finEstimee.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      target: opening.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      daysLate: retardJours,
      requiredVelocity,
    };

    // ------------------------------------------------------------------
    // CONFIDENCE SCORE (simplified shape for report)
    // ------------------------------------------------------------------
    const confidenceScoreResult = confidenceScore
      ? { score: confidenceScore.score, status: confidenceScore.status, trend: confidenceScore.trend }
      : null;

    // ------------------------------------------------------------------
    // RETURN
    // ------------------------------------------------------------------
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
      nextMonthLabel: nextMonthLabelRaw.charAt(0).toUpperCase() + nextMonthLabelRaw.slice(1) + ' (\u00e0 venir)',
      actions: planActions,
      decisions: pendingDecisions,
      achievements,
      projection,
      confidenceScore: confidenceScoreResult,
    };
  }, [
    allActions,
    allJalons,
    allRisques,
    users,
    kpis,
    trends,
    avancementGlobal,
    meteoProjet,
    comparaisonAxes,
    avancementParAxe,
    budgetSynthese,
    budgetParCategorie,
    confidenceScore,
    currentSite,
  ]);
}
