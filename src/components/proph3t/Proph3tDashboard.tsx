// ============================================================================
// PROPH3T V2 — DASHBOARD PRINCIPAL
// ============================================================================

import React, { useState } from 'react';
import {
  Brain,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Zap,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Settings,
} from 'lucide-react';
import type { AnalysisResult, QuickDiagnostic } from '../../engines/proph3t/core/proph3tEngine';
import type { PrioritizedAction } from '../../engines/proph3t/prescribers/priorityMatrix';
import type { Prediction } from '../../engines/proph3t/core/types';

// ============================================================================
// TYPES
// ============================================================================

interface Proph3tDashboardProps {
  analysisResult: AnalysisResult | null;
  diagnostic: QuickDiagnostic | null;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  onActionClick?: (action: PrioritizedAction) => void;
  onPredictionClick?: (prediction: Prediction) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const getHealthColor = (health: 'healthy' | 'warning' | 'critical') => {
  switch (health) {
    case 'healthy':
      return { bg: 'bg-green-400', text: 'text-green-500', light: 'bg-green-50' };
    case 'warning':
      return { bg: 'bg-amber-400', text: 'text-amber-500', light: 'bg-amber-50' };
    case 'critical':
      return { bg: 'bg-red-400', text: 'text-red-500', light: 'bg-red-50' };
  }
};

const getPriorityConfig = (priority: string) => {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    P0: { bg: 'bg-red-50', text: 'text-red-500', label: 'Priorité absolue' },
    P1: { bg: 'bg-orange-50', text: 'text-orange-500', label: 'Haute priorité' },
    P2: { bg: 'bg-amber-50', text: 'text-amber-500', label: 'À planifier' },
    P3: { bg: 'bg-gray-50', text: 'text-gray-400', label: 'Faible priorité' },
  };
  return configs[priority] || configs.P3;
};

