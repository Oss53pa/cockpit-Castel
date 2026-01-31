// ============================================================================
// RÉFÉRENTIEL COMPLET — COSMOS ANGRÉ v3.0
// ============================================================================
// 7 Axes | 39 Jalons | 148 Actions
// Date : 30 Janvier 2026 | Ouverture prévue : Q4 2026

import type { User, Jalon, Action, Axe, ProjectPhase, BuildingCode } from '@/types';

// ============================================================================
// MÉTADONNÉES DU PROJET
// ============================================================================

export const PROJECT_METADATA = {
  nom: 'COSMOS ANGRÉ',
  localisation: 'Angré, Abidjan, Côte d\'Ivoire',
  gla: 45000,
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
    softOpening: '2026-11-15',
    inauguration: '2026-12-15',
    finMobilisation: '2027-03-31',
  },

  objectifsOccupation: {
    softOpening: { date: '2026-11-15', tauxCible: 70 },
    inauguration: { date: '2026-12-15', tauxCible: 85 },
    moisPlus6: { date: '2027-06-15', tauxCible: 95 },
  },

  // Compteurs v3.0
  compteurs: {
    axes: 7,
    jalons: 39,
    actions: 148,
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

function createAction(
  id_action: string,
  titre: string,
  axe: Axe,
  date_fin_prevue: string,
  responsable: string,
  description: string = '',
  jalonCode?: string,
  projectPhase: ProjectPhase = 'phase2_mobilisation'
): ActionWithJalonCode {
  const dateDebut = new Date(date_fin_prevue);
  dateDebut.setDate(dateDebut.getDate() - 14);

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
    priorite: 'moyenne',
    score_priorite: null,
    impact_si_retard: 'modere',
    version: 1,
    date_modification: now,
    modifie_par: 'System',
    motif_modification: null,
    _jalonCode: jalonCode, // Stocker temporairement pour le seed
  };
}

// ============================================================================
// AXE 1 : RH & ORGANISATION (20%) - 6 Jalons, 8 Actions
// ============================================================================

export const JALONS_AXE1_RH: Omit<Jalon, 'id'>[] = [
  createJalon('J-RH-1', 'Organigramme cible validé', 'axe1_rh', '2026-01-31', 'Pamela ATOKOUNA', '', 'phase1_preparation'),
  createJalon('J-RH-2', 'Vague 1 complétée (FSM, CM, MM)', 'axe1_rh', '2026-03-31', 'Pamela ATOKOUNA'),
  createJalon('J-RH-3', 'Vague 2 complétée (Team Leads)', 'axe1_rh', '2026-05-31', 'Mariam Keita'),
  createJalon('J-RH-4', 'Vague 3 complétée (Seniors/Assistants)', 'axe1_rh', '2026-07-31', 'Mariam Keita'),
  createJalon('J-RH-5', 'Vague 4 complétée (Terrain)', 'axe1_rh', '2026-10-15', 'Mariam Keita'),
  createJalon('J-RH-6', 'Équipe 100% opérationnelle', 'axe1_rh', '2026-11-01', 'Pamela ATOKOUNA', '', 'phase3_lancement'),
];

export const ACTIONS_AXE1_RH: Omit<Action, 'id'>[] = [
  // J-RH-1
  createAction('A-RH-1.1', 'Valider organigramme et fiches de poste', 'axe1_rh', '2026-01-20', 'Pamela ATOKOUNA', '', 'J-RH-1', 'phase1_preparation'),
  createAction('A-RH-1.2', 'Valider grille salariale et budget RH', 'axe1_rh', '2026-01-31', 'Pamela ATOKOUNA', '', 'J-RH-1', 'phase1_preparation'),
  // J-RH-2
  createAction('A-RH-2.1', 'Recruter Vague 1 (FSM, CM, MM)', 'axe1_rh', '2026-03-31', 'Pamela ATOKOUNA', '', 'J-RH-2'),
  // J-RH-3
  createAction('A-RH-3.1', 'Recruter Vague 2 (Team Leads)', 'axe1_rh', '2026-05-31', 'Mariam Keita', '', 'J-RH-3'),
  // J-RH-4
  createAction('A-RH-4.1', 'Recruter Vague 3 (Seniors/Assistants)', 'axe1_rh', '2026-07-31', 'Mariam Keita', '', 'J-RH-4'),
  // J-RH-5
  createAction('A-RH-5.1', 'Recruter Vague 4 (Personnel terrain)', 'axe1_rh', '2026-10-15', 'Mariam Keita', '', 'J-RH-5'),
  // J-RH-6
  createAction('A-RH-6.1', 'Former toutes les équipes', 'axe1_rh', '2026-10-25', 'Pamela ATOKOUNA', '', 'J-RH-6', 'phase3_lancement'),
  createAction('A-RH-6.2', 'Exercice grandeur nature', 'axe1_rh', '2026-10-30', 'Deborah NTUMY', '', 'J-RH-6', 'phase3_lancement'),
];

