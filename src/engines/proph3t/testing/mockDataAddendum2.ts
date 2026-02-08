// ============================================================================
// PROPH3T V2 — MOCK DATA FOR ADDENDUM 2 TESTING
// ============================================================================
// Données de test pour les composants Addendum 2
// ============================================================================

import type { Commitment, CommitmentStats, CommitmentByOwner } from '../commitments/commitmentTracker';
import type { ReliabilityScore, ReliabilityComparison } from '../commitments/reliabilityScorer';
import type { PendingReminder, ReminderBatch } from '../commitments/reminderEngine';
import type { VelocityMetrics, TeamVelocity } from '../velocity/velocityAnalyzer';
import type { BurnRateMetrics, BurnProjection } from '../velocity/burnRateCalculator';
import type { IntegratedProjection } from '../velocity/projectionEngine';
import type { MeetingPrep } from '../meetings/meetingPrepEngine';
import type { FatigueAssessment, TeamFatigue } from '../health/fatigueDetector';
import type { MomentumAnalysis } from '../health/momentumTracker';
import type { ExternalDependency, DependencyStats } from '../dependencies/externalDependencyMap';
import type { BufferAnalysis } from '../dependencies/bufferCalculator';
import type { RetroPlan } from '../planning/dynamicRetroPlanner';
import type { CriticalChain, FeverChartData } from '../planning/criticalChainManager';
import type { DecisionAnalysis } from '../decisions/decisionAnalyzer';
import type { AlternativeOption } from '../decisions/alternativeGenerator';
import type { JournalEntry, JournalSummary } from '../journal/projectJournal';
import type { ComparisonResult } from '../benchmark/projectComparator';
import type { LessonLearned } from '../benchmark/lessonsLearnedStore';
import type { Alert, AlertSummary } from '../reporters/alertManager';

// ============================================================================
// COMMITMENTS MOCK DATA
// ============================================================================

export const mockCommitments: Commitment[] = [
  {
    id: 'c1',
    title: 'Livraison plans cuisine',
    description: 'Plans détaillés de la cuisine centrale',
    owner: 'Architecte Principal',
    dueDate: new Date('2026-02-15'),
    status: 'pending',
    priority: 'high',
    source: 'meeting',
    linkedActionIds: ['A-F&B-J4.1'],
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'c2',
    title: 'Validation budget MEP',
    description: 'Approbation finale du budget équipements techniques',
    owner: 'Direction Générale',
    dueDate: new Date('2026-02-20'),
    status: 'pending',
    priority: 'critical',
    source: 'manual',
    linkedJalonIds: ['J-8'],
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-01-20'),
  },
  {
    id: 'c3',
    title: 'Formation équipe F&B',
    description: 'Module de formation sur les standards de service',
    owner: 'DRH',
    dueDate: new Date('2026-01-30'),
    status: 'completed',
    priority: 'medium',
    source: 'email',
    completedAt: new Date('2026-01-28'),
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-28'),
  },
  {
    id: 'c4',
    title: 'Contrat prestataire ménage',
    description: 'Signature contrat housekeeping externalisé',
    owner: 'Direction Opérations',
    dueDate: new Date('2026-02-01'),
    status: 'overdue',
    priority: 'high',
    source: 'meeting',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-02-01'),
  },
];

export const mockCommitmentStats: CommitmentStats = {
  total: 12,
  pending: 5,
  completed: 4,
  overdue: 3,
  byPriority: { critical: 2, high: 4, medium: 4, low: 2 },
  completionRate: 0.57,
  onTimeRate: 0.75,
  averageCompletionDays: 8.5,
};

export const mockCommitmentsByOwner: CommitmentByOwner[] = [
  {
    owner: 'Direction Opérations',
    total: 4,
    pending: 2,
    completed: 1,
    overdue: 1,
    onTimeRate: 0.5,
  },
  {
    owner: 'Architecte Principal',
    total: 3,
    pending: 2,
    completed: 1,
    overdue: 0,
    onTimeRate: 1.0,
  },
  {
    owner: 'DRH',
    total: 3,
    pending: 1,
    completed: 2,
    overdue: 0,
    onTimeRate: 1.0,
  },
];

// ============================================================================
// RELIABILITY MOCK DATA
// ============================================================================

export const mockReliabilityScores: Record<string, ReliabilityScore> = {
  'Direction Opérations': {
    owner: 'Direction Opérations',
    overallScore: 65,
    components: {
      completionRate: 75,
      onTimeRate: 50,
      responsiveness: 70,
      consistency: 65,
    },
    trend: 'declining',
    confidence: 0.8,
    sampleSize: 8,
    lastUpdated: new Date(),
    history: [
      { date: new Date('2026-01-01'), score: 75 },
      { date: new Date('2026-01-08'), score: 72 },
      { date: new Date('2026-01-15'), score: 68 },
      { date: new Date('2026-01-22'), score: 65 },
    ],
  },
  'Architecte Principal': {
    owner: 'Architecte Principal',
    overallScore: 92,
    components: {
      completionRate: 95,
      onTimeRate: 90,
      responsiveness: 90,
      consistency: 93,
    },
    trend: 'stable',
    confidence: 0.9,
    sampleSize: 12,
    lastUpdated: new Date(),
    history: [
      { date: new Date('2026-01-01'), score: 90 },
      { date: new Date('2026-01-08'), score: 91 },
      { date: new Date('2026-01-15'), score: 92 },
      { date: new Date('2026-01-22'), score: 92 },
    ],
  },
  'DRH': {
    owner: 'DRH',
    overallScore: 85,
    components: {
      completionRate: 88,
      onTimeRate: 85,
      responsiveness: 80,
      consistency: 87,
    },
    trend: 'improving',
    confidence: 0.85,
    sampleSize: 10,
    lastUpdated: new Date(),
    history: [
      { date: new Date('2026-01-01'), score: 78 },
      { date: new Date('2026-01-08'), score: 80 },
      { date: new Date('2026-01-15'), score: 83 },
      { date: new Date('2026-01-22'), score: 85 },
    ],
  },
};

