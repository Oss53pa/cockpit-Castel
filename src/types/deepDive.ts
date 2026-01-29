// DeepDive Types for Journal

export type ProjectWeather = 'green' | 'yellow' | 'orange' | 'red';
export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';
// 6 axes alignés avec le modèle projet (Construction vs 5 axes Mobilisation)
export type AxeType = 'rh' | 'commercialisation' | 'technique' | 'budget' | 'marketing' | 'exploitation' | 'general';

// Template types for different Deep Dive formats
export type DeepDiveTemplateType = 'launch' | 'monthly';

export interface DeepDiveTemplate {
  type: DeepDiveTemplateType;
  label: string;
  description: string;
  estimatedDuration: string;
  estimatedSlides: number;
}

export interface DGDecisionPoint {
  id: string;
  subject: string;
  amount: string;
  urgency: UrgencyLevel;
  deadline: string;
  recommendation: string;
  axe: AxeType;
}

export interface DeepDiveDesignSettings {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoPosition: 'left' | 'right' | 'center';
  showSlideNumbers: boolean;
  showDate: boolean;
  backgroundStyle: 'solid' | 'gradient' | 'pattern';
  headerStyle: 'full' | 'minimal' | 'none';
}

export interface DeepDiveSlide {
  id: string;
  title: string;
  included: boolean;
  comment: string;
}

export interface DeepDiveKPIs {
  tauxOccupation: number;
  budgetConsomme: number;
  budgetTotal: number;
  jalonsAtteints: number;
  jalonsTotal: number;
  avancementGlobal: number;
}

export interface DeepDiveAxeData {
  axe: AxeType;
  actions: number;
  actionsTerminees: number;
  actionsEnCours: number;
  actionsEnRetard: number;
  jalons: number;
  jalonsAtteints: number;
  risques: number;
  risquesCritiques: number;
  budgetPrevu: number;
  budgetRealise: number;
  avancement: number;
}

export interface DeepDiveRisk {
  id: string;
  titre: string;
  description: string;
  score: number;
  probabilite: number;
  impact: number;
  axe: AxeType;
  statut: string;
}

export interface DeepDiveJalon {
  id: string;
  titre: string;
  dateCible: string;
  statut: string;
  axe: AxeType;
}

export interface DeepDive {
  id?: number;
  titre: string;
  description?: string;
  projectName: string;
  templateType: DeepDiveTemplateType;
  weather: ProjectWeather;
  kpis: DeepDiveKPIs;
  designSettings: DeepDiveDesignSettings;
  slides: DeepDiveSlide[];
  decisionPoints: DGDecisionPoint[];
  axesData: DeepDiveAxeData[];
  topRisks: DeepDiveRisk[];
  upcomingJalons: DeepDiveJalon[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: 'draft' | 'finalized' | 'presented' | 'archived';
  presentedAt?: string;
  presentedTo?: string;
  tags?: string[];
  notes?: string;
}

export const WEATHER_CONFIG: Record<ProjectWeather, { label: string; emoji: string; color: string; bgColor: string }> = {
  green: { label: 'Vert', emoji: '🟢', color: '#22C55E', bgColor: '#DCFCE7' },
  yellow: { label: 'Jaune', emoji: '🟡', color: '#EAB308', bgColor: '#FEF9C3' },
  orange: { label: 'Orange', emoji: '🟠', color: '#F97316', bgColor: '#FFEDD5' },
  red: { label: 'Rouge', emoji: '🔴', color: '#EF4444', bgColor: '#FEE2E2' },
};

export const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; emoji: string; color: string; bgColor: string }> = {
  critical: { label: 'Critique', emoji: '🔴', color: '#EF4444', bgColor: '#FEE2E2' },
  high: { label: 'Haute', emoji: '🟠', color: '#F97316', bgColor: '#FFEDD5' },
  medium: { label: 'Moyenne', emoji: '🟡', color: '#EAB308', bgColor: '#FEF9C3' },
  low: { label: 'Basse', emoji: '🟢', color: '#22C55E', bgColor: '#DCFCE7' },
};

