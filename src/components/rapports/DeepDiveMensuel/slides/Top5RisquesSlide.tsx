// ============================================================================
// SLIDE 3.1 - Top 5 Risques Actifs
// ============================================================================

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Shield, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { Top5RisquesData, TendanceType } from '@/types/deepDive';
import { AXES_MENSUEL_CONFIG } from '@/data/deepDiveMensuelTemplate';

interface Top5RisquesSlideProps {
  data: Top5RisquesData;
  designSettings: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
  periode: string;
}

const TendanceIcon: React.FC<{ tendance: TendanceType; size?: number }> = ({ tendance, size = 16 }) => {
  switch (tendance) {
    case 'hausse':
      return <TrendingUp style={{ width: size, height: size, color: '#EF4444' }} />;
    case 'baisse':
      return <TrendingDown style={{ width: size, height: size, color: '#10B981' }} />;
    default:
      return <Minus style={{ width: size, height: size, color: '#6B7280' }} />;
  }
};

const StatutMitigationBadge: React.FC<{ statut: string }> = ({ statut }) => {
  const configs = {
    efficace: { bg: '#DCFCE7', color: '#15803D', icon: CheckCircle, label: 'Efficace' },
    en_cours: { bg: '#DBEAFE', color: '#1D4ED8', icon: Clock, label: 'En cours' },
    a_lancer: { bg: '#FEF9C3', color: '#A16207', icon: Clock, label: 'À lancer' },
    inefficace: { bg: '#FEE2E2', color: '#B91C1C', icon: AlertCircle, label: 'Inefficace' },
  };
  const config = configs[statut as keyof typeof configs] || configs.en_cours;
  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      <Icon style={{ width: 12, height: 12 }} />
      {config.label}
    </span>
  );
};

export function Top5RisquesSlide({ data, designSettings, periode }: Top5RisquesSlideProps) {
  const { primaryColor, fontFamily } = designSettings;

  const niveauColors = {
    critique: { bg: '#FEE2E2', color: '#B91C1C', border: '#EF4444' },
    majeur: { bg: '#FFEDD5', color: '#C2410C', border: '#F97316' },
    modere: { bg: '#FEF9C3', color: '#A16207', border: '#F59E0B' },
    faible: { bg: '#DCFCE7', color: '#15803D', border: '#10B981' },
  };

  return (
    <div style={{ fontFamily }} className="h-full flex flex-col bg-white">
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: primaryColor }}
      >
        <div>
          <h2 className="text-xl font-bold text-white">3.1 Top 5 Risques Actifs</h2>
          <p className="text-white/80 text-sm">{periode}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center bg-white/10 px-4 py-2 rounded-lg">
            <div className="text-2xl font-bold text-white">{data.scoreGlobalRisques}</div>
            <div className="text-xs text-white/80">Score Global</div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
            <TendanceIcon tendance={data.tendanceGlobale} size={20} />
            <span className="text-sm text-white">
              {data.tendanceGlobale === 'hausse' ? 'En hausse' :
               data.tendanceGlobale === 'baisse' ? 'En baisse' : 'Stable'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="space-y-3">
          {data.risques.map((risque, index) => {
            const colors = niveauColors[risque.niveau];
            const axeConfig = AXES_MENSUEL_CONFIG[risque.axe];

            return (
              <div
                key={risque.id}
                className="p-4 rounded-lg border-l-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                style={{ borderLeftColor: colors.border }}
              >
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
                    style={{ backgroundColor: colors.bg, color: colors.color }}
                  >
                    #{index + 1}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">{risque.code}</span>
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: axeConfig.color, color: '#fff' }}
                          >
                            {axeConfig.labelCourt}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-800">{risque.titre}</h3>
                      </div>

                      {/* Score */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className="px-3 py-2 rounded-lg text-center"
                          style={{ backgroundColor: colors.bg }}
                        >
                          <div className="text-2xl font-bold" style={{ color: colors.color }}>
                            {risque.score}
                          </div>
                          <div className="text-xs" style={{ color: colors.color }}>
                            P{risque.probabilite} × I{risque.impact}
                          </div>
                        </div>
                        <div className="flex flex-col items-center">
                          <TendanceIcon tendance={risque.tendance} />
                          {risque.scoreEvolution !== 0 && (
                            <span className={`text-xs font-medium ${risque.scoreEvolution > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {risque.scoreEvolution > 0 ? '+' : ''}{risque.scoreEvolution}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {risque.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <span className="font-medium">Propriétaire:</span>
                          <span>{risque.proprietaire}</span>
                        </div>
                        <StatutMitigationBadge statut={risque.statutMitigation} />
                      </div>

                      <span
                        className="px-2 py-1 rounded text-xs font-bold uppercase"
                        style={{ backgroundColor: colors.bg, color: colors.color }}
                      >
                        {risque.niveau}
                      </span>
                    </div>

                    {risque.mitigationPrincipale && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Mitigation: </span>
                        <span className="text-xs text-gray-700">{risque.mitigationPrincipale}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {data.risques.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun risque actif identifié</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
