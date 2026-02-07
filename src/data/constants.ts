// ============================================================================
// CONSTANTES PARTAGÉES - COSMOS ANGRÉ
// Directive CRMC Règle 1 : Les valeurs DEFAULT_* servent de fallback.
// Les valeurs effectives viennent de la DB via useParametreMetier / getParametreMetier.
// Les re-exports sans préfixe assurent la rétro-compatibilité.
// ============================================================================

import type { Priorite } from '@/types';

// Responsables selon le référentiel officiel
export const RESPONSABLES = {
  DGA: 'DGA',
  CENTER_MANAGER: 'Center Manager',
  FM: 'FM',
  COMMERCIAL_MGR: 'Commercial Mgr',
  SECURITY_MGR: 'Security Mgr',
  MARKETING_MGR: 'Marketing Mgr',
  IT: 'IT',
  FINANCE: 'Finance',
  JURIDIQUE: 'Juridique',
  RH: 'RH',
  TECHNIQUE: 'Technique',
  MANAGERS: 'Managers',
} as const;

export type ResponsableKey = keyof typeof RESPONSABLES;
export type ResponsableValue = (typeof RESPONSABLES)[ResponsableKey];

// Priorités disponibles
export const PRIORITES: Priorite[] = ['critique', 'haute', 'moyenne', 'basse'];

// Statuts des actions
export const ACTION_STATUSES = [
  'non_demarre',
  'en_cours',
  'termine',
  'en_retard',
  'bloque',
] as const;

// Axes stratégiques (spécifications v2.0)
export const AXES = {
  AXE1_RH: 'axe1_rh',
  AXE2_COMMERCIAL: 'axe2_commercial',
  AXE3_TECHNIQUE: 'axe3_technique',
  AXE4_BUDGET: 'axe4_budget',
  AXE5_MARKETING: 'axe5_marketing',
  AXE6_EXPLOITATION: 'axe6_exploitation',
  AXE7_CONSTRUCTION: 'axe7_construction',
  AXE8_DIVERS: 'axe8_divers',
} as const;

// Alias pour compatibilité avec ancien code
export const AXE6_GOUVERNANCE = AXES.AXE6_EXPLOITATION;

// Phases du projet
export const PHASES = {
  PREPARATION: 'preparation',
  MOBILISATION: 'mobilisation',
  LANCEMENT: 'lancement',
  EXPLOITATION: 'exploitation',
} as const;

// Codes bâtiments (spécifications v2.0)
export const BUILDING_CODES = {
  CC: 'CC',      // Centre Commercial (synchronisé avec Mobilisation)
  MKT: 'MKT',    // Market
  BB1: 'BB1',    // Big Box 1
  BB2: 'BB2',    // Big Box 2
  BB3: 'BB3',    // Big Box 3
  BB4: 'BB4',    // Big Box 4
} as const;

// Codes bâtiments legacy pour compatibilité
export const LEGACY_BUILDING_CODES = {
  ZE: 'ZE',      // Zone Expo (legacy)
  MA: 'MA',      // Marché Artisanal (legacy)
  PK: 'PK',      // Parking (legacy)
} as const;

