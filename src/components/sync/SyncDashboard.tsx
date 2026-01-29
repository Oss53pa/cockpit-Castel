import { useState } from 'react';
import { RefreshCw, Camera, Loader2, TrendingUp, AlertTriangle, CheckCircle, BarChart3, GitBranch, Layers, Network } from 'lucide-react';
import { useSync } from '@/hooks/useSync';
import { SyncGauge } from './SyncGauge';
import { SyncTimeline } from './SyncTimeline';
import { SyncCategoryList } from './SyncCategoryList';
import { SyncAlertBanner } from './SyncAlertBanner';
import { SyncActionList } from './SyncActionList';
import { SyncStatusBadge } from './SyncStatusBadge';
import { SyncGanttHierarchical } from './SyncGanttHierarchical';
import { SyncPertHierarchical } from './SyncPertHierarchical';
import { InterdependencyDiagram } from './interdependency';

type MainTab = 'sync' | 'gantt' | 'pert' | 'interdependency';

interface SyncDashboardProps {
  siteId?: number;
  projectId: string;
}

export const SyncDashboard: React.FC<SyncDashboardProps> = ({ siteId = 1, projectId }) => {
  const {
    syncStatus,
    projectCategories,
    mobilizationCategories,
    alerts,
    actions,
    snapshots,
    stats,
    loading,
    initialized,
    refreshSync,
    createSnapshot,
    acknowledgeAlert,
    updateActionStatus,
  } = useSync(siteId, projectId);

  const [mainTab, setMainTab] = useState<MainTab>('sync');
  const [selectedView, setSelectedView] = useState<'overview' | 'project' | 'mobilization'>('overview');
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | 'ALL'>('3M');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);

  const handleCreateSnapshot = async () => {
    setIsCreatingSnapshot(true);
    try {
      await createSnapshot();
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-2 text-gray-600">Chargement...</span>
      </div>
    );
  }

  const activeAlerts = alerts.filter((a) => !a.isAcknowledged);

  // Calculate KPIs from stats (real data)
  const totalItems = stats ? stats.totalJalons + stats.totalActions : 0;
  const completedItems = stats ? stats.jalonsAtteints + stats.actionsTerminees : 0;
  const blockedItems = stats?.axeEnRetard || stats?.phaseEnRetard ? 1 : 0; // Simplified

  // Main tabs configuration
  const mainTabs = [
    { key: 'sync' as const, label: 'Synchronisation', icon: Layers },
    { key: 'gantt' as const, label: 'Gantt', icon: BarChart3 },
    { key: 'pert' as const, label: 'PERT', icon: GitBranch },
    { key: 'interdependency' as const, label: 'Interdépendances', icon: Network },
  ];

  return (
    <div className="sync-dashboard space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Synchronisation Projet / Mobilisation</h2>
          {syncStatus && <SyncStatusBadge status={syncStatus} />}
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshSync}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={handleCreateSnapshot}
            disabled={isCreatingSnapshot}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isCreatingSnapshot ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            Snapshot
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setMainTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  mainTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

      </div>

      {/* Gantt Chart Tab - Hierarchical (AXE > JALON > ACTION) */}
      {mainTab === 'gantt' && (
        <SyncGanttHierarchical projectId={projectId} />
      )}

      {/* PERT Chart Tab - Hierarchical (AXE > JALON > ACTION) */}
      {mainTab === 'pert' && (
        <SyncPertHierarchical projectId={projectId} />
      )}

      {/* Interdependency Diagram Tab */}
      {mainTab === 'interdependency' && (
        <div className="bg-white rounded-xl shadow-sm border h-[calc(100vh-220px)]">
          <InterdependencyDiagram projectId={parseInt(projectId, 10)} />
        </div>
      )}

      {/* Sync Tab Content */}
      {mainTab === 'sync' && (
        <>
      {/* Quick Stats */}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Items Totaux</p>
              <p className="text-xl font-bold text-gray-900">{totalItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Complétés</p>
              <p className="text-xl font-bold text-gray-900">{completedItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Alertes Actives</p>
              <p className="text-xl font-bold text-gray-900">{activeAlerts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bloqués/Retard</p>
              <p className="text-xl font-bold text-gray-900">{blockedItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <SyncAlertBanner alerts={activeAlerts} onAcknowledge={acknowledgeAlert} />
      )}

      {/* Sync Gauge */}
      {syncStatus && (
        <SyncGauge
          projectProgress={syncStatus.projectProgress}
          mobilizationProgress={syncStatus.mobilizationProgress}
          gap={syncStatus.gap}
          gapDays={syncStatus.gapDays}
          alertLevel={syncStatus.alertLevel}
        />
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b">
        {[
          { key: 'overview', label: 'Vue Globale' },
          { key: 'project', label: 'Projet Construction' },
          { key: 'mobilization', label: 'Mobilisation' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedView(tab.key as typeof selectedView)}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              selectedView === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <SyncTimeline snapshots={snapshots} timeRange={timeRange} onTimeRangeChange={setTimeRange} />

      {/* Categories */}
      <div
        className={`grid gap-6 ${selectedView === 'overview' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}
      >
        {selectedView !== 'mobilization' && (
          <SyncCategoryList
            title="Projet de Construction"
            dimension="PROJECT"
            categories={projectCategories}
            projectId={projectId}
          />
        )}
        {selectedView !== 'project' && (
          <SyncCategoryList
            title="Mobilisation Opérationnelle"
            dimension="MOBILIZATION"
            categories={mobilizationCategories}
            projectId={projectId}
          />
        )}
      </div>

      {/* Corrective Actions */}
      <SyncActionList
        actions={actions.filter((a) => a.status !== 'CANCELLED')}
        projectId={projectId}
        onUpdateStatus={updateActionStatus}
      />
        </>
      )}
    </div>
  );
};

export default SyncDashboard;
