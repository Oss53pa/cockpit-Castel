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
import type { ReliabilityScore, ReliabilityComparison } from '../../engines/proph3t/commitments/reliabilityScorer';

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
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
};

const getScoreBg = (score: number): string => {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-yellow-100';
  if (score >= 40) return 'bg-orange-100';
  return 'bg-red-100';
};

const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
  if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Radar de Fiabilité
              </h2>
              <p className="text-sm text-gray-500">
                {comparison.owners.length} acteurs • Score moyen: {comparison.averageScore.toFixed(0)}%
              </p>
            </div>
          </div>

          {comparison.topPerformer && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
              <Award className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">{comparison.topPerformer}</span>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {comparison.needsAttention.length > 0 && (
        <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-yellow-700">
            {comparison.needsAttention.length} acteur(s) nécessitent attention: {comparison.needsAttention.join(', ')}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
        {/* Radar Visual (simplified) */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Vue d'ensemble</h3>
          <RadarChart scores={Object.values(comparison.scores)} />
        </div>

        {/* Ranking List */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Classement</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
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
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
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
  // Simplified visual representation
  const size = 200;
  const center = size / 2;
  const maxRadius = size / 2 - 20;

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
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid circles */}
        {[25, 50, 75, 100].map(pct => (
          <circle
            key={pct}
            cx={center}
            cy={center}
            r={(pct / 100) * maxRadius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
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
              stroke="#e5e7eb"
              strokeWidth="1"
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
          fill="rgba(59, 130, 246, 0.3)"
          stroke="#3b82f6"
          strokeWidth="2"
        />

        {/* Labels */}
        {metrics.map(m => {
          const radians = (m.angle * Math.PI) / 180;
          const x = center + Math.cos(radians) * (maxRadius + 15);
          const y = center - Math.sin(radians) * (maxRadius + 15);
          return (
            <text
              key={m.label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs fill-gray-500"
            >
              {m.label}
            </text>
          );
        })}

        {/* Center score */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold fill-gray-900"
        >
          {Math.round((avgCompletion + avgOnTime + avgResponsiveness + avgConsistency) / 4)}
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
    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
      isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
    }`}
    onClick={() => onSelect?.(owner)}
  >
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
      rank === 1 ? 'bg-yellow-100 text-yellow-700' :
      rank === 2 ? 'bg-gray-200 text-gray-700' :
      rank === 3 ? 'bg-orange-100 text-orange-700' :
      'bg-gray-100 text-gray-500'
    }`}>
      {rank}
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-gray-400" />
        <span className="font-medium text-gray-900 truncate">{owner}</span>
        {getTrendIcon(scoreData.trend)}
      </div>
    </div>

    <div className="text-right">
      <div className={`text-lg font-bold ${getScoreColor(score)}`}>
        {score.toFixed(0)}%
      </div>
      <div className="text-xs text-gray-400">
        Conf: {(scoreData.confidence * 100).toFixed(0)}%
      </div>
    </div>
  </div>
);

interface ScoreDetailProps {
  score: ReliabilityScore;
}

const ScoreDetail: React.FC<ScoreDetailProps> = ({ score }) => (
  <div>
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-medium text-gray-900">{score.owner}</h4>
      <div className="flex items-center gap-2">
        <span className={`text-2xl font-bold ${getScoreColor(score.overallScore)}`}>
          {score.overallScore.toFixed(0)}%
        </span>
        {getTrendIcon(score.trend)}
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <ComponentCard
        icon={<CheckCircle2 className="w-4 h-4" />}
        label="Complétion"
        value={score.components.completionRate}
      />
      <ComponentCard
        icon={<Clock className="w-4 h-4" />}
        label="Ponctualité"
        value={score.components.onTimeRate}
      />
      <ComponentCard
        icon={<TrendingUp className="w-4 h-4" />}
        label="Réactivité"
        value={score.components.responsiveness}
      />
      <ComponentCard
        icon={<Award className="w-4 h-4" />}
        label="Consistance"
        value={score.components.consistency}
      />
    </div>

    {score.history.length > 1 && (
      <div className="mt-4">
        <span className="text-xs text-gray-500">Historique des scores</span>
        <div className="flex items-end gap-1 h-12 mt-2">
          {score.history.slice(-12).map((point, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t ${getScoreBg(point.score)}`}
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
  <div className="p-3 bg-white rounded-lg border border-gray-200">
    <div className="flex items-center gap-2 text-gray-500 mb-1">
      {icon}
      <span className="text-xs">{label}</span>
    </div>
    <div className={`text-xl font-bold ${getScoreColor(value)}`}>
      {value.toFixed(0)}%
    </div>
  </div>
);

export default ReliabilityRadar;
