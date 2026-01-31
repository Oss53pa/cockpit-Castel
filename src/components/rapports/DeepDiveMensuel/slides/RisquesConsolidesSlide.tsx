// ============================================================================
// SLIDE 11 - Risques Consolidés
// Top 5 Risques + Matrice + Évolution
// ============================================================================

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Plus, CheckCircle, AlertOctagon } from 'lucide-react';
import type { Top5RisquesData, RisquesEvolutionData, TendanceType } from '@/types/deepDive';
import { AXES_MENSUEL_CONFIG } from '@/data/deepDiveMensuelTemplate';

interface RisquesConsolidesSlideProps {
  data: {
    top5Risques: Top5RisquesData;
    risquesEvolution: RisquesEvolutionData;
  };
  designSettings: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
}

const getTendanceIcon = (tendance: TendanceType) => {
  switch (tendance) {
    case 'hausse': return <TrendingUp className="h-3 w-3 text-red-500" />;
    case 'baisse': return <TrendingDown className="h-3 w-3 text-green-500" />;
    default: return <Minus className="h-3 w-3 text-gray-400" />;
  }
};

const getNiveauColor = (niveau: string) => {
  switch (niveau) {
    case 'critique': return { bg: '#FEE2E2', text: '#DC2626', dot: '🔴' };
    case 'majeur': return { bg: '#FFEDD5', text: '#EA580C', dot: '🟠' };
    case 'modere': return { bg: '#FEF3C7', text: '#D97706', dot: '🟡' };
    default: return { bg: '#D1FAE5', text: '#059669', dot: '🟢' };
  }
};

const getScoreColor = (score: number) => {
  if (score >= 20) return '#DC2626';
  if (score >= 15) return '#EA580C';
  if (score >= 10) return '#D97706';
  return '#059669';
};

export function RisquesConsolidesSlide({ data, designSettings }: RisquesConsolidesSlideProps) {
  const { primaryColor, fontFamily } = designSettings;
  const { top5Risques, risquesEvolution } = data;

  // Calculate counts for evolution summary
  const nouveauxCount = risquesEvolution.nouveaux.length;
  const fermesCount = risquesEvolution.fermes.length;

  return (
    <div style={{ fontFamily }} className="h-full flex flex-col bg-white">
      {/* Header */}
      <div
        className="px-6 py-3"
        style={{ backgroundColor: primaryColor }}
      >
        <h2 className="text-xl font-bold text-white">RISQUES CONSOLIDÉS</h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto grid grid-cols-3 gap-4">
        {/* LEFT: Top 5 Risques (spans 2 columns) */}
        <div className="col-span-2 bg-gray-50 rounded-lg p-3">
          <h3 className="font-semibold text-sm mb-2" style={{ color: primaryColor }}>
            Top 5 Risques Actifs
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-1 text-left text-gray-500 w-6">#</th>
                <th className="py-1 text-left text-gray-500">Risque</th>
                <th className="py-1 text-center text-gray-500 w-10">P</th>
                <th className="py-1 text-center text-gray-500 w-10">I</th>
                <th className="py-1 text-center text-gray-500 w-12">Score</th>
                <th className="py-1 text-left text-gray-500">Mitigation</th>
                <th className="py-1 text-center text-gray-500 w-16">Owner</th>
              </tr>
            </thead>
            <tbody>
              {top5Risques.risques.slice(0, 5).map((risque, idx) => {
                const niveauConfig = getNiveauColor(risque.niveau);
                const axeConfig = AXES_MENSUEL_CONFIG[risque.axe];
                return (
                  <tr key={risque.id} className="border-b border-gray-100">
                    <td className="py-1.5">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
                        style={{ backgroundColor: getScoreColor(risque.score) }}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-1.5">
                      <div className="font-medium truncate max-w-[150px]" title={risque.titre}>
                        {risque.titre}
                      </div>
                      <div className="text-[10px] text-gray-500">{axeConfig?.labelCourt || '—'}</div>
                    </td>
                    <td className="py-1.5 text-center">{niveauConfig.dot}</td>
                    <td className="py-1.5 text-center">{niveauConfig.dot}</td>
                    <td className="py-1.5 text-center">
                      <span
                        className="px-1.5 py-0.5 rounded font-bold"
                        style={{ backgroundColor: niveauConfig.bg, color: niveauConfig.text }}
                      >
                        {risque.score}
                      </span>
                    </td>
                    <td className="py-1.5 truncate max-w-[120px]" title={risque.mitigationPrincipale}>
                      {risque.mitigationPrincipale}
                    </td>
                    <td className="py-1.5 text-center text-[10px]">{risque.proprietaire}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* RIGHT: Matrice + Évolution */}
        <div className="space-y-3">
          {/* Matrice des Risques (simplified) */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="font-semibold text-sm mb-2" style={{ color: primaryColor }}>
              Matrice des Risques
            </h3>
            <div className="grid grid-cols-5 gap-0.5 text-[8px]">
              {/* Header row */}
              <div className="col-span-5 text-center text-gray-500 mb-1">PROBABILITÉ →</div>
              {/* Impact labels */}
              <div className="text-right pr-1 text-gray-500 flex items-center justify-end">I↑</div>
              {[1, 2, 3, 4, 5].map(p => (
                <div key={p} className="text-center text-gray-400">{p}</div>
              ))}
              {/* Grid */}
              {[5, 4, 3, 2, 1].map(impact => (
                <React.Fragment key={impact}>
                  <div className="text-right pr-1 text-gray-400">{impact}</div>
                  {[1, 2, 3, 4, 5].map(prob => {
                    const score = impact * prob;
                    const risqueAtPosition = top5Risques.risques.find(
                      r => r.impact === impact && r.probabilite === prob
                    );
                    return (
                      <div
                        key={`${impact}-${prob}`}
                        className={`w-6 h-6 flex items-center justify-center rounded text-[8px] font-bold ${
                          risqueAtPosition ? 'ring-1 ring-gray-400' : ''
                        }`}
                        style={{
                          backgroundColor: score >= 20 ? '#FEE2E2' :
                                          score >= 15 ? '#FFEDD5' :
                                          score >= 10 ? '#FEF3C7' :
                                          score >= 5 ? '#D1FAE5' : '#F3F4F6',
                          color: score >= 15 ? '#991B1B' : '#374151',
                        }}
                      >
                        {risqueAtPosition ? `R${top5Risques.risques.indexOf(risqueAtPosition) + 1}` : ''}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Évolution */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="font-semibold text-sm mb-2" style={{ color: primaryColor }}>
              Évolution
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-1.5 bg-blue-50 rounded">
                <span className="flex items-center gap-1 text-blue-700">
                  <Plus className="h-3 w-3" />
                  Nouveaux risques
                </span>
                <span className="font-bold text-blue-700">{nouveauxCount}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-green-50 rounded">
                <span className="flex items-center gap-1 text-green-700">
                  <CheckCircle className="h-3 w-3" />
                  Risques fermés
                </span>
                <span className="font-bold text-green-700">{fermesCount}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-red-50 rounded">
                <span className="flex items-center gap-1 text-red-700">
                  <TrendingUp className="h-3 w-3" />
                  Risques aggravés
                </span>
                <span className="font-bold text-red-700">
                  {top5Risques.risques.filter(r => r.tendance === 'hausse').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-emerald-50 rounded">
                <span className="flex items-center gap-1 text-emerald-700">
                  <TrendingDown className="h-3 w-3" />
                  Risques réduits
                </span>
                <span className="font-bold text-emerald-700">
                  {top5Risques.risques.filter(r => r.tendance === 'baisse').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
