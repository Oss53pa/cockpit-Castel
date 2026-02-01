/**
 * Service de calcul automatique des statuts et dates
 * Implémente les règles de recalcul automatique pour les actions et jalons
 */

import { db } from '@/db';
import type { Action, ActionSante, TypeLien } from '@/types';
import { calculerPourcentageJalon, calculerStatutJalon } from '@/lib/calculations';
import { computeEcheance, computeDureeJours } from '@/lib/dateCalculations';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Limite de profondeur pour éviter les boucles infinies dans la récursion
const MAX_RECURSION_DEPTH = 50;

// ============================================================================
// RÈGLES DE CALCUL AUTOMATIQUE POUR LES ACTIONS
// ============================================================================

/**
 * Met à jour automatiquement le statut d'une action selon les règles:
 * - Si deadline dépassée && statut != 'termine'/'annule' → santé = 'rouge'
 * - Si avancement = 100% && statut != 'termine'/'annule' → statut = 'en_validation'
 *
 * @returns true si le statut a été modifié
 */
export async function autoUpdateActionStatus(actionId: number): Promise<boolean> {
  try {
    const action = await db.actions.get(actionId);
    if (!action) return false;

    const today = new Date().toISOString().split('T')[0];
    const currentStatut = action.statut;

    // Statuts finaux qu'on ne touche pas
    const statutsFinaux = ['termine', 'annule'];
    if (statutsFinaux.includes(currentStatut)) {
      return false;
    }

    let newStatut = currentStatut;
    let updated = false;

    // Règle 1: Si avancement = 100% → passer en validation
    if (action.avancement === 100 && currentStatut !== 'en_validation') {
      newStatut = 'en_validation';
    }
    // Règle 2: Si deadline dépassée et pas à 100% → marquer santé rouge
    else if (action.date_fin_prevue < today && action.avancement < 100) {
      if (action.sante !== 'rouge') {
        await db.actions.update(actionId, {
          sante: 'rouge',
          updatedAt: new Date().toISOString(),
        });
        updated = true;
      }
    }

    // Appliquer le nouveau statut si différent
    if (newStatut !== currentStatut) {
      await db.actions.update(actionId, {
        statut: newStatut,
        updatedAt: new Date().toISOString(),
      });
      return true;
    }

    return updated;
  } catch (error) {
    console.error(`[autoUpdateActionStatus] Erreur pour action ${actionId}:`, error);
    return false;
  }
}

// ============================================================================
// RÈGLES DE CALCUL AUTOMATIQUE POUR LES JALONS
// ============================================================================

/**
 * Met à jour automatiquement le statut d'un jalon:
 * 1. Calcule le pourcentage via les actions liées
 * 2. Applique calculerStatutJalon()
 * 3. Persiste si différent du statut actuel
 *
 * @returns true si le statut a été modifié
 */
