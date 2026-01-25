import React from 'react';
import { SYNC_CONFIG } from '@/config/syncConfig';
import type { SyncAlertLevel } from '@/types/sync.types';

interface SyncGaugeProps {
  projectProgress: number;
  mobilizationProgress: number;
  gap: number;
  gapDays: number;
  alertLevel: SyncAlertLevel;
}

export const SyncGauge: React.FC<SyncGaugeProps> = ({
  projectProgress,
  mobilizationProgress,
  gap,
  gapDays,
  alertLevel,
}) => {
  const alertStyles = SYNC_CONFIG.alertStyles[alertLevel];

  const CircularProgress = ({
    progress,
    color,
    label,
  }: {
    progress: number;
    color: string;
    label: string;
  }) => {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
      <div className="flex flex-col items-center relative">
        <svg width="140" height="140" className="transform -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="#E5E7EB"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke={color}
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{progress.toFixed(0)}%</span>
        </div>
        <span className="mt-2 font-medium text-gray-700">{label}</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-center gap-8 lg:gap-12">
        {/* Project Gauge */}
        <CircularProgress
          progress={projectProgress}
          color={SYNC_CONFIG.colors.project}
          label="Projet"
        />

        {/* Gap Indicator */}
        <div
          className={`flex flex-col items-center p-4 lg:p-6 rounded-xl border-2 ${alertStyles.bg} ${alertStyles.border}`}
        >
          <span className="text-xs font-medium uppercase tracking-wide text-gray-600">
            Écart
          </span>
          <span className={`text-3xl lg:text-4xl font-bold ${alertStyles.text}`}>
            {gap > 0 ? '+' : ''}{gap.toFixed(0)}%
          </span>
          <span className="text-sm mt-1 text-gray-600">
            ~{Math.abs(gapDays)} jours
          </span>
          <span className="text-xs mt-2 text-gray-500">
            {gap > 0 ? 'Projet en avance' : gap < 0 ? 'Mobilisation en avance' : 'Synchronisé'}
          </span>
        </div>

        {/* Mobilization Gauge */}
        <CircularProgress
          progress={mobilizationProgress}
          color={SYNC_CONFIG.colors.mobilization}
          label="Mobilisation"
        />
      </div>

      {/* Progress bar comparison */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500 w-24">Projet</span>
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${projectProgress}%`,
                backgroundColor: SYNC_CONFIG.colors.project,
              }}
            />
          </div>
          <span className="text-sm font-semibold w-12 text-right" style={{ color: SYNC_CONFIG.colors.project }}>
            {projectProgress.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500 w-24">Mobilisation</span>
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${mobilizationProgress}%`,
                backgroundColor: SYNC_CONFIG.colors.mobilization,
              }}
            />
          </div>
          <span className="text-sm font-semibold w-12 text-right" style={{ color: SYNC_CONFIG.colors.mobilization }}>
            {mobilizationProgress.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default SyncGauge;