export const mockReliabilityComparison: ReliabilityComparison = {
  owners: ['Direction Opérations', 'Architecte Principal', 'DRH'],
  scores: mockReliabilityScores,
  ranking: [
    { owner: 'Architecte Principal', score: 92, rank: 1 },
    { owner: 'DRH', score: 85, rank: 2 },
    { owner: 'Direction Opérations', score: 65, rank: 3 },
  ],
  averageScore: 80.7,
  topPerformer: 'Architecte Principal',
  needsAttention: ['Direction Opérations'],
};

// ============================================================================
// VELOCITY MOCK DATA
// ============================================================================

export const mockVelocityMetrics: VelocityMetrics = {
  currentVelocity: 4.2,
  averageVelocity: 3.8,
  maxVelocity: 5.5,
  minVelocity: 2.1,
  trend: { direction: 'improving', percentage: 10.5, confidence: 0.85 },
  weeklyData: [
    { weekStart: new Date('2026-01-06'), completed: 3, points: 12 },
    { weekStart: new Date('2026-01-13'), completed: 4, points: 15 },
    { weekStart: new Date('2026-01-20'), completed: 5, points: 18 },
    { weekStart: new Date('2026-01-27'), completed: 4, points: 16 },
  ],
  forecastedVelocity: 4.5,
  capacityUtilization: 0.78,
};

export const mockTeamVelocity: TeamVelocity[] = [
  {
    teamName: 'F&B',
    currentVelocity: 3.5,
    averageVelocity: 3.2,
    trend: { direction: 'stable', percentage: 2, confidence: 0.75 },
    members: 4,
  },
  {
    teamName: 'Technique',
    currentVelocity: 5.0,
    averageVelocity: 4.5,
    trend: { direction: 'improving', percentage: 15, confidence: 0.9 },
    members: 6,
  },
  {
    teamName: 'Commercial',
    currentVelocity: 2.8,
    averageVelocity: 3.0,
    trend: { direction: 'declining', percentage: -8, confidence: 0.7 },
    members: 3,
  },
];

// ============================================================================
// BURN RATE MOCK DATA
// ============================================================================

export const mockBurnRateMetrics: BurnRateMetrics = {
  currentBurnRate: 125000,
  averageBurnRate: 118000,
  totalBudget: 2500000,
  totalSpent: 1150000,
  remaining: 1350000,
  percentUsed: 46,
  burnTrend: { direction: 'increasing', percentage: 5.9 },
  monthlyData: [
    { month: '2025-10', spent: 95000, cumulative: 350000 },
    { month: '2025-11', spent: 110000, cumulative: 460000 },
    { month: '2025-12', spent: 115000, cumulative: 575000 },
    { month: '2026-01', spent: 125000, cumulative: 700000 },
  ],
  runwayMonths: 10.8,
  exhaustionDate: new Date('2026-12-15'),
};

export const mockBurnProjections: BurnProjection[] = [
  {
    scenario: 'optimistic',
    exhaustionDate: new Date('2027-02-01'),
    finalSpend: 2350000,
    monthlyRate: 105000,
    remainingBudget: 150000,
  },
  {
    scenario: 'realistic',
    exhaustionDate: new Date('2026-12-15'),
    finalSpend: 2500000,
    monthlyRate: 125000,
    remainingBudget: 0,
  },
  {
    scenario: 'pessimistic',
    exhaustionDate: new Date('2026-10-01'),
    finalSpend: 2750000,
    monthlyRate: 145000,
    remainingBudget: -250000,
  },
];

// ============================================================================
// INTEGRATED PROJECTION MOCK DATA
// ============================================================================

export const mockIntegratedProjection: IntegratedProjection = {
  scheduleProjection: {
    targetDate: new Date('2026-06-01'),
    projectedDate: new Date('2026-06-15'),
    variance: 14,
    confidence: 0.75,
    riskFactors: ['Retards fournisseurs', 'Ressources limitées'],
  },
  budgetProjection: {
    targetBudget: 2500000,
    projectedSpend: 2650000,
    variance: 150000,
    variancePercent: 6,
    confidence: 0.8,
  },
  overallHealth: 'at_risk',
  criticalPath: ['J-4', 'J-6', 'J-8'],
  recommendations: [
    'Accélérer les livraisons équipements cuisine',
    'Négocier extension contrat prestataires',
    'Revoir allocation ressources technique',
  ],
  scenarios: [
    {
      name: 'Scénario nominal',
      probability: 0.4,
      completionDate: new Date('2026-06-01'),
      finalCost: 2500000,
    },
    {
      name: 'Retard modéré',
      probability: 0.35,
      completionDate: new Date('2026-06-15'),
      finalCost: 2600000,
    },
    {
      name: 'Retard important',
      probability: 0.25,
      completionDate: new Date('2026-07-01'),
      finalCost: 2750000,
    },
  ],
};

