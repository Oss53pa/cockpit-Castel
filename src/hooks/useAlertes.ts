import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { Alerte, AlerteFilters, AlerteType, Criticite, AlerteEmailHistorique } from '@/types';
import { MOBILISATION_AXES } from '@/types';
import { getDaysUntil } from '@/lib/utils';
import {
  sendAlerteEmailSimple as sendAlerteEmail,
  getAlerteResponsableByEntity as getAlerteResponsable,
} from '@/services/alerteEmailService';
import { SEUILS_SYNC_REPORT, SEUILS_RISQUES } from '@/data/constants';
import { detecterConflitsDates } from '@/lib/dateCalculations';

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
  alerte: Omit<Alerte, 'id' | 'createdAt'>,
  options?: { sendEmail?: boolean }
): Promise<number> {
  // Récupérer le responsable automatiquement si non fourni
  let responsableInfo = {
    responsableId: alerte.responsableId,
    responsableNom: alerte.responsableNom,
    responsableEmail: alerte.responsableEmail,
  };

  if (!responsableInfo.responsableId && alerte.entiteType && alerte.entiteId) {
    const resp = await getAlerteResponsable(alerte.entiteType, alerte.entiteId);
    if (resp) {
      responsableInfo = resp;
    }
  }

  const alerteId = await db.alertes.add({
    ...alerte,
    ...responsableInfo,
    emailEnvoye: false,
    emailRelanceCount: 0,
    createdAt: new Date().toISOString(),
  } as Alerte);

  // Envoyer email automatiquement si demandé et si responsable avec email
  if (options?.sendEmail && responsableInfo.responsableEmail) {
    const alerteComplete = await db.alertes.get(alerteId);
    if (alerteComplete) {
      await sendAlerteEmail(alerteComplete, 'initial');
    }
  }

  return alerteId;
}

export async function markAlerteLue(id: number): Promise<void> {
  await db.alertes.update(id, { lu: true });
}

export async function markAlerteTraitee(
  id: number,
  traiteePar?: { id: number; nom: string }
): Promise<void> {
  await db.alertes.update(id, {
    traitee: true,
    traiteeAt: new Date().toISOString(),
    traiteeParId: traiteePar?.id,
    traiteeParNom: traiteePar?.nom,
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

  // Nettoyer les doublons avant de générer de nouvelles alertes
  await cleanupDuplicateAlertes();

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
          titre: `Action bloquée : ${action.titre || action.id_action || 'Sans titre'}`,
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
        const actionName = action.titre || action.id_action || 'Sans titre';
        await createAlerte({
          type: alertType,
          titre:
            daysUntil < 0
              ? `Échéance dépassée : ${actionName}`
              : `J-${daysUntil} : ${actionName}`,
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

  // Check jalons for approaching or overdue alerts
  const jalons = await db.jalons.toArray();
  for (const jalon of jalons) {
    if (jalon.statut === 'atteint') continue;

    const daysUntil = getDaysUntil(jalon.date_prevue);
    const jalonName = jalon.titre || jalon.id_jalon || 'Sans titre';

    // Jalon dépassé (daysUntil < 0)
    if (daysUntil < 0) {
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
          titre: `Jalon dépassé : ${jalonName}`,
          message: `Le jalon "${jalon.titre}" est en retard de ${Math.abs(daysUntil)} jour(s)`,
          criticite: 'critical',
          entiteType: 'jalon',
          entiteId: jalon.id!,
          lu: false,
          traitee: false,
        });
      }
    }
    // Jalon en approche (0 < daysUntil <= 30)
    else if (daysUntil <= 30 && daysUntil > 0) {
      let criticite: Criticite = 'medium';
      if (daysUntil <= 7) criticite = 'critical';
      else if (daysUntil <= 15) criticite = 'high';

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
          titre: `J-${daysUntil} : ${jalonName}`,
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
    // Skip closed/fermé risks or those with score below critical threshold
    if (risque.status === 'closed' || risque.status === 'ferme' || (risque.score ?? 0) < SEUILS_RISQUES.critique) continue;

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
        titre: `Risque critique : ${risque.titre || 'Sans titre'}`,
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
          titre: `Dépassement : ${item.libelle || 'Poste sans nom'}`,
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
  // Utilise la constante centralisée MOBILISATION_AXES pour éviter les incohérences
  const actionsMobilisation = actions.filter((a) => (MOBILISATION_AXES as readonly string[]).includes(a.axe));

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
  if (ecartSync > SEUILS_SYNC_REPORT.attention) {
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
        criticite: ecartSync > SEUILS_SYNC_REPORT.attention * 2 ? 'critical' : 'high',
        entiteType: 'action',
        entiteId: 0, // Global alert, not linked to specific action
        lu: false,
        traitee: false,
      });
    }
  }

  // Alert if technical progress is too far behind (risk of delayed opening)
  if (ecartSync < -SEUILS_SYNC_REPORT.attention) {
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
        criticite: ecartSync < -(SEUILS_SYNC_REPORT.attention * 2) ? 'critical' : 'high',
        entiteType: 'action',
        entiteId: 0, // Global alert, not linked to specific action
        lu: false,
        traitee: false,
      });
    }
  }

  // ============================================================================
  // CONFLITS DATE PROJETÉE
  // ============================================================================
  try {
    const conflits = await detecterConflitsDates();
    for (const conflit of conflits) {
      const existing = await db.alertes
        .filter(
          (a) =>
            a.type === 'conflit_date_projetee' &&
            a.entiteId === conflit.entiteId &&
            a.entiteType === conflit.entiteType &&
            !a.traitee
        )
        .first();

      if (!existing) {
        await createAlerte({
          type: 'conflit_date_projetee',
          titre: `Conflit date : ${conflit.titre}`,
          message: conflit.details,
          criticite: conflit.criticite,
          entiteType: conflit.entiteType,
          entiteId: conflit.entiteId,
          lu: false,
          traitee: false,
        });
      }
    }
  } catch (e) {
    console.warn('[Alertes] Erreur détection conflits dates:', e);
  }

  // ============================================================================
  // AUTO-RÉSOLUTION DES ALERTES
  // Marquer automatiquement comme traitées les alertes dont le problème est résolu
  // ============================================================================
  await autoResolveAlertes();
}

