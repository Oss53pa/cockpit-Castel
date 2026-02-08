// ============================================================================
// PROPH3T ENGINE V2 — TYPES ET INTERFACES CENTRALISÉS
// ============================================================================
// Moteur d'intelligence prescriptive pour le pilotage de projets immobiliers
// ============================================================================

// ============================================================================
// SCORE DE CONFIANCE — Obligatoire sur toute prédiction/recommandation
// ============================================================================

export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high';

export interface ConfidenceScore {
  /** Score de confiance (0-100) */
  value: number;
  /** Niveau de confiance textuel */
  level: ConfidenceLevel;
  /** Facteurs qui influencent le score */
  factors: string[];
  /** Qualité des données sources (0-100) */
  dataQuality: number;
}

// ============================================================================
// PRÉDICTIONS
// ============================================================================

export type PredictionType = 'risk' | 'cost' | 'schedule' | 'revenue' | 'operational';
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';
export type TrendDirection = 'improving' | 'stable' | 'deteriorating';
export type TimeHorizon = '7d' | '30d' | '60d' | '90d' | '180d';

export interface Prediction {
  id: string;
  type: PredictionType;
  title: string;
  description: string;
  /** Probabilité de réalisation (0-100) */
  probability: number;
  impact: ImpactLevel;
  confidence: ConfidenceScore;
  timeHorizon: TimeHorizon;
  /** Conditions qui déclenchent le risque */
  triggerConditions: string[];
  /** Actions de mitigation suggérées */
  mitigationActions: PrescriptiveAction[];
  trend: TrendDirection;
  /** Référence à un projet passé similaire */
  historicalBasis?: string;
  /** Date de création de la prédiction */
  createdAt: Date;
  /** Module source */
  sourceModule: ProjectModule;
}

// ============================================================================
// ACTIONS PRESCRIPTIVES
// ============================================================================

export type ActionPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type EffortLevel = 'low' | 'medium' | 'high';

export interface PrescriptiveAction {
  id: string;
  /** Action à effectuer */
  action: string;
  /** Pourquoi cette action est recommandée */
  rationale: string;
  /** Résultat attendu si exécutée */
  expectedOutcome: string;
  /** Coût de l'inaction (en langage naturel) */
  costOfInaction: string;
  /** Priorité Eisenhower */
  priority: ActionPriority;
  /** Effort requis */
  effort: EffortLevel;
  /** Responsable suggéré */
  owner?: string;
  /** Date limite suggérée */
  deadline?: string;
  /** Score de confiance */
  confidence: ConfidenceScore;
  /** Impact simulé si l'action est exécutée */
  simulatedImpact?: SimulationResult;
  /** Module concerné */
  targetModule: ProjectModule;
  /** Tags pour filtrage */
  tags: string[];
}

// ============================================================================
// SCÉNARIOS WHAT-IF
// ============================================================================

export type ProjectModule =
  | 'budget'
  | 'planning'
  | 'commercialisation'
  | 'technique'
  | 'rh'
  | 'marketing'
  | 'exploitation'
  | 'construction';

export interface ScenarioVariable {
  module: ProjectModule;
  parameter: string;
  parameterLabel: string;
  baselineValue: number;
  scenarioValue: number;
  unit: string;
  /** Plage de valeurs autorisées */
  range?: { min: number; max: number };
}

export interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  variables: ScenarioVariable[];
  results: SimulationResult;
  comparedToBaseline: DeltaResult;
  /** Scénario pré-construit ou personnalisé */
  isPrebuilt: boolean;
  /** Catégorie du scénario */
  category: 'delay' | 'cost' | 'revenue' | 'operational' | 'custom';
}

export interface DeltaResult {
  costDelta: number;
  costDeltaPercent: number;
  scheduleDelta: number;
  scheduleDeltaPercent: number;
  revenueDelta: number;
  revenueDeltaPercent: number;
  riskScoreDelta: number;
}

export type CascadeSeverity = 'minor' | 'moderate' | 'major';

export interface CascadeEffect {
  id: string;
  sourceModule: ProjectModule;
  targetModule: ProjectModule;
  description: string;
  severity: CascadeSeverity;
  /** Délai avant impact (en jours) */
  lagDays: number;
  /** Impact quantifié si possible */
  quantifiedImpact?: {
    metric: string;
    value: number;
    unit: string;
  };
}

export interface SimulationResult {
  /** Impact sur le coût total (FCFA) */
  costImpact: number;
  /** Impact sur le planning (jours) */
  scheduleImpact: number;
  /** Impact sur les revenus (FCFA) */
  revenueImpact: number;
  /** Nouveau score de risque (0-100) */
  riskScore: number;
  /** Effets cascade vers d'autres modules */
  cascadeEffects: CascadeEffect[];
  /** Explication en langage naturel */
  narrative: string;
  /** Score de confiance de la simulation */
  confidence: ConfidenceScore;
}

// ============================================================================
// ANOMALIES
// ============================================================================

export type AnomalySeverity = 'info' | 'warning' | 'critical';

