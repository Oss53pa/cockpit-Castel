import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { Alerte, AlerteFilters, AlerteType, Criticite } from '@/types';
import { getDaysUntil } from '@/lib/utils';

export function useAlertes(filters?: AlerteFilters) {
  const alertes = useLiveQuery(async () => {
    let results = await db.alertes.toArray();

    if (filters?.type) {
      results = results.filter((a) => a.type === filters.type);
    }
    if (filters?.criticite) {
      results = results.filter((a) => a.criticite === filters.criticite);
    }
    if (filters?.lu !== undefined) {
      results = results.filter((a) => a.lu === filters.lu);
    }
    if (filters?.traitee !== undefined) {
      results = results.filter((a) => a.traitee === filters.traitee);
    }

    // Sort by date, most recent first
    results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return results;
  }, [filters]);

  return alertes ?? [];
}

export function useAlertesNonLues() {
  return useLiveQuery(async () => {
    return db.alertes.where('lu').equals(0).count();
  }) ?? 0;
}

export function useAlertesRecentes(limit = 5) {
  return useLiveQuery(async () => {
    const alertes = await db.alertes.toArray();

    return alertes
      .filter((a) => !a.traitee)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);
  }, [limit]) ?? [];
}

export function useAlertesCritiques() {
  return useLiveQuery(async () => {
    const alertes = await db.alertes.toArray();
    return alertes.filter(
      (a) => a.criticite === 'critical' && !a.traitee
    );
  }) ?? [];
}

export async function createAlerte(
  alerte: Omit<Alerte, 'id' | 'createdAt'>
): Promise<number> {
  return db.alertes.add({
    ...alerte,
    createdAt: new Date().toISOString(),
  } as Alerte);
}

export async function markAlerteLue(id: number): Promise<void> {
  await db.alertes.update(id, { lu: true });
}

export async function markAlerteTraitee(id: number): Promise<void> {
  await db.alertes.update(id, {
    traitee: true,
    traiteeAt: new Date().toISOString(),
  });
}

export async function deleteAlerte(id: number): Promise<void> {
  await db.alertes.delete(id);
}

export async function markAllAlertesLues(): Promise<void> {
  const alertes = await db.alertes.where('lu').equals(0).toArray();
  for (const alerte of alertes) {
    await db.alertes.update(alerte.id!, { lu: true });
  }
}

// Nettoyer les alertes en double (garder la plus recente)
export async function cleanupDuplicateAlertes(): Promise<number> {
  const alertes = await db.alertes.toArray();
  const seen = new Map<string, number>(); // key -> id de l'alerte a garder
  const toDelete: number[] = [];

  // Trier par date descendante pour garder la plus recente
  alertes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  for (const alerte of alertes) {
    if (!alerte.traitee) {
      // Cle unique: type + entiteType + entiteId
      const key = `${alerte.type}_${alerte.entiteType}_${alerte.entiteId}`;
      if (seen.has(key)) {
        // C'est un doublon, marquer pour suppression
        toDelete.push(alerte.id!);
      } else {
        seen.set(key, alerte.id!);
      }
    }
  }

  // Supprimer les doublons
  for (const id of toDelete) {
    await db.alertes.delete(id);
  }

  return toDelete.length;
}