// ============================================================================
// MEETING PREP MOCK DATA
// ============================================================================

export const mockMeetingPrep: MeetingPrep = {
  id: 'prep-1',
  meetingType: 'exco',
  preparedAt: new Date(),
  summary: {
    headline: 'Projet en phase critique - Attention requise sur budget et délais',
    projectHealth: 'yellow',
    periodHighlights: [
      'Jalon J-4 validé avec 2 jours d\'avance',
      '85% des équipements cuisine commandés',
      'Formation F&B complétée pour 12 collaborateurs',
    ],
    concerns: [
      'Dépassement budget équipements de 8%',
      'Retard fournisseur mobilier (2 semaines)',
      'Tension ressources équipe technique',
    ],
    keyMetrics: [
      { label: 'Avancement', value: '67%', trend: 'up' },
      { label: 'Budget', value: '46% consommé', trend: 'stable' },
      { label: 'Actions en retard', value: '3', trend: 'down' },
    ],
  },
  talkingPoints: [
    {
      id: 'tp-1',
      topic: 'Validation budget supplémentaire équipements',
      context: 'Surcoût de 180K€ identifié suite aux modifications plans cuisine',
      priority: 'must_mention',
      suggestedPosition: 'Proposer validation en contrepartie économies phase 2',
      supportingData: ['Détail surcoûts', 'Options alternatives'],
      expectedQuestions: ['Pourquoi non anticipé?', 'Impact sur ROI?'],
    },
    {
      id: 'tp-2',
      topic: 'Stratégie rattrapage retard mobilier',
      context: 'Fournisseur principal annonce 2 semaines de retard',
      priority: 'must_mention',
      suggestedPosition: 'Activer fournisseur backup partiel',
      supportingData: ['Planning impact', 'Coût surcoût livraison express'],
      expectedQuestions: ['Qualité comparable?', 'Garanties?'],
    },
    {
      id: 'tp-3',
      topic: 'Point avancement recrutement',
      context: '45 postes pourvus sur 60 prévus',
      priority: 'should_mention',
      suggestedPosition: 'En bonne voie, focus sur postes critiques restants',
      supportingData: ['Tableau recrutements', 'Pipeline candidats'],
      expectedQuestions: ['Délai restant?'],
    },
  ],
  decisions: [
    {
      id: 'dec-1',
      question: 'Valider le budget supplémentaire de 180K€ pour équipements cuisine?',
      context: 'Modifications exigées par les normes sanitaires mises à jour',
      options: [
        { label: 'Approuver intégralement', pros: ['Délais tenus'], cons: ['Budget dépassé'] },
        { label: 'Approuver partiellement', pros: ['Compromis'], cons: ['Risque qualité'] },
        { label: 'Reporter décision', pros: ['Temps analyse'], cons: ['Retard projet'] },
      ],
      impact: 'high',
      deadline: new Date('2026-02-15'),
      recommendation: 'Approuver avec condition d\'économies compensatoires',
    },
  ],
  risksToDiscuss: [
    {
      risk: {
        id: 'r-1',
        description: 'Rupture approvisionnement matériaux construction',
        probability: 0.3,
        impact: 4,
        owner: 'Direction Technique',
      },
      reason: 'Tensions géopolitiques affectant chaîne approvisionnement',
      suggestedAction: 'Valider stock tampon 4 semaines',
    },
  ],
  alertsOverview: {
    critical: 1,
    high: 3,
    medium: 5,
    low: 2,
  },
  suggestedAgenda: [
    { order: 1, title: 'Synthèse avancement', duration: 10 },
    { order: 2, title: 'Point budget et arbitrages', duration: 20 },
    { order: 3, title: 'Risques et mitigations', duration: 15 },
    { order: 4, title: 'Décisions à prendre', duration: 10 },
    { order: 5, title: 'Questions / Divers', duration: 5 },
  ],
};

// ============================================================================
// FATIGUE & MOMENTUM MOCK DATA
// ============================================================================

export const mockFatigueAssessment: FatigueAssessment = {
  overallLevel: 'moderate',
  score: 55,
  signals: [
    {
      indicator: 'velocity_decline',
      severity: 'moderate',
      evidence: 'Baisse de 15% de la vélocité sur 3 semaines',
      recommendation: 'Revoir charge de travail équipe technique',
    },
    {
      indicator: 'overdue_accumulation',
      severity: 'low',
      evidence: '3 actions en retard (vs 1 habituellement)',
      recommendation: 'Prioriser déblocage actions critiques',
    },
  ],
  teamAreas: ['Technique', 'F&B'],
  trend: 'increasing',
  recommendations: [
    'Planifier une journée de récupération pour l\'équipe technique',
    'Redistribuer les tâches non-critiques',
    'Organiser un point d\'équipe pour identifier les irritants',
  ],
};

