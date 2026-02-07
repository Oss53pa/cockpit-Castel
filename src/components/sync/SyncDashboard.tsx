/**
 * SyncDashboard - Dashboard de Synchronisation Projet/Mobilisation
 * Style unifié avec le Dashboard Opérationnel (Glassmorphism + Animations)
 */

import { useState, useEffect } from 'react';
import {
  RefreshCw,
  Camera,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Layers,
  Building2,
  Zap,
  Target,
  Clock,
  Sparkles,
  Activity,
  ArrowRight,
  Flag,
  Calendar,
} from 'lucide-react';
import { useSync } from '@/hooks/useSync';
import { cn } from '@/lib/utils';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  Button,
  Card,
  Tooltip,
} from '@/components/ui';
import { SyncGauge } from './SyncGauge';
import { SyncTimeline } from './SyncTimeline';
import { SyncCategoryList } from './SyncCategoryList';
import { SyncAlertBanner } from './SyncAlertBanner';
import { SyncActionList } from './SyncActionList';
import { SyncGanttHierarchical } from './SyncGanttHierarchical';
import { ConstructionCCView } from './ConstructionCCView';

type MainTab = 'sync' | 'gantt' | 'cc';
type SyncSubTab = 'overview' | 'project' | 'mobilization';

interface SyncDashboardProps {
  siteId?: number;
  projectId: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANTS INTERNES
// ═══════════════════════════════════════════════════════════════════════════════

// KPI Card avec animation
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof TrendingUp;
  progress?: number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  animationDelay?: number;
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  progress,
  trend,
  trendValue,
  variant = 'default',
  animationDelay = 0,
}: KPICardProps) {
  const variantStyles = {
    default: {
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      progressBg: 'bg-primary-500',
    },
    success: {
      iconBg: 'bg-success-100',
      iconColor: 'text-success-600',
      progressBg: 'bg-success-500',
    },
    warning: {
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-600',
      progressBg: 'bg-warning-500',
    },
    error: {
      iconBg: 'bg-error-100',
      iconColor: 'text-error-600',
      progressBg: 'bg-error-500',
    },
    info: {
      iconBg: 'bg-info-100',
      iconColor: 'text-info-600',
      progressBg: 'bg-info-500',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className="bg-white rounded-xl p-4 shadow-sm border border-primary-100 hover:shadow-md hover:border-primary-200 transition-all duration-300 animate-fade-slide-in"
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start justify-between">
        <div className={cn('p-2.5 rounded-xl', styles.iconBg)}>
          <Icon className={cn('h-5 w-5', styles.iconColor)} />
        </div>
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
              trend === 'up' && 'bg-success-100 text-success-700',
              trend === 'down' && 'bg-error-100 text-error-700',
              trend === 'stable' && 'bg-primary-100 text-primary-700'
            )}
          >
            {trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3" />}
            {trend === 'stable' && <ArrowRight className="h-3 w-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-primary-900">{value}</p>
        <p className="text-sm text-primary-500 mt-0.5">{title}</p>
        {subtitle && <p className="text-xs text-primary-400 mt-1">{subtitle}</p>}
      </div>
      {progress !== undefined && (
        <div className="mt-3">
          <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', styles.progressBg)}
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Header Glassmorphism pour la Synchronisation
function SyncGlassmorphismHeader({
  syncStatus,
  stats,
  activeAlerts,
  isVisible,
  onRefresh,
  onSnapshot,
  loading,
  isCreatingSnapshot,
}: {
  syncStatus: any;
  stats: any;
  activeAlerts: number;
  isVisible: boolean;
  onRefresh: () => void;
  onSnapshot: () => void;
  loading: boolean;
  isCreatingSnapshot: boolean;
}) {
  const gap = syncStatus?.gap || 0;
  const gapDays = syncStatus?.gapDays || 0;
  const alertLevel = syncStatus?.alertLevel || 'GREEN';

  // Determine status color based on gap
  const getStatusConfig = () => {
    if (Math.abs(gap) <= 5) {
      return {
        color: 'text-success-400',
        bg: 'bg-success-500',
        label: 'Synchronisé',
        icon: CheckCircle,
        glowColor: '#22c55e',
      };
    } else if (Math.abs(gap) <= 15) {
      return {
        color: 'text-warning-400',
        bg: 'bg-warning-500',
        label: 'Écart modéré',
        icon: AlertTriangle,
        glowColor: '#f59e0b',
      };
    } else {
      return {
        color: 'text-error-400',
        bg: 'bg-error-500',
        label: 'Désynchronisé',
        icon: AlertTriangle,
        glowColor: '#ef4444',
      };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl shadow-xl',
        isVisible ? 'animate-fade-slide-in' : 'opacity-0'
      )}
      style={{ animationFillMode: 'both' }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-purple-800 to-indigo-900" />
      <div className="absolute inset-0 glass-dark" />

      {/* Animated decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${10 + i * 15}%`,
              top: `${5 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.7}s`,
              opacity: 0.05,
            }}
          >
            <Sparkles className="w-12 h-12 text-white" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Title & Status */}
          <div
            className={cn('flex-1', isVisible ? 'animate-fade-slide-in-left' : 'opacity-0')}
            style={{ animationDelay: '100ms', animationFillMode: 'both' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                <Layers className="h-7 w-7 text-secondary-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Synchronisation</h2>
                <p className="text-indigo-200 text-sm">Projet Construction ↔ Mobilisation</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                  'bg-white/10 backdrop-blur-sm'
                )}
              >
                <StatusIcon className={cn('h-4 w-4', statusConfig.color)} />
                <span className={statusConfig.color}>{statusConfig.label}</span>
              </div>
              {gapDays !== 0 && (
                <div className="flex items-center gap-1.5 text-indigo-200 bg-white/5 px-3 py-1.5 rounded-full">
                  <Clock className="h-4 w-4" />
                  <span>
                    {Math.abs(gapDays)} jours {gapDays > 0 ? "d'avance" : 'de retard'}
                  </span>
                </div>
              )}
              {activeAlerts > 0 && (
                <div className="flex items-center gap-1.5 bg-error-500/20 px-3 py-1.5 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-error-400" />
                  <span className="text-error-400 font-semibold">{activeAlerts} alerte(s)</span>
                </div>
              )}
            </div>
          </div>

          {/* Center: Écart Sync (sans le CircularProgress confus) */}
          <div
            className={cn('flex items-center gap-4', isVisible ? 'animate-scale-in' : 'opacity-0')}
            style={{ animationDelay: '200ms', animationFillMode: 'both' }}
          >
            <div className="text-center px-5 py-3 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
              <p className="text-indigo-300 text-xs uppercase tracking-wider mb-1">Écart</p>
              <p className={cn('text-3xl font-bold', statusConfig.color)}>
                {gap > 0 ? '+' : ''}{gap.toFixed(0)}%
              </p>
              <div
                className={cn(
                  'inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-medium',
                  'bg-white/10 backdrop-blur-sm',
                  statusConfig.color
                )}
              >
                <Activity className="h-3 w-3" />
                {Math.abs(gap) <= 5 ? 'Synchronisé' : Math.abs(gap) <= 15 ? 'À surveiller' : 'Critique'}
              </div>
            </div>
          </div>

          {/* Right: Progress Cards */}
          <div
            className={cn('flex gap-4 lg:gap-5', isVisible ? 'animate-fade-slide-in' : 'opacity-0')}
            style={{ animationDelay: '300ms', animationFillMode: 'both' }}
          >
            <div className="text-center px-4 py-3 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <p className="text-2xl font-bold text-secondary-400">
                {syncStatus ? Math.round(syncStatus.projectProgress) : 0}%
              </p>
              <p className="text-xs text-indigo-300 font-medium">Construction</p>
            </div>
            <div className="text-center px-4 py-3 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <p className="text-2xl font-bold text-secondary-400">
                {syncStatus ? Math.round(syncStatus.mobilizationProgress) : 0}%
              </p>
              <p className="text-xs text-indigo-300 font-medium">Mobilisation</p>
            </div>
            <div className="text-center px-4 py-3 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <p className="text-2xl font-bold text-white">
                {stats ? stats.jalonsAtteints : 0}/{stats ? stats.totalJalons : 0}
              </p>
              <p className="text-xs text-indigo-300 font-medium">Jalons</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSnapshot}
            disabled={isCreatingSnapshot}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            {isCreatingSnapshot ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            Snapshot
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

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
  const [syncSubTab, setSyncSubTab] = useState<SyncSubTab>('overview');
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | 'ALL'>('3M');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger visibility animation
  useEffect(() => {
    if (initialized && !loading) {
      const timeout = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timeout);
    }
  }, [initialized, loading]);

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
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl opacity-30 bg-primary-500" />
          <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
        </div>
        <p className="text-primary-600 font-medium">Chargement de la synchronisation...</p>
      </div>
    );
  }

  const activeAlerts = alerts.filter((a) => !a.isAcknowledged);

  // Calculate KPIs
  const totalItems = stats ? stats.totalJalons + stats.totalActions : 0;
  const completedItems = stats ? stats.jalonsAtteints + stats.actionsTerminees : 0;
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const syncGap = syncStatus?.gap || 0;

  // Main tabs configuration
  const mainTabs = [
    { key: 'sync' as const, label: 'Synchronisation', icon: Layers },
    { key: 'cc' as const, label: 'Centre Commercial', icon: Building2 },
    { key: 'gantt' as const, label: 'Gantt Hiérarchique', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Glassmorphism */}
      <SyncGlassmorphismHeader
        syncStatus={syncStatus}
        stats={stats}
        activeAlerts={activeAlerts.length}
        isVisible={isVisible}
        onRefresh={refreshSync}
        onSnapshot={handleCreateSnapshot}
        loading={loading}
        isCreatingSnapshot={isCreatingSnapshot}
      />

      {/* Main Tabs */}
      <Tabs
        value={mainTab}
        onValueChange={(v) => setMainTab(v as MainTab)}
        className="space-y-4"
      >
        <TabsList
          className={cn(
            'w-full justify-start bg-white border border-primary-200 p-1 rounded-xl shadow-sm',
            isVisible ? 'animate-fade-slide-in' : 'opacity-0'
          )}
          style={{ animationDelay: '400ms', animationFillMode: 'both' }}
        >
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="flex items-center gap-2 px-4 py-2"
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Tab: Synchronisation */}
        <TabsContent value="sync" className="space-y-6">
          {/* KPIs Grid - Bento Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard
              title="Items Totaux"
              value={totalItems}
              subtitle="Jalons + Actions"
              icon={Target}
              variant="default"
              animationDelay={450}
            />
            <KPICard
              title="Complétés"
              value={completedItems}
              subtitle={`${completionRate}% du total`}
              icon={CheckCircle}
              progress={completionRate}
              variant="success"
              animationDelay={500}
            />
            <KPICard
              title="Jalons Atteints"
              value={`${stats?.jalonsAtteints || 0}/${stats?.totalJalons || 0}`}
              subtitle="Étapes clés"
              icon={Flag}
              progress={
                stats?.totalJalons
                  ? ((stats?.jalonsAtteints || 0) / stats.totalJalons) * 100
                  : 0
              }
              variant="info"
              animationDelay={550}
            />
            <KPICard
              title="Alertes Actives"
              value={activeAlerts.length}
              subtitle={activeAlerts.length === 0 ? 'Aucune alerte' : 'À traiter'}
              icon={AlertTriangle}
              variant={activeAlerts.length > 0 ? 'warning' : 'success'}
              animationDelay={600}
            />
            <KPICard
              title="Écart Sync"
              value={`${syncGap > 0 ? '+' : ''}${syncGap.toFixed(0)}%`}
              subtitle={Math.abs(syncGap) <= 5 ? 'Dans la norme' : 'Attention requise'}
              icon={Zap}
              trend={syncGap > 5 ? 'up' : syncGap < -5 ? 'down' : 'stable'}
              trendValue={`${Math.abs(syncGap).toFixed(0)}%`}
              variant={Math.abs(syncGap) <= 5 ? 'success' : Math.abs(syncGap) <= 15 ? 'warning' : 'error'}
              animationDelay={650}
            />
          </div>

          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <div
              className={cn(isVisible ? 'animate-fade-slide-in' : 'opacity-0')}
              style={{ animationDelay: '700ms', animationFillMode: 'both' }}
            >
              <SyncAlertBanner alerts={activeAlerts} onAcknowledge={acknowledgeAlert} />
            </div>
          )}

          {/* Sync Gauge */}
          {syncStatus && (
            <div
              className={cn(isVisible ? 'animate-fade-slide-in' : 'opacity-0')}
              style={{ animationDelay: '750ms', animationFillMode: 'both' }}
            >
              <SyncGauge
                projectProgress={syncStatus.projectProgress}
                mobilizationProgress={syncStatus.mobilizationProgress}
                gap={syncStatus.gap}
                gapDays={syncStatus.gapDays}
                alertLevel={syncStatus.alertLevel}
              />
            </div>
          )}

          {/* Sub-tabs for detailed views */}
          <Card
            padding="none"
            className={cn(isVisible ? 'animate-fade-slide-in' : 'opacity-0')}
            style={{ animationDelay: '800ms', animationFillMode: 'both' }}
          >
            <div className="border-b border-primary-100 bg-primary-50/50 px-4">
              <div className="flex">
                {[
                  { key: 'overview', label: 'Vue Globale' },
                  { key: 'project', label: 'Centre Commercial' },
                  { key: 'mobilization', label: 'Mobilisation' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSyncSubTab(tab.key as SyncSubTab)}
                    className={cn(
                      'px-6 py-3 font-medium border-b-2 transition-all duration-200',
                      syncSubTab === tab.key
                        ? 'border-primary-600 text-primary-700 bg-white'
                        : 'border-transparent text-primary-500 hover:text-primary-700 hover:bg-white/50'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="p-4">
              <div
                className={cn(
                  'grid gap-6',
                  syncSubTab === 'overview' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
                )}
              >
                {syncSubTab !== 'mobilization' && (
                  <SyncCategoryList
                    title="Centre Commercial (CC)"
                    dimension="PROJECT"
                    categories={projectCategories}
                    projectId={projectId}
                    overallProgress={syncStatus?.projectProgress}
                  />
                )}
                {syncSubTab !== 'project' && (
                  <SyncCategoryList
                    title="Mobilisation Opérationnelle"
                    dimension="MOBILIZATION"
                    categories={mobilizationCategories}
                    projectId={projectId}
                    overallProgress={syncStatus?.mobilizationProgress}
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <div
            className={cn(isVisible ? 'animate-fade-slide-in' : 'opacity-0')}
            style={{ animationDelay: '850ms', animationFillMode: 'both' }}
          >
            <SyncTimeline
              snapshots={snapshots}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </div>

          {/* Corrective Actions */}
          <div
            className={cn(isVisible ? 'animate-fade-slide-in' : 'opacity-0')}
            style={{ animationDelay: '900ms', animationFillMode: 'both' }}
          >
            <SyncActionList
              actions={actions.filter((a) => a.status !== 'CANCELLED')}
              projectId={projectId}
              onUpdateStatus={updateActionStatus}
            />
          </div>
        </TabsContent>

        {/* Tab: Centre Commercial */}
        <TabsContent value="cc">
          <div
            className={cn(isVisible ? 'animate-fade-slide-in' : 'opacity-0')}
            style={{ animationDelay: '450ms', animationFillMode: 'both' }}
          >
            <ConstructionCCView />
          </div>
        </TabsContent>

        {/* Tab: Gantt */}
        <TabsContent value="gantt">
          <div
            className={cn(isVisible ? 'animate-fade-slide-in' : 'opacity-0')}
            style={{ animationDelay: '450ms', animationFillMode: 'both' }}
          >
            <SyncGanttHierarchical projectId={projectId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SyncDashboard;
