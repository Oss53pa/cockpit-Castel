// ============================================================================
// SLIDE 4 - Décisions & Arbitrages Requis
// ============================================================================

import React from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle, Pause } from 'lucide-react';
import type { DecisionArbitrageData, UrgencyLevel } from '@/types/deepDive';
import { AXES_MENSUEL_CONFIG } from '@/data/deepDiveMensuelTemplate';

interface DecisionsTableSlideProps {
  data: DecisionArbitrageData[];
  designSettings: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
  periode: string;
}

const UrgencyBadge: React.FC<{ urgency: UrgencyLevel }> = ({ urgency }) => {
  const configs = {
    critical: { bg: '#FEE2E2', color: '#B91C1C', label: 'Critique', icon: AlertTriangle },
    high: { bg: '#FFEDD5', color: '#C2410C', label: 'Haute', icon: AlertTriangle },
    medium: { bg: '#FEF9C3', color: '#A16207', label: 'Moyenne', icon: Clock },
    low: { bg: '#DCFCE7', color: '#15803D', label: 'Basse', icon: Clock },
  };
  const config = configs[urgency];
  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      <Icon style={{ width: 12, height: 12 }} />
      {config.label}
    </span>
  );
};

const StatutBadge: React.FC<{ statut: string }> = ({ statut }) => {
  const configs = {
    en_attente: { bg: '#FEF3C7', color: '#D97706', icon: Clock, label: 'En attente' },
    approuve: { bg: '#D1FAE5', color: '#059669', icon: CheckCircle, label: 'Approuvé' },
    rejete: { bg: '#FEE2E2', color: '#DC2626', icon: XCircle, label: 'Rejeté' },
    reporte: { bg: '#E0E7FF', color: '#4F46E5', icon: Pause, label: 'Reporté' },
  };
  const config = configs[statut as keyof typeof configs] || configs.en_attente;
  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      <Icon style={{ width: 12, height: 12 }} />
      {config.label}
    </span>
  );
};

export function DecisionsTableSlide({ data, designSettings, periode }: DecisionsTableSlideProps) {
  const { primaryColor, accentColor, fontFamily } = designSettings;

  // Trier par urgence (critique > haute > moyenne > basse)
  const sortedDecisions = [...data].sort((a, b) => {
    const urgencyOrder = ['critical', 'high', 'medium', 'low'];
    return urgencyOrder.indexOf(a.urgence) - urgencyOrder.indexOf(b.urgence);
  });

  const decisionsEnAttente = data.filter(d => d.statut === 'en_attente').length;
  const decisionsCritiques = data.filter(d => d.urgence === 'critical' && d.statut === 'en_attente').length;

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
        className="px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: primaryColor }}
      >
        <div>
          <h2 className="text-xl font-bold text-white">4. Décisions & Arbitrages Requis</h2>
          <p className="text-white/80 text-sm">{periode}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center bg-white/10 px-4 py-2 rounded-lg">
            <div className="text-2xl font-bold text-white">{decisionsEnAttente}</div>
            <div className="text-xs text-white/80">En attente</div>
          </div>
          {decisionsCritiques > 0 && (
            <div className="text-center bg-red-500/20 px-4 py-2 rounded-lg border border-red-400">
              <div className="text-2xl font-bold text-red-100">{decisionsCritiques}</div>
              <div className="text-xs text-red-200">Critiques</div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {sortedDecisions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucune décision en attente</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDecisions.map((decision) => {
              const axeConfig = AXES_MENSUEL_CONFIG[decision.axe];
              const isOverdue = new Date(decision.deadline) < new Date() && decision.statut === 'en_attente';

              return (
                <div
                  key={decision.id}
                  className={`p-4 rounded-lg border-2 ${
                    decision.statut === 'en_attente'
                      ? decision.urgence === 'critical'
                        ? 'border-red-300 bg-red-50'
                        : decision.urgence === 'high'
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-gray-200 bg-white'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg" style={{ color: primaryColor }}>
                          #{decision.numero}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: axeConfig.color, color: '#fff' }}
                        >
                          {axeConfig.labelCourt}
                        </span>
                        <UrgencyBadge urgency={decision.urgence} />
                        <StatutBadge statut={decision.statut} />
                      </div>
                      <h3 className="font-semibold text-gray-900">{decision.objet}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                        {isOverdue && '⚠️ '}Deadline: {formatDate(decision.deadline)}
                      </div>
                      <div className="text-xs text-gray-500">{decision.proprietaire}</div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{decision.contexte}</p>

                  {/* Options si présentes */}
                  {decision.options && decision.options.length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Options:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {decision.options.map((opt, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                          >
                            {opt.option}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommandation */}
                  <div
                    className="p-2 rounded border-l-4"
                    style={{ backgroundColor: `${accentColor}10`, borderColor: accentColor }}
                  >
                    <span className="text-xs font-semibold" style={{ color: accentColor }}>
                      Recommandation:
                    </span>
                    <p className="text-sm text-gray-800 mt-0.5">{decision.recommandation}</p>
                  </div>

                  {/* Impact si non décision */}
                  {decision.impactSiNonDecision && decision.statut === 'en_attente' && (
                    <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                      <span className="text-xs font-semibold text-red-600">
                        Impact si non décision:
                      </span>
                      <p className="text-xs text-red-700 mt-0.5">{decision.impactSiNonDecision}</p>
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
