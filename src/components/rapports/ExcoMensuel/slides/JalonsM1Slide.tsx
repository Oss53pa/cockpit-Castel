// ============================================================================
// SLIDE 5.2 - Jalons à Atteindre M+1
// ============================================================================

import React from 'react';
import { Calendar, CheckCircle, AlertTriangle, Target, User, ListChecks } from 'lucide-react';
import type { JalonM1 } from '@/types/exco';
import { AXES_MENSUEL_CONFIG } from '@/data/excoMensuelTemplate';

interface JalonsM1SlideProps {
  data: JalonM1[];
  designSettings: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
  periode: string;
}

const StatutBadge: React.FC<{ statut: 'en_danger' | 'a_surveiller' | 'on_track' }> = ({ statut }) => {
  const configs = {
    en_danger: { bg: '#FEE2E2', color: '#B91C1C', icon: AlertTriangle, label: 'En danger' },
    a_surveiller: { bg: '#FEF9C3', color: '#A16207', icon: AlertTriangle, label: 'À surveiller' },
    on_track: { bg: '#DCFCE7', color: '#15803D', icon: CheckCircle, label: 'On track' },
  };
  const config = configs[statut] || configs.a_surveiller;
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

export function JalonsM1Slide({ data, designSettings, periode }: JalonsM1SlideProps) {
  const { primaryColor, accentColor, fontFamily } = designSettings;

  const jalonsEnDanger = data.filter(j => j.statut === 'en_danger').length;
  const jalonsASurveiller = data.filter(j => j.statut === 'a_surveiller').length;
  const jalonsOnTrack = data.filter(j => j.statut === 'on_track').length;

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Trier par date puis par statut (danger en premier)
  const sortedJalons = [...data].sort((a, b) => {
    const statutOrder = { en_danger: 0, a_surveiller: 1, on_track: 2 };
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return statutOrder[a.statut] - statutOrder[b.statut];
  });

  return (
    <div style={{ fontFamily }} className="h-full flex flex-col bg-white">
      {/* Header */}
      <div
        className="px-6 py-4"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">5.2 Jalons à Atteindre</h2>
            <p className="text-white/80 text-sm">{periode}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center bg-white/10 px-4 py-2 rounded-lg">
              <div className="text-2xl font-bold text-white">{data.length}</div>
              <div className="text-xs text-white/80">Jalons</div>
            </div>
            {jalonsEnDanger > 0 && (
              <div className="text-center bg-red-500/20 px-3 py-2 rounded-lg border border-red-400">
                <div className="text-xl font-bold text-red-100">{jalonsEnDanger}</div>
                <div className="text-xs text-red-200">En danger</div>
              </div>
            )}
            {jalonsASurveiller > 0 && (
              <div className="text-center bg-yellow-500/20 px-3 py-2 rounded-lg border border-yellow-400">
                <div className="text-xl font-bold text-yellow-100">{jalonsASurveiller}</div>
                <div className="text-xs text-yellow-200">À surveiller</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {sortedJalons.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun jalon prévu pour cette période</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedJalons.map((jalon) => {
              const axeConfig = AXES_MENSUEL_CONFIG[jalon.axe] || AXES_MENSUEL_CONFIG.general;
              const daysUntil = Math.ceil(
                (new Date(jalon.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={jalon.id}
                  className={`p-4 rounded-lg border-2 ${
                    jalon.statut === 'en_danger'
                      ? 'border-red-300 bg-red-50'
                      : jalon.statut === 'a_surveiller'
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-green-300 bg-green-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-bold"
                          style={{ backgroundColor: primaryColor, color: '#fff' }}
                        >
                          {jalon.jalonId}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: axeConfig.color, color: '#fff' }}
                        >
                          {axeConfig.labelCourt}
                        </span>
                        <StatutBadge statut={jalon.statut} />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg">{jalon.titre}</h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{formatDate(jalon.date)}</span>
                      </div>
                      <div className={`text-sm font-medium ${daysUntil < 7 ? 'text-red-600' : daysUntil < 14 ? 'text-amber-600' : 'text-green-600'}`}>
                        {daysUntil > 0 ? `J-${daysUntil}` : daysUntil === 0 ? 'Aujourd\'hui' : `J+${Math.abs(daysUntil)}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{jalon.responsable}</span>
                    </div>
                  </div>

                  {/* Critères de succès */}
                  {jalon.criteres && jalon.criteres.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                        <ListChecks className="h-3 w-3" />
                        Critères de succès:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {jalon.criteres.map((critere, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-white rounded border border-gray-200"
                          >
                            {critere}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions requises */}
                  {jalon.actionsRequises && jalon.actionsRequises.length > 0 && (
                    <div
                      className="p-2 rounded border-l-4"
                      style={{ backgroundColor: `${accentColor}10`, borderColor: accentColor }}
                    >
                      <div className="flex items-center gap-1 text-xs font-semibold mb-1" style={{ color: accentColor }}>
                        <Target className="h-3 w-3" />
                        Actions requises:
                      </div>
                      <ul className="text-xs text-gray-700 space-y-0.5">
                        {jalon.actionsRequises.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span style={{ color: accentColor }}>→</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
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
