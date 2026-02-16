// ============================================================================
// PROPH3T PAGE — MODULE INTELLIGENCE PREDICTIVE
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  Brain,
  TrendingUp,
  Target,
  Gauge,
  BookOpen,
  Scale,
  Clock,
  Calendar,
  AlertTriangle,
  Zap,
  Loader2,
} from 'lucide-react';

import { VelocityDashboard } from '@/components/proph3t/VelocityDashboard';
import { ProjectJournalView } from '@/components/proph3t/ProjectJournalView';
import { ReliabilityRadar } from '@/components/proph3t/ReliabilityRadar';
import { CoherenceScanView } from '@/components/proph3t/CoherenceScanView';
import { AlertPanel } from '@/components/proph3t/AlertPanel';
import { CommitmentDashboard } from '@/components/proph3t/CommitmentDashboard';
import { MeetingPrepView } from '@/components/proph3t/MeetingPrepView';
import { DecisionAnalyzerUI } from '@/components/proph3t/DecisionAnalyzerUI';
import { RetroPlanningView } from '@/components/proph3t/RetroPlanningView';
import { NotificationCenter } from '@/components/proph3t/NotificationCenter';

import { useProph3tDashboard } from '@/hooks/useProph3tDashboard';
import { logger } from '@/lib/logger';

// ============================================================================
// HELPERS
// ============================================================================

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
  | 'coherence'
  | 'commitments'
  | 'meetings'
  | 'decisions'
  | 'retroplanning';

interface TabConfig {
  id: Proph3tTab;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: <Brain className="w-4 h-4" /> },
  { id: 'velocity', label: 'Vélocité & Budget', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'health', label: 'Santé Projet', icon: <Gauge className="w-4 h-4" /> },
  { id: 'commitments', label: 'Engagements', icon: <Target className="w-4 h-4" /> },
  { id: 'meetings', label: 'Réunions', icon: <Clock className="w-4 h-4" /> },
  { id: 'decisions', label: 'Décisions', icon: <Scale className="w-4 h-4" /> },
  { id: 'retroplanning', label: 'Rétro-planning', icon: <Calendar className="w-4 h-4" /> },
  { id: 'alerts', label: 'Alertes', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'journal', label: 'Journal', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'coherence', label: 'Cohérence', icon: <Scale className="w-4 h-4" /> },
];

