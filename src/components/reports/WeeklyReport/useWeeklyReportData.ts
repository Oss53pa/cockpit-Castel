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
import { PROJET_CONFIG, DATE_REFERENCE_OUVERTURE } from '@/data/constants';
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

export interface ActionsByGroup {
  label: string;
  actions: Action[];
}

export interface WeeklyProjection {
  ratioProgression: number;
  finEstimee: string | null;
  cible: string;
  retardJours: number;
  projectionDisponible: boolean;
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
  // Vues groupées
  actionsByEcheance: ActionsByGroup[];
  actionsByPriorite: ActionsByGroup[];
  actionsByResponsable: ActionsByGroup[];
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
      (r) => r.status !== 'closed' && r.status !== 'ferme' && (r.score ?? 0) >= 10
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
    const nwEndStr = nextWeekEnd.toISOString().split('T')[0];

    // Actions : retards (prioritaires) + échéances semaine prochaine + critiques/hautes à 30j
    const plus30j = new Date(today);
    plus30j.setDate(plus30j.getDate() + 30);
    const plus30jStr = plus30j.toISOString().split('T')[0];

    const focusSemaineProchaine = allActions
      .filter(
        (a) =>
          a.statut !== 'termine' &&
          a.statut !== 'annule' &&
          a.date_fin_prevue &&
          (
            // Actions en retard (date dépassée)
            a.date_fin_prevue < todayStr ||
            // Actions dont l'échéance tombe cette semaine ou la prochaine
            (a.date_fin_prevue >= todayStr && a.date_fin_prevue <= nwEndStr) ||
            // Actions critiques/hautes dans les 30 prochains jours
            ((a.priorite === 'critique' || a.priorite === 'haute') &&
              a.date_fin_prevue >= todayStr && a.date_fin_prevue <= plus30jStr)
          )
      )
      .sort((a, b) => {
        // Trier : retards d'abord, puis par priorité, puis par date
        const aRetard = a.date_fin_prevue < todayStr ? 0 : 1;
        const bRetard = b.date_fin_prevue < todayStr ? 0 : 1;
        if (aRetard !== bRetard) return aRetard - bRetard;
        const priOrd: Record<string, number> = { critique: 0, haute: 1, moyenne: 2, basse: 3 };
        const priDiff = (priOrd[a.priorite] ?? 4) - (priOrd[b.priorite] ?? 4);
        if (priDiff !== 0) return priDiff;
        return a.date_fin_prevue.localeCompare(b.date_fin_prevue);
      })
      .slice(0, 10);

    // === Projection ===
    const projectStart = new Date(PROJET_CONFIG.dateDebut);
    const projectEnd = new Date(openingDate);
    const totalDays = (projectEnd.getTime() - projectStart.getTime()) / 86400000;
    const elapsedDays = Math.max(1, (today.getTime() - projectStart.getTime()) / 86400000);
    const progressRatio = totalDays > 0 ? elapsedDays / totalDays : 0;
    const expectedProgress = progressRatio * 100;

    // Ratio de progression = avancement réel / avancement théorique (en %)
    const ratioProgression = expectedProgress > 0
      ? Math.round((avancementGlobal / expectedProgress) * 100 * 10) / 10
      : 0;

    // Garde-fou : projection fiable seulement si assez de données
    const projectionDisponible = progressRatio >= 0.15 && avancementGlobal >= 3;

    let finEstimee: string | null = null;
    let retardJours = 0;

    if (projectionDisponible && avancementGlobal > 0) {
      const daysNeeded = (100 / avancementGlobal) * elapsedDays;
      const finEstimeeDate = new Date(projectStart.getTime() + daysNeeded * 86400000);
      finEstimee = finEstimeeDate.toISOString().split('T')[0];
      retardJours = Math.max(
        0,
        Math.ceil((finEstimeeDate.getTime() - projectEnd.getTime()) / 86400000)
      );
    }

    const projection: WeeklyProjection = {
      ratioProgression,
      finEstimee,
      cible: openingDate,
      retardJours,
      projectionDisponible,
    };

    // === Trend history (ideal vs real) ===
    // Génère une courbe interpolée depuis le début du projet jusqu'à la semaine courante
    // pour que le graphique ait au moins 2 points et puisse s'afficher.
    const currentWeek = getWeekNumber(today);
    const projectStartWeek = getWeekNumber(projectStart);
    const weeksElapsed = Math.max(1, Math.round(elapsedDays / 7));
    const trendHistory: { semaine: number; reel: number; ideal: number }[] = [];