export const mockTeamFatigue: TeamFatigue[] = [
  {
    team: 'Technique',
    fatigueLevel: 'high',
    score: 70,
    primaryIndicators: ['velocity_decline', 'deadline_slippage'],
    recommendation: 'Action urgente requise',
  },
  {
    team: 'F&B',
    fatigueLevel: 'moderate',
    score: 50,
    primaryIndicators: ['overdue_accumulation'],
    recommendation: 'Surveillance recommandée',
  },
  {
    team: 'Commercial',
    fatigueLevel: 'low',
    score: 25,
    primaryIndicators: [],
    recommendation: 'Aucune action nécessaire',
  },
];

export const mockMomentumAnalysis: MomentumAnalysis = {
  currentState: 'cruising',
  score: 72,
  velocity: 4.2,
  acceleration: 0.3,
  dataPoints: [
    { date: new Date('2026-01-01'), score: 65, state: 'slowing' },
    { date: new Date('2026-01-08'), score: 68, state: 'recovering' },
    { date: new Date('2026-01-15'), score: 70, state: 'cruising' },
    { date: new Date('2026-01-22'), score: 72, state: 'cruising' },
  ],
  insights: [
    {
      type: 'positive',
      message: 'Momentum stable depuis 2 semaines',
      impact: 'Rythme de croisière atteint',
    },
    {
      type: 'neutral',
      message: 'Légère accélération détectée',
      impact: 'Potentiel de passage en mode accélération',
    },
  ],
  forecast: {
    nextWeek: 'cruising',
    confidence: 0.8,
    risks: ['Charge technique élevée'],
  },
};

// ============================================================================
// DEPENDENCIES MOCK DATA
// ============================================================================

export const mockExternalDependencies: ExternalDependency[] = [
  {
    id: 'dep-1',
    name: 'Livraison équipements cuisine',
    type: 'supplier',
    description: 'Fourneaux, hottes, chambres froides',
    status: 'at_risk',
    owner: 'Fournisseur XYZ',
    dueDate: new Date('2026-03-01'),
    linkedJalonIds: ['J-6'],
    linkedActionIds: ['A-F&B-J4.2', 'A-F&B-J4.3'],
    impactIfLate: 'Retard mise en service cuisine',
    mitigationPlan: 'Fournisseur backup identifié',
    lastUpdate: new Date(),
  },
  {
    id: 'dep-2',
    name: 'Permis d\'exploitation',
    type: 'regulatory',
    description: 'Autorisation préfectorale',
    status: 'on_track',
    owner: 'Direction Juridique',
    dueDate: new Date('2026-04-15'),
    linkedJalonIds: ['J-9'],
    impactIfLate: 'Report ouverture établissement',
    lastUpdate: new Date(),
  },
  {
    id: 'dep-3',
    name: 'Formation certifiante personnel',
    type: 'training',
    description: 'HACCP et sécurité incendie',
    status: 'on_track',
    owner: 'Organisme FormaPro',
    dueDate: new Date('2026-04-01'),
    linkedActionIds: ['A-OPS-J7.1'],
    lastUpdate: new Date(),
  },
];

export const mockDependencyStats: DependencyStats = {
  total: 8,
  byStatus: {
    on_track: 5,
    at_risk: 2,
    delayed: 1,
    completed: 0,
  },
  byType: {
    supplier: 3,
    regulatory: 2,
    training: 2,
    partner: 1,
  },
  criticalCount: 2,
  averageLeadTime: 45,
};

// ============================================================================
// BUFFER ANALYSIS MOCK DATA
// ============================================================================

export const mockBufferAnalysis: BufferAnalysis = {
  projectBuffer: {
    id: 'pb-1',
    type: 'project',
    name: 'Buffer projet global',
    totalDays: 30,
    consumedDays: 12,
    remainingDays: 18,
    consumptionRate: 0.4,
    status: 'healthy',
    linkedTaskIds: [],
  },
  feedingBuffers: [
    {
      id: 'fb-1',
      type: 'feeding',
      name: 'Buffer équipements',
      totalDays: 14,
      consumedDays: 8,
      remainingDays: 6,
      consumptionRate: 0.57,
      status: 'warning',
      linkedTaskIds: ['J-6'],
    },
    {
      id: 'fb-2',
      type: 'feeding',
      name: 'Buffer formation',
      totalDays: 10,
      consumedDays: 2,
      remainingDays: 8,
      consumptionRate: 0.2,
      status: 'healthy',
      linkedTaskIds: ['J-7'],
    },
  ],
  recommendations: [
    {
      bufferId: 'fb-1',
      action: 'reduce_scope',
      rationale: 'Consommation rapide du buffer équipements',
      expectedImpact: 'Récupération 3 jours de buffer',
    },
  ],
  overallHealth: 'warning',
  projectedStatus: {
    date: new Date('2026-04-01'),
    remainingProjectBuffer: 10,
    atRiskBuffers: ['fb-1'],
  },
};

// ============================================================================
// RETRO-PLANNING MOCK DATA
// ============================================================================

