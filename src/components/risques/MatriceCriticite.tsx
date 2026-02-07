import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import { useRisques } from '@/hooks';
import { buildRiskMatrix } from '@/lib/calculations';
import type { Risque } from '@/types';

interface MatriceCriticiteProps {
  onCellClick?: (probabilite: number, impact: number, risques: Risque[]) => void;
}

const probabiliteLabels = ['Très faible', 'Faible', 'Moyenne', 'Forte'];
const impactLabels = ['Mineur', 'Modéré', 'Majeur', 'Critique'];

export function MatriceCriticite({ onCellClick }: MatriceCriticiteProps) {
  const risques = useRisques({ status: 'open' });
  const matrix = buildRiskMatrix(risques);

  // impact et probabilite sont des index 0-3, on ajoute 1 pour obtenir l'échelle 1-4
  const getCellColor = (impactIdx: number, probabiliteIdx: number) => {
    const score = (impactIdx + 1) * (probabiliteIdx + 1);
    if (score >= 12) return 'bg-error-500 hover:bg-error-600';
    if (score >= 9) return 'bg-warning-500 hover:bg-warning-600';
    if (score >= 5) return 'bg-info-400 hover:bg-info-500';
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
          {/* Matrix grid */}
          <div className="grid grid-cols-5 gap-1">
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
              const impact = 3 - reverseIndex; // 3, 2, 1, 0

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
                    const count = matrix[impact][probIndex];
                    const cellRisques = getRisquesForCell(probIndex, impact);

                    return (
                      <button
                        key={`cell-${impact}-${probIndex}`}
                        className={cn(
                          'h-16 rounded-lg flex items-center justify-center transition-all cursor-pointer',
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
                          <span className="text-2xl font-bold text-white">
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

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-success-400" />
          <span className="text-xs text-primary-500">Faible (1-4)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-info-400" />
          <span className="text-xs text-primary-500">Modéré (5-8)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-warning-500" />
          <span className="text-xs text-primary-500">Majeur (9-11)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-error-500" />
          <span className="text-xs text-primary-500">Critique (12-16)</span>
        </div>
      </div>
    </Card>
  );
}
