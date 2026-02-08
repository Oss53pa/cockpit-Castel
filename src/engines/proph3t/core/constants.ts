// ============================================================================
// PROPH3T ENGINE V2 — CONSTANTES ET CONFIGURATION
// ============================================================================
// Seuils, paramètres et benchmarks pour centres commerciaux en Afrique
// ============================================================================

import type {
  ConfidenceLevel,
  ImpactLevel,
  ActionPriority,
  ProjectModule,
  ModuleCorrelation,
  BenchmarkData,
} from './types';

// ============================================================================
// VERSION
// ============================================================================

export const PROPH3T_VERSION = '2.0.0';

// ============================================================================
// SEUILS DE CONFIANCE
// ============================================================================

export const CONFIDENCE_THRESHOLDS: Record<ConfidenceLevel, { min: number; max: number }> = {
  low: { min: 0, max: 39 },
  medium: { min: 40, max: 69 },
  high: { min: 70, max: 89 },
  very_high: { min: 90, max: 100 },
};

export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 90) return 'very_high';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// ============================================================================
// SEUILS D'IMPACT
// ============================================================================

export const IMPACT_WEIGHTS: Record<ImpactLevel, number> = {
  low: 1,
  medium: 2,
  high: 4,
  critical: 8,
};

export const IMPACT_THRESHOLDS = {
  cost: {
    low: 5_000_000,        // < 5M FCFA
    medium: 20_000_000,    // < 20M FCFA
    high: 50_000_000,      // < 50M FCFA
    critical: 50_000_000,  // >= 50M FCFA
  },
  schedule: {
    low: 7,      // < 7 jours
    medium: 30,  // < 30 jours
    high: 60,    // < 60 jours
    critical: 60, // >= 60 jours
  },
  revenue: {
    low: 10_000_000,       // < 10M FCFA/an
    medium: 50_000_000,    // < 50M FCFA/an
    high: 100_000_000,     // < 100M FCFA/an
    critical: 100_000_000, // >= 100M FCFA/an
  },
};

export function getImpactLevel(
  type: 'cost' | 'schedule' | 'revenue',
  value: number
): ImpactLevel {
  const thresholds = IMPACT_THRESHOLDS[type];
  if (value < thresholds.low) return 'low';
  if (value < thresholds.medium) return 'medium';
  if (value < thresholds.high) return 'high';
  return 'critical';
}

// ============================================================================
// SEUILS EISENHOWER (Priorité)
// ============================================================================

export const PRIORITY_CONFIG: Record<ActionPriority, {
  label: string;
  description: string;
  color: string;
  deadlineRule: string;
}> = {
  P0: {
    label: 'Urgent & Important',
    description: 'Faire immédiatement',
    color: '#dc2626', // red-600
    deadlineRule: 'Dans les 24-48h',
  },
  P1: {
    label: 'Important',
    description: 'Planifier cette semaine',
    color: '#f97316', // orange-500
    deadlineRule: 'Dans les 7 jours',
  },
  P2: {
    label: 'Urgent',
    description: 'Déléguer si possible',
    color: '#eab308', // yellow-500
    deadlineRule: 'Dans les 14 jours',
  },
  P3: {
    label: 'Ni urgent ni important',
    description: 'Reporter ou éliminer',
    color: '#6b7280', // gray-500
    deadlineRule: 'À planifier ultérieurement',
  },
};

// ============================================================================
// SEUILS D'ANOMALIES
// ============================================================================

