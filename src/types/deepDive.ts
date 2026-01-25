// DeepDive Types for Journal

export type ProjectWeather = 'green' | 'yellow' | 'orange' | 'red';
export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';
export type AxeType = 'commercialisation' | 'technique' | 'exploitation' | 'juridique' | 'communication' | 'general';

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

export const AXES_CONFIG: Record<AxeType, { label: string; color: string; shortLabel: string }> = {
  commercialisation: { label: 'Commercialisation', color: '#3B82F6', shortLabel: 'COM' },
  technique: { label: 'Technique & Handover', color: '#8B5CF6', shortLabel: 'TECH' },
  exploitation: { label: 'Exploitation', color: '#10B981', shortLabel: 'EXPL' },
  juridique: { label: 'Juridique & Conformité', color: '#F59E0B', shortLabel: 'JUR' },
  communication: { label: 'Communication', color: '#EC4899', shortLabel: 'COMM' },
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
