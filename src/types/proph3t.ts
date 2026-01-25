/**
 * PROPH3T - Types et Interfaces
 * Moteur IA de gestion de projet pour COSMOS ANGRE
 */

// ============================================================================
// MODULE 1: ANALYSE ET SUIVI
// ============================================================================

export type HealthStatus = 'vert' | 'jaune' | 'rouge';

export interface ProjectHealthAnalysis {
  id?: number;
  projectId: number;
  timestamp: string;

  // Score global de santé (0-100)
  healthScore: number;
  healthStatus: HealthStatus;

  // Composantes du score
  scoreDetails: {
    planning: number;      // Score planning (0-100)
    budget: number;        // Score budget (0-100)
    risques: number;       // Score risques (0-100)
    ressources: number;    // Score ressources (0-100)
    qualite: number;       // Score qualité (0-100)
  };

  // Indicateurs EVM
  evm: {
    pv: number;   // Planned Value
    ev: number;   // Earned Value
    ac: number;   // Actual Cost
    sv: number;   // Schedule Variance
    cv: number;   // Cost Variance
    spi: number;  // Schedule Performance Index
    cpi: number;  // Cost Performance Index
    eac: number;  // Estimate at Completion
    etc: number;  // Estimate to Complete
    vac: number;  // Variance at Completion
    tcpi: number; // To-Complete Performance Index
  };

  // Tendances
  trends: {
    healthTrend: 'up' | 'down' | 'stable';
    planningTrend: 'up' | 'down' | 'stable';
    budgetTrend: 'up' | 'down' | 'stable';
  };
}

// ============================================================================
// MODULE 2: PREDICTION ET ANTICIPATION
// ============================================================================

export type PredictionType = 'date' | 'budget' | 'risque' | 'ressource';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface Prediction {
  id?: number;
  projectId: number;
  createdAt: string;

  type: PredictionType;
  entityType: 'action' | 'jalon' | 'projet';
  entityId?: number;

  // Prediction
  predictedValue: number | string;
  confidence: number; // 0-1
  confidenceLevel: ConfidenceLevel;

  // Données de base
  baseData: {
    historicalData: number[];
    factors: string[];
    assumptions: string[];
  };

  // Scénarios
  scenarios: {
    optimistic: number | string;
    realistic: number | string;
    pessimistic: number | string;
  };

  // Validation
  validatedAt?: string;
  actualValue?: number | string;
  accuracy?: number; // % d'écart
}

export interface DatePrediction extends Prediction {
  type: 'date';
  predictedDate: string;
  probabilityOnTime: number; // 0-1
  riskFactors: string[];
}

export interface BudgetPrediction extends Prediction {
  type: 'budget';
  predictedAmount: number;
  variance: number;
  variancePercent: number;
}

// ============================================================================
// MODULE 3: PLANIFICATION ET DEPENDANCES
// ============================================================================

export interface DependencyLink {
  id?: number;
  sourceId: number;
  sourceType: 'action' | 'jalon';
  targetId: number;
  targetType: 'action' | 'jalon';

  linkType: 'FS' | 'FF' | 'SS' | 'SF'; // Finish-Start, etc.
  lag: number; // Décalage en jours

  isActive: boolean;
  createdAt: string;
}

export interface CriticalPathAnalysis {
  id?: number;
  projectId: number;
  analyzedAt: string;

  // Chemin critique
  criticalPath: {
    actionIds: number[];
    jalonIds: number[];
    totalDuration: number;
    startDate: string;
    endDate: string;
  };

  // Actions critiques (marge = 0)
  criticalActions: Array<{
    actionId: number;
    titre: string;
    totalFloat: number;
    freeFloat: number;
    isOnCriticalPath: boolean;
  }>;

  // Goulots d'étranglement
  bottlenecks: Array<{
    actionId: number;
    titre: string;
    dependentCount: number;
    impactLevel: 'high' | 'medium' | 'low';
  }>;

  // Marges
  projectBuffer: number; // Jours de marge projet
  feedingBuffers: Array<{
    chainId: string;
    bufferDays: number;
    consumption: number; // %
  }>;
}

// ============================================================================
// MODULE 4: ACTIONS ET RECOMMANDATIONS
// ============================================================================

export type RecommendationPriority = 1 | 2 | 3 | 4 | 5;
export type RecommendationImpact = 'critique' | 'eleve' | 'moyen' | 'faible';
export type RecommendationEffort = 'eleve' | 'moyen' | 'faible';
export type RecommendationStatus = 'pending' | 'accepted' | 'rejected' | 'implemented';