export async function autoUpdateJalonStatus(jalonId: number): Promise<boolean> {
  try {
    const jalon = await db.jalons.get(jalonId);
    if (!jalon) return false;

    // Récupérer les actions liées
    const actionsJalon = await db.actions.where('jalonId').equals(jalonId).toArray();

    // Calculer le pourcentage d'avancement
    const pourcentage = calculerPourcentageJalon(actionsJalon);

    // Calculer le nouveau statut
    const nouveauStatut = calculerStatutJalon(
      pourcentage,
      jalon.date_prevue,
      jalon.date_prevue,
      jalon.date_reelle
    );

    // Mapper le statut v2.0 vers le statut legacy
    const statutMapping: Record<string, typeof jalon.statut> = {
      'A_VENIR': 'a_venir',
      'EN_COURS': 'en_approche',
      'A_VALIDER': 'en_approche',
      'ATTEINT': 'atteint',
      'EN_RETARD': 'depasse',
    };

    const statutLegacy = statutMapping[nouveauStatut] ?? jalon.statut;

    // Mettre à jour si différent
    if (statutLegacy !== jalon.statut || pourcentage !== jalon.avancement_prealables) {
      await db.jalons.update(jalonId, {
        statut: statutLegacy,
        avancement_prealables: pourcentage,
        date_derniere_maj: new Date().toISOString(),
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error(`[autoUpdateJalonStatus] Erreur pour jalon ${jalonId}:`, error);
    return false;
  }
}

// ============================================================================
// CASCADE DES DATES VERS LES SUCCESSEURS
// ============================================================================

/**
 * Propage un changement de date d'action vers ses successeurs.
 * Applique les règles de calcul selon le type de lien:
 * - FS (Finish-Start): successeur.date_debut = action.date_fin + decalage
 * - FF (Finish-Finish): successeur.date_fin = action.date_fin + decalage
 * - SS (Start-Start): successeur.date_debut = action.date_debut + decalage
 * - SF (Start-Finish): successeur.date_fin = action.date_debut + decalage
 *
 * @param actionId - ID de l'action source
 * @param newDateFin - Nouvelle date de fin
 * @param newDateDebut - Nouvelle date de début (optionnel)
 * @param visitedIds - Set des IDs déjà visités (protection contre les cycles)
 * @param depth - Profondeur de récursion actuelle
 * @returns le nombre d'actions mises à jour
 */
export async function propagateDateChangeToSuccessors(
  actionId: number,
  newDateFin: string,
  newDateDebut?: string,
  visitedIds: Set<number> = new Set(),
  depth: number = 0
): Promise<number> {
  // Protection contre les boucles infinies
  if (depth >= MAX_RECURSION_DEPTH) {
    console.warn(`[propagateDateChangeToSuccessors] Profondeur max atteinte pour action ${actionId}`);
    return 0;
  }

  if (visitedIds.has(actionId)) {
    return 0; // Cycle détecté, on s'arrête
  }
  visitedIds.add(actionId);

  try {
    const action = await db.actions.get(actionId);
    if (!action) return 0;

    const dateDebutAction = newDateDebut || action.date_debut_prevue;
    let actionsUpdated = 0;

    for (const successeur of action.successeurs || []) {
      // Récupérer l'action successeur depuis la base
      const successeurActions = await db.actions
        .where('id_action')
        .equals(successeur.id)
        .toArray();

      if (successeurActions.length === 0) continue;

      const actionSuccesseur = successeurActions[0];

      // Vérifier si déjà visité (cycle)
      if (visitedIds.has(actionSuccesseur.id!)) continue;

      // Vérifier si la date est verrouillée manuellement
      const hasLock = (actionSuccesseur as Action & { date_verrouillage_manuel?: boolean }).date_verrouillage_manuel;
      if (hasLock) continue;

      const typeLien = successeur.type_lien as TypeLien;
      const decalage = successeur.decalage_jours || 0;
      const duree = actionSuccesseur.duree_prevue_jours ||
        computeDureeJours(actionSuccesseur.date_debut_prevue, actionSuccesseur.date_fin_prevue);

      let nouveauDebut: string;
      let nouvelleFin: string;

      switch (typeLien) {
        case 'FS':
          nouveauDebut = addDays(newDateFin, decalage);
          nouvelleFin = computeEcheance(nouveauDebut, duree);
          break;

        case 'FF':
          nouvelleFin = addDays(newDateFin, decalage);
          nouveauDebut = subtractDays(nouvelleFin, duree);
          break;

        case 'SS':
          nouveauDebut = addDays(dateDebutAction, decalage);
          nouvelleFin = computeEcheance(nouveauDebut, duree);
          break;

        case 'SF':
          nouvelleFin = addDays(dateDebutAction, decalage);
          nouveauDebut = subtractDays(nouvelleFin, duree);
          break;

        default:
          continue;
      }

      // Mettre à jour le successeur si les dates ont changé
      if (nouveauDebut !== actionSuccesseur.date_debut_prevue || nouvelleFin !== actionSuccesseur.date_fin_prevue) {
        await db.actions.update(actionSuccesseur.id!, {
          date_debut_prevue: nouveauDebut,
          date_fin_prevue: nouvelleFin,
          updatedAt: new Date().toISOString(),
        });
        actionsUpdated++;

        // Propager récursivement aux successeurs du successeur
        const recursiveUpdates = await propagateDateChangeToSuccessors(
          actionSuccesseur.id!,
          nouvelleFin,
          nouveauDebut,
          visitedIds,
          depth + 1
        );
        actionsUpdated += recursiveUpdates;
      }
    }

    return actionsUpdated;
  } catch (error) {
    console.error(`[propagateDateChangeToSuccessors] Erreur pour action ${actionId}:`, error);
    return 0;
  }
}

// ============================================================================
// RECALCUL BATCH QUOTIDIEN
// ============================================================================

/**
 * Exécute le recalcul automatique quotidien:
 * - Met à jour les statuts de toutes les actions en retard
 * - Met à jour les statuts de tous les jalons
 *
 * @returns le nombre d'actions et jalons mis à jour
 */
export async function runDailyAutoCalculations(): Promise<{
  actionsUpdated: number;
  jalonsUpdated: number;
}> {
  let actionsUpdated = 0;
  let jalonsUpdated = 0;

  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Mettre à jour les actions
    const allActions = await db.actions.toArray();

    for (const action of allActions) {
      if (action.statut === 'termine' || action.statut === 'annule') {
        continue;
      }

      const wasUpdated = await autoUpdateActionStatus(action.id!);
      if (wasUpdated) {
        actionsUpdated++;
        continue; // Éviter double comptage
      }

      // Mettre à jour la santé si deadline dépassée
      if (action.date_fin_prevue < today && action.avancement < 100) {
        const newSante = calculateHealthStatus(action, today);
        if (newSante !== action.sante) {
          await db.actions.update(action.id!, {
            sante: newSante,
            updatedAt: new Date().toISOString(),
          });
          actionsUpdated++;
        }
      }
    }

    // 2. Mettre à jour les jalons
    const allJalons = await db.jalons.toArray();

    for (const jalon of allJalons) {
      if (jalon.statut === 'atteint' || jalon.statut === 'annule') {
        continue;
      }

      const wasUpdated = await autoUpdateJalonStatus(jalon.id!);
      if (wasUpdated) {
        jalonsUpdated++;
      }
    }

    console.log(`[AutoCalculation] Recalcul terminé: ${actionsUpdated} actions, ${jalonsUpdated} jalons mis à jour`);
  } catch (error) {
    console.error('[runDailyAutoCalculations] Erreur:', error);
  }

  return { actionsUpdated, jalonsUpdated };
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  const result = new Date(date.getTime() + days * MS_PER_DAY);
  return result.toISOString().split('T')[0];
}

function subtractDays(dateStr: string, days: number): string {
  return addDays(dateStr, -days);
}

function calculateHealthStatus(action: Action, today: string): ActionSante {
  const dateFin = new Date(action.date_fin_prevue);
  const todayDate = new Date(today);
  const diffDays = Math.floor((dateFin.getTime() - todayDate.getTime()) / MS_PER_DAY);

  if (action.statut === 'bloque') return 'rouge';
  if (action.statut === 'en_attente') return 'bleu';
  if (action.statut === 'a_planifier' || action.statut === 'planifie') return 'gris';
  if (diffDays < 0) return 'rouge';

  if (diffDays <= 7) {
    const expectedProgress = 100 - (diffDays / 7) * 20;
    return action.avancement < expectedProgress ? 'orange' : 'jaune';
  }

  if (diffDays <= 15 && action.avancement < 50) return 'jaune';

  return 'vert';
}

// ============================================================================
// FONCTIONS HELPER POUR INTÉGRATION
// ============================================================================

/**
 * Recalcule le statut d'une action après modification de son avancement
 * et met à jour le jalon parent si nécessaire
 */
export async function handleActionProgressChange(actionId: number): Promise<void> {
  await autoUpdateActionStatus(actionId);

  const action = await db.actions.get(actionId);
  if (action?.jalonId) {
    await autoUpdateJalonStatus(action.jalonId);
  }
}

/**
 * Recalcule les dates des successeurs après modification de la date de fin d'une action
 * et met à jour le jalon parent si nécessaire
 */
export async function handleActionDateChange(
  actionId: number,
  newDateFin: string,
  newDateDebut?: string
): Promise<number> {
  const actionsUpdated = await propagateDateChangeToSuccessors(actionId, newDateFin, newDateDebut);

  const action = await db.actions.get(actionId);
  if (action?.jalonId) {
    await autoUpdateJalonStatus(action.jalonId);
  }

  return actionsUpdated;
}