export const ANOMALY_CONFIG = {
  // Méthode de détection
  detection: {
    // Seuil Z-score modifié pour petits échantillons
    modifiedZScoreThreshold: 3.5,
    // Multiplicateur IQR pour outliers
    iqrMultiplier: 1.5,
    // Fenêtre de moyenne mobile (jours)
    movingAverageWindow: 7,
    // Minimum de points pour calcul statistique
    minDataPoints: 5,
  },
  // Persistence
  persistence: {
    // Jours avant qu'une anomalie soit considérée "persistante"
    newThresholdDays: 3,
    // Jours avant escalade automatique de severity
    escalationDays: 7,
  },
  // Seuils par métrique (fallback si pas assez de données historiques)
  fallbackThresholds: {
    tauxEngagement: { min: 20, max: 95 },
    tauxRealisation: { min: 15, max: 90 },
    avancementGlobal: { min: 0, max: 100 },
    tauxOccupation: { min: 0, max: 100 },
    ecartSync: { min: -15, max: 15 },
    spi: { min: 0.8, max: 1.2 },
    cpi: { min: 0.8, max: 1.2 },
  },
};

// ============================================================================
// MATRICE DE CORRÉLATION CROSS-MODULE
// ============================================================================

export const MODULE_CORRELATIONS: ModuleCorrelation[] = [
  // Technique → Autres
  {
    source: 'technique',
    target: 'planning',
    lag: '0d',
    strength: 0.95,
    description: 'Retard technique = retard planning direct',
  },
  {
    source: 'technique',
    target: 'budget',
    lag: '15d',
    strength: 0.8,
    description: 'Retard technique → surcoûts (prolongation, pénalités)',
  },
  {
    source: 'technique',
    target: 'commercialisation',
    lag: '30d',
    strength: 0.7,
    description: 'Retard technique → incertitude locataires',
  },

  // Planning → Autres
  {
    source: 'planning',
    target: 'commercialisation',
    lag: '30d',
    strength: 0.75,
    description: 'Retard planning → report signatures baux',
  },
  {
    source: 'planning',
    target: 'marketing',
    lag: '45d',
    strength: 0.6,
    description: 'Retard planning → décalage campagnes',
  },

  // Commercialisation → Autres
  {
    source: 'commercialisation',
    target: 'budget',
    lag: '60d',
    strength: 0.85,
    description: 'Taux occupation → revenus → capacité financement',
  },
  {
    source: 'commercialisation',
    target: 'marketing',
    lag: '30d',
    strength: 0.5,
    description: 'Commercialisation impacte stratégie marketing',
  },

  // Budget → Autres
  {
    source: 'budget',
    target: 'technique',
    lag: '7d',
    strength: 0.6,
    description: 'Contrainte budget → ralentissement travaux',
  },
  {
    source: 'budget',
    target: 'rh',
    lag: '14d',
    strength: 0.5,
    description: 'Contrainte budget → gel recrutements',
  },

  // RH → Autres
  {
    source: 'rh',
    target: 'exploitation',
    lag: '30d',
    strength: 0.7,
    description: 'Sous-effectif → risque exploitation',
  },
  {
    source: 'rh',
    target: 'commercialisation',
    lag: '14d',
    strength: 0.4,
    description: 'Sous-effectif commercial → ralentissement signatures',
  },

  // Construction → Autres
  {
    source: 'construction',
    target: 'technique',
    lag: '0d',
    strength: 0.9,
    description: 'Avancement construction = avancement technique',
  },
  {
    source: 'construction',
    target: 'commercialisation',
    lag: '60d',
    strength: 0.65,
    description: 'Visibilité chantier → confiance locataires',
  },
];

// ============================================================================
// BENCHMARKS AFRIQUE DE L'OUEST — CENTRES COMMERCIAUX
// ============================================================================

