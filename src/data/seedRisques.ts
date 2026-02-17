// ============================================================================
// COSMOS ANGRÉ - SEED RISQUES v2.0
// Charge les 68 risques corrigés dans la base de données IndexedDB
// ============================================================================

import { db } from '@/db';
import { REGISTRE_RISQUES_COSMOS_ANGRE, RESPONSABLES_RISQUES, type RisqueCosmosAngre } from './risquesCosmosAngre';
import type { Risque, RisqueCategory, Axe } from '@/types';
import { logger } from '@/lib/logger';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convertit une catégorie du registre en catégorie Risque
 */
const mapCategorie = (categorie: string): RisqueCategory => {
  switch (categorie) {
    case 'technique': return 'technique';
    case 'commercial': return 'commercial';
    case 'rh': return 'rh';
    case 'financier': return 'financier';
    case 'reglementaire': return 'reglementaire';
    case 'operationnel': return 'operationnel';
    case 'planning': return 'planning';
    case 'contractuel': return 'contractuel';
    case 'securite': return 'securite';
    case 'marketing': return 'marketing';
    case 'organisationnel': return 'organisationnel';
    case 'exploitation': return 'exploitation';
    case 'externe': return 'externe';
    case 'environnemental': return 'environnemental';
    case 'juridique': return 'juridique';
    case 'reputation': return 'reputation';
    case 'strategique': return 'strategique';
    default: return 'operationnel';
  }
};

/**
 * Détermine l'axe principal impacté selon la catégorie
 */
const mapAxe = (categorie: string): Axe => {
  switch (categorie) {
    case 'rh': return 'axe1_rh';
    case 'commercial': return 'axe2_commercial';
    case 'technique': return 'axe3_technique';
    case 'planning': return 'axe3_technique';
    case 'financier': return 'axe4_budget';
    case 'contractuel': return 'axe4_budget';
    case 'marketing': return 'axe5_marketing';
    case 'operationnel': return 'axe6_exploitation';
    case 'exploitation': return 'axe6_exploitation';
    case 'securite': return 'axe6_exploitation';
    case 'reglementaire': return 'axe6_exploitation';
    case 'organisationnel': return 'axe8_divers';
    case 'externe': return 'axe8_divers';
    default: return 'axe6_exploitation';
  }
};

/**
 * Résout le nom complet du responsable à partir des initiales
 */
const resolveResponsable = (initiales: string): string => {
  return RESPONSABLES_RISQUES[initiales] || initiales;
};

/**
 * Convertit un risque du registre Cosmos Angré en format Risque de la base de données
 */
export const convertToDbRisque = (
  risque: RisqueCosmosAngre,
  siteId: number
): Omit<Risque, 'id'> => {
  const now = new Date().toISOString();
  const year = new Date().getFullYear();
  const proprietaire = resolveResponsable(risque.responsable);
  const statut = risque.statut === 'Atténué' ? 'attenue' : 'ouvert';

  return {
    // Identification
    id_risque: `R-${year}-${risque.code.replace('R', '').padStart(3, '0')}`,
    code_wbs: `WBS-RSK-${risque.code.replace('R', '').padStart(3, '0')}`,
    titre: risque.titre,
    description: risque.description,

    // Classification
    type_risque: 'menace',
    source_risque: 'interne',
    categorie: mapCategorie(risque.categorie),
    sous_categorie: null,
    axe_impacte: mapAxe(risque.categorie),
    projectPhase: 'phase2_mobilisation',

    // Identification
    date_identification: now,
    identifie_par: 'Équipe Projet',

    // Évaluation
    probabilite_initiale: risque.probabilite,
    impact_initial: risque.impact,
    score_initial: risque.score,
    probabilite_actuelle: risque.probabilite,
    impact_actuel: risque.impact,
    score_actuel: risque.score,

    // Indicateurs complémentaires
    tendance_risque: 'stable',
    detectabilite: 2,
    velocite: 'normale',
    proximite: risque.score >= 16 ? 'imminent' : risque.score >= 10 ? 'court_terme' : 'moyen_terme',

    // Impact détaillé
    impact_cout: null,
    impact_delai_jours: null,
    impact_qualite: risque.impact >= 4 ? 'majeur' : risque.impact >= 3 ? 'modere' : 'faible',
    impact_reputation: risque.impact >= 4 ? 'majeur' : 'modere',
    impact_securite: risque.categorie === 'securite' ? 'majeur' : 'faible',
    description_impact: null,

    // Statut
    statut,
    phase_traitement: statut === 'attenue' ? 'traitement' : 'identification',
    date_derniere_evaluation: now,
    prochaine_revue: null,

    // Responsabilités
    proprietaire,
    gestionnaire: null,
    validateur: 'DGA',
    equipe_response: [],
    escalade_niveau1: 'Managers',
    escalade_niveau2: 'DGA',
    escalade_niveau3: 'PDG',

    // Mitigation
    strategie_reponse: 'attenuer',
    plan_mitigation: null,
    actions_mitigation: [],
    cout_mitigation: null,
    efficacite_prevue: null,

    // Contingence
    plan_contingence: null,
    declencheur_contingence: null,
    cout_contingence: null,
    actions_contingence: [],

    // Liens
    jalons_impactes: [],
    actions_liees: [],
    risques_lies: [],
    opportunites_liees: [],

    // Documentation
    documents: [],
    lien_sharepoint: null,

    // Historique
    historique: [{
      date: now,
      probabilite: risque.probabilite,
      impact: risque.impact,
      score: risque.score,
      commentaire: 'Risque identifié lors du cadrage projet v2.0',
      auteur: 'Équipe Projet',
    }],

    // Alertes
    alertes_actives: risque.score >= 16,
    seuil_alerte_score: risque.score >= 16 ? 16 : 10,
    canal_alerte: ['email'],
    notifier: [proprietaire],

    // Audit
    version: 1,
    date_creation: now,
    cree_par: 'Système',
    derniere_modification: now,
    modifie_par: 'Système',

    // Multi-sites
    siteId,

    // Champs simplifiés pour les hooks
    probabilite: risque.probabilite,
    impact: risque.impact,
    score: risque.score,
    status: statut === 'attenue' ? 'attenue' : 'open',
    responsable: proprietaire,
    createdAt: now,
    updatedAt: now,
  } as unknown as Omit<Risque, 'id'>;
};

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

