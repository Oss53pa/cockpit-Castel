import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import { useAvancementParAxe } from '@/hooks';
import { AXE_LABELS, type Axe } from '@/types';
import type { Trend } from '@/lib/calculations';

const trendIcons: Record<Trend, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors: Record<Trend, string> = {
  up: 'text-success-500',
  down: 'text-error-500',
  stable: 'text-primary-400',
};

interface AxeProgressProps {
  axe: Axe;
  avancement: number;
  prevu: number;
  tendance: Trend;
  actionsTotal: number;
  actionsTerminees: number;
}

function AxeProgress({
  axe,
  avancement,
  prevu,
  tendance,
  actionsTotal,
  actionsTerminees,
}: AxeProgressProps) {
  const TrendIcon = trendIcons[tendance];
  const ecart = avancement - prevu;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-primary-700">
          {AXE_LABELS[axe]}
        </span>
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-xs font-medium px-1.5 py-0.5 rounded',
            ecart >= 0 ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'
          )}>
            {ecart >= 0 ? '+' : ''}{Math.round(ecart)}%
          </span>
          <TrendIcon className={cn('h-4 w-4', trendColors[tendance])} />
        </div>
      </div>

      {/* Double progress bar: Prévu vs Réalisé */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-primary-400 w-14">Prévu</span>
          <div className="flex-1 h-2 bg-primary-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-300 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(prevu, 100)}%` }}
            />
          </div>
          <span className="text-xs text-primary-500 w-10 text-right">{Math.round(prevu)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-primary-400 w-14">Réalisé</span>
          <div className="flex-1 h-2 bg-primary-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                avancement >= prevu ? 'bg-success-500' : 'bg-warning-500'
              )}
              style={{ width: `${Math.min(avancement, 100)}%` }}
            />
          </div>
          <span className="text-xs font-medium text-primary-700 w-10 text-right">{Math.round(avancement)}%</span>
        </div>
      </div>

      <div className="flex justify-between text-xs text-primary-400">
        <span>
          {actionsTerminees}/{actionsTotal} actions terminées
        </span>
      </div>
    </div>
  );
}

export function AvancementAxes() {
  const avancements = useAvancementParAxe();

  return (
    <Card padding="md">
      <h3 className="text-lg font-semibold text-primary-900 mb-4">
        Avancement par axe
      </h3>

      <div className="space-y-4">
        {avancements.map((item) => (
          <AxeProgress
            key={item.axe}
            axe={item.axe}
            avancement={item.avancement}
            prevu={item.prevu}
            tendance={item.tendance}
            actionsTotal={item.actionsTotal}
            actionsTerminees={item.actionsTerminees}
          />
        ))}
      </div>
    </Card>
  );
}
