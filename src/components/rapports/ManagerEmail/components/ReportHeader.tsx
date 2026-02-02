// ============================================================================
// COMPOSANT - En-tête du Rapport Mensuel
// ============================================================================

import React from 'react';
import { Calendar, Clock, Building2 } from 'lucide-react';

interface ReportHeaderProps {
  periodeLabel: string;
  projectName: string;
  joursRestants: number;
  dateGeneration: Date;
}

export function ReportHeader({
  periodeLabel,
  projectName,
  joursRestants,
  dateGeneration,
}: ReportHeaderProps) {
  const formattedDate = dateGeneration.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = dateGeneration.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Titre principal */}
        <div className="text-center mb-6">
          <p className="text-zinc-400 text-sm font-semibold tracking-wider uppercase mb-2">
            COCKPIT Project Management
          </p>
          <div className="w-16 h-0.5 bg-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">
            RAPPORT MENSUEL DÉTAILLÉ
          </h1>
          <p className="text-xl text-zinc-300">
            {periodeLabel}
          </p>
        </div>

        {/* Infos projet et génération */}
        <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-300">Projet :</span>
            <span className="font-semibold">{projectName}</span>
          </div>

          <div className="hidden sm:block w-px h-4 bg-zinc-600" />

          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold">J-{joursRestants}</span>
            <span className="text-zinc-400">avant ouverture</span>
          </div>

          <div className="hidden sm:block w-px h-4 bg-zinc-600" />

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-400">Généré le</span>
            <span className="text-zinc-300">{formattedDate} à {formattedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportHeader;
