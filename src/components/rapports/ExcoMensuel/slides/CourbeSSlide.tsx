// ============================================================================
// SLIDE 6.2 - Courbe en S — Budget
// ============================================================================

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, AlertCircle, CheckCircle } from 'lucide-react';
import type { CourbeSData } from '@/types/exco';
import { PROJET_CONFIG } from '@/data/constants';

interface CourbeSSlideProps {
  data: CourbeSData;
  designSettings: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
  periode: string;
}

export function CourbeSSlide({ data, designSettings, periode }: CourbeSSlideProps) {
  const { primaryColor, accentColor, fontFamily } = designSettings;

  const formatMontant = (montant: number): string => {
    if (montant >= 1_000_000_000) {
      return `${(montant / 1_000_000_000).toFixed(2)}Md`;
    }
    if (montant >= 1_000_000) {
      return `${(montant / 1_000_000).toFixed(1)}M`;
    }
    if (montant >= 1_000) {
      return `${(montant / 1_000).toFixed(0)}K`;
    }
    return montant.toString();
  };

  // Trouver le max pour l'échelle
  const maxValue = useMemo(() => {
    return Math.max(
      data.budgetTotal,
      ...data.points.map(p => Math.max(p.prevu, p.realise, p.engage))
    );
  }, [data]);

  // Calculer le pourcentage de consommation
  const pourcentageConsomme = data.budgetTotal > 0
    ? Math.round((data.budgetConsomme / data.budgetTotal) * 100)
    : 0;

  // Indicateurs EVM
  const evmIndicators = [
    {
      label: 'SPI',
      value: data.spi,
      description: 'Schedule Performance Index',
      status: data.spi >= 1 ? 'good' : data.spi >= 0.9 ? 'warning' : 'bad',
      interpretation: data.spi >= 1 ? 'En avance' : data.spi >= 0.9 ? 'Légèrement en retard' : 'En retard',
    },
    {
      label: 'CPI',
      value: data.cpi,
      description: 'Cost Performance Index',
      status: data.cpi >= 1 ? 'good' : data.cpi >= 0.9 ? 'warning' : 'bad',
      interpretation: data.cpi >= 1 ? 'Sous budget' : data.cpi >= 0.9 ? 'Légèrement sur budget' : 'Sur budget',
    },
    {
      label: 'EAC',
      value: data.eac,
      description: 'Estimate At Completion',
      status: data.eac <= data.budgetTotal ? 'good' : data.eac <= data.budgetTotal * 1.1 ? 'warning' : 'bad',
      isAmount: true,
    },
    {
      label: 'VAC',
      value: data.vac,
      description: 'Variance At Completion',
      status: data.vac >= 0 ? 'good' : data.vac >= -data.budgetTotal * 0.1 ? 'warning' : 'bad',
      isAmount: true,
      showSign: true,
    },
  ];

  const statusColors = {
    good: { bg: '#DCFCE7', color: '#15803D', icon: CheckCircle },
    warning: { bg: '#FEF9C3', color: '#A16207', icon: AlertCircle },
    bad: { bg: '#FEE2E2', color: '#B91C1C', icon: AlertCircle },
  };

  // Points pour le graphique SVG
  const chartPoints = useMemo(() => {
    const width = 100;
    const height = 100;
    const padding = 5;

    const getX = (index: number) => padding + (index / (data.points.length - 1)) * (width - 2 * padding);
    const getY = (value: number) => height - padding - ((value / maxValue) * (height - 2 * padding));

    return {
      prevu: data.points.map((p, i) => `${getX(i)},${getY(p.prevu)}`).join(' '),
      realise: data.points.filter(p => p.realise > 0).map((p, i) => `${getX(i)},${getY(p.realise)}`).join(' '),
      engage: data.points.filter(p => p.engage > 0).map((p, i) => `${getX(i)},${getY(p.engage)}`).join(' '),
    };
  }, [data.points, maxValue]);

  return (
    <div style={{ fontFamily }} className="h-full flex flex-col bg-white">
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: primaryColor }}
      >
        <div>
          <h2 className="text-xl font-bold text-white">6.2 Courbe en S — Budget</h2>
          <p className="text-white/80 text-sm">{periode}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center bg-white/10 px-4 py-2 rounded-lg">
            <div className="text-xl font-bold text-white">{formatMontant(data.budgetTotal)}</div>
            <div className="text-xs text-white/80">Budget Total</div>
          </div>
          <div className="text-center bg-white/10 px-4 py-2 rounded-lg">
            <div className="text-xl font-bold text-white">{pourcentageConsomme}%</div>
            <div className="text-xs text-white/80">Consommé</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-3 gap-4 h-full">
          {/* Graphique Courbe S */}
          <div className="col-span-2 bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3" style={{ color: primaryColor }}>
              Évolution Budget Prévu vs Réalisé
            </h3>

            {/* SVG Chart */}
            <div className="relative h-[250px]">
              <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                {/* Grid */}
                {[0, 25, 50, 75, 100].map(y => (
                  <line
                    key={y}
                    x1="5"
                    y1={100 - y}
                    x2="95"
                    y2={100 - y}
                    stroke="#E5E7EB"
                    strokeWidth="0.3"
                  />
                ))}

                {/* Courbe Prévu (pointillée) */}
                <polyline
                  points={chartPoints.prevu}
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth="0.8"
                  strokeDasharray="2,1"
                />

                {/* Courbe Engagé */}
                {chartPoints.engage && (
                  <polyline
                    points={chartPoints.engage}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="0.8"
                  />
                )}

                {/* Courbe Réalisé */}
                {chartPoints.realise && (
                  <polyline
                    points={chartPoints.realise}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1"
                  />
                )}
              </svg>

              {/* Légende Y */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 py-2">
                <span>{formatMontant(maxValue)}</span>
                <span>{formatMontant(maxValue / 2)}</span>
                <span>0</span>
              </div>
            </div>

            {/* Légende */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 border-t-2 border-dashed" style={{ borderColor: primaryColor }} />
                <span className="text-xs">Prévu</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-green-500" />
                <span className="text-xs">Réalisé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-amber-500" />
                <span className="text-xs">Engagé</span>
              </div>
            </div>
          </div>

          {/* Indicateurs EVM */}
          <div className="space-y-3">
            <h3 className="font-semibold" style={{ color: primaryColor }}>
              Indicateurs EVM
            </h3>

            {evmIndicators.map((indicator) => {
              const statusConfig = statusColors[indicator.status as keyof typeof statusColors] || statusColors.warning;
              const Icon = statusConfig.icon;

              return (
                <div
                  key={indicator.label}
                  className="p-3 rounded-lg border-2"
                  style={{ borderColor: statusConfig.color, backgroundColor: statusConfig.bg }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="font-bold text-lg" style={{ color: statusConfig.color }}>
                        {indicator.label}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {indicator.description}
                      </span>
                    </div>
                    <Icon className="h-5 w-5" style={{ color: statusConfig.color }} />
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold" style={{ color: statusConfig.color }}>
                      {indicator.isAmount
                        ? `${indicator.showSign && indicator.value > 0 ? '+' : ''}${formatMontant(indicator.value)}`
                        : indicator.value.toFixed(2)
                      }
                    </span>
                    {indicator.interpretation && (
                      <span className="text-xs" style={{ color: statusConfig.color }}>
                        {indicator.interpretation}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Résumé Budget */}
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <h4 className="text-xs font-semibold text-gray-500 mb-2">RÉSUMÉ BUDGET</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Budget total:</span>
                  <span className="font-medium">{formatMontant(data.budgetTotal)} {PROJET_CONFIG.devise}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consommé:</span>
                  <span className="font-medium text-green-600">{formatMontant(data.budgetConsomme)} {PROJET_CONFIG.devise}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Engagé:</span>
                  <span className="font-medium text-amber-600">{formatMontant(data.budgetEngage)} {PROJET_CONFIG.devise}</span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-1">
                  <span className="text-gray-600">Reste:</span>
                  <span className="font-bold" style={{ color: primaryColor }}>
                    {formatMontant(data.budgetTotal - data.budgetConsomme - data.budgetEngage)} {PROJET_CONFIG.devise}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
