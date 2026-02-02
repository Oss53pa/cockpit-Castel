// ============================================================================
// COMPOSANT - Récapitulatif par Responsable
// ============================================================================

import React from 'react';
import { Users, AlertTriangle, ClipboardList, Flag } from 'lucide-react';
import type { ResponsableSummary as ResponsableSummaryType } from '../hooks/useMonthlyReport';

interface ResponsableSummaryProps {
  recapParResponsable: ResponsableSummaryType[];
  onSelectResponsable?: (responsable: string) => void;
  selectedResponsable?: string;
}

export function ResponsableSummary({
  recapParResponsable,
  onSelectResponsable,
  selectedResponsable,
}: ResponsableSummaryProps) {
  if (recapParResponsable.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
        <Users className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
        <p className="text-zinc-500">Aucun responsable assigné</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
        <Users className="h-5 w-5 text-blue-600" />
        Récapitulatif par Responsable
      </h2>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="text-left p-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                  Responsable
                </th>
                <th className="text-center p-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider w-28">
                  <div className="flex items-center justify-center gap-1.5">
                    <ClipboardList className="h-4 w-4" />
                    Actions
                  </div>
                </th>
                <th className="text-center p-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider w-28">
                  <div className="flex items-center justify-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    En retard
                  </div>
                </th>
                <th className="text-center p-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider w-28">
                  <div className="flex items-center justify-center gap-1.5">
                    <Flag className="h-4 w-4" />
                    Jalons
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {recapParResponsable.map((responsable) => {
                const isSelected = selectedResponsable === responsable.nom;
                const hasRetard = responsable.actionsEnRetard > 0;

                return (
                  <tr
                    key={responsable.id}
                    onClick={() => onSelectResponsable?.(isSelected ? '' : responsable.nom)}
                    className={`
                      border-b border-zinc-100 transition-colors cursor-pointer
                      ${isSelected ? 'bg-blue-50' : 'hover:bg-zinc-50'}
                    `}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                          ${isSelected ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-600'}
                        `}>
                          {responsable.nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-zinc-900 text-sm block">
                            {responsable.nom}
                          </span>
                          {responsable.email && (
                            <span className="text-xs text-zinc-500">
                              {responsable.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-700 font-semibold">
                        {responsable.actions}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`
                        inline-flex items-center justify-center w-10 h-10 rounded-lg font-semibold
                        ${hasRetard ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}
                      `}>
                        {responsable.actionsEnRetard}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 text-purple-700 font-semibold">
                        {responsable.jalons}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="bg-zinc-50 border-t border-zinc-200 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-zinc-700">
              Total ({recapParResponsable.length} responsable{recapParResponsable.length > 1 ? 's' : ''})
            </span>
            <div className="flex items-center gap-6">
              <span className="text-zinc-600">
                <strong className="text-zinc-900">
                  {recapParResponsable.reduce((sum, r) => sum + r.actions, 0)}
                </strong> actions
              </span>
              <span className="text-zinc-600">
                <strong className="text-red-600">
                  {recapParResponsable.reduce((sum, r) => sum + r.actionsEnRetard, 0)}
                </strong> en retard
              </span>
              <span className="text-zinc-600">
                <strong className="text-zinc-900">
                  {recapParResponsable.reduce((sum, r) => sum + r.jalons, 0)}
                </strong> jalons
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Message d'aide */}
      {onSelectResponsable && (
        <p className="text-xs text-zinc-500 text-center">
          Cliquez sur un responsable pour filtrer les actions et jalons
        </p>
      )}
    </div>
  );
}

export default ResponsableSummary;
