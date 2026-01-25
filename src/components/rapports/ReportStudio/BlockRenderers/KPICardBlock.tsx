import React from 'react';
import { TrendingUp, TrendingDown, Minus, Edit2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { KPICardBlock as KPICardBlockType } from '@/types/reportStudio';

interface KPICardBlockProps {
  block: KPICardBlockType;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}

export function KPICardBlock({
  block,
  isSelected,
  onSelect,
  onEdit,
}: KPICardBlockProps) {
  const formatValue = (value: number): string => {
    switch (block.format) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return `${value.toFixed(1)}%`;
      default:
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}k`;
        }
        return value.toLocaleString('fr-FR');
    }
  };

  const getStatusColor = (): string => {
    if (!block.thresholds) return 'text-gray-600';

    const value = block.value;
    if (value >= block.thresholds.green) return 'text-green-600';
    if (value >= block.thresholds.orange) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBgColor = (): string => {
    if (!block.thresholds) return 'bg-gray-50';

    const value = block.value;
    if (value >= block.thresholds.green) return 'bg-green-50';
    if (value >= block.thresholds.orange) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getVariationIcon = () => {
    if (!block.variation) return null;

    switch (block.variation.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getVariationColor = (): string => {
    if (!block.variation) return 'text-gray-500';
    if (block.variation.isPositive) return 'text-green-600';
    return 'text-red-600';
  };

  const sparklineData = block.sparklineData?.map((value, index) => ({
    value,
    index,
  }));

  const progressPercent = block.targetValue
    ? Math.min(100, (block.value / block.targetValue) * 100)
    : null;

  return (
    <div
      className={cn(
        'relative p-4 bg-white rounded-lg border transition-all cursor-pointer',
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2 border-blue-300'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm',
        block.thresholds && getStatusBgColor()
      )}
      onClick={onSelect}
    >
      {/* Edit button */}
      {isSelected && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute top-2 right-2 h-8 w-8 p-0"
          title="Modifier le KPI"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      )}

      {/* Label */}
      <p className="text-sm font-medium text-gray-500 mb-1">{block.label}</p>

      {/* Main content */}
      <div className="flex items-end justify-between">
        <div>
          {/* Value */}
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                'text-3xl font-bold',
                block.thresholds ? getStatusColor() : 'text-gray-900'
              )}
            >
              {formatValue(block.value)}
            </span>
            {block.unit && !['€', '%'].includes(block.unit) && (
              <span className="text-lg text-gray-500">{block.unit}</span>
            )}
          </div>

          {/* Variation */}
          {block.variation && (
            <div
              className={cn(
                'flex items-center gap-1 mt-1 text-sm font-medium',
                getVariationColor()
              )}
            >
              {getVariationIcon()}
              <span>
                {block.variation.value > 0 ? '+' : ''}
                {block.variation.value.toFixed(1)}%
              </span>
              <span className="text-gray-400 font-normal">vs période préc.</span>
            </div>
          )}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={block.thresholds ? (block.value >= block.thresholds.green ? '#22c55e' : block.value >= block.thresholds.orange ? '#eab308' : '#ef4444') : '#1C3163'}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {progressPercent !== null && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progression vers objectif</span>
            <span>{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                progressPercent >= 100
                  ? 'bg-green-500'
                  : progressPercent >= 75
                  ? 'bg-blue-500'
                  : progressPercent >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0</span>
            <span>Objectif: {formatValue(block.targetValue!)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
