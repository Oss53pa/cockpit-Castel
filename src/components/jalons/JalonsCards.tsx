import { Flag, Calendar, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
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
import { useJalons, useActionsByJalon, deleteJalon } from '@/hooks';
import { formatDate, getDaysUntil } from '@/lib/utils';
import { AXE_LABELS, type Jalon, type JalonStatus, type JalonFilters } from '@/types';

const statusConfig: Record<JalonStatus, { color: string; bgColor: string; label: string }> = {
  a_venir: { color: 'text-primary-600', bgColor: 'bg-primary-100', label: 'À venir' },
  en_approche: { color: 'text-warning-600', bgColor: 'bg-warning-100', label: 'En approche' },
  en_danger: { color: 'text-error-600', bgColor: 'bg-error-100', label: 'En danger' },
  atteint: { color: 'text-success-600', bgColor: 'bg-success-100', label: 'Atteint' },
  depasse: { color: 'text-primary-100', bgColor: 'bg-primary-800', label: 'Dépassé' },
  annule: { color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Annulé' },
};

interface JalonsCardsProps {
  filters: JalonFilters;
  onEdit: (jalon: Jalon) => void;
  onView: (jalon: Jalon) => void;
}

function JalonCard({
  jalon,
  onEdit,
  onView,
}: {
  jalon: Jalon;
  onEdit: () => void;
  onView: () => void;
}) {
  const actions = useActionsByJalon(jalon.id);
  const config = statusConfig[jalon.statut] || statusConfig.a_venir;
  const daysUntil = getDaysUntil(jalon.date_prevue);

  const actionsTerminees = actions.filter((a) => a.statut === 'termine').length;
  const avancement =
    actions.length > 0
      ? actions.reduce((sum, a) => sum + a.avancement, 0) / actions.length
      : 0;

  const handleDelete = async () => {
    if (jalon.id && confirm('Supprimer ce jalon ?')) {
      await deleteJalon(jalon.id);
    }
  };

  return (
    <Card className="card-hover h-full flex flex-col" padding="md">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('rounded-lg p-2', config.bgColor)}>
          <Flag className={cn('h-5 w-5', config.color)} />
        </div>
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
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-error-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className="font-semibold text-primary-900 mb-2 line-clamp-2">{jalon.titre}</h3>

      <div className="flex items-center gap-2 mb-3">
        <Badge variant="secondary" className="text-xs">{AXE_LABELS[jalon.axe]}</Badge>
        <Badge className={cn(config.bgColor, config.color, 'text-xs')}>
          {config.label}
        </Badge>
      </div>

      <p className="text-sm text-primary-500 mb-4 line-clamp-2 flex-1">
        {jalon.description}
      </p>

      <div className="space-y-3 mt-auto">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-primary-500">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(jalon.date_prevue)}</span>
          </div>
          {jalon.statut !== 'atteint' && jalon.statut !== 'depasse' && (
            <Badge
              variant={daysUntil <= 7 ? 'error' : daysUntil <= 30 ? 'warning' : 'secondary'}
            >
              J{daysUntil >= 0 ? `-${daysUntil}` : `+${Math.abs(daysUntil)}`}
            </Badge>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-primary-500 mb-1">
            <span>{actionsTerminees}/{actions.length} actions</span>
            <span>{Math.round(avancement)}%</span>
          </div>
          <Progress
            value={avancement}
            variant={avancement >= 80 ? 'success' : avancement >= 50 ? 'warning' : 'default'}
            size="sm"
          />
        </div>
      </div>
    </Card>
  );
}

export function JalonsCards({ filters, onEdit, onView }: JalonsCardsProps) {
  const jalons = useJalons(filters);

  if (jalons.length === 0) {
    return (
      <EmptyState
        icon={<Flag className="h-12 w-12" />}
        title="Aucun jalon"
        description="Aucun jalon ne correspond à vos critères"
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {jalons.map((jalon) => (
        <JalonCard
          key={jalon.id}
          jalon={jalon}
          onEdit={() => onEdit(jalon)}
          onView={() => onView(jalon)}
        />
      ))}
    </div>
  );
}
