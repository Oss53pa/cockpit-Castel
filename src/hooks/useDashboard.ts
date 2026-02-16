import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { AvancementAxe, MeteoProjet, Axe } from '@/types';
import { PROJET_CONFIG, SEUILS_SYNC_REPORT, AXES_CONFIG_FULL, SEUILS_METEO_DASHBOARD, SEUILS_METEO_AXE_DASHBOARD } from '@/data/constants';

// ============================================================================
// TYPES POUR TENDANCES
// ============================================================================

export type TrendDirection = 'up' | 'down' | 'stable';

export interface TrendData {
  direction: TrendDirection;
  variation: number; // Variation en %
  previousValue: number;
  currentValue: number;
}

export interface COPILTrends {
  avancementProjet: TrendData;
  avancementMobilisation: TrendData;
  budget: TrendData;
  risques: TrendData;
  jalons: TrendData;
  alertes: TrendData;
}

export function useDashboardKPIs() {
  return useLiveQuery(async () => {
    const [project, users, actions, jalons, budget, sites, risques] = await Promise.all([
      db.project.toArray(),
      db.users.toArray(),
      db.actions.toArray(),
      db.jalons.toArray(),
      db.budget.toArray(),
      db.sites.filter(s => !!s.actif).toArray(),
      db.risques.toArray(),
    ]);

    const projectData = project[0];
    const siteData = sites[0];

    // Exclure les parents qui ont des enfants pour éviter le double-comptage
    const parentIdsWithChildren = new Set<number>();
    budget.forEach(b => { if (b.parentId) parentIdsWithChildren.add(b.parentId); });
    const leafBudget = budget.filter(b => !(b.id && parentIdsWithChildren.has(b.id)));
    const budgetTotal = leafBudget.reduce((sum, b) => sum + b.montantPrevu, 0);
    const budgetConsomme = leafBudget.reduce((sum, b) => sum + b.montantRealise, 0);

    // Taux d'occupation = avancement des actions commerciales liées à l'occupation
    // Cherche par ID exact, puis par titre, puis moyenne axe commercial
    const actionOccupation = actions.find((a) =>
      a.id_action === 'A-COM-J8.6' ||
      a.id_action === 'A-COM-8.6' ||
      (a.titre?.toLowerCase().includes('taux') && a.titre?.toLowerCase().includes('occupation'))
    );
    let tauxOccupation: number;
    if (actionOccupation) {
      tauxOccupation = actionOccupation.avancement ?? 0;
    } else {
      // Fallback: moyenne d'avancement des actions commerciales de leasing/occupation
      const actionsLeasing = actions.filter((a) =>
        a.axe === 'axe2_commercial' &&
        (a.titre?.toLowerCase().includes('bail') ||
         a.titre?.toLowerCase().includes('locataire') ||
         a.titre?.toLowerCase().includes('leasing') ||
         a.titre?.toLowerCase().includes('occupation'))
      );
      tauxOccupation = actionsLeasing.length > 0
        ? actionsLeasing.reduce((sum, a) => sum + a.avancement, 0) / actionsLeasing.length
        : 0;
    }

    const jalonsAtteints = jalons.filter((j) => j.statut === 'atteint').length;
    const actionsTerminees = actions.filter((a) => a.statut === 'termine').length;

    // Get project name from site first, then fallback to project table
    const projectName = siteData?.nom ?? projectData?.name ?? '';

    return {
      tauxOccupation,
      budgetConsomme,
      budgetTotal,
      jalonsAtteints,
      jalonsTotal: jalons.length,
      actionsTerminees,
      equipeTaille: users.length,
      projectName,
      totalActions: actions.length,
      totalJalons: jalons.length,
      totalRisques: risques.filter(r => r.status !== 'closed' && r.status !== 'ferme').length,
    };
  }) ?? {
    tauxOccupation: 0,
    budgetConsomme: 0,
    budgetTotal: 0,
    jalonsAtteints: 0,
    jalonsTotal: 0,
    actionsTerminees: 0,
    equipeTaille: 0,
    projectName: '',
    totalActions: 0,
    totalJalons: 0,
    totalRisques: 0,
  };
}

