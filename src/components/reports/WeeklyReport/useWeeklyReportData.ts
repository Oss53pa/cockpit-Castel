/**
 * useWeeklyReportData — Hook de données centralisé pour le Rapport Hebdomadaire V2
 * Pattern inspiré de useExcoV5Data
 */

import { useMemo, useState, useCallback } from 'react';
import {
  useActions,
  useJalons,
  useRisques,
  useDashboardKPIs,
  useCOPILTrends,
  useBudgetSynthese,
  useConfidenceScore,
  useCurrentSite,
} from '@/hooks';
import {
  useAvancementGlobal,
  useMeteoProjet,
  useComparaisonAxes,
  useAvancementParAxe,
} from '@/hooks/useDashboard';
import { PROJET_CONFIG, AXES_CONFIG_FULL } from '@/data/constants';
import { AXES_V5, METEO_CONFIG } from '@/components/rapports/ExcoMensuelV5/constants';
import type { MeteoLevel } from '@/components/rapports/ExcoMensuelV5/constants';
import type { Action, Jalon, Risque, Axe } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface WeeklyHighlight {
  type: 'done' | 'alert' | 'info';
  text: string;
}

export interface AxeWeeklyData {
  id: string;
  dbCode: string;
  label: string;
  labelCourt: string;
  color: string;
  avancement: number;
  prevu: number;
  tendance: 'up' | 'down' | 'stable';
  actionsTotal: number;
  actionsTerminees: number;
  actionsEnRetard: number;
  topRisque: Risque | null;
  prochainJalon: Jalon | null;
}

export interface MilestonePreview {
  jalon: Jalon;
  joursRestants: number;
  prerequisPct: number;
}

export interface TopRisque {
  risque: Risque;
  evolution: 'up' | 'down' | 'stable';
}

export interface WeeklyProjection {
  velocite: number;
  finEstimee: string;
  cible: string;
  retardJours: number;
}

export interface WeeklyReportData {
  isLoading: boolean;
  projectName: string;
  weekNumber: number;
  periodLabel: string;
  // KPIs
  avancementGlobal: number;
  kpis: ReturnType<typeof useDashboardKPIs>;
  trends: ReturnType<typeof useCOPILTrends>;
  // Meteo
  meteo: MeteoLevel;
  weatherSummary: string;
  // Sync
  comparaisonAxes: ReturnType<typeof useComparaisonAxes>;
  // Budget
  budgetSynthese: ReturnType<typeof useBudgetSynthese>;
  // Axes
  axesData: AxeWeeklyData[];
  // Highlights
  highlights: WeeklyHighlight[];
  // Decisions
  pendingDecisions: Action[];
  // Milestones
  prochainsMilestones: MilestonePreview[];
  // Risques
  topRisques: TopRisque[];
  // Focus S+1
  focusSemaineProchaine: Action[];
  // Projection
  projection: WeeklyProjection;
  // Trend chart data
  trendHistory: { semaine: number; reel: number; ideal: number }[];
  // Confidence
  confidenceScore: ReturnType<typeof useConfidenceScore>;
  // Notes éditables
  notes: string;
  setNotes: (v: string) => void;
  // Raw data
  allActions: Action[];
  allJalons: Jalon[];
  allRisques: Risque[];
  // Dates
  joursRestants: number;
  openingDate: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getWeekNumber(d: Date): number {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - oneJan.getTime()) / 86400000);
  return Math.ceil((days + oneJan.getDay() + 1) / 7);
}

function formatPeriod(d: Date): string {
  const start = new Date(d);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  const end = new Date(start);
  end.setDate(end.getDate() + 4); // Friday
  const fmt = (dt: Date) =>
    `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}`;
  return `${fmt(start)} — ${fmt(end)}/${d.getFullYear()}`;
}

function mapMeteoToLevel(meteo: string): MeteoLevel {
  if (meteo === 'rouge') return 'rouge';
  if (meteo === 'jaune') return 'orange';
  if (meteo === 'vert') return 'vert';
  return 'bleu';
}