    // Générer des points depuis le début du projet (interpolation linéaire pour le réel)
    const numPoints = Math.min(weeksElapsed, 12); // max 12 points pour lisibilité
    for (let i = 0; i <= numPoints; i++) {
      const fraction = numPoints > 0 ? i / numPoints : 1;
      const weekNum = Math.round(projectStartWeek + fraction * (currentWeek - projectStartWeek));
      const idealAtPoint = Math.round(fraction * (totalDays > 0 ? (elapsedDays * fraction) / totalDays * 100 : 0) * 10) / 10;
      // Interpolation du réel : le seul point fiable est le point final (avancementGlobal)
      const reelAtPoint = Math.round(avancementGlobal * fraction * 10) / 10;

      trendHistory.push({
        semaine: weekNum,
        reel: i === numPoints ? Math.round(avancementGlobal * 10) / 10 : reelAtPoint,
        ideal: i === numPoints ? Math.round(expectedProgress * 10) / 10 : Math.round(expectedProgress * fraction * 10) / 10,
      });
    }

    // === Actions groupées (non terminées, non annulées) ===
    const actionsActives = allActions.filter(
      (a) => a.statut !== 'termine' && a.statut !== 'annule'
    );

    // --- Par échéance ---
    const echeanceGroups: Record<string, Action[]> = {};
    const echeanceOrder: string[] = [];
    for (const a of actionsActives) {
      const deadline = a.date_fin_prevue;
      let groupLabel: string;
      if (!deadline) {
        groupLabel = 'Sans échéance';
      } else if (deadline < todayStr) {
        groupLabel = 'En retard';
      } else {
        // Semaine de l'échéance
        const d = new Date(deadline);
        const wk = getWeekNumber(d);
        groupLabel = `S${wk} — ${deadline.split('-').reverse().join('/')}`;
      }
      if (!echeanceGroups[groupLabel]) {
        echeanceGroups[groupLabel] = [];
        echeanceOrder.push(groupLabel);
      }
      echeanceGroups[groupLabel].push(a);
    }
    // Trier : "En retard" en premier, puis par date, "Sans échéance" en dernier
    echeanceOrder.sort((a, b) => {
      if (a === 'En retard') return -1;
      if (b === 'En retard') return 1;
      if (a === 'Sans échéance') return 1;
      if (b === 'Sans échéance') return -1;
      return a.localeCompare(b);
    });
    const actionsByEcheance: ActionsByGroup[] = echeanceOrder.map((label) => ({
      label,
      actions: echeanceGroups[label].sort((a, b) =>
        (a.date_fin_prevue ?? '').localeCompare(b.date_fin_prevue ?? '')
      ),
    }));

    // --- Par priorité ---
    const prioLabels: Record<string, string> = {
      critique: 'Critique',
      haute: 'Haute',
      moyenne: 'Moyenne',
      basse: 'Basse',
    };
    const prioOrder = ['critique', 'haute', 'moyenne', 'basse'];
    const actionsByPriorite: ActionsByGroup[] = prioOrder
      .map((p) => ({
        label: prioLabels[p] ?? p,
        actions: actionsActives
          .filter((a) => (a.priorite ?? 'moyenne') === p)
          .sort((a, b) => (a.date_fin_prevue ?? '').localeCompare(b.date_fin_prevue ?? '')),
      }))
      .filter((g) => g.actions.length > 0);

    // --- Par responsable ---
    const respGroups: Record<string, Action[]> = {};
    const respOrder: string[] = [];
    for (const a of actionsActives) {
      const resp = a.responsable || 'Non assigné';
      if (!respGroups[resp]) {
        respGroups[resp] = [];
        respOrder.push(resp);
      }
      respGroups[resp].push(a);
    }
    respOrder.sort((a, b) => {
      if (a === 'Non assigné') return 1;
      if (b === 'Non assigné') return -1;
      return a.localeCompare(b);
    });
    const actionsByResponsable: ActionsByGroup[] = respOrder.map((label) => ({
      label,
      actions: respGroups[label].sort((a, b) =>
        (a.date_fin_prevue ?? '').localeCompare(b.date_fin_prevue ?? '')
      ),
    }));

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
      actionsByEcheance,
      actionsByPriorite,
      actionsByResponsable,
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
    actionsByEcheance: derived?.actionsByEcheance ?? [],
    actionsByPriorite: derived?.actionsByPriorite ?? [],
    actionsByResponsable: derived?.actionsByResponsable ?? [],
    projection: derived?.projection ?? { ratioProgression: 0, finEstimee: null, cible: '', retardJours: 0, projectionDisponible: false },
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