// Configuration des 6 axes alignés avec le modèle projet
export const AXES_CONFIG: Record<AxeType, { label: string; color: string; shortLabel: string }> = {
  rh: { label: 'RH & Organisation', color: '#EF4444', shortLabel: 'RH' },
  commercialisation: { label: 'Commercialisation', color: '#3B82F6', shortLabel: 'COM' },
  technique: { label: 'Technique & Handover', color: '#8B5CF6', shortLabel: 'TECH' },
  budget: { label: 'Budget & Pilotage', color: '#F59E0B', shortLabel: 'BUD' },
  marketing: { label: 'Marketing & Comm.', color: '#EC4899', shortLabel: 'MKT' },
  exploitation: { label: 'Exploitation & Systèmes', color: '#10B981', shortLabel: 'EXP' },
  general: { label: 'Général / Transverse', color: '#6B7280', shortLabel: 'GEN' },
};

// Deep Dive Template configurations
export const DEEP_DIVE_TEMPLATES: Record<DeepDiveTemplateType, DeepDiveTemplate> = {
  launch: {
    type: 'launch',
    label: 'Deep Dive de Lancement & Cadrage',
    description: 'Présentation initiale du projet avec vision, gouvernance et état des lieux complet',
    estimatedDuration: '2h30',
    estimatedSlides: 50,
  },
  monthly: {
    type: 'monthly',
    label: 'Deep Dive Mensuel',
    description: 'Revue mensuelle de l\'avancement avec focus sur les KPIs et décisions',
    estimatedDuration: '1h30',
    estimatedSlides: 35,
  },
};

// ============================================================================
// DEEP DIVE MENSUEL V2 - TYPES CONFORMES AU TEMPLATE COPIL
// ============================================================================

// Météo avec emojis conformes au template
export type MeteoEmoji = '☀️' | '🌤️' | '⛅' | '🌧️' | '⛈️';
export type MeteoNiveau = 'excellent' | 'bon' | 'attention' | 'alerte' | 'critique';
export type TendanceType = 'hausse' | 'stable' | 'baisse';

export const METEO_EMOJI_CONFIG: Record<MeteoNiveau, { emoji: MeteoEmoji; label: string; color: string; bgColor: string }> = {
  excellent: { emoji: '☀️', label: 'Excellent', color: '#10B981', bgColor: '#D1FAE5' },
  bon: { emoji: '🌤️', label: 'Bon', color: '#3B82F6', bgColor: '#DBEAFE' },
  attention: { emoji: '⛅', label: 'Attention', color: '#F59E0B', bgColor: '#FEF3C7' },
  alerte: { emoji: '🌧️', label: 'Alerte', color: '#F97316', bgColor: '#FFEDD5' },
  critique: { emoji: '⛈️', label: 'Critique', color: '#EF4444', bgColor: '#FEE2E2' },
};

// Structure hiérarchique des sections du Deep Dive Mensuel
export interface DeepDiveMensuelSection {
  id: string;
  numero: string; // "1", "2", "3", etc.
  titre: string;
  type: 'synthese' | 'analyse_axe' | 'risques' | 'decisions' | 'plan_action' | 'annexes';
  slides: DeepDiveMensuelSlide[];
  expanded?: boolean;
}

export interface DeepDiveMensuelSlide {
  id: string;
  sectionId: string;
  numero: string; // "1.1", "2.3", etc.
  titre: string;
  description: string;
  type: SlideType;
  included: boolean;
  comment?: string;
  axe?: AxeType; // Pour les slides par axe
}

export type SlideType =
  | 'meteo_globale'
  | 'faits_marquants'
  | 'tableau_bord_axes'
  | 'detail_axe'
  | 'top_risques'
  | 'risques_evolution'
  | 'decisions_table'
  | 'actions_prioritaires'
  | 'jalons_m1'
  | 'gantt_simplifie'
  | 'courbe_s';

// Section 1 - Synthèse Exécutive
export interface MeteoGlobaleData {
  meteoGlobale: MeteoNiveau;
  kpis: {
    id: string;
    label: string;
    valeur: number;
    cible: number;
    unite: string;
    meteo: MeteoNiveau;
    tendance: TendanceType;
    commentaire?: string;
  }[];
  resumeExecutif: string;
  periode: string; // "Janvier 2026"
}