export const BENCHMARKS_WEST_AFRICA_SHOPPING_CENTER: Omit<BenchmarkData, 'id' | 'lastUpdated'>[] = [
  {
    projectType: 'shopping_center',
    region: 'west_africa',
    metric: 'construction_cost_per_sqm',
    metricLabel: 'Coût construction au m²',
    value: 425000,
    unit: 'FCFA/m²',
    percentile25: 350000,
    percentile50: 425000,
    percentile75: 500000,
    sampleSize: 12,
  },
  {
    projectType: 'shopping_center',
    region: 'west_africa',
    metric: 'opening_occupancy_rate',
    metricLabel: 'Taux occupation à l\'ouverture',
    value: 72,
    unit: '%',
    percentile25: 65,
    percentile50: 72,
    percentile75: 80,
    sampleSize: 15,
  },
  {
    projectType: 'shopping_center',
    region: 'west_africa',
    metric: 'anchor_lead_time',
    metricLabel: 'Délai signature bail ancre (avant ouverture)',
    value: 9,
    unit: 'mois',
    percentile25: 6,
    percentile50: 9,
    percentile75: 12,
    sampleSize: 18,
  },
  {
    projectType: 'shopping_center',
    region: 'west_africa',
    metric: 'common_charges_ratio',
    metricLabel: 'Ratio charges communes / loyer',
    value: 20,
    unit: '%',
    percentile25: 15,
    percentile50: 20,
    percentile75: 25,
    sampleSize: 20,
  },
  {
    projectType: 'shopping_center',
    region: 'west_africa',
    metric: 'mobilization_duration',
    metricLabel: 'Durée phase mobilisation',
    value: 10,
    unit: 'mois',
    percentile25: 8,
    percentile50: 10,
    percentile75: 12,
    sampleSize: 14,
  },
  {
    projectType: 'shopping_center',
    region: 'west_africa',
    metric: 'budget_overrun_rate',
    metricLabel: 'Taux moyen de dépassement budget',
    value: 12,
    unit: '%',
    percentile25: 5,
    percentile50: 12,
    percentile75: 20,
    sampleSize: 16,
  },
  {
    projectType: 'shopping_center',
    region: 'west_africa',
    metric: 'schedule_overrun_rate',
    metricLabel: 'Taux moyen de dépassement délai',
    value: 15,
    unit: '%',
    percentile25: 8,
    percentile50: 15,
    percentile75: 25,
    sampleSize: 16,
  },
  {
    projectType: 'shopping_center',
    region: 'west_africa',
    metric: 'rent_per_sqm_month',
    metricLabel: 'Loyer moyen au m²/mois',
    value: 15000,
    unit: 'FCFA/m²/mois',
    percentile25: 12000,
    percentile50: 15000,
    percentile75: 20000,
    sampleSize: 25,
  },
  {
    projectType: 'shopping_center',
    region: 'west_africa',
    metric: 'anchor_rent_discount',
    metricLabel: 'Remise loyer locataire ancre',
    value: 30,
    unit: '%',
    percentile25: 20,
    percentile50: 30,
    percentile75: 40,
    sampleSize: 10,
  },
  {
    projectType: 'shopping_center',
    region: 'west_africa',
    metric: 'pre_opening_marketing_budget',
    metricLabel: 'Budget marketing pré-ouverture (% budget total)',
    value: 2.5,
    unit: '%',
    percentile25: 1.5,
    percentile50: 2.5,
    percentile75: 4,
    sampleSize: 12,
  },
];

// ============================================================================
// SCÉNARIOS PRÉ-CONSTRUITS
// ============================================================================