export function useAvancementParAxe(): AvancementAxe[] {
  const data = useLiveQuery(async () => {
    const [actions, sites] = await Promise.all([
      db.actions.toArray(),
      db.sites.filter(s => !!s.actif).toArray(),
    ]);

    // Dates du projet depuis la configuration centralisée
    const projectStart = new Date(PROJET_CONFIG.dateDebut);
    const projectEnd = new Date(PROJET_CONFIG.dateFin);

    const axes: Axe[] = Object.values(AXES_CONFIG_FULL).map(a => a.code) as Axe[];

    return axes.map((axe) => {
      const axeActions = actions.filter((a) => a.axe === axe);
      const actionsTerminees = axeActions.filter(
        (a) => a.statut === 'termine'
      ).length;
      const avancement =
        axeActions.length > 0
          ? axeActions.reduce((sum, a) => sum + a.avancement, 0) /
            axeActions.length
          : 0;

      // Calculate trend (simplified: compare to target progress)
      const today = new Date();
      const totalDays =
        (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
      const elapsedDays =
        (today.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
      const expectedProgress = totalDays > 0
        ? Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100))
        : (today >= projectEnd ? 100 : 0);

      let tendance: 'up' | 'down' | 'stable' = 'stable';
      if (avancement > expectedProgress + 5) tendance = 'up';
      else if (avancement < expectedProgress - 5) tendance = 'down';

      return {
        axe,
        avancement,
        prevu: Math.min(expectedProgress, 100),
        tendance,
        actionsTotal: axeActions.length,
        actionsTerminees,
      };
    });
  });

  return data ?? [];
}

/**
 * Calcule la météo d'un axe basée sur l'écart entre avancement réel et prévu
 * Seuils unifiés : soleil >= -5%, nuageux >= -15%, orageux < -15%
 */
function calculateAxeMeteo(avancement: number, prevu: number): 'SOLEIL' | 'NUAGEUX' | 'ORAGEUX' {
  const ecart = avancement - prevu;
  if (ecart >= SEUILS_METEO_AXE_DASHBOARD.soleil) return 'SOLEIL';  // >= -5%
  if (ecart >= SEUILS_METEO_AXE_DASHBOARD.nuageux) return 'NUAGEUX'; // >= -15%
  return 'ORAGEUX'; // < -15%
}

/**
 * Météo Projet dérivée des météos par axe + surcharge alertes critiques
 *
 * Règle de dérivation :
 * - Si >= 50% des axes sont ORAGEUX → Global = ROUGE
 * - Si >= 1 axe ORAGEUX ou >= 50% NUAGEUX → Global = ORANGE
 * - Sinon → Global = VERT
 *
 * Surcharge alertes : si alertes critiques >= seuil → ROUGE forcé
 */