export const mockRetroPlan: RetroPlan = {
  id: 'rp-1',
  targetDate: new Date('2026-06-01'),
  createdAt: new Date(),
  items: [
    {
      id: 'rpi-1',
      type: 'jalon',
      title: 'Soft Opening',
      targetDate: new Date('2026-06-01'),
      calculatedStartDate: new Date('2026-05-15'),
      duration: 14,
      isCriticalPath: true,
      dependencies: ['rpi-2', 'rpi-3'],
      status: 'on_track',
      slack: 0,
    },
    {
      id: 'rpi-2',
      type: 'jalon',
      title: 'Formation complète équipes',
      targetDate: new Date('2026-05-15'),
      calculatedStartDate: new Date('2026-04-15'),
      duration: 30,
      isCriticalPath: true,
      dependencies: ['rpi-4'],
      status: 'on_track',
      slack: 0,
    },
    {
      id: 'rpi-3',
      type: 'jalon',
      title: 'Réception équipements',
      targetDate: new Date('2026-05-01'),
      calculatedStartDate: new Date('2026-03-01'),
      duration: 60,
      isCriticalPath: true,
      dependencies: [],
      status: 'at_risk',
      slack: 0,
    },
    {
      id: 'rpi-4',
      type: 'jalon',
      title: 'Recrutement finalisé',
      targetDate: new Date('2026-04-01'),
      calculatedStartDate: new Date('2026-02-01'),
      duration: 60,
      isCriticalPath: false,
      dependencies: [],
      status: 'on_track',
      slack: 14,
    },
  ],
  criticalPath: {
    tasks: ['rpi-3', 'rpi-2', 'rpi-1'],
    totalDuration: 104,
    bufferUsed: 12,
    riskLevel: 'medium',
  },
  scenarios: [
    {
      name: 'Nominal',
      probability: 0.5,
      targetDate: new Date('2026-06-01'),
      adjustments: [],
    },
    {
      name: 'Retard équipements',
      probability: 0.3,
      targetDate: new Date('2026-06-15'),
      adjustments: [
        { itemId: 'rpi-3', newDate: new Date('2026-05-15'), reason: 'Délai fournisseur' },
      ],
    },
  ],
};

// ============================================================================
// CRITICAL CHAIN MOCK DATA
// ============================================================================

export const mockCriticalChain: CriticalChain = {
  id: 'cc-1',
  tasks: [
    {
      id: 'cct-1',
      name: 'Réception gros équipements',
      duration: 30,
      safetyRemoved: 10,
      resource: 'Technique',
      predecessors: [],
      isOnCriticalChain: true,
      buffer: 5,
    },
    {
      id: 'cct-2',
      name: 'Installation cuisine',
      duration: 21,
      safetyRemoved: 7,
      resource: 'Technique',
      predecessors: ['cct-1'],
      isOnCriticalChain: true,
      buffer: 3,
    },
    {
      id: 'cct-3',
      name: 'Tests et mise en service',
      duration: 14,
      safetyRemoved: 5,
      resource: 'Technique',
      predecessors: ['cct-2'],
      isOnCriticalChain: true,
      buffer: 3,
    },
  ],
  totalDuration: 65,
  totalBuffer: 22,
  bufferConsumed: 8,
  startDate: new Date('2026-03-01'),
  projectedEndDate: new Date('2026-05-05'),
  status: {
    health: 'yellow',
    bufferStatus: 'adequate',
    message: 'Consommation buffer modérée - surveillance recommandée',
  },
};

export const mockFeverChartData: FeverChartData = {
  dataPoints: [
    { date: new Date('2026-02-01'), percentComplete: 0, bufferConsumed: 0, zone: 'green' },
    { date: new Date('2026-02-08'), percentComplete: 10, bufferConsumed: 5, zone: 'green' },
    { date: new Date('2026-02-15'), percentComplete: 20, bufferConsumed: 12, zone: 'green' },
    { date: new Date('2026-02-22'), percentComplete: 30, bufferConsumed: 25, zone: 'yellow' },
    { date: new Date('2026-03-01'), percentComplete: 40, bufferConsumed: 36, zone: 'yellow' },
  ],
  greenZone: { maxBufferPercent: 33 },
  yellowZone: { maxBufferPercent: 66 },
  redZone: { maxBufferPercent: 100 },
  trend: 'improving',
  projection: { percentComplete: 100, expectedBufferConsumed: 75 },
};

// ============================================================================
// DECISION ANALYSIS MOCK DATA
// ============================================================================

