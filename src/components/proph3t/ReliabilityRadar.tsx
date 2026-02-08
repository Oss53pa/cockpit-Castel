// ============================================================================
// PROPH3T V2 — RELIABILITY RADAR
// Visualisation radar de la fiabilité des acteurs
// ============================================================================

import React from 'react';
import {
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { ReliabilityScore, ReliabilityComparison } from '../../hooks/useProph3tDashboard';

// ============================================================================
// TYPES
// ============================================================================

interface ReliabilityRadarProps {
  comparison: ReliabilityComparison;
  selectedOwner?: string;
  onSelectOwner?: (owner: string) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-amber-500';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
};

const getScoreBg = (score: number): string => {
  if (score >= 80) return 'bg-green-50';
  if (score >= 60) return 'bg-amber-50';
  if (score >= 40) return 'bg-orange-50';
  return 'bg-red-50';
};

const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
  if (trend === 'improving') return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
  if (trend === 'declining') return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-gray-300" />;
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const ReliabilityRadar: React.FC<ReliabilityRadarProps> = ({
  comparison,
  selectedOwner,
  onSelectOwner,
}) => {
  const selectedScore = selectedOwner ? comparison.scores[selectedOwner] : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Award className="w-4.5 h-4.5 text-gray-400" />
            <div>
              <h2 className="text-sm font-medium text-gray-700">
                Radar de Fiabilité
              </h2>
              <p className="text-xs text-gray-400">
                {comparison.owners.length} acteurs · Score moyen: {comparison.averageScore.toFixed(0)}%
              </p>
            </div>
          </div>

          {comparison.topPerformer && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full">
              <Award className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-600">{comparison.topPerformer}</span>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {comparison.needsAttention.length > 0 && (
        <div className="px-5 py-2 bg-amber-50/50 border-b border-amber-50 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-600">
            {comparison.needsAttention.length} acteur(s) nécessitent attention: {comparison.needsAttention.join(', ')}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-50">
        {/* Radar Visual */}
        <div className="p-5">
          <h3 className="text-xs font-medium text-gray-400 mb-3">Vue d'ensemble</h3>
          <RadarChart scores={Object.values(comparison.scores)} />
        </div>

        {/* Ranking List */}
        <div className="p-5">
          <h3 className="text-xs font-medium text-gray-400 mb-3">Classement</h3>
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
            {comparison.ranking.map(item => (
              <RankingRow
                key={item.owner}
                owner={item.owner}
                score={item.score}
                rank={item.rank}
                scoreData={comparison.scores[item.owner]}
                isSelected={selectedOwner === item.owner}
                onSelect={onSelectOwner}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Selected Detail */}
      {selectedScore && (
        <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
          <ScoreDetail score={selectedScore} />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface RadarChartProps {
  scores: ReliabilityScore[];
}

const RadarChart: React.FC<RadarChartProps> = ({ scores }) => {
  const size = 240;
  const center = size / 2;
  const maxRadius = 70;

  // Calculate average components
  const avgCompletion = scores.reduce((sum, s) => sum + s.components.completionRate, 0) / scores.length || 0;
  const avgOnTime = scores.reduce((sum, s) => sum + s.components.onTimeRate, 0) / scores.length || 0;
  const avgResponsiveness = scores.reduce((sum, s) => sum + s.components.responsiveness, 0) / scores.length || 0;
  const avgConsistency = scores.reduce((sum, s) => sum + s.components.consistency, 0) / scores.length || 0;

  const metrics = [
    { label: 'Complétion', value: avgCompletion, angle: 0 },
    { label: 'Ponctualité', value: avgOnTime, angle: 90 },
    { label: 'Réactivité', value: avgResponsiveness, angle: 180 },
    { label: 'Consistance', value: avgConsistency, angle: 270 },
  ];

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="visible">
        {/* Grid circles */}
        {[25, 50, 75, 100].map(pct => (
          <circle
            key={pct}
            cx={center}
            cy={center}
            r={(pct / 100) * maxRadius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="0.75"
          />
        ))}

        {/* Axes */}
        {metrics.map(m => {
          const radians = (m.angle * Math.PI) / 180;
          const x2 = center + Math.cos(radians) * maxRadius;
          const y2 = center - Math.sin(radians) * maxRadius;
          return (
            <line
              key={m.label}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="#f3f4f6"
              strokeWidth="0.75"
            />
          );
        })}

        {/* Value polygon */}
        <polygon
          points={metrics.map(m => {
            const radians = (m.angle * Math.PI) / 180;
            const radius = (m.value / 100) * maxRadius;
            const x = center + Math.cos(radians) * radius;
            const y = center - Math.sin(radians) * radius;
            return `${x},${y}`;
          }).join(' ')}
          fill="rgba(147, 177, 215, 0.15)"
          stroke="rgba(147, 177, 215, 0.6)"
          strokeWidth="1.5"
        />

        {/* Value dots */}
        {metrics.map(m => {
          const radians = (m.angle * Math.PI) / 180;
          const radius = (m.value / 100) * maxRadius;
          const x = center + Math.cos(radians) * radius;
          const y = center - Math.sin(radians) * radius;
          return (
            <circle
              key={`dot-${m.label}`}
              cx={x}
              cy={y}
              r="2.5"
              fill="rgba(147, 177, 215, 0.8)"
            />
          );
        })}

        {/* Labels */}
        {metrics.map(m => {
          const radians = (m.angle * Math.PI) / 180;
          const x = center + Math.cos(radians) * (maxRadius + 18);
          const y = center - Math.sin(radians) * (maxRadius + 18);
          const anchor = m.angle === 0 ? 'start' : m.angle === 180 ? 'end' : 'middle';
          return (
            <text
              key={m.label}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="10"
              fill="#9ca3af"
              fontWeight="400"
            >
              {m.label}
            </text>
          );
        })}

        {/* Center score */}
        <text
          x={center}
          y={center - 5}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="18"
          fill="#6b7280"
          fontWeight="500"
        >
          {Math.round((avgCompletion + avgOnTime + avgResponsiveness + avgConsistency) / 4)}
        </text>
        <text
          x={center}
          y={center + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8"
          fill="#9ca3af"
          fontWeight="400"
        >
          /100
        </text>
      </svg>
    </div>
  );
};

interface RankingRowProps {
  owner: string;
  score: number;
  rank: number;
  scoreData: ReliabilityScore;
  isSelected: boolean;
  onSelect?: (owner: string) => void;
}

const RankingRow: React.FC<RankingRowProps> = ({
  owner,
  score,
  rank,
  scoreData,
  isSelected,
  onSelect,
}) => (
  <div
    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
      isSelected ? 'bg-gray-50 border border-gray-200' : 'hover:bg-gray-50/50'
    }`}
    onClick={() => onSelect?.(owner)}
  >
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
      rank === 1 ? 'bg-amber-50 text-amber-500' :
      rank === 2 ? 'bg-gray-100 text-gray-500' :
      rank === 3 ? 'bg-orange-50 text-orange-400' :
      'bg-gray-50 text-gray-400'
    }`}>
      {rank}
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <User className="w-3.5 h-3.5 text-gray-300" />
        <span className="text-sm text-gray-600 truncate">{owner}</span>
        {getTrendIcon(scoreData.trend)}
      </div>
    </div>

    <div className="text-right">
      <div className={`text-sm font-medium ${getScoreColor(score)}`}>
        {score.toFixed(0)}%
      </div>
    </div>
  </div>
);

interface ScoreDetailProps {
  score: ReliabilityScore;
}

const ScoreDetail: React.FC<ScoreDetailProps> = ({ score }) => (
  <div>
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-sm text-gray-600">{score.owner}</h4>
      <div className="flex items-center gap-1.5">
        <span className={`text-lg font-medium ${getScoreColor(score.overallScore)}`}>
          {score.overallScore.toFixed(0)}%
        </span>
        {getTrendIcon(score.trend)}
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <ComponentCard
        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
        label="Complétion"
        value={score.components.completionRate}
      />
      <ComponentCard
        icon={<Clock className="w-3.5 h-3.5" />}
        label="Ponctualité"
        value={score.components.onTimeRate}
      />
      <ComponentCard
        icon={<TrendingUp className="w-3.5 h-3.5" />}
        label="Réactivité"
        value={score.components.responsiveness}
      />
      <ComponentCard
        icon={<Award className="w-3.5 h-3.5" />}
        label="Consistance"
        value={score.components.consistency}
      />
    </div>

    {score.history.length > 1 && (
      <div className="mt-3">
        <span className="text-[10px] text-gray-400">Historique</span>
        <div className="flex items-end gap-0.5 h-8 mt-1">
          {score.history.slice(-12).map((point, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm ${getScoreBg(point.score)}`}
              style={{ height: `${point.score}%` }}
              title={`${new Date(point.date).toLocaleDateString('fr-FR')}: ${point.score.toFixed(0)}%`}
            />
          ))}
        </div>
      </div>
    )}
  </div>
);

interface ComponentCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

const ComponentCard: React.FC<ComponentCardProps> = ({ icon, label, value }) => (
  <div className="px-2.5 py-2 bg-gray-50/50 rounded-lg border border-gray-100">
    <div className="flex items-center gap-1.5 text-gray-400 mb-0.5">
      {icon}
      <span className="text-[10px]">{label}</span>
    </div>
    <div className={`text-sm font-medium ${getScoreColor(value)}`}>
      {value.toFixed(0)}%
    </div>
  </div>
);

export default ReliabilityRadar;
