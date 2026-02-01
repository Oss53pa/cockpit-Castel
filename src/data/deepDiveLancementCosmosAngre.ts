// ============================================================================
// DEEP DIVE LANCEMENT - COSMOS ANGRÉ
// Validation Stratégique - New Heaven SA / CRMC
// ============================================================================

import type { Axe, ProjectPhase } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export type MeteoType = 'soleil' | 'soleil_nuage' | 'nuage' | 'pluie';

export interface MeteoAxe {
  axe: Axe;
  label: string;
  meteo: MeteoType;
  statut: string;
  commentaire?: string;
}

export interface ProjetInfo {
  nom: string;
  surfaceGLA: number;
  batiments: {
    code: string;
    nom: string;
  }[];
  softOpening: string;
  inauguration: string;
  occupationCible: number;
}

export interface OrganigrammePoste {
  poste: string;
  rattachement: string;
  niveau: number;
  mutualize?: boolean;
  description?: string;
}

export interface VagueRecrutementDD {
  vague: string;
  periode: string;
  postes: string;
  effectif: number;
}

export interface JalonCleDD {
  jalon: string;
  dateCible: string;
  statut: 'planifie' | 'en_cours' | 'atteint' | 'en_retard';
  responsable?: string;
}

export interface PointAttention {
  sujet: string;
  responsable: string;
  action: string;
}

export interface RisqueMajeur {
  rang: number;
  risque: string;
  probabilite: 'haute' | 'moyenne' | 'basse';
  impact: 'critique' | 'eleve' | 'moyen' | 'faible';
  mitigation: string;
}

export interface DecisionAttendue {
  numero: number;
  element: string;
  type: 'validation' | 'refus';
  statut: 'a_valider' | 'valide' | 'a_modifier' | 'refuse';
}

export interface ProchaineEtape {
  action: string;
  responsable: string;
  echeance: string;
}

export interface BudgetSynthese {
  nature: string;
  montant: number;
  type: 'CAPEX' | 'OPEX';
}

export interface BudgetMobilisationDetail {
  nature: string;
  montant: number;
  pourcentage: number;
}

export interface BudgetExploitationDetail {
  nature: string;
  montant: number;
}

export interface RatioBenchmark {
  indicateur: string;
  valeur: string;
  norme: string;
  statut: 'conforme' | 'attention' | 'critique';
}

export interface ModeleExploitation {
  prestation: string;
  mode: 'Externalisée' | 'Interne' | 'Mixte';
  effectif: string;
}

export interface DocumentJuridique {
  document: string;
  statut: 'pret' | 'en_cours' | 'a_lancer';
}

// ============================================================================
// DONNÉES PROJET
// ============================================================================

export const PROJET_INFO: ProjetInfo = {
  nom: 'Cosmos Angré',
  surfaceGLA: 16_856,
  batiments: [
    { code: 'CC', nom: 'Centre Commercial' },
    { code: 'BB1', nom: 'Big Box 1' },
    { code: 'BB2', nom: 'Big Box 2' },
    { code: 'BB3', nom: 'Big Box 3' },
    { code: 'BB4', nom: 'Big Box 4' },
    { code: 'ZE', nom: 'Zone Expo' },
    { code: 'MA', nom: 'Marché Artisanal' },
    { code: 'PK', nom: 'Parking' },
  ],
  softOpening: '2026-11-15',
  inauguration: '2026-12-15',
  occupationCible: 85,
};

// ============================================================================
// MÉTÉO PAR AXE
// ============================================================================

export const METEO_ICONS: Record<MeteoType, string> = {
  soleil: '☀️',
  soleil_nuage: '🌤️',
  nuage: '⛅',
  pluie: '🌧️',
};

export const METEO_PAR_AXE: MeteoAxe[] = [
  { axe: 'axe1_rh', label: 'RH & Organisation', meteo: 'soleil_nuage', statut: 'Organigramme à valider' },
  { axe: 'axe2_commercial', label: 'Commercial & Leasing', meteo: 'soleil', statut: 'Commercialisation démarrée 2024' },
  { axe: 'axe3_technique', label: 'Technique & Handover', meteo: 'soleil_nuage', statut: 'Préparation handover en cours' },
  { axe: 'axe4_budget', label: 'Budget & Finances', meteo: 'soleil_nuage', statut: 'Budgets à valider (ce Deep Dive)' },
  { axe: 'axe5_marketing', label: 'Marketing & Communication', meteo: 'soleil_nuage', statut: 'Identité marque à lancer' },
  { axe: 'axe6_exploitation', label: 'Exploitation & Juridique', meteo: 'soleil', statut: 'BEFA standard prêt' },
  { axe: 'axe7_construction', label: 'Construction', meteo: 'soleil_nuage', statut: 'Chantier en cours - Livraison Q4 2026' },
  { axe: 'divers' as Axe, label: 'Divers', meteo: 'soleil_nuage', statut: 'Dossier remboursement réhabilitation bassin rétention en cours' },
];