export const mockDecisionAnalysis: DecisionAnalysis = {
  id: 'da-1',
  context: {
    question: 'Comment gérer le retard de livraison des équipements cuisine?',
    category: 'supply_chain',
    urgency: 'this_week',
    constraints: [
      'Budget supplémentaire limité à 50K€',
      'Date soft opening non négociable',
      'Qualité équipements critique',
    ],
    stakeholders: ['Direction Opérations', 'Chef Cuisine', 'Direction Financière'],
    background: 'Fournisseur principal annonce 2 semaines de retard sur livraison équipements cuisine centrale.',
  },
  options: [
    {
      id: 'opt-1',
      name: 'Attendre le fournisseur principal',
      description: 'Accepter le retard et ajuster le planning',
      pros: ['Pas de surcoût', 'Qualité garantie', 'Relation fournisseur préservée'],
      cons: ['Retard 2 semaines', 'Risque cascade sur formation', 'Stress équipes'],
      risks: ['Report soft opening', 'Coûts indirects'],
      estimatedCost: 0,
      estimatedDuration: 14,
      feasibility: 'high',
      alignment: 60,
    },
    {
      id: 'opt-2',
      name: 'Activer fournisseur backup',
      description: 'Commander équipements critiques chez fournisseur alternatif',
      pros: ['Délais tenus', 'Risque réduit', 'Flexibilité'],
      cons: ['Surcoût 15-20%', 'Qualité à valider', 'Logistique complexe'],
      risks: ['Qualité inférieure', 'SAV compliqué'],
      estimatedCost: 45000,
      estimatedDuration: 0,
      feasibility: 'medium',
      alignment: 75,
    },
    {
      id: 'opt-3',
      name: 'Solution hybride',
      description: 'Livraison partielle fournisseur principal + backup pour items critiques',
      pros: ['Compromis équilibré', 'Risque modéré', 'Coût maîtrisé'],
      cons: ['Coordination complexe', 'Surcoût modéré'],
      risks: ['Complexité gestion'],
      estimatedCost: 25000,
      estimatedDuration: 3,
      feasibility: 'high',
      alignment: 85,
    },
  ],
  recommendation: {
    optionId: 'opt-3',
    confidence: 78,
    rationale: 'Meilleur équilibre risque/coût/délai avec la solution hybride',
  },
  tradeoffs: [
    { factor: 'Coût', winner: 'opt-1' },
    { factor: 'Délai', winner: 'opt-2' },
    { factor: 'Risque', winner: 'opt-3' },
    { factor: 'Flexibilité', winner: 'opt-3' },
  ],
  nextSteps: [
    'Contacter fournisseur backup pour disponibilité immédiate',
    'Négocier pénalités de retard avec fournisseur principal',
    'Identifier items critiques pour livraison prioritaire',
    'Préparer plan B si livraison retardée davantage',
  ],
  deadline: new Date('2026-02-10'),
};

export const mockAlternatives: AlternativeOption[] = [
  {
    id: 'alt-1',
    name: 'Location temporaire équipements',
    description: 'Louer équipements de cuisine pendant 3 mois le temps de recevoir les définitifs',
    creativity: 'innovative',
    feasibility: 'medium',
    alignment: 70,
    pros: ['Délais tenus', 'Test grandeur nature'],
    cons: ['Coût location', 'Manutention double'],
    implementation: [
      'Identifier loueur professionnel',
      'Négocier contrat court terme',
      'Planifier logistique installation/désinstallation',
    ],
  },
  {
    id: 'alt-2',
    name: 'Soft opening phased',
    description: 'Ouvrir d\'abord les espaces ne nécessitant pas la cuisine complète',
    creativity: 'radical',
    feasibility: 'high',
    alignment: 65,
    pros: ['Ouverture partielle respectée', 'Buzz médiatique'],
    cons: ['Expérience client limitée', 'Communication complexe'],
    implementation: [
      'Définir périmètre ouverture phase 1',
      'Préparer communication client',
      'Planifier montée en puissance',
    ],
  },
];

// ============================================================================
// JOURNAL MOCK DATA
// ============================================================================

export const mockJournalEntries: JournalEntry[] = [
  {
    id: 'je-1',
    type: 'milestone_completed',
    title: 'Jalon J-4 validé',
    content: 'La revue technique des plans de la cuisine centrale a été validée avec succès. Tous les commentaires des parties prenantes ont été intégrés.',
    timestamp: new Date('2026-02-05T14:30:00'),
    importance: 'high',
    category: 'milestone',
    tags: ['cuisine', 'technique', 'validation'],
    linkedJalonIds: ['J-4'],
    isAutoGenerated: true,
  },
  {
    id: 'je-2',
    type: 'decision_made',
    title: 'Choix fournisseur mobilier validé',
    content: 'Après analyse comparative, le fournisseur MobiPro a été sélectionné pour l\'ensemble du mobilier des espaces communs. Contrat signé pour 450K€.',
    timestamp: new Date('2026-02-03T10:00:00'),
    importance: 'high',
    category: 'decision',
    tags: ['mobilier', 'fournisseur', 'contrat'],
    isAutoGenerated: false,
    author: 'Direction Achats',
  },
  {
    id: 'je-3',
    type: 'risk_identified',
    title: 'Risque approvisionnement matériaux',
    content: 'Les tensions sur le marché des matériaux de construction pourraient impacter les délais de livraison. Probabilité évaluée à 30%.',
    timestamp: new Date('2026-02-01T16:00:00'),
    importance: 'medium',
    category: 'risk',
    tags: ['approvisionnement', 'matériaux', 'risque'],
    isAutoGenerated: true,
  },
  {
    id: 'je-4',
    type: 'action_blocked',
    title: 'Action A-F&B-J4.2 bloquée',
    content: 'La commande des équipements frigorifiques est bloquée en attente de validation budget supplémentaire.',
    timestamp: new Date('2026-01-28T11:00:00'),
    importance: 'high',
    category: 'action',
    tags: ['équipement', 'budget', 'blocage'],
    linkedActionIds: ['A-F&B-J4.2'],
    isAutoGenerated: true,
  },
  {
    id: 'je-5',
    type: 'lesson_learned',
    title: 'Importance des marges fournisseurs',
    content: 'Suite aux retards constatés, nous recommandons d\'intégrer systématiquement 2 semaines de marge dans les plannings fournisseurs critiques.',
    timestamp: new Date('2026-01-25T09:00:00'),
    importance: 'medium',
    category: 'lesson',
    tags: ['planning', 'fournisseurs', 'marge'],
    isAutoGenerated: false,
    author: 'Direction Technique',
  },
];