// ============================================================================
// AUTO-RÉSOLUTION DES ALERTES
// Marquer automatiquement comme traitées les alertes dont le problème est résolu
// ============================================================================

export async function autoResolveAlertes(): Promise<number> {
  const alertesNonTraitees = await db.alertes.filter(a => !a.traitee).toArray();
  let resolved = 0;

  for (const alerte of alertesNonTraitees) {
    let shouldResolve = false;
    let resolutionMessage = '';

    switch (alerte.type) {
      case 'action_bloquee': {
        // Résolu si l'action n'est plus bloquée
        if (alerte.entiteId) {
          const action = await db.actions.get(alerte.entiteId);
          if (action && action.statut !== 'bloque') {
            shouldResolve = true;
            resolutionMessage = `Action débloquée (statut: ${action.statut})`;
          }
        }
        break;
      }

      case 'echeance_action': {
        // Résolu si l'action est terminée
        if (alerte.entiteId) {
          const action = await db.actions.get(alerte.entiteId);
          if (action && action.statut === 'termine') {
            shouldResolve = true;
            resolutionMessage = 'Action terminée';
          }
        }
        break;
      }

      case 'jalon_approche': {
        // Résolu si le jalon est atteint
        if (alerte.entiteId) {
          const jalon = await db.jalons.get(alerte.entiteId);
          if (jalon && jalon.statut === 'atteint') {
            shouldResolve = true;
            resolutionMessage = 'Jalon atteint';
          }
        }
        break;
      }

      case 'risque_critique': {
        // Résolu si le risque est fermé/closed ou score < seuil critique
        if (alerte.entiteId) {
          const risque = await db.risques.get(alerte.entiteId);
          if (risque && (risque.status === 'closed' || risque.status === 'ferme' || (risque.score ?? 0) < SEUILS_RISQUES.critique)) {
            shouldResolve = true;
            resolutionMessage = (risque.status === 'closed' || risque.status === 'ferme')
              ? 'Risque fermé'
              : `Score réduit à ${risque.score}`;
          }
        }
        break;
      }

      case 'depassement_budget': {
        // Résolu si l'écart est revenu sous 5%
        if (alerte.entiteId) {
          const budgetItem = await db.budget.get(alerte.entiteId);
          if (budgetItem) {
            const ecart = budgetItem.montantPrevu > 0
              ? ((budgetItem.montantRealise - budgetItem.montantPrevu) / budgetItem.montantPrevu) * 100
              : 0;
            if (ecart <= 5) {
              shouldResolve = true;
              resolutionMessage = `Écart budgétaire corrigé (${ecart.toFixed(1)}%)`;
            }
          }
        }
        break;
      }

      case 'desynchronisation_chantier_mobilisation': {
        // Résolu si l'écart de synchronisation est revenu sous 20%
        const actions = await db.actions.toArray();
        const actionsTechniques = actions.filter(a => a.axe === 'axe3_technique');
        const axesMobilisation = ['axe1_rh', 'axe2_commercial', 'axe4_budget', 'axe5_marketing', 'axe6_exploitation'];
        const actionsMobilisation = actions.filter(a => axesMobilisation.includes(a.axe));

        const avancementTechnique = actionsTechniques.length > 0
          ? actionsTechniques.reduce((sum, a) => sum + a.avancement, 0) / actionsTechniques.length
          : 0;
        const avancementMobilisation = actionsMobilisation.length > 0
          ? actionsMobilisation.reduce((sum, a) => sum + a.avancement, 0) / actionsMobilisation.length
          : 0;
        const ecartSync = Math.abs(avancementMobilisation - avancementTechnique);

        if (ecartSync <= SEUILS_SYNC_REPORT.attention) {
          shouldResolve = true;
          resolutionMessage = `Synchronisation rétablie (écart: ${Math.round(ecartSync)}%)`;
        }
        break;
      }
    }

    if (shouldResolve && alerte.id) {
      await db.alertes.update(alerte.id, {
        traitee: true,
        traiteeAt: new Date().toISOString(),
        traiteeParNom: 'Système (auto)',
        lu: true, // Marquer aussi comme lu
      });
      resolved++;
      console.log(`[Auto-Resolve] Alerte #${alerte.id} résolue: ${resolutionMessage}`);
    }
  }

  return resolved;
}

