// ============================================================================
// COSMOS ANGRÉ - TRANSFORMATION DES DONNÉES DE RÉFÉRENCE VERS DB
// Convertit le référentiel officiel au format IndexedDB
// ============================================================================

import type {
  Action,
  Jalon,
  Risque,
  Axe,
  ActionStatus,
  ActionSante,
  Priorite,
  ProjectPhase,
} from '@/types';

import { PROJECT_PHASE_DATES } from '@/types';
import { getAlertDates, type BuildingCode } from '@/lib/utils';

// Import tous les jalons
import {
  RESPONSABLES,
  JALONS_GLOBAUX,
  JALONS_AXE1,
  JALONS_AXE2_GLOBAL,
  JALONS_AXE2_CC,
  JALONS_AXE2_BB,
  JALONS_AXE2_ZE,
  JALONS_AXE2_MA,
  JALONS_AXE2_PK,
  JALONS_AXE3_RECEPTION,
  JALONS_AXE3_FITOUT,
  JALONS_AXE3_EQUIPEMENTS,
  JALONS_AXE4,
  JALONS_AXE5,
  JALONS_AXE6,
  // Actions Axe 1-2
  ACTIONS_AXE1,
  ACTIONS_AXE2_STRATEGIQUES,
  ACTIONS_AXE2_BEFA,
  ACTIONS_AXE2_CC,
  ACTIONS_AXE2_BB,
  ACTIONS_AXE2_ZE,
  ACTIONS_AXE2_MA,
  ACTIONS_AXE2_PK,
} from './cosmosAngreRef';

// Import actions Axe 3-6 et risques
import {
  ACTIONS_AXE3_CHANTIER,
  ACTIONS_AXE3_RECEPTION,
  ACTIONS_AXE3_FITOUT,
  ACTIONS_AXE3_EQUIPEMENTS,
  ACTIONS_AXE4,
  ACTIONS_AXE5,
  ACTIONS_AXE6,
  ACTIONS_AFFICHAGE,
  ACTIONS_BASSIN,
  // Risques
  RISQUES_GLOBAUX,
  RISQUES_AXE1,
  RISQUES_AXE2,
  RISQUES_AXE3,
  RISQUES_AXE4,
  RISQUES_AXE5,
  RISQUES_AXE6,
  RISQUES_CC,
  RISQUES_BB,
  RISQUES_ZE,
  RISQUES_MA,
  RISQUES_PK,
} from './cosmosAngreRef2';

// Import données V2 (actions supplémentaires, métadonnées, etc.)
import {
  ACTIONS_AXE1_SUPPLEMENTAIRES,
  PROJECT_METADATA,
  AXES_STRATEGIQUES,
  PHASES_PROJET,
  VAGUES_RECRUTEMENT,
  CALENDRIER_2026,
  CHECKLIST_PRE_OUVERTURE,
  JALONS_CRITIQUES_CHEMIN_CRITIQUE,
  COMPTEURS_SYNTHESE,
} from './cosmosAngreRef3';

// ============================================================================
// CONSTANTES ET MAPPINGS
// ============================================================================

// Mapping des responsables vers les IDs utilisateurs
const responsableToUserId: Record<string, number> = {
  [RESPONSABLES.DGA]: 1,
  [RESPONSABLES.CENTER_MANAGER]: 2,
  [RESPONSABLES.FM]: 3,
  [RESPONSABLES.COMMERCIAL_MGR]: 4,
  [RESPONSABLES.SECURITY_MGR]: 5,
  [RESPONSABLES.MARKETING_MGR]: 6,
  [RESPONSABLES.IT]: 7,
  [RESPONSABLES.FINANCE]: 8,
  [RESPONSABLES.JURIDIQUE]: 9,
  [RESPONSABLES.RH]: 10,
  [RESPONSABLES.TECHNIQUE]: 3,
  [RESPONSABLES.MANAGERS]: 2,
};