export interface FaitMarquant {
  id: string;
  type: 'realisation' | 'attention' | 'alerte';
  titre: string;
  description: string;
  axe?: AxeType;
  date?: string;
  impact?: 'positif' | 'neutre' | 'negatif';
}

export interface FaitsMarquantsData {
  realisations: FaitMarquant[];
  attentions: FaitMarquant[];
  alertes: FaitMarquant[];
  periode: string;
}

// Section 2 - Analyse par Axe
export interface TableauBordAxeRow {
  axe: AxeType;
  label: string;
  color: string;
  meteo: MeteoNiveau;
  avancement: number;
  jalonsAtteints: number;
  jalonsTotal: number;
  actionsEnCours: number;
  actionsEnRetard: number;
  risquesCritiques: number;
  budgetConsomme: number;
  budgetPrevu: number;
  tendance: TendanceType;
  alertePrincipale?: string;
}

export interface DetailAxeData {
  axe: AxeType;
  label: string;
  color: string;
  meteo: MeteoNiveau;
  avancement: number;
  tendance: TendanceType;
  // Jalons
  jalons: {
    id: string;
    titre: string;
    date: string;
    statut: 'atteint' | 'en_cours' | 'a_venir' | 'en_danger' | 'depasse';
    responsable?: string;
  }[];
  // Actions
  actions: {
    id: string;
    titre: string;
    statut: 'termine' | 'en_cours' | 'planifie' | 'en_retard';
    avancement: number;
    dateFin: string;
    responsable?: string;
  }[];
  // Budget
  budget: {
    prevu: number;
    realise: number;
    ecart: number;
    pourcentage: number;
  };
  // Risques
  risques: {
    id: string;
    titre: string;
    score: number;
    niveau: 'critique' | 'majeur' | 'modere' | 'faible';
    tendance: TendanceType;
  }[];
  // Tableaux spécifiques par axe
  tableauSpecifique?: RecrutementTableauData | PipelineTableauData | BatimentsTableauData | BudgetTableauData | ChecklistTableauData;
  // Points clés du mois
  pointsCles: string[];
  // Focus M+1
  focusM1: string[];
}

// Tableaux spécifiques par axe
export interface RecrutementTableauData {
  type: 'recrutement';
  vagues: {
    vague: number;
    label: string;
    postes: number;
    recrutes: number;
    enCours: number;
    dateLimite: string;
    statut: 'termine' | 'en_cours' | 'planifie' | 'en_retard';
  }[];
  effectifActuel: number;
  effectifCible: number;
}

export interface PipelineTableauData {
  type: 'pipeline';
  pipeline: {
    enseigne: string;
    surface: number;
    statut: 'signe' | 'negociation' | 'loi' | 'prospect' | 'perdu';
    dateSignature?: string;
    loyer?: number;
  }[];
  tauxCommercialisation: number;
  objectif: number;
}

export interface BatimentsTableauData {
  type: 'batiments';
  batiments: {
    nom: string;
    avancement: number;
    dateReception: string;
    reserves: number;
    reservesLevees: number;
    statut: 'livre' | 'en_cours' | 'planifie';
  }[];
  reservesTotales: number;
  reservesLeveesTotales: number;
}

export interface BudgetTableauData {
  type: 'budget';
  postes: {
    poste: string;
    prevu: number;
    realise: number;
    engage: number;
    ecart: number;
    statut: 'ok' | 'attention' | 'alerte';
  }[];
  totalPrevu: number;
  totalRealise: number;
  totalEngage: number;
}

export interface ChecklistTableauData {
  type: 'checklist';
  items: {
    categorie: string;
    item: string;
    responsable: string;
    dateLimite: string;
    statut: 'fait' | 'en_cours' | 'a_faire' | 'bloque';
  }[];
  progression: number;
}

// Section 3 - Suivi des Risques
export interface Top5RisquesData {
  risques: {
    id: string;
    code: string;
    titre: string;
    description: string;
    score: number;
    scoreEvolution: number; // différence avec le mois précédent
    probabilite: number;
    impact: number;
    niveau: 'critique' | 'majeur' | 'modere' | 'faible';
    axe: AxeType;
    proprietaire: string;
    mitigationPrincipale: string;
    statutMitigation: 'efficace' | 'en_cours' | 'a_lancer' | 'inefficace';
    tendance: TendanceType;
  }[];
  scoreGlobalRisques: number;
  tendanceGlobale: TendanceType;
}

