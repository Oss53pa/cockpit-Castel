// ============================================================================
// SLIDE 2.2-2.7 - Détail par Axe (Composant générique)
// ============================================================================

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Clock,
  AlertCircle,
  Target,
  DollarSign,
  Shield,
  Calendar,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import type { DetailAxeData, MeteoNiveau } from '@/types/deepDive';
import { METEO_EMOJI_CONFIG } from '@/types/deepDive';

interface DetailAxeSlideProps {
  data: DetailAxeData;
  designSettings: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
  periode: string;
}

export function DetailAxeSlide({ data, designSettings, periode }: DetailAxeSlideProps) {
  const { primaryColor, fontFamily } = designSettings;
  const meteoConfig = METEO_EMOJI_CONFIG[data.meteo];

  const formatMontant = (montant: number): string => {
    if (montant >= 1_000_000) {
      return `${(montant / 1_000_000).toFixed(1)}M FCFA`;
    }
    if (montant >= 1_000) {
      return `${(montant / 1_000).toFixed(0)}K FCFA`;
    }
    return `${montant} FCFA`;
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'atteint':
      case 'termine':
        return { bg: '#DCFCE7', color: '#15803D', label: 'Terminé' };
      case 'en_cours':
        return { bg: '#DBEAFE', color: '#1D4ED8', label: 'En cours' };
      case 'en_retard':
      case 'en_danger':
      case 'depasse':
        return { bg: '#FEE2E2', color: '#B91C1C', label: 'En retard' };
      default:
        return { bg: '#F3F4F6', color: '#4B5563', label: 'Planifié' };
    }
  };

  const jalonsAtteints = data.jalons.filter(j => j.statut === 'atteint').length;
  const actionsTerminees = data.actions.filter(a => a.statut === 'termine').length;
  const actionsEnRetard = data.actions.filter(a => a.statut === 'en_retard').length;
  const risquesCritiques = data.risques.filter(r => r.niveau === 'critique').length;

  return (
    <div style={{ fontFamily }} className="h-full flex flex-col bg-white">
      {/* Header */}
      <div
        className="px-6 py-3 flex items-center justify-between"
        style={{ backgroundColor: data.color }}
      >
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">{data.label}</h2>
            <p className="text-white/80 text-sm">{periode}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Avancement */}
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{data.avancement}%</div>
            <div className="text-xs text-white/80">Avancement</div>
          </div>
          {/* Météo */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
          >
            <span className="text-2xl emoji">{meteoConfig.emoji}</span>
            <span className="font-bold" style={{ color: meteoConfig.color }}>
              {meteoConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex-1 p-3 overflow-auto">
        <div className="grid grid-cols-3 gap-3 h-full">
          {/* Colonne 1: Jalons + Actions */}
          <div className="space-y-3">
            {/* Jalons */}
            <div className="p-3 bg-gray-50 rounded-lg h-[45%]">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" style={{ color: data.color }} />
                <span className="font-semibold text-sm" style={{ color: primaryColor }}>
                  Jalons
                </span>
                <span className="ml-auto text-xs font-bold" style={{ color: data.color }}>
                  {jalonsAtteints}/{data.jalons.length}
                </span>
              </div>
              <div className="space-y-1 overflow-auto max-h-[calc(100%-30px)]">
                {data.jalons.slice(0, 4).map((jalon) => {
                  const badge = getStatutBadge(jalon.statut);
                  return (
                    <div
                      key={jalon.id}
                      className="flex items-center gap-2 p-1.5 bg-white rounded text-xs"
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: badge.color }}
                      />
                      <span className="flex-1 truncate">{jalon.titre}</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                      >
                        {new Date(jalon.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  );
                })}
                {data.jalons.length === 0 && (
                  <p className="text-xs text-gray-400 italic">Aucun jalon</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 bg-gray-50 rounded-lg h-[55%]">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4" style={{ color: data.color }} />
                <span className="font-semibold text-sm" style={{ color: primaryColor }}>
                  Actions
                </span>
                <span className="ml-auto flex gap-1 text-xs">
                  <span className="text-green-600 font-bold">{actionsTerminees}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-blue-600">{data.actions.filter(a => a.statut === 'en_cours').length}</span>
                  {actionsEnRetard > 0 && (
                    <>
                      <span className="text-gray-400">/</span>
                      <span className="text-red-600 font-bold">{actionsEnRetard}</span>
                    </>
                  )}
                </span>
              </div>
              <div className="space-y-1 overflow-auto max-h-[calc(100%-30px)]">
                {data.actions.slice(0, 5).map((action) => {
                  const badge = getStatutBadge(action.statut);
                  return (
                    <div
                      key={action.id}
                      className="p-1.5 bg-white rounded text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: badge.color }}
                        />
                        <span className="flex-1 truncate">{action.titre}</span>
                        <span className="text-gray-500 shrink-0">{action.avancement}%</span>
                      </div>
                      <div className="ml-4 mt-0.5 h-1 bg-gray-200 rounded-full">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${action.avancement}%`,
                            backgroundColor: badge.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {data.actions.length === 0 && (
                  <p className="text-xs text-gray-400 italic">Aucune action</p>
                )}
              </div>
            </div>
          </div>

          {/* Colonne 2: Budget + Points Clés */}
          <div className="space-y-3">
            {/* Budget */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4" style={{ color: data.color }} />
                <span className="font-semibold text-sm" style={{ color: primaryColor }}>
                  Budget
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Prévu:</span>
                  <span className="font-medium">{formatMontant(data.budget.prevu)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Réalisé:</span>
                  <span className="font-bold" style={{ color: data.color }}>
                    {formatMontant(data.budget.realise)}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(data.budget.pourcentage, 100)}%`,
                      backgroundColor: data.budget.pourcentage > 100 ? '#EF4444' : data.color,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{data.budget.pourcentage}% consommé</span>
                  <span className={data.budget.ecart >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {data.budget.ecart >= 0 ? '+' : ''}{formatMontant(data.budget.ecart)}
                  </span>
                </div>
              </div>
            </div>

            {/* Points Clés */}
            <div className="p-3 bg-gray-50 rounded-lg flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4" style={{ color: data.color }} />
                <span className="font-semibold text-sm" style={{ color: primaryColor }}>
                  Points Clés du Mois
                </span>
              </div>
              <div className="space-y-1">
                {data.pointsCles.length > 0 ? (
                  data.pointsCles.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <span style={{ color: data.color }}>•</span>
                      <span className="text-gray-700">{point}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    Jalons: {jalonsAtteints}/{data.jalons.length} atteints<br />
                    Actions: {actionsTerminees} terminées, {data.actions.filter(a => a.statut === 'en_cours').length} en cours
                  </p>
                )}
              </div>
            </div>

            {/* Focus M+1 */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-sm text-blue-800">Focus M+1</span>
              </div>
              <div className="space-y-1">
                {data.focusM1.length > 0 ? (
                  data.focusM1.map((focus, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-blue-600">→</span>
                      <span className="text-blue-800">{focus}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-blue-600 italic">
                    {data.actions.filter(a => a.statut !== 'termine').length} actions à poursuivre
                  </p>
                )}
              </div>
            </div>

            {/* Points d'Attention */}
            {data.pointsAttention && data.pointsAttention.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold text-sm text-amber-800">
                    Points d'Attention ({data.pointsAttention.length})
                  </span>
                </div>
                <div className="space-y-1 max-h-24 overflow-auto">
                  {data.pointsAttention.slice(0, 4).map((pa) => (
                    <div key={pa.id} className="flex items-start gap-2 text-xs">
                      <span className="text-amber-600">⚠</span>
                      <div className="flex-1">
                        <span className="text-amber-800">{pa.sujet}</span>
                        {pa.responsableNom && (
                          <span className="text-amber-600 ml-1">({pa.responsableNom})</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Décisions Attendues */}
            {data.decisionsAttendues && data.decisionsAttendues.length > 0 && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="h-4 w-4 text-purple-600" />
                  <span className="font-semibold text-sm text-purple-800">
                    Décisions Attendues ({data.decisionsAttendues.length})
                  </span>
                </div>
                <div className="space-y-1 max-h-24 overflow-auto">
                  {data.decisionsAttendues.slice(0, 4).map((da) => (
                    <div key={da.id} className="flex items-start gap-2 text-xs">
                      <span className="text-purple-600">?</span>
                      <span className="text-purple-800">{da.sujet}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Colonne 3: Risques */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4" style={{ color: data.color }} />
              <span className="font-semibold text-sm" style={{ color: primaryColor }}>
                Risques
              </span>
              {risquesCritiques > 0 && (
                <span className="ml-auto px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">
                  {risquesCritiques} critiques
                </span>
              )}
            </div>
            <div className="space-y-2 overflow-auto max-h-[calc(100%-40px)]">
              {data.risques.slice(0, 6).map((risque) => {
                const niveauColors = {
                  critique: { bg: '#FEE2E2', color: '#B91C1C' },
                  majeur: { bg: '#FFEDD5', color: '#C2410C' },
                  modere: { bg: '#FEF9C3', color: '#A16207' },
                  faible: { bg: '#DCFCE7', color: '#15803D' },
                };
                const colors = niveauColors[risque.niveau];

                return (
                  <div
                    key={risque.id}
                    className="p-2 bg-white rounded border-l-3"
                    style={{ borderLeftColor: colors.color, borderLeftWidth: 3 }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-gray-800 line-clamp-2">
                        {risque.titre}
                      </span>
                      <span
                        className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold"
                        style={{ backgroundColor: colors.bg, color: colors.color }}
                      >
                        {risque.score}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-[10px] px-1 rounded"
                        style={{ backgroundColor: colors.bg, color: colors.color }}
                      >
                        {risque.niveau}
                      </span>
                      {risque.tendance === 'hausse' && (
                        <TrendingUp className="h-3 w-3 text-red-500" />
                      )}
                      {risque.tendance === 'baisse' && (
                        <TrendingDown className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  </div>
                );
              })}
              {data.risques.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center py-4">
                  Aucun risque identifié
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
