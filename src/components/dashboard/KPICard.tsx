import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progress?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  progress,
  variant = 'default',
}: KPICardProps) {
  const variantColors = {
    default: 'text-primary-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-600',
  };

  const variantBg = {
    default: 'bg-primary-50',
    success: 'bg-success-50',
    warning: 'bg-warning-50',
    error: 'bg-error-50',
  };

  const progressBarColors = {
    default: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
  };

  return (
    <Card className="card-hover overflow-hidden" padding="none">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-primary-500">{title}</p>
          <div className={cn('rounded-lg p-2', variantBg[variant])}>
            <Icon className={cn('h-4 w-4', variantColors[variant])} />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-primary-900">{value}</p>
          {trend && (
            <span
              className={cn(
                'text-xs font-medium px-1.5 py-0.5 rounded',
                trend.isPositive
                  ? 'bg-success-100 text-success-700'
                  : 'bg-error-100 text-error-700'
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
          )}
        </div>

        {subtitle && (
          <p className="mt-1 text-xs text-primary-400">{subtitle}</p>
        )}
      </div>

      {progress !== undefined && (
        <div className="h-1.5 bg-gray-100">
          <div
            className={cn('h-full transition-all duration-500', progressBarColors[variant])}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </Card>
  );
}
