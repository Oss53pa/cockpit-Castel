import { Flag, Check, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge, Card } from '@/components/ui';
import { useJalons } from '@/hooks';
import { formatDate, getDaysUntil } from '@/lib/utils';
import { AXE_LABELS, type Jalon, type JalonStatus, type JalonFilters } from '@/types';

const statusIcons: Record<JalonStatus, typeof Flag> = {
  a_venir: Clock,
  en_approche: Clock,
  en_danger: AlertTriangle,
  atteint: Check,
  depasse: AlertTriangle,
  annule: Clock,
};

const statusColors: Record<JalonStatus, { bg: string; border: string; icon: string }> = {
  a_venir: { bg: 'bg-primary-100', border: 'border-primary-300', icon: 'text-primary-500' },
  en_approche: { bg: 'bg-warning-100', border: 'border-warning-300', icon: 'text-warning-500' },
  en_danger: { bg: 'bg-error-100', border: 'border-error-300', icon: 'text-error-500' },
  atteint: { bg: 'bg-success-100', border: 'border-success-300', icon: 'text-success-500' },
  depasse: { bg: 'bg-primary-800', border: 'border-primary-700', icon: 'text-primary-200' },
  annule: { bg: 'bg-gray-100', border: 'border-gray-300', icon: 'text-gray-500' },
};

interface JalonsTimelineProps {
  filters: JalonFilters;
  onView: (jalon: Jalon) => void;
}

export function JalonsTimeline({ filters, onView }: JalonsTimelineProps) {
  const jalons = useJalons(filters);

  return (
    <Card padding="md">
      <h3 className="text-lg font-semibold text-primary-900 mb-6">
        Chronologie des jalons
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-primary-200" />

        <div className="space-y-6">
          {jalons.map((jalon) => {
            const Icon = statusIcons[jalon.statut] || Clock;
            const colors = statusColors[jalon.statut] || statusColors.a_venir;
            const daysUntil = getDaysUntil(jalon.date_prevue);

            return (
              <div
                key={jalon.id}
                className="relative flex gap-4 cursor-pointer group"
                onClick={() => onView(jalon)}
              >
                {/* Timeline node */}
                <div
                  className={cn(
                    'relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2',
                    colors.bg,
                    colors.border,
                    'group-hover:scale-110 transition-transform'
                  )}
                >
                  <Icon className={cn('h-5 w-5', colors.icon)} />
                </div>

                {/* Content */}
                <div
                  className={cn(
                    'flex-1 rounded-lg border bg-white p-4 group-hover:shadow-md transition-shadow',
                    jalon.statut === 'atteint' && 'opacity-75'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-primary-900">{jalon.titre}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {AXE_LABELS[jalon.axe]}
                        </Badge>
                        <span className="text-xs text-primary-400">
                          {formatDate(jalon.date_prevue)}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant={
                        jalon.statut === 'atteint'
                          ? 'success'
                          : jalon.statut === 'en_danger' || jalon.statut === 'depasse'
                          ? 'error'
                          : jalon.statut === 'en_approche'
                          ? 'warning'
                          : 'secondary'
                      }
                    >
                      {jalon.statut === 'atteint'
                        ? 'Atteint'
                        : jalon.statut === 'depasse'
                        ? 'Dépassé'
                        : `J${daysUntil >= 0 ? `-${daysUntil}` : `+${Math.abs(daysUntil)}`}`}
                    </Badge>
                  </div>

                  <p className="text-sm text-primary-500 mt-2 line-clamp-2">
                    {jalon.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
