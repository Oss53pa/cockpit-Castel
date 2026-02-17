import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import { useRisques } from '@/hooks';
import { buildRiskMatrix } from '@/lib/calculations';
import { SEUILS_RISQUES } from '@/data/constants';
import type { Risque } from '@/types';

interface MatriceCriticiteProps {
  onCellClick?: (probabilite: number, impact: number, risques: Risque[]) => void;
}

// Grille 5×5 — labels alignés sur l'échelle 1-5
const probabiliteLabels = ['Très faible', 'Faible', 'Moyenne', 'Forte', 'Très forte'];
const impactLabels = ['Mineur', 'Modéré', 'Significatif', 'Majeur', 'Critique'];

export function MatriceCriticite({ onCellClick }: MatriceCriticiteProps) {
  const risques = useRisques({ status: 'open' });
  const matrix = buildRiskMatrix(risques);

  // Couleur de cellule basée sur le score P×I (seuils depuis constants.ts)
  const getCellColor = (impactIdx: number, probabiliteIdx: number) => {
    const score = (impactIdx + 1) * (probabiliteIdx + 1);
    if (score >= SEUILS_RISQUES.critique) return 'bg-error-500 hover:bg-error-600';
    if (score >= SEUILS_RISQUES.majeur) return 'bg-warning-500 hover:bg-warning-600';
    if (score >= SEUILS_RISQUES.modere) return 'bg-info-400 hover:bg-info-500';
    return 'bg-success-400 hover:bg-success-500';
  };

  const getRisquesForCell = (probabilite: number, impact: number) => {
    return risques.filter(
      (r) => r.probabilite === probabilite + 1 && r.impact === impact + 1
    );
  };

  return (
    <Card padding="md">
      <h3 className="text-lg font-semibold text-primary-900 mb-4">
        Matrice de criticité
      </h3>

      <div className="flex">
        {/* Y-axis label */}
        <div className="flex items-center mr-2">
          <span className="text-xs font-medium text-primary-500 -rotate-90 whitespace-nowrap">
            IMPACT
          </span>
        </div>

        <div className="flex-1">
          {/* Matrix grid — 5 colonnes de données + 1 colonne labels = grid-cols-6 */}
          <div className="grid grid-cols-6 gap-1">
            {/* Empty corner */}
            <div />

            {/* Probability headers */}
            {probabiliteLabels.map((label, i) => (
              <div
                key={label}
                className="text-center text-xs font-medium text-primary-500 pb-2"
              >
                {label}
                <div className="text-primary-400">({i + 1})</div>
              </div>
            ))}

            {/* Matrix rows (from high impact to low) */}
            {[...impactLabels].reverse().map((impactLabel, reverseIndex) => {
              const impact = 4 - reverseIndex; // 4, 3, 2, 1, 0

              return (
                <React.Fragment key={`row-${impact}`}>
                  {/* Impact label */}
                  <div className="flex items-center justify-end pr-2">
                    <span className="text-xs font-medium text-primary-500">
                      {impactLabel}
                      <span className="text-primary-400 ml-1">({impact + 1})</span>
                    </span>
                  </div>

                  {/* Cells */}
                  {probabiliteLabels.map((_, probIndex) => {
                    const count = matrix[impact]?.[probIndex] ?? 0;
                    const cellRisques = getRisquesForCell(probIndex, impact);

                    return (
                      <button
                        key={`cell-${impact}-${probIndex}`}
                        className={cn(
                          'h-14 rounded-lg flex items-center justify-center transition-all cursor-pointer',
                          getCellColor(impact, probIndex),
                          count > 0 && 'ring-2 ring-white ring-offset-2'
                        )}
                        onClick={() =>
                          onCellClick?.(probIndex + 1, impact + 1, cellRisques)
                        }
                        title={`P=${probIndex + 1}, I=${impact + 1}, Score=${
                          (probIndex + 1) * (impact + 1)
                        }`}
                      >
                        {count > 0 && (
                          <span className="text-xl font-bold text-white">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>

          {/* X-axis label */}
          <div className="text-center mt-2">
            <span className="text-xs font-medium text-primary-500">
              PROBABILITÉ
            </span>
          </div>
        </div>
      </div>

      {/* Legend — seuils alignés sur constants.ts (grille 5×5, max = 25) */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-success-400" />
          <span className="text-xs text-primary-500">Faible (1-{SEUILS_RISQUES.modere - 1})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-info-400" />
          <span className="text-xs text-primary-500">Modéré ({SEUILS_RISQUES.modere}-{SEUILS_RISQUES.majeur - 1})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-warning-500" />
          <span className="text-xs text-primary-500">Majeur ({SEUILS_RISQUES.majeur}-{SEUILS_RISQUES.critique - 1})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-error-500" />
          <span className="text-xs text-primary-500">Critique ({SEUILS_RISQUES.critique}-25)</span>
        </div>
      </div>
    </Card>
  );
}
