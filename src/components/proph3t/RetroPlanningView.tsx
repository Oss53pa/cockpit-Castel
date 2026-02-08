// ============================================================================
// PROPH3T V2 — RETRO PLANNING VIEW
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Play,
  Pause,
  RefreshCw,
  Target,
  Layers,
  GitBranch,
} from 'lucide-react';
import type {
  RetroPlan,
  RetroplanItem,
  PlanAdjustment,
  CriticalPathAnalysis,
  PlanningScenario,
} from '../../engines/proph3t/planning/dynamicRetroPlanner';

// ============================================================================
// TYPES
// ============================================================================

interface RetroPlanningViewProps {
  plan: RetroPlan;
  criticalPathAnalysis?: CriticalPathAnalysis;
  scenarios?: PlanningScenario[];
  onRefresh?: () => void;
  onAdjustItem?: (itemId: string, newDate: Date) => void;
  onApplyScenario?: (scenario: PlanningScenario) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const getStatusConfig = (status: RetroplanItem['status']) => {
  const configs = {
    on_track: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-600', bg: 'bg-green-100', label: 'En temps' },
    at_risk: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'À risque' },
    delayed: { icon: <Clock className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-100', label: 'En retard' },
    completed: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-gray-400', bg: 'bg-gray-100', label: 'Terminé' },
  };
  return configs[status];
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
};

const getDaysUntil = (date: Date): number => {
  const now = new Date();
  return Math.ceil((new Date(date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const getHealthColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const RetroPlanningView: React.FC<RetroPlanningViewProps> = ({
  plan,
  criticalPathAnalysis,
  scenarios,
  onRefresh,
  onAdjustItem,
  onApplyScenario,
}) => {
  const [selectedView, setSelectedView] = useState<'timeline' | 'list' | 'critical'>('timeline');
  const [filterStatus, setFilterStatus] = useState<RetroplanItem['status'] | 'all'>('all');

  const filteredItems = useMemo(() => {
    let items = [...plan.items];
    if (filterStatus !== 'all') {
      items = items.filter(i => i.status === filterStatus);
    }
    return items.sort((a, b) => new Date(a.currentDate).getTime() - new Date(b.currentDate).getTime());
  }, [plan.items, filterStatus]);

  const criticalItems = plan.items.filter(i => i.isCriticalPath);
  const delayedCount = plan.items.filter(i => i.status === 'delayed').length;
  const atRiskCount = plan.items.filter(i => i.status === 'at_risk').length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {plan.name}
              </h2>
              <p className="text-sm text-gray-500">
                Cible: {formatDate(plan.targetDate)} • v{plan.version}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`text-2xl font-bold ${getHealthColor(plan.healthScore)}`}>
              {plan.healthScore}%
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Actualiser"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-100">
        <StatCard
          icon={<Layers className="w-5 h-5" />}
          label="Éléments"
          value={plan.items.length}
          subtext={`${criticalItems.length} critiques`}
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="En retard"
          value={delayedCount}
          color={delayedCount > 0 ? 'red' : 'green'}
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="À risque"
          value={atRiskCount}
          color={atRiskCount > 0 ? 'yellow' : 'green'}
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Marge totale"
          value={`${plan.totalFloat}j`}
        />
      </div>

      {/* View Selector */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex gap-2">
          <ViewButton
            label="Timeline"
            icon={<Calendar className="w-4 h-4" />}
            isActive={selectedView === 'timeline'}
            onClick={() => setSelectedView('timeline')}
          />
          <ViewButton
            label="Liste"
            icon={<Layers className="w-4 h-4" />}
            isActive={selectedView === 'list'}
            onClick={() => setSelectedView('list')}
          />
          <ViewButton
            label="Chemin critique"
            icon={<GitBranch className="w-4 h-4" />}
            isActive={selectedView === 'critical'}
            onClick={() => setSelectedView('critical')}
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as RetroplanItem['status'] | 'all')}
          className="text-sm border-gray-200 rounded-lg"
        >
          <option value="all">Tous les statuts</option>
          <option value="on_track">En temps</option>
          <option value="at_risk">À risque</option>
          <option value="delayed">En retard</option>
          <option value="completed">Terminé</option>
        </select>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {selectedView === 'timeline' && (
          <TimelineView items={filteredItems} targetDate={plan.targetDate} />
        )}
        {selectedView === 'list' && (
          <ListView
            items={filteredItems}
            onAdjust={onAdjustItem}
          />
        )}
        {selectedView === 'critical' && criticalPathAnalysis && (
          <CriticalPathView analysis={criticalPathAnalysis} />
        )}
      </div>

      {/* Scenarios */}
      {scenarios && scenarios.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Scénarios alternatifs</h4>
          <div className="grid grid-cols-3 gap-3">
            {scenarios.map((scenario, i) => (
              <ScenarioCard
                key={i}
                scenario={scenario}
                onApply={onApplyScenario}
              />
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

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtext?: string;
  color?: 'green' | 'yellow' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subtext, color }) => {
  const textColor = color === 'red' ? 'text-red-600' : color === 'yellow' ? 'text-yellow-600' : 'text-gray-900';

  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 text-gray-500 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className={`text-xl font-bold ${textColor}`}>{value}</div>
      {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
    </div>
  );
};

interface ViewButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const ViewButton: React.FC<ViewButtonProps> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-blue-100 text-blue-700'
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {icon}
    {label}
  </button>
);

interface TimelineViewProps {
  items: RetroplanItem[];
  targetDate: Date;
}

const TimelineView: React.FC<TimelineViewProps> = ({ items, targetDate }) => {
  const now = new Date();
  const totalDays = Math.ceil((new Date(targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="p-6">
      {/* Timeline bar */}
      <div className="relative h-2 bg-gray-200 rounded-full mb-6">
        <div className="absolute left-0 top-0 h-full bg-blue-500 rounded-full" style={{ width: '30%' }} />
        <div className="absolute left-[30%] top-0 h-full w-1 bg-blue-700 rounded" />
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.slice(0, 15).map(item => {
          const config = getStatusConfig(item.status);
          const daysUntil = getDaysUntil(item.currentDate);
          const position = Math.max(0, Math.min(100, ((totalDays - daysUntil) / totalDays) * 100));

          return (
            <div key={item.id} className="flex items-center gap-4">
              <div className="w-20 text-right text-xs text-gray-500">
                {formatDate(item.currentDate)}
              </div>
              <div className="flex-1 relative h-8">
                <div
                  className={`absolute h-6 rounded px-2 py-1 flex items-center gap-1 text-xs ${config.bg} ${config.color}`}
                  style={{ left: `${position}%`, maxWidth: '200px' }}
                >
                  {item.isCriticalPath && <GitBranch className="w-3 h-3" />}
                  <span className="truncate">{item.name}</span>
                </div>
              </div>
              {item.variance !== 0 && (
                <span className={`text-xs ${item.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {item.variance > 0 ? '+' : ''}{item.variance}j
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ListViewProps {
  items: RetroplanItem[];
  onAdjust?: (itemId: string, newDate: Date) => void;
}

const ListView: React.FC<ListViewProps> = ({ items, onAdjust }) => (
  <div className="divide-y divide-gray-100">
    {items.map(item => {
      const config = getStatusConfig(item.status);
      const daysUntil = getDaysUntil(item.currentDate);

      return (
        <div key={item.id} className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            <span className={config.color}>{config.icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${item.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                {item.name}
              </span>
              {item.isCriticalPath && (
                <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                  Critique
                </span>
              )}
              <span className={`px-2 py-0.5 text-xs rounded ${item.type === 'jalon' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {item.type === 'jalon' ? 'Jalon' : 'Action'}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span>{formatDate(item.currentDate)}</span>
              {daysUntil > 0 && item.status !== 'completed' && (
                <span>J-{daysUntil}</span>
              )}
              {item.floatDays > 0 && (
                <span className="text-green-600">Marge: {item.floatDays}j</span>
              )}
            </div>
          </div>

          {item.variance !== 0 && (
            <div className={`text-sm font-medium ${item.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {item.variance > 0 ? '+' : ''}{item.variance}j
            </div>
          )}
        </div>
      );
    })}
  </div>
);

interface CriticalPathViewProps {
  analysis: CriticalPathAnalysis;
}

const CriticalPathView: React.FC<CriticalPathViewProps> = ({ analysis }) => (
  <div className="p-6">
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">Durée totale du chemin critique</span>
        <span className="text-lg font-bold text-gray-900">{analysis.totalDuration} jours</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-purple-500 rounded-full" style={{ width: '60%' }} />
      </div>
    </div>

    {/* Bottlenecks */}
    {analysis.bottlenecks.length > 0 && (
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Goulots d'étranglement</h4>
        <div className="space-y-2">
          {analysis.bottlenecks.map((b, i) => (
            <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{b.item.name}</span>
                <span className="text-xs text-red-600">{b.reason}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Impact: {b.impact} points</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Path */}
    <h4 className="text-sm font-medium text-gray-700 mb-2">Chemin critique</h4>
    <div className="space-y-1">
      {analysis.path.map((item, i) => (
        <div key={item.id} className="flex items-center gap-2">
          <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
            {i + 1}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <span className="text-sm text-gray-700">{item.name}</span>
          <span className="text-xs text-gray-400">{formatDate(item.currentDate)}</span>
        </div>
      ))}
    </div>

    {/* Recommendations */}
    {analysis.recommendations.length > 0 && (
      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Recommandations</h4>
        <ul className="space-y-1">
          {analysis.recommendations.map((rec, i) => (
            <li key={i} className="text-sm text-blue-700">• {rec}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

interface ScenarioCardProps {
  scenario: PlanningScenario;
  onApply?: (scenario: PlanningScenario) => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onApply }) => {
  const feasibilityColors = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-3 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900 text-sm">{scenario.name}</span>
        <span className={`px-2 py-0.5 text-xs rounded ${feasibilityColors[scenario.feasibility]}`}>
          {scenario.feasibility === 'high' ? 'Faisable' : scenario.feasibility === 'medium' ? 'Moyen' : 'Difficile'}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-2">{scenario.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Fin: {formatDate(scenario.resultingEndDate)}
        </span>
        {onApply && (
          <button
            onClick={() => onApply(scenario)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Appliquer
          </button>
        )}
      </div>
    </div>
  );
};

export default RetroPlanningView;