// ============================================================================
// AXE 2 : COMMERCIAL & LEASING (25%) - 7 Jalons, 25 Actions
// ============================================================================

export const JALONS_AXE2_COMMERCIAL: Omit<Jalon, 'id'>[] = [
  createJalon('J-COM-1', 'BEFA Vague 1 signés (25%)', 'axe2_commercial', '2026-02-15', 'Hadja Timite'),
  createJalon('J-COM-2', 'BEFA Vague 2 signés (50%)', 'axe2_commercial', '2026-03-15', 'Hadja Timite'),
  createJalon('J-COM-3', 'BEFA Vague 3 signés (100%)', 'axe2_commercial', '2026-04-15', 'Hadja Timite'),
  createJalon('J-COM-4', 'Plans aménagement validés', 'axe2_commercial', '2026-04-30', 'Hadja Timite'),
  createJalon('J-COM-5', 'Occupation 50%', 'axe2_commercial', '2026-06-30', 'Hadja Timite'),
  createJalon('J-COM-6', 'Locomotives signées (≥3)', 'axe2_commercial', '2026-09-30', 'Pamela ATOKOUNA'),
  createJalon('J-COM-7', 'Occupation 85%', 'axe2_commercial', '2026-11-15', 'Hadja Timite', '', 'phase3_lancement'),
];

export const ACTIONS_AXE2_COMMERCIAL: Omit<Action, 'id'>[] = [
  // J-COM-1
  createAction('A-COM-1.1', 'Finaliser étude de marché / zone chalandise', 'axe2_commercial', '2026-01-20', 'Hadja Timite', '', 'J-COM-1'),
  createAction('A-COM-1.2', 'Définir positionnement commercial', 'axe2_commercial', '2026-01-31', 'Pamela ATOKOUNA', '', 'J-COM-1'),
  createAction('A-COM-1.3', 'Identifier locomotives cibles', 'axe2_commercial', '2026-02-10', 'Hadja Timite', '', 'J-COM-1'),
  createAction('A-COM-1.4', 'Finaliser stratégie locative', 'axe2_commercial', '2026-02-15', 'Pamela ATOKOUNA', '', 'J-COM-1'),
  createAction('A-COM-1.5', 'Valider grille de loyers', 'axe2_commercial', '2026-01-31', 'Pamela ATOKOUNA', '', 'J-COM-1'),
  createAction('A-COM-1.6', 'Négocier BEFA prioritaires', 'axe2_commercial', '2026-02-15', 'Pamela ATOKOUNA', '', 'J-COM-1'),
  createAction('A-COM-1.7', 'Signer BEFA Vague 1 (25%)', 'axe2_commercial', '2026-02-15', 'Hadja Timite', '', 'J-COM-1'),
  // J-COM-2
  createAction('A-COM-2.1', 'Relancer prospects pipeline', 'axe2_commercial', '2026-02-28', 'Hadja Timite', '', 'J-COM-2'),
  createAction('A-COM-2.2', 'Négocier BEFA Vague 2', 'axe2_commercial', '2026-03-10', 'Hadja Timite', '', 'J-COM-2'),
  createAction('A-COM-2.3', 'Coordonner avec Hadja & Adèle', 'axe2_commercial', '2026-03-15', 'Pamela ATOKOUNA', '', 'J-COM-2'),
  createAction('A-COM-2.4', 'Signer BEFA Vague 2 (50% cumulé)', 'axe2_commercial', '2026-03-15', 'Hadja Timite', '', 'J-COM-2'),
  // J-COM-3
  createAction('A-COM-3.1', 'Intensifier prospection', 'axe2_commercial', '2026-03-31', 'Hadja Timite', '', 'J-COM-3'),
  createAction('A-COM-3.2', 'Négocier BEFA restants', 'axe2_commercial', '2026-04-10', 'Hadja Timite', '', 'J-COM-3'),
  createAction('A-COM-3.3', 'Signer BEFA Vague 3 (100%)', 'axe2_commercial', '2026-04-15', 'Hadja Timite', '', 'J-COM-3'),
  // J-COM-4
  createAction('A-COM-4.1', 'Collecter plans preneurs', 'axe2_commercial', '2026-04-15', 'Hadja Timite', '', 'J-COM-4'),
  createAction('A-COM-4.2', 'Vérifier conformité technique', 'axe2_commercial', '2026-04-25', 'Cheick Sanankoua', '', 'J-COM-4'),
  createAction('A-COM-4.3', 'Valider plans aménagement', 'axe2_commercial', '2026-04-30', 'Pamela ATOKOUNA', '', 'J-COM-4'),
  // J-COM-5
  createAction('A-COM-5.1', 'Suivre avancement travaux preneurs', 'axe2_commercial', '2026-06-30', 'Hadja Timite', '', 'J-COM-5'),
  createAction('A-COM-5.2', 'Coordonner avec Pilote B', 'axe2_commercial', '2026-06-30', 'Cheick Sanankoua', '', 'J-COM-5'),
  createAction('A-COM-5.3', 'Valider occupation 50%', 'axe2_commercial', '2026-06-30', 'Pamela ATOKOUNA', '', 'J-COM-5'),
  // J-COM-6
  createAction('A-COM-6.1', 'Négocier locomotive alimentaire', 'axe2_commercial', '2026-06-30', 'Pamela ATOKOUNA', '', 'J-COM-6'),
  createAction('A-COM-6.2', 'Négocier locomotive mode', 'axe2_commercial', '2026-08-31', 'Pamela ATOKOUNA', '', 'J-COM-6'),
  createAction('A-COM-6.3', 'Négocier locomotive loisirs/restauration', 'axe2_commercial', '2026-09-30', 'Pamela ATOKOUNA', '', 'J-COM-6'),
  createAction('A-COM-6.4', 'Signer ≥3 locomotives', 'axe2_commercial', '2026-09-30', 'Pamela ATOKOUNA', '', 'J-COM-6'),
  // J-COM-7
  createAction('A-COM-7.1', 'Finaliser derniers baux', 'axe2_commercial', '2026-10-31', 'Hadja Timite', '', 'J-COM-7', 'phase3_lancement'),
  createAction('A-COM-7.2', 'Valider preneurs prêts ouverture', 'axe2_commercial', '2026-11-10', 'Hadja Timite', '', 'J-COM-7', 'phase3_lancement'),
  createAction('A-COM-7.3', 'Confirmer occupation 85%', 'axe2_commercial', '2026-11-15', 'Pamela ATOKOUNA', '', 'J-COM-7', 'phase3_lancement'),
];