// ============================================================================
// SEUILS DE SYNCHRONISATION CONSTRUCTION → MOBILISATION (v2.0)
// Seul le Centre Commercial (CC) déclenche la synchronisation
// ============================================================================
export const SEUILS_SYNC = [
  // Gros œuvre CC
  { phaseCode: 'GO', seuil: 75, axeCible: 'RH', actionCode: 'J-RH-2', description: 'Lancer Recrutement Vague 1' },
  { phaseCode: 'GO', seuil: 100, axeCible: 'RH', actionCode: 'J-RH-3-PREP', description: 'Préparer Vague 2' },
  { phaseCode: 'GO', seuil: 100, axeCible: 'COM', actionCode: 'J-COM-2', description: 'Accélérer signatures BEFA' },

  // Second œuvre CC
  { phaseCode: 'SO', seuil: 50, axeCible: 'RH', actionCode: 'J-RH-3', description: 'Lancer Vague 2' },
  { phaseCode: 'SO', seuil: 50, axeCible: 'TECH', actionCode: 'J-TECH-2', description: 'Émettre CDC techniques' },
  { phaseCode: 'SO', seuil: 75, axeCible: 'EXP', actionCode: 'J-EXP-1-AO', description: 'Lancer AO prestataires' },
  { phaseCode: 'SO', seuil: 75, axeCible: 'MKT', actionCode: 'J-MKT-2', description: 'Finaliser identité marque' },

  // Lots techniques CC
  { phaseCode: 'LT', seuil: 50, axeCible: 'TECH', actionCode: 'J-TECH-3-PLAN', description: 'Planifier formation MEP' },
  { phaseCode: 'LT', seuil: 75, axeCible: 'EXP', actionCode: 'J-EXP-2-INSTALL', description: 'Préparer installation IT' },
  { phaseCode: 'LT', seuil: 100, axeCible: 'BUD', actionCode: 'J-BUD-3', description: 'Revue budgétaire S1' },

  // Pré-réception CC
  { phaseCode: 'PR', seuil: 50, axeCible: 'MKT', actionCode: 'J-MKT-3-EVENT', description: 'Préparer Soft Opening' },
  { phaseCode: 'PR', seuil: 75, axeCible: 'RH', actionCode: 'J-RH-4', description: 'Formations initiales' },
  { phaseCode: 'PR', seuil: 100, axeCible: 'TECH', actionCode: 'J-TECH-4', description: 'Réception provisoire CC' },

  // Réception Provisoire CC
  { phaseCode: 'RP', seuil: 100, axeCible: 'COM', actionCode: 'J-COM-7', description: 'Coordonner ouvertures boutiques' },
  { phaseCode: 'RP', seuil: 100, axeCible: 'RH', actionCode: 'J-RH-5', description: 'Équipe opérationnelle' },
  { phaseCode: 'RP', seuil: 100, axeCible: 'EXP', actionCode: 'J-EXP-4', description: 'Tests opérationnels' },
] as const;

// Statuts de jalon selon v2.0
export const STATUTS_JALON = ['A_VENIR', 'EN_COURS', 'A_VALIDER', 'ATTEINT', 'EN_RETARD'] as const;

// Statuts d'action selon v2.0
export const STATUTS_ACTION = ['A_FAIRE', 'EN_COURS', 'FAIT', 'BLOQUE'] as const;

// Météos jalon selon v2.0
export const METEOS = ['SOLEIL', 'NUAGEUX', 'ORAGEUX'] as const;

// Priorités v2.0
export const PRIORITES_V2 = ['HAUTE', 'MOYENNE', 'BASSE'] as const;

// ============================================================================
// CONFIGURATION PROJET - COSMOS ANGRÉ (DEFAULT)
// ============================================================================

export const DEFAULT_PROJET_CONFIG = {
  projectId: 'cosmos-angre',
  nom: 'COSMOS ANGRÉ',
  societe: 'CRMC / New Heaven SA',
  surface: {
    gla: 16_184,
    shon: 45_000,
  },
  nombreBatiments: 6,
  occupationCible: 85,
  dateDebut: '2026-01-01',
  dateFin: '2027-02-28',
  jalonsClés: {
    softOpening: '2026-11-15',
    inauguration: '2026-12-15',
    finStabilisation: '2027-02-28',
  },
  phases: [
    { code: 'PREPARATION', label: 'Phase 1: Préparation', dateDebut: '2026-01-01', dateFin: '2026-03-31' },
    { code: 'MOBILISATION', label: 'Phase 2: Mobilisation', dateDebut: '2026-04-01', dateFin: '2026-09-30' },
    { code: 'LANCEMENT', label: 'Phase 3: Lancement', dateDebut: '2026-10-01', dateFin: '2026-11-30' },
    { code: 'STABILISATION', label: 'Phase 4: Stabilisation', dateDebut: '2026-12-01', dateFin: '2027-02-28' },
  ],
  presentateur: {
    nom: 'Pamela Atokouna',
    titre: 'DGA',
  },
  destinataires: ['PDG', 'Actionnaires'],
  devise: 'FCFA',
  baseUrl: 'https://cockpit.cosmos-angre.com',
  confidentialite: 'Confidentiel — Exco',
  emailExpediteur: {
    email: 'patokouna@cosmos-angre.com',
    nom: 'Cockpit-Cosmos Angré',
  },
  seuilSoftOpening: 45,
  softOpeningOffsetJours: 30,
  coutsReportMensuels: {
    portage: 35_000_000,
    revenuSoftOpening: 25_000_000,
    rh: 15_000_000,
    technique: 20_000_000,
    construction: 40_000_000,
    marketing: 8_000_000,
    exploitation: 12_000_000,
    divers: 5_000_000,
  },
  horizonsReport: [1, 2, 3, 6] as const,
  defaultLinkDuration: 72,
} as const;

