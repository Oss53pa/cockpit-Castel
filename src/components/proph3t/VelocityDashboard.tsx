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
import type { VelocityMetrics, TeamVelocity, BurnRateMetrics, BurnProjection } from '../../hooks/useProph3tDashboard';

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
    return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
  }
  if (direction === 'declining' || direction === 'decelerating') {
    return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  }
  return <Minus className="w-3.5 h-3.5 text-gray-300" />;
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
    <div className="space-y-4">
      {/* Header + Métriques */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-gray-400" />
            <div>
              <h2 className="text-sm font-medium text-gray-700">
                Vélocité & Budget
              </h2>
              <p className="text-xs text-gray-400">
                Performance et consommation budget
              </p>
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
          <MetricCard
            icon={<Zap className="w-3.5 h-3.5" />}
            label="Vélocité"
            value={velocityMetrics.currentVelocity.toFixed(1)}
            unit="actions/sem"
            trend={getTrendIcon(velocityMetrics.trend?.direction)}
            subtext={`Moyenne: ${velocityMetrics.averageVelocity.toFixed(1)}`}
          />
          <MetricCard
            icon={<Wallet className="w-3.5 h-3.5" />}
            label="Burn Rate"
            value={formatMontant(burnRateMetrics.currentBurnRate)}
            unit="FCFA/mois"
            subtext={`Consommé: ${percentUsed}%`}
          />
          <MetricCard
            icon={<Target className="w-3.5 h-3.5" />}
            label="Budget restant"
            value={formatMontant(burnRateMetrics.remaining)}
            unit="FCFA"
            subtext={`Total: ${formatMontant(burnRateMetrics.totalBudget)} FCFA`}
          />
          <MetricCard
            icon={<Calendar className="w-3.5 h-3.5" />}
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
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-xs font-medium text-gray-400 mb-3">Consommation Budget</h3>

        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500">Progression</span>
            <span className="font-medium text-gray-600">{percentUsed}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                percentUsed > 90 ? 'bg-red-400' :
                percentUsed > 75 ? 'bg-amber-400' : 'bg-green-400'
              }`}
              style={{ width: `${Math.min(100, percentUsed)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="px-2.5 py-2 bg-blue-50/50 rounded-lg">
            <div className="text-sm font-medium text-blue-500">
              {formatMontant(burnRateMetrics.totalSpent)}
            </div>
            <div className="text-[10px] text-blue-400">Consommé</div>
          </div>
          <div className="px-2.5 py-2 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-500">
              {formatMontant(burnRateMetrics.remaining)}
            </div>
            <div className="text-[10px] text-gray-400">Restant</div>
          </div>
          <div className="px-2.5 py-2 bg-purple-50/50 rounded-lg">
            <div className="text-sm font-medium text-purple-500">
              {formatMontant(burnRateMetrics.totalBudget)}
            </div>
            <div className="text-[10px] text-purple-400">Budget Total</div>
          </div>
        </div>
      </div>

      {/* Projections */}
      {projections.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-xs font-medium text-gray-400 mb-3">Scénarios de Projection</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {projections.map((proj, idx) => (
              <ProjectionCard key={idx} projection={proj} />
            ))}
          </div>
        </div>
      )}

      {/* Team Velocities */}
      {teamVelocity.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Vélocité par Axe
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
  <div className="px-3 py-2.5 rounded-lg bg-gray-50/50">
    <div className="flex items-center gap-1.5 text-gray-400 mb-1.5">
      {icon}
      <span className="text-[10px]">{label}</span>
      {trend}
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-sm font-medium text-gray-600">{value}</span>
      <span className="text-[10px] text-gray-400">{unit}</span>
    </div>
    {subtext && <p className="text-[10px] text-gray-300 mt-0.5">{subtext}</p>}
  </div>
);

interface ProjectionCardProps {
  projection: BurnProjection;
}

const ProjectionCard: React.FC<ProjectionCardProps> = ({ projection }) => {
  const scenarioLabels: Record<string, { label: string; color: string }> = {
    optimistic: { label: 'Optimiste', color: 'bg-green-50/50 border-green-100 text-green-600' },
    realistic: { label: 'Réaliste', color: 'bg-blue-50/50 border-blue-100 text-blue-600' },
    pessimistic: { label: 'Pessimiste', color: 'bg-red-50/50 border-red-100 text-red-500' },
  };

  const config = scenarioLabels[projection.scenario] || scenarioLabels.realistic;

  return (
    <div className={`px-3 py-2.5 rounded-lg border ${config.color}`}>
      <div className="text-xs font-medium mb-2">{config.label}</div>
      <div className="text-[11px] space-y-1">
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
          <div className={`flex justify-between ${projection.remainingBudget < 0 ? 'text-red-500' : 'text-green-500'}`}>
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
  <div className="px-2.5 py-2 bg-gray-50/50 rounded-lg">
    <div className="text-[10px] text-gray-400 truncate mb-1">{team.teamName}</div>
    <div className="text-sm font-medium text-gray-600">
      {team.currentVelocity.toFixed(1)}
    </div>
    <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
      {getTrendIcon(team.trend?.direction)}
      <span>{team.members} actions</span>
    </div>
  </div>
);

export default VelocityDashboard;
