// ============================================================================
// SYNCHRONISATION PROJET vs MOBILISATION - Service
// ============================================================================

import { db } from '@/db';
import { SYNC_CONFIG } from '@/config/syncConfig';
import type {
  SyncCategory,
  SyncItem,
  SyncSnapshot,
  SyncAlert,
  SyncAction,
  SyncStatusResult,
  CategoryProgress,
  RecommendedAction,
  SyncDimension,
  SyncStatusType,
  SyncAlertLevel,
  SyncItemStatus,
  SyncActionStatus,
  SyncPriority,
} from '@/types/sync.types';
import {
  PROJECT_CATEGORIES,
  MOBILIZATION_CATEGORIES,
  INITIAL_PROJECT_ITEMS,
  INITIAL_MOBILIZATION_ITEMS,
} from '@/types/sync.types';

// ============================================================================
// CATEGORIES MANAGEMENT
// ============================================================================

/**
 * Initialize sync categories if they don't exist
 */
export async function initSyncCategories(): Promise<void> {
  const existing = await db.syncCategories.count();
  if (existing > 0) return;

  const now = new Date().toISOString();
  const allCategories = [...PROJECT_CATEGORIES, ...MOBILIZATION_CATEGORIES].map(cat => ({
    ...cat,
    createdAt: now,
    updatedAt: now,
  }));

  await db.syncCategories.bulkAdd(allCategories);
}

/**
 * Get categories by dimension
 */
export async function getCategoriesByDimension(dimension: SyncDimension): Promise<SyncCategory[]> {
  return db.syncCategories
    .where('dimension')
    .equals(dimension)
    .sortBy('displayOrder');
}

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<SyncCategory[]> {
  return db.syncCategories.toArray();
}

// ============================================================================
// ITEMS MANAGEMENT
// ============================================================================

/**
 * Initialize sync items with default data if empty
 */
export async function initSyncItems(projectId: string): Promise<void> {
  const existing = await db.syncItems.where('projectId').equals(projectId).count();
  if (existing > 0) return;

  const now = new Date().toISOString();
  const allItems = [...INITIAL_PROJECT_ITEMS, ...INITIAL_MOBILIZATION_ITEMS].map(item => ({
    ...item,
    projectId,
    progressPercent: 0,
    weight: item.weight || 1,
    status: 'NOT_STARTED' as SyncItemStatus,
    createdAt: now,
    updatedAt: now,
  }));

  await db.syncItems.bulkAdd(allItems as SyncItem[]);
}

/**
 * Get all items for a project
 */
export async function getItemsByProject(projectId: string): Promise<SyncItem[]> {
  return db.syncItems.where('projectId').equals(projectId).toArray();
}

/**
 * Get items by project and category
 */
export async function getItemsByCategory(projectId: string, categoryId: string): Promise<SyncItem[]> {
  return db.syncItems
    .where('[projectId+categoryId]')
    .equals([projectId, categoryId])
    .toArray();
}

/**
 * Create a new sync item
 */
export async function createItem(item: Omit<SyncItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date().toISOString();
  return db.syncItems.add({
    ...item,
    createdAt: now,
    updatedAt: now,
  } as SyncItem);
}

/**
 * Update an existing sync item
 */
