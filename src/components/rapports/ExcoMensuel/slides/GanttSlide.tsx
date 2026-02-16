// ============================================================================
// SLIDE 6.1 - Planning Jalons (Gantt simplifié)
// ============================================================================

import React, { useMemo } from 'react';
import { Calendar, Flag, AlertCircle } from 'lucide-react';
import type { GanttSimplifiedData } from '@/types/exco';
import { AXES_MENSUEL_CONFIG } from '@/data/excoMensuelTemplate';
import { PROJET_CONFIG } from '@/data/constants';

const PROJECT_PHASES = PROJET_CONFIG.phases;

interface GanttSlideProps {
  data: GanttSimplifiedData;
  designSettings: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
  periode: string;
}

export function GanttSlide({ data, designSettings, periode }: GanttSlideProps) {
  const { primaryColor, accentColor, fontFamily } = designSettings;

  // Calcul des dimensions du Gantt
  const ganttConfig = useMemo(() => {
    const startDate = new Date(data.dateDebut);
    const endDate = new Date(data.dateFin);
    const currentDate = new Date(data.dateActuelle);

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const progressPercent = (daysPassed / totalDays) * 100;

    // Générer les mois pour l'axe horizontal
    const months: { label: string; startPercent: number; width: number }[] = [];
    const currentMonth = new Date(startDate);
    while (currentMonth <= endDate) {
      const monthStart = new Date(Math.max(currentMonth.getTime(), startDate.getTime()));
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const actualEnd = new Date(Math.min(monthEnd.getTime(), endDate.getTime()));

      const startDays = Math.ceil((monthStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const endDays = Math.ceil((actualEnd.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      months.push({
        label: `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`,
        startPercent: (startDays / totalDays) * 100,
        width: ((endDays - startDays) / totalDays) * 100,
      });

      currentMonth.setMonth(currentMonth.getMonth() + 1);
      currentMonth.setDate(1);
    }

    return {
      totalDays,
      progressPercent: Math.min(progressPercent, 100),
      months,
      startDate,
      endDate,
    };
  }, [data]);

  const getJalonPosition = (dateStr: string): number => {
    const date = new Date(dateStr);
    const days = Math.ceil((date.getTime() - ganttConfig.startDate.getTime()) / (1000 * 60 * 60 * 24));
    return (days / ganttConfig.totalDays) * 100;
  };

  const statutColors = {
    atteint: '#10B981',
    en_cours: '#3B82F6',
    a_venir: '#9CA3AF',
    en_danger: '#EF4444',
  };

  // Grouper les jalons par phase depuis la configuration centralisée
  const phases = useMemo(() => {
    // Utiliser les phases définies localement
    return PROJECT_PHASES.map(phase => ({
      label: phase.label,
      start: phase.dateDebut,
      end: phase.dateFin,
      jalons: data.jalons.filter(j =>
        new Date(j.dateDebut) >= new Date(phase.dateDebut) &&
        new Date(j.dateDebut) <= new Date(phase.dateFin)
      ),
    }));
  }, [data.jalons]);

  return (
    <div style={{ fontFamily }} className="h-full flex flex-col bg-white">
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: primaryColor }}
      >
        <div>
          <h2 className="text-xl font-bold text-white">6.1 Planning Jalons</h2>
          <p className="text-white/80 text-sm">Gantt simplifié - {periode}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white text-sm">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span>Atteint</span>
            <div className="w-3 h-3 rounded-full bg-blue-400 ml-2" />
            <span>En cours</span>
            <div className="w-3 h-3 rounded-full bg-red-400 ml-2" />
            <span>En danger</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {/* Timeline Header */}
        <div className="relative mb-2">
          <div className="flex h-8 border-b border-gray-300">
            {ganttConfig.months.map((month, idx) => (
              <div
                key={idx}
                className="text-xs font-medium text-gray-600 border-r border-gray-200 flex items-center justify-center"
                style={{ width: `${month.width}%`, marginLeft: idx === 0 ? `${month.startPercent}%` : 0 }}
              >
                {month.label}
              </div>
            ))}
          </div>
          {/* Ligne de progression actuelle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
            style={{ left: `${ganttConfig.progressPercent}%` }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
            <div className="absolute top-full mt-1 -left-4 text-xs text-red-600 font-medium whitespace-nowrap">
              Aujourd'hui
            </div>
          </div>
        </div>

        {/* Phases & Jalons */}
        <div className="space-y-4">
          {phases.map((phase, phaseIdx) => (
            <div key={phaseIdx}>
              {/* Phase Header */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{ backgroundColor: primaryColor, color: '#fff' }}
                >
                  {phase.label}
                </span>
                <span className="text-xs text-gray-500">
                  {phase.jalons.length} jalons
                </span>
              </div>

              {/* Gantt Rows */}
              <div className="relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                {/* Grid lines */}
                <div className="absolute inset-0 flex">
                  {ganttConfig.months.map((month, idx) => (
                    <div
                      key={idx}
                      className="border-r border-gray-200 h-full"
                      style={{ width: `${month.width}%` }}
                    />
                  ))}
                </div>

                {/* Jalons */}
                {phase.jalons.length === 0 ? (
                  <div className="h-12 flex items-center justify-center text-xs text-gray-400">
                    Aucun jalon dans cette phase
                  </div>
                ) : (
                  <div className="relative" style={{ minHeight: phase.jalons.length * 36 }}>
                    {phase.jalons.map((jalon, idx) => {
                      const position = getJalonPosition(jalon.dateDebut);
                      const axeConfig = AXES_MENSUEL_CONFIG[jalon.axe];
                      const color = statutColors[jalon.statut as keyof typeof statutColors] || '#9CA3AF';

                      return (
                        <div
                          key={jalon.id}
                          className="absolute flex items-center gap-2 h-8"
                          style={{
                            top: idx * 36 + 4,
                            left: `${Math.max(position - 1, 0)}%`,
                          }}
                        >
                          {/* Marker */}
                          <div
                            className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                            style={{
                              backgroundColor: jalon.statut === 'atteint' ? color : '#fff',
                              borderColor: color,
                            }}
                          >
                            {jalon.estCritique && (
                              <Flag className="h-2 w-2" style={{ color: jalon.statut === 'atteint' ? '#fff' : color }} />
                            )}
                          </div>

                          {/* Label */}
                          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded shadow-sm border text-xs max-w-[200px]">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: axeConfig.color }}
                            />
                            <span className="truncate font-medium text-gray-800">
                              {jalon.titre}
                            </span>
                            {jalon.statut === 'en_danger' && (
                              <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Légende */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-1">
              <Flag className="h-3 w-3 text-gray-500" />
              <span className="text-gray-500">Jalon critique</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-0.5 h-4 bg-red-500" />
              <span className="text-gray-500">Date actuelle</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