export interface Recommendation {
  id?: number;
  projectId: number;
  createdAt: string;

  // Classification
  priority: RecommendationPriority;
  category: string;
  module: string; // Module source de la recommandation

  // Contenu
  title: string;
  description: string;
  reasoning: string; // Explication du raisonnement IA

  // Impact et effort
  impact: RecommendationImpact;
  effort: RecommendationEffort;
  roi?: number; // Retour sur investissement estimé

  // Actions suggérées
  suggestedActions: string[];

  // Entités liées
  linkedEntities: Array<{
    type: 'action' | 'jalon' | 'risque' | 'budget';
    id: number;
    titre: string;
  }>;

  // Statut
  status: RecommendationStatus;
  respondedAt?: string;
  respondedBy?: number;
  responseNotes?: string;

  // Validation
  implementedAt?: string;
  implementationSuccess?: boolean;
  feedbackScore?: number; // 1-5
}

// ============================================================================
// MODULE 5: ALERTES ET NOTIFICATIONS
// ============================================================================

export type AlertType =
  | 'deadline'      // Échéance proche
  | 'overdue'       // Retard
  | 'risk'          // Risque activé
  | 'budget'        // Dépassement budget
  | 'blocker'       // Action bloquée
  | 'milestone'     // Jalon en danger
  | 'resource'      // Surcharge ressource
  | 'trend'         // Tendance négative
  | 'prediction'    // Prédiction défavorable
  | 'anomaly';      // Anomalie détectée

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SmartAlert {
  id?: number;
  projectId: number;
  createdAt: string;

  // Type et sévérité
  type: AlertType;
  severity: AlertSeverity;

  // Contenu
  title: string;
  message: string;
  details?: string;

  // Entité concernée
  entityType: 'action' | 'jalon' | 'risque' | 'budget' | 'projet' | 'user';
  entityId?: number;

  // Contexte IA
  aiAnalysis?: string;
  suggestedActions?: string[];

  // Statut
  isRead: boolean;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: number;

  isTreated: boolean;
  treatedAt?: string;
  treatedBy?: number;
  treatmentNotes?: string;

  // Récurrence
  isRecurring: boolean;
  recurringPattern?: string;
  lastOccurrence?: string;
  occurrenceCount: number;

  // Notification
  notificationSent: boolean;
  notificationChannels?: ('email' | 'app' | 'sms')[];
}

// ============================================================================
// MODULE 6: RAPPELS AUTOMATIQUES
// ============================================================================

export type ReminderFrequency =
  | 'once'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'custom';

export type ReminderTrigger =
  | 'date'          // Date fixe
  | 'deadline'      // X jours avant échéance
  | 'progress'      // Seuil d'avancement
  | 'inactivity'    // Pas de mise à jour depuis X jours
  | 'event';        // Événement spécifique

export interface SmartReminder {
  id?: number;
  projectId: number;
  createdAt: string;

  // Configuration
  title: string;
  message: string;

  // Déclencheur
  trigger: ReminderTrigger;
  triggerConfig: {
    date?: string;
    daysBeforeDeadline?: number;
    progressThreshold?: number;
    inactivityDays?: number;
    eventType?: string;
  };

  // Fréquence
  frequency: ReminderFrequency;
  customCron?: string;

  // Destinataires
  recipientIds: number[];
  recipientRoles?: string[];

  // Entité liée
  entityType?: 'action' | 'jalon' | 'risque';
  entityId?: number;

  // Statut
  isActive: boolean;
  nextTriggerDate?: string;
  lastTriggeredAt?: string;
  triggerCount: number;

  // Canaux
  channels: ('email' | 'app' | 'sms')[];

  // Escalade
  escalationEnabled: boolean;
  escalationConfig?: {
    afterDays: number;
    escalateTo: number[];
    escalationMessage?: string;
  };
}

// ============================================================================
// MODULE 7: GESTION DES RISQUES (EXTENSION)
// ============================================================================

export interface RiskAnalysis {
  id?: number;
  risqueId: number;
  analyzedAt: string;

  // Analyse IA
  aiAssessment: {
    calculatedScore: number;
    confidenceLevel: ConfidenceLevel;
    trendDirection: 'increasing' | 'stable' | 'decreasing';
    trendStrength: number; // 0-1
  };

