/**
 * Bannière d'alerte pour les blocages détectés
 */

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Lock, ArrowRight } from 'lucide-react';
import type { BlockageInfo } from '@/types/interdependency.types';

interface BlockageAlertProps {
  blockages: BlockageInfo[];
  onActionClick: (actionId: string) => void;
}

export const BlockageAlert: React.FC<BlockageAlertProps> = ({
  blockages,
  onActionClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (blockages.length === 0) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="font-medium text-red-800">
            {blockages.length} action{blockages.length > 1 ? 's' : ''} bloquée
            {blockages.length > 1 ? 's' : ''} détectée
            {blockages.length > 1 ? 's' : ''}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-red-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-red-600" />
        )}
      </button>

      {/* Liste des blocages */}
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {blockages.map((blockage, index) => (
            <div
              key={`${blockage.blockedActionId}-${index}`}
              className="bg-white rounded-md p-2 border border-red-200"
            >
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {/* Action bloquée */}
                  <button
                    onClick={() => onActionClick(blockage.blockedActionId)}
                    className="text-sm font-medium text-red-700 hover:underline text-left truncate block w-full"
                  >
                    {blockage.blockedActionTitle}
                  </button>

                  {/* Raison */}
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                    <span>Bloquée par:</span>
                    <button
                      onClick={() => onActionClick(blockage.blockingActionId)}
                      className="text-blue-600 hover:underline truncate max-w-[200px]"
                    >
                      {blockage.blockingActionTitle}
                    </button>
                  </div>

                  {/* Type de lien */}
                  <p className="text-xs text-gray-500 mt-1">
                    Lien: {blockage.dependencyType} - {blockage.reason}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Conseil */}
          <div className="text-xs text-red-700 mt-2 flex items-center gap-1">
            <ArrowRight className="h-3 w-3" />
            <span>
              Cliquez sur une action pour la voir dans le diagramme
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
