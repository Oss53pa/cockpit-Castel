// ============================================================================
// SLIDE 3.2 - Risques Nouveaux / Fermés
// ============================================================================

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Plus, X } from 'lucide-react';
import type { RisquesEvolutionData } from '@/types/exco';
import { AXES_MENSUEL_CONFIG } from '@/data/excoMensuelTemplate';

interface RisquesEvolutionSlideProps {
  data: RisquesEvolutionData;
  designSettings: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
  periode: string;
}

const getNiveauColor = (niveau: string): string => {
  switch (niveau) {
    case 'critique': return '#EF4444';
    case 'majeur': return '#F59E0B';
    case 'modere': return '#3B82F6';
    case 'faible': return '#10B981';
    default: return '#6B7280';
  }
};

const getNiveauBgColor = (niveau: string): string => {
  switch (niveau) {
    case 'critique': return '#FEF2F2';
    case 'majeur': return '#FFFBEB';
    case 'modere': return '#EFF6FF';
    case 'faible': return '#ECFDF5';
    default: return '#F9FAFB';
  }
};

export function RisquesEvolutionSlide({ data, designSettings, periode }: RisquesEvolutionSlideProps) {
  const { primaryColor, fontFamily } = designSettings;

  const totalNouveaux = data.nouveaux.length;
  const totalFermes = data.fermes.length;
  const evolution = totalNouveaux - totalFermes;

  return (
    <div style={{ fontFamily }} className="h-full flex flex-col bg-white">
      {/* Header */}
      <div
        className="px-6 py-4"
        style={{ backgroundColor: primaryColor }}
      >
        <h2 className="text-xl font-bold text-white">3.2 Risques Nouveaux / Fermés</h2>
        <p className="text-white/80 text-sm">Évolution du registre des risques - {periode}</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {/* Résumé en haut */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Nouveaux */}
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <Plus className="h-5 w-5 text-red-600" />
              </div>
              <span className="font-semibold text-red-700">Nouveaux</span>
            </div>
            <div className="text-3xl font-bold text-red-600">{totalNouveaux}</div>
            <p className="text-xs text-red-600/70 mt-1">risque(s) identifié(s) ce mois</p>
          </div>

          {/* Fermés */}
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <X className="h-5 w-5 text-green-600" />
              </div>
              <span className="font-semibold text-green-700">Fermés</span>
            </div>
            <div className="text-3xl font-bold text-green-600">{totalFermes}</div>
            <p className="text-xs text-green-600/70 mt-1">risque(s) clôturé(s) ce mois</p>
          </div>

          {/* Solde */}
          <div className={`p-4 rounded-lg border ${evolution > 0 ? 'bg-amber-50 border-amber-200' : evolution < 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${evolution > 0 ? 'bg-amber-100' : evolution < 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {evolution > 0 ? (
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                ) : evolution < 0 ? (
                  <TrendingDown className="h-5 w-5 text-blue-600" />
                ) : (
                  <Minus className="h-5 w-5 text-gray-600" />
                )}
              </div>
              <span className={`font-semibold ${evolution > 0 ? 'text-amber-700' : evolution < 0 ? 'text-blue-700' : 'text-gray-700'}`}>
                Solde Net
              </span>
            </div>
            <div className={`text-3xl font-bold ${evolution > 0 ? 'text-amber-600' : evolution < 0 ? 'text-blue-600' : 'text-gray-600'}`}>
              {evolution > 0 ? '+' : ''}{evolution}
            </div>
            <p className={`text-xs mt-1 ${evolution > 0 ? 'text-amber-600/70' : evolution < 0 ? 'text-blue-600/70' : 'text-gray-500'}`}>
              {evolution > 0 ? 'Augmentation du registre' : evolution < 0 ? 'Réduction du registre' : 'Registre stable'}
            </p>
          </div>
        </div>

        {/* Deux colonnes: Nouveaux et Fermés */}
        <div className="grid grid-cols-2 gap-6">
          {/* Colonne Nouveaux */}
          <div>
            <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2 pb-2 border-b border-red-200">
              <Plus className="h-4 w-4" />
              Risques Nouveaux ({totalNouveaux})
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-auto">
              {data.nouveaux.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-4 text-center">
                  Aucun nouveau risque ce mois
                </p>
              ) : (
                data.nouveaux.map((risque) => {
                  const axeConfig = AXES_MENSUEL_CONFIG[risque.axe];
                  const niveau = risque.score >= 16 ? 'critique' : risque.score >= 10 ? 'majeur' : risque.score >= 5 ? 'modere' : 'faible';
                  return (
                    <div
                      key={risque.id}
                      className="p-3 rounded-lg border-l-4"
                      style={{
                        backgroundColor: getNiveauBgColor(niveau),
                        borderColor: getNiveauColor(niveau),
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-500">{risque.code}</span>
                            {axeConfig && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded font-medium"
                                style={{ backgroundColor: axeConfig.color, color: '#fff' }}
                              >
                                {axeConfig.labelCourt}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {risque.titre}
                          </p>
                        </div>
                        <div
                          className="shrink-0 px-2 py-1 rounded text-xs font-bold"
                          style={{
                            backgroundColor: getNiveauColor(niveau),
                            color: '#fff',
                          }}
                        >
                          {risque.score}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Colonne Fermés */}
          <div>
            <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2 pb-2 border-b border-green-200">
              <X className="h-4 w-4" />
              Risques Fermés ({totalFermes})
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-auto">
              {data.fermes.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-4 text-center">
                  Aucun risque fermé ce mois
                </p>
              ) : (
                data.fermes.map((risque) => {
                  const axeConfig = AXES_MENSUEL_CONFIG[risque.axe];
                  return (
                    <div
                      key={risque.id}
                      className="p-3 rounded-lg bg-green-50 border-l-4 border-green-500"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-500">{risque.code}</span>
                            {axeConfig && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded font-medium"
                                style={{ backgroundColor: axeConfig.color, color: '#fff' }}
                              >
                                {axeConfig.labelCourt}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {risque.titre}
                          </p>
                          {risque.motif && (
                            <p className="text-xs text-green-600 mt-1 italic">
                              {risque.motif}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 px-2 py-1 rounded text-xs font-medium bg-green-200 text-green-800">
                          Fermé
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Évolution par niveau */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-3">Évolution par Niveau de Risque</h3>
          <div className="grid grid-cols-4 gap-3">
            {data.evolutionParNiveau.map((item) => (
              <div
                key={item.niveau}
                className="p-3 rounded-lg text-center"
                style={{ backgroundColor: getNiveauBgColor(item.niveau) }}
              >
                <div className="text-xs font-semibold uppercase mb-2" style={{ color: getNiveauColor(item.niveau) }}>
                  {item.niveau}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-bold text-gray-500">{item.moisPrecedent}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-lg font-bold" style={{ color: getNiveauColor(item.niveau) }}>
                    {item.moisActuel}
                  </span>
                </div>
                <div className={`text-xs mt-1 font-medium ${item.evolution > 0 ? 'text-red-600' : item.evolution < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {item.evolution > 0 ? `+${item.evolution}` : item.evolution < 0 ? item.evolution : '='}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
