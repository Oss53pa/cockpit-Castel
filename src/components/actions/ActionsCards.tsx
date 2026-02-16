import { CheckSquare, Calendar, User, MoreVertical, Eye, Edit, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  Badge,
  Button,
  Progress,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  EmptyState,
} from '@/components/ui';
import { useActions, deleteAction, usePermissions } from '@/hooks';
import { formatDate, getDaysUntil } from '@/lib/utils';
import {
  AXE_LABELS,
  ACTION_STATUS_LABELS,
  PRIORITE_LABELS,
  type Action,
  type ActionFilters,
  type ActionStatus,
} from '@/types';
import { logger } from '@/lib/logger';

const statusColors: Record<ActionStatus, { bg: string; text: string }> = {
  a_planifier: { bg: 'bg-gray-100', text: 'text-gray-700' },
  planifie: { bg: 'bg-primary-100', text: 'text-primary-700' },
  a_faire: { bg: 'bg-primary-200', text: 'text-primary-800' },
  en_cours: { bg: 'bg-info-100', text: 'text-info-700' },
  en_attente: { bg: 'bg-warning-100', text: 'text-warning-700' },
  bloque: { bg: 'bg-error-100', text: 'text-error-700' },
  en_validation: { bg: 'bg-purple-100', text: 'text-purple-700' },
  termine: { bg: 'bg-success-100', text: 'text-success-700' },
  annule: { bg: 'bg-gray-200', text: 'text-gray-600' },
  reporte: { bg: 'bg-orange-100', text: 'text-orange-700' },
};

const priorityColors: Record<string, string> = {
  critique: 'bg-error-500 text-white',
  haute: 'bg-orange-500 text-white',
  moyenne: 'bg-warning-500 text-white',
  basse: 'bg-primary-300 text-primary-800',
};

interface ActionsCardsProps {
  filters: ActionFilters;
  onEdit: (action: Action) => void;
  onView: (action: Action) => void;
  onAdd?: () => void;
}

function ActionCard({
  action,
  onEdit,
  onView,
}: {
  action: Action;
  onEdit: () => void;
  onView: () => void;
}) {
  const statusStyle = statusColors[action.statut] || statusColors.a_planifier;
  const daysUntil = getDaysUntil(action.date_fin_prevue);
  const { canEdit, canDelete } = usePermissions();

  const handleDelete = async () => {
    if (action.id && confirm('Supprimer cette action ?')) {
      try {
        await deleteAction(action.id);
      } catch (error) {
        logger.error('Erreur suppression action:', error);
        alert('Erreur lors de la suppression de l\'action');
      }
    }
  };

  return (
    <Card className="card-hover h-full flex flex-col" padding="md">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('rounded-lg p-2', statusStyle.bg)}>
          <CheckSquare className={cn('h-5 w-5', statusStyle.text)} />
        </div>
        <div className="flex items-center gap-1">
          {action.priorite && (
            <Badge className={cn('text-[10px]', priorityColors[action.priorite])}>
              {PRIORITE_LABELS[action.priorite]}
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                Voir
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-error-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <h3 className="font-semibold text-primary-900 mb-2 line-clamp-2">{action.titre}</h3>

      <div className="flex flex-wrap items-center gap-1 mb-3">
        <Badge variant="secondary" className="text-[10px]">{AXE_LABELS[action.axe]}</Badge>
        <Badge className={cn(statusStyle.bg, statusStyle.text, 'text-[10px]')}>
          {ACTION_STATUS_LABELS[action.statut] || 'À planifier'}
        </Badge>
      </div>

      {action.description && (
        <p className="text-sm text-primary-500 mb-3 line-clamp-2 flex-1">
          {action.description}
        </p>
      )}

      <div className="space-y-3 mt-auto">
        {/* Responsable */}
        {action.responsable && (
          <div className="flex items-center gap-2 text-sm text-primary-600">
            <User className="h-4 w-4" />
            <span className="truncate">{action.responsable}</span>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-primary-500">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(action.date_fin_prevue)}</span>
          </div>
          {action.statut !== 'termine' && action.statut !== 'annule' && (
            <Badge
              variant={daysUntil < 0 ? 'error' : daysUntil <= 7 ? 'warning' : 'secondary'}
              className="text-[10px]"
            >
              {daysUntil < 0 ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  +{Math.abs(daysUntil)}j
                </span>
              ) : (
                `J-${daysUntil}`
              )}
            </Badge>
          )}
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-xs text-primary-500 mb-1">
            <span>Avancement</span>
            <span>{action.avancement}%</span>
          </div>
          <Progress
            value={action.avancement}
            variant={action.avancement >= 80 ? 'success' : action.avancement >= 50 ? 'warning' : 'default'}
            size="sm"
          />
        </div>
      </div>
    </Card>
  );
}

export function ActionsCards({ filters, onEdit, onView, onAdd }: ActionsCardsProps) {
  const actions = useActions(filters);

  if (actions.length === 0) {
    return (
      <EmptyState
        icon={<CheckSquare className="h-12 w-12" />}
        title="Aucune action"
        description="Aucune action ne correspond à vos critères"
        action={onAdd ? { label: 'Créer une action', onClick: onAdd } : undefined}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {actions.map((action) => (
        <ActionCard
          key={action.id}
          action={action}
          onEdit={() => onEdit(action)}
          onView={() => onView(action)}
        />
      ))}
    </div>
  );
}
