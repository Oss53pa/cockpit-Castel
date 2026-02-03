// ============================================================================
// EXPORT TYPES BUDGET (fichier séparé pour meilleure organisation)
// ============================================================================
export * from './budget.types';

// ============================================================================
// DESIGN SYSTEM - COULEURS & STYLES
// ============================================================================

export const COLORS = {
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  severity: {
    low: '#22c55e',
    medium: '#facc15',
    high: '#f97316',
    critical: '#ef4444',
  },
} as const;

// ============================================================================
// ENUMS COMMUNS
// ============================================================================

export const AXES = [
  'axe1_rh',
  'axe2_commercial',
  'axe3_technique',
  'axe4_budget',
  'axe5_marketing',
  'axe6_exploitation',
  'axe7_construction',
  'axe8_divers',
] as const;
export type Axe = (typeof AXES)[number];

export const AXE_LABELS: Record<Axe, string> = {
  axe1_rh: 'AXE 1 - RH & Organisation',
  axe2_commercial: 'AXE 2 - Commercial & Leasing',
  axe3_technique: 'AXE 3 - Technique & Handover',
  axe4_budget: 'AXE 4 - Budget & Pilotage',
  axe5_marketing: 'AXE 5 - Marketing & Communication',
  axe6_exploitation: 'AXE 6 - Exploitation & Systèmes',
  axe7_construction: 'AXE 7 - Construction',
  axe8_divers: 'AXE 8 - Divers & Transverse',
};

export const AXE_SHORT_LABELS: Record<Axe, string> = {
  axe1_rh: 'RH & Organisation',
  axe2_commercial: 'Commercial & Leasing',
  axe3_technique: 'Technique & Handover',
  axe4_budget: 'Budget & Pilotage',
  axe5_marketing: 'Marketing & Comm.',
  axe6_exploitation: 'Exploitation & Systèmes',
  axe7_construction: 'Construction',
  axe8_divers: 'Divers & Transverse',
};

// Configuration complète des axes selon spécifications v2.0
// syncCC = true : l'axe se synchronise avec la progression du Centre Commercial
// Poids total = 100% (axe7_construction est le maître de la synchronisation)
export const AXE_CONFIG: Record<Axe, { code: string; poids: number; couleur: string; icone: string; syncCC: boolean }> = {
  axe1_rh: { code: 'RH', poids: 15, couleur: '#3B82F6', icone: 'Users', syncCC: true },
  axe2_commercial: { code: 'COM', poids: 20, couleur: '#10B981', icone: 'Store', syncCC: true },
  axe3_technique: { code: 'TECH', poids: 15, couleur: '#F59E0B', icone: 'Wrench', syncCC: true },
  axe4_budget: { code: 'BUD', poids: 10, couleur: '#8B5CF6', icone: 'Calculator', syncCC: true },
  axe5_marketing: { code: 'MKT', poids: 10, couleur: '#EC4899', icone: 'Megaphone', syncCC: true },
  axe6_exploitation: { code: 'EXP', poids: 5, couleur: '#6366F1', icone: 'Settings', syncCC: true },
  axe7_construction: { code: 'CON', poids: 25, couleur: '#EF4444', icone: 'Building', syncCC: false },
  axe8_divers: { code: 'DIV', poids: 0, couleur: '#6B7280', icone: 'MoreHorizontal', syncCC: false },
};

// Phases de construction (Centre Commercial uniquement)
export const PHASES_CONSTRUCTION = [
  { code: 'GO', nom: 'Gros œuvre', ordre: 1 },
  { code: 'SO', nom: 'Second œuvre', ordre: 2 },
  { code: 'LT', nom: 'Lots techniques', ordre: 3 },
  { code: 'AE', nom: 'Aménagement externe', ordre: 4 },
  { code: 'PR', nom: 'Pré-réception', ordre: 5 },
  { code: 'RP', nom: 'Réception Provisoire', ordre: 6 },
  { code: 'RD', nom: 'Réception Définitive', ordre: 7 },
] as const;
export type PhaseConstructionCode = typeof PHASES_CONSTRUCTION[number]['code'];

export const PHASES = [
  'initiation',
  'planification',
  'execution',
  'controle',
  'cloture',
] as const;
export type Phase = (typeof PHASES)[number];

export const PHASE_LABELS: Record<Phase, string> = {
  initiation: 'Initiation',
  planification: 'Planification',
  execution: 'Exécution',
  controle: 'Contrôle',
  cloture: 'Clôture',
};

// ============================================================================
// PHASES PROJET COSMOS ANGRÉ (V2.0)
// ============================================================================
export const PROJECT_PHASES = [
  'phase1_preparation',
  'phase2_mobilisation',
  'phase3_lancement',
  'phase4_stabilisation',
] as const;
export type ProjectPhase = (typeof PROJECT_PHASES)[number];

export const PROJECT_PHASE_LABELS: Record<ProjectPhase, string> = {
  phase1_preparation: 'Phase 1 - Préparation',
  phase2_mobilisation: 'Phase 2 - Mobilisation',
  phase3_lancement: 'Phase 3 - Lancement',
  phase4_stabilisation: 'Phase 4 - Stabilisation',
};

export const PROJECT_PHASE_COLORS: Record<ProjectPhase, string> = {
  phase1_preparation: '#6366F1',   // Indigo
  phase2_mobilisation: '#F59E0B',  // Amber
  phase3_lancement: '#10B981',     // Emerald
  phase4_stabilisation: '#3B82F6', // Blue
};

export const PROJECT_PHASE_DATES: Record<ProjectPhase, { debut: string; fin: string }> = {
  phase1_preparation: { debut: '2025-10-01', fin: '2026-03-31' },
  phase2_mobilisation: { debut: '2026-01-01', fin: '2026-09-30' },
  phase3_lancement: { debut: '2026-10-01', fin: '2026-12-31' },
  phase4_stabilisation: { debut: '2026-10-01', fin: '2027-03-31' },
};

// ============================================================================
// RÉFÉRENCES DE PHASE PROJET (pour calcul automatique des échéances)
// ============================================================================
export const PHASE_REFERENCES = [
  'dateDebutConstruction',
  'dateDebutMobilisation',
  'dateSoftOpening',
  'dateFinMobilisation',
] as const;
export type PhaseReference = (typeof PHASE_REFERENCES)[number];

export const PHASE_REFERENCE_LABELS: Record<PhaseReference, string> = {
  dateDebutConstruction: 'Début de construction',
  dateDebutMobilisation: 'Début de la mobilisation',
  dateSoftOpening: 'Soft Opening',
  dateFinMobilisation: 'Fin du projet',
};

/** Nom de la période/phase à laquelle appartient le jalon de référence */
export const PHASE_PERIOD_LABELS: Record<PhaseReference, string> = {
  dateDebutConstruction: 'Construction',
  dateDebutMobilisation: 'Mobilisation',
  dateSoftOpening: 'Pré-ouverture',
  dateFinMobilisation: 'Clôture',
};

export const UNITES_TEMPS = ['jours', 'semaines', 'mois'] as const;
export type UniteTemps = (typeof UNITES_TEMPS)[number];

export const UNITE_TEMPS_LABELS: Record<UniteTemps, string> = {
  jours: 'Jours',
  semaines: 'Semaines',
  mois: 'Mois',
};

// ============================================================================
// ACTION - ENUMS
// ============================================================================

export const ACTION_CATEGORIES = [
  'strategie',
  'recrutement',
  'formation',
  'negociation',
  'technique',
  'administratif',
  'juridique',
  'finance',
  'communication',
  'qualite',
  'coordination',
] as const;
export type ActionCategory = (typeof ACTION_CATEGORIES)[number];

export const ACTION_CATEGORY_LABELS: Record<ActionCategory, string> = {
  strategie: 'Stratégie',
  recrutement: 'Recrutement',
  formation: 'Formation',
  negociation: 'Négociation',
  technique: 'Technique',
  administratif: 'Administratif',
  juridique: 'Juridique',
  finance: 'Finance',
  communication: 'Communication',
  qualite: 'Qualité',
  coordination: 'Coordination',
};

export const ACTION_TYPES = [
  'tache',
  'jalon',
  'decision',
  'livrable',
  'reunion',
  'validation',
  'controle',
] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  tache: 'Tâche',
  jalon: 'Jalon',
  decision: 'Décision',
  livrable: 'Livrable',
  reunion: 'Réunion',
  validation: 'Validation',
  controle: 'Contrôle',
};

