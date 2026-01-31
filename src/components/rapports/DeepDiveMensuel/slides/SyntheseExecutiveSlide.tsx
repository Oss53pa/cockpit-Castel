// ============================================================================
// SLIDE 3 - Synthèse Exécutive
// Compte à Rebours + Météo Globale + KPIs Clés + Faits Marquants
// ============================================================================

import React from 'react';
import { TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import type { MeteoGlobaleData, FaitsMarquantsData, MeteoNiveau, TendanceType } from '@/types/deepDive';
import { METEO_EMOJI_CONFIG } from '@/types/deepDive';
import { formatCompteRebours, getJoursRestants, JALONS_CLES_COMPTE_REBOURS, METEO_LABELS } from '@/data/deepDiveMensuelTemplate';
import { SEUILS_UI } from '@/data/constants';

interface SyntheseExecutiveSlideProps {
  data: {
    meteoGlobale: MeteoGlobaleData;
    faitsMarquants: FaitsMarquantsData;
    compteRebours?: { code: string; label: string; date: string }[];
  };
  designSettings: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
}

const TendanceIcon: React.FC<{ tendance: TendanceType; className?: string }> = ({ tendance, className }) => {
  switch (tendance) {
    case 'hausse':
      return <TrendingUp className={className} style={{ color: '#10B981' }} />;
    case 'baisse':
      return <TrendingDown className={className} style={{ color: '#EF4444' }} />;
    default:
      return <Minus className={className} style={{ color: '#6B7280' }} />;
  }
};

const getTendanceArrow = (tendance: TendanceType): string => {
  switch (tendance) {
    case 'hausse': return '↗️';
    case 'baisse': return '↘️';
    default: return '→';
  }
};

export function SyntheseExecutiveSlide({ data, designSettings }: SyntheseExecutiveSlideProps) {
  const { primaryColor, accentColor, fontFamily } = designSettings;
  const meteoConfig = METEO_EMOJI_CONFIG[data.meteoGlobale.meteoGlobale];
  const jalonsCompteRebours = data.compteRebours || JALONS_CLES_COMPTE_REBOURS;

  return (
    <div style={{ fontFamily }} className="h-full flex flex-col bg-white">
      {/* Header */}
      <div
        className="px-6 py-3 flex items-center justify-between"
        style={{ backgroundColor: primaryColor }}
      >
        <h2 className="text-xl font-bold text-white">SYNTHÈSE EXÉCUTIVE</h2>
        <span className="text-white/80 text-sm">{data.meteoGlobale.periode}</span>
      </div>

      {/* Content - Grid Layout */}
      <div className="flex-1 p-4 overflow-auto grid grid-cols-2 gap-4">
        {/* TOP LEFT: Compte à Rebours */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2" style={{ color: primaryColor }}>
            <Calendar className="h-4 w-4" />
            Compte à Rebours
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-1 text-left text-gray-500">Jalon</th>
                <th className="py-1 text-center text-gray-500">Date</th>
                <th className="py-1 text-right text-gray-500">J-</th>
              </tr>
            </thead>
            <tbody>
              {jalonsCompteRebours.map((jalon) => {
                const jours = getJoursRestants(jalon.date);
                return (
                  <tr key={jalon.code} className="border-b border-gray-100">
                    <td className="py-2 font-medium">{jalon.label}</td>
                    <td className="py-2 text-center text-gray-600">
                      {new Date(jalon.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-2 text-right">
                      <span
                        className="px-2 py-0.5 rounded-full font-bold"
                        style={{
                          backgroundColor: jours < SEUILS_UI.compteARebours.critique ? '#FEE2E2' : jours < SEUILS_UI.compteARebours.attention ? '#FEF3C7' : '#D1FAE5',
                          color: jours < SEUILS_UI.compteARebours.critique ? '#DC2626' : jours < SEUILS_UI.compteARebours.attention ? '#D97706' : '#059669',
                        }}
                      >
                        {formatCompteRebours(jours)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* TOP RIGHT: Météo Globale */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h3 className="font-semibold text-sm mb-2" style={{ color: primaryColor }}>
            Météo Globale
          </h3>
          {/* Weather Scale */}
          <div className="flex items-center justify-between mb-3 px-2">
            {Object.entries(METEO_LABELS).map(([key, config]) => (
              <div
                key={key}
                className={`text-center px-2 py-1 rounded ${
                  key === data.meteoGlobale.meteoGlobale ? 'ring-2 ring-offset-1' : 'opacity-50'
                }`}
                style={{
                  ringColor: key === data.meteoGlobale.meteoGlobale ? meteoConfig.color : 'transparent',
                }}
              >
                <div className="text-xl">{config.emoji}</div>
                <div className="text-[10px] text-gray-600">{config.label}</div>
              </div>
            ))}
          </div>
          <div
            className="text-center p-2 rounded-lg"
            style={{ backgroundColor: meteoConfig.bgColor }}
          >
            <span className="text-2xl mr-2">{meteoConfig.emoji}</span>
            <span className="font-bold" style={{ color: meteoConfig.color }}>
              MÉTÉO : {meteoConfig.label.toUpperCase()}
            </span>
          </div>
        </div>

        {/* MIDDLE LEFT: KPIs Clés */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h3 className="font-semibold text-sm mb-2" style={{ color: primaryColor }}>
            KPIs Clés
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-1 text-left text-gray-500">Indicateur</th>
                <th className="py-1 text-center text-gray-500">Actuel</th>
                <th className="py-1 text-center text-gray-500">Cible</th>
                <th className="py-1 text-center text-gray-500">Écart</th>
                <th className="py-1 text-center text-gray-500">Tend.</th>
              </tr>
            </thead>
            <tbody>
              {data.meteoGlobale.kpis.slice(0, 4).map((kpi) => {
                const ecart = ((kpi.valeur - kpi.cible) / kpi.cible * 100).toFixed(0);
                const ecartNum = parseFloat(ecart);
                return (
                  <tr key={kpi.id} className="border-b border-gray-100">
                    <td className="py-1.5 font-medium">{kpi.label}</td>
                    <td className="py-1.5 text-center">
                      {typeof kpi.valeur === 'number'
                        ? kpi.unite === '%'
                          ? `${kpi.valeur}%`
                          : kpi.valeur
                        : kpi.valeur}
                    </td>
                    <td className="py-1.5 text-center text-gray-500">
                      {kpi.unite === '%' ? `${kpi.cible}%` : kpi.cible}
                    </td>
                    <td className="py-1.5 text-center">
                      <span style={{ color: ecartNum >= 0 ? '#10B981' : '#EF4444' }}>
                        {ecartNum >= 0 ? '+' : ''}{ecart}%
                      </span>
                    </td>
                    <td className="py-1.5 text-center">{getTendanceArrow(kpi.tendance)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MIDDLE RIGHT: Faits Marquants */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h3 className="font-semibold text-sm mb-2" style={{ color: primaryColor }}>
            Faits Marquants du Mois
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Réalisations */}
            <div className="bg-green-50 rounded p-2">
              <div className="font-semibold text-green-700 flex items-center gap-1 mb-1">
                <CheckCircle className="h-3 w-3" />
                Réalisations
              </div>
              <ul className="space-y-0.5">
                {data.faitsMarquants.realisations.slice(0, 3).map((fait) => (
                  <li key={fait.id} className="text-green-800">• {fait.titre}</li>
                ))}
              </ul>
            </div>
            {/* Points de Vigilance */}
            <div className="bg-amber-50 rounded p-2">
              <div className="font-semibold text-amber-700 flex items-center gap-1 mb-1">
                <AlertTriangle className="h-3 w-3" />
                Points de Vigilance
              </div>
              <ul className="space-y-0.5">
                {data.faitsMarquants.attentions.slice(0, 3).map((fait) => (
                  <li key={fait.id} className="text-amber-800">• {fait.titre}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