// ============================================================================
// AXE 3 : TECHNIQUE & HANDOVER (20%) - 6 Jalons, 30 Actions
// ============================================================================

export const JALONS_AXE3_TECHNIQUE: Omit<Jalon, 'id'>[] = [
  createJalon('J-TECH-1', 'Phase A complétée (DOE)', 'axe3_technique', '2026-06-30', 'Cheick Sanankoua'),
  createJalon('J-TECH-2', 'Tests techniques réussis', 'axe3_technique', '2026-09-30', 'Deborah NTUMY'),
  createJalon('J-TECH-3', 'Formations complétées', 'axe3_technique', '2026-09-30', 'Deborah NTUMY'),
  createJalon('J-TECH-4', 'Commission sécurité OK', 'axe3_technique', '2026-10-15', 'Pamela ATOKOUNA', '', 'phase3_lancement', 'CC'),
  createJalon('J-TECH-5', 'Réserves bloquantes levées', 'axe3_technique', '2026-10-20', 'Pamela ATOKOUNA', '', 'phase3_lancement', 'CC'),
  createJalon('J-TECH-6', 'PV réception signé', 'axe3_technique', '2026-10-31', 'Pamela ATOKOUNA', '', 'phase3_lancement', 'CC'),
];

export const ACTIONS_AXE3_TECHNIQUE: Omit<Action, 'id'>[] = [
  // J-TECH-1
  createAction('A-TECH-1.1', 'Collecter DOE constructeur (Lot 1-5)', 'axe3_technique', '2026-04-30', 'Cheick Sanankoua', '', 'J-TECH-1'),
  createAction('A-TECH-1.2', 'Collecter DOE lots techniques', 'axe3_technique', '2026-05-31', 'Cheick Sanankoua', '', 'J-TECH-1'),
  createAction('A-TECH-1.3', 'Vérifier complétude DOE', 'axe3_technique', '2026-06-15', 'Deborah NTUMY', '', 'J-TECH-1'),
  createAction('A-TECH-1.4', 'Archiver DOE GED', 'axe3_technique', '2026-06-30', 'Cheick Sanankoua', '', 'J-TECH-1'),
  createAction('A-TECH-1.5', 'Établir liste réserves Phase A', 'axe3_technique', '2026-06-30', 'Cheick Sanankoua', '', 'J-TECH-1'),
  // J-TECH-2
  createAction('A-TECH-2.1', 'Planifier tests CVC/HVAC', 'axe3_technique', '2026-08-01', 'Deborah NTUMY', '', 'J-TECH-2'),
  createAction('A-TECH-2.2', 'Exécuter tests électricité HT/BT', 'axe3_technique', '2026-08-31', 'Cheick Sanankoua', '', 'J-TECH-2'),
  createAction('A-TECH-2.3', 'Exécuter tests plomberie', 'axe3_technique', '2026-08-31', 'Cheick Sanankoua', '', 'J-TECH-2'),
  createAction('A-TECH-2.4', 'Exécuter tests CVC/HVAC', 'axe3_technique', '2026-09-15', 'Cheick Sanankoua', '', 'J-TECH-2'),
  createAction('A-TECH-2.5', 'Exécuter tests SSI', 'axe3_technique', '2026-09-15', 'Cheick Sanankoua', '', 'J-TECH-2'),
  createAction('A-TECH-2.6', 'Exécuter tests ascenseurs/escalators', 'axe3_technique', '2026-09-20', 'Cheick Sanankoua', '', 'J-TECH-2'),
  createAction('A-TECH-2.7', 'Exécuter tests CCTV/contrôle accès', 'axe3_technique', '2026-09-25', 'Cheick Sanankoua', '', 'J-TECH-2'),
  createAction('A-TECH-2.8', 'Exécuter tests GTC/BMS', 'axe3_technique', '2026-09-30', 'Cheick Sanankoua', '', 'J-TECH-2'),
  createAction('A-TECH-2.9', 'Valider PV tests', 'axe3_technique', '2026-09-30', 'Deborah NTUMY', '', 'J-TECH-2'),
  // J-TECH-3
  createAction('A-TECH-3.1', 'Former équipe technique CVC', 'axe3_technique', '2026-09-15', 'Cheick Sanankoua', '', 'J-TECH-3'),
  createAction('A-TECH-3.2', 'Former équipe technique SSI', 'axe3_technique', '2026-09-15', 'Cheick Sanankoua', '', 'J-TECH-3'),
  createAction('A-TECH-3.3', 'Former équipe technique GTC/BMS', 'axe3_technique', '2026-09-20', 'Cheick Sanankoua', '', 'J-TECH-3'),
  createAction('A-TECH-3.4', 'Former équipe sécurité CCTV', 'axe3_technique', '2026-09-25', 'Cheick Sanankoua', '', 'J-TECH-3'),
  createAction('A-TECH-3.5', 'Valider attestations formation', 'axe3_technique', '2026-09-30', 'Deborah NTUMY', '', 'J-TECH-3'),
  // J-TECH-4
  createAction('A-TECH-4.1', 'Préparer dossier commission sécurité', 'axe3_technique', '2026-09-30', 'Deborah NTUMY', '', 'J-TECH-4'),
  createAction('A-TECH-4.2', 'Pré-visite interne', 'axe3_technique', '2026-10-05', 'Deborah NTUMY', '', 'J-TECH-4', 'phase3_lancement'),
  createAction('A-TECH-4.3', 'Accueillir commission sécurité', 'axe3_technique', '2026-10-15', 'Pamela ATOKOUNA', '', 'J-TECH-4', 'phase3_lancement'),
  createAction('A-TECH-4.4', 'Obtenir avis favorable', 'axe3_technique', '2026-10-15', 'Pamela ATOKOUNA', '', 'J-TECH-4', 'phase3_lancement'),
  // J-TECH-5
  createAction('A-TECH-5.1', 'Identifier réserves bloquantes', 'axe3_technique', '2026-10-01', 'Deborah NTUMY', '', 'J-TECH-5', 'phase3_lancement'),
  createAction('A-TECH-5.2', 'Relancer entreprises pour levées', 'axe3_technique', '2026-10-10', 'Cheick Sanankoua', '', 'J-TECH-5', 'phase3_lancement'),
  createAction('A-TECH-5.3', 'Vérifier levées réserves', 'axe3_technique', '2026-10-18', 'Deborah NTUMY', '', 'J-TECH-5', 'phase3_lancement'),
  createAction('A-TECH-5.4', 'Valider 0 réserve bloquante', 'axe3_technique', '2026-10-20', 'Pamela ATOKOUNA', '', 'J-TECH-5', 'phase3_lancement'),
  // J-TECH-6
  createAction('A-TECH-6.1', 'Préparer PV réception', 'axe3_technique', '2026-10-25', 'Deborah NTUMY', '', 'J-TECH-6', 'phase3_lancement'),
  createAction('A-TECH-6.2', 'Organiser visite réception finale', 'axe3_technique', '2026-10-28', 'Pamela ATOKOUNA', '', 'J-TECH-6', 'phase3_lancement'),
  createAction('A-TECH-6.3', 'Signer PV réception', 'axe3_technique', '2026-10-31', 'Pamela ATOKOUNA', '', 'J-TECH-6', 'phase3_lancement'),
];

