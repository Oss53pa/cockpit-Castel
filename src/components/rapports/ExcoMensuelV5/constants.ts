/**
 * EXCO Mensuel V5 — Design System & Configuration
 */

// ============================================================================
// COSMOS ANGRÉ DESIGN SYSTEM
// ============================================================================

export const C = {
  // Text — blue-gray
  navy: '#263238',
  navyLight: '#37474f',
  navyMid: '#2f3d47',
  // Brand
  gold: '#B8953F',
  goldLight: '#D4B366',
  goldBg: 'rgba(184, 149, 63, 0.08)',
  goldBorder: 'rgba(184, 149, 63, 0.25)',
  // Base
  white: '#FFFFFF',
  offWhite: '#fafbfc',
  // Grays — blue-gray palette
  gray50: '#fafbfc',
  gray100: '#f5f7f9',
  gray200: '#e8edf2',
  gray300: '#b0bec5',
  gray400: '#90a4ae',
  gray500: '#607d8b',
  gray600: '#546e7a',
  gray700: '#455a64',
  gray800: '#37474f',
  // Status — soft palette
  green: '#81c784',
  greenBg: '#e8f5e9',
  blue: '#64b5f6',
  blueBg: '#e3f2fd',
  orange: '#ffb74d',
  orangeBg: '#fff3e0',
  red: '#e57373',
  redBg: '#ffebee',
  yellow: '#ffd54f',
  yellowBg: '#fffde7',
  purple: '#b39ddb',
  purpleBg: '#ede7f6',
  pink: '#f48fb1',
  pinkBg: '#fce4ec',
  teal: '#80cbc4',
  tealBg: '#e0f2f1',
} as const;

// ============================================================================
// AXES V5 CONFIGURATION
// ============================================================================

export interface AxeV5Config {
  id: string;
  dbCode: string;
  label: string;
  labelCourt: string;
  icon: string;
  color: string;
}

export const AXES_V5: AxeV5Config[] = [
  { id: 'rh',           dbCode: 'axe1_rh',           label: 'RH & Organisation',         labelCourt: 'RH',   icon: '○', color: C.red },
  { id: 'commercial',   dbCode: 'axe2_commercial',    label: 'Commercial & Leasing',      labelCourt: 'COM',  icon: '○', color: C.blue },
  { id: 'technique',    dbCode: 'axe3_technique',     label: 'Technique & Handover',      labelCourt: 'TECH', icon: '○', color: C.purple },
  { id: 'construction', dbCode: 'axe7_construction',  label: 'Construction',              labelCourt: 'CON',  icon: '○', color: C.orange },
  { id: 'budget',       dbCode: 'axe4_budget',        label: 'Budget & Finances',         labelCourt: 'BUD',  icon: '◇', color: C.yellow },
  { id: 'marketing',    dbCode: 'axe5_marketing',     label: 'Marketing & Communication', labelCourt: 'MKT',  icon: '○', color: C.pink },
  { id: 'exploitation', dbCode: 'axe6_exploitation',  label: 'Exploitation & Juridique',  labelCourt: 'EXP',  icon: '○', color: C.teal },
  { id: 'divers',       dbCode: 'axe8_divers',        label: 'Divers & Transverse',       labelCourt: 'DIV',  icon: '○', color: C.gray500 },
];

// ============================================================================
// SLIDE LIST CONFIGURATION
// ============================================================================

export interface SlideConfig {
  id: string;
  number: number;
  title: string;
  section?: string;
  icon?: string;
}

export const SLIDES: SlideConfig[] = [
  { id: 'cover',         number: 1,  title: 'Page de garde',                      section: 'Ouverture' },
  { id: 'agenda',        number: 2,  title: 'Agenda',                             section: 'Ouverture' },
  { id: 'exec-summary',  number: 3,  title: 'Synthèse Exécutive & Faits Marquants', section: 'Synthèse' },
  { id: 'trajectory',    number: 4,  title: 'Trajectoire Projet',                section: 'Synthèse' },
  { id: 'critical-path', number: 5,  title: 'Chemin Critique',                   section: 'Synthèse' },
  { id: 'dashboard',     number: 6,  title: 'Tableau de Bord',                   section: 'KPIs' },
  { id: 'scorecard',     number: 7,  title: 'Scorecard Axes',                    section: 'KPIs' },
  { id: 'axe-rh',        number: 8,  title: 'RH & Organisation',                section: 'Axes' },
  { id: 'axe-commercial',number: 9,  title: 'Commercial & Leasing',             section: 'Axes' },
  { id: 'axe-technique', number: 10, title: 'Technique & Handover',             section: 'Axes' },
  { id: 'axe-construction', number: 11, title: 'Construction',                  section: 'Axes' },
  { id: 'axe-budget',    number: 12, title: 'Budget & Finances',                section: 'Axes' },
  { id: 'axe-marketing', number: 13, title: 'Marketing & Communication',        section: 'Axes' },
  { id: 'axe-exploitation', number: 14, title: 'Exploitation & Juridique',      section: 'Axes' },
  { id: 'axe-divers',    number: 15, title: 'Divers & Transverse',              section: 'Axes' },
  { id: 'sync',          number: 16, title: 'Sync Construction / Mobilisation', section: 'Transverse' },
  { id: 'risks',         number: 17, title: 'Risques Majeurs',                  section: 'Transverse' },
  { id: 'scenarios',     number: 18, title: 'Scénarios d\'Impact',              section: 'Décisions' },
  { id: 'decisions',     number: 19, title: 'Décisions EXCO',                    section: 'Décisions' },
  { id: 'close',         number: 20, title: 'Clôture',                          section: 'Clôture' },
];

// ============================================================================
// METEO CONFIGURATION
// ============================================================================

export type MeteoLevel = 'bleu' | 'vert' | 'orange' | 'rouge';

export const METEO_CONFIG: Record<MeteoLevel, { label: string; color: string; bgColor: string; emoji: string }> = {
  bleu:   { label: 'Maîtrisé',  color: C.blue,   bgColor: C.blueBg,   emoji: '●' },
  vert:   { label: 'En bonne voie', color: C.green,  bgColor: C.greenBg,  emoji: '●' },
  orange: { label: 'Vigilance', color: C.orange, bgColor: C.orangeBg, emoji: '●' },
  rouge:  { label: 'Critique',  color: C.red,    bgColor: C.redBg,    emoji: '●' },
};

// ============================================================================
// EDITABLE FIELDS LOCALSTORAGE KEYS
// ============================================================================

export const LS_PREFIX = 'cockpit-exco-v5-';

export const LS_KEYS = {
  execSummaryMessages: `${LS_PREFIX}exec-summary`,
  highlights: `${LS_PREFIX}highlights`,
  axeAnalysis: (axeId: string) => `${LS_PREFIX}axe-analysis-${axeId}`,
  decisions: `${LS_PREFIX}decisions`,
  scenarios: `${LS_PREFIX}scenarios`,
  criticalPathNotes: `${LS_PREFIX}critical-path-notes`,
} as const;