export function useMeteoProjet(): MeteoProjet {
  const data = useLiveQuery(async () => {
    const [alertes, actions, sites] = await Promise.all([
      db.alertes.toArray(),
      db.actions.toArray(),
      db.sites.filter(s => !!s.actif).toArray(),
    ]);

    // === 1. Calculer la météo par axe ===
    const projectStart = new Date(PROJET_CONFIG.dateDebut);
    const projectEnd = new Date(PROJET_CONFIG.dateFin);
    const today = new Date();
    const totalDays = (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (today.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
    const expectedProgress = totalDays > 0
      ? Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100))
      : (today >= projectEnd ? 100 : 0);

    const axes: Axe[] = Object.values(AXES_CONFIG_FULL).map(a => a.code) as Axe[];
    const axeMeteos: Array<'SOLEIL' | 'NUAGEUX' | 'ORAGEUX'> = [];

    for (const axe of axes) {
      const axeActions = actions.filter((a) => a.axe === axe);
      if (axeActions.length === 0) {
        // Axe sans actions = NUAGEUX par défaut (pas de données)
        axeMeteos.push('NUAGEUX');
        continue;
      }
      const avancement = axeActions.reduce((sum, a) => sum + a.avancement, 0) / axeActions.length;
      axeMeteos.push(calculateAxeMeteo(avancement, expectedProgress));
    }

    // === 2. Dériver la météo globale des axes ===
    const totalAxes = axeMeteos.length;
    const orageuxCount = axeMeteos.filter(m => m === 'ORAGEUX').length;
    const nuageuxCount = axeMeteos.filter(m => m === 'NUAGEUX').length;

    let meteoFromAxes: MeteoProjet;
    if (orageuxCount >= totalAxes * 0.5) {
      // >= 50% des axes sont ORAGEUX → ROUGE
      meteoFromAxes = 'rouge';
    } else if (orageuxCount >= 1 || nuageuxCount >= totalAxes * 0.5) {
      // >= 1 axe ORAGEUX ou >= 50% NUAGEUX → ORANGE (utilisé comme 'jaune')
      meteoFromAxes = 'jaune';
    } else {
      meteoFromAxes = 'vert';
    }

    // === 3. Surcharge par les alertes critiques ===
    const alertesNonTraitees = alertes.filter((a) => !a.traitee);
    const alertesCritiques = alertesNonTraitees.filter((a) => a.criticite === 'critical').length;
    const alertesHautes = alertesNonTraitees.filter((a) => a.criticite === 'high').length;

    // Check for late actions
    const todayStr = today.toISOString().split('T')[0];
    const actionsEnRetard = actions.filter(
      (a) => a.statut !== 'termine' && a.date_fin_prevue < todayStr
    ).length;

    // Si alertes critiques dépassent le seuil → forcer ROUGE
    if (alertesCritiques >= SEUILS_METEO_DASHBOARD.rouge.alertesCritiques ||
        actionsEnRetard >= SEUILS_METEO_DASHBOARD.rouge.actionsEnRetard) {
      return 'rouge' as MeteoProjet;
    }

    // Si alertes élevées dépassent le seuil → forcer au moins JAUNE
    if (meteoFromAxes === 'vert' && (
        alertesCritiques >= SEUILS_METEO_DASHBOARD.jaune.alertesCritiques ||
        alertesHautes >= SEUILS_METEO_DASHBOARD.jaune.alertesHautes ||
        actionsEnRetard >= SEUILS_METEO_DASHBOARD.jaune.actionsEnRetard)) {
      return 'jaune' as MeteoProjet;
    }

    return meteoFromAxes;
  });

  return data ?? 'vert';
}

export function useAvancementGlobal(): number {
  const data = useLiveQuery(async () => {
    const actions = await db.actions.toArray();
    if (actions.length === 0) return 0;

    // Avancement pondéré par le poids de chaque axe (AXES_CONFIG_FULL)
    const axeWeightMap: Record<string, number> = {};
    Object.values(AXES_CONFIG_FULL).forEach(a => { axeWeightMap[a.code] = a.poids; });

    // Calculer l'avancement moyen par axe
    const axeAvancements: { axe: string; avancement: number; poids: number }[] = [];
    const axes = [...new Set(actions.map(a => a.axe))];

    for (const axe of axes) {
      const axeActions = actions.filter(a => a.axe === axe);
      const avg = axeActions.reduce((sum, a) => sum + a.avancement, 0) / axeActions.length;
      const poids = axeWeightMap[axe] ?? 0;
      axeAvancements.push({ axe, avancement: avg, poids });
    }

    const totalPoids = axeAvancements.reduce((sum, a) => sum + a.poids, 0);
    if (totalPoids === 0) {
      // Fallback: moyenne simple si aucun poids configuré
      return actions.reduce((sum, a) => sum + a.avancement, 0) / actions.length;
    }

    return axeAvancements.reduce((sum, a) => sum + a.avancement * (a.poids / totalPoids), 0);
  });

  return data ?? 0;
}