// ============================================================================
// AXE 4 : BUDGET & PILOTAGE (15%) - 6 Jalons, 6 Actions
// ============================================================================

export const JALONS_AXE4_BUDGET: Omit<Jalon, 'id'>[] = [
  createJalon('J-BUD-1', 'Budget mobilisation validé', 'axe4_budget', '2026-01-31', 'Deborah NTUMY', '', 'phase1_preparation'),
  createJalon('J-BUD-2', 'Budget exploitation validé', 'axe4_budget', '2026-01-31', 'Deborah NTUMY', '', 'phase1_preparation'),
  createJalon('J-BUD-3', 'Suivi T1 conforme (≤5%)', 'axe4_budget', '2026-03-31', 'Deborah NTUMY'),
  createJalon('J-BUD-4', 'Suivi T2 conforme (≤5%)', 'axe4_budget', '2026-06-30', 'Deborah NTUMY'),
  createJalon('J-BUD-5', 'Suivi T3 conforme (≤5%)', 'axe4_budget', '2026-09-30', 'Deborah NTUMY'),
  createJalon('J-BUD-6', 'Clôture projet conforme', 'axe4_budget', '2026-12-31', 'Deborah NTUMY', '', 'phase4_stabilisation'),
];

export const ACTIONS_AXE4_BUDGET: Omit<Action, 'id'>[] = [
  createAction('A-BUD-1.1', 'Consolider et valider budget mobilisation', 'axe4_budget', '2026-01-31', 'Deborah NTUMY', '', 'J-BUD-1', 'phase1_preparation'),
  createAction('A-BUD-2.1', 'Construire et valider P&L prévisionnel Y1', 'axe4_budget', '2026-01-31', 'Deborah NTUMY', '', 'J-BUD-2', 'phase1_preparation'),
  createAction('A-BUD-3.1', 'Analyser écarts T1 et proposer corrections', 'axe4_budget', '2026-03-31', 'Deborah NTUMY', '', 'J-BUD-3'),
  createAction('A-BUD-4.1', 'Analyser écarts T2 et proposer corrections', 'axe4_budget', '2026-06-30', 'Deborah NTUMY', '', 'J-BUD-4'),
  createAction('A-BUD-5.1', 'Analyser écarts T3 et proposer corrections', 'axe4_budget', '2026-09-30', 'Deborah NTUMY', '', 'J-BUD-5'),
  createAction('A-BUD-6.1', 'Établir bilan financier et clôturer projet', 'axe4_budget', '2026-12-31', 'Deborah NTUMY', '', 'J-BUD-6', 'phase4_stabilisation'),
];

