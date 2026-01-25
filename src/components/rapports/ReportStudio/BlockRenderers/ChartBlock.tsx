import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { Edit2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ChartBlock as ChartBlockType } from '@/types/reportStudio';
import { CHART_COLORS } from '@/data/dataLibrary';

interface ChartBlockProps {
  block: ChartBlockType;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onRefresh?: () => void;
}

export function ChartBlock({
  block,
  isSelected,
  onSelect,
  onEdit,
  onRefresh,
}: ChartBlockProps) {
  const transformDataForRecharts = () => {
    const { labels, datasets } = block.data;
    return labels.map((label, index) => {
      const dataPoint: Record<string, string | number> = { name: label };
      datasets.forEach((dataset) => {
        dataPoint[dataset.label] = dataset.data[index];
      });
      return dataPoint;
    });
  };

  const data = transformDataForRecharts();
  const colors = block.config.colors || CHART_COLORS;

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (block.chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {block.config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            {block.config.showLegend !== false && (
              <Legend wrapperStyle={{ fontSize: 12 }} />
            )}
            {block.data.datasets.map((dataset, index) => (
              <Line
                key={dataset.label}
                type="monotone"
                dataKey={dataset.label}
                stroke={dataset.borderColor || colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case 'bar':
      case 'horizontal_bar':
        return (
          <BarChart
            {...commonProps}
            layout={block.chartType === 'horizontal_bar' ? 'vertical' : 'horizontal'}
          >
            {block.config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
            {block.chartType === 'horizontal_bar' ? (
              <>
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
              </>
            ) : (
              <>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
              </>
            )}
            <Tooltip />
            {block.config.showLegend !== false && (
              <Legend wrapperStyle={{ fontSize: 12 }} />
            )}
            {block.data.datasets.map((dataset, index) => (
              <Bar
                key={dataset.label}
                dataKey={dataset.label}
                fill={
                  Array.isArray(dataset.backgroundColor)
                    ? colors[index % colors.length]
                    : dataset.backgroundColor || colors[index % colors.length]
                }
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'stacked_bar':
        return (
          <BarChart {...commonProps}>
            {block.config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            {block.config.showLegend !== false && (
              <Legend wrapperStyle={{ fontSize: 12 }} />
            )}
            {block.data.datasets.map((dataset, index) => (
              <Bar
                key={dataset.label}
                dataKey={dataset.label}
                stackId="stack"
                fill={
                  Array.isArray(dataset.backgroundColor)
                    ? colors[index % colors.length]
                    : dataset.backgroundColor || colors[index % colors.length]
                }
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {block.config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            {block.config.showLegend !== false && (
              <Legend wrapperStyle={{ fontSize: 12 }} />
            )}
            {block.data.datasets.map((dataset, index) => (
              <Area
                key={dataset.label}
                type="monotone"
                dataKey={dataset.label}
                stroke={dataset.borderColor || colors[index % colors.length]}
                fill={
                  Array.isArray(dataset.backgroundColor)
                    ? `${colors[index % colors.length]}30`
                    : dataset.backgroundColor || `${colors[index % colors.length]}30`
                }
              />
            ))}
          </AreaChart>
        );

      case 'pie':
      case 'donut': {
        const pieData = block.data.labels.map((label, index) => ({
          name: label,
          value: block.data.datasets[0]?.data[index] || 0,
        }));
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={block.chartType === 'donut' ? '50%' : 0}
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
              labelLine={false}
            >
              {pieData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            {block.config.showLegend !== false && (
              <Legend wrapperStyle={{ fontSize: 12 }} />
            )}
          </PieChart>
        );
      }

      case 'radar':
        return (
          <RadarChart {...commonProps} cx="50%" cy="50%" outerRadius="80%">
            <PolarGrid />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            {block.config.showLegend !== false && (
              <Legend wrapperStyle={{ fontSize: 12 }} />
            )}
            {block.data.datasets.map((dataset, index) => (
              <Radar
                key={dataset.label}
                name={dataset.label}
                dataKey={dataset.label}
                stroke={dataset.borderColor || colors[index % colors.length]}
                fill={
                  Array.isArray(dataset.backgroundColor)
                    ? `${colors[index % colors.length]}40`
                    : dataset.backgroundColor || `${colors[index % colors.length]}40`
                }
              />
            ))}
          </RadarChart>
        );

      case 'combo':
        return (
          <ComposedChart {...commonProps}>
            {block.config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            {block.config.showLegend !== false && (
              <Legend wrapperStyle={{ fontSize: 12 }} />
            )}
            {block.data.datasets.map((dataset, index) => {
              if (dataset.type === 'line') {
                return (
                  <Line
                    key={dataset.label}
                    type="monotone"
                    dataKey={dataset.label}
                    stroke={dataset.borderColor || colors[index % colors.length]}
                    strokeWidth={2}
                  />
                );
              }
              return (
                <Bar
                  key={dataset.label}
                  dataKey={dataset.label}
                  fill={
                    Array.isArray(dataset.backgroundColor)
                      ? colors[index % colors.length]
                      : dataset.backgroundColor || colors[index % colors.length]
                  }
                />
              );
            })}
          </ComposedChart>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Type de graphique non supporté: {block.chartType}
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        'relative p-4 bg-white rounded-lg border transition-all cursor-pointer',
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2 border-blue-300'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-base font-semibold text-gray-900">{block.title}</h4>
          {block.subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{block.subtitle}</p>
          )}
        </div>
        {isSelected && (
          <div className="flex items-center gap-1">
            {onRefresh && block.sourceTemplateId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRefresh();
                }}
                className="h-8 w-8 p-0"
                title="Actualiser les données"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="h-8 w-8 p-0"
              title="Modifier le graphique"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Axis labels */}
      {(block.config.xAxisLabel || block.config.yAxisLabel) && (
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {block.config.xAxisLabel && <span>{block.config.xAxisLabel}</span>}
          {block.config.yAxisLabel && <span>{block.config.yAxisLabel}</span>}
        </div>
      )}
    </div>
  );
}