const LS_KEY_PREFIX = 'weekly-report-notes-';

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useWeeklyReportData(): WeeklyReportData {
  const today = new Date();
  const weekNum = getWeekNumber(today);
  const todayStr = today.toISOString().split('T')[0];

  // === Data hooks ===
  const allActions = useActions();
  const allJalons = useJalons();
  const allRisques = useRisques();
  const kpis = useDashboardKPIs();
  const trends = useCOPILTrends(1);
  const meteoProjet = useMeteoProjet();
  const comparaisonAxes = useComparaisonAxes();
  const avancementParAxe = useAvancementParAxe();
  const avancementGlobal = useAvancementGlobal();
  const budgetSynthese = useBudgetSynthese();
  const confidenceScore = useConfidenceScore();
  const currentSite = useCurrentSite();

  // === Notes (localStorage) ===
  const [notes, setNotesState] = useState(() => {
    try {
      return localStorage.getItem(`${LS_KEY_PREFIX}${weekNum}`) ?? '';
    } catch {
      return '';
    }
  });
  const setNotes = useCallback(
    (v: string) => {
      setNotesState(v);
      try {
        localStorage.setItem(`${LS_KEY_PREFIX}${weekNum}`, v);
      } catch {
        // ignore
      }
    },
    [weekNum]
  );

  // === Derived data ===
  const derived = useMemo(() => {
    const isLoading = !allActions || !allJalons || !kpis;
    if (isLoading) {
      return null;
    }

    const projectName = currentSite?.nom ?? kpis.projectName ?? PROJET_CONFIG.nom;
    const openingDate = currentSite?.dateOuverture ?? PROJET_CONFIG.jalonsClés.softOpening;
    const opening = new Date(openingDate);
    const joursRestants = Math.ceil((opening.getTime() - today.getTime()) / 86400000);

    // Meteo level
    const meteo = mapMeteoToLevel(meteoProjet);

    // === Actions en retard ===
    const actionsEnRetard = allActions.filter(
      (a) => a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < todayStr
    );

    // === Weather Summary ===
    const meteoLabel = METEO_CONFIG[meteo]?.label ?? 'Inconnu';
    const nbRetards = actionsEnRetard.length;
    const nbRisques = allRisques.filter(
      (r) => r.status !== 'closed' && r.status !== 'ferme' && (r.score ?? 0) >= 8
    ).length;
    const weatherSummary =
      `Statut projet : ${meteoLabel}. ${nbRetards} action${nbRetards > 1 ? 's' : ''} en retard, ` +
      `${nbRisques} risque${nbRisques > 1 ? 's' : ''} majeur${nbRisques > 1 ? 's' : ''} actif${nbRisques > 1 ? 's' : ''}.`;

    // === Highlights (auto-generated) ===
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

    const highlights: WeeklyHighlight[] = [];

    // Done this week
    const doneThisWeek = allActions.filter(
      (a) =>
        a.statut === 'termine' &&
        a.date_fin_reelle &&
        a.date_fin_reelle >= oneWeekAgoStr
    );
    if (doneThisWeek.length > 0) {
      highlights.push({
        type: 'done',
        text: `${doneThisWeek.length} action${doneThisWeek.length > 1 ? 's' : ''} terminée${doneThisWeek.length > 1 ? 's' : ''} cette semaine`,
      });
      // Top 3 done
      doneThisWeek.slice(0, 3).forEach((a) => {
        highlights.push({ type: 'done', text: a.titre });
      });
    }

    // Retards
    if (nbRetards > 0) {
      highlights.push({
        type: 'alert',
        text: `${nbRetards} action${nbRetards > 1 ? 's' : ''} en retard nécessitant une intervention`,
      });
    }

    // Jalons atteints cette semaine
    const jalonsAtteintsSemaine = allJalons.filter(
      (j) => j.statut === 'atteint' && j.date_reelle && j.date_reelle >= oneWeekAgoStr
    );
    if (jalonsAtteintsSemaine.length > 0) {
      highlights.push({
        type: 'info',
        text: `${jalonsAtteintsSemaine.length} jalon${jalonsAtteintsSemaine.length > 1 ? 's' : ''} atteint${jalonsAtteintsSemaine.length > 1 ? 's' : ''} cette semaine`,
      });
    }

    // === Pending Decisions ===
    const pendingDecisions = allActions.filter(
      (a) =>
        a.decisions_attendues &&
        a.decisions_attendues.length > 0 &&
        a.statut !== 'termine'
    );

    // === Axes Data ===
    const axesData: AxeWeeklyData[] = AXES_V5.map((axeConfig) => {
      const axeCode = axeConfig.dbCode as Axe;
      const axeActions = allActions.filter((a) => a.axe === axeCode);
      const axeJalons = allJalons.filter((j) => j.axe === axeCode);
      const axeRisques = allRisques.filter(
        (r) =>
          r.axe_impacte === axeCode &&
          r.status !== 'closed' &&
          r.status !== 'ferme'
      );

      const avPar = avancementParAxe.find((a) => a.axe === axeCode);
      const actionsTerminees = axeActions.filter((a) => a.statut === 'termine').length;
      const axeActionsEnRetard = axeActions.filter(
        (a) => a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < todayStr
      ).length;

      // Top risque par score
      const topRisque = axeRisques.length > 0
        ? axeRisques.reduce((max, r) => ((r.score ?? 0) > (max.score ?? 0) ? r : max), axeRisques[0])
        : null;

      // Prochain jalon non atteint
      const prochainsJalons = axeJalons
        .filter((j) => j.statut !== 'atteint' && j.date_prevue >= todayStr)
        .sort((a, b) => a.date_prevue.localeCompare(b.date_prevue));
      const prochainJalon = prochainsJalons[0] ?? null;

      return {
        id: axeConfig.id,
        dbCode: axeConfig.dbCode,
        label: axeConfig.label,
        labelCourt: axeConfig.labelCourt,
        color: axeConfig.color,
        avancement: avPar?.avancement ?? 0,
        prevu: avPar?.prevu ?? 0,
        tendance: avPar?.tendance ?? 'stable',
        actionsTotal: axeActions.length,
        actionsTerminees,
        actionsEnRetard: axeActionsEnRetard,
        topRisque,
        prochainJalon,
      };
    });

    // === Prochains Milestones (14 jours) ===
    const in14days = new Date(today);
    in14days.setDate(in14days.getDate() + 14);
    const in14daysStr = in14days.toISOString().split('T')[0];

    const prochainsMilestones: MilestonePreview[] = allJalons
      .filter(
        (j) =>
          j.statut !== 'atteint' &&
          j.date_prevue >= todayStr &&
          j.date_prevue <= in14daysStr
      )
      .sort((a, b) => a.date_prevue.localeCompare(b.date_prevue))
      .map((j) => {
        const jDate = new Date(j.date_prevue);
        const joursRestants = Math.ceil((jDate.getTime() - today.getTime()) / 86400000);
        // Calcul % prérequis : actions liées terminées / total
        const actionsLiees = allActions.filter(
          (a) => a.axe === j.axe && a.jalon_id === j.id
        );
        const prerequisPct =
          actionsLiees.length > 0
            ? (actionsLiees.filter((a) => a.statut === 'termine').length / actionsLiees.length) * 100
            : (j.avancement_prealables ?? 0);
        return { jalon: j, joursRestants, prerequisPct };
      });

    // === Top 5 risques ===
    const risquesActifs = allRisques
      .filter((r) => r.status !== 'closed' && r.status !== 'ferme')
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 5);
    const topRisques: TopRisque[] = risquesActifs.map((r) => ({
      risque: r,
      evolution: 'stable' as const, // no historical data available in snapshot
    }));

    // === Focus semaine prochaine ===
    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(nextWeekStart.getDate() + (8 - nextWeekStart.getDay())); // Next Monday
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 4); // Friday
    const nwStartStr = nextWeekStart.toISOString().split('T')[0];
    const nwEndStr = nextWeekEnd.toISOString().split('T')[0];

    // Actions dont l'échéance tombe la semaine prochaine,
    // + actions critiques/hautes dont l'échéance est dans les 30 prochains jours
    const plus30j = new Date(today);
    plus30j.setDate(plus30j.getDate() + 30);
    const plus30jStr = plus30j.toISOString().split('T')[0];

    const focusSemaineProchaine = allActions
      .filter(
        (a) =>
          a.statut !== 'termine' &&
          a.date_fin_prevue &&
          ((a.date_fin_prevue >= todayStr && a.date_fin_prevue <= nwEndStr) ||
            ((a.priorite === 'critique' || a.priorite === 'haute') &&
              a.date_fin_prevue >= todayStr && a.date_fin_prevue <= plus30jStr))
      )
      .sort((a, b) => {
        const priOrd: Record<string, number> = { critique: 0, haute: 1, moyenne: 2, basse: 3 };
        return (priOrd[a.priorite] ?? 4) - (priOrd[b.priorite] ?? 4);
      })
      .slice(0, 8);

    // === Projection ===
    const projectStart = new Date(PROJET_CONFIG.dateDebut);
    const projectEnd = new Date(openingDate);
    const totalDays = (projectEnd.getTime() - projectStart.getTime()) / 86400000;
    const elapsedDays = Math.max(1, (today.getTime() - projectStart.getTime()) / 86400000);
    const velocite = avancementGlobal / (elapsedDays / totalDays) * 100;
    // Estimated end: if current velocity persists
    const daysNeeded = avancementGlobal > 0 ? (100 / avancementGlobal) * elapsedDays : totalDays * 2;
    const finEstimee = new Date(projectStart.getTime() + daysNeeded * 86400000);
    const retardJours = Math.max(
      0,
      Math.ceil((finEstimee.getTime() - projectEnd.getTime()) / 86400000)
    );

    const projection: WeeklyProjection = {
      velocite: Math.round(velocite * 10) / 10,
      finEstimee: finEstimee.toISOString().split('T')[0],
      cible: openingDate,
      retardJours,
    };

    // === Trend history (ideal vs real) ===
    const projectStartTime = projectStart.getTime();
    const projectEndTime = projectEnd.getTime();
    const currentWeek = getWeekNumber(today);
    const trendHistory: { semaine: number; reel: number; ideal: number }[] = [];
    // Generate from week 1 to current week
    const startWeek = getWeekNumber(projectStart);
    for (let w = startWeek; w <= currentWeek; w++) {
      const weekProgress = ((w - startWeek) / Math.max(1, currentWeek - startWeek));
      const idealProgress = Math.min(100, weekProgress * 100);
      // Real progress approximation: linearly scale current avancement
      const reelProgress = w === currentWeek ? avancementGlobal : avancementGlobal * weekProgress;
      trendHistory.push({
        semaine: w,
        reel: Math.round(reelProgress * 10) / 10,
        ideal: Math.round(idealProgress * 10) / 10,
      });
    }

    return {
      projectName,
      openingDate,
      joursRestants,
      meteo,
      weatherSummary,
      highlights,
      pendingDecisions,
      axesData,
      prochainsMilestones,
      topRisques,
      focusSemaineProchaine,
      projection,
      trendHistory,
    };
  }, [
    allActions,
    allJalons,
    allRisques,
    kpis,
    meteoProjet,
    avancementParAxe,
    avancementGlobal,
    comparaisonAxes,
    budgetSynthese,
    confidenceScore,
    currentSite,
    todayStr,
  ]);

  const isLoading = derived === null;

  return {
    isLoading,
    projectName: derived?.projectName ?? '',
    weekNumber: weekNum,
    periodLabel: formatPeriod(today),
    avancementGlobal,
    kpis,
    trends,
    meteo: derived?.meteo ?? 'vert',
    weatherSummary: derived?.weatherSummary ?? '',
    comparaisonAxes,
    budgetSynthese,
    axesData: derived?.axesData ?? [],
    highlights: derived?.highlights ?? [],
    pendingDecisions: derived?.pendingDecisions ?? [],
    prochainsMilestones: derived?.prochainsMilestones ?? [],
    topRisques: derived?.topRisques ?? [],
    focusSemaineProchaine: derived?.focusSemaineProchaine ?? [],
    projection: derived?.projection ?? { velocite: 0, finEstimee: '', cible: '', retardJours: 0 },
    trendHistory: derived?.trendHistory ?? [],
    confidenceScore,
    notes,
    setNotes,
    allActions: allActions ?? [],
    allJalons: allJalons ?? [],
    allRisques: allRisques ?? [],
    joursRestants: derived?.joursRestants ?? 0,
    openingDate: derived?.openingDate ?? PROJET_CONFIG.jalonsClés.softOpening,
  };
}
