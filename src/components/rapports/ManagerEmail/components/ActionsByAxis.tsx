// ============================================================================
// COMPOSANT - Actions groupées par Axe
// ============================================================================

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { Action } from '@/types';
import { AXE_LABELS } from '../hooks/useMonthlyReport';

interface ActionsByAxisProps {
  actionsByAxe: Record<string, Action[]>;
  filtreAxe?: string;
  filtreResponsable?: string;
}

const AXE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'axe1_rh': { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700' },
  'axe2_commercial': { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
  'axe3_technique': { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700' },
  'axe4_budget': { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
  'axe5_marketing': { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-700' },
  'axe6_exploitation': { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700' },
};

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function getActionStatus(action: Action): { status: string; color: string; icon: typeof Clock } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (action.statut === 'termine' || (action.avancement || 0) >= 100) {
    return { status: 'Terminée', color: 'text-green-600', icon: CheckCircle2 };
  }

  if (action.date_fin_prevue) {
    const dateFin = new Date(action.date_fin_prevue);
    if (dateFin < today) {
      return { status: 'En retard', color: 'text-red-600', icon: AlertCircle };
    }
  }

  return { status: 'En cours', color: 'text-blue-600', icon: Clock };
}

function ProgressBar({ value }: { value: number }) {
  const percentage = Math.min(100, Math.max(0, value));
  const barColor = percentage >= 100 ? 'bg-green-500' : percentage >= 50 ? 'bg-blue-500' : 'bg-amber-500';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-zinc-600 w-10 text-right">
        {percentage}%
      </span>
    </div>
  );
}

export function ActionsByAxis({
  actionsByAxe,
  filtreAxe,
  filtreResponsable,
}: ActionsByAxisProps) {
  const [expandedAxes, setExpandedAxes] = useState<Set<string>>(new Set(Object.keys(AXE_LABELS)));

  const toggleAxe = (axe: string) => {
    setExpandedAxes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(axe)) {
        newSet.delete(axe);
      } else {
        newSet.add(axe);
      }
      return newSet;
    });
  };

  const expandAll = () => setExpandedAxes(new Set(Object.keys(AXE_LABELS)));
  const collapseAll = () => setExpandedAxes(new Set());

  // Filtrer les axes à afficher
  const axesToShow = filtreAxe
    ? Object.keys(actionsByAxe).filter((axe) => axe === filtreAxe)
    : Object.keys(AXE_LABELS);

  return (
    <div className="space-y-4">
      {/* Header avec boutons expand/collapse */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">
          Actions par Axe
        </h2>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Tout déplier
          </button>
          <span className="text-zinc-300">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Tout replier
          </button>
        </div>
      </div>

      {/* Liste des axes */}
      {axesToShow.map((axe) => {
        const axeLabel = AXE_LABELS[axe] || axe;
        const colors = AXE_COLORS[axe] || AXE_COLORS['axe6_exploitation'];
        const isExpanded = expandedAxes.has(axe);

        // Filtrer les actions par responsable si nécessaire
        let actions = actionsByAxe[axe] || [];
        if (filtreResponsable) {
          actions = actions.filter((a) => a.responsable === filtreResponsable);
        }

        if (actions.length === 0 && filtreResponsable) {
          return null;
        }

        return (
          <div
            key={axe}
            className={`border rounded-xl overflow-hidden ${colors.border}`}
          >
            {/* Header de l'axe */}
            <button
              onClick={() => toggleAxe(axe)}
              className={`w-full flex items-center justify-between p-4 ${colors.bg} hover:opacity-90 transition-opacity`}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className={`h-5 w-5 ${colors.text}`} />
                ) : (
                  <ChevronRight className={`h-5 w-5 ${colors.text}`} />
                )}
                <span className={`font-semibold ${colors.text}`}>
                  {axeLabel}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.text} bg-white`}>
                {actions.length} action{actions.length > 1 ? 's' : ''}
              </span>
            </button>

            {/* Tableau des actions */}
            {isExpanded && actions.length > 0 && (
              <div className="bg-white overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50">
                      <th className="text-left p-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider w-32">
                        Responsable
                      </th>
                      <th className="text-center p-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider w-24">
                        Début
                      </th>
                      <th className="text-center p-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider w-24">
                        Fin
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider w-32">
                        Progression
                      </th>
                      <th className="text-center p-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider w-24">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {actions.map((action) => {
                      const { status, color, icon: StatusIcon } = getActionStatus(action);
                      return (
                        <tr
                          key={action.id}
                          className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                        >
                          <td className="p-3">
                            <span className="font-medium text-zinc-900 text-sm">
                              {action.titre}
                            </span>
                            {action.code && (
                              <span className="ml-2 text-xs text-zinc-500">
                                ({action.code})
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-sm text-zinc-600">
                            {action.responsable || 'Non assigné'}
                          </td>
                          <td className="p-3 text-center text-sm text-zinc-600">
                            {formatDate(action.date_debut)}
                          </td>
                          <td className="p-3 text-center text-sm text-zinc-600">
                            {formatDate(action.date_fin_prevue)}
                          </td>
                          <td className="p-3">
                            <ProgressBar value={action.avancement || 0} />
                          </td>
                          <td className="p-3">
                            <div className={`flex items-center justify-center gap-1 text-xs font-medium ${color}`}>
                              <StatusIcon className="h-3.5 w-3.5" />
                              <span>{status}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Message si aucune action */}
            {isExpanded && actions.length === 0 && (
              <div className="bg-white p-6 text-center text-zinc-500 text-sm">
                Aucune action pour cet axe ce mois-ci
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ActionsByAxis;
