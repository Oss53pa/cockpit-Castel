// ============================================================================
// SLIDE 13 - Plan d'Actions M+1
// Actions Prioritaires + Jalons à Atteindre
// ============================================================================

import React from 'react';
import { Target, Calendar, User } from 'lucide-react';
import type { ActionPrioritaireM1, JalonM1 } from '@/types/deepDive';
import { AXES_MENSUEL_CONFIG } from '@/data/deepDiveMensuelTemplate';

interface PlanActionsM1SlideProps {
  data: {
    actionsPrioritaires: ActionPrioritaireM1[];
    jalonsM1: JalonM1[];
    focusStrategique?: string;
    periode: string;
  };
  designSettings: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
}

const getCriticiteConfig = (criticite: string) => {
  switch (criticite) {
    case 'critique': return { bg: '#FEE2E2', text: '#DC2626', dot: '🔴' };
    case 'haute': return { bg: '#FFEDD5', text: '#EA580C', dot: '🟠' };
    default: return { bg: '#FEF3C7', text: '#D97706', dot: '🟡' };
  }
};

const getStatutConfig = (statut: string) => {
  switch (statut) {
    case 'en_danger': return { bg: '#FEE2E2', text: '#DC2626', label: 'En danger' };
    case 'a_surveiller': return { bg: '#FEF3C7', text: '#D97706', label: 'À surveiller' };
    default: return { bg: '#D1FAE5', text: '#059669', label: 'On track' };
  }
};

export function PlanActionsM1Slide({ data, designSettings }: PlanActionsM1SlideProps) {
  const { primaryColor, fontFamily } = designSettings;
  const { actionsPrioritaires, jalonsM1, focusStrategique, periode } = data;

  // Get the next month name for display
  const getMoisSuivant = () => {
    const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const now = new Date();
    const nextMonth = (now.getMonth() + 1) % 12;
    const year = nextMonth === 0 ? now.getFullYear() + 1 : now.getFullYear();
    return `${mois[nextMonth]} ${year}`;
  };

  return (
    <div style={{ fontFamily }} className="h-full flex flex-col bg-white">
      {/* Header */}
      <div
        className="px-6 py-3"
        style={{ backgroundColor: primaryColor }}
      >
        <h2 className="text-xl font-bold text-white">PLAN D'ACTIONS M+1</h2>
        <p className="text-white/80 text-sm">{getMoisSuivant()}</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto grid grid-cols-5 gap-4">
        {/* LEFT: Actions Prioritaires (3 columns) */}
        <div className="col-span-3 bg-gray-50 rounded-lg p-3">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2" style={{ color: primaryColor }}>
            <Target className="h-4 w-4" />
            Actions Prioritaires
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-1 text-left text-gray-500 w-6">#</th>
                <th className="py-1 text-left text-gray-500">Action</th>
                <th className="py-1 text-center text-gray-500 w-12">Axe</th>
                <th className="py-1 text-center text-gray-500 w-20">Responsable</th>
                <th className="py-1 text-center text-gray-500 w-20">Deadline</th>
                <th className="py-1 text-center text-gray-500 w-8">Crit.</th>
              </tr>
            </thead>
            <tbody>
              {actionsPrioritaires.slice(0, 5).map((action, idx) => {
                const criticiteConfig = getCriticiteConfig(action.priorite);
                const axeConfig = AXES_MENSUEL_CONFIG[action.axe];
                return (
                  <tr key={action.id} className="border-b border-gray-100">
                    <td className="py-1.5">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-1.5 font-medium truncate max-w-[180px]" title={action.action}>
                      {action.action}
                    </td>
                    <td className="py-1.5 text-center">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ backgroundColor: `${axeConfig?.color}20`, color: axeConfig?.color }}
                      >
                        {axeConfig?.labelCourt || '—'}
                      </span>
                    </td>
                    <td className="py-1.5 text-center text-[10px]">{action.responsable}</td>
                    <td className="py-1.5 text-center text-[10px]">
                      {new Date(action.dateLimite).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </td>
                    <td className="py-1.5 text-center">{criticiteConfig.dot}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* RIGHT: Jalons à Atteindre M+1 (2 columns) */}
        <div className="col-span-2 bg-gray-50 rounded-lg p-3">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2" style={{ color: primaryColor }}>
            <Calendar className="h-4 w-4" />
            Jalons à Atteindre M+1
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-1 text-left text-gray-500">Jalon</th>
                <th className="py-1 text-center text-gray-500 w-20">Deadline</th>
                <th className="py-1 text-center text-gray-500 w-16">Owner</th>
              </tr>
            </thead>
            <tbody>
              {jalonsM1.slice(0, 5).map((jalon) => {
                const statutConfig = getStatutConfig(jalon.statut);
                return (
                  <tr key={jalon.id} className="border-b border-gray-100">
                    <td className="py-2">
                      <div className="font-medium truncate max-w-[150px]" title={jalon.titre}>
                        {jalon.titre}
                      </div>
                      <span
                        className="text-[9px] px-1 py-0.5 rounded"
                        style={{ backgroundColor: statutConfig.bg, color: statutConfig.text }}
                      >
                        {statutConfig.label}
                      </span>
                    </td>
                    <td className="py-2 text-center text-[10px]">
                      {new Date(jalon.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </td>
                    <td className="py-2 text-center">
                      <span className="flex items-center justify-center gap-1 text-[10px]">
                        <User className="h-3 w-3 text-gray-400" />
                        {jalon.responsable}
                      </span>
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
