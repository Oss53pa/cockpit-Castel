// ============================================================================
// COMPOSANT - Cards récapitulatif du Rapport Mensuel
// ============================================================================

import React from 'react';
import { ClipboardList, Flag, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SummaryCardsProps {
  totalActions: number;
  totalJalons: number;
  actionsEnRetard: number;
  actionsTerminees: number;
}

export function SummaryCards({
  totalActions,
  totalJalons,
  actionsEnRetard,
  actionsTerminees,
}: SummaryCardsProps) {
  const cards = [
    {
      id: 'actions',
      label: 'Actions du mois',
      value: totalActions,
      icon: ClipboardList,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      id: 'jalons',
      label: 'Jalons du mois',
      value: totalJalons,
      icon: Flag,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
    },
    {
      id: 'retard',
      label: 'Actions en retard',
      value: actionsEnRetard,
      icon: AlertTriangle,
      bgColor: actionsEnRetard > 0 ? 'bg-red-50' : 'bg-green-50',
      iconColor: actionsEnRetard > 0 ? 'text-red-600' : 'text-green-600',
      borderColor: actionsEnRetard > 0 ? 'border-red-200' : 'border-green-200',
    },
    {
      id: 'terminees',
      label: 'Actions terminées',
      value: actionsTerminees,
      icon: CheckCircle2,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`${card.bgColor} ${card.borderColor} border rounded-xl p-5 transition-transform hover:scale-105`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${card.iconColor} p-2 rounded-lg bg-white shadow-sm`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-zinc-900 mb-1">
              {card.value}
            </p>
            <p className="text-sm text-zinc-600">
              {card.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default SummaryCards;
