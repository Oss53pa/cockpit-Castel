// ============================================================================
// SLIDE 2.1 - Tableau de Bord des Axes
// ============================================================================

import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import type { TableauBordAxeRow, MeteoNiveau, TendanceType } from '@/types/exco';
import { METEO_EMOJI_CONFIG } from '@/types/exco';

interface TableauBordAxesSlideProps {
  data: TableauBordAxeRow[];
  designSettings: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
  periode: string;
}

const TendanceIcon: React.FC<{ tendance: TendanceType; size?: number }> = ({ tendance, size = 14 }) => {
  switch (tendance) {
    case 'hausse':
      return <TrendingUp style={{ width: size, height: size, color: '#10B981' }} />;
    case 'baisse':
      return <TrendingDown style={{ width: size, height: size, color: '#EF4444' }} />;
    default:
      return <Minus style={{ width: size, height: size, color: '#6B7280' }} />;
  }
};

export function TableauBordAxesSlide({ data, designSettings, periode }: TableauBordAxesSlideProps) {
  const { primaryColor, fontFamily } = designSettings;

  const formatMontant = (montant: number): string => {
    if (montant >= 1_000_000) {
      return `${(montant / 1_000_000).toFixed(1)}M`;
    }
    if (montant >= 1_000) {
      return `${(montant / 1_000).toFixed(0)}K`;
    }
    return montant.toString();
  };

  return (
    <div style={{ fontFamily }} className="h-full flex flex-col bg-white">
      {/* Header */}
      <div
        className="px-6 py-4"
        style={{ backgroundColor: primaryColor }}
      >
        <h2 className="text-xl font-bold text-white">2.1 Tableau de Bord des Axes</h2>
        <p className="text-white/80 text-sm">Synthèse des 6 axes de mobilisation - {periode}</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2" style={{ borderColor: primaryColor }}>
                <th className="text-left py-2 px-2 font-semibold" style={{ color: primaryColor }}>
                  Axe
                </th>
                <th className="text-center py-2 px-2 font-semibold" style={{ color: primaryColor }}>
                  Météo
                </th>
                <th className="text-center py-2 px-2 font-semibold" style={{ color: primaryColor }}>
                  Avancement
                </th>
                <th className="text-center py-2 px-2 font-semibold" style={{ color: primaryColor }}>
                  Jalons
                </th>
                <th className="text-center py-2 px-2 font-semibold" style={{ color: primaryColor }}>
                  Actions
                </th>
                <th className="text-center py-2 px-2 font-semibold" style={{ color: primaryColor }}>
                  Risques
                </th>
                <th className="text-center py-2 px-2 font-semibold" style={{ color: primaryColor }}>
                  Budget
                </th>
                <th className="text-center py-2 px-2 font-semibold" style={{ color: primaryColor }}>
                  Tendance
                </th>
                <th className="text-left py-2 px-2 font-semibold" style={{ color: primaryColor }}>
                  Alerte Principale
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => {
                const meteoConfig = METEO_EMOJI_CONFIG[row.meteo] || METEO_EMOJI_CONFIG.jaune;
                const budgetPct = row.budgetPrevu > 0
                  ? Math.round((row.budgetConsomme / row.budgetPrevu) * 100)
                  : 0;

                return (
                  <tr
                    key={row.axe}
                    className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}
                  >
                    {/* Axe */}
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="font-medium">{row.label}</span>
                      </div>
                    </td>

                    {/* Météo */}
                    <td className="py-3 px-2 text-center">
                      <div
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: meteoConfig.bgColor, color: meteoConfig.color }}
                      >
                        <span className="emoji">{meteoConfig.emoji}</span>
                        <span>{meteoConfig.label}</span>
                      </div>
                    </td>

                    {/* Avancement */}
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[60px]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(row.avancement, 100)}%`,
                              backgroundColor: row.color,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium" style={{ color: row.color }}>
                          {row.avancement}%
                        </span>
                      </div>
                    </td>

                    {/* Jalons */}
                    <td className="py-3 px-2 text-center">
                      <span className="font-medium">
                        {row.jalonsAtteints}/{row.jalonsTotal}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-blue-600 font-medium">{row.actionsEnCours}</span>
                        <span className="text-gray-400">/</span>
                        {row.actionsEnRetard > 0 && (
                          <span className="text-red-600 font-bold">{row.actionsEnRetard} retard</span>
                        )}
                        {row.actionsEnRetard === 0 && (
                          <span className="text-green-600">OK</span>
                        )}
                      </div>
                    </td>

                    {/* Risques */}
                    <td className="py-3 px-2 text-center">
                      {row.risquesCritiques > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                          <AlertCircle className="h-3 w-3" />
                          {row.risquesCritiques}
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium">0</span>
                      )}
                    </td>

                    {/* Budget */}
                    <td className="py-3 px-2 text-center">
                      <div className="text-xs">
                        <span className="font-medium">{formatMontant(row.budgetConsomme)}</span>
                        <span className="text-gray-400"> / {formatMontant(row.budgetPrevu)}</span>
                        <div className="text-gray-500">({budgetPct}%)</div>
                      </div>
                    </td>

                    {/* Tendance */}
                    <td className="py-3 px-2 text-center">
                      <TendanceIcon tendance={row.tendance} />
                    </td>

                    {/* Alerte principale */}
                    <td className="py-3 px-2 text-left">
                      {row.alertePrincipale ? (
                        <span className="text-xs text-red-600 font-medium line-clamp-1">
                          {row.alertePrincipale}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Légende */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span>Météo:</span>
              {Object.entries(METEO_EMOJI_CONFIG).map(([key, config]) => (
                <span key={key} title={config.label} className="emoji">{config.emoji}</span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span>Tendance:</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" /> En avance
              </span>
              <span className="flex items-center gap-1">
                <Minus className="h-3 w-3 text-gray-400" /> Dans les temps
              </span>
              <span className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-red-500" /> En retard
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