  // Facteurs de risque
  riskFactors: Array<{
    factor: string;
    weight: number;
    contribution: number;
  }>;

  // Impact potentiel
  impactAnalysis: {
    financialImpact: number;
    scheduleImpact: number; // jours
    qualityImpact: 'high' | 'medium' | 'low';
    reputationImpact: 'high' | 'medium' | 'low';
  };

  // Mitigation suggérée
  suggestedMitigation: Array<{
    action: string;
    effectiveness: number; // 0-1
    cost: number;
    effort: RecommendationEffort;
  }>;

  // Corrélations
  correlatedRisks: Array<{
    risqueId: number;
    correlation: number; // -1 to 1
    cascadeEffect: boolean;
  }>;
}

// ============================================================================
// MODULE 8: INTEGRATION BUDGET (EXTENSION)
// ============================================================================

export interface BudgetAnalysis {
  id?: number;
  projectId: number;
  analyzedAt: string;

  // Situation actuelle
  currentState: {
    budgetPrevu: number;
    budgetEngage: number;
    budgetRealise: number;
    budgetDisponible: number;
  };

  // Analyse par catégorie
  categoryBreakdown: Array<{
    categorie: string;
    prevu: number;
    realise: number;
    ecart: number;
    ecartPercent: number;
    status: 'under' | 'on_track' | 'over';
  }>;

  // Prévisions
  forecast: {
    estimatedFinal: number;
    confidence: number;
    bestCase: number;
    worstCase: number;
  };

  // Alertes budget
  budgetAlerts: Array<{
    type: 'overrun' | 'underrun' | 'trend' | 'commitment';
    categorie?: string;
    message: string;
    severity: AlertSeverity;
  }>;

  // Recommandations
  recommendations: string[];
}

// ============================================================================
// MODULE 9: RAPPORTS AUTOMATIQUES
// ============================================================================

export type ReportType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'milestone'
  | 'executive'
  | 'risk'
  | 'budget'
  | 'custom';

export type ReportFormat = 'pdf' | 'docx' | 'html' | 'json';

export interface AutoReport {
  id?: number;
  projectId: number;

  // Configuration
  name: string;
  type: ReportType;
  format: ReportFormat;
  template?: string;

  // Contenu
  sections: Array<{
    id: string;
    title: string;
    type: 'summary' | 'chart' | 'table' | 'kpis' | 'text' | 'actions' | 'risks';
    config: Record<string, unknown>;
    order: number;
  }>;

  // Planification
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
  };

  // Distribution
  recipients: Array<{
    userId?: number;
    email?: string;
    role?: string;
  }>;

  // Historique
  lastGeneratedAt?: string;
  generationCount: number;

  // Statut
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedReport {
  id?: number;
  autoReportId: number;
  projectId: number;

  generatedAt: string;
  generatedBy: 'system' | number;

  // Contenu
  title: string;
  content: string;
  format: ReportFormat;

  // Fichier
  fileUrl?: string;
  fileSize?: number;

  // Distribution
  sentTo: string[];
  sentAt?: string;

  // Métadonnées
  dataSnapshot: {
    healthScore: number;
    actionsCount: number;
    jalonsCount: number;
    risquesCount: number;
    budgetUsage: number;
  };
}

// ============================================================================
// MODULE 10: APPRENTISSAGE ET AMELIORATION
// ============================================================================

export interface LearningData {
  id?: number;
  projectId: number;
  createdAt: string;

  // Type d'apprentissage
  type: 'prediction_accuracy' | 'recommendation_feedback' | 'user_behavior' | 'pattern';

  // Données
  inputData: Record<string, unknown>;
  outcome: Record<string, unknown>;

  // Métriques
  accuracy?: number;
  feedbackScore?: number;

  // Insights
  insights: string[];

  // Utilisation
  appliedToModel: boolean;
  appliedAt?: string;
}

export interface Pattern {
  id?: number;
  projectId?: number; // null = pattern global

  // Identification
  patternType: string;
  name: string;
  description: string;

  // Conditions
  conditions: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'regex';
    value: unknown;
  }>;

  // Conséquences observées
  consequences: Array<{
    field: string;
    expectedChange: string;
    probability: number;
    averageImpact: number;
  }>;

  // Statistiques
  occurrenceCount: number;
  accuracy: number;
  lastObserved: string;

  // Statut
  isActive: boolean;
  isValidated: boolean;
  validatedBy?: number;
}