export const mockJournalSummary: JournalSummary = {
  totalEntries: 28,
  byType: {
    milestone_completed: 4,
    milestone_delayed: 2,
    action_completed: 8,
    action_blocked: 3,
    risk_identified: 4,
    risk_mitigated: 2,
    decision_made: 3,
    issue_raised: 1,
    issue_resolved: 0,
    budget_alert: 1,
    schedule_alert: 0,
    team_update: 0,
    external_event: 0,
    lesson_learned: 0,
    manual_note: 0,
  },
  byImportance: {
    critical: 2,
    high: 8,
    medium: 12,
    low: 6,
  },
  dateRange: {
    start: new Date('2026-01-01'),
    end: new Date('2026-02-08'),
  },
  highlights: mockJournalEntries.slice(0, 3),
  trends: [
    { type: 'milestone_completed', trend: 'increasing' },
    { type: 'action_blocked', trend: 'stable' },
  ],
};

// ============================================================================
// BENCHMARK MOCK DATA
// ============================================================================

export const mockComparisonResult: ComparisonResult = {
  projectId: 'cosmos-angre',
  benchmarkDate: new Date(),
  overallScore: 72,
  industryAverage: 65,
  percentile: 78,
  metrics: [
    {
      name: 'Taux de complétion',
      value: 67,
      benchmark: 60,
      variance: 7,
      interpretation: 'Au-dessus de la moyenne',
      category: 'schedule',
    },
    {
      name: 'Respect du budget',
      value: 94,
      benchmark: 88,
      variance: 6,
      interpretation: 'Performance exemplaire',
      category: 'cost',
    },
    {
      name: 'Vélocité équipe',
      value: 4.2,
      benchmark: 3.5,
      variance: 0.7,
      interpretation: 'Équipe performante',
      category: 'productivity',
    },
    {
      name: 'Risques mitigés',
      value: 75,
      benchmark: 70,
      variance: 5,
      interpretation: 'Bonne gestion des risques',
      category: 'risk',
    },
  ],
  trends: [
    {
      metric: 'velocity',
      projectTrend: 'improving',
      industryTrend: 'stable',
      gap: 0.5,
    },
    {
      metric: 'budget_variance',
      projectTrend: 'stable',
      industryTrend: 'declining',
      gap: -2,
    },
  ],
  recommendations: [
    'Maintenir le rythme actuel de vélocité',
    'Surveiller de près la consommation du budget phase 2',
    'Partager les bonnes pratiques de gestion des risques',
  ],
};

export const mockLessonsLearned: LessonLearned[] = [
  {
    id: 'll-1',
    title: 'Marges fournisseurs critiques',
    description: 'Toujours prévoir 2 semaines de marge pour les fournisseurs sur le chemin critique',
    context: 'Retard de 2 semaines sur livraison équipements cuisine',
    outcome: 'Délai impacté mais soft opening maintenu grâce au buffer',
    category: 'procurement',
    type: 'challenge_overcome',
    impact: 'high',
    applicability: ['Tous projets avec fournisseurs externes critiques'],
    createdAt: new Date('2026-02-01'),
    source: 'experience',
    tags: ['fournisseurs', 'planning', 'buffer'],
  },
  {
    id: 'll-2',
    title: 'Communication proactive parties prenantes',
    description: 'Informer les parties prenantes des risques potentiels avant qu\'ils ne se matérialisent',
    context: 'Tension initiale avec Direction suite à surprise sur dépassement budget',
    outcome: 'Confiance rétablie après mise en place reporting anticipé',
    category: 'stakeholder',
    type: 'success',
    impact: 'medium',
    applicability: ['Projets avec multiples parties prenantes'],
    createdAt: new Date('2026-01-15'),
    source: 'feedback',
    tags: ['communication', 'stakeholders', 'reporting'],
  },
];

// ============================================================================
// ALERTS MOCK DATA
// ============================================================================