// Dates de phase pré-calculées (évite de créer des objets Date à chaque appel)
const PHASE_DATES_PARSED = {
  phase1: {
    start: new Date(PROJECT_PHASE_DATES.phase1_preparation.debut),
    end: new Date(PROJECT_PHASE_DATES.phase1_preparation.fin),
  },
  phase2: {
    start: new Date(PROJECT_PHASE_DATES.phase2_mobilisation.debut),
    end: new Date(PROJECT_PHASE_DATES.phase2_mobilisation.fin),
  },
  phase3: {
    start: new Date(PROJECT_PHASE_DATES.phase3_lancement.debut),
    end: new Date(PROJECT_PHASE_DATES.phase3_lancement.fin),
  },
  phase4: {
    start: new Date(PROJECT_PHASE_DATES.phase4_stabilisation.debut),
    end: new Date(PROJECT_PHASE_DATES.phase4_stabilisation.fin),
  },
} as const;

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

// Déterminer la phase projet (Cosmos Angré V2.0) basée sur la date
// Limites non chevauchantes pour attribution unique :
//   Phase 1 Préparation   : ≤ 31 mars 2026
//   Phase 2 Mobilisation  : 1 avril – 30 septembre 2026
//   Phase 3 Lancement     : 1 octobre – 31 décembre 2026
//   Phase 4 Stabilisation : ≥ 1 janvier 2027
function getProjectPhaseFromDate(dateStr: string): ProjectPhase {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-indexed

  if (y < 2026) return 'phase1_preparation';
  if (y === 2026 && m <= 2) return 'phase1_preparation';   // Jan-Mar 2026
  if (y === 2026 && m <= 8) return 'phase2_mobilisation';   // Apr-Sep 2026
  if (y === 2026) return 'phase3_lancement';                // Oct-Dec 2026
  return 'phase4_stabilisation';                            // 2027+
}

// Déterminer le statut basé sur les dates
function getStatusFromDates(dateDebut: string, dateFin: string): ActionStatus {
  const today = new Date();
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);

  if (today < debut) return 'planifie';
  if (today > fin) return 'termine';
  return 'en_cours';
}

// Déterminer l'avancement basé sur les dates
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

// Déterminer la santé
function getSante(statut: ActionStatus, avancement: number): ActionSante {
  if (statut === 'termine') return 'vert';
  if (statut === 'bloque') return 'rouge';
  if (statut === 'en_attente') return 'bleu';
  if (statut === 'planifie') return 'gris';
  if (avancement >= 80) return 'vert';
  if (avancement >= 50) return 'jaune';
  return 'orange';
}

// Déterminer l'axe à partir de l'ID
function getAxeFromId(id: string): Axe {
  if (id.startsWith('A1-')) return 'axe1_rh';
  if (id.startsWith('A2-')) return 'axe2_commercial';
  if (id.startsWith('A3-')) return 'axe3_technique';
  if (id.startsWith('A4-')) return 'axe4_budget';
  if (id.startsWith('A5-')) return 'axe5_marketing';
  if (id.startsWith('A6-')) return 'axe6_exploitation';
  if (id.startsWith('A-AFF')) return 'axe5_marketing';
  if (id.startsWith('A-BR')) return 'axe3_technique';
  return 'axe3_technique';
}

// Déterminer l'axe DB à partir du string
function getAxeDb(axeStr: string): Axe {
  if (axeStr === 'global') return 'axe3_technique';
  if (axeStr === 'axe1_rh') return 'axe1_rh';
  if (axeStr === 'axe2_commercial') return 'axe2_commercial';
  if (axeStr === 'axe3_technique') return 'axe3_technique';
  if (axeStr === 'axe4_budget') return 'axe4_budget';
  if (axeStr === 'axe5_marketing') return 'axe5_marketing';
  if (axeStr === 'axe6_exploitation') return 'axe6_exploitation';
  return 'axe3_technique';
}

