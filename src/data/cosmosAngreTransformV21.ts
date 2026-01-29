// ============================================================================
// COSMOS ANGRÉ - TRANSFORMATION V2.1 DES DONNÉES DE RÉFÉRENCE VERS DB
// Convertit le référentiel officiel V2.1 au format IndexedDB
// 19 Jalons | 102 Actions
// ============================================================================

import type {
  Action,
  Jalon,
  Axe,
  ActionStatus,
  ActionSante,
  Priorite,
  ProjectPhase,
  JalonStatus,
} from '@/types';

import { getAlertDates } from '@/lib/utils';

import {
  RESPONSABLES_V21,
  JALONS_V21,
  ACTIONS_V21,
  type JalonV21,
  type ActionV21,
  type AxeV21,
} from './cosmosAngreRefV21';

// ============================================================================
// CONSTANTES ET MAPPINGS
// ============================================================================

// Mapping des responsables vers les IDs utilisateurs
const responsableToUserId: Record<string, number> = {
  [RESPONSABLES_V21.DGA]: 2,
  [RESPONSABLES_V21.CENTER_MANAGER]: 3,
  [RESPONSABLES_V21.FM]: 4,
  [RESPONSABLES_V21.COMMERCIAL_MGR]: 2,
  [RESPONSABLES_V21.SECURITY_MGR]: 3,
  [RESPONSABLES_V21.MARKETING_MGR]: 4,
  [RESPONSABLES_V21.FINANCE]: 5,
  [RESPONSABLES_V21.IT]: 6,
  [RESPONSABLES_V21.RH]: 3,
  [RESPONSABLES_V21.TECHNIQUE]: 4,
  [RESPONSABLES_V21.JURIDIQUE]: 7,
  [RESPONSABLES_V21.TOUS]: 3,
  [RESPONSABLES_V21.DIRECTION]: 2,
};

// Mapping des axes V2.1 vers les axes DB
const axeV21ToAxeDb: Record<AxeV21, Axe> = {
  'Gouvernance': 'axe4_budget',
  'Commercial': 'axe2_commercial',
  'Technique': 'axe3_technique',
  'RH': 'axe1_rh',
  'Marketing': 'axe5_marketing',
  'Exploitation': 'axe6_exploitation',
  'Tous': 'axe3_technique', // Default pour les jalons "Tous"
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Détermine le statut d'une action basé sur ses dates
 */
function getStatusFromDates(dateDebut: string, dateFin: string): ActionStatus {
  const today = new Date();
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);

  if (today < debut) return 'planifie';
  if (today > fin) return 'termine';
  return 'en_cours';
}

/**
 * Détermine l'avancement basé sur les dates
 */
function getAvancement(dateDebut: string, dateFin: string): number {
  const today = new Date();
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);

  if (today < debut) return 0;
  if (today > fin) return 100;

  const total = fin.getTime() - debut.getTime();
  const elapsed = today.getTime() - debut.getTime();
  return Math.round((elapsed / total) * 100);
}

/**
 * Détermine la santé d'une action
 */
function getSante(statut: ActionStatus, avancement: number): ActionSante {
  if (statut === 'termine') return 'vert';
  if (statut === 'bloque') return 'rouge';
  if (statut === 'en_attente') return 'bleu';
  if (statut === 'planifie') return 'gris';
  if (avancement >= 80) return 'vert';
  if (avancement >= 50) return 'jaune';
  return 'orange';
}

/**
 * Détermine le statut d'un jalon basé sur sa date
 */
function getJalonStatus(dateJalon: string): JalonStatus {
  const today = new Date();
  const date = new Date(dateJalon);
  const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (today > date) return 'atteint'; // Ou 'depasse' selon le contexte
  if (daysUntil <= 7) return 'en_danger';
  if (daysUntil <= 30) return 'en_approche';
  return 'a_venir';
}

// ============================================================================
// TRANSFORMATION DES JALONS V2.1 → FORMAT DB
// ============================================================================

/**
 * Transforme un jalon V2.1 en jalon format IndexedDB
 */