export const PREBUILT_SCENARIOS = [
  {
    id: 'tenant_delay',
    name: 'Retard signature bail ancre',
    description: 'Le locataire ancre retarde sa signature de 2 mois',
    category: 'delay' as const,
    variables: [
      {
        module: 'commercialisation' as ProjectModule,
        parameter: 'anchor_lease_delay',
        parameterLabel: 'Délai signature ancre',
        baselineValue: 0,
        scenarioValue: 60,
        unit: 'jours',
        range: { min: 0, max: 180 },
      },
    ],
  },
  {
    id: 'budget_overrun_15',
    name: 'Dépassement budget mobilisation +15%',
    description: 'Les coûts de mobilisation dépassent le budget de 15%',
    category: 'cost' as const,
    variables: [
      {
        module: 'budget' as ProjectModule,
        parameter: 'mobilization_cost_multiplier',
        parameterLabel: 'Multiplicateur coût mobilisation',
        baselineValue: 1.0,
        scenarioValue: 1.15,
        unit: 'ratio',
        range: { min: 1.0, max: 1.5 },
      },
    ],
  },
  {
    id: 'technical_delay_3m',
    name: 'Retard livraison technique 3 mois',
    description: 'La livraison technique est retardée de 3 mois',
    category: 'delay' as const,
    variables: [
      {
        module: 'technique' as ProjectModule,
        parameter: 'handover_delay',
        parameterLabel: 'Retard livraison',
        baselineValue: 0,
        scenarioValue: 90,
        unit: 'jours',
        range: { min: 0, max: 180 },
      },
    ],
  },
  {
    id: 'occupancy_shortfall',
    name: 'Taux occupation 60% au lieu de 80%',
    description: 'L\'ouverture se fait avec un taux d\'occupation de 60% au lieu des 80% prévus',
    category: 'revenue' as const,
    variables: [
      {
        module: 'commercialisation' as ProjectModule,
        parameter: 'opening_occupancy_rate',
        parameterLabel: 'Taux occupation ouverture',
        baselineValue: 80,
        scenarioValue: 60,
        unit: '%',
        range: { min: 40, max: 100 },
      },
    ],
  },
  {
    id: 'anchor_withdrawal',
    name: 'Désistement locataire ancre',
    description: 'Le locataire ancre se retire du projet',
    category: 'revenue' as const,
    variables: [
      {
        module: 'commercialisation' as ProjectModule,
        parameter: 'anchor_signed',
        parameterLabel: 'Ancre signé',
        baselineValue: 1,
        scenarioValue: 0,
        unit: 'booléen',
        range: { min: 0, max: 1 },
      },
    ],
  },
  {
    id: 'construction_acceleration',
    name: 'Accélération construction (+20% ressources)',
    description: 'Injection de ressources pour accélérer la construction',
    category: 'operational' as const,
    variables: [
      {
        module: 'construction' as ProjectModule,
        parameter: 'resource_multiplier',
        parameterLabel: 'Multiplicateur ressources',
        baselineValue: 1.0,
        scenarioValue: 1.2,
        unit: 'ratio',
        range: { min: 1.0, max: 1.5 },
      },
      {
        module: 'budget' as ProjectModule,
        parameter: 'construction_cost_multiplier',
        parameterLabel: 'Multiplicateur coût construction',
        baselineValue: 1.0,
        scenarioValue: 1.1,
        unit: 'ratio',
        range: { min: 1.0, max: 1.3 },
      },
    ],
  },
  {
    id: 'combined_pessimistic',
    name: 'Scénario pessimiste combiné',
    description: 'Retard technique 2 mois + surcoût 10% + occupation 70%',
    category: 'custom' as const,
    variables: [
      {
        module: 'technique' as ProjectModule,
        parameter: 'handover_delay',
        parameterLabel: 'Retard livraison',
        baselineValue: 0,
        scenarioValue: 60,
        unit: 'jours',
        range: { min: 0, max: 180 },
      },
      {
        module: 'budget' as ProjectModule,
        parameter: 'total_cost_multiplier',
        parameterLabel: 'Multiplicateur coût total',
        baselineValue: 1.0,
        scenarioValue: 1.1,
        unit: 'ratio',
        range: { min: 1.0, max: 1.3 },
      },
      {
        module: 'commercialisation' as ProjectModule,
        parameter: 'opening_occupancy_rate',
        parameterLabel: 'Taux occupation ouverture',
        baselineValue: 80,
        scenarioValue: 70,
        unit: '%',
        range: { min: 40, max: 100 },
      },
    ],
  },
];

// ============================================================================
// CONFIGURATION MONTE CARLO
// ============================================================================

export const MONTE_CARLO_CONFIG = {
  defaultIterations: 1000,
  maxIterations: 10000,
  webWorkerThreshold: 500, // Utiliser Web Worker si > 500 itérations
  defaultDistribution: 'triangular' as const,
};

// ============================================================================
// CONFIGURATION MÉMOIRE
// ============================================================================

