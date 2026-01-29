// ============================================================================
// COSMOS ANGRÉ - SEED RISQUES
// Fonction pour charger les 46 risques réels dans la base de données IndexedDB
// ============================================================================

import { db } from '@/db';
import { REGISTRE_RISQUES_COSMOS_ANGRE, type RisqueCosmosAngre } from './risquesCosmosAngre';
import type { Risque, RisqueCategory, ProjectPhase, Axe } from '@/types';

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
    default: return 'operationnel';
  }
};

/**
 * Convertit une phase du registre en ProjectPhase
 */
const mapPhase = (phase: string): ProjectPhase => {
  switch (phase) {
    case 'phase1_preparation': return 'phase1_preparation';
    case 'phase2_mobilisation': return 'phase2_mobilisation';
    case 'phase3_lancement': return 'phase3_lancement';
    case 'phase4_stabilisation': return 'phase4_stabilisation';
    default: return 'phase2_mobilisation';
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
    case 'financier': return 'axe4_budget';
    case 'operationnel': return 'axe6_exploitation';
    case 'reglementaire': return 'axe6_exploitation';
    default: return 'axe6_exploitation';
  }
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
    projectPhase: mapPhase(risque.phase),

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
    tendance_risque: risque.tendance || 'stable',
    detectabilite: 2,
    velocite: 'normale',
    proximite: risque.phase === 'phase1_preparation' ? 'imminent' :
               risque.phase === 'phase2_mobilisation' ? 'court_terme' : 'moyen_terme',

    // Impact détaillé
    impact_cout: null,
    impact_delai_jours: null,
    impact_qualite: risque.impact >= 4 ? 'majeur' : risque.impact >= 3 ? 'modere' : 'faible',
    impact_reputation: risque.impact >= 4 ? 'majeur' : 'modere',
    impact_securite: risque.categorie === 'reglementaire' ? 'majeur' : 'faible',
    description_impact: null,

    // Statut
    statut: 'open',
    phase_traitement: 'identification',
    date_derniere_evaluation: now,
    prochaine_revue: null,

    // Responsabilités
    proprietaire: risque.proprietaire,
    gestionnaire: null,
    validateur: 'DGA',
    equipe_response: [],
    escalade_niveau1: 'Managers',
    escalade_niveau2: 'DGA',
    escalade_niveau3: 'PDG',

    // Mitigation
    strategie_reponse: 'attenuer',
    plan_mitigation: risque.mitigations.map(m => `- ${m.action} (${m.responsable}, ${m.deadline})`).join('\n'),
    actions_mitigation: risque.mitigations.map((m, index) => ({
      id: `${risque.code}-MIT-${String(index + 1).padStart(3, '0')}`,
      action: m.action,
      responsable: m.responsable,
      deadline: m.deadline,
      statut: m.statut === 'fait' ? 'termine' : m.statut === 'en_cours' ? 'en_cours' : 'planifie',
      efficacite: null,
    })),
    cout_mitigation: null,
    efficacite_prevue: null,

    // Contingence
    plan_contingence: risque.actionImmediate || null,
    declencheur_contingence: risque.indicateursDeclenchement?.join(', ') || null,
    cout_contingence: null,
    actions_contingence: [],

    // Liens
    jalons_impactes: risque.jalonsImpactes,
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
      commentaire: 'Risque identifié lors du cadrage projet',
      auteur: 'Équipe Projet',
    }],

    // Alertes
    alertes_actives: risque.niveau === 'critique',
    seuil_alerte_score: risque.niveau === 'critique' ? 12 : 8,
    canal_alerte: ['email'],
    notifier: [risque.proprietaire],

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
    status: 'open',
    responsable: risque.proprietaire,
    createdAt: now,
    updatedAt: now,
  } as unknown as Omit<Risque, 'id'>;
};

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

/**
 * Charge tous les risques du registre dans la base de données
 * @param siteId ID du site (par défaut 1 pour Cosmos Angré)
 * @param clearExisting Si true, supprime les risques existants avant le chargement
 */
export async function seedRisquesCosmosAngre(
  siteId: number = 1,
  clearExisting: boolean = false
): Promise<{ success: boolean; count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  try {
    // Optionnellement, vider les risques existants
    if (clearExisting) {
      await db.risques.where('siteId').equals(siteId).delete();
    }

    // Convertir et insérer chaque risque
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
    critique: risques.filter(r => r.score >= 12).length,
    majeur: risques.filter(r => r.score >= 8 && r.score < 12).length,
    modere: risques.filter(r => r.score >= 4 && r.score < 8).length,
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