// ============================================================================
// AXE 1 - RH & ORGANISATION
// ============================================================================

export const ORGANIGRAMME: OrganigrammePoste[] = [
  { poste: 'DGA', rattachement: '-', niveau: 0, description: 'Direction Générale Adjointe' },
  { poste: 'Center Manager', rattachement: 'DGA', niveau: 1, description: 'Gestion opérationnelle du centre' },
  { poste: 'AFM (25%)', rattachement: 'DGA', niveau: 1, mutualize: true, description: 'Admin & Finance Manager - Mutualisé Yopougon' },
  { poste: 'MCM (25%)', rattachement: 'DGA', niveau: 1, mutualize: true, description: 'Marketing & Commercial Manager - Mutualisé Yopougon' },
  { poste: 'FSM', rattachement: 'Center Manager', niveau: 2, description: 'Facility & Security Manager' },
  { poste: 'AFT', rattachement: 'Center Manager', niveau: 2, description: 'Assistant Facility & Technique' },
  { poste: 'CTL', rattachement: 'Center Manager', niveau: 2, description: 'Chef Team Leaders' },
];

export const EFFECTIF_CIBLE = {
  total: 25,
  dedies: 23,
  mutualises: 2,
};

export const PLANNING_RECRUTEMENT: VagueRecrutementDD[] = [
  { vague: 'Existant', periode: '2024', postes: 'Center Manager', effectif: 1 },
  { vague: 'Vague 1', periode: 'Mars 2026', postes: 'Facility & Security Manager', effectif: 1 },
  { vague: 'Vague 2', periode: 'Juin 2026', postes: 'Team Leaders', effectif: 4 },
  { vague: 'Vague 3', periode: 'Sept 2026', postes: 'Seniors + Assistants', effectif: 9 },
  { vague: 'Vague 4', periode: 'Oct 2026', postes: 'Agents terrain', effectif: 8 },
  { vague: 'Mutualisés', periode: 'Juin 2026', postes: 'AFM + MCM (25%)', effectif: 2 },
];

export const COUT_MASSE_SALARIALE_2026 = 98_500_000;

// ============================================================================
// AXE 2 - COMMERCIAL & LEASING
// ============================================================================

export const COMMERCIAL_STATUS = {
  statut: 'en_avance',
  description: 'Commercialisation démarrée en 2024',
};

export const COMMERCIAL_KPIS = [
  { indicateur: 'Taux d\'occupation cible', cible: '85%', actuel: null },
  { indicateur: 'Nombre de BEFA signés', cible: null, actuel: null },
  { indicateur: 'Pipeline prospects', cible: null, actuel: null },
];

export const COMMERCIAL_ACTIONS = [
  'Finalisation des négociations locataires ancres',
  'Préparation des BEFA standards',
  'Relances prospects Big Box',
];

// ============================================================================
// AXE 3 - TECHNIQUE & HANDOVER
// ============================================================================

export const TECHNIQUE_STATUS = {
  statut: 'en_cours',
  description: 'Préparation handover en cours',
};

export const TECHNIQUE_JALONS: JalonCleDD[] = [
  { jalon: 'Réception provisoire', dateCible: '', statut: 'en_cours' },
  { jalon: 'Levée réserves', dateCible: '', statut: 'planifie' },
  { jalon: 'Réception définitive', dateCible: '', statut: 'planifie' },
  { jalon: 'Handover exploitation', dateCible: '2026-10-01', statut: 'planifie' },
];

export const TECHNIQUE_POINTS_ATTENTION: PointAttention[] = [
  { sujet: 'Planning constructeur', responsable: 'FM/DGA', action: 'Réunions hebdo' },
  { sujet: 'Réception provisoire', responsable: 'DGA', action: 'Coordination avec constructeur' },
  { sujet: 'Documentation technique', responsable: 'FSM', action: 'Collecte DOE' },
];

export const TECHNIQUE_RISQUE_PRINCIPAL = {
  risque: 'Retard chantier',
  mitigation: 'Réunions hebdo + pénalités contractuelles',
};

// ============================================================================
// AXE 4 - BUDGET & FINANCES
// ============================================================================

export const BUDGET_SYNTHESE_2026: BudgetSynthese[] = [
  { nature: 'Mobilisation', montant: 390_000_000, type: 'CAPEX' },
  { nature: 'Exploitation', montant: 200_000_000, type: 'OPEX' },
];

export const BUDGET_TOTAL_2026 = 590_000_000;

