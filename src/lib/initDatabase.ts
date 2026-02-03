// ============================================================================
// INITIALISATION DE LA BASE DE DONNÉES
// ============================================================================
// Ce module vérifie si la base de données est vide et la seed automatiquement
// avec les données de production v2.0

import { db } from '@/db';
import { seedDatabaseV2, PROJECT_METADATA, migrateActionsBuildingCode } from '@/data/seedDataV2';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Vérifie si la base de données contient des données
 */
async function isDatabaseEmpty(): Promise<boolean> {
  const [jalonsCount, actionsCount, usersCount] = await Promise.all([
    db.jalons.count(),
    db.actions.count(),
    db.users.count(),
  ]);

  return jalonsCount === 0 && actionsCount === 0 && usersCount === 0;
}

/**
 * Initialise la base de données avec les données v2.0 si elle est vide
 */
export async function initializeDatabase(): Promise<{
  wasEmpty: boolean;
  seeded: boolean;
  result?: {
    usersCreated: number;
    jalonsCreated: number;
    actionsCreated: number;
  };
}> {
  // Éviter les initialisations multiples
  if (isInitialized) {
    return { wasEmpty: false, seeded: false };
  }

  // Utiliser une promesse partagée pour éviter les appels concurrents
  if (initPromise) {
    await initPromise;
    return { wasEmpty: false, seeded: false };
  }

  initPromise = (async () => {
    try {
      const empty = await isDatabaseEmpty();

      if (empty) {
        console.log('[initDatabase] Base de données vide, seed des données v2.0...');
        const result = await seedDatabaseV2();
        console.log('[initDatabase] Seed terminé:', result);
        // Migration pour ajouter buildingCode aux actions de construction
        const migratedCount = await migrateActionsBuildingCode();
        console.log('[initDatabase] Migration buildingCode:', migratedCount, 'actions mises à jour');
        isInitialized = true;
        return { wasEmpty: true, seeded: true, result };
      } else {
        console.log('[initDatabase] Base de données déjà initialisée');
        // Toujours exécuter la migration pour mettre à jour les données existantes
        const migratedCount = await migrateActionsBuildingCode();
        if (migratedCount > 0) {
          console.log('[initDatabase] Migration buildingCode:', migratedCount, 'actions mises à jour');
        }
        isInitialized = true;
        return { wasEmpty: false, seeded: false };
      }
    } catch (error) {
      console.error('[initDatabase] Erreur lors de l\'initialisation:', error);
      throw error;
    }
  })();

  return initPromise as Promise<{
    wasEmpty: boolean;
    seeded: boolean;
    result?: {
      usersCreated: number;
      jalonsCreated: number;
      actionsCreated: number;
    };
  }>;
}

/**
 * Force le seed des données (efface les données existantes)
 */
export async function forceReseed(): Promise<{
  usersCreated: number;
  jalonsCreated: number;
  actionsCreated: number;
}> {
  console.log('[initDatabase] Force reseed des données de production...');

  // Reset initialization state
  isInitialized = false;
  initPromise = null;

  // Effacer TOUTES les données existantes (y compris project pour forcer un seed complet)
  await db.transaction('rw', [db.users, db.jalons, db.actions, db.risques, db.budget, db.alertes, db.teams, db.project, db.sites, db.projectSettings], async () => {
    await db.users.clear();
    await db.jalons.clear();
    await db.actions.clear();
    await db.risques.clear();
    await db.budget.clear();
    await db.alertes.clear();
    await db.teams.clear();
    await db.project.clear();
    await db.sites.clear();
    await db.projectSettings.clear();
  });

  // Charger les vraies données de production avec siteId
  const { seedDatabase } = await import('@/data/cosmosAngre');
  await seedDatabase();

  // Aussi exécuter seedDatabaseV2 pour les données complémentaires
  const result = await seedDatabaseV2();
  console.log('[initDatabase] Force reseed terminé:', result);

  return result;
}

/**
 * Retourne les métadonnées du projet
 */
export function getProjectMetadata() {
  return PROJECT_METADATA;
}

/**
 * Retourne les statistiques actuelles de la base de données
 */
export async function getDatabaseStats(): Promise<{
  users: number;
  jalons: number;
  actions: number;
  risques: number;
  budget: number;
  alertes: number;
}> {
  const [users, jalons, actions, risques, budget, alertes] = await Promise.all([
    db.users.count(),
    db.jalons.count(),
    db.actions.count(),
    db.risques.count(),
    db.budget.count(),
    db.alertes.count(),
  ]);

  return { users, jalons, actions, risques, budget, alertes };
}

export default initializeDatabase;