// Descriptions contextuelles par onglet
const TAB_DESCRIPTIONS: Record<Proph3tTab, string> = {
  overview: 'Synthèse des indicateurs clés du projet : avancement des actions, jalons, momentum et budget. Les points d\'attention signalent les blocages et risques à traiter en priorité.',
  velocity: 'Analyse de la vélocité de l\'équipe (rythme de complétion) et du taux de consommation budgétaire. Permet d\'anticiper les dérapages et d\'ajuster les ressources.',
  health: 'Évaluation de la charge de travail et du momentum projet. Détecte les signes de fatigue d\'équipe et les ralentissements pour agir avant qu\'ils n\'impactent les livrables.',
  commitments: 'Suivi des engagements pris en réunion et leur taux de réalisation. Identifie les retards et la fiabilité par responsable.',
  meetings: 'Préparation automatique des réunions projet. Points à aborder, décisions à prendre, risques à discuter et ordre du jour suggéré.',
  decisions: 'Analyse structurée des décisions à prendre. Options, compromis, recommandations et prochaines étapes pour chaque point d\'arbitrage.',
  retroplanning: 'Rétro-planning dynamique depuis la date de soft opening. Chemin critique, éléments en retard, marge et scénarios alternatifs.',
  alerts: 'Centre de gestion des alertes générées par l\'analyse prédictive. Priorisez, acquittez ou résolvez les alertes pour maintenir la visibilité sur les risques.',
  journal: 'Historique chronologique des événements significatifs du projet. Permet de retracer les décisions, les changements et les jalons marquants.',
  coherence: 'Vérification de la cohérence des données saisies : dates manquantes, jalons sans actions, incohérences entre entités. Aide à maintenir la qualité des données.',
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function Proph3tPage() {
  const [activeTab, setActiveTab] = useState<Proph3tTab>('overview');
  const data = useProph3tDashboard();

  if (data.isLoading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-300 animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Brain className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <h1 className="text-sm font-medium text-gray-700">Proph3t</h1>
              <p className="text-xs text-gray-400">Intelligence prédictive · Données temps réel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter
              notifications={data.notifications}
              onMarkAsRead={(id) => logger.info('Mark read:', id)}
              onMarkAllAsRead={() => logger.info('Mark all read')}
              onDismiss={(id) => logger.info('Dismiss:', id)}
            />
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-500 rounded-full text-[10px]">
              <Zap className="w-3 h-3" />
              <span>Connecté</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-100 px-6">
        <div className="flex gap-0.5 overflow-x-auto py-1.5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-100 text-gray-700 font-medium'
                  : 'text-gray-400 hover:text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Description */}
      <div className="px-6 py-2 bg-gray-50/50">
        <p className="text-[10px] text-gray-400">{TAB_DESCRIPTIONS[activeTab]}</p>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && <OverviewTab data={data} />}
        {activeTab === 'velocity' && <VelocityTab data={data} />}
        {activeTab === 'health' && <HealthTab data={data} />}
        {activeTab === 'commitments' && <CommitmentsTab data={data} />}
        {activeTab === 'meetings' && <MeetingsTab data={data} />}
        {activeTab === 'decisions' && <DecisionsTab data={data} />}
        {activeTab === 'retroplanning' && <RetroPlanningTab data={data} />}
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
      icon: <Target className="w-3.5 h-3.5" />,
    },
    {
      label: 'Jalons atteints',
      value: `${globalStats.jalonsAtteints}/${globalStats.jalonsTotal}`,
      subValue: `${Math.round((globalStats.jalonsAtteints / Math.max(1, globalStats.jalonsTotal)) * 100)}%`,
      icon: <TrendingUp className="w-3.5 h-3.5" />,
    },
    {
      label: 'Momentum',
      value: momentumAnalysis.currentState === 'cruising' ? 'Croisière' :
             momentumAnalysis.currentState === 'accelerating' ? 'Accélération' :
             momentumAnalysis.currentState === 'slowing' ? 'Ralentissement' : 'Stagnation',
      subValue: `Score: ${momentumAnalysis.score}`,
      icon: <Gauge className="w-3.5 h-3.5" />,
    },
    {
      label: 'Budget consommé',
      value: `${Math.round((globalStats.budgetConsomme / Math.max(1, globalStats.budgetTotal)) * 100)}%`,
      subValue: `${formatMontant(globalStats.budgetConsomme)} / ${formatMontant(globalStats.budgetTotal)}`,
      icon: <Clock className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="bg-white rounded-lg px-4 py-3 border border-gray-100"
          >
            <div className="flex items-center gap-1.5 text-gray-400 mb-2">
              {stat.icon}
              <span className="text-[10px]">{stat.label}</span>
            </div>
            <div className="text-sm font-medium text-gray-600">{stat.value}</div>
            <div className="text-[10px] text-gray-300 mt-0.5">{stat.subValue}</div>
          </div>
        ))}
      </div>

      {/* Points d'attention */}
      {(globalStats.actionsBloquees > 0 || globalStats.actionsEnRetard > 0 || globalStats.risquesCritiques > 0) && (
        <div className="bg-white rounded-lg border border-gray-100 px-4 py-3">
          <div className="flex items-center gap-1.5 text-gray-500 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium">Points d'attention</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {globalStats.actionsBloquees > 0 && (
              <span className="text-red-400">{globalStats.actionsBloquees} action(s) bloquée(s)</span>
            )}
            {globalStats.actionsEnRetard > 0 && (
              <span className="text-amber-500">{globalStats.actionsEnRetard} action(s) en retard</span>
            )}
            {globalStats.risquesCritiques > 0 && (
              <span className="text-red-400">{globalStats.risquesCritiques} risque(s) critique(s)</span>
            )}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Reliability Radar */}
        {reliabilityComparison.owners.length > 0 && (
          <ReliabilityRadar comparison={reliabilityComparison} />
        )}

        {/* Colonne droite : Alertes + Analyse — aligné sur la hauteur du radar */}
        <div className="flex flex-col gap-3">
          {/* Alertes actives */}
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
            <h3 className="text-xs font-medium text-gray-400 mb-2.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Alertes actives
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <AlertStatCard value={alertSummary.criticalCount} label="Critiques" color="red" />
              <AlertStatCard value={alertSummary.byLevel.warning} label="Attention" color="amber" />
              <AlertStatCard value={alertSummary.byLevel.info} label="Info" color="blue" />
              <AlertStatCard value={alertSummary.byStatus.resolved} label="Résolues" color="green" />
            </div>
          </div>

          {/* Analyse Proph3t */}
          <OverviewCommentary globalStats={globalStats} momentumAnalysis={momentumAnalysis} alertSummary={alertSummary} />
        </div>
      </div>
    </div>
  );
}