export const BUDGET_MOBILISATION_DETAILS: BudgetMobilisationDetail[] = [
  { nature: 'Infrastructure & Équipements', montant: 87_500_000, pourcentage: 22 },
  { nature: 'IT & Digital', montant: 73_200_000, pourcentage: 19 },
  { nature: 'Marque & Signalétique', montant: 78_500_000, pourcentage: 20 },
  { nature: 'Marketing & Communication', montant: 120_000_000, pourcentage: 31 },
  { nature: 'RH (Recrutement, Formation)', montant: 15_000_000, pourcentage: 4 },
  { nature: 'Contingence', montant: 25_500_000, pourcentage: 7 },
];

export const BUDGET_EXPLOITATION_DETAILS: BudgetExploitationDetail[] = [
  { nature: 'Masse salariale', montant: 98_500_000 },
  { nature: 'Prestations (Sécu + Nettoyage)', montant: 49_000_000 },
  { nature: 'Fluides & Énergies', montant: 28_000_000 },
  { nature: 'Autres + Contingence', montant: 24_500_000 },
];

export const BUDGET_RATIOS: RatioBenchmark[] = [
  { indicateur: 'Mobilisation/m²', valeur: '23 140 FCFA', norme: '20-30K', statut: 'conforme' },
  { indicateur: 'Exploitation/m² annualisé', valeur: '71 200 FCFA', norme: '60-80K', statut: 'conforme' },
];

// ============================================================================
// AXE 5 - MARKETING & COMMUNICATION
// ============================================================================

export const MARKETING_STATUS = {
  statut: 'en_preparation',
  description: 'Identité de marque à lancer',
};

export const MARKETING_JALONS: JalonCleDD[] = [
  { jalon: 'Brief agence identité', dateCible: 'J+14', statut: 'planifie' },
  { jalon: 'Validation charte graphique', dateCible: '', statut: 'planifie' },
  { jalon: 'Lancement teasing', dateCible: 'T3 2026', statut: 'planifie' },
  { jalon: 'Campagne ouverture', dateCible: 'Nov 2026', statut: 'planifie' },
];

export const MARKETING_BUDGET: BudgetExploitationDetail[] = [
  { nature: 'Identité & Signalétique', montant: 78_500_000 },
  { nature: 'Marketing & Communication', montant: 65_000_000 },
  { nature: 'Inauguration', montant: 55_000_000 },
];

export const MARKETING_BUDGET_TOTAL = 198_500_000;

export const MARKETING_PRIORITES = [
  'Définir positionnement marque vs Cosmos Yopougon',
  'Briefer agence créative',
  'Préparer plan média lancement',
];

// ============================================================================
// AXE 6 - EXPLOITATION & JURIDIQUE
// ============================================================================

export const EXPLOITATION_STATUS = {
  statut: 'ok',
  description: 'BEFA standard prêt',
};

export const MODELE_EXPLOITATION: ModeleExploitation[] = [
  { prestation: 'Sécurité', mode: 'Externalisée', effectif: '32 agents' },
  { prestation: 'Nettoyage', mode: 'Externalisée', effectif: '27 agents' },
  { prestation: 'Maintenance', mode: 'Mixte', effectif: 'Équipe FSM' },
];

export const DOCUMENTS_JURIDIQUES: DocumentJuridique[] = [
  { document: 'BEFA standard', statut: 'pret' },
  { document: 'Règlement intérieur', statut: 'en_cours' },
  { document: 'Contrats prestataires', statut: 'a_lancer' },
];

export const AVANTAGES_MODELE_EXTERNALISE = [
  'Flexibilité effectifs',
  'Transfert risque social',
  'Montée en charge progressive',
];

// ============================================================================
// RISQUES MAJEURS
// ============================================================================

export const RISQUES_MAJEURS: RisqueMajeur[] = [
  { rang: 1, risque: 'Retard chantier constructeur', probabilite: 'moyenne', impact: 'critique', mitigation: 'Réunions hebdo, pénalités' },
  { rang: 2, risque: 'Difficulté recrutement FM', probabilite: 'moyenne', impact: 'eleve', mitigation: 'Chasseur autorisé (2M)' },
  { rang: 3, risque: 'Retard BEFA locataires', probabilite: 'moyenne', impact: 'critique', mitigation: 'Relances, incentives' },
  { rang: 4, risque: 'Problème bassin rétention', probabilite: 'moyenne', impact: 'eleve', mitigation: 'Suivi Cheick' },
  { rang: 5, risque: 'Budget insuffisant', probabilite: 'basse', impact: 'eleve', mitigation: 'Contingences 5-7%' },
];

// ============================================================================
// DÉCISIONS ATTENDUES
// ============================================================================