// ============================================================================
// FONCTIONS EMAIL
// ============================================================================

// Envoyer un email pour une alerte spécifique
export async function envoyerEmailAlerte(
  alerteId: number,
  type: 'initial' | 'relance' | 'escalade' = 'initial'
): Promise<boolean> {
  const alerte = await db.alertes.get(alerteId);
  if (!alerte) return false;

  const success = await sendAlerteEmail(alerte, type);
  return success;
}

// Hook pour l'historique des emails
export function useAlerteEmailHistorique(alerteId?: number) {
  return useLiveQuery(async () => {
    if (alerteId) {
      return db.alerteEmailHistorique
        .where('alerteId')
        .equals(alerteId)
        .reverse()
        .toArray();
    }
    return db.alerteEmailHistorique.orderBy('envoyeAt').reverse().limit(100).toArray();
  }, [alerteId]) ?? [];
}

// Stats des emails
export function useAlerteEmailStats() {
  return useLiveQuery(async () => {
    const historique = await db.alerteEmailHistorique.toArray();
    return {
      total: historique.length,
      envoyes: historique.filter(h => h.statut === 'envoye').length,
      ouverts: historique.filter(h => h.statut === 'ouvert' || h.statut === 'clique').length,
      echecs: historique.filter(h => h.statut === 'echec').length,
    };
  }) ?? { total: 0, envoyes: 0, ouverts: 0, echecs: 0 };
}

// Envoyer emails pour toutes les alertes non traitées
export async function envoyerTousEmailsAlertes(): Promise<{ success: number; failed: number }> {
  const alertes = await db.alertes
    .filter(a => !a.traitee && !a.emailEnvoye && !!a.responsableEmail)
    .toArray();

  let success = 0;
  let failed = 0;

  for (const alerte of alertes) {
    const sent = await sendAlerteEmail(alerte, 'initial');
    if (sent) success++;
    else failed++;
  }

  return { success, failed };
}

// Envoyer relances pour alertes non traitées
export async function envoyerRelancesAlertes(joursDepuisCreation: number = 3): Promise<number> {
  const now = Date.now();
  const seuil = joursDepuisCreation * 24 * 60 * 60 * 1000;

  const alertes = await db.alertes
    .filter(a => {
      if (a.traitee || !a.emailEnvoye || !a.responsableEmail) return false;
      const age = now - new Date(a.createdAt).getTime();
      return age >= seuil;
    })
    .toArray();

  let count = 0;
  for (const alerte of alertes) {
    // Ne pas relancer plus de 3 fois
    if ((alerte.emailRelanceCount || 0) >= 3) continue;

    // Vérifier dernier relance
    if (alerte.dernierRelanceAt) {
      const depuisRelance = now - new Date(alerte.dernierRelanceAt).getTime();
      if (depuisRelance < seuil) continue;
    }

    const sent = await sendAlerteEmail(alerte, 'relance');
    if (sent) count++;
  }

  return count;
}
