// ============================================================================
// SLIDE 1.2 - Faits Marquants du Mois
// ============================================================================

import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import type { FaitsMarquantsData, FaitMarquant } from '@/types/exco';
import { AXES_MENSUEL_CONFIG } from '@/data/excoMensuelTemplate';

interface FaitsMarquantsSlideProps {
  data: FaitsMarquantsData;
  designSettings: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
}

const FaitMarquantItem: React.FC<{
  fait: FaitMarquant;
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
}> = ({ fait, icon, bgColor, borderColor }) => {
  const axeConfig = fait.axe ? AXES_MENSUEL_CONFIG[fait.axe] : null;

  return (
    <div
      className="p-3 rounded-lg border-l-4 flex items-start gap-3"
      style={{ backgroundColor: bgColor, borderColor }}
    >
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-gray-900 truncate">
            {fait.titre}
          </span>
          {axeConfig && (
            <span
              className="text-xs px-1.5 py-0.5 rounded font-medium shrink-0"
              style={{ backgroundColor: axeConfig.color, color: '#fff' }}
            >
              {axeConfig.labelCourt}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 line-clamp-2">{fait.description}</p>
        {fait.date && (
          <p className="text-xs text-gray-400 mt-1">
            {new Date(fait.date).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>
    </div>
  );
};

export function FaitsMarquantsSlide({ data, designSettings }: FaitsMarquantsSlideProps) {
  const { primaryColor, fontFamily } = designSettings;

  return (
    <div style={{ fontFamily }} className="h-full flex flex-col bg-white">
      {/* Header */}
      <div
        className="px-6 py-4"
        style={{ backgroundColor: primaryColor }}
      >
        <h2 className="text-xl font-bold text-white">1.2 Faits Marquants du Mois</h2>
        <p className="text-white/80 text-sm">{data.periode}</p>
      </div>

      {/* Content - 3 colonnes */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-3 gap-4 h-full">
          {/* Réalisations */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-green-500">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h3 className="font-bold text-green-700">Réalisations</h3>
              <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {data.realisations.length}
              </span>
            </div>
            <div className="flex-1 space-y-2 overflow-auto">
              {data.realisations.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">
                  Aucune réalisation majeure ce mois
                </p>
              ) : (
                data.realisations.map((fait) => (
                  <FaitMarquantItem
                    key={fait.id}
                    fait={fait}
                    icon={<CheckCircle className="h-4 w-4 text-green-500" />}
                    bgColor="#ECFDF5"
                    borderColor="#10B981"
                  />
                ))
              )}
            </div>
          </div>

          {/* Points d'attention */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-amber-500">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-amber-700">Points d'attention</h3>
              <span className="ml-auto bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {data.attentions.length}
              </span>
            </div>
            <div className="flex-1 space-y-2 overflow-auto">
              {data.attentions.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">
                  Aucun point d'attention particulier
                </p>
              ) : (
                data.attentions.map((fait) => (
                  <FaitMarquantItem
                    key={fait.id}
                    fait={fait}
                    icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
                    bgColor="#FFFBEB"
                    borderColor="#F59E0B"
                  />
                ))
              )}
            </div>
          </div>

          {/* Alertes */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-red-500">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h3 className="font-bold text-red-700">Alertes</h3>
              <span className="ml-auto bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {data.alertes.length}
              </span>
            </div>
            <div className="flex-1 space-y-2 overflow-auto">
              {data.alertes.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">
                  Aucune alerte critique
                </p>
              ) : (
                data.alertes.map((fait) => (
                  <FaitMarquantItem
                    key={fait.id}
                    fait={fait}
                    icon={<AlertCircle className="h-4 w-4 text-red-500" />}
                    bgColor="#FEF2F2"
                    borderColor="#EF4444"
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