export const DECISIONS_ATTENDUES: DecisionAttendue[] = [
  { numero: 1, element: 'Organigramme cible (25 personnes)', type: 'validation', statut: 'a_valider' },
  { numero: 2, element: 'Planning recrutement 4 vagues', type: 'validation', statut: 'a_valider' },
  { numero: 3, element: 'Budget Mobilisation : 390 M FCFA', type: 'validation', statut: 'a_valider' },
  { numero: 4, element: 'Budget Exploitation 2026 : 200 M FCFA', type: 'validation', statut: 'a_valider' },
  { numero: 5, element: 'Autorisation chasseur de têtes (2M)', type: 'validation', statut: 'a_valider' },
  { numero: 6, element: 'Mutualisation AFM/MCM avec Yopougon', type: 'validation', statut: 'a_valider' },
];

// ============================================================================
// PROCHAINES ÉTAPES
// ============================================================================

export const PROCHAINES_ETAPES: ProchaineEtape[] = [
  { action: 'Lancer recrutement FM', responsable: 'DGA', echeance: 'J+7' },
  { action: 'Briefer agence identité', responsable: 'Marketing', echeance: 'J+14' },
  { action: 'Planning réception constructeur', responsable: 'FM/DGA', echeance: '28/02/2026' },
  { action: 'Deep Dive Mensuel #1', responsable: 'DGA', echeance: '28/02/2026' },
];

// ============================================================================
// SIGNATURES
// ============================================================================

export const SIGNATAIRES = [
  { role: 'DGA', nom: 'Pamela Atokouna' },
  { role: 'PDG', nom: '' },
  { role: 'Représentant Actionnaires', nom: '' },
];

// ============================================================================
// CONFIGURATION SLIDES
// ============================================================================

export interface SlideConfig {
  id: string;
  numero: number;
  titre: string;
  section: 'intro' | 'axes' | 'risques' | 'decisions';
  axe?: Axe;
}

export const SLIDES_CONFIG: SlideConfig[] = [
  { id: 'slide_1', numero: 1, titre: 'Rappel Projet & Météo Globale', section: 'intro' },
  { id: 'slide_2', numero: 2, titre: 'AXE RH & Organisation', section: 'axes', axe: 'axe1_rh' },
  { id: 'slide_3', numero: 3, titre: 'AXE Commercial & Leasing', section: 'axes', axe: 'axe2_commercial' },
  { id: 'slide_4', numero: 4, titre: 'AXE Technique & Handover', section: 'axes', axe: 'axe3_technique' },
  { id: 'slide_5', numero: 5, titre: 'AXE Budget & Finances', section: 'axes', axe: 'axe4_budget' },
  { id: 'slide_6', numero: 6, titre: 'AXE Marketing & Communication', section: 'axes', axe: 'axe5_marketing' },
  { id: 'slide_7', numero: 7, titre: 'AXE Exploitation & Juridique', section: 'axes', axe: 'axe6_exploitation' },
  { id: 'slide_8', numero: 8, titre: 'Risques Majeurs', section: 'risques' },
  { id: 'slide_9', numero: 9, titre: 'Décisions Attendues', section: 'decisions' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getMeteoForAxe(axe: Axe): MeteoAxe | undefined {
  return METEO_PAR_AXE.find(m => m.axe === axe);
}

export function getMeteoIcon(meteo: MeteoType): string {
  return METEO_ICONS[meteo];
}

export function formatMontantFCFA(montant: number): string {
  if (montant >= 1_000_000_000) {
    return `${(montant / 1_000_000_000).toFixed(1)} Md`;
  }
  if (montant >= 1_000_000) {
    return `${(montant / 1_000_000).toFixed(0)} M`;
  }
  if (montant >= 1_000) {
    return `${(montant / 1_000).toFixed(0)} K`;
  }
  return montant.toString();
}

export function getProbabiliteColor(prob: 'haute' | 'moyenne' | 'basse'): string {
  switch (prob) {
    case 'haute': return 'text-red-600';
    case 'moyenne': return 'text-amber-600';
    case 'basse': return 'text-green-600';
  }
}

export function getImpactColor(impact: 'critique' | 'eleve' | 'moyen' | 'faible'): string {
  switch (impact) {
    case 'critique': return 'text-red-600';
    case 'eleve': return 'text-orange-600';
    case 'moyen': return 'text-amber-600';
    case 'faible': return 'text-green-600';
  }
}

export function getStatutIcon(statut: 'planifie' | 'en_cours' | 'atteint' | 'en_retard'): string {
  switch (statut) {
    case 'planifie': return '📅';
    case 'en_cours': return '🔄';
    case 'atteint': return '✅';
    case 'en_retard': return '⚠️';
  }
}

export function getDocumentStatutLabel(statut: 'pret' | 'en_cours' | 'a_lancer'): string {
  switch (statut) {
    case 'pret': return '✅ Prêt';
    case 'en_cours': return '🔄 En cours';
    case 'a_lancer': return '📅 À lancer T2';
  }
}
