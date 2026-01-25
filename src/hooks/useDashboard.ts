import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { AvancementAxe, MeteoProjet, Axe } from '@/types';

export function useDashboardKPIs() {
  return useLiveQuery(async () => {
    const [project, users, actions, jalons, budget] = await Promise.all([
      db.project.toArray(),
      db.users.toArray(),
      db.actions.toArray(),
      db.jalons.toArray(),
      db.budget.toArray(),
    ]);

    const projectData = project[0];
    const budgetTotal = budget.reduce((sum, b) => sum + b.montantPrevu, 0);
    const budgetConsomme = budget.reduce((sum, b) => sum + b.montantRealise, 0);

    // Calculate occupation rate (example: based on commercial actions progress)
    const commercialActions = actions.filter((a) => a.axe === 'axe2_commercial');
    const tauxOccupation =
      commercialActions.length > 0
        ? commercialActions.reduce((sum, a) => sum + a.avancement, 0) /
          commercialActions.length
        : 0;

    const jalonsAtteints = jalons.filter((j) => j.statut === 'atteint').length;

    return {
      tauxOccupation,
      budgetConsomme,
      budgetTotal,
      jalonsAtteints,
      jalonsTotal: jalons.length,
      equipeTaille: users.length,
      projectName: projectData?.name ?? 'COSMOS ANGRÉ',
    };
  }) ?? {
    tauxOccupation: 0,
    budgetConsomme: 0,
    budgetTotal: 0,
    jalonsAtteints: 0,
    jalonsTotal: 0,
    equipeTaille: 0,
    projectName: 'COSMOS ANGRÉ',
  };
}

export function useAvancementParAxe(): AvancementAxe[] {
  const data = useLiveQuery(async () => {
    const actions = await db.actions.toArray();
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
      const projectStart = new Date('2024-01-01');
      const projectEnd = new Date('2026-11-30');
      const totalDays =
        (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
      const elapsedDays =
        (today.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
      const expectedProgress = (elapsedDays / totalDays) * 100;

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
