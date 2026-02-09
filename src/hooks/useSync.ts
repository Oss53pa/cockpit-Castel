// ============================================================================
// SYNCHRONISATION CONSTRUCTION vs MOBILISATION - Hook V2
// Basé sur les vraies données de jalons et actions
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import * as syncServiceV2 from '@/services/syncServiceV2';
import type {
  SyncStatusResult,
  CategoryProgress,
  SyncAlert,
  SyncAction,
  SyncSnapshot,
  SyncCategory,
  SyncActionStatus,
  SyncDimension,
  SyncActionType,
  SyncPriority,
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
  categories: SyncCategory[];
  loading: boolean;
  initialized: boolean;

  // Statistics
  stats: {
    totalJalons: number;
    jalonsAtteints: number;
    totalActions: number;
    actionsTerminees: number;
    progressionMoyenne: number;
    axeEnRetard: string | null;
    phaseEnRetard: string | null;
  } | null;

  // Actions
  refreshSync: () => Promise<void>;
  acknowledgeAlert: (alertId: number) => Promise<void>;
  createSnapshot: () => Promise<void>;
  createAction: (action: Partial<SyncAction>) => Promise<void>;
  updateActionStatus: (actionId: number, status: SyncActionStatus) => Promise<void>;
  generateAlerts: () => Promise<void>;
}

export function useSync(siteId: number, projectId: string): UseSyncReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatusResult | null>(null);
  const [projectCategories, setProjectCategories] = useState<CategoryProgress[]>([]);
  const [mobilizationCategories, setMobilizationCategories] = useState<CategoryProgress[]>([]);
  const [categories, setCategories] = useState<SyncCategory[]>([]);
  const [stats, setStats] = useState<UseSyncReturn['stats']>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Live queries pour les données réactives
  const alerts = useLiveQuery(
    () => syncServiceV2.getAlertsByProjectV2(projectId),
    [projectId]
  ) ?? [];

  const actions = useLiveQuery(
    () => syncServiceV2.getActionsByProjectV2(projectId),
    [projectId]
  ) ?? [];

  const snapshots = useLiveQuery(
    () => syncServiceV2.getSnapshotHistoryV2(projectId, 30),
    [projectId]
  ) ?? [];

  // Live query pour les jalons et actions (déclenche le refresh quand ils changent)
  const jalons = useLiveQuery(
    () => db.jalons.where('siteId').equals(siteId).toArray(),
    [siteId]
  );

  const actionsData = useLiveQuery(
    () => db.actions.where('siteId').equals(siteId).toArray(),
    [siteId]
  );

  // Refresh sync calculations
  const refreshSync = useCallback(async () => {
    setLoading(true);
    try {
      const [status, projCats, mobCats, syncStats] = await Promise.all([
        syncServiceV2.calculateSyncStatusV2(siteId),
        syncServiceV2.getConstructionCategoryDetails(siteId),
        syncServiceV2.getMobilisationCategoryDetails(siteId),
        syncServiceV2.getSyncStatsV2(siteId),
      ]);

      setSyncStatus(status);
      setProjectCategories(projCats);
      setMobilizationCategories(mobCats);
      setStats(syncStats);
      setCategories(syncServiceV2.generateSyncCategories());
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  // Initialize on mount
  useEffect(() => {
    refreshSync()
      .then(() => setInitialized(true))
      .catch((error) => {
        console.error('[useSync] Error during initialization:', error);
        setInitialized(true); // Still mark as initialized to prevent infinite retries
      });
  }, [refreshSync]);

  // Refresh when jalons or actions change
  useEffect(() => {
    if (initialized && (jalons || actionsData)) {
      refreshSync();
    }
  }, [jalons, actionsData, initialized, refreshSync]);

  // Acknowledge alert
  const acknowledgeAlert = async (alertId: number) => {
    await syncServiceV2.acknowledgeAlertV2(alertId, 'current_user');
  };

  // Create snapshot
  const createSnapshot = async () => {
    await syncServiceV2.createSnapshotV2(siteId, projectId);
  };

  // Create corrective action
  const createAction = async (action: Partial<SyncAction>) => {
    if (!action.dimension || !action.title) {
      throw new Error('dimension and title are required');
    }

    await syncServiceV2.createActionV2({
      projectId,
      dimension: action.dimension as SyncDimension,
      actionType: (action.actionType || 'MONITOR') as SyncActionType,
      title: action.title,
      description: action.description,
      responsible: action.responsible,
      dueDate: action.dueDate,
      status: 'PENDING' as SyncActionStatus,
      priority: (action.priority || 'MEDIUM') as SyncPriority,
      categoryId: action.categoryId,
      alertId: action.alertId,
    });
  };

  // Update action status
  const updateActionStatus = async (actionId: number, status: SyncActionStatus) => {
    await syncServiceV2.updateActionStatusV2(actionId, status);
  };

  // Generate alerts
  const generateAlerts = async () => {
    await syncServiceV2.generateSyncAlertsV2(siteId, projectId);
  };

  return {
    syncStatus,
    projectCategories,
    mobilizationCategories,
    alerts,
    actions,
    snapshots,
    categories,
    loading,
    initialized,
    stats,
    refreshSync,
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
 * Hook for active alerts only
 */
export function useActiveSyncAlerts(projectId: string) {
  return useLiveQuery(
    () => syncServiceV2.getAlertsByProjectV2(projectId, true),
    [projectId]
  ) ?? [];
}

/**
 * Hook for pending actions only
 */
export function usePendingSyncActions(projectId: string) {
  const actions = useLiveQuery(
    () => syncServiceV2.getActionsByProjectV2(projectId),
    [projectId]
  ) ?? [];

  return actions.filter(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS');
}

/**
 * Hook pour obtenir les statistiques de synchronisation
 */
export function useSyncStats(siteId: number) {
  const [stats, setStats] = useState<{
    totalJalons: number;
    jalonsAtteints: number;
    totalActions: number;
    actionsTerminees: number;
    progressionMoyenne: number;
    axeEnRetard: string | null;
    phaseEnRetard: string | null;
  } | null>(null);

  const jalons = useLiveQuery(
    () => db.jalons.where('siteId').equals(siteId).toArray(),
    [siteId]
  );

  const actions = useLiveQuery(
    () => db.actions.where('siteId').equals(siteId).toArray(),
    [siteId]
  );

  useEffect(() => {
    if (jalons && actions) {
      syncServiceV2.getSyncStatsV2(siteId).then(setStats);
    }
  }, [siteId, jalons, actions]);

  return stats;
}

/**
 * Hook pour le statut de synchronisation uniquement (léger)
 */
export function useSyncStatus(siteId: number) {
  const [status, setStatus] = useState<SyncStatusResult | null>(null);

  const jalons = useLiveQuery(
    () => db.jalons.where('siteId').equals(siteId).toArray(),
    [siteId]
  );

  const actions = useLiveQuery(
    () => db.actions.where('siteId').equals(siteId).toArray(),
    [siteId]
  );

  useEffect(() => {
    if (jalons || actions) {
      syncServiceV2.calculateSyncStatusV2(siteId)
        .then(setStatus)
        .catch((error) => {
          console.error('[useSyncStatus] Error calculating sync status:', error);
          setStatus(null);
        });
    }
  }, [siteId, jalons, actions]);

  return status;
}