export async function updateItem(id: number, updates: Partial<SyncItem>): Promise<void> {
  await db.syncItems.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete a sync item
 */
export async function deleteItem(id: number): Promise<void> {
  await db.syncItems.delete(id);
}

/**
 * Update item progress
 */
export async function updateItemProgress(id: number, progress: number): Promise<void> {
  const status: SyncItemStatus =
    progress >= 100 ? 'COMPLETED' :
    progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';

  await updateItem(id, { progressPercent: progress, status });
}

// ============================================================================
// CALCULATION LOGIC
// ============================================================================

/**
 * Calculate weighted progress for a category
 */
export async function calculateCategoryProgress(
  projectId: string,
  categoryId: string
): Promise<number> {
  const items = await getItemsByCategory(projectId, categoryId);
  if (items.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  items.forEach(item => {
    weightedSum += item.progressPercent * item.weight;
    totalWeight += item.weight;
  });

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
}

/**
 * Calculate global progress for a dimension
 */
export async function calculateDimensionProgress(
  projectId: string,
  dimension: SyncDimension
): Promise<number> {
  const categories = await getCategoriesByDimension(dimension);
  if (categories.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const category of categories) {
    const categoryProgress = await calculateCategoryProgress(projectId, category.id);
    weightedSum += categoryProgress * category.weight;
    totalWeight += category.weight;
  }

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
}

/**
 * Calculate synchronization status
 */
export async function calculateSyncStatus(projectId: string): Promise<SyncStatusResult> {
  const projectProgress = await calculateDimensionProgress(projectId, 'PROJECT');
  const mobilizationProgress = await calculateDimensionProgress(projectId, 'MOBILIZATION');

  const gap = Math.round((projectProgress - mobilizationProgress) * 100) / 100;
  const absGap = Math.abs(gap);

  // Calculate days gap
  const gapDays = Math.round((absGap / 100) * SYNC_CONFIG.projectDurationDays);

  // Determine status and alert level
  let status: SyncStatusType;
  let alertLevel: SyncAlertLevel;

  if (absGap <= SYNC_CONFIG.thresholds.green) {
    status = 'SYNC';
    alertLevel = 'GREEN';
  } else if (absGap <= SYNC_CONFIG.thresholds.orange) {
    status = gap > 0 ? 'PROJECT_AHEAD' : 'MOBILIZATION_AHEAD';
    alertLevel = 'ORANGE';
  } else {
    status = absGap > SYNC_CONFIG.thresholds.red ? 'CRITICAL' : (gap > 0 ? 'PROJECT_AHEAD' : 'MOBILIZATION_AHEAD');
    alertLevel = 'RED';
  }

  return {
    projectProgress,
    mobilizationProgress,
    gap,
    gapDays,
    status,
    alertLevel,
  };
}

/**
 * Get category progress list for a dimension
 */
export async function getCategoryProgressList(
  projectId: string,
  dimension: SyncDimension
): Promise<CategoryProgress[]> {
  const categories = await getCategoriesByDimension(dimension);
  const result: CategoryProgress[] = [];

  for (const cat of categories) {
    const items = await getItemsByCategory(projectId, cat.id);
    const progress = await calculateCategoryProgress(projectId, cat.id);
    const completedCount = items.filter(i => i.status === 'COMPLETED').length;

    result.push({
      categoryId: cat.id,
      categoryCode: cat.code,
      categoryName: cat.name,
      progress,
      itemsCount: items.length,
      completedCount,
    });
  }

  return result;
}

// ============================================================================
// SNAPSHOTS
// ============================================================================

/**
 * Create a new snapshot
 */
export async function createSnapshot(projectId: string): Promise<number> {
  const syncStatus = await calculateSyncStatus(projectId);
  const projectDetails = await getCategoryProgressList(projectId, 'PROJECT');
  const mobilizationDetails = await getCategoryProgressList(projectId, 'MOBILIZATION');
  const now = new Date().toISOString();

  const snapshot: Omit<SyncSnapshot, 'id'> = {
    projectId,
    snapshotDate: now.split('T')[0],
    projectProgress: syncStatus.projectProgress,
    mobilizationProgress: syncStatus.mobilizationProgress,
    syncGap: syncStatus.gap,
    syncStatus: syncStatus.status,
    projectDetails,
    mobilizationDetails,
    createdAt: now,
  };

  return db.syncSnapshots.add(snapshot as SyncSnapshot);
}

/**
 * Get snapshot history
 */
export async function getSnapshotHistory(projectId: string, limit?: number): Promise<SyncSnapshot[]> {
  const query = db.syncSnapshots
    .where('projectId')
    .equals(projectId)
    .reverse();

  const snapshots = await query.toArray();
  return limit ? snapshots.slice(0, limit) : snapshots;
}

// ============================================================================
// ALERTS
// ============================================================================

/**
 * Get alerts for a project
 */
export async function getAlertsByProject(projectId: string, onlyActive = false): Promise<SyncAlert[]> {
  let alerts = await db.syncAlerts.where('projectId').equals(projectId).toArray();
  if (onlyActive) {
    alerts = alerts.filter(a => !a.isAcknowledged);
  }
  return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(id: number, by: string): Promise<void> {
  await db.syncAlerts.update(id, {
    isAcknowledged: true,
    acknowledgedBy: by,
    acknowledgedAt: new Date().toISOString(),
  });
}

/**
 * Identify problem categories
 */
async function identifyProblemCategories(
  projectId: string,
  syncStatus: SyncStatusResult
): Promise<SyncCategory[]> {
  const targetDimension: SyncDimension = syncStatus.gap > 0 ? 'MOBILIZATION' : 'PROJECT';
  const categories = await getCategoriesByDimension(targetDimension);
  const problems: SyncCategory[] = [];

  const avgProgress = syncStatus.gap > 0 ? syncStatus.mobilizationProgress : syncStatus.projectProgress;

  for (const cat of categories) {
    const progress = await calculateCategoryProgress(projectId, cat.id);
    if (progress < avgProgress - 5) {
      problems.push(cat);
    }
  }

  return problems;
}

/**
 * Generate recommended actions based on sync status
 */
function generateRecommendedActions(
  syncStatus: SyncStatusResult,
  problemCategories: SyncCategory[]
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];
  const priority: SyncPriority = syncStatus.alertLevel === 'RED' ? 'URGENT' : 'HIGH';

  if (syncStatus.status === 'PROJECT_AHEAD' || syncStatus.status === 'CRITICAL') {
    // Project > Mobilization: accelerate mobilization
    problemCategories
      .filter(c => c.dimension === 'MOBILIZATION')
      .forEach(cat => {
        actions.push({
          dimension: 'MOBILIZATION',
          categoryCode: cat.code,
          actionType: 'ACCELERATE',
          title: `Accélérer ${cat.name}`,
          priority,
        });
      });

    if (syncStatus.alertLevel === 'RED') {
      actions.push({
        dimension: 'PROJECT',
        categoryCode: 'GLOBAL',
        actionType: 'MONITOR',
        title: 'Évaluer possibilité de ralentir certains lots non critiques',
        priority: 'MEDIUM',
      });
    }
  } else if (syncStatus.status === 'MOBILIZATION_AHEAD') {
    // Mobilization > Project: accelerate project
    problemCategories
      .filter(c => c.dimension === 'PROJECT')
      .forEach(cat => {
        actions.push({
          dimension: 'PROJECT',
          categoryCode: cat.code,
          actionType: 'ACCELERATE',
          title: `Débloquer/Accélérer ${cat.name}`,
          priority,
        });
      });

    actions.push({
      dimension: 'MOBILIZATION',
      categoryCode: 'GLOBAL',
      actionType: 'OPTIMIZE',
      title: 'Différer certains engagements pour optimiser les coûts',
      priority: 'MEDIUM',
    });
  }

  return actions;
}

/**
 * Build alert title
 */
function buildAlertTitle(syncStatus: SyncStatusResult): string {
  if (syncStatus.status === 'CRITICAL') {
    return `CRITIQUE : Écart de synchronisation de ${Math.abs(syncStatus.gap).toFixed(0)}%`;
  }
  if (syncStatus.status === 'PROJECT_AHEAD') {
    return `Projet en avance de ${syncStatus.gap.toFixed(0)}% sur la Mobilisation`;
  }
  return `Mobilisation en avance de ${Math.abs(syncStatus.gap).toFixed(0)}% sur le Projet`;
}

/**
 * Build alert description
 */
function buildAlertDescription(syncStatus: SyncStatusResult, problemCategories: SyncCategory[]): string {
  const catNames = problemCategories.map(c => c.name).join(', ');
  if (syncStatus.status === 'PROJECT_AHEAD') {
    return `La construction avance plus vite que la préparation opérationnelle. Catégories en retard : ${catNames || 'N/A'}. Risque de ne pas être prêt à l'ouverture.`;
  }
  return `La mobilisation avance plus vite que le chantier. Catégories projet en retard : ${catNames || 'N/A'}. Optimiser les coûts en différant certains engagements.`;
}

/**
 * Generate sync alerts automatically
 */
export async function generateSyncAlerts(projectId: string): Promise<SyncAlert | null> {
  const syncStatus = await calculateSyncStatus(projectId);

  if (syncStatus.alertLevel === 'GREEN') return null;

  const problemCategories = await identifyProblemCategories(projectId, syncStatus);
  const recommendedActions = generateRecommendedActions(syncStatus, problemCategories);
  const now = new Date().toISOString();

  const alert: Omit<SyncAlert, 'id'> = {
    projectId,
    alertDate: now,
    alertType: syncStatus.alertLevel === 'RED' ? 'CRITICAL' : 'WARNING',
    dimension: syncStatus.gap > 0 ? 'MOBILIZATION' : 'PROJECT',
    title: buildAlertTitle(syncStatus),
    description: buildAlertDescription(syncStatus, problemCategories),
    recommendedActions,
    isAcknowledged: false,
    createdAt: now,
  };

  const id = await db.syncAlerts.add(alert as SyncAlert);
  return { ...alert, id } as SyncAlert;
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get actions for a project
 */
export async function getActionsByProject(projectId: string): Promise<SyncAction[]> {
  return db.syncActions
    .where('projectId')
    .equals(projectId)
    .toArray();
}

/**
 * Create a new corrective action
 */
export async function createAction(action: Omit<SyncAction, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date().toISOString();
  return db.syncActions.add({
    ...action,
    createdAt: now,
    updatedAt: now,
  } as SyncAction);
}

/**
 * Update action status
 */
export async function updateActionStatus(id: number, status: SyncActionStatus): Promise<void> {
  await db.syncActions.update(id, {
    status,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete an action
 */
export async function deleteAction(id: number): Promise<void> {
  await db.syncActions.delete(id);
}

// ============================================================================
// REPAIR: ADD MISSING DATES TO EXISTING ITEMS
// ============================================================================

/**
 * Repair existing sync items that lack planned dates by matching
 * them to the initial reference data by code.
 */
export async function repairSyncItemDates(projectId: string): Promise<number> {
  // Build a lookup map: code → { plannedStartDate, plannedEndDate }
  const dateMap = new Map<string, { start: string; end: string }>();
  [...INITIAL_PROJECT_ITEMS, ...INITIAL_MOBILIZATION_ITEMS].forEach(item => {
    if (item.code && item.plannedStartDate && item.plannedEndDate) {
      dateMap.set(item.code, { start: item.plannedStartDate, end: item.plannedEndDate });
    }
  });

  const items = await db.syncItems.where('projectId').equals(projectId).toArray();
  let repaired = 0;

  for (const item of items) {
    if (item.plannedStartDate && item.plannedEndDate) continue;

    const ref = dateMap.get(item.code);
    if (ref) {
      await db.syncItems.update(item.id!, {
        plannedStartDate: item.plannedStartDate || ref.start,
        plannedEndDate: item.plannedEndDate || ref.end,
        updatedAt: new Date().toISOString(),
      });
      repaired++;
    }
  }

  return repaired;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize sync module for a project
 */
export async function initSyncModule(projectId: string): Promise<void> {
  await initSyncCategories();
  await initSyncItems(projectId);
  await repairSyncItemDates(projectId);
}

/**
 * Get complete sync data for a project
 */
export async function getSyncData(projectId: string) {
  const [syncStatus, projectCategories, mobilizationCategories, alerts, actions, snapshots, items] = await Promise.all([
    calculateSyncStatus(projectId),
    getCategoryProgressList(projectId, 'PROJECT'),
    getCategoryProgressList(projectId, 'MOBILIZATION'),
    getAlertsByProject(projectId),
    getActionsByProject(projectId),
    getSnapshotHistory(projectId, 30),
    getItemsByProject(projectId),
  ]);

  return {
    syncStatus,
    projectCategories,
    mobilizationCategories,
    alerts,
    actions,
    snapshots,
    items,
  };
}
