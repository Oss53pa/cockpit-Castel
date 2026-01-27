import type { PhaseReference } from '@/types';

// ============================================================================
// KEYWORD -> PHASE MAPPING
// ============================================================================

type PhaseKey = 'construction' | 'mobilisation' | 'pre_ouverture' | 'cloture';

const PHASE_KEY_TO_REF: Record<PhaseKey, PhaseReference> = {
  construction: 'dateDebutConstruction',
  mobilisation: 'dateDebutMobilisation',
  pre_ouverture: 'dateSoftOpening',
  cloture: 'dateFinMobilisation',
};

const PHASE_KEYWORDS: Record<PhaseKey, string[]> = {
  construction: [
    'travaux', 'chantier', 'construction', 'bâtiment', 'batiment',
    'fondation', 'structure', 'gros oeuvre', 'gros œuvre', 'terrassement',
    'maçonnerie', 'maconnerie', 'coffrage', 'ferraillage', 'béton', 'beton',
  ],
  mobilisation: [
    'commercialisation', 'bail', 'locataire', 'enseigne', 'négociation',
    'negociation', 'marketing', 'recrutement', 'commercial', 'prospect',
    'leasing', 'tenant', 'merchandising', 'branding', 'communication',
  ],
  pre_ouverture: [
    'soft opening', 'pré-ouverture', 'pre-ouverture', 'pre ouverture',
    'formation', 'test', 'essai', 'inauguration', 'aménagement',
    'amenagement', 'fit-out', 'fitout', 'fit out', 'décoration',
    'decoration', 'signalétique', 'signaletique', 'ouverture',
  ],
  cloture: [
    'clôture', 'cloture', 'fermeture', 'final', 'bilan',
    'réception définitive', 'reception definitive', 'levée de réserves',
    'levee de reserves', 'solde', 'garantie',
  ],
};

// ============================================================================
// AXE -> PHASE MAPPING (fallback)
// ============================================================================

const AXE_TO_PHASE: Record<string, PhaseKey> = {
  axe1_rh: 'mobilisation',
  axe2_commercial: 'mobilisation',
  axe3_technique: 'construction',
  axe4_budget: 'construction',
  axe5_marketing: 'pre_ouverture',
  axe6_exploitation: 'pre_ouverture',
};

// ============================================================================
// DURATION KEYWORDS
// ============================================================================

interface DurationRule {
  keywords: string[];
  days: number;
}

const DURATION_RULES: DurationRule[] = [
  { keywords: ['validation', 'signature', 'approbation', 'visa', 'accord'], days: 7 },
  { keywords: ['réunion', 'reunion', 'audit', 'inspection', 'contrôle', 'controle', 'revue'], days: 14 },
  { keywords: ['négociation', 'negociation', 'recrutement', 'embauche', 'sélection', 'selection'], days: 30 },
  { keywords: ['aménagement', 'amenagement', 'fit-out', 'fitout', 'décoration', 'decoration', 'installation'], days: 60 },
  { keywords: ['construction', 'commercialisation', 'travaux', 'chantier', 'gros oeuvre'], days: 90 },
];

const DEFAULT_DURATION = 14;

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function matchesKeywords(text: string, keywords: string[]): boolean {
  const normalized = normalizeText(text);
  return keywords.some((kw) => normalized.includes(normalizeText(kw)));
}

/**
 * Detect the project phase for a jalon based on its title and axe.
 * Returns the PhaseReference or null if undetectable.
 */
export function detectPhaseForJalon(jalon: {
  titre?: string;
  axe?: string;
}): PhaseReference | null {
  const text = jalon.titre || '';

  // 1. Try keyword matching on title
  for (const [phaseKey, keywords] of Object.entries(PHASE_KEYWORDS) as [PhaseKey, string[]][]) {
    if (matchesKeywords(text, keywords)) {
      return PHASE_KEY_TO_REF[phaseKey];
    }
  }

  // 2. Fallback to axe mapping
  if (jalon.axe) {
    const phaseKey = AXE_TO_PHASE[jalon.axe];
    if (phaseKey) {
      return PHASE_KEY_TO_REF[phaseKey];
    }
  }

  // 3. Default to Mobilisation
  return PHASE_KEY_TO_REF.mobilisation;
}

/**
 * Detect the project phase for an action based on its title and axe.
 * Returns the PhaseReference or null if undetectable.
 */
export function detectPhaseForAction(action: {
  titre?: string;
  axe?: string;
}): PhaseReference | null {
  const text = action.titre || '';

  // 1. Try keyword matching on title
  for (const [phaseKey, keywords] of Object.entries(PHASE_KEYWORDS) as [PhaseKey, string[]][]) {
    if (matchesKeywords(text, keywords)) {
      return PHASE_KEY_TO_REF[phaseKey];
    }
  }

  // 2. Fallback to axe mapping
  if (action.axe) {
    const phaseKey = AXE_TO_PHASE[action.axe];
    if (phaseKey) {
      return PHASE_KEY_TO_REF[phaseKey];
    }
  }

  // 3. Default to Mobilisation
  return PHASE_KEY_TO_REF.mobilisation;
}

/**
 * Calculate estimated duration in days based on action title keywords.
 */
export function calculateDureeEstimee(action: {
  titre?: string;
}): number {
  const text = action.titre || '';

  for (const rule of DURATION_RULES) {
    if (matchesKeywords(text, rule.keywords)) {
      return rule.days;
    }
  }

  return DEFAULT_DURATION;
}