export const ACTION_STATUSES = [
  'a_planifier',
  'planifie',
  'a_faire',
  'en_cours',
  'en_attente',
  'bloque',
  'en_validation',
  'termine',
  'annule',
  'reporte',
] as const;
export type ActionStatus = (typeof ACTION_STATUSES)[number];

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  a_planifier: 'À planifier',
  planifie: 'Planifié',
  a_faire: 'À faire',
  en_cours: 'En cours',
  en_attente: 'En attente',
  bloque: 'Bloqué',
  en_validation: 'En validation',
  termine: 'Terminé',
  annule: 'Annulé',
  reporte: 'Reporté',
};

export const ACTION_SANTE = [
  'vert',
  'jaune',
  'orange',
  'rouge',
  'gris',
  'bleu',
] as const;
export type ActionSante = (typeof ACTION_SANTE)[number];

export const ACTION_SANTE_LABELS: Record<ActionSante, string> = {
  vert: '🟢 Vert - Dans les temps',
  jaune: '🟡 Jaune - Risque de retard',
  orange: '🟠 Orange - Retard confirmé',
  rouge: '🔴 Rouge - Critique/Bloqué',
  gris: '⚪ Gris - Non démarré',
  bleu: '🔵 Bleu - En attente externe',
};

export const PRIORITES = ['critique', 'haute', 'moyenne', 'basse'] as const;
export const PRIORITIES = PRIORITES; // Alias for backward compatibility
export type Priorite = (typeof PRIORITES)[number];
export type Priority = Priorite; // Alias for backward compatibility

export const PRIORITE_LABELS: Record<Priorite, string> = {
  critique: 'Critique',
  haute: 'Haute',
  moyenne: 'Moyenne',
  basse: 'Basse',
};
export const PRIORITY_LABELS = PRIORITE_LABELS; // Alias for backward compatibility
export const ACTION_PRIORITY_LABELS = PRIORITE_LABELS; // Alias for actions module

export const TENDANCES = ['amelioration', 'stable', 'degradation'] as const;
export type Tendance = (typeof TENDANCES)[number];

export const TENDANCE_LABELS: Record<Tendance, string> = {
  amelioration: '↑ Amélioration',
  stable: '→ Stable',
  degradation: '↓ Dégradation',
};

export const FLEXIBILITES = ['aucune', 'faible', 'moyenne', 'forte'] as const;
export const FLEXIBILITE_OPTIONS = FLEXIBILITES; // Alias
export type Flexibilite = (typeof FLEXIBILITES)[number];

export const FLEXIBILITE_LABELS: Record<Flexibilite, string> = {
  aucune: 'Aucune (date fixe)',
  faible: 'Faible (< 1 semaine)',
  moyenne: 'Moyenne (1-2 semaines)',
  forte: 'Forte (> 2 semaines)',
};

export const METHODES_AVANCEMENT = [
  'manuel',
  'jalons_ponderes',
  'effort_realise',
  '0_50_100',
  'formule',
] as const;
export type MethodeAvancement = (typeof METHODES_AVANCEMENT)[number];

export const METHODE_AVANCEMENT_LABELS: Record<MethodeAvancement, string> = {
  manuel: 'Manuel',
  jalons_ponderes: 'Jalons pondérés',
  effort_realise: 'Effort réalisé',
  '0_50_100': '0/50/100',
  formule: 'Formule',
};

export const VISIBILITES_REPORTING = [
  'flash_hebdo',
  'copil',
  'comite_direction',
  'tous_niveaux',
  'interne_equipe',
] as const;
export type VisibiliteReporting = (typeof VISIBILITES_REPORTING)[number];

export const VISIBILITE_REPORTING_LABELS: Record<VisibiliteReporting, string> = {
  flash_hebdo: 'Flash hebdo',
  copil: 'COPIL',
  comite_direction: 'Comité Direction',
  tous_niveaux: 'Tous niveaux',
  interne_equipe: 'Interne équipe',
};

export const TYPES_LIEN = ['FS', 'FF', 'SS', 'SF'] as const;
export type TypeLien = (typeof TYPES_LIEN)[number];

export const TYPE_LIEN_LABELS: Record<TypeLien, string> = {
  FS: 'Fin-Début',
  FF: 'Fin-Fin',
  SS: 'Début-Début',
  SF: 'Début-Fin',
};

export const NIVEAUX_IMPACT = [
  'aucun',
  'faible',
  'modere',
  'significatif',
  'majeur',
  'critique',
] as const;
export const IMPACT_RETARD_OPTIONS = NIVEAUX_IMPACT; // Alias
export type NiveauImpact = (typeof NIVEAUX_IMPACT)[number];

export const NIVEAU_IMPACT_LABELS: Record<NiveauImpact, string> = {
  aucun: 'Aucun',
  faible: 'Faible',
  modere: 'Modéré',
  significatif: 'Significatif',
  majeur: 'Majeur',
  critique: 'Critique',
};
export const IMPACT_RETARD_LABELS = NIVEAU_IMPACT_LABELS; // Alias
export const IMPACT_QUALITE_LEVELS = NIVEAUX_IMPACT; // Alias
export const IMPACT_QUALITE_LABELS = NIVEAU_IMPACT_LABELS; // Alias
export const IMPACT_REPUTATION_LEVELS = NIVEAUX_IMPACT; // Alias
export const IMPACT_REPUTATION_LABELS = NIVEAU_IMPACT_LABELS; // Alias
export const IMPACT_SECURITE_LEVELS = NIVEAUX_IMPACT; // Alias
export const IMPACT_SECURITE_LABELS = NIVEAU_IMPACT_LABELS; // Alias

export const TYPES_DOCUMENT = [
  'contrat',
  'cr',
  'plan',
  'rapport',
  'annexe',
  'autre',
] as const;
export type TypeDocument = (typeof TYPES_DOCUMENT)[number];

export const TYPE_DOCUMENT_LABELS: Record<TypeDocument, string> = {
  contrat: 'Contrat',
  cr: 'CR',
  plan: 'Plan',
  rapport: 'Rapport',
  annexe: 'Annexe',
  autre: 'Autre',
};

export const STATUTS_LIVRABLE = [
  'en_attente',
  'en_cours',
  'valide',
  'rejete',
] as const;
export type StatutLivrable = (typeof STATUTS_LIVRABLE)[number];

export const STATUT_LIVRABLE_LABELS: Record<StatutLivrable, string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  valide: 'Validé',
  rejete: 'Rejeté',
};

// ============================================================================
// JALON - ENUMS
// ============================================================================

export const JALON_STATUSES = [
  'a_venir',
  'en_approche',
  'en_danger',
  'atteint',
  'depasse',
  'annule',
] as const;
export type JalonStatus = (typeof JALON_STATUSES)[number];

export const JALON_STATUS_LABELS: Record<JalonStatus, string> = {
  a_venir: 'À venir',
  en_approche: 'En approche',
  en_danger: 'En danger',
  atteint: 'Atteint',
  depasse: 'Dépassé',
  annule: 'Annulé',
};

export const JALON_STATUS_STYLES: Record<JalonStatus, { bg: string; text: string; border: string; icon: string }> = {
  a_venir: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', icon: 'Clock' },
  en_approche: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', icon: 'TrendingUp' },
  en_danger: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', icon: 'AlertTriangle' },
  atteint: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', icon: 'CheckCircle' },
  depasse: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', icon: 'AlertCircle' },
  annule: { bg: 'bg-neutral-100', text: 'text-neutral-500', border: 'border-neutral-300', icon: 'X' },
};

export const JALON_CATEGORIES = [
  'contrat',
  'reception',
  'validation',
  'livraison',
  'inauguration',
  'recrutement',
  'formation',
  'audit',
  'autre',
] as const;
export type JalonCategory = (typeof JALON_CATEGORIES)[number];

export const JALON_CATEGORY_LABELS: Record<JalonCategory, string> = {
  contrat: 'Contrat',
  reception: 'Réception',
  validation: 'Validation',
  livraison: 'Livraison',
  inauguration: 'Inauguration',
  recrutement: 'Recrutement',
  formation: 'Formation',
  audit: 'Audit',
  autre: 'Autre',
};

export const JALON_TYPES = [
  'contractuel',
  'reglementaire',
  'technique',
  'managerial',
  'client',
  'interne',
] as const;
export type JalonType = (typeof JALON_TYPES)[number];

