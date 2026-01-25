import { Flag, Calendar, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge, ScrollArea } from '@/components/ui';
import { useJalons, useActionsByJalon } from '@/hooks';
import { formatDate, getDaysUntil } from '@/lib/utils';
import { AXE_LABELS, JALON_STATUSES, type Jalon, type JalonStatus, type JalonFilters } from '@/types';

const statusConfig: Record<JalonStatus, { color: string; bgColor: string; borderColor: string; label: string }> = {
  a_venir: { color: 'text-primary-600', bgColor: 'bg-primary-50', borderColor: 'border-primary-200', label: 'À venir' },
  en_approche: { color: 'text-warning-600', bgColor: 'bg-warning-50', borderColor: 'border-warning-200', label: 'En approche' },
  en_danger: { color: 'text-error-600', bgColor: 'bg-error-50', borderColor: 'border-error-200', label: 'En danger' },
  atteint: { color: 'text-success-600', bgColor: 'bg-success-50', borderColor: 'border-success-200', label: 'Atteint' },
  depasse: { color: 'text-primary-100', bgColor: 'bg-primary-800', borderColor: 'border-primary-700', label: 'Dépassé' },
  annule: { color: 'text-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', label: 'Annulé' },
};

interface JalonsKanbanProps {
  filters: JalonFilters;
  onEdit: (jalon: Jalon) => void;
  onView: (jalon: Jalon) => void;
}

function KanbanCard({ jalon, onView }: { jalon: Jalon; onView: () => void }) {
  const actions = useActionsByJalon(jalon.id);
  const daysUntil = getDaysUntil(jalon.date_prevue);
  const actionsTerminees = actions.filter((a) => a.statut === 'termine').length;

  return (
    <div
      className="bg-white rounded-lg border shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onView}
    >
      <div className="flex items-start gap-2 mb-2">
        <GripVertical className="h-4 w-4 text-primary-300 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-primary-900 line-clamp-2">{jalon.titre}</h4>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-2">
        <Badge variant="secondary" className="text-[10px]">{AXE_LABELS[jalon.axe]}</Badge>
      </div>

      <div className="flex items-center justify-between text-xs text-primary-500">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(jalon.date_prevue)}</span>
        </div>
        {jalon.statut !== 'atteint' && jalon.statut !== 'depasse' && (
          <Badge
            variant={daysUntil <= 7 ? 'error' : daysUntil <= 30 ? 'warning' : 'secondary'}
            className="text-[10px]"
          >
            J{daysUntil >= 0 ? `-${daysUntil}` : `+${Math.abs(daysUntil)}`}
          </Badge>
        )}
      </div>

      {actions.length > 0 && (
        <div className="mt-2 pt-2 border-t text-xs text-primary-400">
          {actionsTerminees}/{actions.length} actions terminées
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  status,
  jalons,
  onView,
}: {
  status: JalonStatus;
  jalons: Jalon[];
  onView: (jalon: Jalon) => void;
}) {
  const config = statusConfig[status] || statusConfig.a_venir;

  return (
    <div className={cn('flex flex-col min-w-[280px] max-w-[320px] rounded-lg border', config.borderColor)}>
      <div className={cn('p-3 rounded-t-lg border-b', config.bgColor, config.borderColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className={cn('h-4 w-4', config.color)} />
            <span className={cn('font-medium text-sm', config.color)}>{config.label}</span>
          </div>
          <Badge variant="secondary" className="text-xs">{jalons.length}</Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 p-2 max-h-[calc(100vh-300px)]">
        <div className="space-y-2">
          {jalons.length === 0 ? (
            <div className="text-center text-sm text-primary-400 py-8">
              Aucun jalon
            </div>
          ) : (
            jalons.map((jalon) => (
              <KanbanCard
                key={jalon.id}
                jalon={jalon}
                onView={() => onView(jalon)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function JalonsKanban({ filters, onView }: JalonsKanbanProps) {
  const jalons = useJalons(filters);

  // Group jalons by status
  const jalonsByStatus = JALON_STATUSES.reduce((acc, status) => {
    acc[status] = jalons.filter((j) => j.statut === status);
    return acc;
  }, {} as Record<JalonStatus, Jalon[]>);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {JALON_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            jalons={jalonsByStatus[status]}
            onView={onView}
          />
        ))}
      </div>
    </div>
  );
}
