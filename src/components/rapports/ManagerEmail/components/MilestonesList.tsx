// ============================================================================
// COMPOSANT - Liste des Jalons du Mois
// ============================================================================

import React from 'react';
import { Flag, CheckCircle2, AlertTriangle, Clock, Target } from 'lucide-react';
import type { Jalon } from '@/types';
import { AXE_LABELS } from '../hooks/useMonthlyReport';

interface MilestonesListProps {
  jalons: Jalon[];
  filtreAxe?: string;
  filtreResponsable?: string;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function getJalonStatus(jalon: Jalon): {
  status: string;
  color: string;
  bgColor: string;
  icon: typeof Clock;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (jalon.statut === 'atteint') {
    return {
      status: 'Atteint',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      icon: CheckCircle2,
    };
  }

  if (jalon.date_prevue) {
    const datePrevue = new Date(jalon.date_prevue);
    if (datePrevue < today) {
      return {
        status: 'En retard',
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        icon: AlertTriangle,
      };
    }

    const diffDays = Math.ceil((datePrevue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      return {
        status: 'Imminent',
        color: 'text-amber-700',
        bgColor: 'bg-amber-100',
        icon: Clock,
      };
    }
  }

  return {
    status: 'À venir',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: Target,
  };
}

function getAxeLabel(axeCode: string): string {
  return AXE_LABELS[axeCode]?.replace(/^AXE \d+ - /, '') || axeCode;
}

function getAxeColor(axeCode: string): string {
  const colors: Record<string, string> = {
    'axe1_rh': 'bg-amber-100 text-amber-700',
    'axe2_commercial': 'bg-blue-100 text-blue-700',
    'axe3_technique': 'bg-emerald-100 text-emerald-700',
    'axe4_budget': 'bg-purple-100 text-purple-700',
    'axe5_marketing': 'bg-pink-100 text-pink-700',
    'axe6_exploitation': 'bg-cyan-100 text-cyan-700',
  };
  return colors[axeCode] || 'bg-zinc-100 text-zinc-700';
}

export function MilestonesList({
  jalons,
  filtreAxe,
  filtreResponsable,
}: MilestonesListProps) {
  // Appliquer les filtres
  let filteredJalons = [...jalons];

  if (filtreAxe) {
    filteredJalons = filteredJalons.filter((j) => j.axe === filtreAxe);
  }

  if (filtreResponsable) {
    filteredJalons = filteredJalons.filter((j) => j.responsable === filtreResponsable);
  }

  // Trier par date
  filteredJalons.sort((a, b) => {
    const dateA = a.date_prevue ? new Date(a.date_prevue).getTime() : 0;
    const dateB = b.date_prevue ? new Date(b.date_prevue).getTime() : 0;
    return dateA - dateB;
  });

  if (filteredJalons.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
        <Flag className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
        <p className="text-zinc-500">Aucun jalon pour ce mois</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
        <Flag className="h-5 w-5 text-purple-600" />
        Jalons du Mois
        <span className="text-sm font-normal text-zinc-500">
          ({filteredJalons.length} jalon{filteredJalons.length > 1 ? 's' : ''})
        </span>
      </h2>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="text-left p-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                  Jalon
                </th>
                <th className="text-left p-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider w-36">
                  Axe
                </th>
                <th className="text-left p-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider w-36">
                  Responsable
                </th>
                <th className="text-center p-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider w-28">
                  Date
                </th>
                <th className="text-center p-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider w-28">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredJalons.map((jalon) => {
                const { status, color, bgColor, icon: StatusIcon } = getJalonStatus(jalon);
                const axeColor = getAxeColor(jalon.axe);

                return (
                  <tr
                    key={jalon.id}
                    className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-purple-100">
                          <Flag className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <span className="font-medium text-zinc-900 text-sm block">
                            {jalon.titre}
                          </span>
                          {jalon.code && (
                            <span className="text-xs text-zinc-500">
                              {jalon.code}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${axeColor}`}>
                        {getAxeLabel(jalon.axe)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-zinc-600">
                      {jalon.responsable || 'Non assigné'}
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-medium text-zinc-900">
                        {formatDate(jalon.date_prevue)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bgColor} ${color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MilestonesList;
