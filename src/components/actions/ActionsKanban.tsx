import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge, PriorityBadge, UserAvatar, Button } from '@/components/ui';
import { useActions, updateActionStatus, useUser } from '@/hooks';
import { type Action, type ActionStatus, type ActionFilters } from '@/types';

interface ActionsKanbanProps {
  filters: ActionFilters;
  onEdit: (action: Action) => void;
  onView: (action: Action) => void;
  onAdd: () => void;
}

const columns: { id: ActionStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'À faire', color: 'bg-primary-100' },
  { id: 'in_progress', label: 'En cours', color: 'bg-info-100' },
  { id: 'done', label: 'Terminé', color: 'bg-success-100' },
  { id: 'blocked', label: 'Bloqué', color: 'bg-error-100' },
];

function KanbanCard({
  action,
  index,
  onClick,
}: {
  action: Action;
  index: number;
  onClick: () => void;
}) {
  const user = useUser(action.responsableId);

  return (
    <Draggable draggableId={String(action.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            'bg-white rounded-lg border p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow',
            snapshot.isDragging && 'shadow-lg'
          )}
          onClick={onClick}
        >
          <div className="flex items-start gap-2">
            <div
              {...provided.dragHandleProps}
              className="mt-1 text-primary-300 hover:text-primary-500"
            >
              <GripVertical className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary-900 truncate">
                {action.titre}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <PriorityBadge priority={action.priorite} />
                <span className="text-xs text-primary-400">
                  {action.avancement}%
                </span>
              </div>

              {user && (
                <div className="flex items-center gap-2 mt-2">
                  <UserAvatar
                    name={`${user.prenom} ${user.nom}`}
                    size="sm"
                    className="h-5 w-5"
                  />
                  <span className="text-xs text-primary-500">
                    {user.prenom}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function KanbanColumn({
  column,
  actions,
  onCardClick,
  onAdd,
}: {
  column: (typeof columns)[number];
  actions: Action[];
  onCardClick: (action: Action) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex-1 min-w-[280px]">
      <div className={cn('rounded-t-lg p-3', column.color)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-primary-900">{column.label}</h3>
          <Badge variant="secondary">{actions.length}</Badge>
        </div>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'min-h-[200px] bg-primary-50 p-2 rounded-b-lg transition-colors',
              snapshot.isDraggingOver && 'bg-primary-100'
            )}
          >
            {actions.map((action, index) => (
              <KanbanCard
                key={action.id}
                action={action}
                index={index}
                onClick={() => onCardClick(action)}
              />
            ))}
            {provided.placeholder}

            {column.id === 'todo' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAdd}
                className="w-full mt-2 border-2 border-dashed border-primary-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export function ActionsKanban({ filters, onView, onAdd }: ActionsKanbanProps) {
  const allActions = useActions(filters);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const actionId = parseInt(result.draggableId);
    const newStatus = result.destination.droppableId as ActionStatus;

    try {
      await updateActionStatus(actionId, newStatus);
    } catch (error) {
      console.error('Erreur changement statut:', error);
    }
  };

  const getColumnActions = (status: ActionStatus) =>
    allActions.filter((a) => a.statut === status);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            actions={getColumnActions(column.id)}
            onCardClick={onView}
            onAdd={onAdd}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
