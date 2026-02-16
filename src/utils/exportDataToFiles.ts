// ============================================================================
// EXPORT INDEXEDDB DATA TO JSON FILE
// Run in browser console to export current database data
// ============================================================================

import { db } from '@/db';
import { logger } from '@/lib/logger';

/**
 * Export all data from IndexedDB to a downloadable JSON file
 */
export async function exportAllDataToJSON(): Promise<void> {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',

    // Core data
    actions: await db.actions.toArray(),
    jalons: await db.jalons.toArray(),
    risques: await db.risques.toArray(),
    budget: await db.budget.toArray(),
    users: await db.users.toArray(),
    teams: await db.teams.toArray(),

    // Project config
    project: await db.project.toArray(),
    projectSettings: await db.projectSettings.toArray(),
    sites: await db.sites.toArray(),
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `cosmos-angre-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  logger.info('Data exported successfully!');
  logger.info(`Actions: ${data.actions.length}`);
  logger.info(`Jalons: ${data.jalons.length}`);
  logger.info(`Risques: ${data.risques.length}`);
  logger.info(`Budget items: ${data.budget.length}`);
}

/**
 * Export actions grouped by axe for data file format
 */
export async function exportActionsForDataFiles(): Promise<void> {
  const actions = await db.actions.toArray();
  const users = await db.users.toArray();

  // Create user lookup
  const userById = new Map(users.map(u => [u.id, u]));

  // Group by axe
  const byAxe: Record<string, typeof actions> = {};
  for (const action of actions) {
    const axe = action.axe || 'unknown';
    if (!byAxe[axe]) byAxe[axe] = [];
    byAxe[axe].push(action);
  }

  const formatted = {
    exportedAt: new Date().toISOString(),
    actionsByAxe: Object.entries(byAxe).map(([axe, acts]) => ({
      axe,
      count: acts.length,
      actions: acts.map(a => ({
        id: a.id,
        code: a.code,
        titre: a.titre,
        axe: a.axe,
        statut: a.statut,
        avancement: a.avancement,
        priorite: a.priorite,
        date_debut_prevue: a.date_debut_prevue,
        date_fin_prevue: a.date_fin_prevue,
        responsable: a.responsableId ? userById.get(a.responsableId)?.nom : null,
        responsableId: a.responsableId,
      }))
    }))
  };

  const jsonStr = JSON.stringify(formatted, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `cosmos-angre-actions-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  logger.info('Actions exported successfully!');
}

/**
 * Export risques for data file format
 */
export async function exportRisquesForDataFiles(): Promise<void> {
  const risques = await db.risques.toArray();
  const users = await db.users.toArray();

  const userById = new Map(users.map(u => [u.id, u]));

  const formatted = {
    exportedAt: new Date().toISOString(),
    count: risques.length,
    risques: risques.map(r => ({
      id: r.id,
      code: r.id_risque,
      titre: r.titre,
      description: r.description,
      categorie: r.categorie,
      probabilite: r.probabilite,
      impact: r.impact,
      score: r.score,
      status: r.status,
      responsable: r.responsableId ? userById.get(r.responsableId)?.nom : null,
      responsableId: r.responsableId,
      actionsAttenuation: r.actionsAttenuation,
      dateIdentification: r.dateIdentification,
      dateRevue: r.dateRevue,
    }))
  };

  const jsonStr = JSON.stringify(formatted, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `cosmos-angre-risques-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  logger.info('Risques exported successfully!');
}

// Make functions available globally for console use
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).exportAllDataToJSON = exportAllDataToJSON;
  (window as unknown as Record<string, unknown>).exportActionsForDataFiles = exportActionsForDataFiles;
  (window as unknown as Record<string, unknown>).exportRisquesForDataFiles = exportRisquesForDataFiles;
}
