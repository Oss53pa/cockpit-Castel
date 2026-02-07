// ============================================================================
// SLIDE 1 - Page de Garde
// ============================================================================

import React from 'react';
import { PROJET_CONFIG } from '@/data/constants';

interface PageGardeSlideProps {
  data: {
    projectName: string;
    mois: string; // "Janvier 2026"
    date: string; // "JJ/MM/AAAA"
    presentateur: string;
  };
  designSettings: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
}

export function PageGardeSlide({ data, designSettings }: PageGardeSlideProps) {
  const { primaryColor, fontFamily } = designSettings;

  return (
    <div style={{ fontFamily }} className="h-full flex flex-col bg-white">
      {/* Main content centered */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-8">
          {/* Project Name */}
          <h1
            className="text-4xl font-bold mb-8 tracking-wide"
            style={{ color: primaryColor }}
          >
            {data.projectName}
          </h1>

          {/* Decorative line */}
          <div
            className="w-48 h-1 mx-auto mb-8 rounded-full"
            style={{ backgroundColor: primaryColor }}
          />

          {/* EXCO Title */}
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            EXCO MENSUEL
          </h2>
          <p
            className="text-3xl font-bold mb-12"
            style={{ color: primaryColor }}
          >
            {data.mois}
          </p>

          {/* Presenter Info */}
          <div className="space-y-2 text-gray-600">
            <p className="text-lg">
              Présenté par : <span className="font-semibold">{data.presentateur}</span>
            </p>
            <p className="text-lg">
              Date : <span className="font-semibold">{data.date}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer with company name */}
      <div
        className="py-4 text-center"
        style={{ backgroundColor: `${primaryColor}10` }}
      >
        <span
          className="text-lg font-bold tracking-widest"
          style={{ color: primaryColor }}
        >
          {PROJET_CONFIG.societe.split(' / ')[0]}
        </span>
      </div>
    </div>
  );
}