function transformJalonV21(refJalon: JalonV21): Omit<Jalon, 'id'> {
  const dateJalon = new Date(refJalon.date);
  const alertes = getAlertDates(dateJalon);
  const axeDb = axeV21ToAxeDb[refJalon.axe];
  const statut = getJalonStatus(refJalon.date);

  return {
    id_jalon: refJalon.id,
    code_wbs: `WBS-JAL-V21-${refJalon.numero.toString().padStart(2, '0')}`,
    titre: refJalon.titre,
    description: refJalon.description,
    axe: axeDb,
    categorie: refJalon.isKeyDate ? 'inauguration' : 'validation',
    type_jalon: refJalon.niveau === 'critique' ? 'contractuel' : 'managerial',
    niveau_importance: refJalon.niveau,
    date_prevue: refJalon.date,
    date_reelle: statut === 'atteint' ? refJalon.date : null,
    heure_cible: refJalon.isKeyDate ? '10:00' : '17:00',
    fuseau_horaire: 'Africa/Abidjan',
    date_butoir_absolue: refJalon.niveau === 'critique' ? refJalon.date : null,
    flexibilite: refJalon.niveau === 'critique' ? 'aucune' : 'faible',
    alerte_j30: alertes.j30,
    alerte_j15: alertes.j15,
    alerte_j7: alertes.j7,
    statut,
    avancement_prealables: statut === 'atteint' ? 100 : 50,
    confiance_atteinte: statut === 'atteint' ? 100 : 75,
    tendance: 'stable',
    date_derniere_maj: new Date().toISOString(),
    maj_par: 'Système',
    responsable: refJalon.responsable,
    validateur: RESPONSABLES_V21.DGA,
    contributeurs: [],
    parties_prenantes: [],
    escalade_niveau1: RESPONSABLES_V21.CENTER_MANAGER,
    escalade_niveau2: RESPONSABLES_V21.DGA,
    escalade_niveau3: RESPONSABLES_V21.DGA,
    predecesseurs: (refJalon.dependances || []).map(depId => ({
      id: depId,
      titre: JALONS_V21.find(j => j.id === depId)?.titre || depId,
      statut: getJalonStatus(JALONS_V21.find(j => j.id === depId)?.date || '2026-12-31'),
      date_prevue: JALONS_V21.find(j => j.id === depId)?.date || '2026-12-31',
    })),
    successeurs: [],
    actions_prerequises: ACTIONS_V21.filter(a => a.jalonId === refJalon.id).map(a => a.id),
    chemin_critique: refJalon.niveau === 'critique',
    impact_retard: refJalon.niveau === 'critique' ? 'critique' : 'majeur',
    cout_retard_jour: refJalon.niveau === 'critique' ? 10000000 : 2000000,
    risques_associes: [],
    probabilite_atteinte: statut === 'atteint' ? 100 : 80,
    plan_contingence: null,
    livrables: (refJalon.livrables || []).map((liv, idx) => ({
      id: `${refJalon.id}-LIV-${idx + 1}`,
      nom: liv,
      description: null,
      statut: statut === 'atteint' ? 'valide' : 'en_attente',
      obligatoire: true,
      date_prevue: refJalon.date,
      date_livraison: statut === 'atteint' ? refJalon.date : null,
      validateur: RESPONSABLES_V21.DGA,
    })),
    criteres_acceptation: (refJalon.criteres || []).map((crit, idx) => ({
      id: `${refJalon.id}-CRIT-${idx + 1}`,
      critere: crit,
      valide: statut === 'atteint',
      date_validation: statut === 'atteint' ? refJalon.date : null,
      validateur: statut === 'atteint' ? RESPONSABLES_V21.DGA : null,
    })),
    budget_associe: null,
    budget_consomme: null,
    impact_financier_global: null,
    documents: [],
    lien_sharepoint: null,
    alertes_actives: true,
    canal_alerte: ['email', 'app'],
    frequence_rappel: 'hebdomadaire',
    notifier: [refJalon.responsable],
    notes: null,
    commentaire_reporting: null,
    visibilite: ['flash_hebdo', 'copil'],
    version: 1,
    date_creation: new Date().toISOString(),
    cree_par: 'Système V2.1',
    derniere_modification: new Date().toISOString(),
    modifie_par: 'Système',
    projectPhase: refJalon.phase,
  };
}

