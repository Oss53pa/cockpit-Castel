// ============================================================================
// CONSTANTES PARTAGÉES - COSMOS ANGRÉ
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

// Axes stratégiques
export const AXES = {
  AXE1_RH: 'axe1_rh',
  AXE2_COMMERCIAL: 'axe2_commercial',
  AXE3_TECHNIQUE: 'axe3_technique',
  AXE4_BUDGET: 'axe4_budget',
  AXE5_MARKETING: 'axe5_marketing',
  AXE6_GOUVERNANCE: 'axe6_gouvernance',
} as const;

// Phases du projet
export const PHASES = {
  PREPARATION: 'preparation',
  MOBILISATION: 'mobilisation',
  LANCEMENT: 'lancement',
  EXPLOITATION: 'exploitation',
} as const;

// Codes bâtiments
export const BUILDING_CODES = {
  CC: 'CC',      // Centre Commercial
  BB1: 'BB1',    // Big Box 1
  BB2: 'BB2',    // Big Box 2
  BB3: 'BB3',    // Big Box 3
  BB4: 'BB4',    // Big Box 4
  ZE: 'ZE',      // Zone Expo
  MA: 'MA',      // Marché Artisanal
  PK: 'PK',      // Parking
} as const;
