/**
 * WeeklySync - KPI de synchronisation pour le rapport hebdomadaire
 *
 * Affiche:
 * - Écart Construction/Mobilisation
 * - Alerte si écart > 15%
 * - Tendance vs semaine précédente
 */

import { useMemo } from 'react';
import {
  GitBranch,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useSync } from '@/hooks/useSync';
import { useSiteStore } from '@/stores/siteStore';

interface WeeklySyncProps {
  className?: string;
}

export function WeeklySync({ className }: WeeklySyncProps) {
  const { currentSiteId } = useSiteStore();
  const siteId = currentSiteId || 1;

  const {
    syncStatus,
    snapshots,
    loading,
    initialized,
  } = useSync(siteId, 'cosmos-angre');

  // Calcul de la tendance vs semaine précédente
  const trendData = useMemo(() => {
    if (!syncStatus || snapshots.length < 2) {
      return { trend: 'stable' as const, variation: 0 };
    }

    // Trouver le snapshot de la semaine dernière
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const previousSnapshot = snapshots.find(s => {
      const snapDate = new Date(s.snapshotDate);
      return snapDate <= oneWeekAgo;
    });

    if (!previousSnapshot) {
      return { trend: 'stable' as const, variation: 0 };
    }

    const currentGap = Math.abs(syncStatus.gap || 0);
    const previousGap = Math.abs(previousSnapshot.gap || 0);
    const variation = currentGap - previousGap;

    return {
      trend: variation < -1 ? 'improving' as const :
             variation > 1 ? 'degrading' as const :
             'stable' as const,
      variation: variation,
      previousGap,
    };
  }, [syncStatus, snapshots]);

  if (loading && !initialized) {
    return (
      <Card padding="md" className={className}>
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary-500" />
          <span className="text-sm font-medium">Chargement sync...</span>
        </div>
      </Card>
    );
  }

  const gap = syncStatus?.gap || 0;
  const absGap = Math.abs(gap);
  const isAlert = absGap > 15;
  const isWarning = absGap > 10 && absGap <= 15;

  const TrendIcon = trendData.trend === 'improving' ? TrendingDown :
                    trendData.trend === 'degrading' ? TrendingUp :
                    Minus;

  return (
    <Card
      padding="md"
      className={cn(
        className,
        isAlert ? 'border-error-300 bg-error-50' :
        isWarning ? 'border-warning-300 bg-warning-50' :
        'border-success-300 bg-success-50'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            isAlert ? 'bg-error-100' :
            isWarning ? 'bg-warning-100' :
            'bg-success-100'
          )}>
            <GitBranch className={cn(
              'h-5 w-5',
              isAlert ? 'text-error-600' :
              isWarning ? 'text-warning-600' :
              'text-success-600'
            )} />
          </div>
          <div>
            <p className="text-xs text-gray-600">Écart Sync Construction/Mobilisation</p>
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-2xl font-bold',
                isAlert ? 'text-error-700' :
                isWarning ? 'text-warning-700' :
                'text-success-700'
              )}>
                {gap >= 0 ? '+' : ''}{gap.toFixed(1)}%
              </span>
              {isAlert && (
                <Badge variant="error" className="animate-pulse">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Alerte
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Tendance */}
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">vs S-1</p>
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium',
            trendData.trend === 'improving' ? 'text-success-600' :
            trendData.trend === 'degrading' ? 'text-error-600' :
            'text-gray-500'
          )}>
            <TrendIcon className="h-4 w-4" />
            <span>
              {trendData.trend === 'improving' ? 'Amélioration' :
               trendData.trend === 'degrading' ? 'Dégradation' :
               'Stable'}
            </span>
          </div>
          {trendData.variation !== 0 && (
            <p className="text-xs text-gray-500">
              {trendData.variation > 0 ? '+' : ''}{trendData.variation.toFixed(1)}%
            </p>
          )}
        </div>
      </div>

      {/* Détail Construction vs Mobilisation */}
      <div className="mt-4 pt-3 border-t border-gray-200 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500">Construction CC</p>
          <p className="text-lg font-semibold text-blue-600">
            {(syncStatus?.projectProgress || 0).toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Mobilisation</p>
          <p className="text-lg font-semibold text-purple-600">
            {(syncStatus?.mobilizationProgress || 0).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Message d'alerte si écart > 15% */}
      {isAlert && (
        <div className="mt-3 p-2 bg-error-100 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-error-600 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-error-700">
              Écart critique détecté ({absGap.toFixed(1)}% &gt; 15%)
            </p>
            <p className="text-xs text-error-600">
              Action corrective requise pour resynchroniser les dimensions.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

export default WeeklySync;