export interface RisquesEvolutionData {
  nouveaux: {
    id: string;
    code: string;
    titre: string;
    score: number;
    axe: AxeType;
    dateIdentification: string;
  }[];
  fermes: {
    id: string;
    code: string;
    titre: string;
    scoreFinal: number;
    axe: AxeType;
    dateFermeture: string;
    motif: string;
  }[];
  evolutionParNiveau: {
    niveau: 'critique' | 'majeur' | 'modere' | 'faible';
    moisPrecedent: number;
    moisActuel: number;
    evolution: number;
  }[];
}

// Section 4 - Décisions & Arbitrages
export interface DecisionArbitrageData {
  id: string;
  numero: number;
  objet: string;
  contexte: string;
  options: {
    option: string;
    avantages: string[];
    inconvenients: string[];
    cout?: number;
  }[];
  recommandation: string;
  urgence: UrgencyLevel;
  deadline: string;
  axe: AxeType;
  proprietaire: string;
  impactSiNonDecision: string;
  statut: 'en_attente' | 'approuve' | 'rejete' | 'reporte';
}

// Section 5 - Plan d'Action M+1
export interface ActionPrioritaireM1 {
  id: string;
  numero: number;
  action: string;
  axe: AxeType;
  responsable: string;
  dateLimite: string;
  priorite: 'critique' | 'haute' | 'moyenne';
  livrables: string[];
  risqueAssocie?: string;
}

export interface JalonM1 {
  id: string;
  jalonId: string;
  titre: string;
  date: string;
  axe: AxeType;
  responsable: string;
  criteres: string[];
  statut: 'en_danger' | 'a_surveiller' | 'on_track';
  actionsRequises: string[];
}

export interface PlanActionM1Data {
  actionsPrioritaires: ActionPrioritaireM1[];
  jalonsM1: JalonM1[];
  focusStrategique: string;
  periode: string;
}

// Section 6 - Annexes
export interface GanttSimplifiedData {
  jalons: {
    id: string;
    titre: string;
    dateDebut: string;
    dateFin: string;
    avancement: number;
    axe: AxeType;
    dependances: string[];
    estCritique: boolean;
    statut: 'atteint' | 'en_cours' | 'a_venir' | 'en_danger';
  }[];
  dateDebut: string;
  dateFin: string;
  dateActuelle: string;
}

export interface CourbeSData {
  points: {
    date: string;
    prevu: number;
    realise: number;
    engage: number;
  }[];
  budgetTotal: number;
  budgetConsomme: number;
  budgetEngage: number;
  spi: number; // Schedule Performance Index
  cpi: number; // Cost Performance Index
  eac: number; // Estimate At Completion
  vac: number; // Variance At Completion
}

// Structure complète du Deep Dive Mensuel V2
export interface DeepDiveMensuelV2 {
  id?: number;
  titre: string;
  projectName: string;
  periode: string;
  datePresentation: string;
  templateType: 'monthly_v2';

  // Section 1 - Synthèse
  meteoGlobale: MeteoGlobaleData;
  faitsMarquants: FaitsMarquantsData;

  // Section 2 - Analyse par Axe
  tableauBordAxes: TableauBordAxeRow[];
  detailsAxes: Record<AxeType, DetailAxeData>;

  // Section 3 - Risques
  top5Risques: Top5RisquesData;
  risquesEvolution: RisquesEvolutionData;

  // Section 4 - Décisions
  decisions: DecisionArbitrageData[];

  // Section 5 - Plan Action
  planActionM1: PlanActionM1Data;

  // Section 6 - Annexes
  gantt: GanttSimplifiedData;
  courbeS: CourbeSData;

  // Métadonnées
  sections: DeepDiveMensuelSection[];
  designSettings: DeepDiveDesignSettings;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: 'draft' | 'finalized' | 'presented' | 'archived';
}
