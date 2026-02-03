// ============================================================================
// TYPES BUDGET - COSMOS ANGRÉ
// Consolidation de tous les types liés au budget
// ============================================================================

import type { Axe, ProjectPhase } from './index';

// ============================================================================
// CATÉGORIES BUDGET
// ============================================================================

// Catégories générales (pour BudgetItem dans la base de données)
export const BUDGET_CATEGORIES = [
  'etudes',
  'travaux',
  'equipements',
  'honoraires',
  'assurances',
  'divers',
] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  etudes: 'Études',
  travaux: 'Travaux',
  equipements: 'Équipements',
  honoraires: 'Honoraires',
  assurances: 'Assurances',
  divers: 'Divers',
};

// Catégories d'exploitation (pour le budget opérationnel)
export const CATEGORIES_EXPLOITATION = [
  'masse_salariale',
  'prestations',
  'fluides',
  'assurances',
  'fonctionnement',
  'marketing',
  'provisions',
  'contingence',
] as const;
export type CategorieExploitation = (typeof CATEGORIES_EXPLOITATION)[number];

export const CATEGORIE_EXPLOITATION_LABELS: Record<CategorieExploitation, string> = {
  masse_salariale: 'Masse salariale',
  prestations: 'Prestations externalisées',
  fluides: 'Fluides & Énergies',
  assurances: 'Assurances',
  fonctionnement: 'Fonctionnement',
  marketing: 'Marketing & Communication',
  provisions: 'Provisions',
  contingence: 'Contingence',
};

export const CATEGORIE_EXPLOITATION_COLORS: Record<CategorieExploitation, string> = {
  masse_salariale: '#3B82F6',  // blue
  prestations: '#10B981',      // green
  fluides: '#F59E0B',          // amber
  assurances: '#8B5CF6',       // violet
  fonctionnement: '#EC4899',   // pink
  marketing: '#EF4444',        // red
  provisions: '#6366F1',       // indigo
  contingence: '#9CA3AF',      // gray
};

// Sous-catégories prestations
export const SOUS_CATEGORIES_PRESTATION = ['securite', 'nettoyage', 'maintenance'] as const;
export type SousCategoriePrestation = (typeof SOUS_CATEGORIES_PRESTATION)[number];

// ============================================================================
// INTERFACES BUDGET PRINCIPAL
// ============================================================================

/**
 * Item budgétaire stocké en base de données
 * parentId permet de créer des sous-lignes hiérarchiques
 */
