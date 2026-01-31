/**
 * Hook pour gérer les Sous-tâches, Preuves et Notes d'une action
 * Implémentation des spécifications v2.0
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { SousTache, Preuve, NoteAction } from '@/types';

// ============================================================================
// SOUS-TÂCHES
// ============================================================================

/**
 * Récupère les sous-tâches d'une action
 */
export function useSousTaches(actionId: string) {
  return useLiveQuery(
    () => db.sousTaches.where('actionId').equals(actionId).sortBy('ordre'),
    [actionId],
    []
  );
}

/**
 * Crée une nouvelle sous-tâche
 */
export async function createSousTache(actionId: string, libelle: string): Promise<number> {
  const now = new Date().toISOString();
  const sousTaches = await db.sousTaches.where('actionId').equals(actionId).toArray();
  const ordre = sousTaches.length;

  return db.sousTaches.add({
    actionId,
    libelle,
    fait: false,
    ordre,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Met à jour une sous-tâche
 */
export async function updateSousTache(id: number, updates: Partial<SousTache>): Promise<void> {
  await db.sousTaches.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Bascule l'état fait/non fait d'une sous-tâche
 */
export async function toggleSousTache(id: number): Promise<void> {
  const sousTache = await db.sousTaches.get(id);
  if (sousTache) {
    await db.sousTaches.update(id, {
      fait: !sousTache.fait,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Supprime une sous-tâche
 */
export async function deleteSousTache(id: number): Promise<void> {
  await db.sousTaches.delete(id);
}

/**
 * Réordonne les sous-tâches
 */
export async function reorderSousTaches(actionId: string, orderedIds: number[]): Promise<void> {
  const now = new Date().toISOString();
  await db.transaction('rw', db.sousTaches, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.sousTaches.update(orderedIds[i], { ordre: i, updatedAt: now });
    }
  });
}

/**
 * Calcule le pourcentage de complétion des sous-tâches
 */
export function calculateSousTachesProgress(sousTaches: SousTache[]): number {
  if (sousTaches.length === 0) return 0;
  const completed = sousTaches.filter(st => st.fait).length;
  return Math.round((completed / sousTaches.length) * 100);
}

// ============================================================================
// PREUVES
// ============================================================================

/**
 * Récupère les preuves d'une action
 */
export function usePreuves(actionId: string) {
  return useLiveQuery(
    () => db.preuves.where('actionId').equals(actionId).reverse().sortBy('createdAt'),
    [actionId],
    []
  );
}

/**
 * Ajoute une preuve de type lien
 */
export async function addPreuveLien(
  actionId: string,
  nom: string,
  url: string,
  uploadePar: string
): Promise<number> {
  return db.preuves.add({
    actionId,
    type: 'LIEN',
    nom,
    url,
    uploadePar,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Ajoute une preuve de type fichier
 */
export async function addPreuveFichier(
  actionId: string,
  file: File,
  uploadePar: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const id = await db.preuves.add({
          actionId,
          type: 'FICHIER',
          nom: file.name,
          fichier: {
            nom: file.name,
            taille: file.size,
            type: file.type,
            base64,
          },
          uploadePar,
          createdAt: new Date().toISOString(),
        });
        resolve(id);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Supprime une preuve
 */
export async function deletePreuve(id: number): Promise<void> {
  await db.preuves.delete(id);
}

/**
 * Télécharge une preuve fichier
 */
export function downloadPreuve(preuve: Preuve): void {
  if (preuve.type === 'FICHIER' && preuve.fichier) {
    const link = document.createElement('a');
    link.href = `data:${preuve.fichier.type};base64,${preuve.fichier.base64}`;
    link.download = preuve.fichier.nom;
    link.click();
  } else if (preuve.type === 'LIEN' && preuve.url) {
    window.open(preuve.url, '_blank');
  }
}

// ============================================================================
// NOTES
// ============================================================================

/**
 * Récupère les notes d'une action
 */
export function useNotesAction(actionId: string) {
  return useLiveQuery(
    () => db.notesAction.where('actionId').equals(actionId).reverse().sortBy('createdAt'),
    [actionId],
    []
  );
}

/**
 * Ajoute une note à une action
 */
export async function addNoteAction(
  actionId: string,
  contenu: string,
  auteurId: string,
  auteurNom: string
): Promise<number> {
  return db.notesAction.add({
    actionId,
    contenu,
    auteurId,
    auteurNom,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Supprime une note
 */
export async function deleteNoteAction(id: number): Promise<void> {
  await db.notesAction.delete(id);
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Supprime toutes les sous-tâches, preuves et notes d'une action
 */
export async function deleteAllActionData(actionId: string): Promise<void> {
  await db.transaction('rw', [db.sousTaches, db.preuves, db.notesAction], async () => {
    await db.sousTaches.where('actionId').equals(actionId).delete();
    await db.preuves.where('actionId').equals(actionId).delete();
    await db.notesAction.where('actionId').equals(actionId).delete();
  });
}