const getImpactIcon = (impact: string) => {
  switch (impact) {
    case 'critical':
      return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    case 'high':
      return <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />;
    case 'medium':
      return <Activity className="w-3.5 h-3.5 text-amber-400" />;
    default:
      return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
  }
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const Proph3tDashboard: React.FC<Proph3tDashboardProps> = ({
  analysisResult,
  diagnostic,
  isAnalyzing,
  onRunAnalysis,
  onActionClick,
  onPredictionClick,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'actions'>('overview');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Brain className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <h1 className="text-sm font-medium text-gray-700">Proph3t Engine</h1>
              <p className="text-xs text-gray-400">Intelligence Prescriptive</p>
            </div>
          </div>

          <button
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyse...' : 'Analyser'}
          </button>
        </div>

        {/* Quick Stats */}
        {diagnostic && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            <QuickStatCard
              label="Santé projet"
              value={`${diagnostic.score}/100`}
              icon={<Activity className="w-3.5 h-3.5" />}
              trend={diagnostic.overallHealth}
            />
            <QuickStatCard
              label="Budget"
              value={diagnostic.keyMetrics.budgetStatus}
              icon={<BarChart3 className="w-3.5 h-3.5" />}
              trend={diagnostic.keyMetrics.budgetStatus === 'OK' ? 'healthy' : diagnostic.keyMetrics.budgetStatus === 'Attention' ? 'warning' : 'critical'}
            />
            <QuickStatCard
              label="Planning"
              value={diagnostic.keyMetrics.scheduleStatus}
              icon={<Clock className="w-3.5 h-3.5" />}
              trend={diagnostic.keyMetrics.scheduleStatus === 'OK' ? 'healthy' : diagnostic.keyMetrics.scheduleStatus === 'Attention' ? 'warning' : 'critical'}
            />
            <QuickStatCard
              label="Commercial"
              value={diagnostic.keyMetrics.commercialStatus}
              icon={<Target className="w-3.5 h-3.5" />}
              trend={diagnostic.keyMetrics.commercialStatus === 'OK' ? 'healthy' : diagnostic.keyMetrics.commercialStatus === 'Attention' ? 'warning' : 'critical'}
            />
          </div>
        )}
      </div>

      {/* Issues rapides */}
      {diagnostic && diagnostic.topIssues.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-xs font-medium text-gray-500 mb-2.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Points d'attention ({diagnostic.topIssues.length})
          </h3>
          <div className="space-y-1.5">
            {diagnostic.topIssues.map((issue, idx) => (
              <div
                key={idx}
                className={`px-3 py-2 rounded-lg ${
                  issue.severity === 'critical'
                    ? 'bg-red-50/50 border border-red-100'
                    : issue.severity === 'high'
                    ? 'bg-orange-50/50 border border-orange-100'
                    : 'bg-amber-50/50 border border-amber-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  {getImpactIcon(issue.severity)}
                  <span className="text-sm text-gray-600">{issue.title}</span>
                  <span className="text-[10px] text-gray-400 ml-auto">{issue.module}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-50">
          <nav className="flex">
            {(['overview', 'predictions', 'actions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-gray-700 border-b-2 border-gray-400'
                    : 'text-gray-400 hover:text-gray-500 hover:bg-gray-50/50'
                }`}
              >
                {tab === 'overview' && 'Vue d\'ensemble'}
                {tab === 'predictions' && `Prédictions (${analysisResult?.predictions.length || 0})`}
                {tab === 'actions' && `Actions (${analysisResult?.prescription.actions.length || 0})`}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-5">
          {activeTab === 'overview' && analysisResult && (
            <OverviewTab analysisResult={analysisResult} />
          )}
          {activeTab === 'predictions' && analysisResult && (
            <PredictionsTab
              predictions={analysisResult.predictions}
              onPredictionClick={onPredictionClick}
            />
          )}
          {activeTab === 'actions' && analysisResult && (
            <ActionsTab
              actions={analysisResult.prescription.actions}
              summary={analysisResult.prescription.summary}
              onActionClick={onActionClick}
            />
          )}

          {!analysisResult && (
            <div className="text-center py-10">
              <Brain className="w-8 h-8 mx-auto text-gray-200 mb-3" />
              <h3 className="text-sm text-gray-500">Aucune analyse disponible</h3>
              <p className="text-xs text-gray-400 mt-1 mb-3">
                Lancez une analyse pour voir les résultats
              </p>
              <button
                onClick={onRunAnalysis}
                disabled={isAnalyzing}
                className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Lancer l'analyse
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SUB COMPONENTS
// ============================================================================

interface QuickStatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend: 'healthy' | 'warning' | 'critical';
}

const QuickStatCard: React.FC<QuickStatCardProps> = ({ label, value, icon, trend }) => {
  const colors = getHealthColor(trend);

  return (
    <div className="bg-gray-50/50 rounded-lg px-3 py-2.5 border border-gray-100">
      <div className="flex items-center gap-1.5 text-gray-400 text-[10px]">
        {icon}
        {label}
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="text-sm font-medium text-gray-600">{value}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />
      </div>
    </div>
  );
};

interface OverviewTabProps {
  analysisResult: AnalysisResult;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ analysisResult }) => {
  const { evm, prescription, anomalies, cascades, patternMatches } = analysisResult;

  return (
    <div className="space-y-5">
      {/* EVM */}
      <div>
        <h4 className="text-xs font-medium text-gray-400 mb-2.5">Indicateurs EVM</h4>
        <div className="grid grid-cols-4 gap-3">
          <div className="px-3 py-2 bg-gray-50/50 rounded-lg border border-gray-100">
            <div className="text-[10px] text-gray-400">CPI</div>
            <div className={`text-sm font-medium ${evm.cpi < 0.9 ? 'text-red-400' : evm.cpi < 1 ? 'text-amber-500' : 'text-green-500'}`}>
              {evm.cpi.toFixed(2)}
            </div>
          </div>
          <div className="px-3 py-2 bg-gray-50/50 rounded-lg border border-gray-100">
            <div className="text-[10px] text-gray-400">SPI</div>
            <div className={`text-sm font-medium ${evm.spi < 0.9 ? 'text-red-400' : evm.spi < 1 ? 'text-amber-500' : 'text-green-500'}`}>
              {evm.spi.toFixed(2)}
            </div>
          </div>
          <div className="px-3 py-2 bg-gray-50/50 rounded-lg border border-gray-100">
            <div className="text-[10px] text-gray-400">EAC</div>
            <div className="text-sm font-medium text-gray-600">
              {(evm.eac / 1_000_000).toFixed(0)}M
            </div>
          </div>
          <div className="px-3 py-2 bg-gray-50/50 rounded-lg border border-gray-100">
            <div className="text-[10px] text-gray-400">VAC</div>
            <div className={`text-sm font-medium ${evm.vac < 0 ? 'text-red-400' : 'text-green-500'}`}>
              {evm.vac >= 0 ? '+' : ''}{(evm.vac / 1_000_000).toFixed(0)}M
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400">{evm.interpretation}</p>
      </div>

      {/* Résumé prescription */}
      <div>
        <h4 className="text-xs font-medium text-gray-400 mb-2.5">Résumé des Actions</h4>
        <div className="grid grid-cols-4 gap-3">
          {(['P0', 'P1', 'P2', 'P3'] as const).map(priority => {
            const config = getPriorityConfig(priority);
            return (
              <div key={priority} className={`px-3 py-2 rounded-lg border border-gray-100 ${config.bg}`}>
                <div className="text-[10px] text-gray-400">{config.label}</div>
                <div className={`text-sm font-medium ${config.text}`}>
                  {prescription.summary.byPriority[priority]}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {prescription.summary.recommendedFocus}
        </p>
      </div>

      {/* Anomalies et patterns */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-medium text-gray-400 mb-2">
            Anomalies ({anomalies.length})
          </h4>
          {anomalies.length === 0 ? (
            <p className="text-xs text-gray-400">Aucune anomalie détectée</p>
          ) : (
            <div className="space-y-1.5">
              {anomalies.slice(0, 3).map(anomaly => (
                <div
                  key={anomaly.id}
                  className={`px-2.5 py-1.5 rounded-lg text-xs ${
                    anomaly.severity === 'critical' ? 'bg-red-50/50' : 'bg-amber-50/50'
                  }`}
                >
                  <span className="text-gray-600">{anomaly.metric}</span>
                  <span className="text-gray-400 ml-1.5">{anomaly.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-medium text-gray-400 mb-2">
            Patterns ({patternMatches.length})
          </h4>
          {patternMatches.length === 0 ? (
            <p className="text-xs text-gray-400">Aucun pattern reconnu</p>
          ) : (
            <div className="space-y-1.5">
              {patternMatches.slice(0, 3).map(match => (
                <div key={match.pattern.id} className="px-2.5 py-1.5 bg-gray-50 rounded-lg text-xs">
                  <span className="text-gray-600">{match.pattern.name}</span>
                  <span className="text-gray-400 ml-1.5">({match.matchScore}%)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="text-[10px] text-gray-300 text-right">
        Analyse effectuée en {analysisResult.executionTimeMs}ms ·{' '}
        {new Date(analysisResult.timestamp).toLocaleString('fr-FR')}
      </div>
    </div>
  );
};

interface PredictionsTabProps {
  predictions: Prediction[];
  onPredictionClick?: (prediction: Prediction) => void;
}

const PredictionsTab: React.FC<PredictionsTabProps> = ({ predictions, onPredictionClick }) => {
  return (
    <div className="space-y-2">
      {predictions.length === 0 ? (
        <p className="text-center text-xs text-gray-400 py-8">Aucune prédiction active</p>
      ) : (
        predictions.map(prediction => (
          <div
            key={prediction.id}
            onClick={() => onPredictionClick?.(prediction)}
            className="px-3.5 py-3 border border-gray-100 rounded-lg hover:bg-gray-50/50 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2.5">
                {getImpactIcon(prediction.impact)}
                <div>
                  <h5 className="text-sm text-gray-600">{prediction.title}</h5>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                    {prediction.description}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <div className="text-sm font-medium text-gray-500">
                  {prediction.probability}%
                </div>
                <div className="text-[10px] text-gray-300">probabilité</div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-300">
              <span>{prediction.type}</span>
              <span>·</span>
              <span>{prediction.timeHorizon}</span>
              <span>·</span>
              <span>Conf. {prediction.confidence.value}%</span>
              <ArrowRight className="w-3 h-3 ml-auto text-gray-200" />
            </div>
          </div>
        ))
      )}
    </div>
  );
};

interface ActionsTabProps {
  actions: PrioritizedAction[];
  summary: { byPriority: Record<string, number>; recommendedFocus: string };
  onActionClick?: (action: PrioritizedAction) => void;
}

const ActionsTab: React.FC<ActionsTabProps> = ({ actions, summary, onActionClick }) => {
  return (
    <div className="space-y-3">
      {/* Focus recommandé */}
      <div className="px-3 py-2 bg-gray-50/50 rounded-lg border border-gray-100">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500">
            {summary.recommendedFocus}
          </span>
        </div>
      </div>

      {/* Liste des actions */}
      <div className="space-y-2">
        {actions.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-8">Aucune action recommandée</p>
        ) : (
          actions.slice(0, 10).map(action => {
            const priorityConfig = getPriorityConfig(action.priority);
            return (
              <div
                key={action.id}
                onClick={() => onActionClick?.(action)}
                className="px-3.5 py-3 border border-gray-100 rounded-lg hover:bg-gray-50/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${priorityConfig.bg} ${priorityConfig.text}`}
                  >
                    {action.priority}
                  </span>
                  <div className="flex-1">
                    <h5 className="text-sm text-gray-600">{action.action}</h5>
                    <p className="text-xs text-gray-400 mt-0.5">{action.rationale}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-[10px] text-gray-300">
                      <span>{action.targetModule}</span>
                      <span>·</span>
                      <span>Effort: {action.effort}</span>
                      <span>·</span>
                      <span>Conf. {action.confidence?.value || 0}%</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-300">#{action.rank}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Proph3tDashboard;