// ============================================================================
// AXE 5 : MARKETING & COMMUNICATION (15%) - 4 Jalons, 23 Actions
// ============================================================================

export const JALONS_AXE5_MARKETING: Omit<Jalon, 'id'>[] = [
  createJalon('J-MKT-1', 'Phase 1 : Planification stratégique', 'axe5_marketing', '2026-02-15', 'Adele Affian', 'Période Jan-Fév', 'phase1_preparation'),
  createJalon('J-MKT-2', 'Phase 2 : Développement et mise en œuvre', 'axe5_marketing', '2026-05-31', 'Adele Affian', 'Période Mars-Mai'),
  createJalon('J-MKT-3', 'Phase 3 : Préparation inauguration', 'axe5_marketing', '2026-09-15', 'Adele Affian', 'Période Juin-Sept'),
  createJalon('J-MKT-4', 'Phase 4 : Inauguration et post-lancement', 'axe5_marketing', '2026-10-31', 'Adele Affian', 'Période Oct', 'phase3_lancement'),
];

export const ACTIONS_AXE5_MARKETING: Omit<Action, 'id'>[] = [
  // J-MKT-1
  createAction('A-MKT-1.1', 'Note de cadrage stratégique', 'axe5_marketing', '2026-01-31', 'Adele Affian', 'Format: PDF', 'J-MKT-1', 'phase1_preparation'),
  createAction('A-MKT-1.2', 'Plan marketing global', 'axe5_marketing', '2026-02-10', 'Adele Affian', 'Format: PowerPoint', 'J-MKT-1', 'phase1_preparation'),
  createAction('A-MKT-1.3', 'Cartographie parcours client', 'axe5_marketing', '2026-02-10', 'Adele Affian', 'Format: PNG/Visio', 'J-MKT-1', 'phase1_preparation'),
  createAction('A-MKT-1.4', 'Charte graphique', 'axe5_marketing', '2026-02-15', 'Adele Affian', 'Format: PDF', 'J-MKT-1', 'phase1_preparation'),
  createAction('A-MKT-1.5', 'Rapport de focus group', 'axe5_marketing', '2026-02-15', 'Adele Affian', 'Format: Word', 'J-MKT-1', 'phase1_preparation'),
  createAction('A-MKT-1.6', 'REVUE : Validation livrables Phase 1', 'axe5_marketing', '2026-02-15', 'Adele Affian', '', 'J-MKT-1', 'phase1_preparation'),
  // J-MKT-2
  createAction('A-MKT-2.1', 'Stratégie digitale et calendrier éditorial', 'axe5_marketing', '2026-03-15', 'Adele Affian', 'Format: Excel', 'J-MKT-2'),
  createAction('A-MKT-2.2', 'Maquettes site web', 'axe5_marketing', '2026-03-31', 'Adele Affian', 'Format: PDF', 'J-MKT-2'),
  createAction('A-MKT-2.3', 'Choix de la régie publicitaire', 'axe5_marketing', '2026-03-31', 'Adele Affian', 'Format: Contrat', 'J-MKT-2'),
  createAction('A-MKT-2.4', 'Kits réseaux sociaux', 'axe5_marketing', '2026-04-10', 'Adele Affian', 'Format: ZIP', 'J-MKT-2'),
  createAction('A-MKT-2.5', 'REVUE : Validation maquettes et programme fidélité', 'axe5_marketing', '2026-04-15', 'Adele Affian', '', 'J-MKT-2'),
  createAction('A-MKT-2.6', 'Document programme fidélité', 'axe5_marketing', '2026-04-20', 'Adele Affian', 'Format: Word', 'J-MKT-2'),
  createAction('A-MKT-2.7', 'Plans aménagement et signalétique', 'axe5_marketing', '2026-04-30', 'Adele Affian', 'Format: PDF/PNG', 'J-MKT-2'),
  createAction('A-MKT-2.8', 'REVUE : Validation finale livrables Phase 2', 'axe5_marketing', '2026-05-31', 'Adele Affian', '', 'J-MKT-2'),
  // J-MKT-3
  createAction('A-MKT-3.1', 'Plan de communication du lancement', 'axe5_marketing', '2026-06-10', 'Adele Affian', 'Format: PowerPoint', 'J-MKT-3'),
  createAction('A-MKT-3.2', 'Liste invités VIP et presse', 'axe5_marketing', '2026-06-15', 'Adele Affian', 'Format: Excel', 'J-MKT-3'),
  createAction('A-MKT-3.3', 'Dossier de presse', 'axe5_marketing', '2026-06-30', 'Adele Affian', 'Format: PDF', 'J-MKT-3'),
  createAction('A-MKT-3.4', 'Contenus marketing', 'axe5_marketing', '2026-07-15', 'Adele Affian', 'Format: ZIP', 'J-MKT-3'),
  createAction('A-MKT-3.5', 'REVUE : Validation invitations et dossier presse', 'axe5_marketing', '2026-07-15', 'Adele Affian', '', 'J-MKT-3'),
  createAction('A-MKT-3.6', 'Check-list opérationnelle', 'axe5_marketing', '2026-07-31', 'Adele Affian', 'Format: Excel', 'J-MKT-3'),
  createAction('A-MKT-3.7', 'Brief agence événementielle', 'axe5_marketing', '2026-08-10', 'Adele Affian', 'Format: Word', 'J-MKT-3'),
  createAction('A-MKT-3.8', 'Goodies personnalisés', 'axe5_marketing', '2026-08-15', 'Adele Affian', 'Format: PDF/PNG', 'J-MKT-3'),
  createAction('A-MKT-3.9', 'Vidéo institutionnelle', 'axe5_marketing', '2026-08-31', 'Adele Affian', 'Format: MP4', 'J-MKT-3'),
  createAction('A-MKT-3.10', 'Spot publicitaire', 'axe5_marketing', '2026-09-10', 'Adele Affian', 'Format: MP4', 'J-MKT-3'),
  createAction('A-MKT-3.11', 'REVUE : Validation finale avant lancement', 'axe5_marketing', '2026-09-15', 'Adele Affian', '', 'J-MKT-3'),
  // J-MKT-4
  createAction('A-MKT-4.1', 'Rapport de perception de la marque', 'axe5_marketing', '2026-10-15', 'Adele Affian', 'Format: PDF', 'J-MKT-4', 'phase3_lancement'),
  createAction('A-MKT-4.2', 'Bilan de l\'inauguration', 'axe5_marketing', '2026-10-20', 'Adele Affian', 'Format: PowerPoint', 'J-MKT-4', 'phase3_lancement'),
  createAction('A-MKT-4.3', 'Rapport d\'analyse des retombées', 'axe5_marketing', '2026-10-25', 'Adele Affian', 'Format: Excel/PDF', 'J-MKT-4', 'phase3_lancement'),
  createAction('A-MKT-4.4', 'Plan d\'actions correctives', 'axe5_marketing', '2026-10-31', 'Adele Affian', 'Format: Word', 'J-MKT-4', 'phase3_lancement'),
  createAction('A-MKT-4.5', 'REVUE FINALE : Validation bilans et actions', 'axe5_marketing', '2026-10-31', 'Adele Affian', '', 'J-MKT-4', 'phase3_lancement'),
];