export const MEMORY_CONFIG = {
  // Clé localStorage
  storageKey: 'proph3t_project_memory',
  // Nombre max de snapshots conservés
  maxSnapshots: 90,
  // Intervalle entre snapshots automatiques (jours)
  snapshotInterval: 1,
  // Durée de rétention patterns (jours)
  patternRetentionDays: 365,
  // Seuil min d'occurrences pour considérer un pattern valide
  minPatternOccurrences: 3,
};

// ============================================================================
// LABELS ET TRADUCTIONS
// ============================================================================

export const MODULE_LABELS: Record<ProjectModule, string> = {
  budget: 'Budget',
  planning: 'Planning',
  commercialisation: 'Commercialisation',
  technique: 'Technique',
  rh: 'Ressources Humaines',
  marketing: 'Marketing',
  exploitation: 'Exploitation',
  construction: 'Construction',
};

export const METRIC_LABELS: Record<string, string> = {
  tauxEngagement: 'Taux d\'engagement budget',
  tauxRealisation: 'Taux de réalisation budget',
  avancementGlobal: 'Avancement global',
  tauxOccupation: 'Taux d\'occupation',
  ecartSync: 'Écart synchronisation',
  spi: 'Indice de performance délai (SPI)',
  cpi: 'Indice de performance coût (CPI)',
  joursRestants: 'Jours restants',
  actionsEnRetard: 'Actions en retard',
  risquesCritiques: 'Risques critiques',
};

export const SEVERITY_LABELS: Record<string, string> = {
  info: 'Information',
  warning: 'Attention',
  critical: 'Critique',
};

export const TREND_LABELS: Record<string, string> = {
  improving: 'En amélioration',
  stable: 'Stable',
  deteriorating: 'En dégradation',
};

// ============================================================================
// COULEURS UI
// ============================================================================

export const COLORS = {
  confidence: {
    low: '#ef4444',      // red-500
    medium: '#f97316',   // orange-500
    high: '#22c55e',     // green-500
    very_high: '#10b981', // emerald-500
  },
  severity: {
    info: '#3b82f6',     // blue-500
    warning: '#f59e0b',  // amber-500
    critical: '#dc2626', // red-600
  },
  impact: {
    low: '#22c55e',      // green-500
    medium: '#eab308',   // yellow-500
    high: '#f97316',     // orange-500
    critical: '#dc2626', // red-600
  },
  trend: {
    improving: '#22c55e', // green-500
    stable: '#6b7280',    // gray-500
    deteriorating: '#ef4444', // red-500
  },
  priority: {
    P0: '#dc2626', // red-600
    P1: '#f97316', // orange-500
    P2: '#eab308', // yellow-500
    P3: '#6b7280', // gray-500
  },
};

// ============================================================================
// NARRATIVES TEMPLATES
// ============================================================================

export const NARRATIVE_TEMPLATES = {
  healthScore: {
    excellent: 'Le projet est en excellente santé avec un score de {score}/100.',
    good: 'Le projet se porte bien avec un score de {score}/100, quelques points d\'attention.',
    warning: 'Vigilance requise : le score de santé est de {score}/100.',
    critical: 'Situation critique : le score de santé est tombé à {score}/100. Action immédiate requise.',
  },
  anomaly: {
    new: 'Nouvelle anomalie détectée : {metric} est à {value} (attendu : {min}-{max}).',
    persistent: 'Anomalie persistante depuis {days} jours : {metric} reste hors norme.',
    resolved: 'Anomalie résolue : {metric} est revenu dans la plage normale.',
  },
  prediction: {
    high_probability: 'Forte probabilité ({probability}%) : {title}.',
    medium_probability: 'Probabilité modérée ({probability}%) : {title}.',
    low_probability: 'Risque potentiel ({probability}%) : {title}.',
  },
  cascade: {
    impact: 'Impact cascade : {source} → {target} ({severity}).',
  },
};

// ============================================================================
// EXPORT INDEX
// ============================================================================

export {
  PROPH3T_VERSION as VERSION,
};