export function useActionsStats() {
  return useLiveQuery(async () => {
    const actions = await db.actions.toArray();

    return {
      total: actions.length,
      aFaire: actions.filter((a) => a.statut === 'a_faire').length,
      enCours: actions.filter((a) => a.statut === 'en_cours').length,
      termine: actions.filter((a) => a.statut === 'termine').length,
      bloque: actions.filter((a) => a.statut === 'bloque').length,
    };
  }) ?? {
    total: 0,
    aFaire: 0,
    enCours: 0,
    termine: 0,
    bloque: 0,
  };
}

/**
 * Hook pour comparer l'avancement entre Construction (AXE 7) et Mobilisation (5 axes)
 * Construction = axe7_construction (anciennement axe3_technique)
 * Mobilisation = axe1_rh, axe2_commercial, axe4_budget, axe5_marketing, axe6_exploitation
 */
export function useComparaisonAxes() {
  return useLiveQuery(async () => {
    const actions = await db.actions.toArray();

    // Construction (AXE 7)
    const actionsConstruction = actions.filter((a) => a.axe === 'axe7_construction');
    const avancementConstruction =
      actionsConstruction.length > 0
        ? actionsConstruction.reduce((sum, a) => sum + a.avancement, 0) / actionsConstruction.length
        : 0;
    const actionsConstructionTerminees = actionsConstruction.filter(
      (a) => a.statut === 'termine'
    ).length;

    // Mobilisation (5 axes hors construction, technique et divers)
    const axesMobilisation: Axe[] = ['axe1_rh', 'axe2_commercial', 'axe4_budget', 'axe5_marketing', 'axe6_exploitation'];
    const actionsMobilisation = actions.filter((a) => axesMobilisation.includes(a.axe));
    const avancementMobilisation =
      actionsMobilisation.length > 0
        ? actionsMobilisation.reduce((sum, a) => sum + a.avancement, 0) / actionsMobilisation.length
        : 0;
    const actionsMobilisationTerminees = actionsMobilisation.filter(
      (a) => a.statut === 'termine'
    ).length;

    // Calcul de l'écart (mobilisation - construction)
    const ecart = avancementMobilisation - avancementConstruction;

    return {
      commercial: {
        label: 'Mobilisation (5 axes)',
        avancement: Math.round(avancementMobilisation * 10) / 10,
        actionsTotal: actionsMobilisation.length,
        actionsTerminees: actionsMobilisationTerminees,
      },
      technique: {
        label: 'AXE 7 - Construction',
        avancement: Math.round(avancementConstruction * 10) / 10,
        actionsTotal: actionsConstruction.length,
        actionsTerminees: actionsConstructionTerminees,
      },
      ecart: Math.round(ecart * 10) / 10,
      estSynchronise: Math.abs(ecart) <= SEUILS_SYNC_REPORT.synchronise,
    };
  }) ?? {
    commercial: { label: 'Mobilisation (5 axes)', avancement: 0, actionsTotal: 0, actionsTerminees: 0 },
    technique: { label: 'AXE 7 - Construction', avancement: 0, actionsTotal: 0, actionsTerminees: 0 },
    ecart: 0,
    estSynchronise: true,
  };
}

// ============================================================================
// HOOK TENDANCES COPIL
// ============================================================================

/**
 * Calculate trend direction and variation
 */
function calculateTrend(current: number, previous: number, threshold: number = 2): TrendData {
  const variation = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  let direction: TrendDirection = 'stable';

  if (Math.abs(variation) > threshold) {
    direction = variation > 0 ? 'up' : 'down';
  }

  return {
    direction,
    variation: Math.round(variation * 10) / 10,
    previousValue: previous,
    currentValue: current,
  };
}

/**
 * Hook to calculate trends for COPIL dashboard metrics
 * Compares current data with snapshots from the previous week/month
 */