export interface Anomaly {
  id: string;
  module: ProjectModule;
  metric: string;
  metricLabel: string;
  currentValue: number;
  expectedRange: { min: number; max: number };
  /** Pourcentage d'écart par rapport à la normale */
  deviation: number;
  severity: AnomalySeverity;
  confidence: ConfidenceScore;
  /** Causes possibles identifiées */
  possibleCauses: string[];
  /** Actions suggérées pour résoudre */
  suggestedActions: PrescriptiveAction[];
  detectedAt: Date;
  /** Première détection ou persistante */
  isNew: boolean;
  /** Depuis combien de jours l'anomalie persiste */
  persistenceDays?: number;
}

// ============================================================================
// RAPPORT EXCO
// ============================================================================

export interface EVMResult {
  /** Planned Value - Valeur planifiée */
  pv: number;
  /** Earned Value - Valeur acquise */
  ev: number;
  /** Actual Cost - Coût réel */
  ac: number;
  /** Budget at Completion - Budget total prévu */
  bac: number;
  /** Schedule Performance Index */
  spi: number;
  /** Cost Performance Index */
  cpi: number;
  /** Estimate at Completion */
  eac: number;
  /** Variance at Completion */
  vac: number;
  /** Interprétation textuelle */
  interpretation: string;
  /** Alertes EVM */
  alerts: string[];
}

export interface ScheduleAnalysis {
  /** Jours restants avant ouverture */
  daysRemaining: number;
  /** Retard accumulé (jours) */
  delayAccumulated: number;
  /** Actions sur chemin critique */
  criticalPathActions: number;
  /** Actions critiques en retard */
  criticalActionsLate: number;
  /** Prévision de date de fin */
  projectedEndDate: string;
  /** Tendance du planning */
  trend: TrendDirection;
  /** Alertes planning */
  alerts: string[];
}

export interface CommercialAnalysis {
  /** Taux d'occupation actuel */
  occupancyRate: number;
  /** Taux cible */
  targetRate: number;
  /** Nombre de baux signés */
  signedLeases: number;
  /** Nombre de lots total */
  totalUnits: number;
  /** Locataire ancre signé */
  anchorSigned: boolean;
  /** Revenus prévisionnels annuels */
  projectedAnnualRevenue: number;
  /** Tendance commerciale */
  trend: TrendDirection;
  /** Alertes commerciales */
  alerts: string[];
}

export interface BenchmarkResult {
  /** Métrique comparée */
  metric: string;
  /** Valeur du projet */
  projectValue: number;
  /** Valeur benchmark */
  benchmarkValue: number;
  /** Percentile du projet */
  percentile: number;
  /** Interprétation */
  interpretation: string;
}

export interface ExcoReport {
  generatedAt: Date;
  projectId: string;
  projectName: string;
  /** Résumé exécutif (3-5 phrases max) */
  executiveSummary: string;
  /** Score de santé global (0-100) */
  healthScore: number;
  /** Tendance de santé */
  healthTrend: TrendDirection;
  /** Top 5 risques avec confiance */
  topRisks: Prediction[];
  /** Top 5 actions prioritaires */
  topActions: PrescriptiveAction[];
  /** Anomalies significatives */
  anomalies: Anomaly[];
  /** Status budget EVM */
  budgetStatus: EVMResult;
  /** Status planning */
  scheduleStatus: ScheduleAnalysis;
  /** Status commercial */
  commercialStatus: CommercialAnalysis;
  /** Scénario what-if mis en avant */
  whatIfHighlight?: WhatIfScenario;
  /** Comparaison benchmark */
  benchmarkComparison?: BenchmarkResult[];
  /** Disclaimer sur la fiabilité */
  confidenceDisclaimer: string;
  /** Version du rapport */
  version: string;
}

// ============================================================================
// MÉMOIRE PROJET
// ============================================================================

export interface ProjectSnapshot {
  id: string;
  date: Date;
  metrics: ProjectMetrics;
  predictions: Prediction[];
  anomalies: Anomaly[];
  healthScore: number;
}

export interface Pattern {
  id: string;
  description: string;
  /** Nombre d'occurrences observées */
  occurrences: number;
  lastSeen: Date;
  /** Valeur prédictive (0-1) */
  predictiveValue: number;
  /** Outcome associé quand ce pattern apparaît */
  associatedOutcome: string;
  /** Modules concernés */
  modules: ProjectModule[];
}

export interface PredictionAccuracyLog {
  predictionId: string;
  predictionDate: Date;
  predictionType: PredictionType;
  predictedValue: number;
  actualValue?: number;
  verificationDate?: Date;
  accuracyScore?: number;
  notes?: string;
}

export interface BenchmarkData {
  id: string;
  projectType: 'shopping_center' | 'office' | 'residential' | 'mixed';
  region: 'west_africa' | 'central_africa' | 'east_africa' | 'north_africa';
  metric: string;
  metricLabel: string;
  value: number;
  unit: string;
  percentile25: number;
  percentile50: number;
  percentile75: number;
  sampleSize: number;
  lastUpdated: Date;
}