export interface BudgetItem {
  id?: number;
  parentId?: number | null;  // null = ligne principale, number = sous-ligne
  libelle: string;
  categorie: BudgetCategory;
  axe: Axe;
  projectPhase?: ProjectPhase;
  montantPrevu: number;
  montantEngage: number;
  montantRealise: number;
  dateEngagement?: string;
  dateRealisation?: string;
  commentaire?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Synthèse budgétaire calculée
 */
export interface BudgetSynthese {
  prevu: number;
  engage: number;
  realise: number;
  reste: number;
  tauxEngagement: number;
  tauxRealisation: number;
  ecartEngagement: number;
  ecartRealisation: number;
}

/**
 * Budget par catégorie
 */
export interface BudgetParCategorie {
  categorie: BudgetCategory | CategorieExploitation;
  label: string;
  prevu: number;
  engage: number;
  realise: number;
  color?: string;
}

// ============================================================================
// INTERFACES BUDGET D'EXPLOITATION
// ============================================================================

/**
 * Grille salariale
 */
export interface GrilleSalariale {
  poste: string;
  brutMensuel: number;
  chargeMensuel: number; // brut + 25% charges
}

/**
 * Vague de recrutement
 */
export interface VagueRecrutement {
  vague: string;
  postes: string;
  effectif: number;
  debutMois: string;
  mois2026: number;
  coutTotal: number;
}

/**
 * Poste de prestation externalisée
 */
export interface PostePrestation {
  prestation: string;
  effectif?: number;
  coutUnitaireMensuel: number;
  mois: number;
  montant: number;
  statut?: string;
}

/**
 * Poste fluide/énergie
 */
export interface PosteFluide {
  poste: string;
  mensuelEstime?: number;
  consoAnnuelle?: string;
  tarif?: string;
  mois: number;
  montant: number;
}

/**
 * Poste assurance
 */
export interface PosteAssurance {
  type: string;
  primeAnnuelle: number;
  prorata2Mois?: number;
}

/**
 * Poste de fonctionnement
 */
export interface PosteFonctionnement {
  poste: string;
  mensuel: number;
  mois: number;
  montant: number;
}

/**
 * Poste marketing
 */
export interface PosteMarketing {
  poste: string;
  montant: number;
}

/**
 * Poste provision
 */
export interface PosteProvision {
  poste: string;
  montant: number;
}

/**
 * Poste opérationnel d'exploitation
 */
export interface PosteOperationnelExploitation {
  id: string;
  poste: string;
  budgetAnnuel: number;
  budgetMensuel: number;
  categorie: CategorieExploitation;
  details?: string;
}

/**
 * Budget d'exploitation annuel
 */
export interface BudgetExploitationAnnee {
  annee: number;
  periode: string;
  perimetre: string[];
  montantTotal: number;
  postes: PosteOperationnelExploitation[];
}

/**
 * Ratios et benchmarks
 */
export interface RatiosBenchmark {
  indicateur: string;
  valeur: string;
  benchmarkCI: string;
}

// ============================================================================
// INTERFACES BUDGET MOBILISATION
// ============================================================================

/**
 * Ligne budgétaire complète pour la mobilisation
 */
export interface LigneBudgetaireMobilisation {
  id: string;
  poste: string;
  categorie: string;
  sousCategorie?: string;
  budget: number;
  engage: number;
  consomme: number;
  reste: number;
  avancement: number;
  responsable: string;
  echeance?: string;
  statut: 'non_demarre' | 'en_cours' | 'termine' | 'en_attente';
  commentaire?: string;
}

/**
 * Catégorie de budget mobilisation
 */
export interface CategorieBudgetMobilisation {
  id: string;
  nom: string;
  icon: string;
  color: string;
  budget: number;
  engage: number;
  consomme: number;
  lignes: LigneBudgetaireMobilisation[];
}

// ============================================================================
// INTERFACES BUDGET PHASE (ESTIMATIF)
// ============================================================================

/**
 * Catégorie de budget par phase
 */
export interface BudgetCategorie {
  id: string;
  nom: string;
  budget: number;
  engage: number;
  consomme: number;
}

/**
 * Budget par phase projet
 */
export interface BudgetPhase {
  id: string;
  phase: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
  budgetTotal: number;
  engage: number;
  consomme: number;
  categories: BudgetCategorie[];
}

/**
 * Entrée de trésorerie
 */
export interface TresorerieEntry {
  mois: string;
  recettes: number;
  depenses: number;
  solde: number;
  cumul: number;
}

// ============================================================================
// INDICATEURS EVM (EARNED VALUE MANAGEMENT)
// ============================================================================

/**
 * Indicateurs de valeur acquise
 */
export interface EVMIndicators {
  PV: number;   // Planned Value - Valeur planifiée
  EV: number;   // Earned Value - Valeur acquise
  AC: number;   // Actual Cost - Coût réel
  BAC: number;  // Budget at Completion - Budget à l'achèvement
  SPI: number;  // Schedule Performance Index
  CPI: number;  // Cost Performance Index
  SV: number;   // Schedule Variance
  CV: number;   // Cost Variance
  EAC: number;  // Estimate at Completion
  ETC: number;  // Estimate to Complete
  VAC: number;  // Variance at Completion
}

/**
 * Status EVM
 */
export type EVMStatus = 'excellent' | 'bon' | 'attention' | 'critique';

export const EVM_STATUS_THRESHOLDS = {
  excellent: { min: 1.0, label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' },
  bon: { min: 0.9, label: 'Bon', color: 'text-blue-600', bg: 'bg-blue-100' },
  attention: { min: 0.8, label: 'Attention', color: 'text-orange-600', bg: 'bg-orange-100' },
  critique: { min: 0, label: 'Critique', color: 'text-red-600', bg: 'bg-red-100' },
};

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Format un montant en FCFA
 */
export function formatMontant(montant: number, compact = false): string {
  if (compact) {
    if (montant >= 1_000_000_000) {
      return `${(montant / 1_000_000_000).toFixed(1)}Mrd`;
    }
    if (montant >= 1_000_000) {
      return `${(montant / 1_000_000).toFixed(0)}M`;
    }
    if (montant >= 1_000) {
      return `${(montant / 1_000).toFixed(0)}K`;
    }
    return montant.toString();
  }
  if (montant === 0 || montant === null || montant === undefined) {
    return '0 FCFA';
  }
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant) + ' FCFA';
}

/**
 * Calcule le taux en pourcentage
 */
export function calculerTaux(partie: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((partie / total) * 100 * 10) / 10;
}

/**
 * Détermine le statut EVM basé sur un indice
 */
export function getEVMStatus(index: number): EVMStatus {
  if (index >= 1.0) return 'excellent';
  if (index >= 0.9) return 'bon';
  if (index >= 0.8) return 'attention';
  return 'critique';
}

// ============================================================================
// MAPPING CATÉGORIES
// ============================================================================

/**
 * Mapping des catégories d'exploitation vers les catégories budget DB
 */
export const CATEGORIE_MAPPING: Record<CategorieExploitation, BudgetCategory> = {
  masse_salariale: 'honoraires',
  prestations: 'travaux',
  fluides: 'divers',
  assurances: 'assurances',
  fonctionnement: 'divers',
  marketing: 'divers',
  provisions: 'divers',
  contingence: 'divers',
};

/**
 * Mapping des catégories vers les axes
 */
export const CATEGORIE_AXE_MAPPING: Record<CategorieExploitation, Axe> = {
  masse_salariale: 'axe1_rh',
  prestations: 'axe6_exploitation',
  fluides: 'axe6_exploitation',
  assurances: 'axe4_budget',
  fonctionnement: 'axe4_budget',
  marketing: 'axe5_marketing',
  provisions: 'axe4_budget',
  contingence: 'axe4_budget',
};