/**
 * Charge tous les risques du registre dans la base de données
 */
export async function seedRisquesCosmosAngre(
  siteId: number = 1,
  clearExisting: boolean = false
): Promise<{ success: boolean; count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  try {
    if (clearExisting) {
      await db.risques.where('siteId').equals(siteId).delete();
    }

    for (const risque of REGISTRE_RISQUES_COSMOS_ANGRE) {
      try {
        const dbRisque = convertToDbRisque(risque, siteId);
        await db.risques.add(dbRisque as Risque);
        count++;
      } catch (error) {
        errors.push(`Erreur pour ${risque.code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { success: errors.length === 0, count, errors };
  } catch (error) {
    return {
      success: false,
      count: 0,
      errors: [`Erreur globale: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Vérifie si les risques ont déjà été chargés
 */
export async function areRisquesSeeded(siteId: number = 1): Promise<boolean> {
  const count = await db.risques.where('siteId').equals(siteId).count();
  return count >= REGISTRE_RISQUES_COSMOS_ANGRE.length;
}

/**
 * Retourne les statistiques des risques en base
 */
export async function getRisquesStats(siteId: number = 1): Promise<{
  total: number;
  parNiveau: { critique: number; majeur: number; modere: number; faible: number };
  parCategorie: Record<string, number>;
}> {
  const risques = await db.risques.where('siteId').equals(siteId).toArray();

  const parNiveau = {
    critique: risques.filter(r => r.score >= 16).length,
    majeur: risques.filter(r => r.score >= 10 && r.score < 16).length,
    modere: risques.filter(r => r.score >= 5 && r.score < 10).length,
    faible: risques.filter(r => r.score < 4).length,
  };

  const parCategorie: Record<string, number> = {};
  for (const risque of risques) {
    const cat = risque.categorie || 'non_defini';
    parCategorie[cat] = (parCategorie[cat] || 0) + 1;
  }

  return {
    total: risques.length,
    parNiveau,
    parCategorie,
  };
}

/**
 * Supprime tous les risques d'un site
 */
export async function clearRisques(siteId: number = 1): Promise<number> {
  return db.risques.where('siteId').equals(siteId).delete();
}

// ============================================================================
// MIGRATION v2.0
// ============================================================================

const MIGRATION_RISQUES_V2_KEY = 'migration_risques_v2_done';

/**
 * Migre les risques vers la v2.0 (68 risques corrigés)
 * - Supprime les anciens risques du site
 * - Re-seed depuis REGISTRE_RISQUES_COSMOS_ANGRE
 * - Idempotent via localStorage flag
 */
export async function migrateRisquesV2(siteId: number = 1): Promise<{
  skipped: boolean;
  deleted: number;
  created: number;
}> {
  if (localStorage.getItem(MIGRATION_RISQUES_V2_KEY)) {
    return { skipped: true, deleted: 0, created: 0 };
  }

  const existingCount = await db.risques.where('siteId').equals(siteId).count();
  logger.info(`[migrateRisquesV2] ${existingCount} risques existants, migration vers 68 risques corrigés...`);

  const deleted = await db.risques.where('siteId').equals(siteId).delete();

  const result = await seedRisquesCosmosAngre(siteId, false);

  localStorage.setItem(MIGRATION_RISQUES_V2_KEY, new Date().toISOString());

  logger.info(`[migrateRisquesV2] Migration terminée: ${deleted} supprimés, ${result.count} créés`);
  if (result.errors.length > 0) {
    logger.warn('[migrateRisquesV2] Erreurs:', result.errors);
  }

  return { skipped: false, deleted, created: result.count };
}
