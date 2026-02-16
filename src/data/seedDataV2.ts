// ============================================================================
// RÉFÉRENTIEL COMPLET — COSMOS ANGRÉ v4.0
// ============================================================================
// 8 Axes | 33 Jalons | 200 Actions
// Date : 09 Février 2026 | Soft Opening : 16/10/2026

import type { User, Jalon, Action, Axe, ProjectPhase, BuildingCode } from '@/types';
import { logger } from '@/lib/logger';

// ============================================================================
// MÉTADONNÉES DU PROJET
// ============================================================================

export const PROJECT_METADATA = {
  nom: 'COSMOS ANGRÉ',
  localisation: 'Angré, Abidjan, Côte d\'Ivoire',
  gla: 16_184,  // Surface locative brute (GLA) — ne pas confondre avec SHON (45 000)
  nombreBoutiques: { min: 100, max: 120 },
  placesParking: 1500,
  emploisCrees: { directs: 1200, indirects: 3000, total: 4200 },
  investissement: '85 milliards FCFA',
  certification: 'EDGE Advanced',
  proprietaire: 'CFAO Retail & Lifestyle',

  datesClePtojet: {
    kickoff: '2025-10-01',
    debutConstruction: '2024-01-01',
    debutMobilisation: '2026-01-01',
    softOpening: '2026-10-16',
    inauguration: '2026-11-15',
    finMobilisation: '2027-03-31',
  },

  objectifsOccupation: {
    softOpening: { date: '2026-10-16', tauxCible: 85 },
    inauguration: { date: '2026-11-15', tauxCible: 90 },
    moisPlus6: { date: '2027-04-16', tauxCible: 95 },
  },

  // Compteurs v4.0 (Soft Opening 16/10/2026)
  compteurs: {
    axes: 8,
    jalons: 33, // RH:3 + COM:4 + TECH:6 + BUD:3 + MKT:4 + EXP:4 + CON:6 + DIV:3
    actions: 193, // RH:31 + COM:25 + TECH:30 + BUD:11 + MKT:20 + EXP:20 + CON:42 + DIV:14
  },
};

// ============================================================================
// UTILISATEURS / RESPONSABLES
// ============================================================================