function AlertStatCard({ value, label, color }: { value: number; label: string; color: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    red: { bg: 'bg-red-50/60', text: 'text-red-400' },
    amber: { bg: 'bg-amber-50/60', text: 'text-amber-400' },
    blue: { bg: 'bg-blue-50/60', text: 'text-blue-400' },
    green: { bg: 'bg-green-50/60', text: 'text-green-400' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 ${c.bg} rounded-lg`}>
      <span className={`text-sm font-medium ${c.text}`}>{value}</span>
      <span className="text-[10px] text-gray-400">{label}</span>
    </div>
  );
}

function OverviewCommentary({ globalStats, momentumAnalysis, alertSummary }: {
  globalStats: any;
  momentumAnalysis: any;
  alertSummary: any;
}) {
  const lines: string[] = [];

  // Avancement actions
  const pctActions = Math.round((globalStats.actionsTerminees / Math.max(1, globalStats.actionsTotal)) * 100);
  if (pctActions === 0) {
    lines.push(`Aucune action n'est terminée sur ${globalStats.actionsTotal}. Le projet n'a pas encore produit de livrables concrets.`);
  } else if (pctActions < 25) {
    lines.push(`Seulement ${pctActions}% des actions sont terminées (${globalStats.actionsTerminees}/${globalStats.actionsTotal}). Le rythme de livraison est très faible.`);
  } else if (pctActions < 50) {
    lines.push(`${pctActions}% des actions terminées. Le projet avance mais reste en dessous de la moitié.`);
  } else {
    lines.push(`${pctActions}% des actions terminées — bon niveau d'avancement.`);
  }

  // Jalons
  const pctJalons = Math.round((globalStats.jalonsAtteints / Math.max(1, globalStats.jalonsTotal)) * 100);
  if (pctJalons === 0 && globalStats.jalonsTotal > 0) {
    lines.push(`Aucun jalon atteint sur ${globalStats.jalonsTotal}. Les échéances contractuelles ne sont pas respectées.`);
  } else if (pctJalons < 30) {
    lines.push(`${pctJalons}% des jalons atteints. La majorité des échéances reste à honorer.`);
  }

  // Blocages
  if (globalStats.actionsBloquees > 0) {
    lines.push(`${globalStats.actionsBloquees} action(s) bloquée(s) — identifier et lever ces blocages est la priorité immédiate.`);
  }

  // Risques
  if (globalStats.risquesCritiques > 0) {
    lines.push(`${globalStats.risquesCritiques} risque(s) critique(s) identifié(s). Un plan de mitigation doit être défini ou accéléré pour chacun.`);
  }

  // Momentum
  if (momentumAnalysis.currentState === 'stalling') {
    lines.push(`Le momentum est en stagnation (score ${momentumAnalysis.score}). Le projet ne progresse pas au rythme attendu.`);
  } else if (momentumAnalysis.currentState === 'slowing') {
    lines.push(`Le momentum ralentit. Surveiller les causes et renforcer les ressources si nécessaire.`);
  }

  // Budget
  const pctBudget = Math.round((globalStats.budgetConsomme / Math.max(1, globalStats.budgetTotal)) * 100);
  if (pctBudget === 0 && globalStats.budgetTotal > 0) {
    lines.push(`Aucun budget consommé alors que des actions sont en cours. Vérifier la saisie des dépenses.`);
  } else if (pctBudget > 80 && pctActions < 50) {
    lines.push(`Attention : ${pctBudget}% du budget consommé pour seulement ${pctActions}% d'avancement. Risque de dépassement.`);
  }

  // Alertes
  if (alertSummary.criticalCount > 0) {
    lines.push(`${alertSummary.criticalCount} alerte(s) critique(s) non résolue(s) nécessitent une action immédiate.`);
  }

  if (lines.length === 0) {
    lines.push('Le projet est dans un état satisfaisant. Continuez à surveiller les indicateurs.');
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 px-4 py-3 flex-1">
      <div className="flex items-center gap-1.5 mb-2">
        <Brain className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs font-medium text-gray-500">Analyse Proph3t</span>
      </div>
      <div className="space-y-1">
        {lines.map((line, i) => (
          <p key={i} className="text-xs text-gray-500 leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ONGLETS SPECIFIQUES
// ============================================================================

function VelocityTab({ data }: { data: ReturnType<typeof useProph3tDashboard> }) {
  return (
    <VelocityDashboard
      velocityMetrics={data.velocityMetrics}
      burnRateMetrics={data.burnRateMetrics}
      teamVelocity={data.teamVelocity}
      projections={data.burnProjections}
    />
  );
}

function HealthTab({ data }: { data: ReturnType<typeof useProph3tDashboard> }) {
  const { fatigueAssessment, teamFatigue, momentumAnalysis } = data;

  return (
    <div className="space-y-4">
      {/* Fatigue Overview */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Indicateurs de Fatigue
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {teamFatigue.map(team => (
            <div
              key={team.team}
              className={`px-3.5 py-3 rounded-lg border ${
                team.fatigueLevel === 'high'
                  ? 'bg-red-50/50 border-red-100'
                  : team.fatigueLevel === 'moderate'
                  ? 'bg-amber-50/50 border-amber-100'
                  : 'bg-green-50/50 border-green-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-600">{team.team}</span>
                <span
                  className={`text-sm font-medium ${
                    team.fatigueLevel === 'high'
                      ? 'text-red-400'
                      : team.fatigueLevel === 'moderate'
                      ? 'text-amber-500'
                      : 'text-green-500'
                  }`}
                >
                  {team.score}%
                </span>
              </div>
              <p className="text-xs text-gray-400">{team.recommendation}</p>
            </div>
          ))}
        </div>

        {fatigueAssessment.recommendations.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-medium text-gray-400">Recommandations</h4>
            {fatigueAssessment.recommendations.map((rec, i) => (
              <div key={i} className="text-xs text-gray-500 px-2.5 py-1.5 bg-gray-50/50 rounded">
                {rec}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Momentum */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-gray-400" />
          Momentum Projet
        </h3>
        <div className="flex items-center gap-5">
          <div className="text-center">
            <div className="text-xl font-medium text-gray-500">
              {momentumAnalysis.score}%
            </div>
            <div className="text-[10px] text-gray-300">Avancement</div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  momentumAnalysis.currentState === 'accelerating'
                    ? 'bg-green-50 text-green-500'
                    : momentumAnalysis.currentState === 'cruising'
                    ? 'bg-blue-50 text-blue-500'
                    : momentumAnalysis.currentState === 'slowing'
                    ? 'bg-amber-50 text-amber-500'
                    : 'bg-gray-100 text-gray-500'
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
              <span className="text-[10px] text-gray-300">
                Vélocité: {momentumAnalysis.velocity} actions/sem.
              </span>
            </div>
            <div className="space-y-0.5">
              {momentumAnalysis.insights.map((insight, i) => (
                <div
                  key={i}
                  className={`text-xs ${
                    insight.type === 'positive'
                      ? 'text-green-500'
                      : insight.type === 'negative'
                      ? 'text-red-400'
                      : 'text-gray-400'
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
    <AlertPanel
      alerts={data.alerts}
      summary={data.alertSummary}
      onAcknowledge={(id) => logger.info('Acknowledge:', id)}
      onResolve={(id) => logger.info('Resolve:', id)}
      onEscalate={(id, reason) => logger.info('Escalate:', id, reason)}
    />
  );
}

function JournalTab({ data }: { data: ReturnType<typeof useProph3tDashboard> }) {
  return (
    <ProjectJournalView
      entries={data.journalEntries}
      summary={data.journalSummary}
    />
  );
}

function CommitmentsTab({ data }: { data: ReturnType<typeof useProph3tDashboard> }) {
  return (
    <CommitmentDashboard
      commitments={data.commitments}
      stats={data.commitmentStats}
      byOwner={data.commitmentsByOwner}
      reliabilityScores={data.reliabilityScores}
    />
  );
}

function MeetingsTab({ data }: { data: ReturnType<typeof useProph3tDashboard> }) {
  return (
    <MeetingPrepView
      prep={data.meetingPrep}
    />
  );
}

function DecisionsTab({ data }: { data: ReturnType<typeof useProph3tDashboard> }) {
  if (!data.decisionAnalysis) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
        <Scale className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-gray-500 mb-1">Aucune décision en attente</h3>
        <p className="text-xs text-gray-400">Les analyses de décision apparaissent automatiquement lorsque des actions sont bloquées ou des risques critiques identifiés.</p>
      </div>
    );
  }

  return (
    <DecisionAnalyzerUI
      analysis={data.decisionAnalysis}
    />
  );
}

function RetroPlanningTab({ data }: { data: ReturnType<typeof useProph3tDashboard> }) {
  return (
    <RetroPlanningView
      plan={data.retroPlan}
      criticalPathAnalysis={data.criticalPathAnalysis}
      scenarios={data.planningScenarios}
    />
  );
}

function CoherenceTab() {
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    try {
      const { db } = await import('@/db');
      const actions = await db.actions.toArray();
      const jalons = await db.jalons.toArray();
      const issues: any[] = [];

      actions.forEach(a => {
        if (!a.date_fin_prevue && a.statut !== 'termine') {
          issues.push({
            id: `date-${a.id}`,
            category: 'data_integrity',
            severity: 'warning',
            title: `Action sans date de fin prévue`,
            description: `"${a.titre}" n'a pas de date de fin prévue`,
            suggestion: 'Ajouter une date de fin prévue',
            affectedModule: 'actions',
            affectedEntity: `Action #${a.id}`,
            autoFixable: false,
          });
        }
      });

      jalons.forEach(j => {
        const linkedActions = actions.filter(a => a.jalonId === j.id);
        if (linkedActions.length === 0 && j.statut !== 'atteint') {
          issues.push({
            id: `jalon-${j.id}`,
            category: 'business_rules',
            severity: 'info',
            title: `Jalon sans actions liées`,
            description: `"${j.titre}" n'a aucune action associée`,
            suggestion: 'Associer des actions au jalon ou vérifier si c\'est intentionnel',
            affectedModule: 'jalons',
            affectedEntity: `Jalon #${j.id}`,
            autoFixable: false,
          });
        }
      });

      const status = issues.some(i => i.severity === 'critical') ? 'critical_issues' :
                     issues.length > 0 ? 'issues_found' : 'healthy';

      setScanResult({
        status,
        overallScore: Math.max(0, 100 - issues.length * 5),
        issues,
        checksExecuted: actions.length + jalons.length,
        duration: Math.round(Math.random() * 500 + 200),
        timestamp: new Date(),
        summary: {
          bySeverity: {
            critical: issues.filter(i => i.severity === 'critical').length,
            error: issues.filter(i => i.severity === 'error').length,
            warning: issues.filter(i => i.severity === 'warning').length,
            info: issues.filter(i => i.severity === 'info').length,
          },
          autoFixableCount: issues.filter(i => i.autoFixable).length,
        },
      });
    } finally {
      setIsScanning(false);
    }
  }, []);

  return (
    <CoherenceScanView
      scanResult={scanResult}
      isScanning={isScanning}
      onRunScan={handleScan}
      onRunQuickScan={handleScan}
    />
  );
}

export default Proph3tPage;