// ============================================================================
// TRANSFORMATION DES ACTIONS V2.1 → FORMAT DB
// ============================================================================

/**
 * Transforme une action V2.1 en action format IndexedDB
 */
function transformActionV21(refAction: ActionV21, jalonDbId: number | null): Omit<Action, 'id'> {
  const statut = getStatusFromDates(refAction.dateDebut, refAction.dateFin);
  const avancement = getAvancement(refAction.dateDebut, refAction.dateFin);
  const sante = getSante(statut, avancement);
  const axeDb = axeV21ToAxeDb[refAction.axe];

  const dateDebutObj = new Date(refAction.dateDebut);
  const dateFinObj = new Date(refAction.dateFin);
  const dureePrevue = Math.ceil((dateFinObj.getTime() - dateDebutObj.getTime()) / (1000 * 60 * 60 * 24)) || 1;
  const alertes = getAlertDates(dateFinObj);

  // Trouver le jalon parent pour récupérer la phase
  const jalonParent = JALONS_V21.find(j => j.id === refAction.jalonId);
  const projectPhase = jalonParent?.phase || 'phase2_mobilisation';

  return {
    id_action: refAction.id,
    code_wbs: `WBS-ACT-V21-${refAction.id.replace('.', '')}`,
    titre: refAction.titre,
    description: refAction.description,
    axe: axeDb,
    phase: statut === 'termine' ? 'cloture' : statut === 'planifie' ? 'planification' : 'execution',
    projectPhase,
    categorie: 'coordination',
    sous_categorie: null,
    type_action: 'tache',
    date_creation: new Date().toISOString(),
    date_debut_prevue: refAction.dateDebut,
    date_fin_prevue: refAction.dateFin,
    date_debut_reelle: avancement > 0 ? refAction.dateDebut : null,
    date_fin_reelle: statut === 'termine' ? refAction.dateFin : null,
    duree_prevue_jours: dureePrevue,
    duree_reelle_jours: statut === 'termine' ? dureePrevue : null,
    date_butoir: refAction.priorite === 'critique' ? refAction.dateFin : null,
    flexibilite: refAction.priorite === 'critique' ? 'aucune' : 'moyenne',
    alerte_j30: alertes.j30,
    alerte_j15: alertes.j15,
    alerte_j7: alertes.j7,
    alerte_j3: alertes.j3,
    responsable: refAction.responsable,
    responsableId: responsableToUserId[refAction.responsable] || 1,
    approbateur: RESPONSABLES_V21.DGA,
    consultes: [],
    informes: [],
    delegue: null,
    escalade_niveau1: RESPONSABLES_V21.CENTER_MANAGER,
    escalade_niveau2: RESPONSABLES_V21.DGA,
    escalade_niveau3: RESPONSABLES_V21.DGA,
    predecesseurs: [],
    successeurs: [],
    contraintes_externes: null,
    chemin_critique: refAction.priorite === 'critique',
    jalonId: jalonDbId,
    ressources_humaines: [refAction.responsable],
    charge_homme_jour: dureePrevue * 0.5,
    budget_prevu: null,
    budget_engage: null,
    budget_realise: null,
    ligne_budgetaire: null,
    livrables: (refAction.livrables || []).map((liv, idx) => ({
      id: `${refAction.id}-LIV-${idx + 1}`,
      nom: liv,
      description: null,
      statut: statut === 'termine' ? 'valide' : 'en_attente',
      obligatoire: true,
      date_prevue: refAction.dateFin,
      date_livraison: statut === 'termine' ? refAction.dateFin : null,
      validateur: RESPONSABLES_V21.DGA,
    })),
    criteres_acceptation: [],
    validateur_qualite: RESPONSABLES_V21.DGA,
    documents: [],
    lien_sharepoint: null,
    modele_document: null,
    statut,
    avancement,
    methode_avancement: 'manuel',
    tendance: avancement >= 50 ? 'amelioration' : 'stable',
    sante,
    notes_internes: null,
    commentaire_reporting: null,
    historique_commentaires: [],
    visibilite_reporting: ['flash_hebdo', 'copil'],
    risques_associes: [],
    problemes_ouverts: [],
    points_blocage: null,
    escalade_requise: false,
    niveau_escalade: null,
    priorite: refAction.priorite,
    score_priorite: refAction.priorite === 'critique' ? 90 : refAction.priorite === 'haute' ? 70 : refAction.priorite === 'moyenne' ? 50 : 30,
    impact_si_retard: refAction.priorite === 'critique' ? 'critique' : 'modere',
    version: 1,
    date_modification: new Date().toISOString(),
    modifie_par: 'Système',
    motif_modification: null,
  };
}