// ============================================================================
// AXE 6 : EXPLOITATION & SYSTÈMES (5%) - 4 Jalons, 14 Actions
// ============================================================================

export const JALONS_AXE6_EXPLOITATION: Omit<Jalon, 'id'>[] = [
  createJalon('J-EXP-1', 'Contrats prestataires signés', 'axe6_exploitation', '2026-09-30', 'Deborah NTUMY'),
  createJalon('J-EXP-2', 'Systèmes déployés (ERP, GMAO, CRM)', 'axe6_exploitation', '2026-10-15', 'Deborah NTUMY', '', 'phase3_lancement'),
  createJalon('J-EXP-3', 'Procédures validées', 'axe6_exploitation', '2026-10-31', 'Deborah NTUMY', '', 'phase3_lancement'),
  createJalon('J-EXP-4', 'Centre prêt à opérer', 'axe6_exploitation', '2026-11-01', 'Pamela ATOKOUNA', '', 'phase3_lancement'),
];

export const ACTIONS_AXE6_EXPLOITATION: Omit<Action, 'id'>[] = [
  // J-EXP-1
  createAction('A-EXP-1.1', 'Lancer AO nettoyage', 'axe6_exploitation', '2026-06-01', 'Deborah NTUMY', '', 'J-EXP-1'),
  createAction('A-EXP-1.2', 'Lancer AO sécurité/gardiennage', 'axe6_exploitation', '2026-06-01', 'Deborah NTUMY', '', 'J-EXP-1'),
  createAction('A-EXP-1.3', 'Lancer AO maintenance technique', 'axe6_exploitation', '2026-06-15', 'Deborah NTUMY', '', 'J-EXP-1'),
  createAction('A-EXP-1.4', 'Lancer AO espaces verts', 'axe6_exploitation', '2026-06-15', 'Deborah NTUMY', '', 'J-EXP-1'),
  createAction('A-EXP-1.5', 'Analyser offres et négocier', 'axe6_exploitation', '2026-08-31', 'Deborah NTUMY', '', 'J-EXP-1'),
  createAction('A-EXP-1.6', 'Signer contrats prestataires', 'axe6_exploitation', '2026-09-30', 'Pamela ATOKOUNA', '', 'J-EXP-1'),
  // J-EXP-2
  createAction('A-EXP-2.1', 'Configurer ERP (comptabilité, facturation)', 'axe6_exploitation', '2026-09-30', 'Julien Assie', '', 'J-EXP-2'),
  createAction('A-EXP-2.2', 'Déployer GMAO', 'axe6_exploitation', '2026-10-05', 'Deborah NTUMY', '', 'J-EXP-2', 'phase3_lancement'),
  createAction('A-EXP-2.3', 'Déployer CRM locataires', 'axe6_exploitation', '2026-10-10', 'Hadja Timite', '', 'J-EXP-2', 'phase3_lancement'),
  createAction('A-EXP-2.4', 'Tester intégrations systèmes', 'axe6_exploitation', '2026-10-15', 'Julien Assie', '', 'J-EXP-2', 'phase3_lancement'),
  createAction('A-EXP-2.5', 'Former utilisateurs', 'axe6_exploitation', '2026-10-15', 'Julien Assie', '', 'J-EXP-2', 'phase3_lancement'),
  // J-EXP-3
  createAction('A-EXP-3.1', 'Adapter procédures Yopougon', 'axe6_exploitation', '2026-10-15', 'Deborah NTUMY', '', 'J-EXP-3', 'phase3_lancement'),
  createAction('A-EXP-3.2', 'Rédiger procédures spécifiques Angré', 'axe6_exploitation', '2026-10-25', 'Deborah NTUMY', '', 'J-EXP-3', 'phase3_lancement'),
  createAction('A-EXP-3.3', 'Valider procédures', 'axe6_exploitation', '2026-10-31', 'Pamela ATOKOUNA', '', 'J-EXP-3', 'phase3_lancement'),
  // J-EXP-4
  createAction('A-EXP-4.1', 'Check-list pré-ouverture', 'axe6_exploitation', '2026-10-28', 'Deborah NTUMY', '', 'J-EXP-4', 'phase3_lancement'),
  createAction('A-EXP-4.2', 'Test exploitation grandeur nature', 'axe6_exploitation', '2026-10-30', 'Deborah NTUMY', '', 'J-EXP-4', 'phase3_lancement'),
  createAction('A-EXP-4.3', 'Go/No-Go ouverture', 'axe6_exploitation', '2026-11-01', 'Pamela ATOKOUNA', '', 'J-EXP-4', 'phase3_lancement'),
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
    createAction(`A-CON-${code}.1`, `Gros œuvre - ${batiment}`, 'axe7_construction', '2026-02-28', 'Constructeur', '', `J-CON-${code}`, 'phase1_preparation'),
    createAction(`A-CON-${code}.2`, `Second œuvre - ${batiment}`, 'axe7_construction', '2026-04-30', 'Constructeur', '', `J-CON-${code}`),
    createAction(`A-CON-${code}.3`, `Lots techniques - ${batiment}`, 'axe7_construction', '2026-07-31', 'Constructeur', '', `J-CON-${code}`),
    createAction(`A-CON-${code}.4`, `Aménagement externe - ${batiment}`, 'axe7_construction', '2026-08-31', 'Constructeur', '', `J-CON-${code}`),
    createAction(`A-CON-${code}.5`, `Pré-réception - ${batiment}`, 'axe7_construction', '2026-09-30', 'Constructeur', '', `J-CON-${code}`),
    createAction(`A-CON-${code}.6`, `Réception provisoire - ${batiment}`, 'axe7_construction', '2026-10-31', 'Constructeur', '', `J-CON-${code}`, 'phase3_lancement'),
    createAction(`A-CON-${code}.7`, `Réception définitive - ${batiment}`, 'axe7_construction', '2026-11-30', 'Constructeur', '', `J-CON-${code}`, 'phase3_lancement'),
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
// AGGREGATION - 39 JALONS, 148 ACTIONS
// ============================================================================

export const ALL_JALONS: Omit<Jalon, 'id'>[] = [
  ...JALONS_AXE1_RH,           // 6 jalons
  ...JALONS_AXE2_COMMERCIAL,   // 7 jalons
  ...JALONS_AXE3_TECHNIQUE,    // 6 jalons
  ...JALONS_AXE4_BUDGET,       // 6 jalons
  ...JALONS_AXE5_MARKETING,    // 4 jalons
  ...JALONS_AXE6_EXPLOITATION, // 4 jalons
  ...JALONS_AXE7_CONSTRUCTION, // 6 jalons
];

export const ALL_ACTIONS: Omit<Action, 'id'>[] = [
  ...ACTIONS_AXE1_RH,           // 8 actions
  ...ACTIONS_AXE2_COMMERCIAL,   // 27 actions
  ...ACTIONS_AXE3_TECHNIQUE,    // 30 actions
  ...ACTIONS_AXE4_BUDGET,       // 6 actions
  ...ACTIONS_AXE5_MARKETING,    // 30 actions
  ...ACTIONS_AXE6_EXPLOITATION, // 17 actions
  ...ACTIONS_AXE7_CONSTRUCTION, // 42 actions
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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    for (const poste of BUDGET_EXPLOITATION_2026.postes) {
      if (!existingBudgetLabels.has(poste.poste)) {
        const tauxConsommation = 0.08;
        const montantEngage = Math.round(poste.budgetAnnuel * tauxConsommation * 1.2);
        const montantRealise = Math.round(poste.budgetAnnuel * tauxConsommation * 0.9);

        const budgetItem: Omit<BudgetItem, 'id'> = {
          libelle: poste.poste,
          categorie: CATEGORIE_MAPPING[poste.categorie],
          axe: CATEGORIE_AXE_MAPPING[poste.categorie],
          projectPhase: 'phase2_mobilisation',
          montantPrevu: poste.budgetAnnuel,
          montantEngage,
          montantRealise,
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
 * Seed uniquement les données budgétaires
 * Utile pour ajouter les budgets sans toucher aux autres données
 */
export async function seedBudgetOnly(): Promise<{ budgetCreated: number }> {
  const result = { budgetCreated: 0 };
  const now = new Date().toISOString();

  await db.transaction('rw', [db.budget], async () => {
    // Vider le budget existant
    await db.budget.clear();

    // Budget 2026
    for (const poste of BUDGET_EXPLOITATION_2026.postes) {
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
    }

    // Budget 2027
    for (const poste of BUDGET_EXPLOITATION_2027.postes) {
      const budgetItem: Omit<BudgetItem, 'id'> = {
        libelle: `${poste.poste} (2027)`,
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
    }
  });

  return result;
}
