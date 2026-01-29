/**
 * Panel de simulation What-If
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, TrendingUp, X, Play } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DependencyNode, WhatIfScenario } from '@/types/interdependency.types';

interface WhatIfPanelProps {
  selectedNode: DependencyNode;
  scenario: WhatIfScenario | null;
  onSimulate: (delayDays: number) => void;
  onClose: () => void;
}

export const WhatIfPanel: React.FC<WhatIfPanelProps> = ({
  selectedNode,
  scenario,
  onSimulate,
  onClose,
}) => {
  const [delayDays, setDelayDays] = useState(5);

  // Réinitialiser le délai quand le noeud change
  useEffect(() => {
    setDelayDays(5);
  }, [selectedNode.id]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setDelayDays(value);
  };

  const handleSimulate = () => {
    onSimulate(delayDays);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg w-80">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-amber-50">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-600" />
          <span className="font-medium text-gray-800">Simulation What-If</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Action sélectionnée */}
      <div className="p-3 border-b border-gray-100">
        <p className="text-xs text-gray-500 mb-1">Action simulée</p>
        <p className="font-medium text-gray-800 text-sm">{selectedNode.action.titre}</p>
        <p className="text-xs text-gray-500 mt-1">{selectedNode.action.id_action}</p>
      </div>

      {/* Slider de délai */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-600">Retard simulé</label>
          <span className="font-mono text-lg font-semibold text-amber-600">
            +{delayDays} jours
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="30"
          value={delayDays}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0j</span>
          <span>15j</span>
          <span>30j</span>
        </div>

        <button
          onClick={handleSimulate}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
        >
          <Play className="h-4 w-4" />
          Simuler le retard
        </button>
      </div>

      {/* Résultats */}
      {scenario && (
        <div className="p-3">
          {/* Impact sur le projet */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Impact sur le projet</p>

            {scenario.totalDelayDays > 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-2">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">
                    +{scenario.totalDelayDays} jours sur la durée totale
                  </span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  Nouvelle fin:{' '}
                  {format(scenario.newProjectEnd, 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-md p-2">
                <p className="text-green-700 text-sm">
                  Pas d'impact sur la date de fin du projet
                </p>
              </div>
            )}

            {scenario.criticalPathAffected && (
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-md p-2">
                <p className="text-amber-700 text-sm flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Chemin critique affecté
                </p>
              </div>
            )}
          </div>

          {/* Actions impactées */}
          {scenario.impactedActions.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">
                Actions impactées ({scenario.impactedActions.length})
              </p>
              <div className="max-h-40 overflow-y-auto">
                <ul className="space-y-1">
                  {scenario.impactedActions.slice(0, 10).map((impact) => (
                    <li
                      key={impact.actionId}
                      className="flex items-center justify-between text-xs bg-gray-50 rounded p-1.5"
                    >
                      <span className="text-gray-700 truncate max-w-[180px]">
                        {impact.actionId}
                      </span>
                      <span className="text-amber-600 font-mono font-medium">
                        +{impact.delay}j
                      </span>
                    </li>
                  ))}
                  {scenario.impactedActions.length > 10 && (
                    <li className="text-xs text-gray-500 text-center py-1">
                      ... et {scenario.impactedActions.length - 10} autres
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {scenario.impactedActions.length === 0 && (
            <p className="text-sm text-gray-500">
              Aucune action en aval n'est impactée
            </p>
          )}
        </div>
      )}
    </div>
  );
};