/** @deprecated Utiliser useParametreMetier('projet_config') ou getParametreMetier('projet_config') */
export const PROJET_CONFIG = DEFAULT_PROJET_CONFIG;

// ============================================================================
// SEUILS DE PERFORMANCE - CALCUL MÉTÉO AUTOMATIQUE (DEFAULT)
// ============================================================================

export const SEUILS_METEO = {
  excellent: { completion: 0.95, actionsEnRetardMax: 0 },
  bon: { completion: 0.85, actionsEnRetardMax: 1 },
  attention: { completion: 0.70, actionsEnRetardMax: 3 },
  alerte: { completion: 0.50, actionsEnRetardMax: 5 },
} as const;

// ============================================================================
// SEUILS D'AFFICHAGE - UI (DEFAULT)
// ============================================================================

export const DEFAULT_SEUILS_UI = {
  compteARebours: {
    critique: 30,
    attention: 90,
  },
  jalonsAVenir: 30,
  topRisques: 5,
  topActions: 10,
  topJalons: 5,
} as const;

/** @deprecated Utiliser useParametreMetier('seuils_ui') */
export const SEUILS_UI = DEFAULT_SEUILS_UI;

// ============================================================================
// CONFIGURATION AXES - POIDS ET COULEURS (DEFAULT)
// ============================================================================

export const DEFAULT_AXES_CONFIG_FULL = {
  rh: {
    code: 'axe1_rh',
    label: 'RH & Organisation',
    labelCourt: 'RH',
    color: '#EF4444',
    numero: 1,
    poids: 20
  },
  commercialisation: {
    code: 'axe2_commercial',
    label: 'Commercial & Leasing',
    labelCourt: 'COM',
    color: '#3B82F6',
    numero: 2,
    poids: 25
  },
  technique: {
    code: 'axe3_technique',
    label: 'Technique & Handover',
    labelCourt: 'TECH',
    color: '#8B5CF6',
    numero: 3,
    poids: 20
  },
  budget: {
    code: 'axe4_budget',
    label: 'Budget & Pilotage',
    labelCourt: 'BUD',
    color: '#F59E0B',
    numero: 4,
    poids: 15
  },
  marketing: {
    code: 'axe5_marketing',
    label: 'Marketing & Communication',
    labelCourt: 'MKT',
    color: '#EC4899',
    numero: 5,
    poids: 15
  },
  exploitation: {
    code: 'axe6_exploitation',
    label: 'Exploitation & Systèmes',
    labelCourt: 'EXP',
    color: '#10B981',
    numero: 6,
    poids: 5
  },
  divers: {
    code: 'axe8_divers',
    label: 'Divers & Transverse',
    labelCourt: 'DIV',
    color: '#6B7280',
    numero: 8,
    poids: 0
  },
} as const;

/** @deprecated Utiliser useParametreMetier('axes_config') */
export const AXES_CONFIG_FULL = DEFAULT_AXES_CONFIG_FULL;

// ============================================================================
// CONFIGURATION MÉTÉO - STYLES PARTAGÉS (DEFAULT)
// ============================================================================

