import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, Badge, EmptyState, Button } from '@/components/ui';
import { useAlertesRecentes } from '@/hooks';
import { formatDateRelative } from '@/lib/utils';
import type { Criticite } from '@/types';

const criticiteColors: Record<Criticite, string> = {
  low: 'bg-primary-500',
  medium: 'bg-info-500',
  high: 'bg-warning-500',
  critical: 'bg-error-500',
};

export function AlertesRecentes() {
  const alertes = useAlertesRecentes(5);

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary-900">
          Alertes récentes
        </h3>
        <Link to="/alertes">
          <Button variant="ghost" size="sm">
            Voir tout
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {alertes.length === 0 ? (
        <EmptyState
          icon={<AlertCircle className="h-8 w-8" />}
          title="Aucune alerte"
          description="Tout va bien pour l'instant"
        />
      ) : (
        <div className="space-y-3">
          {alertes.map((alerte) => (
            <div
              key={alerte.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary-50 transition-colors"
            >
              <div
                className={cn(
                  'mt-1.5 h-2 w-2 rounded-full shrink-0',
                  criticiteColors[alerte.criticite]
                )}
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-900 truncate">
                  {alerte.titre}
                </p>
                <p className="text-xs text-primary-500 line-clamp-1">
                  {alerte.message}
                </p>
                <p className="text-[10px] text-primary-400 mt-1">
                  {formatDateRelative(alerte.createdAt)}
                </p>
              </div>

              <Badge
                variant={
                  alerte.criticite === 'critical'
                    ? 'error'
                    : alerte.criticite === 'high'
                    ? 'warning'
                    : 'secondary'
                }
                className="shrink-0"
              >
                {alerte.criticite}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
