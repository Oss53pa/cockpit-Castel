import { X, Bell, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores';
import { useAlertes, markAlerteLue, markAlerteTraitee, markAllAlertesLues } from '@/hooks';
import { Button, Badge, ScrollArea } from '@/components/ui';
import { formatDateRelative } from '@/lib/utils';
import type { Alerte } from '@/types';

function AlerteItem({ alerte }: { alerte: Alerte }) {
  const handleMarkRead = async () => {
    if (alerte.id) {
      await markAlerteLue(alerte.id);
    }
  };

  const handleMarkDone = async () => {
    if (alerte.id) {
      await markAlerteTraitee(alerte.id);
    }
  };

  return (
    <div
      className={cn(
        'p-3 border-b border-primary-100 transition-colors',
        !alerte.lu && 'bg-primary-50'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-1 h-2 w-2 rounded-full shrink-0',
            alerte.criticite === 'critical' && 'bg-error-500',
            alerte.criticite === 'high' && 'bg-warning-500',
            alerte.criticite === 'medium' && 'bg-info-500',
            alerte.criticite === 'low' && 'bg-primary-400'
          )}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-primary-900 truncate">
              {alerte.titre}
            </span>
            <Badge
              variant={
                alerte.criticite === 'critical'
                  ? 'error'
                  : alerte.criticite === 'high'
                  ? 'warning'
                  : alerte.criticite === 'medium'
                  ? 'info'
                  : 'secondary'
              }
              className="text-[10px] px-1.5 py-0"
            >
              {alerte.criticite}
            </Badge>
          </div>

          <p className="text-xs text-primary-600 line-clamp-2 mb-2">
            {alerte.message}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-primary-400">
              {formatDateRelative(alerte.createdAt)}
            </span>

            <div className="flex items-center gap-1">
              {!alerte.lu && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleMarkRead}
                  title="Marquer comme lu"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              {!alerte.traitee && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleMarkDone}
                  title="Marquer comme traité"
                >
                  <CheckCheck className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationPanel() {
  const { notificationsPanelOpen, setNotificationsPanelOpen } = useAppStore();
  const alertes = useAlertes({ traitee: false });

  const handleMarkAllRead = async () => {
    await markAllAlertesLues();
  };

  if (!notificationsPanelOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={() => setNotificationsPanelOpen(false)}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white shadow-xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-primary-900">
              Notifications
            </h2>
            {alertes.length > 0 && (
              <Badge variant="secondary">{alertes.length}</Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            {alertes.some((a) => !a.lu) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-xs"
              >
                Tout marquer lu
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setNotificationsPanelOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(100vh-60px)]">
          {alertes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-primary-300 mb-4" />
              <p className="text-sm text-primary-500">Aucune notification</p>
            </div>
          ) : (
            alertes.map((alerte) => (
              <AlerteItem key={alerte.id} alerte={alerte} />
            ))
          )}
        </ScrollArea>
      </div>
    </>
  );
}
