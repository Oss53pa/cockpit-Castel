import { Link } from 'react-router-dom';
import { Clock, ArrowRight, AlertTriangle } from 'lucide-react';
import { Card, Badge, EmptyState, Button, UserAvatar } from '@/components/ui';
import { useActionsEnRetard, useUser } from '@/hooks';
import { getActionDaysLate } from '@/lib/calculations';
import { AXE_LABELS, PRIORITY_LABELS, type Priority } from '@/types';

const priorityColors: Record<Priority, string> = {
  low: 'secondary',
  medium: 'info',
  high: 'warning',
  critical: 'error',
} as const;

function ActionEnRetardItem({ action }: { action: ReturnType<typeof useActionsEnRetard>[number] }) {
  const user = useUser(action.responsableId);
  const daysLate = getActionDaysLate(action);

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary-50 transition-colors">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error-100">
        <Clock className="h-5 w-5 text-error-600" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary-900 truncate">
          {action.titre}
        </p>
        <div className="flex items-center gap-2 text-xs text-primary-500">
          <span>{AXE_LABELS[action.axe]}</span>
          {user && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <UserAvatar name={`${user.prenom} ${user.nom}`} size="sm" className="h-4 w-4" />
                {user.prenom}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={priorityColors[action.priorite] as 'secondary' | 'info' | 'warning' | 'error'}>
          {PRIORITY_LABELS[action.priorite]}
        </Badge>
        <Badge variant="error">
          +{daysLate}j
        </Badge>
      </div>
    </div>
  );
}

export function ActionsEnRetard() {
  const actions = useActionsEnRetard();
  const displayedActions = actions.slice(0, 5);

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-primary-900">
            Actions en retard
          </h3>
          {actions.length > 0 && (
            <Badge variant="error">{actions.length}</Badge>
          )}
        </div>
        <Link to="/actions?filter=late">
          <Button variant="ghost" size="sm">
            Voir tout
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {actions.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8" />}
          title="Aucun retard"
          description="Toutes les actions sont dans les temps"
        />
      ) : (
        <div className="space-y-2">
          {displayedActions.map((action) => (
            <ActionEnRetardItem key={action.id} action={action} />
          ))}
        </div>
      )}
    </Card>
  );
}
