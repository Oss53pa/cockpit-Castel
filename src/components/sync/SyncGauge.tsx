import React from 'react';
import { Info } from 'lucide-react';
import { SYNC_CONFIG } from '@/config/syncConfig';
import { Tooltip } from '@/components/ui';
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
      {/* Header with explanation tooltip */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Sync. CC / Mobilisation</h3>
        <Tooltip
          content={
            <div className="max-w-xs p-2 text-sm">
              <p className="font-semibold mb-2">Synchronisation Centre Commercial</p>
              <p className="text-gray-300 mb-2">
                Compare l'avancement du <strong>Centre Commercial (CC) uniquement</strong>
                avec la préparation opérationnelle (moyenne pondérée des 5 axes).
              </p>
              <ul className="text-xs text-gray-400 space-y-1 mb-2">
                <li><strong>Construction</strong> = Progression du bâtiment CC</li>
                <li><strong>Mobilisation</strong> = Moyenne pondérée (RH, Commercial, Budget, Marketing, Exploitation)</li>
              </ul>
              <p className="text-xs text-gray-400 mb-2">
                <strong>Formule :</strong> Écart = % CC - % Mobilisation
              </p>
              <div className="text-xs space-y-1 border-t border-gray-600 pt-2 mt-2">
                <p className="text-green-400">🟢 |Écart| ≤ 5% : Synchronisé</p>
                <p className="text-yellow-400">🟡 5% &lt; |Écart| ≤ 15% : Attention</p>
                <p className="text-red-400">🔴 |Écart| &gt; 15% : Désynchronisé</p>
              </div>
              <p className="text-xs text-gray-500 border-t border-gray-600 pt-2 mt-2">
                Différent de "Sync. Actions" qui prend toutes les actions techniques.
              </p>
            </div>
          }
        >
          <Info className="h-5 w-5 text-primary-400 cursor-help hover:text-primary-600 transition-colors" />
        </Tooltip>
      </div>

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
