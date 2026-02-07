/**
 * AxisSync - Synchronisation Construction vs Mobilisation
 * Affiché uniquement pour l'Axe 3 (Technique & Handover)
 *
 * Données via useSync():
 * - Avancement Construction CC (7 phases)
 * - Avancement Mobilisation
 * - Écart synchronisation
 * - Statut de synchronisation
 * - Jours d'écart
 * - Graphique comparatif
 */

import { useMemo } from 'react';
import {
  GitBranch,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Building2,
  Briefcase,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useSync, useSyncStatus } from '@/hooks/useSync';
import { useSiteStore } from '@/stores/siteStore';
import type { CategoryProgress, SyncStatusResult } from '@/types/sync.types';

interface AxisSyncProps {
  axeColor: string;
}

// Configuration des statuts de synchronisation
const syncStatusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  SYNCHRONIZED: { label: 'Synchronisé', color: 'text-success-600', bgColor: 'bg-success-100', icon: CheckCircle },
  MINOR_GAP: { label: 'Écart mineur', color: 'text-warning-600', bgColor: 'bg-warning-100', icon: Clock },
  SIGNIFICANT_GAP: { label: 'Écart significatif', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: AlertTriangle },
  CRITICAL_GAP: { label: 'Désynchronisé', color: 'text-error-600', bgColor: 'bg-error-100', icon: AlertTriangle },
};

// Configuration des niveaux d'alerte
const alertLevelConfig: Record<string, { label: string; color: string }> = {
  NONE: { label: 'Aucune', color: 'text-success-600' },
  LOW: { label: 'Faible', color: 'text-info-600' },
  MEDIUM: { label: 'Moyenne', color: 'text-warning-600' },
  HIGH: { label: 'Haute', color: 'text-orange-600' },
  CRITICAL: { label: 'Critique', color: 'text-error-600' },
};

