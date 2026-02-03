/**
 * Module Projection du Taux d'Occupation
 * Affiche la courbe de progression et les recommandations
 */

import { useMemo } from 'react';
import {
  TrendingUp,
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { useOccupancyProjection, type TimelinePoint } from '@/hooks/useOccupancyProjection';

// Mini graphique de progression
function ProgressionChart({
  timeline,
  targetRate,
}: {
  timeline: TimelinePoint[];
  targetRate: number;
}) {
  const width = 280;
  const height = 100;
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Échelle Y: 0 à 100
  const yScale = (value: number) => chartHeight - (value / 100) * chartHeight;

  // Échelle X: premier point à dernier point
  const xScale = useMemo(() => {
    if (timeline.length < 2) return () => 0;
    const firstDate = new Date(timeline[0].date).getTime();
    const lastDate = new Date(timeline[timeline.length - 1].date).getTime();
    const range = lastDate - firstDate;
    return (date: string) => {
      const d = new Date(date).getTime();
      return ((d - firstDate) / range) * chartWidth;
    };
  }, [timeline, chartWidth]);

  // Générer le path
  const path = useMemo(() => {
    if (timeline.length < 2) return '';
    return timeline.map((point, i) => {
      const x = xScale(point.date);
      const y = yScale(point.rate);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [timeline, xScale]);

  // Path pour la zone sous la courbe
  const areaPath = useMemo(() => {
    if (timeline.length < 2) return '';
    const points = timeline.map(point => `${xScale(point.date)},${yScale(point.rate)}`).join(' ');
    const firstX = xScale(timeline[0].date);
    const lastX = xScale(timeline[timeline.length - 1].date);
    return `M ${firstX},${chartHeight} L ${points} L ${lastX},${chartHeight} Z`;
  }, [timeline, xScale, chartHeight]);

  return (
    <svg width={width} height={height} className="overflow-visible">
      <g transform={`translate(${padding.left}, ${padding.top})`}>
        {/* Grille horizontale */}
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line
              x1={0}
              x2={chartWidth}
              y1={yScale(v)}
              y2={yScale(v)}
              stroke="#e5e7eb"
              strokeWidth={1}
              strokeDasharray={v === targetRate ? '0' : '2,2'}
            />
            <text
              x={-5}
              y={yScale(v)}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-[8px] fill-neutral-400"
            >
              {v}%
            </text>
          </g>
        ))}

        {/* Ligne cible */}
        <line
          x1={0}
          x2={chartWidth}
          y1={yScale(targetRate)}
          y2={yScale(targetRate)}
          stroke="#22c55e"
          strokeWidth={1.5}
          strokeDasharray="4,2"
        />
        <text
          x={chartWidth + 5}
          y={yScale(targetRate)}
          dominantBaseline="middle"
          className="text-[8px] fill-green-600 font-medium"
        >
          Cible
        </text>

        {/* Zone sous la courbe */}
        <path
          d={areaPath}
          fill="url(#gradient)"
          opacity={0.3}
        />

        {/* Courbe */}
        <path
          d={path}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* Points */}
        {timeline.map((point, i) => (
          <circle
            key={i}
            cx={xScale(point.date)}
            cy={yScale(point.rate)}
            r={point.isProjection ? 3 : 4}
            fill={point.isProjection ? '#93c5fd' : '#3b82f6'}
            stroke="white"
            strokeWidth={1}
          />
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Axe X - dates */}
        {timeline.length > 0 && (
          <>
            <text
              x={0}
              y={chartHeight + 12}
              className="text-[8px] fill-neutral-400"
            >
              Auj.
            </text>
            <text
              x={chartWidth}
              y={chartHeight + 12}
              textAnchor="end"
              className="text-[8px] fill-neutral-400"
            >
              Ouv.
            </text>
          </>
        )}
      </g>
    </svg>
  );
}

// Indicateur d'écart
function GapIndicator({
  gap,
  status,
}: {
  gap: number;
  status: 'on_track' | 'at_risk' | 'critical';
}) {
  const configs = {
    on_track: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: CheckCircle,
      iconColor: 'text-green-500',
      label: 'Sur la bonne trajectoire',
    },
    at_risk: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      label: 'Attention requise',
    },
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      label: 'Action urgente',
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div className={cn('p-3 rounded-lg border', config.bg, config.border)}>
      <div className="flex items-center gap-2">
        <Icon className={cn('w-5 h-5', config.iconColor)} />
        <div>
          <div className={cn('text-sm font-medium', config.text)}>
            {gap <= 0 ? 'Objectif atteignable' : `Écart de ${gap}%`}
          </div>
          <div className="text-xs text-neutral-500">{config.label}</div>
        </div>
      </div>
    </div>
  );
}

export function OccupancyProjection() {
  const data = useOccupancyProjection();

  if (!data) {
    return (
      <div className="flex items-center justify-center py-8 text-neutral-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-sm">Calcul de la projection...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats principales */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{data.currentRate}%</div>
          <div className="text-[10px] text-blue-500 font-medium">Actuel</div>
        </div>
        <div className="p-3 bg-neutral-50 rounded-lg text-center relative">
          <ArrowRight className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
          <div className="text-2xl font-bold text-neutral-600">{data.projectedRateAtOpening}%</div>
          <div className="text-[10px] text-neutral-500 font-medium">Projeté</div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{data.targetRate}%</div>
          <div className="text-[10px] text-green-500 font-medium">Cible</div>
        </div>
      </div>

      {/* Indicateur d'écart */}
      <GapIndicator gap={data.gap} status={data.gapStatus} />

      {/* Graphique */}
      <div className="bg-neutral-50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
            Courbe de progression
          </h4>
          <Badge variant="secondary" className="text-[10px]">
            +{data.monthlyProgressionRate}%/mois
          </Badge>
        </div>
        <div className="flex justify-center">
          <ProgressionChart timeline={data.timeline} targetRate={data.targetRate} />
        </div>
      </div>

      {/* Informations temporelles */}
      <div className="flex items-center justify-between text-xs text-neutral-500 bg-neutral-50 rounded-lg p-2">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Ouverture: {new Date(data.openingDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <span className="font-medium text-neutral-700">{data.daysToOpening} jours</span>
      </div>

      {/* Recommandations */}
      {data.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            Recommandations
          </h4>
          <ul className="space-y-1.5">
            {data.recommendations.map((rec, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-neutral-600 bg-amber-50/50 p-2 rounded"
              >
                <span className="text-amber-500 font-bold mt-px">{i + 1}.</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Légende */}
      <div className="flex items-center justify-center gap-4 pt-2 text-[10px] text-neutral-400 border-t border-neutral-100">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Progression
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-green-500" style={{ borderStyle: 'dashed' }} />
          Cible {data.targetRate}%
        </span>
      </div>
    </div>
  );
}

export default OccupancyProjection;