// Transformer une action du référentiel en action DB
function transformAction(refAction: {
  id: string;
  titre: string;
  description?: string;
  dateDebut?: string;
  dateFin: string;
  responsable: string;
  priorite?: Priorite;
  buildingCode?: string;
  systeme?: string;
}): Omit<Action, 'id'> {
  const dateDebut = refAction.dateDebut || new Date(new Date(refAction.dateFin).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const statut = getStatusFromDates(dateDebut, refAction.dateFin);
  const avancement = getAvancement(dateDebut, refAction.dateFin);
  const sante = getSante(statut, avancement);
  const axe = getAxeFromId(refAction.id);

  const dateDebutObj = new Date(dateDebut);
  const dateFinObj = new Date(refAction.dateFin);
  const dureePrevue = Math.ceil((dateFinObj.getTime() - dateDebutObj.getTime()) / (1000 * 60 * 60 * 24)) || 1;
  const alertes = getAlertDates(dateFinObj);

  return {
    id_action: refAction.id,
    code_wbs: `WBS-${refAction.id.replace(/-/g, '')}`,
    titre: refAction.titre,
    description: refAction.description || refAction.titre,
    axe,
    phase: statut === 'termine' ? 'cloture' : statut === 'planifie' ? 'planification' : 'execution',
    categorie: 'coordination',
    sous_categorie: null,
    type_action: 'tache',
    date_creation: new Date().toISOString(),
    date_debut_prevue: dateDebut,
    date_fin_prevue: refAction.dateFin,
    date_debut_reelle: avancement > 0 ? dateDebut : null,
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
    approbateur: RESPONSABLES.DGA,
    consultes: [],
    informes: [],
    delegue: null,
    escalade_niveau1: RESPONSABLES.CENTER_MANAGER,
    escalade_niveau2: RESPONSABLES.DGA,
    escalade_niveau3: RESPONSABLES.DGA,
    predecesseurs: [],
    successeurs: [],
    contraintes_externes: null,
    chemin_critique: refAction.priorite === 'critique',
    ressources_humaines: [refAction.responsable],
    charge_homme_jour: dureePrevue * 0.5,
    budget_prevu: null,
    budget_engage: null,
    budget_realise: null,
    ligne_budgetaire: null,
    livrables: [],
    criteres_acceptation: [],
    validateur_qualite: RESPONSABLES.DGA,
    documents: [],
    lien_sharepoint: null,
    modele_document: null,
    statut,
    avancement,
    methode_avancement: 'manuel',
    tendance: avancement >= 50 ? 'amelioration' : 'stable',
    sante,
    notes_internes: refAction.systeme ? `Système: ${refAction.systeme}` : null,
    commentaire_reporting: null,
    historique_commentaires: [],
    visibilite_reporting: ['flash_hebdo', 'copil'],
    risques_associes: [],
    problemes_ouverts: [],
    points_blocage: null,
    escalade_requise: false,
    niveau_escalade: null,
    priorite: refAction.priorite || 'moyenne',
    score_priorite: refAction.priorite === 'critique' ? 90 : refAction.priorite === 'haute' ? 70 : 50,
    impact_si_retard: refAction.priorite === 'critique' ? 'critique' : 'modere',
    version: 1,
    date_modification: new Date().toISOString(),
    modifie_par: 'Système',
    motif_modification: null,
    jalonId: null,
    buildingCode: refAction.buildingCode as BuildingCode | undefined,
    projectPhase: getProjectPhaseFromDate(refAction.dateFin),
  };
}

// Transformer un jalon du référentiel en jalon DB
function transformJalon(refJalon: {
  id: string;
  titre: string;
  date: string;
  responsable: string;
  axe: string;
  critique?: boolean;
  buildingCode?: string;
  livrables?: string;
  detail?: string;
  cible?: string;
  systeme?: string;
  dependances?: string[];
}): Omit<Jalon, 'id'> {
  const today = new Date();
  const dateJalon = new Date(refJalon.date);
  const statut = today > dateJalon ? 'atteint' : today.getTime() > dateJalon.getTime() - 7 * 24 * 60 * 60 * 1000 ? 'a_risque' : 'en_cours';
  const alertes = getAlertDates(dateJalon);
  const axeDb = getAxeDb(refJalon.axe);

  return {
    id_jalon: refJalon.id,
    code_wbs: `WBS-${refJalon.id.replace(/-/g, '')}`,
    titre: refJalon.titre,
    description: [refJalon.livrables, refJalon.detail, refJalon.cible, refJalon.systeme].filter(Boolean).join(' | ') || refJalon.titre,
    axe: axeDb,
    categorie: 'validation',
    type_jalon: refJalon.critique ? 'contractuel' : 'technique',
    niveau_importance: refJalon.critique ? 'critique' : 'majeur',
    date_prevue: refJalon.date,
    date_reelle: statut === 'atteint' ? refJalon.date : null,
    heure_cible: '17:00',
    fuseau_horaire: 'Africa/Abidjan',
    date_butoir_absolue: refJalon.critique ? refJalon.date : null,
    flexibilite: refJalon.critique ? 'aucune' : 'faible',
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
    validateur: RESPONSABLES.DGA,
    contributeurs: [],
    parties_prenantes: [],
    escalade_niveau1: RESPONSABLES.CENTER_MANAGER,
    escalade_niveau2: RESPONSABLES.DGA,
    escalade_niveau3: RESPONSABLES.DGA,
    predecesseurs: refJalon.dependances || [],
    successeurs: [],
    actions_prerequises: [],
    chemin_critique: refJalon.critique || false,
    impact_retard: refJalon.critique ? 'critique' : 'majeur',
    cout_retard_jour: refJalon.critique ? 10000000 : 2000000,
    risques_associes: [],
    probabilite_atteinte: statut === 'atteint' ? 100 : 80,
    buildingCode: refJalon.buildingCode as BuildingCode | undefined,
    projectPhase: getProjectPhaseFromDate(refJalon.date),
  };
}

// Transformer un risque du référentiel en risque DB
function transformRisque(refRisque: {
  id: string;
  titre: string;
  description?: string;
  probabilite: number;
  impact: number;
  criticite: number;
  mitigation?: string;
  responsable?: string;
  axe?: string;
  batiment?: string;
  buildingCode?: string;
}): Omit<Risque, 'id'> {
  // Mapper les catégories
  let categorieDb: 'technique' | 'financier' | 'planning' | 'securite' | 'contractuel' | 'environnemental' = 'technique';
  const lower = refRisque.titre.toLowerCase();
  if (lower.includes('budget') || lower.includes('dépassement') || lower.includes('coût') || lower.includes('trésorerie') || lower.includes('financ')) categorieDb = 'financier';
  else if (lower.includes('retard') || lower.includes('planning') || lower.includes('délai')) categorieDb = 'planning';
  else if (lower.includes('sécurité') || lower.includes('commission') || lower.includes('incendie')) categorieDb = 'securite';
  else if (lower.includes('contrat') || lower.includes('prestataire')) categorieDb = 'contractuel';

  return {
    titre: refRisque.titre,
    description: refRisque.description || refRisque.titre,
    categorie: categorieDb,
    probabilite: refRisque.probabilite,
    impact: refRisque.impact,
    score: refRisque.criticite,
    status: refRisque.criticite >= 16 ? 'open' : 'mitigated',
    responsableId: refRisque.responsable ? responsableToUserId[refRisque.responsable] || 1 : 1,
    planMitigation: refRisque.mitigation || '',
    actionsPreventives: [],
    buildingCode: refRisque.buildingCode as BuildingCode | undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    projectPhase: 'phase2_mobilisation', // Risques par défaut en phase de mobilisation
  };
}

// ============================================================================
// EXPORTS PRINCIPAUX
// ============================================================================

// Exporter toutes les actions transformées
export function getAllActions(): Omit<Action, 'id'>[] {
  const allRefActions = [
    // Axe 1 (A1-001 à A1-013)
    ...ACTIONS_AXE1,
    // Axe 1 supplémentaires (A1-014 à A1-029)
    ...ACTIONS_AXE1_SUPPLEMENTAIRES,
    // Axe 2
    ...ACTIONS_AXE2_STRATEGIQUES,
    ...ACTIONS_AXE2_BEFA,
    ...ACTIONS_AXE2_CC,
    ...ACTIONS_AXE2_BB,
    ...ACTIONS_AXE2_ZE,
    ...ACTIONS_AXE2_MA,
    ...ACTIONS_AXE2_PK,
    // Axe 3
    ...ACTIONS_AXE3_CHANTIER,
    ...ACTIONS_AXE3_RECEPTION,
    ...ACTIONS_AXE3_FITOUT,
    ...ACTIONS_AXE3_EQUIPEMENTS,
    // Axe 4
    ...ACTIONS_AXE4,
    // Axe 5
    ...ACTIONS_AXE5,
    // Axe 6
    ...ACTIONS_AXE6,
    // Actions spéciales
    ...ACTIONS_AFFICHAGE,
    ...ACTIONS_BASSIN,
  ];

  return allRefActions.map(transformAction);
}

// Exporter tous les jalons transformés
export function getAllJalons(): Omit<Jalon, 'id'>[] {
  const allRefJalons = [
    // Jalons globaux
    ...JALONS_GLOBAUX,
    // Axe 1
    ...JALONS_AXE1,
    // Axe 2
    ...JALONS_AXE2_GLOBAL,
    ...JALONS_AXE2_CC,
    ...JALONS_AXE2_BB,
    ...JALONS_AXE2_ZE,
    ...JALONS_AXE2_MA,
    ...JALONS_AXE2_PK,
    // Axe 3
    ...JALONS_AXE3_RECEPTION,
    ...JALONS_AXE3_FITOUT,
    ...JALONS_AXE3_EQUIPEMENTS,
    // Axe 4
    ...JALONS_AXE4,
    // Axe 5
    ...JALONS_AXE5,
    // Axe 6
    ...JALONS_AXE6,
  ];

  return allRefJalons.map(transformJalon);
}

// Exporter tous les risques transformés
export function getAllRisques(): Omit<Risque, 'id'>[] {
  const allRefRisques = [
    // Risques globaux
    ...RISQUES_GLOBAUX,
    // Par axe
    ...RISQUES_AXE1,
    ...RISQUES_AXE2,
    ...RISQUES_AXE3,
    ...RISQUES_AXE4,
    ...RISQUES_AXE5,
    ...RISQUES_AXE6,
    // Par bâtiment
    ...RISQUES_CC,
    ...RISQUES_BB,
    ...RISQUES_ZE,
    ...RISQUES_MA,
    ...RISQUES_PK,
  ];

  return allRefRisques.map(transformRisque);
}

// Exporter les constantes
export { RESPONSABLES };

// Exporter les données V2.0
export {
  PROJECT_METADATA,
  AXES_STRATEGIQUES,
  PHASES_PROJET,
  VAGUES_RECRUTEMENT,
  CALENDRIER_2026,
  CHECKLIST_PRE_OUVERTURE,
  JALONS_CRITIQUES_CHEMIN_CRITIQUE,
  COMPTEURS_SYNTHESE,
};

// Réexporter toutes les données de référence V2.0
export * from './cosmosAngreRef3';

// Réexporter données complémentaires (RACI, Budget détaillé, Fiches risques enrichies)
export * from './cosmosAngreRef4';