export interface ProjectMemoryData {
  projectId: string;
  historicalSnapshots: ProjectSnapshot[];
  learnedPatterns: Pattern[];
  predictionAccuracy: PredictionAccuracyLog[];
  benchmarks: BenchmarkData[];
  lastUpdated: Date;
}

// ============================================================================
// ÉTAT PROJET (INPUT DU MOTEUR)
// ============================================================================

export interface ProjectMetrics {
  // Budget
  budgetTotal: number;
  budgetEngage: number;
  budgetRealise: number;
  tauxEngagement: number;
  tauxRealisation: number;

  // Planning
  joursRestants: number;
  avancementGlobal: number;
  actionsTotal: number;
  actionsTerminees: number;
  actionsEnRetard: number;
  actionsEnCours: number;
  actionsCritiques: number;

  // Commercial
  tauxOccupation: number;
  surfaceLouee: number;
  surfaceTotale: number;
  nombreBaux: number;
  nombreLots: number;
  revenuPrevisionnel: number;

  // Technique
  avancementConstruction: number;
  avancementMobilisation: number;
  ecartSync: number;

  // RH
  effectifActuel: number;
  effectifCible: number;
  tauxRecrutement: number;

  // Risques
  risquesActifs: number;
  risquesCritiques: number;
  scoreRisqueMoyen: number;
}

export interface ProjectState {
  projectId: string;
  projectName: string;
  projectType: 'shopping_center' | 'office' | 'residential' | 'mixed';
  region: 'west_africa' | 'central_africa' | 'east_africa' | 'north_africa';

  /** Métriques actuelles */
  currentMetrics: ProjectMetrics;

  /** Historique des métriques (30, 60, 90 jours) */
  historicalMetrics: ProjectMetrics[];

  /** Dates clés */
  dates: {
    softOpening: string;
    grandOpening: string;
    today: string;
  };

  /** Locataire ancre */
  anchorTenant?: {
    name: string;
    signed: boolean;
    surface: number;
  };
}

// ============================================================================
// ÉVÉNEMENTS ET CHANGEMENTS
// ============================================================================

export interface ProjectEvent {
  id: string;
  type: 'anomaly' | 'threshold_breach' | 'milestone' | 'external';
  module: ProjectModule;
  description: string;
  severity: AnomalySeverity;
  occurredAt: Date;
  data?: Record<string, unknown>;
}

export interface ModuleChange {
  module: ProjectModule;
  parameter: string;
  oldValue: number;
  newValue: number;
  changePercent: number;
  changedAt: Date;
}

export interface ModuleCorrelation {
  source: ProjectModule;
  target: ProjectModule;
  /** Délai avant impact */
  lag: string;
  /** Force de la corrélation (0-1) */
  strength: number;
  /** Description de la relation */
  description?: string;
}

export interface DiscoveredCorrelation extends ModuleCorrelation {
  /** Nombre d'observations */
  observations: number;
  /** Intervalle de confiance */
  confidenceInterval: { lower: number; upper: number };
}

// ============================================================================
// RÉSULTATS D'ANALYSE COMPLÈTE
// ============================================================================

export interface FullAnalysis {
  anomalies: Anomaly[];
  predictions: Prediction[];
  cascades: CascadeEffect[];
  simulations: SimulationResult[];
  actions: PrescriptiveAction[];
  narrative: string;
  healthScore: number;
  healthTrend: TrendDirection;
  confidence: ConfidenceScore;
  analyzedAt: Date;
}

// ============================================================================
// MONTE CARLO
// ============================================================================

export interface VarianceRange {
  variable: string;
  module: ProjectModule;
  min: number;
  max: number;
  distribution: 'uniform' | 'normal' | 'triangular';
}

export interface MonteCarloResult {
  iterations: number;
  costImpact: {
    mean: number;
    median: number;
    p10: number;
    p90: number;
    stdDev: number;
  };
  scheduleImpact: {
    mean: number;
    median: number;
    p10: number;
    p90: number;
    stdDev: number;
  };
  revenueImpact: {
    mean: number;
    median: number;
    p10: number;
    p90: number;
    stdDev: number;
  };
  probabilityOfSuccess: number;
  executionTimeMs: number;
}

// ============================================================================
// PLAN D'ACTION
// ============================================================================

export interface ActionPlan {
  timeframe: TimeHorizon;
  generatedAt: Date;
  actions: PrescriptiveAction[];
  totalEffort: {
    low: number;
    medium: number;
    high: number;
  };
  expectedOutcomes: string[];
  riskReduction: number;
  narrative: string;
}

// ============================================================================
// SCÉNARIO COMPARAISON
// ============================================================================

export interface ScenarioComparison {
  scenarios: WhatIfScenario[];
  bestCase: string;
  worstCase: string;
  recommendation: string;
  comparisonMatrix: {
    scenarioId: string;
    scenarioName: string;
    costRank: number;
    scheduleRank: number;
    revenueRank: number;
    overallRank: number;
  }[];
}