// ============================================================================
// MODULE 11: ASSISTANT CONVERSATIONNEL
// ============================================================================

export type ConversationRole = 'user' | 'assistant' | 'system';

export interface ConversationMessage {
  id?: number;
  conversationId: number;

  role: ConversationRole;
  content: string;

  // Métadonnées
  timestamp: string;
  intent?: string;
  entities?: Record<string, unknown>;

  // Actions déclenchées
  triggeredActions?: Array<{
    type: string;
    params: Record<string, unknown>;
    result?: unknown;
  }>;

  // Feedback
  feedbackScore?: number;
  feedbackComment?: string;
}

export interface Conversation {
  id?: number;
  projectId: number;
  userId: number;

  // Métadonnées
  title?: string;
  startedAt: string;
  lastMessageAt: string;

  // Contexte
  context: {
    lastIntent?: string;
    entities?: Record<string, unknown>;
    referencedEntities?: Array<{
      type: string;
      id: number;
    }>;
  };

  // Statistiques
  messageCount: number;

  // Statut
  isActive: boolean;
}

// ============================================================================
// MODULE 12: IMPORT INTELLIGENT DE DOCUMENTS
// ============================================================================

export type DocumentType =
  | 'facture'
  | 'devis'
  | 'compte_rendu'
  | 'bail_commercial'
  | 'pv_reception'
  | 'cv'
  | 'contrat_travail'
  | 'rapport_audit'
  | 'planning'
  | 'courrier_officiel'
  | 'photo_reserve'
  | 'doe'
  | 'autre';

export interface DocumentImport {
  id?: number;
  projectId: number;

  // Fichier source
  filename: string;
  mimeType: string;
  fileSize: number;
  fileHash?: string;

  // Analyse
  detectedType: DocumentType;
  detectionConfidence: number;

  // Extraction
  extractedData: Record<string, unknown>;
  extractionStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'review_needed';

  // Validation
  validatedData?: Record<string, unknown>;
  validatedBy?: number;
  validatedAt?: string;

  // Intégration
  integrations: Array<{
    targetModule: string;
    targetTable: string;
    recordId?: number;
    status: 'pending' | 'completed' | 'failed';
    error?: string;
  }>;

  // Métadonnées
  createdAt: string;
  createdBy: number;
  processedAt?: string;
}

// ============================================================================
// MODULE 13: CONFIGURATION PROPH3T
// ============================================================================

export interface Proph3tConfig {
  id?: number;
  projectId: number;

  // Paramètres généraux
  isEnabled: boolean;
  aiProvider: 'local' | 'openrouter' | 'anthropic';

  // Modules activés
  enabledModules: {
    analysis: boolean;
    prediction: boolean;
    planning: boolean;
    recommendations: boolean;
    alerts: boolean;
    reminders: boolean;
    riskAnalysis: boolean;
    budgetAnalysis: boolean;
    reports: boolean;
    learning: boolean;
    assistant: boolean;
    documentImport: boolean;
  };

  // Seuils et paramètres
  thresholds: {
    healthScoreWarning: number;
    healthScoreCritical: number;
    budgetOverrunWarning: number;
    budgetOverrunCritical: number;
    deadlineWarningDays: number;
    inactivityAlertDays: number;
    riskScoreCritical: number;
  };

  // Notifications
  notifications: {
    emailEnabled: boolean;
    appNotificationsEnabled: boolean;
    dailyDigest: boolean;
    digestTime?: string;
    criticalAlertsImmediate: boolean;
  };

  // Apprentissage
  learning: {
    enableFeedbackCollection: boolean;
    enablePatternDetection: boolean;
    enablePredictionValidation: boolean;
  };

  updatedAt: string;
  updatedBy?: number;
}

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

export interface Proph3tDashboard {
  healthAnalysis: ProjectHealthAnalysis;
  recentPredictions: Prediction[];
  topRecommendations: Recommendation[];
  activeAlerts: SmartAlert[];
  upcomingReminders: SmartReminder[];
  recentLearnings: LearningData[];
}

export interface Proph3tStats {
  predictionsAccuracy: number;
  recommendationsAccepted: number;
  recommendationsRejected: number;
  alertsGenerated: number;
  alertsTreated: number;
  averageResponseTime: number;
  patternsDetected: number;
  learningDataPoints: number;
}
