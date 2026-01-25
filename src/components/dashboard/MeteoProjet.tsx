import { Sun, CloudSun, Cloud, CloudRain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import { useMeteoProjet } from '@/hooks';
import type { MeteoProjet as MeteoType } from '@/types';

const meteoConfig: Record<
  MeteoType,
  { icon: typeof Sun; color: string; bgColor: string; label: string }
> = {
  vert: {
    icon: Sun,
    color: 'text-success-500',
    bgColor: 'bg-success-100',
    label: 'Favorable',
  },
  jaune: {
    icon: CloudSun,
    color: 'text-warning-500',
    bgColor: 'bg-warning-100',
    label: 'Attention',
  },
  orange: {
    icon: Cloud,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
    label: 'Vigilance',
  },
  rouge: {
    icon: CloudRain,
    color: 'text-error-500',
    bgColor: 'bg-error-100',
    label: 'Critique',
  },
};

export function MeteoProjetCard() {
  const meteo = useMeteoProjet();
  const config = meteoConfig[meteo];
  const Icon = config.icon;

  return (
    <Card className="card-hover" padding="md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-primary-500">Météo du projet</p>
          <p className="mt-2 text-xl font-bold text-primary-900">
            {config.label}
          </p>
          <p className="mt-1 text-xs text-primary-400">
            État général du projet
          </p>
        </div>

        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full',
            config.bgColor
          )}
        >
          <Icon className={cn('h-8 w-8', config.color)} />
        </div>
      </div>
    </Card>
  );
}
