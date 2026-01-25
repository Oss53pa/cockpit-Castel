// ============================================================================
// SYNCHRONISATION PROJET vs MOBILISATION - Hook
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import * as syncService from '@/services/syncService';
import type {
  SyncStatusResult,
  CategoryProgress,
  SyncAlert,
  SyncAction,
  SyncSnapshot,
  SyncItem,
  SyncCategory,
  SyncItemStatus,
  SyncActionStatus,
} from '@/types/sync.types';

// ============================================================================
// MAIN HOOK
// ============================================================================

interface UseSyncReturn {
  // State
  syncStatus: SyncStatusResult | null;
  projectCategories: CategoryProgress[];
  mobilizationCategories: CategoryProgress[];
  alerts: SyncAlert[];
  actions: SyncAction[];
  snapshots: SyncSnapshot[];
  items: SyncItem[];
  categories: SyncCategory[];
  loading: boolean;
  initialized: boolean;

  // Actions
  refreshSync: () => Promise<void>;
  initializeModule: () => Promise<void>;
  updateItemProgress: (itemId: number, progress: number) => Promise<void>;
  createItem: (item: Partial<SyncItem>) => Promise<void>;
  deleteItem: (itemId: number) => Promise<void>;
  acknowledgeAlert: (alertId: number) => Promise<void>;
  createSnapshot: () => Promise<void>;
  createAction: (action: Partial<SyncAction>) => Promise<void>;
  updateActionStatus: (actionId: number, status: SyncActionStatus) => Promise<void>;
  generateAlerts: () => Promise<void>;
}

export function useSync(projectId: string): UseSyncReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatusResult | null>(null);
  const [projectCategories, setProjectCategories] = useState<CategoryProgress[]>([]);
  const [mobilizationCategories, setMobilizationCategories] = useState<CategoryProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Live queries for reactive data
  const alerts = useLiveQuery(
    () => syncService.getAlertsByProject(projectId),
    [projectId]
  ) ?? [];

  const actions = useLiveQuery(
    () => syncService.getActionsByProject(projectId),
    [projectId]
  ) ?? [];

  const snapshots = useLiveQuery(
    () => syncService.getSnapshotHistory(projectId, 30),
    [projectId]
  ) ?? [];

  const itemsData = useLiveQuery(
    () => syncService.getItemsByProject(projectId),
    [projectId]
  );
  const items = itemsData ?? [];

  const categoriesData = useLiveQuery(
    () => syncService.getAllCategories(),
    []
  );
  const categories = categoriesData ?? [];

  // Refresh sync calculations
  const refreshSync = useCallback(async () => {
    setLoading(true);
    try {
      const [status, projCats, mobCats] = await Promise.all([
        syncService.calculateSyncStatus(projectId),
        syncService.getCategoryProgressList(projectId, 'PROJECT'),
        syncService.getCategoryProgressList(projectId, 'MOBILIZATION'),
      ]);

      setSyncStatus(status);
      setProjectCategories(projCats);
      setMobilizationCategories(mobCats);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Initialize the module
  const initializeModule = useCallback(async () => {
    await syncService.initSyncModule(projectId);
    setInitialized(true);
    await refreshSync();
  }, [projectId, refreshSync]);

  // Initialize on mount
  useEffect(() => {
    initializeModule();
  }, [initializeModule]);

  // Refresh when items change
  useEffect(() => {
    if (initialized && itemsData && itemsData.length > 0) {
      refreshSync();
    }
  }, [itemsData, initialized, refreshSync]);

  // Update item progress
  const updateItemProgress = async (itemId: number, progress: number) => {
    await syncService.updateItemProgress(itemId, progress);
  };

  // Create new item
  const createItem = async (item: Partial<SyncItem>) => {
    if (!item.categoryId || !item.name || !item.code) {
      throw new Error('categoryId, name, and code are required');
    }

    await syncService.createItem({
      projectId,
      categoryId: item.categoryId,
      code: item.code,
      name: item.name,
      description: item.description,
      plannedStartDate: item.plannedStartDate,
      plannedEndDate: item.plannedEndDate,
      progressPercent: item.progressPercent || 0,
      weight: item.weight || 1,
      status: 'NOT_STARTED' as SyncItemStatus,
      responsible: item.responsible,
      notes: item.notes,
    });
  };

  // Delete item
  const deleteItem = async (itemId: number) => {
    await syncService.deleteItem(itemId);
  };

  // Acknowledge alert
  const acknowledgeAlert = async (alertId: number) => {
    await syncService.acknowledgeAlert(alertId, 'current_user');
  };

  // Create snapshot
  const createSnapshot = async () => {
    await syncService.createSnapshot(projectId);
    await syncService.generateSyncAlerts(projectId);
  };

  // Create corrective action
  const createAction = async (action: Partial<SyncAction>) => {
    if (!action.dimension || !action.title) {
      throw new Error('dimension and title are required');
    }

    await syncService.createAction({
      projectId,
      dimension: action.dimension,
      actionType: action.actionType || 'MONITOR',
      title: action.title,
      description: action.description,
      responsible: action.responsible,
      dueDate: action.dueDate,
      status: 'PENDING' as SyncActionStatus,
      priority: action.priority || 'MEDIUM',
      categoryId: action.categoryId,
      alertId: action.alertId,
    });
  };

  // Update action status
  const updateActionStatus = async (actionId: number, status: SyncActionStatus) => {
    await syncService.updateActionStatus(actionId, status);
  };

  // Generate alerts
  const generateAlerts = async () => {
    await syncService.generateSyncAlerts(projectId);
  };

  return {
    syncStatus,
    projectCategories,
    mobilizationCategories,
    alerts,
    actions,
    snapshots,
    items,
    categories,
    loading,
    initialized,
    refreshSync,
    initializeModule,
    updateItemProgress,
    createItem,
    deleteItem,
    acknowledgeAlert,
    createSnapshot,
    createAction,
    updateActionStatus,
    generateAlerts,
  };
}

// ============================================================================
// SUPPLEMENTARY HOOKS
// ============================================================================

/**
 * Hook for items of a specific category
 */
export function useSyncCategoryItems(projectId: string, categoryId: string) {
  return useLiveQuery(
    () => syncService.getItemsByCategory(projectId, categoryId),
    [projectId, categoryId]
  ) ?? [];
}

/**
 * Hook for category details
 */
export function useSyncCategory(categoryId: string) {
  return useLiveQuery(
    () => db.syncCategories.get(categoryId),
    [categoryId]
  );
}

/**
 * Hook for active alerts only
 */
export function useActiveSyncAlerts(projectId: string) {
  return useLiveQuery(
    () => syncService.getAlertsByProject(projectId, true),
    [projectId]
  ) ?? [];
}

/**
 * Hook for pending actions only
 */
export function usePendingSyncActions(projectId: string) {
  const actions = useLiveQuery(
    () => syncService.getActionsByProject(projectId),
    [projectId]
  ) ?? [];

  return actions.filter(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS');
}
