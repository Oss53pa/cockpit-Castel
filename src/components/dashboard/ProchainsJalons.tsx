import { Link } from 'react-router-dom';
import { Flag, ArrowRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, Badge, EmptyState, Button } from '@/components/ui';
import { useProchainsJalons } from '@/hooks';
import { formatDate, getDaysUntil } from '@/lib/utils';
import { AXE_LABELS } from '@/types';

const statusColors: Record<string, string> = {
  upcoming: 'bg-primary-100 text-primary-700',
  approaching: 'bg-warning-100 text-warning-700',
  at_risk: 'bg-error-100 text-error-700',
  achieved: 'bg-success-100 text-success-700',
  overdue: 'bg-primary-800 text-primary-100',
  a_venir: 'bg-primary-100 text-primary-700',
  en_approche: 'bg-warning-100 text-warning-700',
  en_danger: 'bg-error-100 text-error-700',
  atteint: 'bg-success-100 text-success-700',
  depasse: 'bg-primary-800 text-primary-100',
  annule: 'bg-gray-100 text-gray-500',
};

const defaultStatusColor = 'bg-primary-100 text-primary-700';

export function ProchainsJalons() {
  const jalons = useProchainsJalons(5);

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary-900">
          Prochains jalons
        </h3>
        <Link to="/jalons">
          <Button variant="ghost" size="sm">
            Voir tout
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {jalons.length === 0 ? (
        <EmptyState
          icon={<Flag className="h-8 w-8" />}
          title="Aucun jalon"
          description="Aucun jalon à venir"
        />
      ) : (
        <div className="space-y-3">
          {jalons.map((jalon) => {
            const daysUntil = getDaysUntil(jalon.date_prevue);
            const colors = statusColors[jalon.statut] || defaultStatusColor;
            const colorClasses = colors.split(' ');

            return (
              <div
                key={jalon.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    colorClasses[0]
                  )}
                >
                  <Flag
                    className={cn(
                      'h-5 w-5',
                      colorClasses[1]
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary-900 truncate">
                    {jalon.titre}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-primary-500">
                    <span>{AXE_LABELS[jalon.axe]}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(jalon.date_prevue)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <Badge className={colors}>
                    {daysUntil === 0
                      ? "Aujourd'hui"
                      : daysUntil === 1
                      ? 'Demain'
                      : `J-${daysUntil}`}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
