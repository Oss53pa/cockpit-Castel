import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { SYNC_CONFIG } from '@/config/syncConfig';
import type { SyncSnapshot } from '@/types/sync.types';

interface SyncTimelineProps {
  snapshots: SyncSnapshot[];
  timeRange: '1M' | '3M' | '6M' | 'ALL';
  onTimeRangeChange: (range: '1M' | '3M' | '6M' | 'ALL') => void;
}

export const SyncTimeline: React.FC<SyncTimelineProps> = ({
  snapshots,
  timeRange,
  onTimeRangeChange,
}) => {
  // Filter by time range
  const filterByRange = (data: SyncSnapshot[]) => {
    const now = new Date();
    const ranges = {
      '1M': 30,
      '3M': 90,
      '6M': 180,
      ALL: Infinity,
    };
    const days = ranges[timeRange];
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return data.filter((s) => new Date(s.snapshotDate) >= cutoff);
  };

  const filteredData = filterByRange(snapshots)
    .sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime())
    .map((s) => ({
      date: new Date(s.snapshotDate).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      }),
      projet: s.projectProgress,
      mobilisation: s.mobilizationProgress,
      ecart: s.syncGap,
    }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Évolution de la Synchronisation</h3>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['1M', '3M', '6M', 'ALL'] as const).map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-white shadow text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range === 'ALL' ? 'Tout' : range}
            </button>
          ))}
        </div>
      </div>

      {filteredData.length > 0 ? (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
              formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
            />
            <Legend />
            <ReferenceLine y={50} stroke="#9CA3AF" strokeDasharray="5 5" />
            <Line
              type="monotone"
              dataKey="projet"
              name="Projet"
              stroke={SYNC_CONFIG.colors.project}
              strokeWidth={3}
              dot={{ fill: SYNC_CONFIG.colors.project, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="mobilisation"
              name="Mobilisation"
              stroke={SYNC_CONFIG.colors.mobilization}
              strokeWidth={3}
              dot={{ fill: SYNC_CONFIG.colors.mobilization, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          Aucun historique disponible. Créez un premier snapshot.
        </div>
      )}
    </div>
  );
};

export default SyncTimeline;
