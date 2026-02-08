// ============================================================================
// PROPH3T PAGE — MODULE INTELLIGENCE PREDICTIVE
// ============================================================================
// Point d'entrée centralisé pour toutes les fonctionnalités Proph3t
// Utilise les VRAIES DONNÉES de la base de données
// ============================================================================

import React, { useState } from 'react';
import {
  Brain,
  TrendingUp,
  Target,
  Gauge,
  GitBranch,
  BookOpen,
  Scale,
  Calendar,
  Clock,
  AlertTriangle,
  Zap,
  RefreshCw,
  Loader2,
} from 'lucide-react';

// Import des composants Proph3t
import { VelocityDashboard } from '@/components/proph3t/VelocityDashboard';
import { ProjectJournalView } from '@/components/proph3t/ProjectJournalView';
import { ReliabilityRadar } from '@/components/proph3t/ReliabilityRadar';
import { CoherenceScanView } from '@/components/proph3t/CoherenceScanView';
import { AlertPanel } from '@/components/proph3t/AlertPanel';

// Hook pour les vraies données
import { useProph3tDashboard } from '@/hooks/useProph3tDashboard';

// ============================================================================
// HELPERS
// ============================================================================

// Formater un montant en FCFA
function formatMontant(montant: number): string {
  if (montant >= 1_000_000_000) {
    return `${(montant / 1_000_000_000).toFixed(1)} Mrd FCFA`;
  }
  if (montant >= 1_000_000) {
    return `${(montant / 1_000_000).toFixed(0)} M FCFA`;
  }
  if (montant >= 1_000) {
    return `${(montant / 1_000).toFixed(0)} K FCFA`;
  }
  return `${montant.toLocaleString('fr-FR')} FCFA`;
}

// ============================================================================
// TYPES
// ============================================================================

type Proph3tTab =
  | 'overview'
  | 'velocity'
  | 'health'
  | 'alerts'
  | 'journal'
  | 'coherence';

interface TabConfig {
  id: Proph3tTab;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// ============================================================================
// CONFIGURATION DES ONGLETS
// ============================================================================

const TABS: TabConfig[] = [
  {
    id: 'overview',
    label: 'Vue d\'ensemble',
    icon: <Brain className="w-5 h-5" />,
    description: 'Tableau de bord intelligence prédictive',
  },
  {
    id: 'velocity',
    label: 'Vélocité & Budget',
    icon: <TrendingUp className="w-5 h-5" />,
    description: 'Analyse de vélocité et burn rate',
  },
  {
    id: 'health',
    label: 'Santé Projet',
    icon: <Gauge className="w-5 h-5" />,
    description: 'Fatigue équipe et momentum',
  },
  {
    id: 'alerts',
    label: 'Alertes',
    icon: <AlertTriangle className="w-5 h-5" />,
    description: 'Centre d\'alertes intelligent',
  },
  {
    id: 'journal',
    label: 'Journal',
    icon: <BookOpen className="w-5 h-5" />,
    description: 'Historique événements projet',
  },
  {
    id: 'coherence',
    label: 'Cohérence',
    icon: <Scale className="w-5 h-5" />,
    description: 'Scan de cohérence des données',
  },
];

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function Proph3tPage() {
  const [activeTab, setActiveTab] = useState<Proph3tTab>('overview');
  const data = useProph3tDashboard();

  if (data.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des données Proph3t...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display text-gray-900">Proph3t</h1>
              <p className="text-sm text-gray-500">
                Intelligence prédictive • Données temps réel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
              <Zap className="w-4 h-4" />
              <span>Connecté à la DB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1 overflow-x-auto py-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && <OverviewTab data={data} />}
        {activeTab === 'velocity' && <VelocityTab data={data} />}
        {activeTab === 'health' && <HealthTab data={data} />}
        {activeTab === 'alerts' && <AlertsTab data={data} />}
        {activeTab === 'journal' && <JournalTab data={data} />}
        {activeTab === 'coherence' && <CoherenceTab />}
      </div>
    </div>
  );
}

// ============================================================================
// ONGLET VUE D'ENSEMBLE
// ============================================================================