export const JALON_TYPE_LABELS: Record<JalonType, string> = {
  contractuel: 'Contractuel',
  reglementaire: 'Réglementaire',
  technique: 'Technique',
  managerial: 'Managérial',
  client: 'Client',
  interne: 'Interne',
};

export const NIVEAUX_IMPORTANCE = [
  'critique',
  'majeur',
  'standard',
  'mineur',
] as const;
export const JALON_IMPORTANCE = NIVEAUX_IMPORTANCE; // Alias
export type NiveauImportance = (typeof NIVEAUX_IMPORTANCE)[number];

export const NIVEAU_IMPORTANCE_LABELS: Record<NiveauImportance, string> = {
  critique: 'Critique',
  majeur: 'Majeur',
  standard: 'Standard',
  mineur: 'Mineur',
};
export const JALON_IMPORTANCE_LABELS = NIVEAU_IMPORTANCE_LABELS; // Alias

export const NIVEAU_IMPORTANCE_STYLES: Record<NiveauImportance, { bg: string; text: string }> = {
  critique: { bg: 'bg-red-500', text: 'text-white' },
  majeur: { bg: 'bg-orange-500', text: 'text-white' },
  standard: { bg: 'bg-blue-500', text: 'text-white' },
  mineur: { bg: 'bg-neutral-500', text: 'text-white' },
};

export const CANAUX_ALERTE = ['email', 'sms', 'app', 'teams'] as const;
export type CanalAlerte = (typeof CANAUX_ALERTE)[number];

export const CANAL_ALERTE_LABELS: Record<CanalAlerte, string> = {
  email: 'Email',
  sms: 'SMS',
  app: 'App',
  teams: 'Teams',
};

export const FREQUENCES_RAPPEL = [
  'une_seule_fois',
  'quotidien',
  'hebdomadaire',
] as const;
export const FREQUENCE_RAPPEL = FREQUENCES_RAPPEL; // Alias
export type FrequenceRappel = (typeof FREQUENCES_RAPPEL)[number];

export const FREQUENCE_RAPPEL_LABELS: Record<FrequenceRappel, string> = {
  une_seule_fois: 'Une seule fois',
  quotidien: 'Quotidien',
  hebdomadaire: 'Hebdomadaire',
};

// ============================================================================
// RISQUE - ENUMS
// ============================================================================

export const RISQUE_TYPES = ['menace', 'opportunite'] as const;
export type RisqueType = (typeof RISQUE_TYPES)[number];

export const RISQUE_TYPE_LABELS: Record<RisqueType, string> = {
  menace: 'Menace',
  opportunite: 'Opportunité',
};

export const RISQUE_SOURCES = ['interne', 'externe', 'mixte'] as const;
export type RisqueSource = (typeof RISQUE_SOURCES)[number];

export const RISQUE_SOURCE_LABELS: Record<RisqueSource, string> = {
  interne: 'Interne',
  externe: 'Externe',
  mixte: 'Mixte',
};

export const RISQUE_CATEGORIES = [
  'technique',
  'financier',
  'planning',
  'contractuel',
  'environnemental',
  'securite',
  'juridique',
  'rh',
  'reputation',
  'reglementaire',
  'strategique',
] as const;
export type RisqueCategory = (typeof RISQUE_CATEGORIES)[number];

export const RISQUE_CATEGORY_LABELS: Record<RisqueCategory, string> = {
  technique: 'Technique',
  financier: 'Financier',
  planning: 'Planning',
  contractuel: 'Contractuel',
  environnemental: 'Environnemental',
  securite: 'Sécurité',
  juridique: 'Juridique',
  rh: 'RH',
  reputation: 'Réputation',
  reglementaire: 'Réglementaire',
  strategique: 'Stratégique',
};

export const RISQUE_STATUSES = [
  'ouvert',
  'en_analyse',
  'attenue',
  'transfere',
  'accepte',
  'ferme',
  'materialise',
] as const;
export type RisqueStatus = (typeof RISQUE_STATUSES)[number];

export const RISQUE_STATUS_LABELS: Record<RisqueStatus, string> = {
  ouvert: 'Ouvert',
  en_analyse: 'En analyse',
  attenue: 'Atténué',
  transfere: 'Transféré',
  accepte: 'Accepté',
  ferme: 'Fermé',
  materialise: 'Matérialisé',
};

// Legacy English status labels for backward compatibility with older data
export const RISQUE_STATUS_LABELS_EN: Record<string, string> = {
  open: 'Ouvert',
  mitigated: 'Atténué',
  closed: 'Fermé',
  materialized: 'Matérialisé',
};

// Helper function to get status label (supports both French and English keys)
export function getRisqueStatusLabel(status: string): string {
  return RISQUE_STATUS_LABELS[status as RisqueStatus]
    || RISQUE_STATUS_LABELS_EN[status]
    || status;
}

export const RISQUE_STATUS_STYLES: Record<RisqueStatus, { bg: string; text: string; border: string }> = {
  ouvert: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  en_analyse: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  attenue: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  transfere: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  accepte: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  ferme: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  materialise: { bg: 'bg-neutral-800', text: 'text-white', border: 'border-neutral-800' },
};

export const RISQUE_PHASES = [
  'identification',
  'analyse',
  'planification_reponse',
  'mitigation_en_cours',
  'surveillance',
  'cloture',
] as const;
export type RisquePhase = (typeof RISQUE_PHASES)[number];

export const RISQUE_PHASE_LABELS: Record<RisquePhase, string> = {
  identification: 'Identification',
  analyse: 'Analyse',
  planification_reponse: 'Planification réponse',
  mitigation_en_cours: 'Mitigation en cours',
  surveillance: 'Surveillance',
  cloture: 'Clôture',
};

export const RISQUE_STRATEGIES = [
  'eviter',
  'transferer',
  'attenuer',
  'accepter',
  'exploiter',
] as const;
export type RisqueStrategie = (typeof RISQUE_STRATEGIES)[number];

export const RISQUE_STRATEGIE_LABELS: Record<RisqueStrategie, string> = {
  eviter: 'Éviter',
  transferer: 'Transférer',
  attenuer: 'Atténuer',
  accepter: 'Accepter',
  exploiter: 'Exploiter',
};

export const RISQUE_STRATEGIE_STYLES: Record<RisqueStrategie, { bg: string; text: string }> = {
  eviter: { bg: 'bg-green-500', text: 'text-white' },
  transferer: { bg: 'bg-blue-500', text: 'text-white' },
  attenuer: { bg: 'bg-yellow-400', text: 'text-neutral-900' },
  accepter: { bg: 'bg-orange-500', text: 'text-white' },
  exploiter: { bg: 'bg-purple-500', text: 'text-white' },
};

export const RISQUE_TENDANCES = ['diminution', 'stable', 'augmentation'] as const;
export type RisqueTendance = (typeof RISQUE_TENDANCES)[number];

export const RISQUE_TENDANCE_LABELS: Record<RisqueTendance, string> = {
  diminution: 'Diminution',
  stable: 'Stable',
  augmentation: 'Augmentation',
};

export const RISQUE_VELOCITES = [
  'immediate',
  'rapide',
  'moyenne',
  'lente',
  'tres_lente',
] as const;
export type RisqueVelocite = (typeof RISQUE_VELOCITES)[number];

export const RISQUE_VELOCITE_LABELS: Record<RisqueVelocite, string> = {
  immediate: 'Immédiate',
  rapide: 'Rapide',
  moyenne: 'Moyenne',
  lente: 'Lente',
  tres_lente: 'Très lente',
};

export const RISQUE_PROXIMITES = [
  'imminent',
  'court_terme',
  'moyen_terme',
  'long_terme',
] as const;
export type RisqueProximite = (typeof RISQUE_PROXIMITES)[number];

export const RISQUE_PROXIMITE_LABELS: Record<RisqueProximite, string> = {
  imminent: 'Imminent (< 1 semaine)',
  court_terme: 'Court terme (< 1 mois)',
  moyen_terme: 'Moyen terme (1-3 mois)',
  long_terme: 'Long terme (> 3 mois)',
};

// Impact et Probabilité (échelle 1-4)
export const RISQUE_IMPACT_LABELS: Record<number, string> = {
  1: 'Mineur',
  2: 'Modéré',
  3: 'Majeur',
  4: 'Critique',
};