// Auto-generate alerts based on data
export async function generateAlertesAutomatiques(): Promise<void> {

  // Check actions for deadline alerts
  const actions = await db.actions.toArray();
  for (const action of actions) {
    if (action.statut === 'termine') continue;

    const daysUntil = getDaysUntil(action.date_fin_prevue);

    // Action blocked
    if (action.statut === 'bloque') {
      const existing = await db.alertes
        .filter(
          (a) =>
            a.type === 'action_bloquee' &&
            a.entiteId === action.id &&
            !a.traitee
        )
        .first();

      if (!existing) {
        await createAlerte({
          type: 'action_bloquee',
          titre: 'Action bloquée',
          message: `L'action "${action.titre}" est bloquée`,
          criticite: 'critical',
          entiteType: 'action',
          entiteId: action.id!,
          lu: false,
          traitee: false,
        });
      }
    }

    // Deadline approaching/passed
    let alertType: AlerteType | null = null;
    let criticite: Criticite = 'medium';

    if (daysUntil < 0) {
      alertType = 'echeance_action';
      criticite = 'critical';
    } else if (daysUntil <= 1) {
      alertType = 'echeance_action';
      criticite = 'high';
    } else if (daysUntil <= 3) {
      alertType = 'echeance_action';
      criticite = 'medium';
    } else if (daysUntil <= 7) {
      alertType = 'echeance_action';
      criticite = 'low';
    }

    if (alertType) {
      // Verifier s'il existe deja une alerte non traitee pour cette action
      const existing = await db.alertes
        .filter(
          (a) =>
            a.type === alertType &&
            a.entiteId === action.id &&
            !a.traitee
        )
        .first();

      if (!existing) {
        await createAlerte({
          type: alertType,
          titre:
            daysUntil < 0
              ? 'Échéance dépassée'
              : `Échéance dans ${daysUntil} jour(s)`,
          message: `L'action "${action.titre}" ${
            daysUntil < 0
              ? `est en retard de ${Math.abs(daysUntil)} jour(s)`
              : `arrive à échéance dans ${daysUntil} jour(s)`
          }`,
          criticite,
          entiteType: 'action',
          entiteId: action.id!,
          lu: false,
          traitee: false,
        });
      }
    }
  }

  // Check jalons for approaching alerts
  const jalons = await db.jalons.toArray();
  for (const jalon of jalons) {
    if (jalon.statut === 'atteint') continue;

    const daysUntil = getDaysUntil(jalon.date_prevue);

    if (daysUntil <= 30 && daysUntil > 0) {
      let criticite: Criticite = 'medium';
      if (daysUntil <= 7) criticite = 'critical';
      else if (daysUntil <= 15) criticite = 'high';

      // Verifier s'il existe deja une alerte non traitee pour ce jalon
      const existing = await db.alertes
        .filter(
          (a) =>
            a.type === 'jalon_approche' &&
            a.entiteId === jalon.id &&
            !a.traitee
        )
        .first();

      if (!existing) {
        await createAlerte({
          type: 'jalon_approche',
          titre: `Jalon dans ${daysUntil} jours`,
          message: `Le jalon "${jalon.titre}" arrive dans ${daysUntil} jours`,
          criticite,
          entiteType: 'jalon',
          entiteId: jalon.id!,
          lu: false,
          traitee: false,
        });
      }
    }
  }

  // Check risques for critical alerts
  const risques = await db.risques.toArray();
  for (const risque of risques) {
    // Skip closed risks or those with score below critical threshold (12)
    if (risque.status === 'closed' || risque.score < 12) continue;

    const existing = await db.alertes
      .filter(
        (a) =>
          a.type === 'risque_critique' &&
          a.entiteId === risque.id &&
          !a.traitee
      )
      .first();

    if (!existing) {
      await createAlerte({
        type: 'risque_critique',
        titre: 'Risque critique',
        message: `Le risque "${risque.titre}" a un score critique de ${risque.score}`,
        criticite: 'critical',
        entiteType: 'risque',
        entiteId: risque.id!,
        lu: false,
        traitee: false,
      });
    }
  }

  // Check budget for overspend alerts
  const budgetItems = await db.budget.toArray();
  for (const item of budgetItems) {
    const ecartPercent =
      item.montantPrevu > 0
        ? ((item.montantRealise - item.montantPrevu) / item.montantPrevu) * 100
        : 0;

    if (ecartPercent > 5) {
      const existing = await db.alertes
        .filter(
          (a) =>
            a.type === 'depassement_budget' &&
            a.entiteId === item.id &&
            !a.traitee
        )
        .first();

      if (!existing) {
        await createAlerte({
          type: 'depassement_budget',
          titre: 'Dépassement budgétaire',
          message: `Le poste "${item.libelle}" dépasse le budget de ${ecartPercent.toFixed(1)}%`,
          criticite: ecartPercent > 15 ? 'critical' : 'high',
          entiteType: 'budget',
          entiteId: item.id!,
          lu: false,
          traitee: false,
        });
      }
    }
  }

  // Check for desynchronisation between Construction (technique) and Mobilisation (5 autres axes)
  // Construction = axe3_technique
  const actionsTechniques = actions.filter((a) => a.axe === 'axe3_technique');
  // Mobilisation = les 5 autres axes (RH, Commercial, Budget, Marketing, Exploitation)
  const axesMobilisation: Array<'axe1_rh' | 'axe2_commercial' | 'axe4_budget' | 'axe5_marketing' | 'axe6_exploitation'> = [
    'axe1_rh',
    'axe2_commercial',
    'axe4_budget',
    'axe5_marketing',
    'axe6_exploitation',
  ];
  const actionsMobilisation = actions.filter((a) => axesMobilisation.includes(a.axe as typeof axesMobilisation[number]));

  const avancementTechnique =
    actionsTechniques.length > 0
      ? actionsTechniques.reduce((sum, a) => sum + a.avancement, 0) / actionsTechniques.length
      : 0;

  const avancementMobilisation =
    actionsMobilisation.length > 0
      ? actionsMobilisation.reduce((sum, a) => sum + a.avancement, 0) / actionsMobilisation.length
      : 0;

  const ecartSync = avancementMobilisation - avancementTechnique;

  // Alert if mobilisation is too far ahead (risk of wasted resources)
  if (ecartSync > 20) {
    const existing = await db.alertes
      .filter(
        (a) =>
          a.type === 'desynchronisation_chantier_mobilisation' &&
          a.message.includes('gaspillage') &&
          !a.traitee
      )
      .first();

    if (!existing) {
      await createAlerte({
        type: 'desynchronisation_chantier_mobilisation',
        titre: 'Risque de gaspillage ressources',
        message: `La mobilisation (${Math.round(avancementMobilisation)}%) est en avance de ${Math.round(ecartSync)} points sur la construction (${Math.round(avancementTechnique)}%). Risque de gaspillage de ressources.`,
        criticite: ecartSync > 30 ? 'critical' : 'high',
        entiteType: 'action',
        entiteId: 0, // Global alert, not linked to specific action
        lu: false,
        traitee: false,
      });
    }
  }

  // Alert if technical progress is too far behind (risk of delayed opening)
  if (ecartSync < -20) {
    const existing = await db.alertes
      .filter(
        (a) =>
          a.type === 'desynchronisation_chantier_mobilisation' &&
          a.message.includes('retard') &&
          !a.traitee
      )
      .first();

    if (!existing) {
      await createAlerte({
        type: 'desynchronisation_chantier_mobilisation',
        titre: 'Risque de retard ouverture',
        message: `La construction (${Math.round(avancementTechnique)}%) est en retard de ${Math.round(Math.abs(ecartSync))} points sur la mobilisation (${Math.round(avancementMobilisation)}%). Risque de retard d'ouverture.`,
        criticite: ecartSync < -30 ? 'critical' : 'high',
        entiteType: 'action',
        entiteId: 0, // Global alert, not linked to specific action
        lu: false,
        traitee: false,
      });
    }
  }
}
