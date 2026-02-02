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
// CONFIGURATION PROJET - COSMOS ANGRÉ
// Ces valeurs doivent être les seules sources de vérité pour tout le projet
// ============================================================================

export const PROJET_CONFIG = {
  // Identifiant unique du projet
  projectId: 'cosmos-angre',

  // Informations générales
  nom: 'COSMOS ANGRÉ',
  societe: 'CRMC / New Heaven SA',
  surfaceGLA: 45_000, // m²
  nombreBatiments: 8,
  occupationCible: 85, // %

  // Timeline du projet
  dateDebut: '2026-01-01',
  dateFin: '2027-02-28',

  // Jalons clés (dates cibles)
  jalonsClés: {
    softOpening: '2026-11-15',
    inauguration: '2026-12-15',
    finStabilisation: '2027-02-28',
  },

  // Phases du projet avec dates
  phases: [
    { code: 'PREPARATION', label: 'Phase 1: Préparation', dateDebut: '2026-01-01', dateFin: '2026-03-31' },
    { code: 'MOBILISATION', label: 'Phase 2: Mobilisation', dateDebut: '2026-04-01', dateFin: '2026-09-30' },
    { code: 'LANCEMENT', label: 'Phase 3: Lancement', dateDebut: '2026-10-01', dateFin: '2026-11-30' },
    { code: 'STABILISATION', label: 'Phase 4: Stabilisation', dateDebut: '2026-12-01', dateFin: '2027-02-28' },
  ],

  // Équipe
  presentateur: {
    nom: 'Pamela Atokouna',
    titre: 'DGA',
  },
  destinataires: ['PDG', 'Actionnaires'],
} as const;

// ============================================================================
// SEUILS DE PERFORMANCE - CALCUL MÉTÉO AUTOMATIQUE
// ============================================================================

export const SEUILS_METEO = {
  // Seuils de completion pour déterminer la météo d'un axe
  excellent: { completion: 0.95, actionsEnRetardMax: 0 },
  bon: { completion: 0.85, actionsEnRetardMax: 1 },
  attention: { completion: 0.70, actionsEnRetardMax: 3 },
  alerte: { completion: 0.50, actionsEnRetardMax: 5 },
  // En dessous de alerte = critique
} as const;

// ============================================================================
// SEUILS D'AFFICHAGE - UI
// ============================================================================

export const SEUILS_UI = {
  // Compte à rebours: jours restants pour changer la couleur
  compteARebours: {
    critique: 30,   // Rouge si < 30 jours
    attention: 90,  // Orange si < 90 jours
    // Vert sinon
  },

  // Nombre de jours pour "jalons à venir"
  jalonsAVenir: 30,

  // Nombre max d'éléments dans les listes (top N)
  topRisques: 5,
  topActions: 10,
  topJalons: 5,
} as const;

// ============================================================================
// CONFIGURATION AXES - POIDS ET COULEURS
// ============================================================================

export const AXES_CONFIG_FULL = {
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