export const DEFAULT_METEO_STYLES = {
  SOLEIL: {
    label: 'Soleil',
    emoji: '☀️',
    bgColor: 'bg-gradient-to-br from-green-50 to-emerald-100',
    borderColor: 'border-green-200',
    iconColor: 'text-amber-500',
    textColor: 'text-green-700',
    glowClass: 'hover:glow-success',
    progressColor: 'bg-green-500',
    color: 'text-green-500',
  },
  NUAGEUX: {
    label: 'Nuageux',
    emoji: '🌤️',
    bgColor: 'bg-gradient-to-br from-amber-50 to-orange-100',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-600',
    textColor: 'text-amber-700',
    glowClass: 'hover:glow-warning',
    progressColor: 'bg-amber-500',
    color: 'text-amber-500',
  },
  ORAGEUX: {
    label: 'Orageux',
    emoji: '⛈️',
    bgColor: 'bg-gradient-to-br from-red-50 to-rose-100',
    borderColor: 'border-red-200',
    iconColor: 'text-red-500',
    textColor: 'text-red-700',
    glowClass: 'hover:glow-error',
    progressColor: 'bg-red-500',
    color: 'text-red-500',
  },
} as const;

/** @deprecated Utiliser useParametreMetier('meteo_styles') */
export const METEO_STYLES = DEFAULT_METEO_STYLES;

export type MeteoType = keyof typeof METEO_STYLES;

// ============================================================================
// COULEURS THÈME PROJET
// ============================================================================

export const THEME_COLORS = {
  primary: '#1C3163',    // Bleu Cosmos
  secondary: '#D4AF37',  // Or
  accent: '#10B981',     // Vert succès
  danger: '#DC2626',     // Rouge erreur
  warning: '#F59E0B',    // Orange attention
  info: '#3B82F6',       // Bleu info
} as const;

// ============================================================================
// SEUILS DE RISQUES (DEFAULT)
// ============================================================================

export const DEFAULT_SEUILS_RISQUES = {
  critique: 12,
  majeur: 8,
  modere: 4,
} as const;

/** @deprecated Utiliser useParametreMetier('seuils_risques') */
export const SEUILS_RISQUES = DEFAULT_SEUILS_RISQUES;

// ============================================================================
// SEUILS CHEMIN CRITIQUE (DEFAULT)
// ============================================================================

export const DEFAULT_SEUILS_CHEMIN_CRITIQUE = {
  margeCritique: 30,
  margeFaible: 7,
  seuilGoulot: 3,
  topActions: 20,
} as const;

/** @deprecated Utiliser useParametreMetier('seuils_chemin_critique') */
export const SEUILS_CHEMIN_CRITIQUE = DEFAULT_SEUILS_CHEMIN_CRITIQUE;

// ============================================================================
// SEUILS MÉTÉO RAPPORT V5 (DEFAULT)
// ============================================================================

export const DEFAULT_SEUILS_METEO_REPORT = {
  axeRouge: { risquesCritiques: 2, ecart: -20 },
  axeOrange: { risquesCritiques: 1, ecart: -10 },
  axeBleu: { ecart: 5 },
  globalRouge: 40,
  globalOrange: 65,
  globalBleu: 85,
  scoreAlerte: 60,
} as const;

/** @deprecated Utiliser useParametreMetier('seuils_meteo_report') */
export const SEUILS_METEO_REPORT = DEFAULT_SEUILS_METEO_REPORT;

// ============================================================================
// SEUILS SANTÉ AXE (DEFAULT)
// ============================================================================

export const DEFAULT_SEUILS_SANTE_AXE = {
  poids: { avancement: 40, actions: 30, risques: 30 },
  penalites: { actionEnRetard: 5, actionBloquee: 10, risqueCritique: 10 },
  meteo: {
    pluie: { score: 40, actionsEnRetard: 5, risquesCritiques: 3 },
    nuage: { score: 60, actionsEnRetard: 3, risquesCritiques: 2 },
    soleilNuage: { score: 80, actionsEnRetard: 1, risquesCritiques: 1 },
  },
  velocite: { up: 100, stable: 80 },
  jalons: { enDanger: 7, enApproche: 30 },
  recommandations: {
    actionsEnRetardCritique: 5,
    completionFaible: 0.8,
    jalonsProches: 14,
    risquesSansPlanMax: 3,
    ecartCritique: -20,
    ecartAttention: -10,
    activiteRecente: { jours: 7, actionsMin: 3 },
  },
} as const;