export function useCOPILTrends(siteId: number = 1): COPILTrends | null {
  return useLiveQuery(async () => {
    try {
      // Get snapshots for comparison (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0]; // Format YYYY-MM-DD

      // Get all snapshots and filter manually (safer than relying on index)
      const allSnapshots = await db.syncSnapshots.toArray();
      const previousSnapshots = allSnapshots
        .filter(s => s.snapshotDate && s.snapshotDate < oneWeekAgoStr)
        .sort((a, b) => (b.snapshotDate || '').localeCompare(a.snapshotDate || ''));

      const previousSnapshot = previousSnapshots[0];

      // Current data
      const [actions, jalons, risques, alertes, budget] = await Promise.all([
        db.actions.where('siteId').equals(siteId).toArray(),
        db.jalons.where('siteId').equals(siteId).toArray(),
        db.risques.where('siteId').equals(siteId).toArray(),
        db.alertes.toArray(),
        db.budget.where('siteId').equals(siteId).toArray(),
      ]);

      // Calculate current metrics
      const techniqueActions = actions.filter(a => a.axe === 'axe3_technique');
      const currentAvancementProjet = techniqueActions.length > 0
        ? techniqueActions.reduce((sum, a) => sum + (a.avancement || 0), 0) / techniqueActions.length
        : 0;

      const commercialActions = actions.filter(a => a.axe === 'axe2_commercial');
      const currentAvancementMobilisation = commercialActions.length > 0
        ? commercialActions.reduce((sum, a) => sum + (a.avancement || 0), 0) / commercialActions.length
        : 0;

      const budgetPrevu = budget.reduce((sum, b) => sum + (b.montantPrevu || 0), 0);
      const budgetRealise = budget.reduce((sum, b) => sum + (b.montantRealise || 0), 0);
      const currentBudgetRatio = budgetPrevu > 0 ? (budgetRealise / budgetPrevu) * 100 : 0;

      const currentRisquesCritiques = risques.filter(r => (r.score ?? 0) >= 12 && r.status !== 'closed' && r.status !== 'ferme').length;

      const currentJalonsAtteints = jalons.filter(j => j.statut === 'atteint').length;
      const currentJalonsRatio = jalons.length > 0 ? (currentJalonsAtteints / jalons.length) * 100 : 0;

      const currentAlertesNonTraitees = alertes.filter(a => !a.traitee).length;

      // Previous values (from snapshot or estimate based on typical weekly progress)
      let prevAvancementProjet = Math.max(0, currentAvancementProjet - 2); // Assume ~2% weekly progress
      let prevAvancementMobilisation = Math.max(0, currentAvancementMobilisation - 2);
      const prevBudgetRatio = Math.max(0, currentBudgetRatio - 3);
      const prevRisquesCritiques = currentRisquesCritiques;
      const prevJalonsRatio = Math.max(0, currentJalonsRatio - 2);
      const prevAlertesNonTraitees = currentAlertesNonTraitees;

      if (previousSnapshot) {
        prevAvancementProjet = previousSnapshot.projectProgress ?? prevAvancementProjet;
        prevAvancementMobilisation = previousSnapshot.mobilizationProgress ?? prevAvancementMobilisation;
      }

      return {
        avancementProjet: calculateTrend(currentAvancementProjet, prevAvancementProjet),
        avancementMobilisation: calculateTrend(currentAvancementMobilisation, prevAvancementMobilisation),
        budget: calculateTrend(currentBudgetRatio, prevBudgetRatio, 5), // 5% threshold for budget
        risques: calculateTrend(currentRisquesCritiques, prevRisquesCritiques, 0), // Any change matters for risks
        jalons: calculateTrend(currentJalonsRatio, prevJalonsRatio),
        alertes: calculateTrend(currentAlertesNonTraitees, prevAlertesNonTraitees, 0),
      };
    } catch (error) {
      // Return default stable trends if there's an error
      const defaultTrend: TrendData = {
        direction: 'stable',
        variation: 0,
        previousValue: 0,
        currentValue: 0,
      };
      return {
        avancementProjet: defaultTrend,
        avancementMobilisation: defaultTrend,
        budget: defaultTrend,
        risques: defaultTrend,
        jalons: defaultTrend,
        alertes: defaultTrend,
      };
    }
  }, [siteId]) ?? null;
}