export const RISQUE_PROBABILITE_LABELS: Record<number, string> = {
  1: 'Très faible',
  2: 'Faible',
  3: 'Moyenne',
  4: 'Forte',
};

// ============================================================================
// AUTRES ENUMS
// ============================================================================

export const USER_ROLES = ['admin', 'manager', 'viewer'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  manager: 'Manager',
  viewer: 'Lecteur',
};

export const TEAM_ROLES = [
  'chef_projet',
  'responsable_technique',
  'responsable_commercial',
  'responsable_financier',
  'coordinateur',
  'membre',
] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  chef_projet: 'Chef de projet',
  responsable_technique: 'Responsable technique',
  responsable_commercial: 'Responsable commercial',
  responsable_financier: 'Responsable financier',
  coordinateur: 'Coordinateur',
  membre: 'Membre',
};

// BUDGET_CATEGORIES, BudgetCategory, BUDGET_CATEGORY_LABELS
// -> Exportés depuis ./budget.types

export const ALERTE_TYPES = [
  'echeance_action',
  'jalon_approche',
  'action_bloquee',
  'depassement_budget',
  'risque_critique',
  'desynchronisation_chantier_mobilisation',
] as const;
export type AlerteType = (typeof ALERTE_TYPES)[number];

export const ALERTE_TYPE_LABELS: Record<AlerteType, string> = {
  echeance_action: 'Échéance action',
  jalon_approche: 'Jalon en approche',
  action_bloquee: 'Action bloquée',
  depassement_budget: 'Dépassement budget',
  risque_critique: 'Risque critique',
  desynchronisation_chantier_mobilisation: 'Désynchronisation Chantier/Mobilisation',
};

export const CRITICITES = ['low', 'medium', 'high', 'critical'] as const;
export type Criticite = (typeof CRITICITES)[number];

export const CRITICITE_LABELS: Record<Criticite, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Haute',
  critical: 'Critique',
};

// ============================================================================
// SYNCHRONISATION CHANTIER / MOBILISATION
// ============================================================================

export const SYNC_STATUSES = ['en_phase', 'en_avance', 'en_retard', 'critique'] as const;
export type SyncStatus = (typeof SYNC_STATUSES)[number];

export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  en_phase: 'En phase',
  en_avance: 'Mobilisation en avance',
  en_retard: 'Mobilisation en retard',
  critique: 'Désynchronisation critique',
};

