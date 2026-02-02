/**
 * KPICard - Carte KPI réutilisable avec évolution
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  target?: number;
  evolution?: number; // % variation vs période précédente
  trend?: 'up' | 'down' | 'stable';
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const colorStyles = {
  primary: 'bg-primary-50 border-primary-200 text-primary-900',
  success: 'bg-success-50 border-success-200 text-success-900',
  warning: 'bg-warning-50 border-warning-200 text-warning-900',
  error: 'bg-error-50 border-error-200 text-error-900',
  info: 'bg-info-50 border-info-200 text-info-900',
};

const valueColorStyles = {
  primary: 'text-primary-600',
  success: 'text-success-600',
  warning: 'text-warning-600',
  error: 'text-error-600',
  info: 'text-info-600',
};

const sizeStyles = {
  sm: { card: 'p-3', value: 'text-xl', label: 'text-xs' },
  md: { card: 'p-4', value: 'text-2xl', label: 'text-sm' },
  lg: { card: 'p-6', value: 'text-4xl', label: 'text-base' },
};

export function KPICard({
  label,
  value,
  unit = '',
  target,
  evolution,
  trend,
  icon,
  color = 'primary',
  size = 'md',
}: KPICardProps) {
  const styles = sizeStyles[size];

  // Déterminer la tendance si non spécifiée
  const actualTrend = trend || (evolution !== undefined
    ? evolution > 0 ? 'up' : evolution < 0 ? 'down' : 'stable'
    : undefined);

  const TrendIcon = actualTrend === 'up' ? TrendingUp
    : actualTrend === 'down' ? TrendingDown
    : Minus;

  const trendColor = actualTrend === 'up' ? 'text-success-500'
    : actualTrend === 'down' ? 'text-error-500'
    : 'text-gray-400';

  // Calcul du pourcentage vs cible
  const progressPercent = target && typeof value === 'number'
    ? Math.min(100, (value / target) * 100)
    : null;

  return (
    <div className={cn(
      'rounded-lg border',
      colorStyles[color],
      styles.card
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn('font-medium text-gray-600', styles.label)}>
            {label}
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={cn('font-bold', valueColorStyles[color], styles.value)}>
              {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
            </span>
            {unit && (
              <span className="text-gray-500 text-sm">{unit}</span>
            )}
          </div>

          {/* Cible */}
          {target !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              Cible: {target.toLocaleString('fr-FR')}{unit}
            </p>
          )}
        </div>

        {/* Icône ou évolution */}
        <div className="flex flex-col items-end">
          {icon && (
            <div className={cn('p-2 rounded-lg', `bg-${color}-100`)}>
              {icon}
            </div>
          )}
          {evolution !== undefined && (
            <div className={cn('flex items-center gap-1 text-sm font-medium', trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span>{evolution > 0 ? '+' : ''}{evolution.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Barre de progression vers cible */}
      {progressPercent !== null && (
        <div className="mt-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                progressPercent >= 80 ? 'bg-success-500' :
                progressPercent >= 50 ? 'bg-warning-500' :
                'bg-error-500'
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">
            {progressPercent.toFixed(0)}% de l'objectif
          </p>
        </div>
      )}
    </div>
  );
}

export default KPICard;