export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    level: 'critical',
    title: 'Retard livraison équipements cuisine',
    message: 'Le fournisseur XYZ annonce un retard de 2 semaines sur la livraison des équipements cuisine. Impact potentiel sur le jalon J-6.',
    source: 'prediction',
    sourceId: 'pred-123',
    module: 'Supply Chain',
    timestamp: new Date('2026-02-07T14:30:00'),
    status: 'active',
    escalationHistory: [],
    metadata: { jalonId: 'J-6', supplierId: 'XYZ' },
    suggestedActions: [
      'Contacter fournisseur backup',
      'Évaluer impact sur planning',
      'Préparer plan de contingence',
    ],
  },
  {
    id: 'alert-2',
    level: 'warning',
    title: 'Consommation buffer rapide',
    message: 'Le buffer équipements se consomme à 57%, soit 15% plus vite que prévu. Risque d\'épuisement avant fin de phase.',
    source: 'threshold',
    sourceId: 'buffer-fb-1',
    module: 'Planning',
    timestamp: new Date('2026-02-06T09:00:00'),
    status: 'acknowledged',
    acknowledgedAt: new Date('2026-02-06T10:15:00'),
    acknowledgedBy: 'Chef Projet',
    escalationHistory: [],
    metadata: { bufferId: 'fb-1', consumptionRate: 0.57 },
    suggestedActions: [
      'Revoir estimation durées tâches restantes',
      'Identifier opportunités de compression',
    ],
  },
  {
    id: 'alert-3',
    level: 'warning',
    title: 'Fatigue équipe technique détectée',
    message: 'Les indicateurs de fatigue de l\'équipe technique sont en hausse : baisse de vélocité de 15%, augmentation des retards.',
    source: 'pattern',
    sourceId: 'fatigue-tech',
    module: 'Health',
    timestamp: new Date('2026-02-05T16:00:00'),
    status: 'active',
    escalationHistory: [],
    metadata: { team: 'Technique', fatigueScore: 70 },
    suggestedActions: [
      'Planifier journée de récupération',
      'Redistribuer charge de travail',
      'Organiser point d\'équipe',
    ],
  },
  {
    id: 'alert-4',
    level: 'info',
    title: 'Jalon J-4 validé',
    message: 'Le jalon J-4 (Revue technique cuisine) a été validé avec 2 jours d\'avance sur le planning.',
    source: 'threshold',
    sourceId: 'jalon-J-4',
    module: 'Milestones',
    timestamp: new Date('2026-02-05T14:30:00'),
    status: 'resolved',
    resolvedAt: new Date('2026-02-05T14:30:00'),
    escalationHistory: [],
    metadata: { jalonId: 'J-4' },
    suggestedActions: [],
  },
  {
    id: 'alert-5',
    level: 'critical',
    title: 'Dépassement budget équipements',
    message: 'Le budget équipements dépasse de 8% l\'enveloppe prévue. Validation supplémentaire requise.',
    source: 'threshold',
    sourceId: 'budget-equip',
    module: 'Budget',
    timestamp: new Date('2026-02-04T11:00:00'),
    status: 'escalated',
    escalationHistory: [
      {
        timestamp: new Date('2026-02-05T09:00:00'),
        fromLevel: 'warning',
        toLevel: 'critical',
        reason: 'Pas de réponse après 24h',
        notifiedChannels: ['ui', 'email'],
      },
    ],
    metadata: { budgetCategory: 'Équipements', variance: 0.08 },
    suggestedActions: [
      'Soumettre demande budget supplémentaire',
      'Identifier économies compensatoires',
      'Renégocier contrats fournisseurs',
    ],
  },
];

export const mockAlertSummary: AlertSummary = {
  total: 5,
  byLevel: {
    emergency: 0,
    critical: 2,
    warning: 2,
    info: 1,
  },
  byStatus: {
    active: 2,
    acknowledged: 1,
    resolved: 1,
    escalated: 1,
  },
  byModule: {
    'Supply Chain': 1,
    'Planning': 1,
    'Health': 1,
    'Milestones': 1,
    'Budget': 1,
  },
  criticalCount: 2,
  unresolvedCount: 4,
  averageResolutionTimeHours: 12.5,
};

// ============================================================================
// EXPORT ALL MOCK DATA
// ============================================================================

export const PROPH3T_MOCK_DATA = {
  // Commitments
  commitments: mockCommitments,
  commitmentStats: mockCommitmentStats,
  commitmentsByOwner: mockCommitmentsByOwner,

  // Reliability
  reliabilityScores: mockReliabilityScores,
  reliabilityComparison: mockReliabilityComparison,

  // Velocity
  velocityMetrics: mockVelocityMetrics,
  teamVelocity: mockTeamVelocity,
  burnRateMetrics: mockBurnRateMetrics,
  burnProjections: mockBurnProjections,
  integratedProjection: mockIntegratedProjection,

  // Meetings
  meetingPrep: mockMeetingPrep,

  // Health
  fatigueAssessment: mockFatigueAssessment,
  teamFatigue: mockTeamFatigue,
  momentumAnalysis: mockMomentumAnalysis,

  // Dependencies
  externalDependencies: mockExternalDependencies,
  dependencyStats: mockDependencyStats,
  bufferAnalysis: mockBufferAnalysis,

  // Planning
  retroPlan: mockRetroPlan,
  criticalChain: mockCriticalChain,
  feverChartData: mockFeverChartData,

  // Decisions
  decisionAnalysis: mockDecisionAnalysis,
  alternatives: mockAlternatives,

  // Journal
  journalEntries: mockJournalEntries,
  journalSummary: mockJournalSummary,

  // Benchmark
  comparisonResult: mockComparisonResult,
  lessonsLearned: mockLessonsLearned,

  // Alerts
  alerts: mockAlerts,
  alertSummary: mockAlertSummary,
};

export default PROPH3T_MOCK_DATA;