export const SYNC_STATUS_STYLES: Record<SyncStatus, { bg: string; text: string; border: string }> = {
  en_phase: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  en_avance: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  en_retard: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  critique: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

// Interface pour les liens chantier-mobilisation
export interface LienChantierMobilisation {
  id?: number;
  action_technique_id: string;
  action_mobilisation_id: string;
  propagation_retard: boolean;
  date_creation: string;
}

// Métriques de synchronisation
export interface SynchronisationMetrics {
  avancement_technique: number;
  avancement_mobilisation: number;
  ecart_points: number;
  sync_status: SyncStatus;
  risque_gaspillage: boolean;
  risque_retard_ouverture: boolean;
}

// Propagation de retard
export interface PropagationRetard {
  action_source_id: string;
  action_source_titre: string;
  retard_jours: number;
  actions_impactees: {
    id: string;
    titre: string;
    nouvelle_date_debut: string;
    nouvelle_date_fin: string;
    decalage_jours: number;
  }[];
}

// ============================================================================
// SUB-INTERFACES
// ============================================================================

// ============================================================================
// SPÉCIFICATIONS V2.0 - SOUS-ENTITÉS
// ============================================================================

/**
 * Sous-tâche d'une action (spécifications v2.0)
 * Utilisée pour décomposer une action en étapes vérifiables
 */
export interface SousTache {
  id?: number;
  actionId: string;
  libelle: string;
  fait: boolean;
  avancement: number; // 0-100%
  ordre: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Preuve/Livrable attaché à une action (spécifications v2.0)
 * Permet de joindre des fichiers ou liens comme preuves de réalisation
 */
export interface Preuve {
  id?: number;
  actionId: string;
  type: 'FICHIER' | 'LIEN';
  nom: string;
  url?: string;                   // Lien externe
  fichier?: {
    nom: string;
    taille: number;
    type: string;
    base64: string;
  };
  uploadePar: string;
  createdAt: string;
}

/**
 * Note/Commentaire sur une action (spécifications v2.0)
 * Permet de suivre l'historique des échanges sur une action
 */
export interface NoteAction {
  id?: number;
  actionId: string;
  contenu: string;
  auteurId: string;
  auteurNom?: string;
  createdAt: string;
}

/**
 * Statuts de jalon selon spécifications v2.0
 */
export const STATUTS_JALON_V2 = ['A_VENIR', 'EN_COURS', 'A_VALIDER', 'ATTEINT', 'EN_RETARD'] as const;
export type StatutJalonV2 = typeof STATUTS_JALON_V2[number];

/**
 * Statuts d'action selon spécifications v2.0
 */
export const STATUTS_ACTION_V2 = ['A_FAIRE', 'EN_COURS', 'FAIT', 'BLOQUE'] as const;
export type StatutActionV2 = typeof STATUTS_ACTION_V2[number];

/**
 * Météos de jalon selon spécifications v2.0
 */
export const METEOS_JALON = ['SOLEIL', 'NUAGEUX', 'ORAGEUX'] as const;
export type MeteoJalon = typeof METEOS_JALON[number];

/**
 * Priorités selon spécifications v2.0
 */
export const PRIORITES_V2 = ['HAUTE', 'MOYENNE', 'BASSE'] as const;
export type PrioriteV2 = typeof PRIORITES_V2[number];

// ============================================================================

export interface Dependance {
  id: string;
  titre: string;
  type_lien: TypeLien;
  decalage_jours: number;
  statut: ActionStatus;
}

export interface Livrable {
  id: string;
  nom: string;
  description: string | null;
  statut: StatutLivrable;
  obligatoire: boolean;
  date_prevue: string | null;
  date_livraison: string | null;
  validateur: string | null;
}

export interface CritereAcceptation {
  id: string;
  critere: string;
  valide: boolean;
  date_validation: string | null;
  validateur: string | null;
}

// Backward compatibility aliases
export type JalonLivrable = Livrable;
export type JalonCritere = CritereAcceptation;

export interface Document {
  id: string;
  nom: string;
  type: TypeDocument;
  url: string;
  date_ajout: string;
  ajoute_par: string;
}

export interface Commentaire {
  date: string;
  auteur: string;
  texte: string;
}

export interface JalonDependance {
  id: string;
  titre: string;
  statut: JalonStatus;
  date_prevue: string;
}

export interface ActionMitigation {
  id: string;
  action: string;
  responsable: string;
  deadline: string;
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule';
  efficacite: number | null;
}

export interface ActionContingence {
  id: string;
  action: string;
  deadline: string;
}

export interface EvaluationHistorique {
  date: string;
  probabilite: 1 | 2 | 3 | 4;
  impact: 1 | 2 | 3 | 4;
  score: number;
  commentaire: string;
  auteur: string;
}
export type HistoriqueEvaluation = EvaluationHistorique; // Alias

export interface TeamMember {
  userId: number;
  role: TeamRole;
  dateAjout: string;
}

// ============================================================================
// MAIN ENTITIES
// ============================================================================

export interface Project {
  id?: number;
  name: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  budget: number;
  buildings?: Building[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PARAMÈTRES PROJET (MÉTADONNÉES V2.0)
// ============================================================================
export interface ProjectSettings {
  id?: number;
  projectId: number;

  // Métadonnées générales
  gla?: number;                     // Surface commerciale (m²)
  nombreBoutiques?: { min: number; max: number };
  placesParking?: number;
  emploisCrees?: { directs: number; indirects: number; total: number };
  investissement?: string;
  certification?: string;
  proprietaire?: string;
  localisation?: string;

  // Objectifs d'occupation
  objectifsOccupation?: {
    softOpening: { date: string; tauxCible: number };
    inauguration: { date: string; tauxCible: number };
    moisPlus6?: { date: string; tauxCible: number };
  };

  // Phase actuelle du projet
  phaseActuelle?: ProjectPhase;

  // Dates clés
  datesClePtojet?: {
    kickoff?: string;
    softOpening?: string;
    inauguration?: string;
  };

  // Gouvernance
  instancesPilotage?: Array<{
    instance: string;
    frequence: string;
    participants: string[];
    objet: string;
  }>;

  // Contacts d'urgence
  contactsUrgence?: Array<{
    service: string;
    numero: string;
  }>;

  createdAt: string;
  updatedAt: string;
}

// Types pour les bâtiments du projet
export const BUILDING_TYPES = ['centre_commercial', 'big_box', 'zone_exposition', 'parking', 'autre'] as const;
export type BuildingType = (typeof BUILDING_TYPES)[number];

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  centre_commercial: 'Centre Commercial',
  big_box: 'Big Box',
  zone_exposition: 'Zone d\'Exposition',
  parking: 'Parking',
  autre: 'Autre',
};

export const BUILDING_STATUSES = ['non_demarre', 'en_cours', 'livre_avec_reserves', 'livre', 'en_exploitation'] as const;
export type BuildingStatus = (typeof BUILDING_STATUSES)[number];

export const BUILDING_STATUS_LABELS: Record<BuildingStatus, string> = {
  non_demarre: 'Non démarré',
  en_cours: 'Travaux en cours',
  livre_avec_reserves: 'Livré avec réserves',
  livre: 'Livré',
  en_exploitation: 'En exploitation',
};

export const BUILDING_STATUS_COLORS: Record<BuildingStatus, string> = {
  non_demarre: '#6B7280',
  en_cours: '#F59E0B',
  livre_avec_reserves: '#F97316',
  livre: '#10B981',
  en_exploitation: '#3B82F6',
};

export interface Building {
  id: string;
  nom: string;
  code: string;
  type: BuildingType;
  description: string;
  niveaux: number; // R+X (nombre d'étages au-dessus du RDC)
  surface?: number; // m²
  status: BuildingStatus;
  dateDebutTravaux?: string;
  dateLivraisonPrevue?: string;
  dateLivraisonReelle?: string;
  avancement: number;
  reserves?: string[];
  zones?: BuildingZone[];
}

export interface BuildingZone {
  id: string;
  nom: string;
  type: 'supermarche' | 'boutique' | 'restauration' | 'loisirs' | 'services' | 'commun' | 'technique' | 'exposition' | 'parking';
  surface?: number;
  niveau: number;
  status: BuildingStatus;
  locataire?: string;
}

export interface User {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface Team {
  id?: number;
  nom: string;
  description?: string;
  couleur: string;
  responsableId: number;
  membres: TeamMember[];
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ACTION - INTERFACE COMPLETE
// ============================================================================

export interface Action {
  id?: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTIFICATION (Onglet: Général)
  // ═══════════════════════════════════════════════════════════════════════════
  id_action: string;              // Format: "X.Y.Z" (ex: "2.3.1")
  code_wbs: string;               // Format: "WBS-XXX-YYY" (ex: "WBS-COM-003")
  titre: string;                  // Max 100 caractères, obligatoire
  description: string;            // Max 500 caractères, obligatoire

  // Classification
  axe: Axe;                       // Enum, obligatoire
  phase: Phase;                   // Enum, obligatoire
  projectPhase?: ProjectPhase;    // Phase projet Cosmos Angré (V2.0)
  categorie: ActionCategory;      // Enum, obligatoire
  sous_categorie: string | null;  // Texte libre
  type_action: ActionType;        // Enum, obligatoire
  buildingCode?: BuildingCode;    // Code bâtiment (CC, BB1, BB2, BB3, BB4, ZE, MA, PK)

  // ═══════════════════════════════════════════════════════════════════════════
  // PLANIFICATION (Onglet: Planning)
  // ═══════════════════════════════════════════════════════════════════════════
  date_creation: string;          // Auto-générée
  date_debut_prevue: string;      // Obligatoire
  date_fin_prevue: string;        // Obligatoire
  date_debut_reelle: string | null;
  date_fin_reelle: string | null;
  duree_prevue_jours: number;     // Calculé ou saisi
  duree_reelle_jours: number | null;
  date_butoir: string | null;     // Deadline impérative
  flexibilite: Flexibilite;       // Enum

  // Alertes automatiques (calculées)
  alerte_j30: string | null;
  alerte_j15: string | null;
  alerte_j7: string | null;
  alerte_j3: string | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // RESPONSABILITÉS RACI (Onglet: RACI)
  // ═══════════════════════════════════════════════════════════════════════════
  responsable: string;            // R - Qui exécute, obligatoire
  responsableId: number;          // ID du responsable (référence vers User)
  approbateur: string;            // A - Qui valide, obligatoire
  consultes: string[];            // C - Consultés
  informes: string[];             // I - Informés
  delegue: string | null;         // Backup si absent

  // Escalade
  escalade_niveau1: string;       // Retard < 5j
  escalade_niveau2: string;       // Retard 5-10j
  escalade_niveau3: string;       // Retard > 10j

  // ═══════════════════════════════════════════════════════════════════════════
  // DÉPENDANCES (Onglet: Dépendances)
  // ═══════════════════════════════════════════════════════════════════════════
  predecesseurs: Dependance[];    // Actions préalables
  successeurs: Dependance[];      // Actions dépendantes
  contraintes_externes: string | null;
  chemin_critique: boolean;       // Sur le chemin critique?
  jalonId: number | null;         // ID du jalon associé

  // Calcul automatique des échéances
  jalon_reference?: PhaseReference;    // Phase projet de référence pour le calcul
  delai_declenchement?: number;        // Jours relatifs au jalon de référence (négatif = avant, ex: J-90 = -90)
  unite_temps?: UniteTemps;            // Unité pour saisie du délai
  date_verrouillage_manuel?: boolean;  // Si true, ignoré lors du recalcul automatique

  // ═══════════════════════════════════════════════════════════════════════════
  // RESSOURCES & BUDGET (Onglet: Ressources)
  // ═══════════════════════════════════════════════════════════════════════════
  ressources_humaines: string[];  // Liste des personnes
  charge_homme_jour: number | null;
  budget_prevu: number | null;    // En FCFA
  budget_engage: number | null;
  budget_realise: number | null;
  ligne_budgetaire: string | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // LIVRABLES (Onglet: Livrables)
  // ═══════════════════════════════════════════════════════════════════════════
  livrables: Livrable[];
  criteres_acceptation: CritereAcceptation[];
  validateur_qualite: string | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENTATION (Onglet: Documents)
  // ═══════════════════════════════════════════════════════════════════════════
  documents: Document[];
  lien_sharepoint: string | null;
  modele_document: string | null; // Template à utiliser

  // ═══════════════════════════════════════════════════════════════════════════
  // SUIVI & AVANCEMENT (Onglet: Suivi)
  // ═══════════════════════════════════════════════════════════════════════════
  statut: ActionStatus;           // Enum, obligatoire
  avancement: number;             // 0-100, obligatoire
  methode_avancement: MethodeAvancement;
  tendance: Tendance;
  sante: ActionSante;             // Enum avec couleur

  // Communication
  notes_internes: string | null;
  commentaire_reporting: string | null;  // Max 200 car.
  historique_commentaires: Commentaire[];
  visibilite_reporting: VisibiliteReporting[];

  // Risques & Problèmes
  risques_associes: string[];     // IDs des risques
  problemes_ouverts: string[];    // IDs des problèmes
  points_blocage: string | null;
  escalade_requise: boolean;
  niveau_escalade: string | null;

  // Priorité
  priorite: Priorite;             // Enum, obligatoire
  score_priorite: number | null;  // 1-100, calculé
  impact_si_retard: NiveauImpact;

  // Audit
  version: number;
  date_modification: string;
  modifie_par: string;
  motif_modification: string | null;

  // Legacy
  actionPlanId?: number;
}

// ============================================================================
// JALON - INTERFACE COMPLETE
// ============================================================================

export interface Jalon {
  id?: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTIFICATION (Onglet: Général)
  // ═══════════════════════════════════════════════════════════════════════════
  id_jalon: string;               // Format: "JAL-YYYY-XXX"
  code_wbs: string;               // Format: "WBS-XXX-MXX"
  titre: string;                  // Max 100 caractères
  description: string;            // Max 500 caractères

  // Classification
  axe: Axe;                       // Enum
  categorie: JalonCategory;       // Enum
  type_jalon: JalonType;          // Enum
  niveau_importance: NiveauImportance;  // Critique/Majeur/Standard/Mineur
  buildingCode?: BuildingCode;    // Code bâtiment (CC, BB1, BB2, BB3, BB4, ZE, MA, PK)
  projectPhase?: ProjectPhase;    // Phase projet Cosmos Angré (V2.0)

  // ═══════════════════════════════════════════════════════════════════════════
  // PLANIFICATION (Onglet: Planning)
  // ═══════════════════════════════════════════════════════════════════════════
  date_prevue: string;            // Obligatoire
  date_reelle: string | null;     // Renseigné quand atteint
  heure_cible: string | null;     // Format "HH:MM"
  fuseau_horaire: string;         // Ex: "Africa/Abidjan"

  date_butoir_absolue: string | null;  // Deadline impérative
  flexibilite: Flexibilite;

  // Calcul automatique des échéances
  jalon_reference?: PhaseReference;    // Phase projet de référence pour le calcul
  delai_declenchement?: number;        // Jours relatifs au jalon de référence (négatif = avant, ex: -90)
  date_verrouillage_manuel?: boolean;  // Si true, ignoré lors du recalcul automatique

  // Alertes automatiques
  alerte_j30: string;
  alerte_j15: string;
  alerte_j7: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUT (Onglet: Général)
  // ═══════════════════════════════════════════════════════════════════════════
  statut: JalonStatus;            // Enum
  avancement_prealables: number;  // 0-100 (% actions terminées)
  confiance_atteinte: number;     // 0-100 (probabilité)
  tendance: Tendance;

  date_derniere_maj: string;
  maj_par: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // RESPONSABILITÉS (Onglet: RACI)
  // ═══════════════════════════════════════════════════════════════════════════
  responsable: string;            // Qui pilote
  responsableId?: number;         // ID de l'utilisateur responsable (v2.0)
  validateur: string;             // Qui approuve l'atteinte
  validateurId?: number;          // ID de l'utilisateur validateur (v2.0)
  contributeurs: string[];        // Consultés
  parties_prenantes: string[];    // Informés

  // Escalade
  escalade_niveau1: string;       // Retard < 5j
  escalade_niveau2: string;       // Retard 5-15j
  escalade_niveau3: string;       // Retard > 15j

  // ═══════════════════════════════════════════════════════════════════════════
  // DÉPENDANCES (Onglet: Dépendances)
  // ═══════════════════════════════════════════════════════════════════════════
  predecesseurs: JalonDependance[];   // Jalons prérequis
  successeurs: JalonDependance[];     // Jalons dépendants
  prerequis_jalons?: string[];        // IDs des jalons prérequis (simplifié v2.0)
  actions_prerequises: string[];      // IDs des actions
  chemin_critique: boolean;

  // ═══════════════════════════════════════════════════════════════════════════
  // PREUVE (v2.0)
  // ═══════════════════════════════════════════════════════════════════════════
  preuve_url?: string | null;         // Lien vers la preuve/justificatif

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPACT & RISQUES (Onglet: Risques)
  // ═══════════════════════════════════════════════════════════════════════════
  impact_retard: NiveauImpact;
  cout_retard_jour: number | null;    // FCFA par jour de retard
  risques_associes: string[];         // IDs des risques
  probabilite_atteinte: number;       // 0-100
  plan_contingence: string | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // LIVRABLES (Onglet: Livrables)
  // ═══════════════════════════════════════════════════════════════════════════
  livrables: Livrable[];
  criteres_acceptation: CritereAcceptation[];

  // ═══════════════════════════════════════════════════════════════════════════
  // BUDGET (calculé)
  // ═══════════════════════════════════════════════════════════════════════════
  budget_associe: number | null;
  budget_consomme: number | null;
  impact_financier_global: number | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENTATION (Onglet: Documents)
  // ═══════════════════════════════════════════════════════════════════════════
  documents: Document[];
  lien_sharepoint: string | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // ALERTES (Onglet: Alertes)
  // ═══════════════════════════════════════════════════════════════════════════
  alertes_actives: boolean;
  canal_alerte: CanalAlerte[];
  frequence_rappel: FrequenceRappel;
  notifier: string[];             // Liste des personnes

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMUNICATION
  // ═══════════════════════════════════════════════════════════════════════════
  notes: string | null;
  commentaire_reporting: string | null;
  visibilite: VisibiliteReporting[];

  // Audit
  version: number;
  date_creation: string;
  cree_par: string;
  derniere_modification: string;
  modifie_par: string;
}

// ============================================================================
// RISQUE - INTERFACE COMPLETE
// ============================================================================

export interface Risque {
  id?: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAMPS SIMPLIFIÉS (utilisés par le formulaire et les données)
  // ═══════════════════════════════════════════════════════════════════════════
  probabilite?: 1 | 2 | 3 | 4;     // Champ simplifié
  impact?: 1 | 2 | 3 | 4;          // Champ simplifié
  score?: number;                   // Champ simplifié (P × I)
  status?: RisqueStatus;            // Champ simplifié pour le statut
  responsable?: string;             // Champ simplifié pour le responsable
  mesures_attenuation?: string;     // Alias pour plan_mitigation
  notes_mise_a_jour?: string;       // Notes de mise à jour
  commentaires_externes?: string;   // Commentaires JSON string
  updatedAt?: string;               // Date de mise à jour
  createdAt?: string;               // Date de création (simplifié)

  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTIFICATION (Onglet: Identification)
  // ═══════════════════════════════════════════════════════════════════════════
  id_risque: string;              // Format: "R-YYYY-XXX"
  code_wbs: string;               // Format: "WBS-RSK-XXX"
  titre: string;                  // Max 100 caractères
  description: string;            // Max 500 caractères

  // Classification
  type_risque: RisqueType;        // Menace ou Opportunité
  source_risque: RisqueSource;    // Interne/Externe/Mixte
  categorie: RisqueCategory;      // Enum
  sous_categorie: string | null;
  axe_impacte: Axe;
  buildingCode?: BuildingCode;    // Code bâtiment (CC, BB1, BB2, BB3, BB4, ZE, MA, PK)
  projectPhase?: ProjectPhase;    // Phase projet Cosmos Angré (V2.0)

  // Identification
  date_identification: string;
  identifie_par: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉVALUATION (Onglet: Évaluation)
  // ═══════════════════════════════════════════════════════════════════════════

  // Évaluation initiale (lecture seule après création)
  probabilite_initiale: 1 | 2 | 3 | 4;
  impact_initial: 1 | 2 | 3 | 4;
  score_initial: number;          // Calculé: P × I

  // Évaluation actuelle (modifiable)
  probabilite_actuelle: 1 | 2 | 3 | 4;
  impact_actuel: 1 | 2 | 3 | 4;
  score_actuel: number;           // Calculé: P × I

  // Indicateurs complémentaires
  tendance_risque: RisqueTendance;
  detectabilite: 1 | 2 | 3 | 4;   // Facilité à détecter
  velocite: RisqueVelocite;       // Vitesse de matérialisation
  proximite: RisqueProximite;     // Quand peut-il arriver

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPACT DÉTAILLÉ (Onglet: Impact)
  // ═══════════════════════════════════════════════════════════════════════════
  impact_cout: number | null;     // FCFA
  impact_delai_jours: number | null;
  impact_qualite: NiveauImpact;
  impact_reputation: NiveauImpact;
  impact_securite: NiveauImpact;
  description_impact: string | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUT
  // ═══════════════════════════════════════════════════════════════════════════
  statut: RisqueStatus;
  phase_traitement: RisquePhase;
  date_derniere_evaluation: string;
  prochaine_revue: string | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // RESPONSABILITÉS (Onglet: Identification)
  // ═══════════════════════════════════════════════════════════════════════════
  proprietaire: string;           // Responsable surveillance
  gestionnaire: string | null;    // Pilote les actions
  validateur: string;             // Approuve le traitement
  equipe_response: string[];

  // Escalade
  escalade_niveau1: string;       // Score ≥ 8
  escalade_niveau2: string;       // Score ≥ 12
  escalade_niveau3: string;       // Score = 16 ou Matérialisé

  // ═══════════════════════════════════════════════════════════════════════════
  // MITIGATION (Onglet: Mitigation)
  // ═══════════════════════════════════════════════════════════════════════════
  strategie_reponse: RisqueStrategie;
  plan_mitigation: string | null;
  actions_mitigation: ActionMitigation[];
  cout_mitigation: number | null;
  efficacite_prevue: number | null;  // 0-100%

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTINGENCE (Onglet: Contingence)
  // ═══════════════════════════════════════════════════════════════════════════
  plan_contingence: string | null;
  declencheur_contingence: string | null;
  cout_contingence: number | null;
  actions_contingence: ActionContingence[];

  // ═══════════════════════════════════════════════════════════════════════════
  // LIENS (Onglet: Liens)
  // ═══════════════════════════════════════════════════════════════════════════
  jalons_impactes: string[];      // IDs jalons
  actions_liees: string[];        // IDs actions
  risques_lies: string[];         // IDs autres risques
  opportunites_liees: string[];   // IDs opportunités

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENTATION (Onglet: Documents)
  // ═══════════════════════════════════════════════════════════════════════════
  documents: Document[];
  lien_sharepoint: string | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // HISTORIQUE (Onglet: Historique)
  // ═══════════════════════════════════════════════════════════════════════════
  historique: EvaluationHistorique[];

  // ═══════════════════════════════════════════════════════════════════════════
  // ALERTES
  // ═══════════════════════════════════════════════════════════════════════════
  alertes_actives: boolean;
  seuil_alerte_score: number;     // Déclenche alerte si score >=
  canal_alerte: CanalAlerte[];
  notifier: string[];

  // Audit
  version: number;
  date_creation: string;
  cree_par: string;
  derniere_modification: string;
  modifie_par: string;
}

// ============================================================================
// BUDGET & ALERTES
// ============================================================================

// BudgetItem -> Exporté depuis ./budget.types

export interface Alerte {
  id?: number;
  type: AlerteType;
  titre: string;
  message: string;
  criticite: Criticite;
  entiteType: 'action' | 'jalon' | 'risque' | 'budget' | 'alerte';
  entiteId: number;
  // Responsable de l'alerte
  responsableId?: number;
  responsableNom?: string;
  responsableEmail?: string;
  // Statuts
  lu: boolean;
  traitee: boolean;
  createdAt: string;
  traiteeAt?: string;
  traiteeParId?: number;
  traiteeParNom?: string;
  // Envoi email
  emailEnvoye: boolean;
  emailEnvoyeAt?: string;
  emailRelanceCount?: number;
  dernierRelanceAt?: string;
}

// Historique des emails d'alertes envoyés
export interface AlerteEmailHistorique {
  id?: number;
  alerteId: number;
  type: 'initial' | 'relance' | 'escalade';
  destinataireEmail: string;
  destinataireNom: string;
  sujet: string;
  contenuHtml: string;
  envoyeAt: string;
  statut: 'envoye' | 'echec' | 'ouvert' | 'clique';
  ouvertAt?: string;
  cliqueAt?: string;
  erreur?: string;
}

export interface Historique {
  id?: number;
  timestamp: string;
  entiteType: 'action' | 'jalon' | 'risque' | 'budget' | 'alerte';
  entiteId: number;
  champModifie: string;
  ancienneValeur: string;
  nouvelleValeur: string;
  auteurId: number;
}

// ============================================================================
// DASHBOARD & AGGREGATES
// ============================================================================

export interface DashboardKPIs {
  tauxOccupation: number;
  budgetConsomme: number;
  budgetTotal: number;
  jalonsAtteints: number;
  jalonsTotal: number;
  equipeTaille: number;
}

export interface AvancementAxe {
  axe: Axe;
  avancement: number;
  prevu: number;
  tendance: 'up' | 'down' | 'stable';
  actionsTotal: number;
  actionsTerminees: number;
}

export type MeteoProjet = 'vert' | 'jaune' | 'orange' | 'rouge';

// EVMIndicators -> Exporté depuis ./budget.types

// ============================================================================
// FILTERS & VIEWS
// ============================================================================

// Codes des bâtiments pour le filtrage (spécifications v2.0)
export const BUILDING_CODES = ['CC', 'MKT', 'BB1', 'BB2', 'BB3', 'BB4'] as const;
export type BuildingCode = typeof BUILDING_CODES[number];

export const BUILDING_CODE_LABELS: Record<BuildingCode, string> = {
  CC: 'Centre Commercial',
  MKT: 'Market',
  BB1: 'Big Box 1',
  BB2: 'Big Box 2',
  BB3: 'Big Box 3',
  BB4: 'Big Box 4',
};

// Configuration complète des bâtiments selon spécifications v2.0
// Total GLA: 45 000 m² (conforme à PROJET_CONFIG)
export const BATIMENTS_CONFIG: Record<BuildingCode, {
  id: string;
  nom: string;
  description: string;
  estPilote: boolean;
  ordre: number;
  surface: number; // m² GLA
  niveaux: string;
  type: string;
}> = {
  CC: { id: 'BAT-1', nom: 'Centre Commercial', description: 'Mall principal avec galeries, food court et espaces loisirs', estPilote: true, ordre: 1, surface: 15000, niveaux: 'R+3', type: 'Centre Commercial' },
  MKT: { id: 'BAT-2', nom: 'Hypermarché', description: 'Hypermarché Carrefour avec surface de vente et réserves', estPilote: false, ordre: 2, surface: 6000, niveaux: 'R+1', type: 'Hypermarché' },
  BB1: { id: 'BAT-3', nom: 'Big Box 1', description: 'Grande surface spécialisée - Ameublement & Décoration', estPilote: false, ordre: 3, surface: 6000, niveaux: 'R+1', type: 'Big Box' },
  BB2: { id: 'BAT-4', nom: 'Big Box 2', description: 'Grande surface spécialisée - Électronique & High-Tech', estPilote: false, ordre: 4, surface: 6000, niveaux: 'R+1', type: 'Big Box' },
  BB3: { id: 'BAT-5', nom: 'Big Box 3', description: 'Grande surface spécialisée - Sport & Loisirs', estPilote: false, ordre: 5, surface: 6000, niveaux: 'R+1', type: 'Big Box' },
  BB4: { id: 'BAT-6', nom: 'Big Box 4', description: 'Grande surface spécialisée - Bricolage & Jardin', estPilote: false, ordre: 6, surface: 6000, niveaux: 'R+1', type: 'Big Box' },
};

// Calcul automatique du total GLA
export const TOTAL_GLA = Object.values(BATIMENTS_CONFIG).reduce((sum, b) => sum + b.surface, 0);

// Codes bâtiments legacy pour compatibilité avec anciennes données
export const LEGACY_BUILDING_CODES = ['ZE', 'MA', 'PK'] as const;
export type LegacyBuildingCode = typeof LEGACY_BUILDING_CODES[number];

export const LEGACY_BUILDING_CODE_LABELS: Record<LegacyBuildingCode, string> = {
  ZE: "Zone d'Exposition",
  MA: 'Marché Artisanal',
  PK: 'Parking',
};

export interface ActionFilters {
  axe?: Axe;
  phase?: Phase;
  status?: ActionStatus;
  priorite?: Priorite;
  responsable?: string;
  responsableId?: number;
  search?: string;
  dateDebut?: string;
  dateFin?: string;
  buildingCode?: BuildingCode;
  jalonId?: number;
}

export interface JalonFilters {
  axe?: Axe;
  status?: JalonStatus;
  search?: string;
  buildingCode?: BuildingCode;
  projectPhase?: ProjectPhase;
}

export interface RisqueFilters {
  categorie?: RisqueCategory;
  status?: RisqueStatus;
  scoreMin?: number;
  scoreMax?: number;
  buildingCode?: BuildingCode;
  projectPhase?: ProjectPhase;
}

export interface AlerteFilters {
  type?: AlerteType;
  criticite?: Criticite;
  lu?: boolean;
  traitee?: boolean;
}

export type ActionViewMode = 'list' | 'cards' | 'kanban' | 'gantt' | 'calendar' | 'pert';

// ============================================================================
// IMPORT/EXPORT
// ============================================================================

export interface ExportData {
  version: string;
  exportedAt: string;
  project: Project;
  users: User[];
  teams: Team[];
  actions: Action[];
  jalons: Jalon[];
  risques: Risque[];
  budget: BudgetItem[];
  alertes: Alerte[];
  historique: Historique[];
}

// ============================================================================
// IMPORT IA - MODULE
// ============================================================================

// Types de documents reconnus par l'IA
export const IA_DOCUMENT_TYPES = [
  'facture',
  'devis',
  'compte_rendu',
  'bail_commercial',
  'pv_reception',
  'cv',
  'contrat_travail',
  'rapport_audit',
  'planning',
  'courrier_officiel',
  'photo_reserve',
  'doe',
  'autre',
] as const;
export type IADocumentType = (typeof IA_DOCUMENT_TYPES)[number];

export const IA_DOCUMENT_TYPE_LABELS: Record<IADocumentType, string> = {
  facture: 'Facture fournisseur',
  devis: 'Devis',
  compte_rendu: 'Compte-rendu de réunion',
  bail_commercial: 'Bail commercial',
  pv_reception: 'PV de réception',
  cv: 'CV / Curriculum Vitae',
  contrat_travail: 'Contrat de travail',
  rapport_audit: "Rapport d'audit",
  planning: 'Planning',
  courrier_officiel: 'Courrier officiel',
  photo_reserve: 'Photo de réserve',
  doe: 'DOE (Dossier des Ouvrages Exécutés)',
  autre: 'Autre document',
};

// Modules cibles pour l'intégration
export const IA_TARGET_MODULES = [
  'actions',
  'jalons',
  'budget',
  'risques',
  'commercial',
  'recrutement',
  'technique',
  'documents',
  'reunions',
] as const;
export type IATargetModule = (typeof IA_TARGET_MODULES)[number];

export const IA_TARGET_MODULE_LABELS: Record<IATargetModule, string> = {
  actions: 'Actions',
  jalons: 'Jalons',
  budget: 'Budget',
  risques: 'Risques',
  commercial: 'Commercial',
  recrutement: 'Recrutement',
  technique: 'Technique',
  documents: 'Documents (GED)',
  reunions: 'Réunions',
};

// Statuts d'import
export const IA_IMPORT_STATUSES = [
  'uploading',
  'processing',
  'ocr',
  'analyzing',
  'ready',
  'validated',
  'integrated',
  'failed',
] as const;
export type IAImportStatus = (typeof IA_IMPORT_STATUSES)[number];

export const IA_IMPORT_STATUS_LABELS: Record<IAImportStatus, string> = {
  uploading: 'Téléchargement...',
  processing: 'Traitement...',
  ocr: 'OCR en cours...',
  analyzing: 'Analyse IA...',
  ready: 'Prêt à valider',
  validated: 'Validé',
  integrated: 'Intégré',
  failed: 'Échec',
};

export const IA_IMPORT_STATUS_STYLES: Record<IAImportStatus, { bg: string; text: string }> = {
  uploading: { bg: 'bg-blue-100', text: 'text-blue-700' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-700' },
  ocr: { bg: 'bg-purple-100', text: 'text-purple-700' },
  analyzing: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  ready: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  validated: { bg: 'bg-green-100', text: 'text-green-700' },
  integrated: { bg: 'bg-green-100', text: 'text-green-700' },
  failed: { bg: 'bg-red-100', text: 'text-red-700' },
};

// Formats de fichiers supportés
export const IA_SUPPORTED_FORMATS = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'text/csv',
] as const;

export const IA_FORMAT_EXTENSIONS: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/tiff': '.tiff',
  'text/csv': '.csv',
};

// Interface principale d'import
export interface IAImport {
  id?: number;
  importRef: string; // Format: "IMP-YYYY-XXXXX"

  // Fichier source
  filename: string;
  mimeType: string;
  sizeBytes: number;
  hashSHA256?: string;

  // Analyse IA
  status: IAImportStatus;
  progress: number; // 0-100
  documentType: IADocumentType | null;
  confidence: number; // 0-1
  ocrApplied: boolean;
  languageDetected: string;
  modelVersion: string;
  processingTimeMs: number;

  // Données extraites (JSON)
  extractedData: Record<string, unknown> | null;

  // Intégration
  targetModule: IATargetModule | null;
  integratedRecordIds: number[];

  // Méta
  createdAt: string;
  createdBy: number;
  validatedAt: string | null;
  validatedBy: number | null;

  // Erreur éventuelle
  errorCode: string | null;
  errorMessage: string | null;
}

// Corrections utilisateur sur l'extraction
export interface IAExtraction {
  id?: number;
  importId: number;
  field: string;
  originalValue: unknown;
  correctedValue: unknown;
  correctedAt: string;
  correctedBy: number;
}

// Enregistrements intégrés
export interface IAIntegration {
  id?: number;
  importId: number;
  targetModule: IATargetModule;
  targetTable: string;
  recordId: number;
  action: 'INSERT' | 'UPDATE';
  data: Record<string, unknown>;
  integratedAt: string;
  integratedBy: number;
}

// Fichiers stockés (blobs)
export interface IAFile {
  id?: number;
  importId: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  dataBlob: Blob;
  createdAt: string;
}

// Configuration de l'Import IA
export interface IASettings {
  maxFileSizeMb: number;
  autoClassificationThreshold: number; // 0-1
  suggestionThreshold: number; // 0-1
  defaultModule: IATargetModule;
  ocrEnabled: boolean;
  ocrLanguage: string;
  retentionDays: number;
  includeInBackup: boolean;
  apiProvider: 'claude' | 'openai';
  apiModel: string;
}

// Données extraites par type de document
export interface IAExtractedFacture {
  fournisseur: {
    nom: string;
    rccm?: string;
  };
  facture: {
    numero: string;
    date: string;
    dateEcheance?: string;
  };
  montants: {
    ht: number;
    tvaTaux: number;
    tvaMontant: number;
    ttc: number;
    devise: string;
  };
  lignes: Array<{
    description: string;
    quantite: number;
    prixUnitaire: number;
    montant: number;
  }>;
  objet: string;
}

export interface IAExtractedCompteRendu {
  reunion: {
    type: string;
    date: string;
    lieu: string;
    participants: Array<{
      nom: string;
      present: boolean;
      excuse?: boolean;
    }>;
  };
  decisions: Array<{
    id: string;
    description: string;
    decideur: string;
  }>;
  actionsIssues: Array<{
    description: string;
    responsable: string;
    echeance: string;
    priorite: Priorite;
  }>;
}

export interface IAExtractedBail {
  parties: {
    bailleur: string;
    preneur: {
      raisonSociale: string;
      rccm?: string;
      representant: string;
      fonction: string;
    };
  };
  local: {
    designation: string;
    surface: number;
    unite: string;
    niveau: string;
    zone: string;
  };
  conditions: {
    loyerMensuel: number;
    chargesMensuelles: number;
    devise: string;
    dureeAns: number;
    dateEffet: string;
    depotGarantie: number;
    pasDePorte?: number;
  };
  dateSignature: string;
}

export interface IAExtractedPVReception {
  lot: {
    numero: string;
    designation: string;
    entreprise: string;
  };
  reception: {
    date: string;
    type: 'provisoire' | 'definitive';
    avecReserves: boolean;
  };
  reserves: Array<{
    numero: string;
    localisation: string;
    description: string;
    priorite: 'majeure' | 'mineure';
    delaiLevee: string;
  }>;
  signataires: Array<{
    role: string;
    nom: string;
    signature: boolean;
  }>;
}

// Statistiques Import IA
export interface IAStats {
  totalImports: number;
  importsByStatus: Record<IAImportStatus, number>;
  importsByType: Record<IADocumentType, number>;
  avgConfidence: number;
  avgProcessingTime: number;
  successRate: number;
  thisWeek: number;
  thisMonth: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getScoreStyle = (score: number) => {
  if (score >= 12) return {
    bg: 'bg-red-500',
    text: 'text-white',
    label: 'Critique',
    description: 'Action immédiate requise',
  };
  if (score >= 8) return {
    bg: 'bg-orange-500',
    text: 'text-white',
    label: 'Élevé',
    description: 'Plan de mitigation prioritaire',
  };
  if (score >= 4) return {
    bg: 'bg-yellow-400',
    text: 'text-neutral-900',
    label: 'Modéré',
    description: 'Surveillance renforcée',
  };
  return {
    bg: 'bg-green-500',
    text: 'text-white',
    label: 'Faible',
    description: 'Surveillance standard',
  };
};

export const calculateScore = (probabilite: number, impact: number): number => {
  return probabilite * impact;
};

// ============================================================================
// PROPH3T TYPES
// ============================================================================

export * from './proph3t';

// ============================================================================
// SITE TYPES (Multi-sites support)
// ============================================================================

export * from './site';
