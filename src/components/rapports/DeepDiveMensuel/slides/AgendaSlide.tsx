// ============================================================================
// SLIDE 2 - Agenda
// ============================================================================

import React from 'react';
import { Clock } from 'lucide-react';
import { AGENDA_CONFIG } from '@/data/deepDiveMensuelTemplate';

interface AgendaSlideProps {
  designSettings: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
}

export function AgendaSlide({ designSettings }: AgendaSlideProps) {
  const { primaryColor, fontFamily } = designSettings;

  return (
    <div style={{ fontFamily }} className="h-full flex flex-col bg-white">
      {/* Header */}
      <div
        className="px-6 py-4"
        style={{ backgroundColor: primaryColor }}
      >
        <h2 className="text-xl font-bold text-white">AGENDA</h2>
        <p className="text-white/80 text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Durée totale : 2h00
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b-2" style={{ borderColor: primaryColor }}>
              <th className="py-2 px-3 text-sm font-semibold text-gray-500 w-12">#</th>
              <th className="py-2 px-3 text-sm font-semibold text-gray-500">Section</th>
              <th className="py-2 px-3 text-sm font-semibold text-gray-500 w-24 text-right">Durée</th>
            </tr>
          </thead>
          <tbody>
            {AGENDA_CONFIG.map((item, index) => (
              <tr
                key={item.numero}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {item.numero}
                  </span>
                </td>
                <td className="py-3 px-3 font-medium text-gray-800">
                  {item.section}
                </td>
                <td className="py-3 px-3 text-right">
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                    }}
                  >
                    {item.duree}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
