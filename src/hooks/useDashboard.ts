import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { AvancementAxe, MeteoProjet, Axe } from '@/types';

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
    const budgetTotal = budget.reduce((sum, b) => sum + b.montantPrevu, 0);
    const budgetConsomme = budget.reduce((sum, b) => sum + b.montantRealise, 0);

    // Taux d'occupation = avancement de l'action de suivi du taux d'occupation
    // Cherche par ID exact ou par titre contenant "taux" et "occupation"
    const actionOccupation = actions.find((a) =>
      a.id_action === 'A-COM-J8.6' ||
      a.id_action === 'A-COM-8.6' ||
      (a.titre?.toLowerCase().includes('taux') && a.titre?.toLowerCase().includes('occupation'))
    );
    const tauxOccupation = actionOccupation?.avancement ?? 0;

    const jalonsAtteints = jalons.filter((j) => j.statut === 'atteint').length;

    // Get project name from site first, then fallback to project table
    const projectName = siteData?.nom ?? projectData?.name ?? '';

    return {
      tauxOccupation,
      budgetConsomme,
      budgetTotal,
      jalonsAtteints,
      jalonsTotal: jalons.length,
      equipeTaille: users.length,
      projectName,
      totalActions: actions.length,
      totalJalons: jalons.length,
      totalRisques: risques.filter(r => r.status !== 'closed').length,
    };
  }) ?? {
    tauxOccupation: 0,
    budgetConsomme: 0,
    budgetTotal: 0,
    jalonsAtteints: 0,
    jalonsTotal: 0,
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

    // Get project dates from site configuration
    const site = sites[0];
    const dateOuverture = site?.dateOuverture || '2026-11-15';
    // Estimate project start as 2.5 years before opening
    const projectEnd = new Date(dateOuverture);
    projectEnd.setMonth(projectEnd.getMonth() + 1); // Buffer of 1 month after soft opening
    const projectStart = new Date(projectEnd);
    projectStart.setFullYear(projectStart.getFullYear() - 3); // 3 years project duration

    const axes: Axe[] = [
      'axe1_rh',
      'axe2_commercial',
      'axe3_technique',
      'axe4_budget',
      'axe5_marketing',
      'axe6_exploitation',
    ];

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
      const expectedProgress = Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100));

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

export function useMeteoProjet(): MeteoProjet {
  const data = useLiveQuery(async () => {
    const alertes = await db.alertes.toArray();
    const alertesNonTraitees = alertes.filter((a) => !a.traitee);

    const alertesCritiques = alertesNonTraitees.filter(
      (a) => a.criticite === 'critical'
    ).length;
    const alertesHautes = alertesNonTraitees.filter(
      (a) => a.criticite === 'high'
    ).length;

    // Check for late actions
    const today = new Date().toISOString().split('T')[0];
    const actions = await db.actions.toArray();
    const actionsEnRetard = actions.filter(
      (a) => a.statut !== 'termine' && a.date_fin_prevue < today
    ).length;

    // Calculate meteo
    if (alertesCritiques >= 3 || actionsEnRetard >= 5) {
      return 'rouge' as MeteoProjet;
    }
    if (alertesCritiques >= 1 || alertesHautes >= 3 || actionsEnRetard >= 2) {
      return 'jaune' as MeteoProjet;
    }
    return 'vert' as MeteoProjet;
  });

  return data ?? 'vert';
}

export function useAvancementGlobal(): number {
  const data = useLiveQuery(async () => {
    const actions = await db.actions.toArray();
    if (actions.length === 0) return 0;

    const totalAvancement = actions.reduce((sum, a) => sum + a.avancement, 0);
    return totalAvancement / actions.length;
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
 * Hook pour comparer l'avancement entre AXE 2 (Commercial) et AXE 3 (Technique)
 */
export function useComparaisonAxes() {
  return useLiveQuery(async () => {
    const actions = await db.actions.toArray();

    // AXE 2 - Commercial (Mobilisation)
    const actionsCommercial = actions.filter((a) => a.axe === 'axe2_commercial');
    const avancementCommercial =
      actionsCommercial.length > 0
        ? actionsCommercial.reduce((sum, a) => sum + a.avancement, 0) / actionsCommercial.length
        : 0;
    const actionsCommercialTerminees = actionsCommercial.filter(
      (a) => a.statut === 'termine'
    ).length;

    // AXE 3 - Technique (Chantier)
    const actionsTechnique = actions.filter((a) => a.axe === 'axe3_technique');
    const avancementTechnique =
      actionsTechnique.length > 0
        ? actionsTechnique.reduce((sum, a) => sum + a.avancement, 0) / actionsTechnique.length
        : 0;
    const actionsTechniqueTerminees = actionsTechnique.filter(
      (a) => a.statut === 'termine'
    ).length;

    // Calcul de l'écart
    const ecart = avancementCommercial - avancementTechnique;

    return {
      commercial: {
        label: 'AXE 2 - Commercial',
        avancement: Math.round(avancementCommercial * 10) / 10,
        actionsTotal: actionsCommercial.length,
        actionsTerminees: actionsCommercialTerminees,
      },
      technique: {
        label: 'AXE 3 - Technique',
        avancement: Math.round(avancementTechnique * 10) / 10,
        actionsTotal: actionsTechnique.length,
        actionsTerminees: actionsTechniqueTerminees,
      },
      ecart: Math.round(ecart * 10) / 10,
      estSynchronise: Math.abs(ecart) <= 10,
    };
  }) ?? {
    commercial: { label: 'AXE 2 - Commercial', avancement: 0, actionsTotal: 0, actionsTerminees: 0 },
    technique: { label: 'AXE 3 - Technique', avancement: 0, actionsTotal: 0, actionsTerminees: 0 },
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

      const currentRisquesCritiques = risques.filter(r => r.score >= 12 && r.status !== 'closed').length;

      const currentJalonsAtteints = jalons.filter(j => j.statut === 'atteint').length;
      const currentJalonsRatio = jalons.length > 0 ? (currentJalonsAtteints / jalons.length) * 100 : 0;

      const currentAlertesNonTraitees = alertes.filter(a => !a.traitee).length;

      // Previous values (from snapshot or estimate based on typical weekly progress)
      let prevAvancementProjet = Math.max(0, currentAvancementProjet - 2); // Assume ~2% weekly progress
      let prevAvancementMobilisation = Math.max(0, currentAvancementMobilisation - 2);
      let prevBudgetRatio = Math.max(0, currentBudgetRatio - 3);
      let prevRisquesCritiques = currentRisquesCritiques;
      let prevJalonsRatio = Math.max(0, currentJalonsRatio - 2);
      let prevAlertesNonTraitees = currentAlertesNonTraitees;

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
