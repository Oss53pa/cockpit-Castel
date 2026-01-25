import React from 'react';
import { AlertTriangle, X, Check, ChevronRight } from 'lucide-react';
import { SYNC_CONFIG } from '@/config/syncConfig';
import type { SyncAlert } from '@/types/sync.types';

interface SyncAlertBannerProps {
  alerts: SyncAlert[];
  onAcknowledge: (alertId: number) => void;
  onViewDetails?: (alert: SyncAlert) => void;
}

export const SyncAlertBanner: React.FC<SyncAlertBannerProps> = ({
  alerts,
  onAcknowledge,
  onViewDetails,
}) => {
  if (alerts.length === 0) return null;

  const criticalAlerts = alerts.filter((a) => a.alertType === 'CRITICAL');
  const warningAlerts = alerts.filter((a) => a.alertType === 'WARNING');

  const getAlertStyle = (type: string) => {
    if (type === 'CRITICAL') {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-500',
        title: 'text-red-800',
        text: 'text-red-700',
        button: 'bg-red-100 hover:bg-red-200 text-red-700',
      };
    }
    return {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'text-orange-500',
      title: 'text-orange-800',
      text: 'text-orange-700',
      button: 'bg-orange-100 hover:bg-orange-200 text-orange-700',
    };
  };

  return (
    <div className="space-y-3">
      {/* Critical Alerts */}
      {criticalAlerts.map((alert) => {
        const style = getAlertStyle('CRITICAL');
        return (
          <div
            key={alert.id}
            className={`${style.bg} ${style.border} border rounded-xl p-4`}
          >
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 ${style.icon}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={`font-semibold ${style.title}`}>{alert.title}</h4>
                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">
                    CRITIQUE
                  </span>
                </div>
                {alert.description && (
                  <p className={`mt-1 text-sm ${style.text}`}>{alert.description}</p>
                )}
                {alert.recommendedActions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {alert.recommendedActions.slice(0, 3).map((action, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                          SYNC_CONFIG.priorityStyles[action.priority].bg
                        } ${SYNC_CONFIG.priorityStyles[action.priority].text}`}
                      >
                        {SYNC_CONFIG.actionTypeLabels[action.actionType]}: {action.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails(alert)}
                    className={`p-1.5 rounded-lg ${style.button} transition-colors`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
                {alert.id && (
                  <button
                    onClick={() => onAcknowledge(alert.id!)}
                    className={`p-1.5 rounded-lg ${style.button} transition-colors`}
                    title="Marquer comme traité"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Warning Alerts */}
      {warningAlerts.map((alert) => {
        const style = getAlertStyle('WARNING');
        return (
          <div
            key={alert.id}
            className={`${style.bg} ${style.border} border rounded-xl p-4`}
          >
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 ${style.icon}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold ${style.title}`}>{alert.title}</h4>
                {alert.description && (
                  <p className={`mt-1 text-sm ${style.text}`}>{alert.description}</p>
                )}
                {alert.recommendedActions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {alert.recommendedActions.slice(0, 2).map((action, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700"
                      >
                        {action.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails(alert)}
                    className={`p-1.5 rounded-lg ${style.button} transition-colors`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
                {alert.id && (
                  <button
                    onClick={() => onAcknowledge(alert.id!)}
                    className={`p-1.5 rounded-lg ${style.button} transition-colors`}
                    title="Marquer comme traité"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SyncAlertBanner;
