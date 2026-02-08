// ============================================================================
// PROPH3T V2 — VELOCITY DASHBOARD
// ============================================================================

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Wallet,
  Calendar,
  Target,
  Zap,
  Users,
} from 'lucide-react';
import type { VelocityMetrics, TeamVelocity } from '../../engines/proph3t/velocity/velocityAnalyzer';
import type { BurnRateMetrics, BurnProjection } from '../../engines/proph3t/velocity/burnRateCalculator';

// ============================================================================
// TYPES
// ============================================================================

interface VelocityDashboardProps {
  velocityMetrics: VelocityMetrics;
  burnRateMetrics: BurnRateMetrics;
  teamVelocity?: TeamVelocity[];
  projections?: BurnProjection[];
}

// ============================================================================
// HELPERS
// ============================================================================

// Formater un montant en FCFA
function formatMontant(montant: number): string {
  if (montant >= 1_000_000_000) {
    return `${(montant / 1_000_000_000).toFixed(1)} Mrd`;
  }
  if (montant >= 1_000_000) {
    return `${(montant / 1_000_000).toFixed(0)} M`;
  }
  if (montant >= 1_000) {
    return `${(montant / 1_000).toFixed(0)} K`;
  }
  return montant.toLocaleString('fr-FR');
}

const getTrendIcon = (direction?: string) => {
  if (direction === 'improving' || direction === 'accelerating') {
    return <TrendingUp className="w-4 h-4 text-green-500" />;
  }
  if (direction === 'declining' || direction === 'decelerating') {
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  }
  return <Minus className="w-4 h-4 text-gray-400" />;
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const VelocityDashboard: React.FC<VelocityDashboardProps> = ({
  velocityMetrics,
  burnRateMetrics,
  teamVelocity = [],
  projections = [],
}) => {
  const percentUsed = burnRateMetrics.percentUsed ?? 0;
  const runwayMonths = burnRateMetrics.runwayMonths ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Vélocité & Budget
              </h2>
              <p className="text-sm text-gray-500">
                Analyse de la performance et consommation budget
              </p>
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
          <MetricCard
            icon={<Zap className="w-5 h-5" />}
            label="Vélocité"
            value={velocityMetrics.currentVelocity.toFixed(1)}
            unit="actions/sem"
            trend={getTrendIcon(velocityMetrics.trend?.direction)}
            subtext={`Moyenne: ${velocityMetrics.averageVelocity.toFixed(1)}`}
          />
          <MetricCard
            icon={<Wallet className="w-5 h-5" />}
            label="Burn Rate"
            value={formatMontant(burnRateMetrics.currentBurnRate)}
            unit="FCFA/mois"
            subtext={`Consommé: ${percentUsed}%`}
          />
          <MetricCard
            icon={<Target className="w-5 h-5" />}
            label="Budget restant"
            value={formatMontant(burnRateMetrics.remaining)}
            unit="FCFA"
            subtext={`Total: ${formatMontant(burnRateMetrics.totalBudget)} FCFA`}
          />
          <MetricCard
            icon={<Calendar className="w-5 h-5" />}
            label="Runway"
            value={runwayMonths > 0 ? runwayMonths.toFixed(1) : 'N/A'}
            unit="mois"
            subtext={burnRateMetrics.exhaustionDate
              ? `Épuisement: ${new Date(burnRateMetrics.exhaustionDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`
              : ''
            }
          />
        </div>
      </div>

      {/* Budget Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Consommation Budget</h3>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progression</span>
            <span className="font-medium">{percentUsed}%</span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                percentUsed > 90 ? 'bg-red-500' :
                percentUsed > 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, percentUsed)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-700">
              {formatMontant(burnRateMetrics.totalSpent)}
            </div>
            <div className="text-xs text-blue-600">Consommé</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-700">
              {formatMontant(burnRateMetrics.remaining)}
            </div>
            <div className="text-xs text-gray-600">Restant</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-700">
              {formatMontant(burnRateMetrics.totalBudget)}
            </div>
            <div className="text-xs text-purple-600">Budget Total</div>
          </div>
        </div>
      </div>

      {/* Projections */}
      {projections.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Scénarios de Projection</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projections.map((proj, idx) => (
              <ProjectionCard key={idx} projection={proj} />
            ))}
          </div>
        </div>
      )}

      {/* Team Velocities */}
      {teamVelocity.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Vélocité par Axe
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {teamVelocity.map(team => (
              <TeamVelocityCard key={team.teamName} team={team} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  trend?: React.ReactNode;
  subtext?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  unit,
  trend,
  subtext,
}) => (
  <div className="p-4 rounded-lg bg-gray-50">
    <div className="flex items-center gap-2 text-gray-500 mb-2">
      {icon}
      <span className="text-xs font-medium">{label}</span>
      {trend}
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      <span className="text-sm text-gray-500">{unit}</span>
    </div>
    {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
  </div>
);

interface ProjectionCardProps {
  projection: BurnProjection;
}

const ProjectionCard: React.FC<ProjectionCardProps> = ({ projection }) => {
  const scenarioLabels: Record<string, { label: string; color: string }> = {
    optimistic: { label: 'Optimiste', color: 'bg-green-50 border-green-200 text-green-700' },
    realistic: { label: 'Réaliste', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    pessimistic: { label: 'Pessimiste', color: 'bg-red-50 border-red-200 text-red-700' },
  };

  const config = scenarioLabels[projection.scenario] || scenarioLabels.realistic;

  return (
    <div className={`p-4 rounded-lg border ${config.color}`}>
      <div className="font-medium mb-2">{config.label}</div>
      <div className="text-sm space-y-1">
        <div className="flex justify-between">
          <span>Dépense finale</span>
          <span className="font-medium">{formatMontant(projection.finalSpend)}</span>
        </div>
        <div className="flex justify-between">
          <span>Burn/mois</span>
          <span className="font-medium">{formatMontant(projection.monthlyRate)}</span>
        </div>
        <div className="flex justify-between">
          <span>Épuisement</span>
          <span className="font-medium">
            {new Date(projection.exhaustionDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
          </span>
        </div>
        {projection.remainingBudget !== 0 && (
          <div className={`flex justify-between ${projection.remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
            <span>Solde</span>
            <span className="font-medium">
              {projection.remainingBudget > 0 ? '+' : ''}{formatMontant(projection.remainingBudget)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

interface TeamVelocityCardProps {
  team: TeamVelocity;
}

const TeamVelocityCard: React.FC<TeamVelocityCardProps> = ({ team }) => (
  <div className="p-3 bg-gray-50 rounded-lg">
    <div className="text-xs font-medium text-gray-600 truncate mb-1">{team.teamName}</div>
    <div className="text-xl font-bold text-gray-900">
      {team.currentVelocity.toFixed(1)}
    </div>
    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
      {getTrendIcon(team.trend?.direction)}
      <span>{team.members} actions</span>
    </div>
  </div>
);

export default VelocityDashboard;
