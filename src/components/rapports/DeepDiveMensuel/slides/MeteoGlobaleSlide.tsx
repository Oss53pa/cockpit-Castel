// ============================================================================
// SLIDE 1.1 - Météo Globale du Mois
// ============================================================================

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { MeteoGlobaleData, MeteoNiveau, TendanceType } from '@/types/deepDive';
import { METEO_EMOJI_CONFIG } from '@/types/deepDive';

interface MeteoGlobaleSlideProps {
  data: MeteoGlobaleData;
  designSettings: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
}

const TendanceIcon: React.FC<{ tendance: TendanceType; className?: string }> = ({ tendance, className }) => {
  switch (tendance) {
    case 'hausse':
      return <TrendingUp className={className} style={{ color: '#10B981' }} />;
    case 'baisse':
      return <TrendingDown className={className} style={{ color: '#EF4444' }} />;
    default:
      return <Minus className={className} style={{ color: '#6B7280' }} />;
  }
};

export function MeteoGlobaleSlide({ data, designSettings }: MeteoGlobaleSlideProps) {
  const { primaryColor, accentColor, fontFamily } = designSettings;
  const meteoConfig = METEO_EMOJI_CONFIG[data.meteoGlobale];

  return (
    <div style={{ fontFamily }} className="h-full flex flex-col bg-white">
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: primaryColor }}
      >
        <div>
          <h2 className="text-xl font-bold text-white">1.1 Météo Globale du Mois</h2>
          <p className="text-white/80 text-sm">{data.periode}</p>
        </div>
        <div
          className="flex items-center gap-3 px-4 py-2 rounded-lg"
          style={{ backgroundColor: meteoConfig.bgColor }}
        >
          <span className="text-3xl emoji">{meteoConfig.emoji}</span>
          <div>
            <div className="font-bold" style={{ color: meteoConfig.color }}>
              {meteoConfig.label}
            </div>
            <div className="text-xs text-gray-600">Météo Globale</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Résumé Exécutif */}
        <div
          className="mb-6 p-4 rounded-lg border-l-4"
          style={{ backgroundColor: `${primaryColor}08`, borderColor: accentColor }}
        >
          <h3 className="font-semibold mb-2" style={{ color: primaryColor }}>
            Résumé Exécutif
          </h3>
          <p className="text-gray-700">{data.resumeExecutif}</p>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 gap-4">
          {data.kpis.map((kpi) => {
            const kpiMeteo = METEO_EMOJI_CONFIG[kpi.meteo];
            const pourcentage = Math.round((kpi.valeur / kpi.cible) * 100);

            return (
              <div
                key={kpi.id}
                className="p-4 rounded-lg border-2 transition-all hover:shadow-md"
                style={{ borderColor: `${kpiMeteo.color}30` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">{kpi.label}</span>
                  <div className="flex items-center gap-2">
                    <TendanceIcon tendance={kpi.tendance} className="h-4 w-4" />
                    <span className="text-xl emoji">{kpiMeteo.emoji}</span>
                  </div>
                </div>

                <div className="flex items-end gap-2 mb-2">
                  <span className="text-3xl font-bold" style={{ color: primaryColor }}>
                    {Number.isInteger(kpi.valeur) ? kpi.valeur : Number(kpi.valeur).toFixed(2)}
                  </span>
                  <span className="text-gray-500 text-sm mb-1">{kpi.unite}</span>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(pourcentage, 100)}%`,
                      backgroundColor: kpiMeteo.color,
                    }}
                  />
                </div>

                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    {pourcentage}% de l'objectif
                  </span>
                  <span className="text-xs font-medium" style={{ color: kpiMeteo.color }}>
                    Cible: {kpi.cible}
                  </span>
                </div>

                {kpi.commentaire && (
                  <p className="mt-2 text-xs text-gray-500 italic">{kpi.commentaire}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
