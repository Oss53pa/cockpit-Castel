// ============================================================================
// SLIDE 14 - Synthèse & Clôture
// Ce qui va bien + Points de vigilance + Décisions du jour + Prochain EXCO
// ============================================================================

import React from 'react';
import { CheckCircle, AlertTriangle, FileCheck, Calendar } from 'lucide-react';

interface SyntheseCloureSlideProps {
  data: {
    pointsPositifs: string[];
    pointsVigilance: string[];
    decisionsJour: { id: string; decision: string }[];
    prochainExco: {
      date: string;
      heure: string;
      focusParticulier?: string;
    };
  };
  designSettings: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
}

export function SyntheseCloureSlide({ data, designSettings }: SyntheseCloureSlideProps) {
  const { primaryColor, fontFamily } = designSettings;
  const { pointsPositifs, pointsVigilance, decisionsJour, prochainExco } = data;

  return (
    <div style={{ fontFamily }} className="h-full flex flex-col bg-white">
      {/* Header */}
      <div
        className="px-6 py-3"
        style={{ backgroundColor: primaryColor }}
      >
        <h2 className="text-xl font-bold text-white">SYNTHÈSE & CLÔTURE</h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto grid grid-cols-2 gap-4">
        {/* TOP LEFT: Ce qui va bien */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            Ce qui va bien
          </h3>
          <ul className="space-y-2 text-sm text-green-800">
            {pointsPositifs.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* TOP RIGHT: Points de vigilance */}
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            Points de vigilance
          </h3>
          <ul className="space-y-2 text-sm text-amber-800">
            {pointsVigilance.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">⚠</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* BOTTOM LEFT: Décisions du jour */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-blue-700">
            <FileCheck className="h-5 w-5" />
            Décisions du jour
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blue-200">
                <th className="py-1 text-left text-blue-600 w-8">#</th>
                <th className="py-1 text-left text-blue-600">Décision</th>
              </tr>
            </thead>
            <tbody>
              {decisionsJour.map((decision, idx) => (
                <tr key={decision.id} className="border-b border-blue-100">
                  <td className="py-2 text-blue-500 font-medium">{idx + 1}</td>
                  <td className="py-2 text-blue-800">{decision.decision}</td>
                </tr>
              ))}
              {decisionsJour.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-3 text-center text-blue-400 italic">
                    À compléter en réunion
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* BOTTOM RIGHT: Prochain EXCO */}
        <div
          className="rounded-lg p-4 border-2 flex flex-col justify-center"
          style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}08` }}
        >
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: primaryColor }}>
            <Calendar className="h-5 w-5" />
            Prochain EXCO
          </h3>
          <div className="space-y-3 text-center">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Date</div>
              <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                {new Date(prochainExco.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Heure</div>
              <div className="text-xl font-semibold" style={{ color: primaryColor }}>
                {prochainExco.heure}
              </div>
            </div>
            {prochainExco.focusParticulier && (
              <div
                className="mt-4 p-2 rounded-lg text-sm"
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                <span className="font-medium">Focus particulier :</span>
                <br />
                {prochainExco.focusParticulier}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
