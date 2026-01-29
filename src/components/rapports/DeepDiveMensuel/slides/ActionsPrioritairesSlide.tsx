// ============================================================================
// SLIDE 5.1 - Actions Prioritaires M+1
// ============================================================================

import React from 'react';
import { Target, Calendar, User, AlertCircle } from 'lucide-react';
import type { ActionPrioritaireM1 } from '@/types/deepDive';
import { AXES_MENSUEL_CONFIG } from '@/data/deepDiveMensuelTemplate';

interface ActionsPrioritairesSlideProps {
  data: ActionPrioritaireM1[];
  focusStrategique: string;
  designSettings: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
  periode: string;
}

const PrioriteBadge: React.FC<{ priorite: 'critique' | 'haute' | 'moyenne' }> = ({ priorite }) => {
  const configs = {
    critique: { bg: '#FEE2E2', color: '#B91C1C', label: 'Critique' },
    haute: { bg: '#FFEDD5', color: '#C2410C', label: 'Haute' },
    moyenne: { bg: '#FEF9C3', color: '#A16207', label: 'Moyenne' },
  };
  const config = configs[priorite];

  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-bold"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
};

export function ActionsPrioritairesSlide({
  data,
  focusStrategique,
  designSettings,
  periode,
}: ActionsPrioritairesSlideProps) {
  const { primaryColor, accentColor, fontFamily } = designSettings;

  const actionsCritiques = data.filter(a => a.priorite === 'critique').length;
  const actionsHautes = data.filter(a => a.priorite === 'haute').length;

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ fontFamily }} className="h-full flex flex-col bg-white">
      {/* Header */}
      <div
        className="px-6 py-4"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">5.1 Actions Prioritaires</h2>
            <p className="text-white/80 text-sm">{periode}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center bg-white/10 px-4 py-2 rounded-lg">
              <div className="text-2xl font-bold text-white">{data.length}</div>
              <div className="text-xs text-white/80">Actions</div>
            </div>
            {actionsCritiques > 0 && (
              <div className="text-center bg-red-500/20 px-3 py-2 rounded-lg border border-red-400">
                <div className="text-xl font-bold text-red-100">{actionsCritiques}</div>
                <div className="text-xs text-red-200">Critiques</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Focus Stratégique */}
      {focusStrategique && (
        <div
          className="mx-4 mt-4 p-3 rounded-lg border-l-4"
          style={{ backgroundColor: `${accentColor}10`, borderColor: accentColor }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4" style={{ color: accentColor }} />
            <span className="font-semibold text-sm" style={{ color: accentColor }}>
              Focus Stratégique
            </span>
          </div>
          <p className="text-sm text-gray-700">{focusStrategique}</p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucune action prioritaire définie</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {data.map((action) => {
              const axeConfig = AXES_MENSUEL_CONFIG[action.axe];
              const isOverdue = new Date(action.dateLimite) < new Date();

              return (
                <div
                  key={action.id}
                  className={`p-3 rounded-lg border-2 ${
                    action.priorite === 'critique'
                      ? 'border-red-200 bg-red-50'
                      : action.priorite === 'haute'
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {action.numero}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: axeConfig.color, color: '#fff' }}
                      >
                        {axeConfig.labelCourt}
                      </span>
                    </div>
                    <PrioriteBadge priorite={action.priorite} />
                  </div>

                  <h3 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2">
                    {action.action}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">{action.responsable}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(action.dateLimite)}</span>
                    </div>
                  </div>

                  {action.livrables && action.livrables.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-400">Livrables:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {action.livrables.slice(0, 2).map((livrable, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                          >
                            {livrable}
                          </span>
                        ))}
                        {action.livrables.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{action.livrables.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {action.risqueAssocie && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      <span className="truncate">{action.risqueAssocie}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
