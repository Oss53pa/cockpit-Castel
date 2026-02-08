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
      return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50' };
    case 'warning':
      return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50' };
    case 'critical':
      return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' };
  }
};

const getPriorityConfig = (priority: string) => {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    P0: { bg: 'bg-red-100', text: 'text-red-700', label: 'Priorité absolue' },
    P1: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Haute priorité' },
    P2: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'À planifier' },
    P3: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Faible priorité' },
  };
  return configs[priority] || configs.P3;
};

const getImpactIcon = (impact: string) => {
  switch (impact) {
    case 'critical':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'high':
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case 'medium':
      return <Activity className="w-4 h-4 text-yellow-500" />;
    default:
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Proph3t Engine V2</h1>
              <p className="text-white/80">Intelligence Prescriptive</p>
            </div>
          </div>

          <button
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyse...' : 'Analyser'}
          </button>
        </div>

        {/* Quick Stats */}
        {diagnostic && (
          <div className="mt-6 grid grid-cols-4 gap-4">
            <QuickStatCard
              label="Santé projet"
              value={`${diagnostic.score}/100`}
              icon={<Activity className="w-5 h-5" />}
              trend={diagnostic.overallHealth}
            />
            <QuickStatCard
              label="Budget"
              value={diagnostic.keyMetrics.budgetStatus}
              icon={<BarChart3 className="w-5 h-5" />}
              trend={diagnostic.keyMetrics.budgetStatus === 'OK' ? 'healthy' : diagnostic.keyMetrics.budgetStatus === 'Attention' ? 'warning' : 'critical'}
            />
            <QuickStatCard
              label="Planning"
              value={diagnostic.keyMetrics.scheduleStatus}
              icon={<Clock className="w-5 h-5" />}
              trend={diagnostic.keyMetrics.scheduleStatus === 'OK' ? 'healthy' : diagnostic.keyMetrics.scheduleStatus === 'Attention' ? 'warning' : 'critical'}
            />
            <QuickStatCard
              label="Commercial"
              value={diagnostic.keyMetrics.commercialStatus}
              icon={<Target className="w-5 h-5" />}
              trend={diagnostic.keyMetrics.commercialStatus === 'OK' ? 'healthy' : diagnostic.keyMetrics.commercialStatus === 'Attention' ? 'warning' : 'critical'}
            />
          </div>
        )}
      </div>

      {/* Issues rapides */}
      {diagnostic && diagnostic.topIssues.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Points d'attention ({diagnostic.topIssues.length})
          </h3>
          <div className="space-y-2">
            {diagnostic.topIssues.map((issue, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg ${
                  issue.severity === 'critical'
                    ? 'bg-red-50 border border-red-200'
                    : issue.severity === 'high'
                    ? 'bg-orange-50 border border-orange-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {getImpactIcon(issue.severity)}
                  <span className="font-medium text-gray-900">{issue.title}</span>
                  <span className="text-xs text-gray-500 ml-auto">{issue.module}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex">
            {(['overview', 'predictions', 'actions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab === 'overview' && 'Vue d\'ensemble'}
                {tab === 'predictions' && `Prédictions (${analysisResult?.predictions.length || 0})`}
                {tab === 'actions' && `Actions (${analysisResult?.prescription.actions.length || 0})`}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
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
            <div className="text-center py-12">
              <Brain className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-gray-900">Aucune analyse disponible</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Lancez une analyse pour voir les résultats
              </p>
              <button
                onClick={onRunAnalysis}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
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
    <div className="bg-white/10 rounded-lg p-3">
      <div className="flex items-center gap-2 text-white/70 text-sm">
        {icon}
        {label}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xl font-bold">{value}</span>
        <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
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
    <div className="space-y-6">
      {/* EVM */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Indicateurs EVM</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">CPI</div>
            <div className={`text-xl font-bold ${evm.cpi < 0.9 ? 'text-red-600' : evm.cpi < 1 ? 'text-yellow-600' : 'text-green-600'}`}>
              {evm.cpi.toFixed(2)}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">SPI</div>
            <div className={`text-xl font-bold ${evm.spi < 0.9 ? 'text-red-600' : evm.spi < 1 ? 'text-yellow-600' : 'text-green-600'}`}>
              {evm.spi.toFixed(2)}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">EAC</div>
            <div className="text-xl font-bold text-gray-900">
              {(evm.eac / 1_000_000).toFixed(0)}M
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">VAC</div>
            <div className={`text-xl font-bold ${evm.vac < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {evm.vac >= 0 ? '+' : ''}{(evm.vac / 1_000_000).toFixed(0)}M
            </div>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600">{evm.interpretation}</p>
      </div>

      {/* Résumé prescription */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Résumé des Actions</h4>
        <div className="grid grid-cols-4 gap-4">
          {(['P0', 'P1', 'P2', 'P3'] as const).map(priority => {
            const config = getPriorityConfig(priority);
            return (
              <div key={priority} className={`p-3 rounded-lg ${config.bg}`}>
                <div className="text-xs text-gray-500">{config.label}</div>
                <div className={`text-2xl font-bold ${config.text}`}>
                  {prescription.summary.byPriority[priority]}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {prescription.summary.recommendedFocus}
        </p>
      </div>

      {/* Anomalies et patterns */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-3">
            Anomalies ({anomalies.length})
          </h4>
          {anomalies.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune anomalie détectée</p>
          ) : (
            <div className="space-y-2">
              {anomalies.slice(0, 3).map(anomaly => (
                <div
                  key={anomaly.id}
                  className={`p-2 rounded-lg text-sm ${
                    anomaly.severity === 'critical' ? 'bg-red-50' : 'bg-yellow-50'
                  }`}
                >
                  <span className="font-medium">{anomaly.metric}</span>
                  <span className="text-gray-600 ml-2">{anomaly.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-3">
            Patterns ({patternMatches.length})
          </h4>
          {patternMatches.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun pattern reconnu</p>
          ) : (
            <div className="space-y-2">
              {patternMatches.slice(0, 3).map(match => (
                <div key={match.pattern.id} className="p-2 bg-purple-50 rounded-lg text-sm">
                  <span className="font-medium">{match.pattern.name}</span>
                  <span className="text-gray-600 ml-2">({match.matchScore}% match)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="text-xs text-gray-400 text-right">
        Analyse effectuée en {analysisResult.executionTimeMs}ms •{' '}
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
    <div className="space-y-3">
      {predictions.length === 0 ? (
        <p className="text-center text-gray-500 py-8">Aucune prédiction active</p>
      ) : (
        predictions.map(prediction => (
          <div
            key={prediction.id}
            onClick={() => onPredictionClick?.(prediction)}
            className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getImpactIcon(prediction.impact)}
                <div>
                  <h5 className="font-medium text-gray-900">{prediction.title}</h5>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {prediction.description}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <div className="text-lg font-bold text-gray-900">
                  {prediction.probability}%
                </div>
                <div className="text-xs text-gray-500">probabilité</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
              <span>Type: {prediction.type}</span>
              <span>Horizon: {prediction.timeHorizon}</span>
              <span>Confiance: {prediction.confidence.value}%</span>
              <ArrowRight className="w-3 h-3 ml-auto" />
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
    <div className="space-y-4">
      {/* Focus recommandé */}
      <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-900">
            {summary.recommendedFocus}
          </span>
        </div>
      </div>

      {/* Liste des actions */}
      <div className="space-y-3">
        {actions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Aucune action recommandée</p>
        ) : (
          actions.slice(0, 10).map(action => {
            const priorityConfig = getPriorityConfig(action.priority);
            return (
              <div
                key={action.id}
                onClick={() => onActionClick?.(action)}
                className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${priorityConfig.bg} ${priorityConfig.text}`}
                  >
                    {action.priority}
                  </span>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{action.action}</h5>
                    <p className="text-sm text-gray-600 mt-1">{action.rationale}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                      <span>Module: {action.targetModule}</span>
                      <span>Effort: {action.effort}</span>
                      <span>Confiance: {action.confidence?.value || 0}%</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">#{action.rank}</span>
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