/** @deprecated Utiliser useParametreMetier('seuils_sante_axe') */
export const SEUILS_SANTE_AXE = DEFAULT_SEUILS_SANTE_AXE;

// ============================================================================
// SEUILS SYNCHRONISATION RAPPORT (DEFAULT)
// ============================================================================

export const DEFAULT_SEUILS_SYNC_REPORT = {
  synchronise: 5,
  attention: 15,
  joursConversion: 1.5,
  desyncAlerte: 5,
} as const;

/** @deprecated Utiliser useParametreMetier('seuils_sync_report') */
export const SEUILS_SYNC_REPORT = DEFAULT_SEUILS_SYNC_REPORT;

// ============================================================================
// SEUILS KPI DASHBOARD REPORT (DEFAULT)
// ============================================================================

export const DEFAULT_SEUILS_KPI_REPORT = {
  jalonsPct: 50,
  actionsPct: 30,
  goodRatio: 0.9,
  medRatio: 0.5,
  deviationGood: 5,
  deviationBad: 15,
  occupationBon: 75,
  occupationAttention: 50,
  jalonsBonRatio: 0.8,
  jalonsAttentionRatio: 0.5,
  actionsBonRatio: 0.7,
  actionsAttentionRatio: 0.4,
  globalExcellent: 4.5,
  globalBon: 3.5,
  globalAttention: 2.5,
  globalAlerte: 1.5,
} as const;

/** @deprecated Utiliser useParametreMetier('seuils_kpi_report') */
export const SEUILS_KPI_REPORT = DEFAULT_SEUILS_KPI_REPORT;

// ============================================================================
// SEUILS MÉTÉO DASHBOARD (DEFAULT)
// ============================================================================

export const DEFAULT_SEUILS_METEO_DASHBOARD = {
  rouge: { alertesCritiques: 3, actionsEnRetard: 5, risquesCritiques: 2, depassementsBudget: 2 },
  jaune: { alertesCritiques: 1, alertesHautes: 3, actionsEnRetard: 2, risquesCritiques: 1, depassementsBudget: 1 },
} as const;

/** @deprecated Utiliser useParametreMetier('seuils_meteo_dashboard') */
export const SEUILS_METEO_DASHBOARD = DEFAULT_SEUILS_METEO_DASHBOARD;

// ============================================================================
// PÉNALITÉS SCORE DE CONFIANCE (DEFAULT)
// ============================================================================

export const DEFAULT_SEUILS_CONFIDENCE = {
  penaliteRisqueCritique: 20,
  penaliteRisqueMajeur: 10,
} as const;

/** @deprecated Utiliser useParametreMetier('seuils_confidence') */
export const SEUILS_CONFIDENCE = DEFAULT_SEUILS_CONFIDENCE;

// ============================================================================
// SEUILS MÉTÉO COPIL (DEFAULT)
// ============================================================================

export const DEFAULT_SEUILS_METEO_COPIL = {
  stormy: { risquesCritiques: 2, jalonsEnDanger: 3 },
  rainy: { risquesCritiques: 0, jalonsEnDanger: 1 },
  sunny: { avancement: 70 },
  cloudy: { avancement: 40 },
} as const;

/** @deprecated Utiliser useParametreMetier('seuils_meteo_copil') */
export const SEUILS_METEO_COPIL = DEFAULT_SEUILS_METEO_COPIL;

// ============================================================================
// SEUILS MÉTÉO AXE DASHBOARD (DEFAULT)
// ============================================================================

export const DEFAULT_SEUILS_METEO_AXE_DASHBOARD = {
  soleil: -5,
  nuageux: -15,
} as const;

/** @deprecated Utiliser useParametreMetier('seuils_meteo_axe_dashboard') */
export const SEUILS_METEO_AXE_DASHBOARD = DEFAULT_SEUILS_METEO_AXE_DASHBOARD;