function OverviewTab({ data }: { data: ReturnType<typeof useProph3tDashboard> }) {
  const globalStats = data.globalStats ?? { actionsTerminees: 0, actionsTotal: 0, jalonsAtteints: 0, jalonsTotal: 0, budgetConsomme: 0, budgetTotal: 0 };
  const momentumAnalysis = data.momentumAnalysis ?? { currentState: 'stalling', score: 0 };
  const alertSummary = data.alertSummary;
  const reliabilityComparison = data.reliabilityComparison;

  const stats = [
    {
      label: 'Actions terminées',
      value: `${globalStats.actionsTerminees}/${globalStats.actionsTotal}`,
      subValue: `${Math.round((globalStats.actionsTerminees / Math.max(1, globalStats.actionsTotal)) * 100)}%`,
      icon: <Target className="w-5 h-5" />,
      color: 'purple',
    },
    {
      label: 'Jalons atteints',
      value: `${globalStats.jalonsAtteints}/${globalStats.jalonsTotal}`,
      subValue: `${Math.round((globalStats.jalonsAtteints / Math.max(1, globalStats.jalonsTotal)) * 100)}%`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'blue',
    },
    {
      label: 'Momentum',
      value: momentumAnalysis.currentState === 'cruising' ? 'Croisière' :
             momentumAnalysis.currentState === 'accelerating' ? 'Accélération' :
             momentumAnalysis.currentState === 'slowing' ? 'Ralentissement' : 'Stagnation',
      subValue: `Score: ${momentumAnalysis.score}`,
      icon: <Gauge className="w-5 h-5" />,
      color: momentumAnalysis.score > 50 ? 'green' : 'yellow',
    },
    {
      label: 'Budget consommé',
      value: `${Math.round((globalStats.budgetConsomme / Math.max(1, globalStats.budgetTotal)) * 100)}%`,
      subValue: `${formatMontant(globalStats.budgetConsomme)} / ${formatMontant(globalStats.budgetTotal)}`,
      icon: <Clock className="w-5 h-5" />,
      color: 'yellow',
    },
  ];

  const colorMap: Record<string, string> = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-5 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${colorMap[stat.color]}`}>
                {stat.icon}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
            <div className="text-xs text-gray-400 mt-1">{stat.subValue}</div>
          </div>
        ))}
      </div>

      {/* Alertes rapides */}
      {(globalStats.actionsBloquees > 0 || globalStats.actionsEnRetard > 0 || globalStats.risquesCritiques > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <AlertTriangle className="w-5 h-5" />
            Points d'attention
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {globalStats.actionsBloquees > 0 && (
              <div className="text-red-600">
                {globalStats.actionsBloquees} action(s) bloquée(s)
              </div>
            )}
            {globalStats.actionsEnRetard > 0 && (
              <div className="text-orange-600">
                {globalStats.actionsEnRetard} action(s) en retard
              </div>
            )}
            {globalStats.risquesCritiques > 0 && (
              <div className="text-red-600">
                {globalStats.risquesCritiques} risque(s) critique(s)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reliability Radar */}
        {reliabilityComparison.owners.length > 0 && (
          <ReliabilityRadar comparison={reliabilityComparison} />
        )}

        {/* Alertes actives */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Alertes actives
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{alertSummary.criticalCount}</div>
              <div className="text-sm text-red-600">Critiques</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{alertSummary.byLevel.warning}</div>
              <div className="text-sm text-yellow-600">Attention</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{alertSummary.byLevel.info}</div>
              <div className="text-sm text-blue-600">Information</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{alertSummary.byStatus.resolved}</div>
              <div className="text-sm text-green-600">Résolues</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ONGLETS SPECIFIQUES
// ============================================================================

function VelocityTab({ data }: { data: ReturnType<typeof useProph3tDashboard> }) {
  return (
    <div className="space-y-6">
      <VelocityDashboard
        velocityMetrics={data.velocityMetrics}
        burnRateMetrics={data.burnRateMetrics}
        teamVelocity={data.teamVelocity}
        projections={data.burnProjections}
      />
    </div>
  );
}

function HealthTab({ data }: { data: ReturnType<typeof useProph3tDashboard> }) {
  const { fatigueAssessment, teamFatigue, momentumAnalysis } = data;

  return (
    <div className="space-y-6">
      {/* Fatigue Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Indicateurs de Fatigue (basés sur actions bloquées/retard)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {teamFatigue.map(team => (
            <div
              key={team.team}
              className={`p-4 rounded-lg border ${
                team.fatigueLevel === 'high'
                  ? 'bg-red-50 border-red-200'
                  : team.fatigueLevel === 'moderate'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{team.team}</span>
                <span
                  className={`text-2xl font-bold ${
                    team.fatigueLevel === 'high'
                      ? 'text-red-600'
                      : team.fatigueLevel === 'moderate'
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                >
                  {team.score}%
                </span>
              </div>
              <p className="text-sm text-gray-600">{team.recommendation}</p>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        {fatigueAssessment.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Recommandations</h4>
            {fatigueAssessment.recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-sm text-gray-600 p-2 bg-gray-50 rounded"
              >
                <span className="text-purple-500">-</span>
                {rec}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Momentum */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Gauge className="w-5 h-5 text-blue-500" />
          Momentum Projet (basé sur avancement global)
        </h3>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">
              {momentumAnalysis.score}%
            </div>
            <div className="text-sm text-gray-500">Avancement</div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  momentumAnalysis.currentState === 'accelerating'
                    ? 'bg-green-100 text-green-700'
                    : momentumAnalysis.currentState === 'cruising'
                    ? 'bg-blue-100 text-blue-700'
                    : momentumAnalysis.currentState === 'slowing'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {momentumAnalysis.currentState === 'accelerating'
                  ? 'Accélération'
                  : momentumAnalysis.currentState === 'cruising'
                  ? 'Croisière'
                  : momentumAnalysis.currentState === 'slowing'
                  ? 'Ralentissement'
                  : 'Stagnation'}
              </span>
              <span className="text-sm text-gray-500">
                Vélocité: {momentumAnalysis.velocity} actions/semaine
              </span>
            </div>
            <div className="space-y-1">
              {momentumAnalysis.insights.map((insight, i) => (
                <div
                  key={i}
                  className={`text-sm ${
                    insight.type === 'positive'
                      ? 'text-green-600'
                      : insight.type === 'negative'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {insight.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertsTab({ data }: { data: ReturnType<typeof useProph3tDashboard> }) {
  return (
    <div className="space-y-6">
      <AlertPanel
        alerts={data.alerts}
        summary={data.alertSummary}
        onAcknowledge={(id) => console.log('Acknowledge:', id)}
        onResolve={(id) => console.log('Resolve:', id)}
        onEscalate={(id, reason) => console.log('Escalate:', id, reason)}
      />
    </div>
  );
}

function JournalTab({ data }: { data: ReturnType<typeof useProph3tDashboard> }) {
  return (
    <div className="space-y-6">
      <ProjectJournalView
        entries={data.journalEntries}
        summary={data.journalSummary}
      />
    </div>
  );
}

function CoherenceTab() {
  return (
    <div className="space-y-6">
      <CoherenceScanView />
    </div>
  );
}

export default Proph3tPage;