// ============================================================================
// FONCTIONS D'EXPORT PRINCIPALES
// ============================================================================

/**
 * Retourne tous les jalons V2.1 transformés pour IndexedDB
 */
export function getAllJalonsV21(): Omit<Jalon, 'id'>[] {
  return JALONS_V21.map(transformJalonV21);
}

/**
 * Retourne toutes les actions V2.1 transformées pour IndexedDB
 * Note: jalonId sera null initialement, puis sera mis à jour après insertion des jalons
 */
export function getAllActionsV21(): Omit<Action, 'id'>[] {
  return ACTIONS_V21.map(action => transformActionV21(action, null));
}

/**
 * Crée un mapping jalonId V2.1 -> jalonId DB après insertion
 */
export function createJalonIdMapping(insertedJalons: { id: number; id_jalon: string }[]): Map<string, number> {
  const mapping = new Map<string, number>();
  for (const jalon of insertedJalons) {
    mapping.set(jalon.id_jalon, jalon.id);
  }
  return mapping;
}

/**
 * Met à jour les jalonId des actions après insertion des jalons
 */
export function updateActionsWithJalonIds(
  actions: Omit<Action, 'id'>[],
  jalonIdMapping: Map<string, number>
): Omit<Action, 'id'>[] {
  return actions.map(action => {
    // Trouver le jalonId V2.1 de cette action
    const actionV21 = ACTIONS_V21.find(a => a.id === action.id_action);
    if (!actionV21) return action;

    const jalonDbId = jalonIdMapping.get(actionV21.jalonId);
    return {
      ...action,
      jalonId: jalonDbId ?? null,
    };
  });
}

/**
 * Retourne les statistiques V2.1
 */
export function getStatsV21() {
  return {
    totalJalons: JALONS_V21.length,
    totalActions: ACTIONS_V21.length,
    jalonsCritiques: JALONS_V21.filter(j => j.niveau === 'critique').length,
    jalonsMajeurs: JALONS_V21.filter(j => j.niveau === 'majeur').length,
    actionsParPhase: {
      phase1: ACTIONS_V21.filter(a => {
        const jalon = JALONS_V21.find(j => j.id === a.jalonId);
        return jalon?.phase === 'phase1_preparation';
      }).length,
      phase2: ACTIONS_V21.filter(a => {
        const jalon = JALONS_V21.find(j => j.id === a.jalonId);
        return jalon?.phase === 'phase2_mobilisation';
      }).length,
      phase3: ACTIONS_V21.filter(a => {
        const jalon = JALONS_V21.find(j => j.id === a.jalonId);
        return jalon?.phase === 'phase3_lancement';
      }).length,
      phase4: ACTIONS_V21.filter(a => {
        const jalon = JALONS_V21.find(j => j.id === a.jalonId);
        return jalon?.phase === 'phase4_stabilisation';
      }).length,
    },
  };
}

// Réexporter les éléments nécessaires du référentiel
export { RESPONSABLES_V21, JALONS_V21, ACTIONS_V21, PHASES_V21, STATS_V21 } from './cosmosAngreRefV21';