export function AxisSync({ axeColor }: AxisSyncProps) {
  const { currentSiteId } = useSiteStore();
  const siteId = currentSiteId || 1;

  // Hook de synchronisation complet
  const {
    syncStatus,
    projectCategories,
    mobilizationCategories,
    alerts,
    loading,
    initialized,
  } = useSync(siteId, 'cosmos-angre');

  // Calculs dérivés
  const syncData = useMemo(() => {
    if (!syncStatus) {
      return {
        constructionProgress: 0,
        mobilizationProgress: 0,
        gap: 0,
        gapDays: 0,
        status: 'SYNCHRONIZED' as const,
        alertLevel: 'NONE' as const,
      };
    }

    return {
      constructionProgress: syncStatus.projectProgress || 0,
      mobilizationProgress: syncStatus.mobilizationProgress || 0,
      gap: syncStatus.gap || 0,
      gapDays: syncStatus.gapDays || 0,
      status: syncStatus.status || 'SYNCHRONIZED',
      alertLevel: syncStatus.alertLevel || 'NONE',
    };
  }, [syncStatus]);

  const statusConfig = syncStatusConfig[syncData.status] || syncStatusConfig.SYNCHRONIZED;
  const StatusIcon = statusConfig.icon;

  // Alertes actives (non acquittées)
  const activeAlerts = useMemo(() => {
    return alerts.filter(a => !a.isAcknowledged).slice(0, 5);
  }, [alerts]);

  if (loading && !initialized) {
    return (
      <Card padding="md">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="h-5 w-5" style={{ color: axeColor }} />
          <h3 className="text-lg font-semibold text-primary-900">
            Synchronisation Construction / Mobilisation
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card padding="md">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" style={{ color: axeColor }} />
          <h3 className="text-lg font-semibold text-primary-900">
            Synchronisation Construction / Mobilisation
          </h3>
        </div>
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full',
          statusConfig.bgColor
        )}>
          <StatusIcon className={cn('h-4 w-4', statusConfig.color)} />
          <span className={cn('text-sm font-medium', statusConfig.color)}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Construction CC */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Construction CC</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {syncData.constructionProgress.toFixed(0)}%
          </div>
          <p className="text-xs text-blue-600">7 phases</p>
        </div>

        {/* Mobilisation */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">Mobilisation</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {syncData.mobilizationProgress.toFixed(0)}%
          </div>
          <p className="text-xs text-purple-600">6 axes</p>
        </div>

        {/* Écart */}
        <div className={cn(
          'p-4 rounded-lg border',
          Math.abs(syncData.gap) <= 5 ? 'bg-success-50 border-success-200' :
          Math.abs(syncData.gap) <= 15 ? 'bg-warning-50 border-warning-200' :
          'bg-error-50 border-error-200'
        )}>
          <div className="flex items-center gap-2 mb-2">
            {syncData.gap >= 0 ? (
              <TrendingUp className={cn(
                'h-4 w-4',
                Math.abs(syncData.gap) <= 5 ? 'text-success-600' :
                Math.abs(syncData.gap) <= 15 ? 'text-warning-600' :
                'text-error-600'
              )} />
            ) : (
              <TrendingDown className={cn(
                'h-4 w-4',
                Math.abs(syncData.gap) <= 5 ? 'text-success-600' :
                Math.abs(syncData.gap) <= 15 ? 'text-warning-600' :
                'text-error-600'
              )} />
            )}
            <span className={cn(
              'text-xs font-medium',
              Math.abs(syncData.gap) <= 5 ? 'text-success-700' :
              Math.abs(syncData.gap) <= 15 ? 'text-warning-700' :
              'text-error-700'
            )}>Écart Sync</span>
          </div>
          <div className={cn(
            'text-2xl font-bold',
            Math.abs(syncData.gap) <= 5 ? 'text-success-900' :
            Math.abs(syncData.gap) <= 15 ? 'text-warning-900' :
            'text-error-900'
          )}>
            {syncData.gap >= 0 ? '+' : ''}{syncData.gap.toFixed(1)}%
          </div>
          <p className={cn(
            'text-xs',
            Math.abs(syncData.gap) <= 5 ? 'text-success-600' :
            Math.abs(syncData.gap) <= 15 ? 'text-warning-600' :
            'text-error-600'
          )}>
            {syncData.gap >= 0 ? 'Mobilisation en avance' : 'Construction en avance'}
          </p>
        </div>

        {/* Jours d'écart */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">Jours d'écart</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.abs(syncData.gapDays)}j
          </div>
          <p className="text-xs text-gray-600">
            {syncData.gapDays >= 0 ? 'd\'avance mobilisation' : 'de retard mobilisation'}
          </p>
        </div>
      </div>

      {/* Graphique comparatif */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Comparatif Construction vs Mobilisation</h4>

        {/* Barre Construction */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Construction CC</span>
            </div>
            <span className="text-sm font-bold text-blue-600">
              {syncData.constructionProgress.toFixed(0)}%
            </span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${syncData.constructionProgress}%` }}
            />
          </div>
        </div>

        {/* Barre Mobilisation */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Mobilisation</span>
            </div>
            <span className="text-sm font-bold text-purple-600">
              {syncData.mobilizationProgress.toFixed(0)}%
            </span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${syncData.mobilizationProgress}%` }}
            />
          </div>
        </div>

        {/* Indicateur d'écart */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-600">Construction</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-xs text-gray-600">Mobilisation</span>
          </div>
          <div className="text-xs text-gray-500">
            Écart: <span className={cn(
              'font-bold',
              Math.abs(syncData.gap) <= 5 ? 'text-success-600' :
              Math.abs(syncData.gap) <= 15 ? 'text-warning-600' :
              'text-error-600'
            )}>{syncData.gap >= 0 ? '+' : ''}{syncData.gap.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Détail des phases Construction */}
      {projectCategories.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            Phases Construction CC ({projectCategories.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {projectCategories.map((cat, index) => (
              <div
                key={cat.categoryId || index}
                className="p-2 bg-white rounded border text-center"
              >
                <p className="text-xs text-gray-500 truncate">{cat.categoryName || `Phase ${index + 1}`}</p>
                <p className={cn(
                  'text-lg font-bold',
                  cat.progress >= 80 ? 'text-success-600' :
                  cat.progress >= 50 ? 'text-warning-600' :
                  'text-error-600'
                )}>
                  {cat.progress.toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Détail des catégories Mobilisation */}
      {mobilizationCategories.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-purple-600" />
            Catégories Mobilisation ({mobilizationCategories.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {mobilizationCategories.map((cat, index) => (
              <div
                key={cat.categoryId || index}
                className="p-2 bg-white rounded border text-center"
              >
                <p className="text-xs text-gray-500 truncate">{cat.categoryName || `Catégorie ${index + 1}`}</p>
                <p className={cn(
                  'text-lg font-bold',
                  cat.progress >= 80 ? 'text-success-600' :
                  cat.progress >= 50 ? 'text-warning-600' :
                  'text-error-600'
                )}>
                  {cat.progress.toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertes de synchronisation */}
      {activeAlerts.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning-600" />
            Alertes de synchronisation ({activeAlerts.length})
          </h4>
          <div className="space-y-2">
            {activeAlerts.map((alert, index) => (
              <div
                key={alert.id || index}
                className="p-3 bg-warning-50 border border-warning-200 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-warning-800">{alert.title}</p>
                    {alert.description && (
                      <p className="text-xs text-warning-600 mt-1">{alert.description}</p>
                    )}
                    {alert.recommendedActions && alert.recommendedActions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-warning-700">Actions recommandées:</p>
                        <ul className="mt-1 space-y-1">
                          {alert.recommendedActions.slice(0, 2).map((action, i) => (
                            <li key={i} className="flex items-center gap-1 text-xs text-warning-600">
                              <ArrowRight className="h-3 w-3" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Niveau d'alerte global */}
      <div className="mt-4 pt-4 border-t flex items-center justify-between">
        <span className="text-sm text-gray-600">Niveau d'alerte global:</span>
        <Badge className={cn(
          alertLevelConfig[syncData.alertLevel]?.color || 'text-gray-600'
        )}>
          {alertLevelConfig[syncData.alertLevel]?.label || syncData.alertLevel}
        </Badge>
      </div>
    </Card>
  );
}

export default AxisSync;