export const SEED_USERS: Omit<User, 'id'>[] = [
  // Administrateur
  { nom: 'ATOKOUNA', prenom: 'Pamela', email: 'patokouna@cosmos-angre.com', role: 'admin', createdAt: new Date().toISOString() },
  // Managers
  { nom: 'NTUMY', prenom: 'Deborah', email: 'dntumy@rocklanecapital.com', role: 'manager', createdAt: new Date().toISOString() },
  { nom: 'Timite', prenom: 'Hadja', email: 'htimite@cosmos-angre.com', role: 'manager', createdAt: new Date().toISOString() },
  { nom: 'Affian', prenom: 'Adele', email: 'aaffian@cosmos-angre.com', role: 'manager', createdAt: new Date().toISOString() },
  { nom: 'Guehi', prenom: 'Yvan', email: 'Yvankguehi@gmail.com', role: 'manager', createdAt: new Date().toISOString() },
  // Lecteurs
  { nom: 'Sanankoua', prenom: 'Cheick', email: 'Csanankoua@rocklanecapital.com', role: 'viewer', createdAt: new Date().toISOString() },
  { nom: 'Assie', prenom: 'Julien', email: 'jassie@rocklanecapital.com', role: 'viewer', createdAt: new Date().toISOString() },
  { nom: 'Keita', prenom: 'Mariam', email: 'mkeita@rocklanecapital.com', role: 'viewer', createdAt: new Date().toISOString() },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const now = new Date().toISOString();

function createJalon(
  id_jalon: string,
  titre: string,
  axe: Axe,
  date_prevue: string,
  responsable: string,
  description: string = '',
  projectPhase: ProjectPhase = 'phase2_mobilisation',
  buildingCode?: BuildingCode
): Omit<Jalon, 'id'> {
  // Calculer le statut en fonction de la date actuelle
  const today = new Date('2026-01-31');
  const datePrevue = new Date(date_prevue);
  const diffDays = Math.ceil((datePrevue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let statut: 'atteint' | 'en_cours' | 'a_venir' | 'en_retard' | 'annule' = 'a_venir';
  let avancement_prealables = 0;
  let date_reelle: string | null = null;
  let tendance: 'en_avance' | 'stable' | 'en_retard' = 'stable';
  let confiance_atteinte = 80;

  if (datePrevue < today) {
    // Jalon passé - atteint
    statut = 'atteint';
    avancement_prealables = 100;
    date_reelle = date_prevue;
    tendance = 'stable';
    confiance_atteinte = 100;
  } else if (diffDays <= 7) {
    // Jalon dans les 7 prochains jours - en cours
    statut = 'en_cours';
    avancement_prealables = 85;
    tendance = 'stable';
    confiance_atteinte = 90;
  } else if (diffDays <= 30) {
    // Jalon dans les 30 prochains jours
    statut = 'a_venir';
    avancement_prealables = 60;
    tendance = 'stable';
    confiance_atteinte = 85;
  } else {
    // Jalon lointain
    statut = 'a_venir';
    avancement_prealables = Math.max(0, 30 - Math.floor(diffDays / 30) * 5);
    tendance = 'stable';
    confiance_atteinte = 80;
  }

  return {
    id_jalon,
    code_wbs: `WBS-${id_jalon}`,
    titre,
    description: description || titre,
    axe,
    categorie: 'autre',
    type_jalon: 'managerial',
    niveau_importance: 'standard',
    buildingCode,
    projectPhase,
    date_prevue,
    date_reelle,
    heure_cible: null,
    fuseau_horaire: 'Africa/Abidjan',
    date_butoir_absolue: null,
    flexibilite: 'moyenne',
    alerte_j30: '',
    alerte_j15: '',
    alerte_j7: '',
    statut,
    avancement_prealables,
    confiance_atteinte,
    tendance,
    date_derniere_maj: now,
    maj_par: responsable,
    responsable,
    validateur: 'Pamela ATOKOUNA',
    contributeurs: [],
    parties_prenantes: [],
    escalade_niveau1: 'Manager',
    escalade_niveau2: 'Pamela ATOKOUNA',
    escalade_niveau3: 'Direction',
    predecesseurs: [],
    successeurs: [],
    actions_prerequises: [],
    chemin_critique: false,
    impact_retard: 'modere',
    cout_retard_jour: null,
    risques_associes: [],
    probabilite_atteinte: confiance_atteinte,
    plan_contingence: null,
    livrables: [],
    criteres_acceptation: [],
    budget_associe: null,
    budget_consomme: null,
    impact_financier_global: null,
    documents: [],
    lien_sharepoint: null,
    alertes_actives: true,
    canal_alerte: ['email'],
    frequence_rappel: 'hebdomadaire',
    notifier: [responsable],
    notes: null,
    commentaire_reporting: null,
    visibilite: ['copil'],
    version: 1,
    date_creation: now,
    cree_par: 'System',
    derniere_modification: now,
    modifie_par: 'System',
  };
}

// Type étendu pour stocker le jalonCode temporairement
type ActionWithJalonCode = Omit<Action, 'id'> & { _jalonCode?: string };

// Raccourcis responsables
const PA = 'Pamela ATOKOUNA';
const DN = 'Deborah NTUMY';
const HT = 'Hadja Timite';
const AA = 'Adele Affian';
const CS = 'Cheick Sanankoua';
const JA = 'Julien Assie';
const YG = 'Yvan Guehi';

interface ActionOpts {
  date_debut?: string;
  priorite?: 'critique' | 'haute' | 'moyenne' | 'basse';
  projectPhase?: ProjectPhase;
  buildingCode?: BuildingCode;
}

function createAction(
  id_action: string,
  titre: string,
  axe: Axe,
  date_fin_prevue: string,
  responsable: string,
  description: string = '',
  jalonCode?: string,
  projectPhaseOrOpts?: ProjectPhase | ActionOpts,
  buildingCode?: BuildingCode
): ActionWithJalonCode {
  // Parse options
  let projectPhase: ProjectPhase = 'phase2_mobilisation';
  let explicitDateDebut: string | undefined;
  let priorite: 'critique' | 'haute' | 'moyenne' | 'basse' = 'moyenne';

  if (typeof projectPhaseOrOpts === 'string') {
    projectPhase = projectPhaseOrOpts;
  } else if (projectPhaseOrOpts && typeof projectPhaseOrOpts === 'object') {
    projectPhase = projectPhaseOrOpts.projectPhase || 'phase2_mobilisation';
    buildingCode = projectPhaseOrOpts.buildingCode || buildingCode;
    explicitDateDebut = projectPhaseOrOpts.date_debut;
    priorite = projectPhaseOrOpts.priorite || 'moyenne';
  }

  const dateDebut = explicitDateDebut ? new Date(explicitDateDebut) : new Date(date_fin_prevue);
  if (!explicitDateDebut) dateDebut.setDate(dateDebut.getDate() - 14);

  // Calculer l'avancement et le statut en fonction de la date actuelle
  const today = new Date('2026-01-31');
  const dateFin = new Date(date_fin_prevue);
  const dateDebutAction = new Date(dateDebut);

  let avancement = 0;
  let statut: 'a_faire' | 'en_cours' | 'termine' | 'bloque' | 'annule' = 'a_faire';
  let sante: 'vert' | 'jaune' | 'orange' | 'rouge' | 'gris' = 'gris';
  let date_debut_reelle: string | null = null;
  let date_fin_reelle: string | null = null;

  if (dateFin < today) {
    // Action passée - terminée
    avancement = 100;
    statut = 'termine';
    sante = 'vert';
    date_debut_reelle = dateDebutAction.toISOString().split('T')[0];
    date_fin_reelle = date_fin_prevue;
  } else if (dateDebutAction <= today && dateFin >= today) {
    // Action en cours
    const totalDays = (dateFin.getTime() - dateDebutAction.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (today.getTime() - dateDebutAction.getTime()) / (1000 * 60 * 60 * 24);
    avancement = Math.min(90, Math.round((elapsedDays / totalDays) * 100));
    statut = 'en_cours';
    sante = avancement >= 50 ? 'vert' : 'jaune';
    date_debut_reelle = dateDebutAction.toISOString().split('T')[0];
  } else {
    // Action future
    avancement = 0;
    statut = 'a_faire';
    sante = 'gris';
  }

  return {
    id_action,
    code_wbs: `WBS-${id_action}`,
    titre,
    description: description || titre,
    axe,
    phase: 'execution',
    projectPhase,
    categorie: 'coordination',
    sous_categorie: null,
    type_action: 'tache',
    date_creation: now,
    date_debut_prevue: dateDebut.toISOString().split('T')[0],
    date_fin_prevue,
    date_debut_reelle,
    date_fin_reelle,
    duree_prevue_jours: 14,
    duree_reelle_jours: date_fin_reelle ? 14 : null,
    date_butoir: null,
    flexibilite: 'moyenne',
    alerte_j30: null,
    alerte_j15: null,
    alerte_j7: null,
    alerte_j3: null,
    responsable,
    responsableId: 1,
    approbateur: 'Pamela ATOKOUNA',
    consultes: [],
    informes: [],
    delegue: null,
    escalade_niveau1: 'Manager',
    escalade_niveau2: 'Pamela ATOKOUNA',
    escalade_niveau3: 'Direction',
    predecesseurs: [],
    successeurs: [],
    contraintes_externes: null,
    chemin_critique: false,
    jalonId: null,
    ressources_humaines: [responsable],
    charge_homme_jour: null,
    budget_prevu: null,
    budget_engage: null,
    budget_realise: null,
    ligne_budgetaire: null,
    livrables: [],
    criteres_acceptation: [],
    validateur_qualite: null,
    documents: [],
    lien_sharepoint: null,
    modele_document: null,
    statut,
    avancement,
    methode_avancement: 'manuel',
    tendance: 'stable',
    sante,
    notes_internes: null,
    commentaire_reporting: null,
    historique_commentaires: [],
    visibilite_reporting: ['copil'],
    risques_associes: [],
    problemes_ouverts: [],
    points_blocage: null,
    escalade_requise: false,
    niveau_escalade: null,
    priorite,
    score_priorite: null,
    impact_si_retard: priorite === 'critique' ? 'critique' : priorite === 'haute' ? 'majeur' : 'modere',
    version: 1,
    date_modification: now,
    modifie_par: 'System',
    motif_modification: null,
    buildingCode, // Code bâtiment (CC, BB1, etc.)
    _jalonCode: jalonCode, // Stocker temporairement pour le seed
  };
}

// ============================================================================
// AXE 1 : RH & ORGANISATION (20%) - 3 Jalons, 27 Actions
// ============================================================================

export const JALONS_AXE1_RH: Omit<Jalon, 'id'>[] = [
  createJalon('J-RH-1', 'Organigramme cible validé', 'axe1_rh', '2026-01-31', PA, '', 'phase1_preparation'),
  createJalon('J-RH-2', 'Recrutement', 'axe1_rh', '2026-10-05', PA, 'Toutes les vagues de recrutement'),
  createJalon('J-RH-3', 'Équipe 100% opérationnelle', 'axe1_rh', '2026-10-16', PA, '', 'phase3_lancement'),
];

export const ACTIONS_AXE1_RH: Omit<Action, 'id'>[] = [
  // J-RH-1 : Organigramme cible validé (06/01 → 31/01/2026)
  createAction('A-RH-1.1', 'Définir l\'organigramme cible', 'axe1_rh', '2026-01-25', PA, '', 'J-RH-1', { date_debut: '2026-01-06', projectPhase: 'phase1_preparation' }),
  createAction('A-RH-1.2', 'Définir les fiches de poste', 'axe1_rh', '2026-01-25', PA, '', 'J-RH-1', { date_debut: '2026-01-06', priorite: 'haute', projectPhase: 'phase1_preparation' }),
  createAction('A-RH-1.3', 'Établir le budget masse salariale', 'axe1_rh', '2026-01-25', PA, '', 'J-RH-1', { date_debut: '2026-01-13', priorite: 'haute', projectPhase: 'phase1_preparation' }),
  createAction('A-RH-1.4', 'Valider l\'organigramme avec la DG', 'axe1_rh', '2026-01-31', CS, '', 'J-RH-1', { date_debut: '2026-01-26', priorite: 'critique', projectPhase: 'phase1_preparation' }),
  // J-RH-2 : Recrutement (01/02 → 05/10/2026)
  createAction('A-RH-2.1', 'Recruter le Center Manager', 'axe1_rh', '2026-02-28', CS, '', 'J-RH-2', { date_debut: '2026-02-01' }),
  createAction('A-RH-2.2', 'Recruter le Facility Services Manager', 'axe1_rh', '2026-03-15', PA, '', 'J-RH-2', { date_debut: '2026-02-01' }),
  createAction('A-RH-2.3', 'Recruter le Marketing Manager', 'axe1_rh', '2026-03-31', PA, '', 'J-RH-2', { date_debut: '2026-03-01' }),
  createAction('A-RH-2.4', 'Recruter le Security Manager', 'axe1_rh', '2026-03-20', PA, '', 'J-RH-2', { date_debut: '2026-02-01' }),
  createAction('A-RH-2.5', 'Organiser les sessions d\'onboarding Vague 1', 'axe1_rh', '2026-03-31', PA, '', 'J-RH-2', { date_debut: '2026-03-15' }),
  createAction('A-RH-2.6', 'Recruter le Team Leader Sécurité', 'axe1_rh', '2026-04-30', PA, '', 'J-RH-2', { date_debut: '2026-04-01', priorite: 'haute' }),
  createAction('A-RH-2.7', 'Recruter le Team Leader Maintenance', 'axe1_rh', '2026-04-30', PA, '', 'J-RH-2', { date_debut: '2026-04-01', priorite: 'haute' }),
  createAction('A-RH-2.8', 'Recruter le Team Leader Nettoyage', 'axe1_rh', '2026-05-15', PA, '', 'J-RH-2', { date_debut: '2026-04-15', priorite: 'haute' }),
  createAction('A-RH-2.9', 'Définir les plannings et rotations', 'axe1_rh', '2026-05-20', PA, '', 'J-RH-2', { date_debut: '2026-05-01' }),
  createAction('A-RH-2.10', 'Lancer les formations encadrement', 'axe1_rh', '2026-05-31', PA, '', 'J-RH-2', { date_debut: '2026-05-15' }),
  createAction('A-RH-2.11', 'Recruter les superviseurs', 'axe1_rh', '2026-06-30', PA, '', 'J-RH-2', { date_debut: '2026-06-01' }),
  createAction('A-RH-2.12', 'Recruter les chefs d\'équipe', 'axe1_rh', '2026-06-30', PA, '', 'J-RH-2', { date_debut: '2026-06-01' }),
  createAction('A-RH-2.13', 'Recruter les assistants administratifs', 'axe1_rh', '2026-07-15', PA, '', 'J-RH-2', { date_debut: '2026-06-15' }),
  createAction('A-RH-2.14', 'Intégrer l\'équipe encadrement', 'axe1_rh', '2026-07-20', PA, '', 'J-RH-2', { date_debut: '2026-07-01' }),
  createAction('A-RH-2.15', 'Lancer les formations seniors', 'axe1_rh', '2026-07-31', PA, '', 'J-RH-2', { date_debut: '2026-07-15', priorite: 'haute' }),
  createAction('A-RH-2.16', 'Recruter les agents de sécurité', 'axe1_rh', '2026-08-31', PA, '', 'J-RH-2', { date_debut: '2026-08-01' }),
  createAction('A-RH-2.17', 'Recruter les agents techniques', 'axe1_rh', '2026-08-15', PA, '', 'J-RH-2', { date_debut: '2026-08-01' }),
  createAction('A-RH-2.18', 'Recruter les agents d\'accueil', 'axe1_rh', '2026-08-20', PA, '', 'J-RH-2', { date_debut: '2026-08-01' }),
  createAction('A-RH-2.19', 'Équiper les agents (uniformes, badges)', 'axe1_rh', '2026-09-05', PA, '', 'J-RH-2', { date_debut: '2026-08-15' }),
  createAction('A-RH-2.20', 'Former les équipes opérationnelles', 'axe1_rh', '2026-09-15', PA, '', 'J-RH-2', { date_debut: '2026-08-20' }),
  createAction('A-RH-2.21', 'Valider l\'effectif terrain', 'axe1_rh', '2026-09-15', PA, '', 'J-RH-2', { date_debut: '2026-09-10' }),
  createAction('A-RH-2.22', 'Recruter les agents complémentaires', 'axe1_rh', '2026-09-30', PA, '', 'J-RH-2', { date_debut: '2026-09-16' }),
  createAction('A-RH-2.23', 'Compléter les formations terrain', 'axe1_rh', '2026-10-05', PA, '', 'J-RH-2', { date_debut: '2026-09-25', priorite: 'haute' }),
  createAction('A-RH-2.24', 'Réaliser les évaluations période d\'essai', 'axe1_rh', '2026-10-05', PA, '', 'J-RH-2', { date_debut: '2026-10-01' }),
  // J-RH-3 : Équipe 100% opérationnelle (06/10 → 16/10/2026)
  createAction('A-RH-3.1', 'Stabiliser les équipes', 'axe1_rh', '2026-10-12', PA, '', 'J-RH-3', { date_debut: '2026-10-06', priorite: 'haute', projectPhase: 'phase3_lancement' }),
  createAction('A-RH-3.2', 'Briefer toutes les équipes pour l\'ouverture', 'axe1_rh', '2026-10-15', PA, '', 'J-RH-3', { date_debut: '2026-10-13', priorite: 'critique', projectPhase: 'phase3_lancement' }),
  createAction('A-RH-3.3', 'Valider l\'effectif complet et opérationnel', 'axe1_rh', '2026-10-16', PA, '', 'J-RH-3', { date_debut: '2026-10-15', priorite: 'critique', projectPhase: 'phase3_lancement' }),
];

// ============================================================================
// AXE 2 : COMMERCIAL & LEASING (25%) - 4 Jalons, 22 Actions
// ============================================================================

export const JALONS_AXE2_COMMERCIAL: Omit<Jalon, 'id'>[] = [
  createJalon('J-COM-1', 'BEFA Centre Commercial Signés', 'axe2_commercial', '2026-04-15', HT, 'Toutes les signatures BEFA'),
  createJalon('J-COM-2', 'Calendrier livraison Tenants', 'axe2_commercial', '2026-04-30', HT),
  createJalon('J-COM-3', 'BEFA Big Boxes signés', 'axe2_commercial', '2026-08-31', HT),
  createJalon('J-COM-4', 'Taux occupation ≥85%', 'axe2_commercial', '2026-10-16', DN, '', 'phase3_lancement'),
];

export const ACTIONS_AXE2_COMMERCIAL: Omit<Action, 'id'>[] = [
  // J-COM-1 : BEFA Centre Commercial (06/01 → 15/04/2026)
  createAction('A-COM-1.1', 'Définir le mix enseignes cible', 'axe2_commercial', '2026-02-05', CS, '', 'J-COM-1', { date_debut: '2026-01-06' }),
  createAction('A-COM-1.2', 'Établir la grille tarifaire', 'axe2_commercial', '2026-02-10', CS, '', 'J-COM-1', { date_debut: '2026-01-06' }),
  createAction('A-COM-1.3', 'Identifier les prospects prioritaires', 'axe2_commercial', '2026-02-15', CS, '', 'J-COM-1', { date_debut: '2026-01-06' }),
  createAction('A-COM-1.4', 'Préparer les documents commerciaux', 'axe2_commercial', '2026-02-10', PA, '', 'J-COM-1', { date_debut: '2026-01-06' }),
  createAction('A-COM-1.5', 'Valider la stratégie commerciale', 'axe2_commercial', '2026-02-28', CS, '', 'J-COM-1', { date_debut: '2026-02-16' }),
  createAction('A-COM-1.6', 'Mettre en place le pipeline CRM commercial', 'axe2_commercial', '2026-01-31', HT, '', 'J-COM-1', { date_debut: '2026-01-06', priorite: 'haute' }),
  createAction('A-COM-1.7', 'Signer les BEFA prioritaires (25%)', 'axe2_commercial', '2026-02-15', HT, '', 'J-COM-1', { date_debut: '2026-02-01' }),
  createAction('A-COM-1.8', 'Animer le pipeline commercial', 'axe2_commercial', '2026-04-15', HT, '', 'J-COM-1', { date_debut: '2026-02-16' }),
  createAction('A-COM-1.9', 'Organiser les visites site', 'axe2_commercial', '2026-03-31', HT, '', 'J-COM-1', { date_debut: '2026-02-16' }),
  createAction('A-COM-1.10', 'Préparer les dossiers locataires', 'axe2_commercial', '2026-04-15', AA, '', 'J-COM-1', { date_debut: '2026-03-16' }),
  createAction('A-COM-1.11', 'Signer les BEFA vague 2 (50%)', 'axe2_commercial', '2026-03-15', HT, '', 'J-COM-1', { date_debut: '2026-03-01' }),
  createAction('A-COM-1.12', 'Finaliser les négociations en cours', 'axe2_commercial', '2026-04-05', HT, '', 'J-COM-1', { date_debut: '2026-03-16' }),
  createAction('A-COM-1.13', 'Signer les derniers BEFA (100%)', 'axe2_commercial', '2026-04-15', HT, '', 'J-COM-1', { date_debut: '2026-04-01' }),
  // J-COM-2 : Calendrier livraison Tenants (16/03 → 30/04/2026)
  createAction('A-COM-2.1', 'Transmettre les cahiers des charges aux preneurs', 'axe2_commercial', '2026-03-30', HT, '', 'J-COM-2', { date_debut: '2026-03-16' }),
  createAction('A-COM-2.2', 'Planifier les livraisons preneurs', 'axe2_commercial', '2026-04-20', HT, '', 'J-COM-2', { date_debut: '2026-04-01' }),
  createAction('A-COM-2.3', 'Valider le calendrier de livraison avec les preneurs', 'axe2_commercial', '2026-04-30', DN, '', 'J-COM-2', { date_debut: '2026-04-21', priorite: 'critique' }),
  // J-COM-3 : BEFA Big Boxes signés (01/05 → 31/08/2026)
  createAction('A-COM-3.1', 'Négocier les conditions Big Boxes', 'axe2_commercial', '2026-06-30', HT, '', 'J-COM-3', { date_debut: '2026-05-01', priorite: 'critique' }),
  createAction('A-COM-3.2', 'Signer les BEFA Big Boxes', 'axe2_commercial', '2026-08-31', HT, '', 'J-COM-3', { date_debut: '2026-07-01', priorite: 'critique' }),
  createAction('A-COM-3.3', 'Accompagner les fit-out preneurs Big Boxes', 'axe2_commercial', '2026-08-31', DN, '', 'J-COM-3', { date_debut: '2026-07-01', priorite: 'haute' }),
  // J-COM-4 : Taux d'occupation ≥ 85% (01/09 → 16/10/2026)
  createAction('A-COM-4.1', 'Suivre le taux d\'occupation', 'axe2_commercial', '2026-10-10', HT, '', 'J-COM-4', { date_debut: '2026-09-01', projectPhase: 'phase3_lancement' }),
  createAction('A-COM-4.2', 'Accompagner les fit-out preneurs Centre Commercial', 'axe2_commercial', '2026-10-05', DN, '', 'J-COM-4', { date_debut: '2026-09-01', projectPhase: 'phase3_lancement' }),
  createAction('A-COM-4.3', 'Coordonner les livraisons preneurs', 'axe2_commercial', '2026-10-05', DN, '', 'J-COM-4', { date_debut: '2026-09-01', projectPhase: 'phase3_lancement' }),
  createAction('A-COM-4.4', 'Former et livrer les UC aux preneurs par vague', 'axe2_commercial', '2026-10-08', HT, '', 'J-COM-4', { date_debut: '2026-09-15', projectPhase: 'phase3_lancement' }),
  createAction('A-COM-4.5', 'Vérifier l\'opérationnalité preneurs', 'axe2_commercial', '2026-10-12', DN, '', 'J-COM-4', { date_debut: '2026-10-05', projectPhase: 'phase3_lancement' }),
  createAction('A-COM-4.6', 'Confirmer le taux d\'occupation ≥ 85%', 'axe2_commercial', '2026-10-16', DN, '', 'J-COM-4', { date_debut: '2026-10-13', priorite: 'critique', projectPhase: 'phase3_lancement' }),
];

// ============================================================================
// AXE 3 : TECHNIQUE & HANDOVER (20%) - 6 Jalons, 32 Actions
// ============================================================================

export const JALONS_AXE3_TECHNIQUE: Omit<Jalon, 'id'>[] = [
  createJalon('J-TECH-1', 'Phase A complétée (DOE)', 'axe3_technique', '2026-06-30', DN),
  createJalon('J-TECH-2', 'Tests techniques réussis', 'axe3_technique', '2026-08-31', DN),
  createJalon('J-TECH-3', 'Formations complétées', 'axe3_technique', '2026-09-15', DN),
  createJalon('J-TECH-4', 'Commission sécurité OK', 'axe3_technique', '2026-09-30', AA, '', 'phase3_lancement', 'CC'),
  createJalon('J-TECH-5', 'Suivi levées réserves', 'axe3_technique', '2026-10-05', AA, '', 'phase3_lancement', 'CC'),
  createJalon('J-TECH-6', 'Réceptions définitives', 'axe3_technique', '2026-10-16', DN, '', 'phase3_lancement', 'CC'),
];

export const ACTIONS_AXE3_TECHNIQUE: Omit<Action, 'id'>[] = [
  // J-TECH-1 : Phase A complétée — DOE collectés (01/02 → 30/06/2026)
  createAction('A-TECH-1.1', 'Consolider le planning travaux avec MOE', 'axe3_technique', '2026-02-28', DN, '', 'J-TECH-1', { date_debut: '2026-02-01' }),
  createAction('A-TECH-1.2', 'Établir le calendrier des OPR', 'axe3_technique', '2026-02-28', DN, '', 'J-TECH-1', { date_debut: '2026-02-01' }),
  createAction('A-TECH-1.3', 'Identifier les réserves prévisibles', 'axe3_technique', '2026-03-31', DN, '', 'J-TECH-1', { date_debut: '2026-03-01' }),
  createAction('A-TECH-1.4', 'Planifier les livraisons par lot', 'axe3_technique', '2026-04-30', DN, '', 'J-TECH-1', { date_debut: '2026-03-01' }),
  createAction('A-TECH-1.5', 'Valider le planning technique', 'axe3_technique', '2026-04-30', DN, '', 'J-TECH-1', { date_debut: '2026-04-01' }),
  createAction('A-TECH-1.6', 'Collecter les DOE par lot technique', 'axe3_technique', '2026-06-30', AA, '', 'J-TECH-1', { date_debut: '2026-05-01', priorite: 'critique' }),
  createAction('A-TECH-1.7', 'Constituer le dossier technique complet', 'axe3_technique', '2026-06-30', DN, '', 'J-TECH-1', { date_debut: '2026-06-15', priorite: 'haute' }),
  // J-TECH-2 : Tests techniques réussis (01/06 → 31/08/2026)
  createAction('A-TECH-2.1', 'Réceptionner le lot électricité', 'axe3_technique', '2026-06-15', AA, '', 'J-TECH-2', { date_debut: '2026-06-01' }),
  createAction('A-TECH-2.2', 'Réceptionner le lot climatisation', 'axe3_technique', '2026-06-20', AA, '', 'J-TECH-2', { date_debut: '2026-06-01' }),
  createAction('A-TECH-2.3', 'Réceptionner le lot SSI', 'axe3_technique', '2026-06-25', AA, '', 'J-TECH-2', { date_debut: '2026-06-10' }),
  createAction('A-TECH-2.4', 'Réceptionner le lot plomberie', 'axe3_technique', '2026-06-20', AA, '', 'J-TECH-2', { date_debut: '2026-06-10' }),
  createAction('A-TECH-2.5', 'Lever les réserves prioritaires lots techniques', 'axe3_technique', '2026-06-30', AA, '', 'J-TECH-2', { date_debut: '2026-06-15' }),
  createAction('A-TECH-2.6', 'Valider les réceptions techniques', 'axe3_technique', '2026-06-30', DN, '', 'J-TECH-2', { date_debut: '2026-06-25' }),
  createAction('A-TECH-2.7', 'Réceptionner les Big Box', 'axe3_technique', '2026-08-15', AA, '', 'J-TECH-2', { date_debut: '2026-07-01' }),
  createAction('A-TECH-2.8', 'Réceptionner le parking', 'axe3_technique', '2026-08-20', AA, '', 'J-TECH-2', { date_debut: '2026-07-01' }),
  createAction('A-TECH-2.9', 'Tester les équipements parking', 'axe3_technique', '2026-08-25', AA, '', 'J-TECH-2', { date_debut: '2026-08-15' }),
  createAction('A-TECH-2.10', 'Configurer les systèmes de contrôle d\'accès', 'axe3_technique', '2026-08-20', JA, '', 'J-TECH-2', { date_debut: '2026-08-01' }),
  createAction('A-TECH-2.11', 'Lever les réserves Big Box/Parking', 'axe3_technique', '2026-08-31', AA, '', 'J-TECH-2', { date_debut: '2026-08-15' }),
  createAction('A-TECH-2.12', 'Valider les réceptions Big Box/Parking', 'axe3_technique', '2026-08-31', DN, '', 'J-TECH-2', { date_debut: '2026-08-25' }),
  createAction('A-TECH-2.13', 'Réaliser les essais généraux', 'axe3_technique', '2026-08-31', AA, '', 'J-TECH-2', { date_debut: '2026-08-20' }),
  // J-TECH-3 : Formations complétées (01/08 → 15/09/2026)
  createAction('A-TECH-3.1', 'Former l\'équipe technique sur les installations', 'axe3_technique', '2026-08-31', AA, '', 'J-TECH-3', { date_debut: '2026-08-01', priorite: 'haute' }),
  createAction('A-TECH-3.2', 'Former aux systèmes de sécurité incendie', 'axe3_technique', '2026-09-10', AA, '', 'J-TECH-3', { date_debut: '2026-09-01', priorite: 'critique' }),
  createAction('A-TECH-3.3', 'Former aux procédures d\'exploitation technique', 'axe3_technique', '2026-09-15', DN, '', 'J-TECH-3', { date_debut: '2026-09-05', priorite: 'haute' }),
  createAction('A-TECH-3.4', 'Valider les compétences techniques acquises', 'axe3_technique', '2026-09-15', DN, '', 'J-TECH-3', { date_debut: '2026-09-10', priorite: 'critique' }),
  // J-TECH-4 : Commission sécurité OK (01/09 → 30/09/2026)
  createAction('A-TECH-4.1', 'Préparer le dossier commission sécurité', 'axe3_technique', '2026-09-15', AA, '', 'J-TECH-4', { date_debut: '2026-09-01', priorite: 'critique' }),
  createAction('A-TECH-4.2', 'Organiser la visite de la commission sécurité', 'axe3_technique', '2026-09-25', AA, '', 'J-TECH-4', { date_debut: '2026-09-16', priorite: 'critique' }),
  createAction('A-TECH-4.3', 'Obtenir l\'avis favorable commission sécurité', 'axe3_technique', '2026-09-30', AA, '', 'J-TECH-4', { date_debut: '2026-09-25' }),
  // J-TECH-5 : Suivi levées réserves (01/07 → 05/10/2026)
  createAction('A-TECH-5.1', 'Suivre la levée des réserves par lot', 'axe3_technique', '2026-09-30', AA, '', 'J-TECH-5', { date_debut: '2026-07-01', priorite: 'critique' }),
  createAction('A-TECH-5.2', 'Lever toutes les réserves bloquantes', 'axe3_technique', '2026-10-05', AA, '', 'J-TECH-5', { date_debut: '2026-10-01', projectPhase: 'phase3_lancement' }),
  // J-TECH-6 : Réceptions définitives (01/10 → 16/10/2026)
  createAction('A-TECH-6.1', 'Valider les réceptions techniques finales', 'axe3_technique', '2026-10-08', DN, '', 'J-TECH-6', { date_debut: '2026-10-01', priorite: 'critique', projectPhase: 'phase3_lancement' }),
  createAction('A-TECH-6.2', 'Signer les PV de réception définitive', 'axe3_technique', '2026-10-12', DN, '', 'J-TECH-6', { date_debut: '2026-10-08', priorite: 'critique', projectPhase: 'phase3_lancement' }),
  createAction('A-TECH-6.3', 'Valider la préparation technique globale', 'axe3_technique', '2026-10-16', DN, '', 'J-TECH-6', { date_debut: '2026-10-12', projectPhase: 'phase3_lancement' }),
];

// ============================================================================
// AXE 4 : BUDGET & PILOTAGE (10%) - 3 Jalons, 14 Actions
// ============================================================================

export const JALONS_AXE4_BUDGET: Omit<Jalon, 'id'>[] = [
  createJalon('J-BUD-1', 'Budget mobilisation validé', 'axe4_budget', '2026-02-16', PA, '', 'phase1_preparation'),
  createJalon('J-BUD-2', 'Budget exploitation validé', 'axe4_budget', '2026-02-16', PA, '', 'phase1_preparation'),
  createJalon('J-BUD-3', 'Suivi budget de Mobilisation', 'axe4_budget', '2026-11-16', DN, 'Suivi continu + Clôture', 'phase3_lancement'),
];

export const ACTIONS_AXE4_BUDGET: Omit<Action, 'id'>[] = [
  // J-BUD-1 : Budget mobilisation validé (06/01 → 16/02/2026)
  createAction('A-BUD-1.1', 'Consolider le budget de mobilisation', 'axe4_budget', '2026-01-31', PA, '', 'J-BUD-1', { date_debut: '2026-01-06', priorite: 'critique', projectPhase: 'phase1_preparation' }),
  createAction('A-BUD-1.2', 'Présenter et valider le budget mobilisation DG', 'axe4_budget', '2026-02-16', PA, '', 'J-BUD-1', { date_debut: '2026-02-01', priorite: 'critique', projectPhase: 'phase1_preparation' }),
  // J-BUD-2 : Budget exploitation validé (06/01 → 16/02/2026)
  createAction('A-BUD-2.1', 'Consolider le budget d\'exploitation An 1', 'axe4_budget', '2026-01-31', PA, '', 'J-BUD-2', { date_debut: '2026-01-06', priorite: 'critique', projectPhase: 'phase1_preparation' }),
  createAction('A-BUD-2.2', 'Présenter et valider le budget exploitation DG', 'axe4_budget', '2026-02-16', PA, '', 'J-BUD-2', { date_debut: '2026-02-01', priorite: 'critique', projectPhase: 'phase1_preparation' }),
  // J-BUD-3 : Suivi budget de Mobilisation (01/03 → 16/11/2026)
  createAction('A-BUD-3.1', 'Mettre en place le reporting mensuel budget', 'axe4_budget', '2026-03-15', PA, '', 'J-BUD-3', { date_debut: '2026-03-01', priorite: 'haute' }),
  createAction('A-BUD-3.2', 'Suivre les écarts budgétaires mensuels', 'axe4_budget', '2026-10-16', PA, '', 'J-BUD-3', { date_debut: '2026-03-01', priorite: 'haute' }),
  createAction('A-BUD-3.3', 'Préparer les revues budgétaires trimestrielles', 'axe4_budget', '2026-10-16', PA, '', 'J-BUD-3', { date_debut: '2026-03-01' }),
  createAction('A-BUD-3.4', 'Analyser les KPIs d\'exploitation', 'axe4_budget', '2026-11-15', HT, '', 'J-BUD-3', { date_debut: '2026-10-17', projectPhase: 'phase3_lancement' }),
  createAction('A-BUD-3.5', 'Ajuster les procédures', 'axe4_budget', '2026-11-10', HT, '', 'J-BUD-3', { date_debut: '2026-10-20', projectPhase: 'phase3_lancement' }),
  createAction('A-BUD-3.6', 'Valider la stabilisation', 'axe4_budget', '2026-11-16', DN, '', 'J-BUD-3', { date_debut: '2026-11-01', projectPhase: 'phase3_lancement' }),
  createAction('A-BUD-3.7', 'Documenter le REX projet', 'axe4_budget', '2026-10-30', DN, '', 'J-BUD-3', { date_debut: '2026-10-01' }),
  createAction('A-BUD-3.8', 'Archiver la documentation projet', 'axe4_budget', '2026-11-15', HT, '', 'J-BUD-3', { date_debut: '2026-10-01', projectPhase: 'phase3_lancement' }),
  createAction('A-BUD-3.9', 'Transférer la gestion opérationnelle au Center Manager', 'axe4_budget', '2026-11-16', DN, '', 'J-BUD-3', { date_debut: '2026-10-17', projectPhase: 'phase3_lancement' }),
  createAction('A-BUD-3.10', 'Clôturer le projet mobilisation', 'axe4_budget', '2026-11-16', DN, '', 'J-BUD-3', { date_debut: '2026-11-01', projectPhase: 'phase3_lancement' }),
];

// ============================================================================
// AXE 5 : MARKETING & COMMUNICATION (15%) - 4 Jalons, 19 Actions
// ============================================================================

export const JALONS_AXE5_MARKETING: Omit<Jalon, 'id'>[] = [
  createJalon('J-MKT-1', 'Phase 1 : Planification stratégique', 'axe5_marketing', '2026-02-15', YG, 'Période Jan-Fév', 'phase1_preparation'),
  createJalon('J-MKT-2', 'Phase 2 : Développement et mise en œuvre', 'axe5_marketing', '2026-05-31', YG, 'Période Mars-Mai'),
  createJalon('J-MKT-3', 'Phase 3 : Préparation inauguration', 'axe5_marketing', '2026-09-15', YG, 'Période Juin-Sept'),
  createJalon('J-MKT-4', 'Phase 4 : Inauguration et post-lancement', 'axe5_marketing', '2026-11-16', YG, 'Période Oct-Nov', 'phase3_lancement'),
];

export const ACTIONS_AXE5_MARKETING: Omit<Action, 'id'>[] = [
  // J-MKT-1 : Phase 1 — Planification stratégique (06/01 → 15/02/2026)
  createAction('A-MKT-1.1', 'Réaliser l\'étude de positionnement marché', 'axe5_marketing', '2026-01-31', YG, '', 'J-MKT-1', { date_debut: '2026-01-06', priorite: 'haute', projectPhase: 'phase1_preparation' }),
  createAction('A-MKT-1.2', 'Valider la stratégie marketing globale', 'axe5_marketing', '2026-02-15', PA, '', 'J-MKT-1', { date_debut: '2026-02-01', priorite: 'critique', projectPhase: 'phase1_preparation' }),
  // J-MKT-2 : Phase 2 — Développement et mise en œuvre (16/02 → 31/05/2026)
  createAction('A-MKT-2.1', 'Valider l\'identité de marque', 'axe5_marketing', '2026-03-15', YG, '', 'J-MKT-2', { date_debut: '2026-02-16' }),
  createAction('A-MKT-2.2', 'Finaliser la charte graphique', 'axe5_marketing', '2026-03-27', YG, '', 'J-MKT-2', { date_debut: '2026-03-16', priorite: 'critique' }),
  createAction('A-MKT-2.3', 'Cartographier le parcours client', 'axe5_marketing', '2026-03-31', YG, '', 'J-MKT-2', { date_debut: '2026-03-01' }),
  createAction('A-MKT-2.4', 'Concevoir la signalétique intérieure/extérieure', 'axe5_marketing', '2026-04-30', YG, '', 'J-MKT-2', { date_debut: '2026-04-01' }),
  createAction('A-MKT-2.5', 'Rédiger le cahier des charges du site internet', 'axe5_marketing', '2026-04-30', YG, '', 'J-MKT-2', { date_debut: '2026-04-01' }),
  createAction('A-MKT-2.6', 'Définir la stratégie digitale et le calendrier éditorial', 'axe5_marketing', '2026-05-31', YG, '', 'J-MKT-2', { date_debut: '2026-05-01' }),
  // J-MKT-3 : Phase 3 — Préparation inauguration (01/06 → 15/09/2026)
  createAction('A-MKT-3.1', 'Développer le site internet', 'axe5_marketing', '2026-07-31', PA, '', 'J-MKT-3', { date_debut: '2026-06-01' }),
  createAction('A-MKT-3.2', 'Produire les kits réseaux sociaux', 'axe5_marketing', '2026-08-31', YG, '', 'J-MKT-3', { date_debut: '2026-07-01' }),
  createAction('A-MKT-3.3', 'Nouer les partenariats média', 'axe5_marketing', '2026-08-31', YG, '', 'J-MKT-3', { date_debut: '2026-07-01' }),
  createAction('A-MKT-3.4', 'Concevoir le programme de fidélité', 'axe5_marketing', '2026-09-15', YG, '', 'J-MKT-3', { date_debut: '2026-07-01' }),
  createAction('A-MKT-3.5', 'Élaborer le plan de communication lancement', 'axe5_marketing', '2026-09-15', YG, '', 'J-MKT-3', { date_debut: '2026-07-01' }),
  createAction('A-MKT-3.6', 'Lancer la campagne média teasing', 'axe5_marketing', '2026-09-15', YG, '', 'J-MKT-3', { date_debut: '2026-09-01' }),
  // J-MKT-4 : Phase 4 — Inauguration et post-lancement (16/09 → 16/11/2026)
  createAction('A-MKT-4.1', 'Installer la signalétique définitive', 'axe5_marketing', '2026-10-05', YG, '', 'J-MKT-4', { date_debut: '2026-09-16', projectPhase: 'phase3_lancement' }),
  createAction('A-MKT-4.2', 'Gérer la communication ouverture', 'axe5_marketing', '2026-10-20', YG, '', 'J-MKT-4', { date_debut: '2026-10-10', projectPhase: 'phase3_lancement' }),
  createAction('A-MKT-4.3', 'Préparer l\'événement inauguration', 'axe5_marketing', '2026-11-10', YG, '', 'J-MKT-4', { date_debut: '2026-10-01', projectPhase: 'phase3_lancement' }),
  createAction('A-MKT-4.4', 'Inviter les VIP et officiels', 'axe5_marketing', '2026-11-05', PA, '', 'J-MKT-4', { date_debut: '2026-10-15', projectPhase: 'phase3_lancement' }),
  createAction('A-MKT-4.5', 'Préparer le dossier presse inauguration', 'axe5_marketing', '2026-11-10', YG, '', 'J-MKT-4', { date_debut: '2026-11-01', priorite: 'haute', projectPhase: 'phase3_lancement' }),
  createAction('A-MKT-4.6', 'Produire le rapport de perception marque', 'axe5_marketing', '2026-12-15', YG, '', 'J-MKT-4', { date_debut: '2026-11-17', projectPhase: 'phase4_stabilisation' }),
];

// ============================================================================
// AXE 6 : EXPLOITATION & SYSTÈMES (5%) - 4 Jalons, 13 Actions
// ============================================================================

export const JALONS_AXE6_EXPLOITATION: Omit<Jalon, 'id'>[] = [
  createJalon('J-EXP-1', 'Contrats prestataires signés', 'axe6_exploitation', '2026-08-31', DN),
  createJalon('J-EXP-2', 'Systèmes déployés (ERP, GMAO, CRM)', 'axe6_exploitation', '2026-09-30', DN),
  createJalon('J-EXP-3', 'Procédures d\'exploitation validées', 'axe6_exploitation', '2026-10-10', DN, '', 'phase3_lancement'),
  createJalon('J-EXP-4', 'Centre prêt à opérer', 'axe6_exploitation', '2026-10-16', PA, '', 'phase3_lancement'),
];

export const ACTIONS_AXE6_EXPLOITATION: Omit<Action, 'id'>[] = [
  // J-EXP-1 : Contrats prestataires signés (01/06 → 31/08/2026)
  createAction('A-EXP-1.1', 'Lancer AO sécurité/gardiennage', 'axe6_exploitation', '2026-06-30', DN, '', 'J-EXP-1', { date_debut: '2026-06-01' }),
  createAction('A-EXP-1.2', 'Lancer AO maintenance technique', 'axe6_exploitation', '2026-06-30', DN, '', 'J-EXP-1', { date_debut: '2026-06-01' }),
  createAction('A-EXP-1.3', 'Lancer l\'AO nettoyage et espaces verts', 'axe6_exploitation', '2026-06-30', DN, '', 'J-EXP-1', { date_debut: '2026-06-01' }),
  createAction('A-EXP-1.4', 'Analyser les offres et négocier', 'axe6_exploitation', '2026-08-15', DN, '', 'J-EXP-1', { date_debut: '2026-07-01' }),
  createAction('A-EXP-1.5', 'Signer les contrats prestataires', 'axe6_exploitation', '2026-08-31', PA, '', 'J-EXP-1', { date_debut: '2026-08-15' }),
  // J-EXP-2 : Systèmes déployés (01/08 → 30/09/2026)
  createAction('A-EXP-2.1', 'Configurer l\'ERP comptabilité & facturation', 'axe6_exploitation', '2026-08-31', JA, '', 'J-EXP-2', { date_debut: '2026-08-01' }),
  createAction('A-EXP-2.2', 'Déployer la GMAO', 'axe6_exploitation', '2026-09-15', DN, '', 'J-EXP-2', { date_debut: '2026-09-01' }),
  createAction('A-EXP-2.3', 'Déployer le CRM locataires', 'axe6_exploitation', '2026-09-25', HT, '', 'J-EXP-2', { date_debut: '2026-09-10' }),
  createAction('A-EXP-2.4', 'Tester les intégrations systèmes', 'axe6_exploitation', '2026-09-28', JA, '', 'J-EXP-2', { date_debut: '2026-09-20' }),
  createAction('A-EXP-2.5', 'Former les utilisateurs aux systèmes', 'axe6_exploitation', '2026-09-30', JA, '', 'J-EXP-2', { date_debut: '2026-09-25' }),
  // J-EXP-3 : Procédures d'exploitation validées (15/09 → 10/10/2026)
  createAction('A-EXP-3.1', 'Rédiger les procédures opérationnelles', 'axe6_exploitation', '2026-09-25', DN, '', 'J-EXP-3', { date_debut: '2026-09-15' }),
  createAction('A-EXP-3.2', 'Élaborer le plan de sécurité', 'axe6_exploitation', '2026-09-25', HT, '', 'J-EXP-3', { date_debut: '2026-09-15' }),
  createAction('A-EXP-3.3', 'Adapter les procédures Yopougon pour Angré', 'axe6_exploitation', '2026-10-05', DN, '', 'J-EXP-3', { date_debut: '2026-09-25', projectPhase: 'phase3_lancement' }),
  createAction('A-EXP-3.4', 'Valider les procédures avec la DGA', 'axe6_exploitation', '2026-10-10', PA, '', 'J-EXP-3', { date_debut: '2026-10-05', projectPhase: 'phase3_lancement' }),
  // J-EXP-4 : Centre prêt à opérer (05/10 → 16/10/2026)
  createAction('A-EXP-4.1', 'Établir la check-list pré-ouverture', 'axe6_exploitation', '2026-10-08', DN, '', 'J-EXP-4', { date_debut: '2026-10-05', projectPhase: 'phase3_lancement' }),
  createAction('A-EXP-4.2', 'Réaliser le test exploitation grandeur nature', 'axe6_exploitation', '2026-10-12', DN, '', 'J-EXP-4', { date_debut: '2026-10-08', projectPhase: 'phase3_lancement' }),
  createAction('A-EXP-4.3', 'Organiser la répétition générale', 'axe6_exploitation', '2026-10-14', HT, '', 'J-EXP-4', { date_debut: '2026-10-12', projectPhase: 'phase3_lancement' }),
  createAction('A-EXP-4.4', 'Tester les procédures d\'urgence', 'axe6_exploitation', '2026-10-14', HT, '', 'J-EXP-4', { date_debut: '2026-10-12', projectPhase: 'phase3_lancement' }),
  createAction('A-EXP-4.5', 'Activer tous les systèmes', 'axe6_exploitation', '2026-10-15', AA, '', 'J-EXP-4', { date_debut: '2026-10-14', projectPhase: 'phase3_lancement' }),
  createAction('A-EXP-4.6', 'Décider le Go/No-Go ouverture', 'axe6_exploitation', '2026-10-16', PA, '', 'J-EXP-4', { date_debut: '2026-10-15', priorite: 'critique', projectPhase: 'phase3_lancement' }),
  createAction('A-EXP-4.7', 'Piloter les premiers jours', 'axe6_exploitation', '2026-10-22', HT, '', 'J-EXP-4', { date_debut: '2026-10-17', projectPhase: 'phase3_lancement' }),
];

// ============================================================================
// AXE 7 : CONSTRUCTION (Suivi uniquement) - 6 Jalons, 42 Actions
// ============================================================================

export const JALONS_AXE7_CONSTRUCTION: Omit<Jalon, 'id'>[] = [
  createJalon('J-CON-1', 'Centre Commercial', 'axe7_construction', '2026-10-31', 'Constructeur', 'Synchronisé avec mobilisation', 'phase3_lancement', 'CC'),
  createJalon('J-CON-2', 'Market', 'axe7_construction', '2026-10-31', 'Constructeur', '', 'phase3_lancement', 'MKT'),
  createJalon('J-CON-3', 'Big Box 1 (BB1)', 'axe7_construction', '2026-10-31', 'Constructeur', '', 'phase3_lancement', 'BB1'),
  createJalon('J-CON-4', 'Big Box 2 (BB2)', 'axe7_construction', '2026-10-31', 'Constructeur', '', 'phase3_lancement', 'BB2'),
  createJalon('J-CON-5', 'Big Box 3 (BB3)', 'axe7_construction', '2026-10-31', 'Constructeur', '', 'phase3_lancement', 'BB3'),
  createJalon('J-CON-6', 'Big Box 4 (BB4)', 'axe7_construction', '2026-10-31', 'Constructeur', '', 'phase3_lancement', 'BB4'),
];

// Actions par bâtiment (7 phases identiques)
function createConstructionActions(batiment: string, code: string, buildingCode: BuildingCode): Omit<Action, 'id'>[] {
  return [
    createAction(`A-CON-${code}.1`, `Gros œuvre - ${batiment}`, 'axe7_construction', '2026-02-28', 'Constructeur', '', `J-CON-${code}`, 'phase1_preparation', buildingCode),
    createAction(`A-CON-${code}.2`, `Second œuvre - ${batiment}`, 'axe7_construction', '2026-04-30', 'Constructeur', '', `J-CON-${code}`, 'phase2_mobilisation', buildingCode),
    createAction(`A-CON-${code}.3`, `Lots techniques - ${batiment}`, 'axe7_construction', '2026-07-31', 'Constructeur', '', `J-CON-${code}`, 'phase2_mobilisation', buildingCode),
    createAction(`A-CON-${code}.4`, `Aménagement externe - ${batiment}`, 'axe7_construction', '2026-08-31', 'Constructeur', '', `J-CON-${code}`, 'phase2_mobilisation', buildingCode),
    createAction(`A-CON-${code}.5`, `Pré-réception - ${batiment}`, 'axe7_construction', '2026-09-30', 'Constructeur', '', `J-CON-${code}`, 'phase2_mobilisation', buildingCode),
    createAction(`A-CON-${code}.6`, `Réception provisoire - ${batiment}`, 'axe7_construction', '2026-10-31', 'Constructeur', '', `J-CON-${code}`, 'phase3_lancement', buildingCode),
    createAction(`A-CON-${code}.7`, `Réception définitive - ${batiment}`, 'axe7_construction', '2026-11-30', 'Constructeur', '', `J-CON-${code}`, 'phase3_lancement', buildingCode),
  ];
}

export const ACTIONS_AXE7_CONSTRUCTION: Omit<Action, 'id'>[] = [
  ...createConstructionActions('Centre Commercial', '1', 'CC'),
  ...createConstructionActions('Market', '2', 'MKT'),
  ...createConstructionActions('Big Box 1', '3', 'BB1'),
  ...createConstructionActions('Big Box 2', '4', 'BB2'),
  ...createConstructionActions('Big Box 3', '5', 'BB3'),
  ...createConstructionActions('Big Box 4', '6', 'BB4'),
];

// ============================================================================
// AXE 8 : DIVERSIFICATION (5%) - 3 Jalons, 12 Actions
// ============================================================================

export const JALONS_AXE8_DIVERSIFICATION: Omit<Jalon, 'id'>[] = [
  createJalon('J-DIV-1', 'Note de cadrage validée', 'axe8_divers', '2026-01-31', PA, 'Note de cadrage projet', 'phase1_preparation'),
  createJalon('J-DIV-2', 'Conformité admin/réglementaire', 'axe8_divers', '2026-10-10', PA, 'Autorisations, assurances, permis'),
  createJalon('J-DIV-3', 'Divers', 'axe8_divers', '2026-12-31', PA, 'Actions transverses en continu', 'phase4_stabilisation'),
];

export const ACTIONS_AXE8_DIVERSIFICATION: Omit<Action, 'id'>[] = [
  // J-DIV-1 : Note de cadrage projet validée (06/01 → 31/01/2026)
  createAction('A-DIV-1.1', 'Définir la gouvernance projet', 'axe8_divers', '2026-01-15', PA, '', 'J-DIV-1', { date_debut: '2026-01-06', projectPhase: 'phase1_preparation' }),
  createAction('A-DIV-1.2', 'Consolider le budget mobilisation', 'axe8_divers', '2026-01-20', PA, '', 'J-DIV-1', { date_debut: '2026-01-06', projectPhase: 'phase1_preparation' }),
  createAction('A-DIV-1.3', 'Établir le planning macro', 'axe8_divers', '2026-01-20', PA, '', 'J-DIV-1', { date_debut: '2026-01-06', projectPhase: 'phase1_preparation' }),
  createAction('A-DIV-1.4', 'Valider la note de cadrage', 'axe8_divers', '2026-01-31', PA, '', 'J-DIV-1', { date_debut: '2026-01-20', projectPhase: 'phase1_preparation' }),
  // J-DIV-2 : Conformité admin. et réglementaire (01/02 → 10/10/2026)
  createAction('A-DIV-2.1', 'Préparer le dossier de remboursement de financement', 'axe8_divers', '2026-10-10', PA, '', 'J-DIV-2', { date_debut: '2026-02-01' }),
  createAction('A-DIV-2.2', 'Identifier les besoins en assurance', 'axe8_divers', '2026-02-28', PA, '', 'J-DIV-2', { date_debut: '2026-02-01', priorite: 'haute' }),
  createAction('A-DIV-2.3', 'Souscrire les polices d\'assurance', 'axe8_divers', '2026-03-31', PA, '', 'J-DIV-2', { date_debut: '2026-03-01', priorite: 'haute' }),
  createAction('A-DIV-2.4', 'Identifier les autorisations administratives requises', 'axe8_divers', '2026-04-30', PA, '', 'J-DIV-2', { date_debut: '2026-03-01', priorite: 'haute' }),
  createAction('A-DIV-2.5', 'Préparer et déposer les demandes d\'autorisations', 'axe8_divers', '2026-06-30', PA, '', 'J-DIV-2', { date_debut: '2026-05-01', priorite: 'haute' }),
  createAction('A-DIV-2.6', 'Obtenir les autorisations administratives', 'axe8_divers', '2026-08-31', PA, '', 'J-DIV-2', { date_debut: '2026-07-01', priorite: 'haute' }),
  createAction('A-DIV-2.7', 'Signer les conventions pompiers/police', 'axe8_divers', '2026-08-31', PA, '', 'J-DIV-2', { date_debut: '2026-07-01', priorite: 'haute' }),
  createAction('A-DIV-2.8', 'Préparer le dossier de demande de permis d\'exploitation', 'axe8_divers', '2026-09-30', PA, '', 'J-DIV-2', { date_debut: '2026-09-01', priorite: 'critique' }),
  createAction('A-DIV-2.9', 'Obtenir le permis d\'exploitation', 'axe8_divers', '2026-10-10', PA, '', 'J-DIV-2', { date_debut: '2026-10-01', priorite: 'critique', projectPhase: 'phase3_lancement' }),
  // J-DIV-3 : Divers (01/02 → en continu)
  createAction('A-DIV-3.1', 'Prospecter les régies publicitaires', 'axe8_divers', '2026-12-31', PA, '', 'J-DIV-3', { date_debut: '2026-02-01' }),
  createAction('A-DIV-3.2', 'Obtenir l\'offre de JC Decaux', 'axe8_divers', '2026-12-31', PA, '', 'J-DIV-3', { date_debut: '2026-02-01' }),
];

// ============================================================================
// AGGREGATION - 33 JALONS, ~181 ACTIONS
// ============================================================================

export const ALL_JALONS: Omit<Jalon, 'id'>[] = [
  ...JALONS_AXE1_RH,             // 3 jalons
  ...JALONS_AXE2_COMMERCIAL,     // 4 jalons
  ...JALONS_AXE3_TECHNIQUE,      // 6 jalons
  ...JALONS_AXE4_BUDGET,         // 3 jalons
  ...JALONS_AXE5_MARKETING,      // 4 jalons
  ...JALONS_AXE6_EXPLOITATION,   // 4 jalons
  ...JALONS_AXE7_CONSTRUCTION,   // 6 jalons
  ...JALONS_AXE8_DIVERSIFICATION, // 3 jalons
];

export const ALL_ACTIONS: Omit<Action, 'id'>[] = [
  ...ACTIONS_AXE1_RH,             // 27 actions
  ...ACTIONS_AXE2_COMMERCIAL,     // 22 actions (was ~27, removed doublons)
  ...ACTIONS_AXE3_TECHNIQUE,      // 32 actions
  ...ACTIONS_AXE4_BUDGET,         // 14 actions
  ...ACTIONS_AXE5_MARKETING,      // 20 actions
  ...ACTIONS_AXE6_EXPLOITATION,   // 22 actions
  ...ACTIONS_AXE7_CONSTRUCTION,   // 42 actions
  ...ACTIONS_AXE8_DIVERSIFICATION, // 16 actions
];

// ============================================================================
// FONCTION DE SEED
// ============================================================================

import { db } from '@/db';
import {
  BUDGET_EXPLOITATION_2026,
  BUDGET_EXPLOITATION_2027,
} from './budgetExploitationCosmosAngre';
import type { BudgetItem } from '@/types';
import { CATEGORIE_MAPPING, CATEGORIE_AXE_MAPPING } from '@/types/budget.types';

/**
 * Seed la base de données de manière ADDITIVE (non-destructif)
 *
 * GARANTIES :
 * - N'efface JAMAIS les données existantes
 * - N'écrase JAMAIS les modifications des collaborateurs
 * - Conserve les imports manuels et données saisies
 * - Ajoute UNIQUEMENT les éléments qui n'existent pas encore
 *
 * VÉRIFICATION PAR IDENTIFIANT UNIQUE :
 * - Utilisateurs : email
 * - Jalons : id_jalon (ex: J-RH-1)
 * - Actions : id_action (ex: A-COM-1.1)
 * - Budget : libelle
 *
 * Si un élément existe déjà → SKIP (aucune modification)
 */
export async function seedDatabaseV2(): Promise<{
  usersCreated: number;
  usersSkipped: number;
  jalonsCreated: number;
  jalonsSkipped: number;
  actionsCreated: number;
  actionsSkipped: number;
  budgetCreated: number;
  budgetSkipped: number;
}> {
  const result = {
    usersCreated: 0,
    usersSkipped: 0,
    jalonsCreated: 0,
    jalonsSkipped: 0,
    actionsCreated: 0,
    actionsSkipped: 0,
    budgetCreated: 0,
    budgetSkipped: 0,
  };

  await db.transaction('rw', [db.users, db.jalons, db.actions, db.projectSettings, db.budget], async () => {
    // ========================================================================
    // UTILISATEURS - Vérifier par email (unique)
    // ========================================================================
    const existingUsers = await db.users.toArray();
    const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

    for (const user of SEED_USERS) {
      if (!existingEmails.has(user.email.toLowerCase())) {
        await db.users.add(user as User);
        result.usersCreated++;
      } else {
        result.usersSkipped++;
      }
    }

    // Récupérer tous les utilisateurs pour les références
    const users = await db.users.toArray();
    const userMap = new Map(users.map(u => [`${u.prenom} ${u.nom}`, u.id!]));

    // ========================================================================
    // JALONS - Vérifier par id_jalon (unique)
    // ========================================================================
    const existingJalons = await db.jalons.toArray();
    const existingJalonIds = new Set(existingJalons.map(j => j.id_jalon));

    for (const jalon of ALL_JALONS) {
      if (!existingJalonIds.has(jalon.id_jalon)) {
        await db.jalons.add(jalon as Jalon);
        result.jalonsCreated++;
      } else {
        result.jalonsSkipped++;
      }
    }

    // Récupérer tous les jalons pour les références
    const jalons = await db.jalons.toArray();
    const jalonMap = new Map(jalons.map(j => [j.id_jalon, j.id!]));

    // ========================================================================
    // ACTIONS - Vérifier par id_action (unique)
    // ========================================================================
    const existingActions = await db.actions.toArray();
    const existingActionIds = new Set(existingActions.map(a => a.id_action));

    for (const action of ALL_ACTIONS) {
      const actionWithCode = action as ActionWithJalonCode;

      if (!existingActionIds.has(actionWithCode.id_action)) {
        const jalonCode = actionWithCode._jalonCode;
        const jalonId = jalonCode ? jalonMap.get(jalonCode) || null : null;
        const responsableId = userMap.get(action.responsable) || 1;

         
        const { _jalonCode, ...actionData } = actionWithCode;

        await db.actions.add({
          ...actionData,
          jalonId,
          responsableId,
        } as Action);
        result.actionsCreated++;
      } else {
        result.actionsSkipped++;
      }
    }

    // ========================================================================
    // BUDGET - Vérifier par libelle (unique par année)
    // ========================================================================
    const existingBudget = await db.budget.toArray();
    const existingBudgetLabels = new Set(existingBudget.map(b => b.libelle));
    const now = new Date().toISOString();

    // Budget 2026
    // NOTE: montantEngage et montantRealise = 0 car budget non encore validé
    for (const poste of BUDGET_EXPLOITATION_2026.postes) {
      if (!existingBudgetLabels.has(poste.poste)) {
        const budgetItem: Omit<BudgetItem, 'id'> = {
          libelle: poste.poste,
          categorie: CATEGORIE_MAPPING[poste.categorie],
          axe: CATEGORIE_AXE_MAPPING[poste.categorie],
          projectPhase: 'phase2_mobilisation',
          montantPrevu: poste.budgetAnnuel,
          montantEngage: 0, // Budget non validé
          montantRealise: 0, // Budget non validé
          commentaire: poste.details || `Budget ${BUDGET_EXPLOITATION_2026.annee} - ${poste.categorie}`,
          createdAt: now,
          updatedAt: now,
        };
        await db.budget.add(budgetItem as BudgetItem);
        result.budgetCreated++;
      } else {
        result.budgetSkipped++;
      }
    }

    // Budget 2027
    for (const poste of BUDGET_EXPLOITATION_2027.postes) {
      const libelle2027 = `${poste.poste} (2027)`;
      if (!existingBudgetLabels.has(libelle2027)) {
        const budgetItem: Omit<BudgetItem, 'id'> = {
          libelle: libelle2027,
          categorie: CATEGORIE_MAPPING[poste.categorie],
          axe: CATEGORIE_AXE_MAPPING[poste.categorie],
          projectPhase: 'phase4_stabilisation',
          montantPrevu: poste.budgetAnnuel,
          montantEngage: 0,
          montantRealise: 0,
          commentaire: poste.details || `Budget ${BUDGET_EXPLOITATION_2027.annee} - ${poste.categorie}`,
          createdAt: now,
          updatedAt: now,
        };
        await db.budget.add(budgetItem as BudgetItem);
        result.budgetCreated++;
      } else {
        result.budgetSkipped++;
      }
    }

    // ========================================================================
    // SETTINGS - Créer seulement si n'existe pas
    // ========================================================================
    const existingSettings = await db.projectSettings.count();
    if (existingSettings === 0) {
      await db.projectSettings.add({
        projectId: 1,
        gla: PROJECT_METADATA.gla,
        nombreBoutiques: PROJECT_METADATA.nombreBoutiques,
        placesParking: PROJECT_METADATA.placesParking,
        emploisCrees: PROJECT_METADATA.emploisCrees,
        investissement: PROJECT_METADATA.investissement,
        certification: PROJECT_METADATA.certification,
        proprietaire: PROJECT_METADATA.proprietaire,
        localisation: PROJECT_METADATA.localisation,
        objectifsOccupation: PROJECT_METADATA.objectifsOccupation,
        phaseActuelle: 'phase2_mobilisation',
        datesClePtojet: {
          kickoff: PROJECT_METADATA.datesClePtojet.kickoff,
          softOpening: PROJECT_METADATA.datesClePtojet.softOpening,
          inauguration: PROJECT_METADATA.datesClePtojet.inauguration,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  });

  // ========================================================================
  // FIREBASE CONFIG - Initialiser si n'existe pas (hors transaction)
  // ========================================================================
  const existingFirebaseConfig = await db.secureConfigs.where('key').equals('firebase_config').first();
  if (!existingFirebaseConfig) {
    const firebaseConfig = {
      enabled: true,
      apiKey: 'AIzaSyDyKoEfaHikYC7FyxfNuo6L1jQOEC5Y9l0',
      authDomain: 'cockpit-project-management.firebaseapp.com',
      projectId: 'cockpit-project-management',
      storageBucket: 'cockpit-project-management.firebasestorage.app',
      messagingSenderId: '525943959593',
      appId: '1:525943959593:web:2f69e6d45c76ddf5846c38',
      measurementId: 'G-43WJ8SGNCH',
    };

    await db.secureConfigs.add({
      key: 'firebase_config',
      value: JSON.stringify(firebaseConfig),
      isEncrypted: true,
      createdAt: now,
      updatedAt: now,
    });

    // Aussi stocker dans localStorage pour accès synchrone
    localStorage.setItem('firebase_config', JSON.stringify(firebaseConfig));
  }

  return result;
}

/**
 * Alias pour seedDatabaseV2 - maintenant non-destructif
 * Ajoute uniquement les données manquantes sans effacer l'existant
 */
export async function resetAndSeedDatabase(): Promise<{
  usersCreated: number;
  usersSkipped: number;
  jalonsCreated: number;
  jalonsSkipped: number;
  actionsCreated: number;
  actionsSkipped: number;
  budgetCreated: number;
  budgetSkipped: number;
}> {
  return seedDatabaseV2();
}

/**
 * Seed uniquement les données budgétaires de manière ADDITIVE (non-destructif)
 *
 * GARANTIES :
 * - N'efface JAMAIS les données existantes
 * - N'écrase JAMAIS les modifications des collaborateurs
 * - Conserve les montants engagés et réalisés saisis
 * - Ajoute UNIQUEMENT les postes budgétaires qui n'existent pas encore
 *
 * VÉRIFICATION PAR IDENTIFIANT UNIQUE : libelle
 */
export async function seedBudgetOnly(): Promise<{ budgetCreated: number; budgetSkipped: number }> {
  const result = { budgetCreated: 0, budgetSkipped: 0 };
  const now = new Date().toISOString();

  await db.transaction('rw', [db.budget], async () => {
    // Récupérer les libellés existants pour éviter les doublons
    const existingBudget = await db.budget.toArray();
    const existingLabels = new Set(existingBudget.map(b => b.libelle));

    // Budget 2026 - ADDITIF uniquement
    for (const poste of BUDGET_EXPLOITATION_2026.postes) {
      if (!existingLabels.has(poste.poste)) {
        const budgetItem: Omit<BudgetItem, 'id'> = {
          libelle: poste.poste,
          categorie: CATEGORIE_MAPPING[poste.categorie],
          axe: CATEGORIE_AXE_MAPPING[poste.categorie],
          projectPhase: 'phase2_mobilisation',
          montantPrevu: poste.budgetAnnuel,
          montantEngage: 0,
          montantRealise: 0,
          commentaire: poste.details || `Budget ${BUDGET_EXPLOITATION_2026.annee} - ${poste.categorie}`,
          createdAt: now,
          updatedAt: now,
        };
        await db.budget.add(budgetItem as BudgetItem);
        result.budgetCreated++;
      } else {
        result.budgetSkipped++;
      }
    }

    // Budget 2027 - ADDITIF uniquement
    for (const poste of BUDGET_EXPLOITATION_2027.postes) {
      const libelle2027 = `${poste.poste} (2027)`;
      if (!existingLabels.has(libelle2027)) {
        const budgetItem: Omit<BudgetItem, 'id'> = {
          libelle: libelle2027,
          categorie: CATEGORIE_MAPPING[poste.categorie],
          axe: CATEGORIE_AXE_MAPPING[poste.categorie],
          projectPhase: 'phase4_stabilisation',
          montantPrevu: poste.budgetAnnuel,
          montantEngage: 0,
          montantRealise: 0,
          commentaire: poste.details || `Budget ${BUDGET_EXPLOITATION_2027.annee} - ${poste.categorie}`,
          createdAt: now,
          updatedAt: now,
        };
        await db.budget.add(budgetItem as BudgetItem);
        result.budgetCreated++;
      } else {
        result.budgetSkipped++;
      }
    }
  });

  // ========================================================================
  // MIGRATION - Mettre à jour les actions existantes avec buildingCode
  // ========================================================================
  await migrateActionsBuildingCode();

  // ========================================================================
  // AUTO-LIAISON RISQUES ↔ ACTIONS
  // Lier automatiquement les risques aux actions par correspondance sémantique
  // ========================================================================
  try {
    const { linkAllRisksToActions } = await import('@/lib/riskActionLinker');
    const linkResult = await linkAllRisksToActions();
    logger.info(`[seedDatabaseV2] Auto-liaison: ${linkResult.risquesLinked} risques liés, ${linkResult.totalLinks} liens`);
  } catch (e) {
    logger.warn('[seedDatabaseV2] Erreur auto-liaison risques:', e);
  }

  return result;
}

/**
 * Migration: Corrige responsableId sur toutes les actions et jalons.
 * Le seed initial hardcode responsableId: 1 dans createAction().
 * Cette migration remet le bon ID en matchant le champ texte `responsable`
 * contre la table users (prenom + nom).
 * Idempotente: ne modifie que si le responsableId actuel ne correspond pas au champ responsable.
 */
export async function migrateFixResponsableIds(): Promise<{ actionsFixed: number; jalonsFixed: number }> {
  const users = await db.users.toArray();
  const userMap = new Map(users.map(u => [`${u.prenom} ${u.nom}`, u.id!]));

  let actionsFixed = 0;
  let jalonsFixed = 0;

  // Fix actions
  const actions = await db.actions.toArray();
  for (const action of actions) {
    if (!action.responsable || !action.id) continue;
    const correctId = userMap.get(action.responsable);
    if (correctId && correctId !== action.responsableId) {
      await db.actions.update(action.id, { responsableId: correctId });
      actionsFixed++;
    }
  }

  // Fix jalons
  const jalons = await db.jalons.toArray();
  for (const jalon of jalons) {
    if (!jalon.responsable || !jalon.id) continue;
    const correctId = userMap.get(jalon.responsable);
    if (correctId && jalon.responsableId !== correctId) {
      await db.jalons.update(jalon.id, { responsableId: correctId });
      jalonsFixed++;
    }
  }

  return { actionsFixed, jalonsFixed };
}

/**
 * Migration: Ajoute buildingCode aux actions de construction existantes
 * basé sur leur id_action ou titre
 */
export async function migrateActionsBuildingCode(): Promise<number> {
  let updated = 0;

  const actions = await db.actions.toArray();

  for (const action of actions) {
    // Skip si déjà défini
    if (action.buildingCode) continue;

    let buildingCode: BuildingCode | undefined;

    // Détecter par id_action (A-CON-1.x = CC, A-CON-2.x = MKT, etc.)
    if (action.id_action?.startsWith('A-CON-1')) {
      buildingCode = 'CC';
    } else if (action.id_action?.startsWith('A-CON-2')) {
      buildingCode = 'MKT';
    } else if (action.id_action?.startsWith('A-CON-3')) {
      buildingCode = 'BB1';
    } else if (action.id_action?.startsWith('A-CON-4')) {
      buildingCode = 'BB2';
    } else if (action.id_action?.startsWith('A-CON-5')) {
      buildingCode = 'BB3';
    } else if (action.id_action?.startsWith('A-CON-6')) {
      buildingCode = 'BB4';
    }
    // Détecter par titre
    else if (action.titre?.toLowerCase().includes('centre commercial')) {
      buildingCode = 'CC';
    } else if (action.titre?.toLowerCase().includes('market')) {
      buildingCode = 'MKT';
    } else if (action.titre?.toLowerCase().includes('big box 1') || action.titre?.includes('BB1')) {
      buildingCode = 'BB1';
    } else if (action.titre?.toLowerCase().includes('big box 2') || action.titre?.includes('BB2')) {
      buildingCode = 'BB2';
    } else if (action.titre?.toLowerCase().includes('big box 3') || action.titre?.includes('BB3')) {
      buildingCode = 'BB3';
    } else if (action.titre?.toLowerCase().includes('big box 4') || action.titre?.includes('BB4')) {
      buildingCode = 'BB4';
    }

    if (buildingCode && action.id) {
      await db.actions.update(action.id, { buildingCode });
      updated++;
    }
  }

  logger.info(`[Migration] ${updated} actions mises à jour avec buildingCode`);
  return updated;
}

/**
 * Migration: Synchronise les données manquantes (responsable, avancement)
 * depuis PRODUCTION_DATA pour les actions qui ont ces champs vides ou à zéro.
 *
 * GARANTIES:
 * - Ne modifie PAS les champs déjà renseignés par l'utilisateur
 * - Met à jour UNIQUEMENT si responsable est vide OU avancement est 0 et statut est 'termine'
 */
export async function migrateActionsFromProductionData(): Promise<{ updated: number; skipped: number }> {
  let updated = 0;
  let skipped = 0;

  try {
    const { PRODUCTION_DATA } = await import('./cosmosAngreProductionData');

    if (!PRODUCTION_DATA?.actions?.length) {
      logger.info('[Migration] Pas de données PRODUCTION_DATA disponibles');
      return { updated: 0, skipped: 0 };
    }

    // Créer un index par id_action pour un accès rapide
    const productionActionsMap = new Map<string, any>();
    PRODUCTION_DATA.actions.forEach((a: any) => {
      if (a.id_action) {
        productionActionsMap.set(a.id_action, a);
      }
    });

    const dbActions = await db.actions.toArray();

    for (const action of dbActions) {
      const prodAction = productionActionsMap.get(action.id_action);
      if (!prodAction) {
        skipped++;
        continue;
      }

      const updates: Partial<Action> = {};
      let needsUpdate = false;

      // Synchroniser responsable si vide
      if (!action.responsable && prodAction.responsable) {
        updates.responsable = prodAction.responsable;
        needsUpdate = true;
      }

      // Synchroniser avancement si 0 ET que PRODUCTION_DATA a une valeur > 0
      // ET que le statut correspond (pour éviter de mettre 100% sur une action non terminée)
      if (action.avancement === 0 && prodAction.avancement > 0) {
        // Vérifier la cohérence statut/avancement
        if (action.statut === 'termine' && prodAction.avancement === 100) {
          updates.avancement = 100;
          needsUpdate = true;
        } else if (action.statut === prodAction.statut) {
          updates.avancement = prodAction.avancement;
          needsUpdate = true;
        }
      }

      // Synchroniser sante si 'gris' (non défini)
      if (action.sante === 'gris' && prodAction.sante && prodAction.sante !== 'gris') {
        updates.sante = prodAction.sante;
        needsUpdate = true;
      }

      if (needsUpdate && action.id) {
        await db.actions.update(action.id, updates);
        updated++;
      } else {
        skipped++;
      }
    }

    logger.info(`[Migration] ${updated} actions mises à jour depuis PRODUCTION_DATA, ${skipped} ignorées`);
  } catch (error) {
    logger.error('[Migration] Erreur lors de la migration depuis PRODUCTION_DATA:', error);
  }

  return { updated, skipped };
}

/**
 * Migration améliorée: synchronise l'avancement depuis PRODUCTION_DATA
 * en utilisant le titre + axe pour la correspondance (pas id_action qui peut différer)
 *
 * PRIORITÉ:
 * 1. Correspondance exacte par id_action
 * 2. Correspondance par titre + axe (normalized)
 *
 * MET À JOUR:
 * - avancement (si 0 dans DB et > 0 dans PRODUCTION_DATA)
 * - statut (pour cohérence avec avancement)
 * - sante (si 'gris' dans DB)
 */
export async function syncAvancementFromProductionData(): Promise<{ updated: number; skipped: number; matched: number }> {
  let updated = 0;
  let skipped = 0;
  let matched = 0;

  try {
    const { PRODUCTION_DATA } = await import('./cosmosAngreProductionData');

    if (!PRODUCTION_DATA?.actions?.length) {
      logger.info('[SyncAvancement] Pas de données PRODUCTION_DATA disponibles');
      return { updated: 0, skipped: 0, matched: 0 };
    }

    // Créer des index pour la correspondance
    const prodByIdAction = new Map<string, any>();
    const prodByTitreAxe = new Map<string, any>();

    PRODUCTION_DATA.actions.forEach((a: any) => {
      if (a.id_action) {
        prodByIdAction.set(a.id_action, a);
      }
      // Normaliser le titre pour la correspondance
      const key = `${normalizeTitle(a.titre)}|${a.axe}`;
      prodByTitreAxe.set(key, a);
    });

    const dbActions = await db.actions.toArray();

    for (const action of dbActions) {
      // Essayer d'abord par id_action
      let prodAction = prodByIdAction.get(action.id_action);

      // Sinon essayer par titre + axe
      if (!prodAction) {
        const key = `${normalizeTitle(action.titre)}|${action.axe}`;
        prodAction = prodByTitreAxe.get(key);
      }

      if (!prodAction) {
        skipped++;
        continue;
      }

      matched++;

      const updates: Partial<Action> = {};
      let needsUpdate = false;

      // Synchroniser avancement si 0 ET PRODUCTION_DATA a une valeur > 0
      if ((action.avancement === 0 || action.avancement === undefined) && prodAction.avancement > 0) {
        updates.avancement = prodAction.avancement;

        // Mettre à jour le statut pour cohérence
        if (prodAction.avancement === 100) {
          updates.statut = 'termine';
          updates.date_fin_reelle = action.date_fin_prevue;
        } else if (prodAction.avancement > 0) {
          updates.statut = 'en_cours';
          if (!action.date_debut_reelle) {
            updates.date_debut_reelle = action.date_debut_prevue;
          }
        }
        needsUpdate = true;
      }

      // Synchroniser sante si 'gris' (non défini)
      if (action.sante === 'gris' && prodAction.sante && prodAction.sante !== 'gris') {
        updates.sante = prodAction.sante;
        needsUpdate = true;
      }

      // Synchroniser responsable si vide
      if (!action.responsable && prodAction.responsable) {
        updates.responsable = prodAction.responsable;
        needsUpdate = true;
      }

      if (needsUpdate && action.id) {
        await db.actions.update(action.id, updates);
        updated++;
      }
    }

    logger.info(`[SyncAvancement] ${matched} actions trouvées, ${updated} mises à jour, ${skipped} non trouvées`);
  } catch (error) {
    logger.error('[SyncAvancement] Erreur:', error);
  }

  return { updated, skipped, matched };
}

/**
 * Normalise un titre pour la correspondance (lowercase, trim, remove accents)
 */
function normalizeTitle(title: string | undefined): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s]/g, '') // Garde uniquement lettres, chiffres, espaces
    .replace(/\s+/g, ' '); // Normalise les espaces
}

/**
 * Recalcule l'avancement de TOUTES les actions basé sur la DATE ACTUELLE
 *
 * Cette fonction met à jour l'avancement en fonction des dates prévues :
 * - Action terminée (date_fin_prevue < aujourd'hui) → 100%
 * - Action en cours (date_debut_prevue <= aujourd'hui < date_fin_prevue) → calculé
 * - Action future → 0%
 *
 * NE MODIFIE PAS les actions avec date_verrouillage_manuel définie
 */
export async function recalculateAllAvancement(): Promise<{ updated: number; skipped: number }> {
  let updated = 0;
  let skipped = 0;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    logger.info('[RecalculateAvancement] Date actuelle:', todayStr);

    const dbActions = await db.actions.toArray();
    logger.info('[RecalculateAvancement] Total actions en DB:', dbActions.length);

    // Debug: afficher les 3 premières actions
    if (dbActions.length > 0) {
      logger.info('[RecalculateAvancement] Exemple action:', {
        id: dbActions[0].id_action,
        titre: dbActions[0].titre,
        axe: dbActions[0].axe,
        avancement: dbActions[0].avancement,
        date_debut: dbActions[0].date_debut_prevue,
        date_fin: dbActions[0].date_fin_prevue,
      });
    }

    for (const action of dbActions) {
      // Ne pas modifier les actions verrouillées manuellement
      if ((action as any).date_verrouillage_manuel) {
        skipped++;
        continue;
      }

      // Ne pas modifier les actions spéciales utilisées comme KPIs
      // (leur avancement représente une valeur réelle, pas une progression basée sur dates)
      const isKpiAction =
        action.id_action?.includes('8.6') || // Action taux d'occupation
        action.titre?.toLowerCase().includes('taux') ||
        action.titre?.toLowerCase().includes('occupation') ||
        action.id_action?.startsWith('KPI-');

      if (isKpiAction) {
        skipped++;
        continue;
      }

      const dateFinPrevue = action.date_fin_prevue ? new Date(action.date_fin_prevue) : null;
      const dateDebutPrevue = action.date_debut_prevue ? new Date(action.date_debut_prevue) : null;

      if (!dateFinPrevue) {
        skipped++;
        continue;
      }

      dateFinPrevue.setHours(0, 0, 0, 0);
      if (dateDebutPrevue) dateDebutPrevue.setHours(0, 0, 0, 0);

      let newAvancement = 0;
      let newStatut: 'a_faire' | 'en_cours' | 'termine' = 'a_faire';
      let newSante: 'vert' | 'jaune' | 'orange' | 'rouge' | 'gris' = 'gris';

      if (dateFinPrevue < today) {
        // Action passée - terminée
        newAvancement = 100;
        newStatut = 'termine';
        newSante = 'vert';
      } else if (dateDebutPrevue && dateDebutPrevue <= today && dateFinPrevue >= today) {
        // Action en cours
        const totalDays = (dateFinPrevue.getTime() - dateDebutPrevue.getTime()) / (1000 * 60 * 60 * 24);
        const elapsedDays = (today.getTime() - dateDebutPrevue.getTime()) / (1000 * 60 * 60 * 24);
        newAvancement = Math.min(95, Math.max(5, Math.round((elapsedDays / totalDays) * 100)));
        newStatut = 'en_cours';
        newSante = newAvancement >= 50 ? 'vert' : 'jaune';
      } else {
        // Action future
        newAvancement = 0;
        newStatut = 'a_faire';
        newSante = 'gris';
      }

      // Mettre à jour seulement si différent
      if (action.avancement !== newAvancement || action.statut !== newStatut) {
        const updates: Partial<Action> = {
          avancement: newAvancement,
          statut: newStatut,
          sante: newSante,
        };

        if (newStatut === 'termine' && !action.date_fin_reelle) {
          updates.date_fin_reelle = action.date_fin_prevue;
        }
        if (newStatut === 'en_cours' && !action.date_debut_reelle) {
          updates.date_debut_reelle = action.date_debut_prevue;
        }

        if (action.id) {
          await db.actions.update(action.id, updates);
          updated++;
        }
      } else {
        skipped++;
      }
    }

    logger.info(`[RecalculateAvancement] ${updated} actions mises à jour, ${skipped} ignorées`);
  } catch (error) {
    logger.error('[RecalculateAvancement] Erreur:', error);
  }

  return { updated, skipped };
}

// ============================================================================
// MIGRATION v3.1 → v4.0  (Soft Opening 16/10/2026)
// ============================================================================
// RÈGLE ABSOLUE : ne JAMAIS modifier statut, avancement, responsableId,
// documents, sous_taches, notes_internes, commentaires_externes,
// historique_commentaires sur les actions existantes.
// ============================================================================

export const MIGRATION_V40_KEY = 'migration_v31_to_v40_v2_done';

/**
 * Reset propre des jalons et actions - Recrée uniquement les données v4.0
 * Utilise UNIQUEMENT ALL_JALONS (33) et ALL_ACTIONS (195)
 *
 * RÈGLES ABSOLUES :
 * - PRÉSERVER sur chaque action existante : statut, avancement (%), responsable,
 *   preuves, sous-tâches, notes, commentaires — NE RIEN TOUCHER
 * - CORRECTIONS AUTORISÉES : libellé (reformulation) + dates + jalonId + axe
 * - Matcher par TITRE NORMALISÉ pour retrouver les actions existantes
 */
export async function cleanResetJalonsActions(): Promise<{
  jalonsCreated: number;
  actionsCreated: number;
  actionsPreserved: number;
}> {
  logger.info('[cleanResetJalonsActions] Début du reset propre avec préservation par TITRE...');

  const result = {
    jalonsCreated: 0,
    actionsCreated: 0,
    actionsPreserved: 0,
  };

  // Récupérer ou créer le site par défaut
  let siteId = 1;
  const existingSite = await db.sites.toCollection().first();
  if (existingSite?.id) {
    siteId = existingSite.id;
  }

  // Récupérer les utilisateurs pour le mapping responsable
  const users = await db.users.toArray();
  const userMap = new Map(users.map(u => [`${u.prenom} ${u.nom}`, u.id!]));

  // 1. SAUVEGARDER les données utilisateur des actions existantes par TITRE NORMALISÉ
  const existingActions = await db.actions.toArray();
  const savedActionDataByTitle = new Map<string, {
    statut: string;
    avancement: number;
    responsableId: number | null;
    documents: unknown[];
    sous_taches: unknown[];
    notes_internes: string;
    commentaires_externes: string;
    historique_commentaires: unknown[];
    livrables: string;
    date_realisation: string | null;
    preuves: unknown[];
  }>();

  for (const action of existingActions) {
    const normTitle = normalizeTitle(action.titre);
    if (normTitle && !savedActionDataByTitle.has(normTitle)) {
      // Garder la première occurrence (celle avec l'id le plus bas = données utilisateur)
      savedActionDataByTitle.set(normTitle, {
        statut: action.statut || 'a_faire',
        avancement: action.avancement || 0,
        responsableId: action.responsableId || null,
        documents: (action as Record<string, unknown>).documents as unknown[] || [],
        sous_taches: (action as Record<string, unknown>).sous_taches as unknown[] || [],
        notes_internes: (action as Record<string, unknown>).notes_internes as string || '',
        commentaires_externes: (action as Record<string, unknown>).commentaires_externes as string || '',
        historique_commentaires: (action as Record<string, unknown>).historique_commentaires as unknown[] || [],
        livrables: (action as Record<string, unknown>).livrables as string || '',
        date_realisation: (action as Record<string, unknown>).date_realisation as string || null,
        preuves: (action as Record<string, unknown>).preuves as unknown[] || [],
      });
    }
  }
  logger.info(`[cleanResetJalonsActions] ${savedActionDataByTitle.size} actions sauvegardées par titre`);

  // 2. Sauvegarder les données utilisateur des jalons existants par TITRE NORMALISÉ
  const existingJalons = await db.jalons.toArray();
  const savedJalonDataByTitle = new Map<string, {
    statut: string;
    avancement: number;
    date_realisation: string | null;
  }>();

  for (const jalon of existingJalons) {
    const normTitle = normalizeTitle(jalon.titre);
    if (normTitle && !savedJalonDataByTitle.has(normTitle)) {
      savedJalonDataByTitle.set(normTitle, {
        statut: jalon.statut || 'en_attente',
        avancement: jalon.avancement || 0,
        date_realisation: jalon.date_realisation || null,
      });
    }
  }

  await db.transaction('rw', [db.jalons, db.actions], async () => {
    // 3. EFFACER tous les jalons et actions existants
    await db.jalons.clear();
    await db.actions.clear();
    logger.info('[cleanResetJalonsActions] Tables jalons et actions vidées');

    // 4. Insérer les jalons de ALL_JALONS avec restauration des données utilisateur
    for (const jalon of ALL_JALONS) {
      const normTitle = normalizeTitle(jalon.titre);
      const saved = savedJalonDataByTitle.get(normTitle);

      await db.jalons.add({
        ...jalon,
        siteId,
        // Restaurer les données utilisateur si elles existent
        ...(saved ? {
          statut: saved.statut,
          avancement: saved.avancement,
          date_realisation: saved.date_realisation,
        } : {}),
      } as Jalon);
      result.jalonsCreated++;
    }
    logger.info(`[cleanResetJalonsActions] ${result.jalonsCreated} jalons créés`);

    // 5. Récupérer les jalons pour le mapping jalonId
    const jalons = await db.jalons.toArray();
    const jalonMap = new Map(jalons.map(j => [j.id_jalon, j.id!]));

    // 6. Insérer les actions de ALL_ACTIONS avec restauration des données utilisateur
    for (const action of ALL_ACTIONS) {
      const actionWithCode = action as ActionWithJalonCode;
      const jalonCode = actionWithCode._jalonCode;
      const jalonId = jalonCode ? jalonMap.get(jalonCode) || null : null;
      const defaultResponsableId = userMap.get(action.responsable) || 1;

       
      const { _jalonCode, ...actionData } = actionWithCode;

      // Chercher les données sauvegardées par TITRE NORMALISÉ
      const normTitle = normalizeTitle(actionData.titre);
      const saved = savedActionDataByTitle.get(normTitle);

      await db.actions.add({
        ...actionData,
        jalonId,
        siteId,
        // PRÉSERVER les données utilisateur (NE RIEN TOUCHER)
        statut: saved?.statut ?? actionData.statut ?? 'a_faire',
        avancement: saved?.avancement ?? actionData.avancement ?? 0,
        responsableId: saved?.responsableId ?? defaultResponsableId,
        documents: saved?.documents ?? [],
        sous_taches: saved?.sous_taches ?? [],
        notes_internes: saved?.notes_internes ?? '',
        commentaires_externes: saved?.commentaires_externes ?? '',
        historique_commentaires: saved?.historique_commentaires ?? [],
        livrables: saved?.livrables ?? '',
        date_realisation: saved?.date_realisation ?? null,
        preuves: saved?.preuves ?? [],
      } as Action);

      result.actionsCreated++;
      if (saved && (saved.avancement > 0 || saved.statut !== 'a_faire')) {
        result.actionsPreserved++;
      }
    }
    logger.info(`[cleanResetJalonsActions] ${result.actionsCreated} actions créées, ${result.actionsPreserved} avec données préservées`);
  });

  // Marquer la migration comme effectuée
  localStorage.setItem(MIGRATION_V40_KEY, 'true');

  logger.info('[cleanResetJalonsActions] Reset terminé:', result);
  return result;
}

/**
 * Migration v3.1 → v4.0 : Restructuration complète jalons & actions
 *
 * RÈGLES ABSOLUES :
 * - PRÉSERVER sur chaque action existante : statut, avancement, responsableId,
 *   documents, sous_taches, notes_internes, commentaires_externes, historique
 * - CORRECTIONS AUTORISÉES : libellé (reformulation) + dates + jalonId + axe
 * - Matcher par TITRE NORMALISÉ (pas id_action) pour retrouver les existantes
 * - NOUVELLES ACTIONS : créer seulement si aucun titre similaire n'existe
 *
 * Idempotent : ne s'exécute qu'une fois (vérifie un flag dans localStorage)
 */
export async function migrateV31toV40(): Promise<{
  jalonsUpdated: number;
  jalonsCreated: number;
  jalonsDeleted: number;
  actionsUpdated: number;
  actionsCreated: number;
  actionsDeleted: number;
}> {
  // Vérifier si déjà exécutée
  if (localStorage.getItem(MIGRATION_V40_KEY) === 'true') {
    logger.info('[migrateV31toV40] Migration déjà effectuée, skip.');
    return { jalonsUpdated: 0, jalonsCreated: 0, jalonsDeleted: 0, actionsUpdated: 0, actionsCreated: 0, actionsDeleted: 0 };
  }

  logger.info('[migrateV31toV40] Démarrage migration v3.1 → v4.0 (v2 — match par titre)...');

  // Normaliser un titre pour comparaison
  const norm = (t: string | undefined): string =>
    (t || '').toLowerCase().trim().replace(/\s+/g, ' ').replace(/[''`]/g, "'");

  const result = {
    jalonsUpdated: 0,
    jalonsCreated: 0,
    jalonsDeleted: 0,
    actionsUpdated: 0,
    actionsCreated: 0,
    actionsDeleted: 0,
  };

  try {
    await db.transaction('rw', [db.jalons, db.actions, db.users, db.projectSettings, db.sites], async () => {

      // =====================================================================
      // 0. NETTOYAGE : supprimer les doublons créés par la migration buggée
      //    Garder l'original (id le plus bas = données utilisateur), supprimer le reste
      // =====================================================================
      const allActionsRaw = await db.actions.toArray();
      const titleGroups = new Map<string, typeof allActionsRaw>();
      for (const a of allActionsRaw) {
        const key = norm(a.titre);
        if (!key) continue;
        const group = titleGroups.get(key) || [];
        group.push(a);
        titleGroups.set(key, group);
      }
      for (const [, group] of titleGroups) {
        if (group.length <= 1) continue;
        // Trier par id croissant (le plus ancien = l'original avec données utilisateur)
        group.sort((a, b) => (a.id || 0) - (b.id || 0));
        // Supprimer tous sauf le premier (l'original)
        for (let i = 1; i < group.length; i++) {
          if (group[i].id) {
            await db.actions.delete(group[i].id!);
            result.actionsDeleted++;
          }
        }
      }

      // Même nettoyage pour les jalons
      const allJalonsRaw = await db.jalons.toArray();
      const jalonTitleGroups = new Map<string, typeof allJalonsRaw>();
      for (const j of allJalonsRaw) {
        const key = norm(j.titre);
        if (!key) continue;
        const group = jalonTitleGroups.get(key) || [];
        group.push(j);
        jalonTitleGroups.set(key, group);
      }
      for (const [, group] of jalonTitleGroups) {
        if (group.length <= 1) continue;
        group.sort((a, b) => (a.id || 0) - (b.id || 0));
        for (let i = 1; i < group.length; i++) {
          if (group[i].id) {
            await db.jalons.delete(group[i].id!);
            result.jalonsDeleted++;
          }
        }
      }

      logger.info('[migrateV31toV40] Nettoyage doublons:', result.actionsDeleted, 'actions,', result.jalonsDeleted, 'jalons supprimés');

      // =====================================================================
      // 1. Préparer les maps (après nettoyage)
      // =====================================================================
      const allDbJalons = await db.jalons.toArray();
      const jalonByCode = new Map(allDbJalons.map(j => [j.id_jalon, j]));
      const jalonByTitle = new Map(allDbJalons.map(j => [norm(j.titre), j]));

      const usersArr = await db.users.toArray();
      const userIdMap = new Map(usersArr.map(u => [`${u.prenom} ${u.nom}`, u.id!]));

      // =====================================================================
      // 2. Mettre à jour les jalons existants (titre, date_prevue)
      //    Match par id_jalon OU par titre normalisé
      // =====================================================================
      const jalonUpdates: Array<{ id_jalon: string; titre?: string; date_prevue?: string; ancienTitre?: string }> = [
        { id_jalon: 'J-RH-2', date_prevue: '2026-10-05' },
        { id_jalon: 'J-RH-3', titre: 'Équipe 100% opérationnelle', date_prevue: '2026-10-16' },
        { id_jalon: 'J-COM-1', date_prevue: '2026-04-15' },
        { id_jalon: 'J-COM-2', titre: 'Calendrier livraison Tenants', date_prevue: '2026-04-30' },
        { id_jalon: 'J-COM-3', titre: 'BEFA Big Boxes signés', date_prevue: '2026-08-31' },
        { id_jalon: 'J-COM-4', titre: 'Taux occupation ≥85%', date_prevue: '2026-10-16' },
        { id_jalon: 'J-TECH-2', date_prevue: '2026-08-31' },
        { id_jalon: 'J-TECH-3', titre: 'Formations complétées', date_prevue: '2026-09-15' },
        { id_jalon: 'J-TECH-4', date_prevue: '2026-09-30' },
        { id_jalon: 'J-TECH-5', titre: 'Suivi levées réserves', date_prevue: '2026-10-05' },
        { id_jalon: 'J-TECH-6', titre: 'Réceptions définitives', date_prevue: '2026-10-16' },
        { id_jalon: 'J-BUD-1', date_prevue: '2026-02-16' },
        { id_jalon: 'J-BUD-2', date_prevue: '2026-02-16' },
        { id_jalon: 'J-BUD-3', date_prevue: '2026-11-16' },
        { id_jalon: 'J-MKT-4', date_prevue: '2026-11-16' },
        { id_jalon: 'J-EXP-1', date_prevue: '2026-08-31' },
        { id_jalon: 'J-EXP-2', date_prevue: '2026-09-30' },
        { id_jalon: 'J-EXP-3', titre: 'Procédures d\'exploitation validées', date_prevue: '2026-10-10' },
        { id_jalon: 'J-EXP-4', date_prevue: '2026-10-16' },
        { id_jalon: 'J-DIV-1', titre: 'Note de cadrage validée', date_prevue: '2026-01-31' },
        { id_jalon: 'J-DIV-2', titre: 'Conformité admin/réglementaire', date_prevue: '2026-10-10' },
        { id_jalon: 'J-DIV-3', titre: 'Divers', date_prevue: '2026-12-31' },
      ];

      for (const upd of jalonUpdates) {
        // Match par id_jalon OU par titre
        const existing = jalonByCode.get(upd.id_jalon)
          || (upd.titre ? jalonByTitle.get(norm(upd.titre)) : undefined)
          || (upd.ancienTitre ? jalonByTitle.get(norm(upd.ancienTitre)) : undefined);

        if (existing && existing.id) {
          const updates: Record<string, unknown> = {};
          if (upd.titre) updates.titre = upd.titre;
          if (upd.date_prevue) updates.date_prevue = upd.date_prevue;
          // Mettre à jour id_jalon pour les futurs matchs
          if (existing.id_jalon !== upd.id_jalon) updates.id_jalon = upd.id_jalon;
          if (Object.keys(updates).length > 0) {
            await db.jalons.update(existing.id, updates);
            result.jalonsUpdated++;
          }
        }
      }

      // =====================================================================
      // 3. Supprimer jalons obsolètes (J-RH-4, J-COM-5)
      // =====================================================================
      // Re-fetch après updates
      const jalonsAfterUpdate = await db.jalons.toArray();
      const jalonByCode2 = new Map(jalonsAfterUpdate.map(j => [j.id_jalon, j]));
      for (const code of ['J-RH-4', 'J-COM-5']) {
        const jalon = jalonByCode2.get(code);
        if (jalon && jalon.id) {
          await db.jalons.delete(jalon.id);
          result.jalonsDeleted++;
        }
      }

      // =====================================================================
      // 4. Créer les nouveaux jalons (s'ils n'existent pas par id NI par titre)
      // =====================================================================
      const jalonsAfterDelete = await db.jalons.toArray();
      const existingJalonIds = new Set(jalonsAfterDelete.map(j => j.id_jalon));
      const existingJalonTitles = new Set(jalonsAfterDelete.map(j => norm(j.titre)));

      for (const jalon of ALL_JALONS) {
        if (!existingJalonIds.has(jalon.id_jalon) && !existingJalonTitles.has(norm(jalon.titre))) {
          await db.jalons.add(jalon as Jalon);
          result.jalonsCreated++;
        }
      }

      // Re-fetch jalons for jalonId mapping
      const finalJalons = await db.jalons.toArray();
      const jalonIdMap = new Map(finalJalons.map(j => [j.id_jalon, j.id!]));

      // =====================================================================
      // 5. Mettre à jour les actions existantes (titre, dates, jalonId, axe)
      //    Match par id_action OU par TITRE NORMALISÉ
      //    PRÉSERVE : statut, avancement, responsableId, documents,
      //               sous_taches, notes_internes, commentaires_externes
      // =====================================================================
      const allDbActions = await db.actions.toArray();
      const actionByCode = new Map(allDbActions.map(a => [a.id_action, a]));
      const actionByTitle = new Map<string, (typeof allDbActions)[0]>();
      for (const a of allDbActions) {
        const key = norm(a.titre);
        if (key && !actionByTitle.has(key)) {
          actionByTitle.set(key, a);
        }
      }
      const matchedDbIds = new Set<number>(); // track DB ids already matched

      for (const seedAction of ALL_ACTIONS) {
        const actionWithCode = seedAction as ActionWithJalonCode;

        // Match par id_action d'abord, puis par titre
        const existing = actionByCode.get(actionWithCode.id_action)
          || actionByTitle.get(norm(actionWithCode.titre));

        if (existing && existing.id && !matchedDbIds.has(existing.id)) {
          matchedDbIds.add(existing.id);
          const updates: Record<string, unknown> = {};

          // Mettre à jour le titre (reformulation autorisée)
          if (existing.titre !== actionWithCode.titre) {
            updates.titre = actionWithCode.titre;
          }

          // Mettre à jour id_action pour harmoniser les codes
          if (existing.id_action !== actionWithCode.id_action) {
            updates.id_action = actionWithCode.id_action;
          }

          // Mettre à jour les dates
          if (existing.date_fin_prevue !== actionWithCode.date_fin_prevue) {
            updates.date_fin_prevue = actionWithCode.date_fin_prevue;
          }
          if (existing.date_debut_prevue !== actionWithCode.date_debut_prevue) {
            updates.date_debut_prevue = actionWithCode.date_debut_prevue;
          }

          // Mettre à jour l'axe
          if (existing.axe !== actionWithCode.axe) {
            updates.axe = actionWithCode.axe;
          }

          // Réattribuer au bon jalon
          const newJalonCode = actionWithCode._jalonCode;
          if (newJalonCode) {
            const newJalonId = jalonIdMap.get(newJalonCode) || null;
            if (newJalonId !== existing.jalonId) {
              updates.jalonId = newJalonId;
            }
          }

          // ❌ JAMAIS toucher : statut, avancement, responsableId, documents,
          //    sous_taches, notes_internes, commentaires_externes, historique

          if (Object.keys(updates).length > 0) {
            await db.actions.update(existing.id, updates);
            result.actionsUpdated++;
          }
        }
      }

      // =====================================================================
      // 6. Créer les nouvelles actions (aucun match par id NI par titre)
      // =====================================================================
      // Re-fetch après les mises à jour (id_action ont pu changer)
      const actionsAfterUpdate = await db.actions.toArray();
      const existingActionIds = new Set(actionsAfterUpdate.map(a => a.id_action));
      const existingActionTitles = new Set(actionsAfterUpdate.map(a => norm(a.titre)));

      for (const seedAction of ALL_ACTIONS) {
        const actionWithCode = seedAction as ActionWithJalonCode;
        // Créer seulement si aucun match par id ET par titre
        if (!existingActionIds.has(actionWithCode.id_action) && !existingActionTitles.has(norm(actionWithCode.titre))) {
          const jalonCode = actionWithCode._jalonCode;
          const jalonId = jalonCode ? jalonIdMap.get(jalonCode) || null : null;
          const responsableId = userIdMap.get(actionWithCode.responsable) || 1;

           
          const { _jalonCode: _jc, ...actionData } = actionWithCode;

          await db.actions.add({
            ...actionData,
            jalonId,
            responsableId,
          } as Action);
          result.actionsCreated++;
        }
      }

      // =====================================================================
      // 7. Mettre à jour projectSettings (softOpening)
      // =====================================================================
      const settings = await db.projectSettings.toArray();
      if (settings.length > 0 && settings[0].id) {
        await db.projectSettings.update(settings[0].id, {
          datesClePtojet: {
            kickoff: '2025-10-01',
            softOpening: '2026-10-16',
            inauguration: '2026-11-15',
          },
          objectifsOccupation: {
            softOpening: { date: '2026-10-16', tauxCible: 85 },
            inauguration: { date: '2026-11-15', tauxCible: 90 },
            moisPlus6: { date: '2027-04-16', tauxCible: 95 },
          },
          updatedAt: new Date().toISOString(),
        });
      }

      // =====================================================================
      // 8. Mettre à jour site COSMOS (dateOuverture / dateInauguration)
      // =====================================================================
      const cosmosSite = await db.sites.where('code').equals('COSMOS').first();
      if (cosmosSite?.id) {
        await db.sites.update(cosmosSite.id, {
          dateOuverture: '2026-10-16',
          dateInauguration: '2026-11-15',
          updatedAt: new Date().toISOString(),
        });
      }
    });

    // Marquer la migration comme effectuée
    localStorage.setItem(MIGRATION_V40_KEY, 'true');

    logger.info('[migrateV31toV40] Migration terminée:', result);
  } catch (error) {
    logger.error('[migrateV31toV40] Erreur:', error);
  }

  return result;
}
