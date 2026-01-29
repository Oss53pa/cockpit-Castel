/**
 * Légende du diagramme d'interdépendance
 */

import React from 'react';
import { Lock, GitBranch } from 'lucide-react';
import type { Axe, TypeLien } from '@/types';
import { AXE_COLORS, DEPENDENCY_STYLES } from '@/types/interdependency.types';

const AXE_LABELS: Record<Axe, string> = {
  axe1_rh: 'RH',
  axe2_commercial: 'Commercial',
  axe3_technique: 'Technique',
  axe4_budget: 'Budget',
  axe5_marketing: 'Marketing',
  axe6_exploitation: 'Exploitation',
};

const LINK_TYPE_LABELS: Record<TypeLien, string> = {
  FS: 'Fin → Début',
  SS: 'Début → Début',
  FF: 'Fin → Fin',
  SF: 'Début → Fin',
};

interface InterdependencyLegendProps {
  showAxes?: boolean;
  showLinkTypes?: boolean;
  showIndicators?: boolean;
  compact?: boolean;
}

export const InterdependencyLegend: React.FC<InterdependencyLegendProps> = ({
  showAxes = true,
  showLinkTypes = true,
  showIndicators = true,
  compact = false,
}) => {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm ${compact ? 'p-2' : 'p-4'}`}
    >
      {!compact && (
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Légende</h4>
      )}

      <div className={`flex ${compact ? 'flex-row gap-6' : 'flex-col gap-4'}`}>
        {/* Couleurs par axe */}
        {showAxes && (
          <div>
            {!compact && (
              <p className="text-xs font-medium text-gray-500 mb-2">Par axe</p>
            )}
            <div className={`flex ${compact ? 'flex-row gap-3' : 'flex-wrap gap-2'}`}>
              {(Object.keys(AXE_COLORS) as Axe[]).map((axe) => (
                <div key={axe} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: AXE_COLORS[axe].bg }}
                  />
                  <span className="text-xs text-gray-600">{AXE_LABELS[axe]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Types de dépendances */}
        {showLinkTypes && (
          <div>
            {!compact && (
              <p className="text-xs font-medium text-gray-500 mb-2">
                Types de liens
              </p>
            )}
            <div className={`flex ${compact ? 'flex-row gap-3' : 'flex-wrap gap-2'}`}>
              {(Object.keys(DEPENDENCY_STYLES) as TypeLien[]).map((type) => (
                <div key={type} className="flex items-center gap-1.5">
                  <svg width="24" height="10">
                    <line
                      x1="0"
                      y1="5"
                      x2="20"
                      y2="5"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeDasharray={DEPENDENCY_STYLES[type].dashArray}
                    />
                    <polygon points="20,2 24,5 20,8" fill="#6B7280" />
                  </svg>
                  <span className="text-xs text-gray-600">
                    {LINK_TYPE_LABELS[type]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Indicateurs */}
        {showIndicators && (
          <div>
            {!compact && (
              <p className="text-xs font-medium text-gray-500 mb-2">
                Indicateurs
              </p>
            )}
            <div className={`flex ${compact ? 'flex-row gap-3' : 'flex-wrap gap-2'}`}>
              {/* Chemin critique */}
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded border-2 border-orange-500 bg-white flex items-center justify-center">
                  <span className="text-[8px] font-bold text-orange-500">C</span>
                </div>
                <span className="text-xs text-gray-600">Chemin critique</span>
              </div>

              {/* Bloqué */}
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-red-100 flex items-center justify-center">
                  <Lock className="h-3 w-3 text-red-500" />
                </div>
                <span className="text-xs text-gray-600">Bloqué</span>
              </div>

              {/* Impacté (simulation) */}
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-yellow-100 border border-yellow-400" />
                <span className="text-xs text-gray-600">Impacté (simulation)</span>
              </div>

              {/* Marge */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-gray-400 font-mono">+5j</span>
                <span className="text-xs text-gray-600">Marge (slack)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
