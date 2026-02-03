import { ArrowLeftRight, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, Tooltip } from '@/components/ui';
import { useSynchronisationMetrics } from '@/hooks';
import { SYNC_STATUS_LABELS, SYNC_STATUS_STYLES, type SyncStatus } from '@/types';

const statusIcons: Record<SyncStatus, typeof CheckCircle> = {
  en_phase: CheckCircle,
  en_avance: AlertTriangle,
  en_retard: AlertTriangle,
  critique: XCircle,
};

const statusVariants: Record<SyncStatus, 'default' | 'success' | 'warning' | 'error'> = {
  en_phase: 'success',
  en_avance: 'warning',
  en_retard: 'warning',
  critique: 'error',
};

export function IndicateurSynchronisation() {
  const metrics = useSynchronisationMetrics();

  const StatusIcon = statusIcons[metrics.sync_status];
  const styles = SYNC_STATUS_STYLES[metrics.sync_status];
  const variant = statusVariants[metrics.sync_status];

  const variantColors = {
    default: 'text-primary-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-600',
  };

  const variantBg = {
    default: 'bg-primary-50',
    success: 'bg-success-50',
    warning: 'bg-warning-50',
    error: 'bg-error-50',
  };

  const progressBarColors = {
    default: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
  };

  // Calcul du pourcentage de synchronisation (100% = parfaitement en phase)
  const syncPercent = Math.max(0, 100 - Math.abs(metrics.ecart_points));

  return (
    <Card className="card-hover overflow-hidden" padding="none">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-primary-500">Sync. Actions</p>
            <Tooltip
              content={
                <div className="max-w-xs p-2 text-sm">
                  <p className="font-semibold mb-2">Avancement moyen des Actions</p>
                  <p className="text-gray-300 mb-2">
                    Compare l'avancement moyen de <strong>toutes les actions</strong> par catégorie :
                  </p>
                  <ul className="text-xs text-gray-400 space-y-1 mb-2">
                    <li><strong>Tech.</strong> = Actions Axe 3 (Technique)</li>
                    <li><strong>Mob.</strong> = Actions des 5 axes opérationnels (RH, Commercial, Budget, Marketing, Exploitation)</li>
                  </ul>
                  <p className="text-xs text-gray-500 border-t border-gray-600 pt-2 mt-2">
                    Différent de "Sync. CC/Mob." qui ne prend que le Centre Commercial.
                  </p>
                </div>
              }
            >
              <Info className="h-3.5 w-3.5 text-primary-400 cursor-help hover:text-primary-600 transition-colors" />
            </Tooltip>
          </div>
          <div className={cn('rounded-lg p-2', variantBg[variant])}>
            <ArrowLeftRight className={cn('h-4 w-4', variantColors[variant])} />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-primary-900">
            {Math.round(metrics.avancement_technique)}%
          </p>
          <span className="text-lg text-primary-400">/</span>
          <p className="text-2xl font-bold text-primary-900">
            {Math.round(metrics.avancement_mobilisation)}%
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-primary-400">Tech. / Mob.</span>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              styles.bg,
              styles.text
            )}
          >
            <StatusIcon className="w-3 h-3" />
            {SYNC_STATUS_LABELS[metrics.sync_status]}
          </span>
        </div>
      </div>

      <div className="h-1.5 bg-gray-100">
        <div
          className={cn('h-full transition-all duration-500', progressBarColors[variant])}
          style={{ width: `${syncPercent}%` }}
        />
      </div>
    </Card>
  );
}
