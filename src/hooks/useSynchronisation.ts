import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type {
  SynchronisationMetrics,
  SyncStatus,
  PropagationRetard,
  Action,
  Axe,
} from '@/types';
import { AXE_SHORT_LABELS } from '@/types';

/**
 * Les 5 axes de mobilisation (tous sauf axe3_technique qui est la Construction)
 */
export const AXES_MOBILISATION: Axe[] = [
  'axe1_rh',
  'axe2_commercial',
  'axe4_budget',
  'axe5_marketing',
  'axe6_exploitation',
];

/**
 * Détail de l'avancement par axe de mobilisation
 */
export interface AxeMobilisationDetail {
  axe: Axe;
  label: string;
  avancement: number;
  actionsTotal: number;
  actionsTerminees: number;
  ecartVsConstruction: number;
}

/**
 * Métriques de synchronisation étendues avec détail par axe
 */
export interface SynchronisationMetricsExtended extends SynchronisationMetrics {
  detailParAxe: AxeMobilisationDetail[];
  axeCritique: Axe | null;
  axeEnAvance: Axe | null;
}

/**
 * Hook principal pour calculer les métriques de synchronisation
 * entre l'avancement technique (AXE 3 - Construction) et les 5 axes de mobilisation
 */
export function useSynchronisationMetrics(): SynchronisationMetricsExtended {
  const data = useLiveQuery(async () => {
    const actions = await db.actions.toArray();

    // Filtrer les actions techniques (AXE 3 - Construction)
    const actionsTechniques = actions.filter((a) => a.axe === 'axe3_technique');
    const avancementTechnique =
      actionsTechniques.length > 0
        ? actionsTechniques.reduce((sum, a) => sum + a.avancement, 0) / actionsTechniques.length
        : 0;

    // Filtrer les actions de mobilisation (5 autres axes)
    const actionsMobilisation = actions.filter((a) => AXES_MOBILISATION.includes(a.axe));
    const avancementMobilisation =
      actionsMobilisation.length > 0
        ? actionsMobilisation.reduce((sum, a) => sum + a.avancement, 0) / actionsMobilisation.length
        : 0;

    // Calculer le détail par axe de mobilisation
    const detailParAxe: AxeMobilisationDetail[] = AXES_MOBILISATION.map((axe) => {
      const actionsAxe = actions.filter((a) => a.axe === axe);
      const avancement =
        actionsAxe.length > 0
          ? actionsAxe.reduce((sum, a) => sum + a.avancement, 0) / actionsAxe.length
          : 0;
      const actionsTerminees = actionsAxe.filter((a) => a.statut === 'termine').length;

      return {
        axe,
        label: AXE_SHORT_LABELS[axe],
        avancement: Math.round(avancement * 10) / 10,
        actionsTotal: actionsAxe.length,
        actionsTerminees,
        ecartVsConstruction: Math.round((avancement - avancementTechnique) * 10) / 10,
      };
    });

    // Identifier l'axe le plus en retard (critique) et le plus en avance
    const axesAvecActions = detailParAxe.filter((d) => d.actionsTotal > 0);
    const axeCritique = axesAvecActions.length > 0
      ? axesAvecActions.reduce((min, d) => (d.avancement < min.avancement ? d : min)).axe
      : null;
    const axeEnAvance = axesAvecActions.length > 0
      ? axesAvecActions.reduce((max, d) => (d.avancement > max.avancement ? d : max)).axe
      : null;

    // Calculer l'écart (mobilisation - technique)
    const ecartPoints = avancementMobilisation - avancementTechnique;

    // Déterminer le statut de synchronisation
    let syncStatus: SyncStatus = 'en_phase';
    if (ecartPoints > 20) {
      syncStatus = 'critique'; // Mobilisation trop en avance = risque de gaspillage
    } else if (ecartPoints > 10) {
      syncStatus = 'en_avance'; // Mobilisation en avance
    } else if (ecartPoints < -20) {
      syncStatus = 'critique'; // Technique trop en retard = risque retard ouverture
    } else if (ecartPoints < -10) {
      syncStatus = 'en_retard'; // Mobilisation en retard par rapport au technique
    }

    // Analyser les risques
    const risqueGaspillage = ecartPoints > 15; // Mobilisation trop en avance
    const risqueRetardOuverture = ecartPoints < -15; // Technique en retard

    return {
      avancement_technique: Math.round(avancementTechnique * 10) / 10,
      avancement_mobilisation: Math.round(avancementMobilisation * 10) / 10,
      ecart_points: Math.round(ecartPoints * 10) / 10,
      sync_status: syncStatus,
      risque_gaspillage: risqueGaspillage,
      risque_retard_ouverture: risqueRetardOuverture,
      detailParAxe,
      axeCritique,
      axeEnAvance,
    };
  });

  return (
    data ?? {
      avancement_technique: 0,
      avancement_mobilisation: 0,
      ecart_points: 0,
      sync_status: 'en_phase',
      risque_gaspillage: false,
      risque_retard_ouverture: false,
      detailParAxe: [],
      axeCritique: null,
      axeEnAvance: null,
    }
  );
}

/**
 * Hook pour récupérer tous les liens de synchronisation
 */
export function useLiensSync() {
  return useLiveQuery(async () => {
    return db.liensSync.toArray();
  }) ?? [];
}

/**
 * Hook pour récupérer les actions liées à une action donnée
 */
export function useActionsLiees(actionId: string, axe: Axe) {
  return useLiveQuery(async () => {
    const liens = await db.liensSync.toArray();
    const actions = await db.actions.toArray();

    // Action technique (Construction) → cherche les actions mobilisation liées
    if (axe === 'axe3_technique') {
      const liensAssocies = liens.filter((l) => l.action_technique_id === actionId);
      const actionIds = liensAssocies.map((l) => l.action_mobilisation_id);
      return {
        liens: liensAssocies,
        actions: actions.filter((a) => actionIds.includes(a.id_action)),
      };
    }
    // Action mobilisation (5 axes) → cherche les actions techniques liées
    else if (AXES_MOBILISATION.includes(axe)) {
      const liensAssocies = liens.filter((l) => l.action_mobilisation_id === actionId);
      const actionIds = liensAssocies.map((l) => l.action_technique_id);
      return {
        liens: liensAssocies,
        actions: actions.filter((a) => actionIds.includes(a.id_action)),
      };
    }
    return { liens: [], actions: [] };
  }, [actionId, axe]) ?? { liens: [], actions: [] };
}

/**
 * Créer un lien entre une action technique et une action de mobilisation
 */
export async function createLienSync(
  actionTechniqueId: string,
  actionMobilisationId: string,
  propagationRetard: boolean = true
): Promise<number> {
  return db.liensSync.add({
    action_technique_id: actionTechniqueId,
    action_mobilisation_id: actionMobilisationId,
    propagation_retard: propagationRetard,
    date_creation: new Date().toISOString(),
  });
}

/**
 * Supprimer un lien de synchronisation
 */
export async function deleteLienSync(id: number): Promise<void> {
  await db.liensSync.delete(id);
}

/**
 * Mettre à jour la propagation de retard d'un lien
 */
export async function updateLienSync(id: number, propagationRetard: boolean): Promise<void> {
  await db.liensSync.update(id, { propagation_retard: propagationRetard });
}

/**
 * Calculer l'impact d'un retard sur les actions liées
 */
export async function calculerPropagationRetard(
  actionSourceId: string,
  retardJours: number
): Promise<PropagationRetard | null> {
  const liens = await db.liensSync
    .filter((l) => l.action_technique_id === actionSourceId && l.propagation_retard)
    .toArray();

  if (liens.length === 0) return null;

  const actions = await db.actions.toArray();
  const actionSource = actions.find((a) => a.id_action === actionSourceId);

  if (!actionSource) return null;

  const actionsImpactees = liens
    .map((lien) => {
      const action = actions.find((a) => a.id_action === lien.action_mobilisation_id);
      if (!action) return null;

      const dateDebut = new Date(action.date_debut_prevue);
      const dateFin = new Date(action.date_fin_prevue);

      dateDebut.setDate(dateDebut.getDate() + retardJours);
      dateFin.setDate(dateFin.getDate() + retardJours);

      return {
        id: action.id_action,
        titre: action.titre,
        nouvelle_date_debut: dateDebut.toISOString().split('T')[0],
        nouvelle_date_fin: dateFin.toISOString().split('T')[0],
        decalage_jours: retardJours,
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  return {
    action_source_id: actionSourceId,
    action_source_titre: actionSource.titre,
    retard_jours: retardJours,
    actions_impactees: actionsImpactees,
  };
}

/**
 * Appliquer la propagation de retard aux actions de mobilisation liées
 */
export async function appliquerPropagationRetard(propagation: PropagationRetard): Promise<void> {
  await db.transaction('rw', db.actions, async () => {
    for (const actionImpactee of propagation.actions_impactees) {
      const action = await db.actions.filter((a) => a.id_action === actionImpactee.id).first();

      if (action && action.id) {
        await db.actions.update(action.id, {
          date_debut_prevue: actionImpactee.nouvelle_date_debut,
          date_fin_prevue: actionImpactee.nouvelle_date_fin,
          date_modification: new Date().toISOString(),
          motif_modification: `Décalage automatique de ${actionImpactee.decalage_jours} jour(s) suite au retard de l'action technique ${propagation.action_source_id}`,
        });
      }
    }
  });
}

/**
 * Hook pour détecter si une action technique a un retard nécessitant propagation
 */
export function useDetectionRetard(actionId: string) {
  return useLiveQuery(async () => {
    const action = await db.actions.filter((a) => a.id_action === actionId).first();

    if (!action || action.axe !== 'axe3_technique') {
      return { hasRetard: false, retardJours: 0 };
    }

    const today = new Date();
    const dateFin = new Date(action.date_fin_prevue);

    // Si l'action n'est pas terminée et la date est dépassée
    if (action.statut !== 'termine' && today > dateFin) {
      const retardJours = Math.ceil((today.getTime() - dateFin.getTime()) / (1000 * 60 * 60 * 24));
      return { hasRetard: true, retardJours };
    }

    // Si l'action a une date fin réelle après la date prévue
    if (action.date_fin_reelle) {
      const dateFinReelle = new Date(action.date_fin_reelle);
      if (dateFinReelle > dateFin) {
        const retardJours = Math.ceil(
          (dateFinReelle.getTime() - dateFin.getTime()) / (1000 * 60 * 60 * 24)
        );
        return { hasRetard: true, retardJours };
      }
    }

    return { hasRetard: false, retardJours: 0 };
  }, [actionId]) ?? { hasRetard: false, retardJours: 0 };
}

/**
 * Détail des statistiques pour un axe
 */
export interface AxeStats {
  total: number;
  terminees: number;
  enRetard: number;
  avancement: number;
}

/**
 * Hook pour obtenir les statistiques détaillées par type d'action
 * Inclut maintenant le détail pour chaque axe de mobilisation
 */
export function useSynchronisationDetails() {
  return useLiveQuery(async () => {
    const actions = await db.actions.toArray();
    const liens = await db.liensSync.toArray();
    const today = new Date().toISOString().split('T')[0];

    // Construction (AXE 3)
    const actionsTechniques = actions.filter((a) => a.axe === 'axe3_technique');
    const techniqueTerminees = actionsTechniques.filter((a) => a.statut === 'termine').length;
    const techniqueEnRetard = actionsTechniques.filter(
      (a) => a.statut !== 'termine' && a.date_fin_prevue < today
    ).length;

    // Mobilisation (5 axes)
    const actionsMobilisation = actions.filter((a) => AXES_MOBILISATION.includes(a.axe));
    const mobilisationTerminees = actionsMobilisation.filter((a) => a.statut === 'termine').length;
    const mobilisationEnRetard = actionsMobilisation.filter(
      (a) => a.statut !== 'termine' && a.date_fin_prevue < today
    ).length;

    // Détail par axe de mobilisation
    const detailParAxe: Record<Axe, AxeStats> = {} as Record<Axe, AxeStats>;
    for (const axe of AXES_MOBILISATION) {
      const actionsAxe = actions.filter((a) => a.axe === axe);
      detailParAxe[axe] = {
        total: actionsAxe.length,
        terminees: actionsAxe.filter((a) => a.statut === 'termine').length,
        enRetard: actionsAxe.filter((a) => a.statut !== 'termine' && a.date_fin_prevue < today).length,
        avancement:
          actionsAxe.length > 0
            ? actionsAxe.reduce((sum, a) => sum + a.avancement, 0) / actionsAxe.length
            : 0,
      };
    }

    return {
      technique: {
        total: actionsTechniques.length,
        terminees: techniqueTerminees,
        enRetard: techniqueEnRetard,
        avancement:
          actionsTechniques.length > 0
            ? actionsTechniques.reduce((sum, a) => sum + a.avancement, 0) / actionsTechniques.length
            : 0,
      },
      mobilisation: {
        total: actionsMobilisation.length,
        terminees: mobilisationTerminees,
        enRetard: mobilisationEnRetard,
        avancement:
          actionsMobilisation.length > 0
            ? actionsMobilisation.reduce((sum, a) => sum + a.avancement, 0) / actionsMobilisation.length
            : 0,
      },
      detailParAxe,
      liens: {
        total: liens.length,
        avecPropagation: liens.filter((l) => l.propagation_retard).length,
      },
    };
  }) ?? {
    technique: { total: 0, terminees: 0, enRetard: 0, avancement: 0 },
    mobilisation: { total: 0, terminees: 0, enRetard: 0, avancement: 0 },
    detailParAxe: {} as Record<Axe, AxeStats>,
    liens: { total: 0, avecPropagation: 0 },
  };
}

// ============================================================================
// AUTO-LINKING INTELLIGENT (IA)
// ============================================================================

export interface AutoLinkSuggestion {
  actionTechnique: Action;
  actionMobilisation: Action;
  score: number;
  raisons: string[];
}

export interface AutoLinkResult {
  suggestions: AutoLinkSuggestion[];
  liensCreated: number;
  message: string;
}

/**
 * Calcule un score de similarité entre deux chaînes de texte
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  if (words1.length === 0 || words2.length === 0) return 0;

  const commonWords = words1.filter(w => words2.includes(w));
  return (commonWords.length * 2) / (words1.length + words2.length);
}

/**
 * Vérifie si deux périodes de dates se chevauchent
 */
function datesOverlap(
  debut1: string,
  fin1: string,
  debut2: string,
  fin2: string
): boolean {
  const d1Start = new Date(debut1).getTime();
  const d1End = new Date(fin1).getTime();
  const d2Start = new Date(debut2).getTime();
  const d2End = new Date(fin2).getTime();

  return d1Start <= d2End && d2Start <= d1End;
}

/**
 * Calcule la proximité temporelle entre deux actions (0-1)
 */
function calculateTemporalProximity(action1: Action, action2: Action): number {
  const mid1 = (new Date(action1.date_debut_prevue).getTime() + new Date(action1.date_fin_prevue).getTime()) / 2;
  const mid2 = (new Date(action2.date_debut_prevue).getTime() + new Date(action2.date_fin_prevue).getTime()) / 2;

  const diffDays = Math.abs(mid1 - mid2) / (1000 * 60 * 60 * 24);

  // Score décroissant avec la distance (max 90 jours)
  return Math.max(0, 1 - diffDays / 90);
}

/**
 * Algorithme intelligent d'auto-linking entre actions techniques et mobilisation
 * Analyse plusieurs critères pour détecter les correspondances:
 * - Phase du projet
 * - Jalon associé
 * - Chevauchement des dates
 * - Similarité des titres/descriptions
 * - Mots-clés métier
 */
export async function analyzeAutoLinkSuggestions(): Promise<AutoLinkSuggestion[]> {
  const actions = await db.actions.toArray();
  const existingLinks = await db.liensSync.toArray();

  // Construction = axe3_technique
  const actionsTechniques = actions.filter((a) => a.axe === 'axe3_technique');
  // Mobilisation = les 5 autres axes
  const actionsMobilisation = actions.filter((a) => AXES_MOBILISATION.includes(a.axe));

  // Set des liens existants pour éviter les doublons
  const existingPairs = new Set(
    existingLinks.map((l) => `${l.action_technique_id}|${l.action_mobilisation_id}`)
  );

  const suggestions: AutoLinkSuggestion[] = [];

  // Mots-clés métier pour matching sémantique
  const keywordGroups = [
    ['recrutement', 'rh', 'personnel', 'équipe', 'embauche', 'formation'],
    ['commercial', 'vente', 'client', 'marketing', 'promotion', 'publicité'],
    ['technique', 'installation', 'équipement', 'matériel', 'travaux'],
    ['ouverture', 'lancement', 'inauguration', 'démarrage'],
    ['formation', 'training', 'apprentissage', 'compétence'],
    ['contrat', 'partenariat', 'accord', 'négociation', 'fournisseur'],
    ['aménagement', 'décoration', 'design', 'espace'],
    ['sécurité', 'conformité', 'certification', 'norme'],
  ];

  for (const actionTech of actionsTechniques) {
    for (const actionMob of actionsMobilisation) {
      // Skip si lien existe déjà
      if (existingPairs.has(`${actionTech.id_action}|${actionMob.id_action}`)) {
        continue;
      }

      let score = 0;
      const raisons: string[] = [];

      // 1. Même phase (poids: 30 points)
      if (actionTech.phase && actionMob.phase && actionTech.phase === actionMob.phase) {
        score += 30;
        raisons.push(`Même phase: ${actionTech.phase}`);
      }

      // 2. Chevauchement des dates (poids: 25 points)
      if (datesOverlap(
        actionTech.date_debut_prevue,
        actionTech.date_fin_prevue,
        actionMob.date_debut_prevue,
        actionMob.date_fin_prevue
      )) {
        score += 25;
        raisons.push('Périodes qui se chevauchent');
      }

      // 3. Proximité temporelle (poids: jusqu'à 15 points)
      const temporalScore = calculateTemporalProximity(actionTech, actionMob) * 15;
      if (temporalScore > 5) {
        score += temporalScore;
        raisons.push('Proximité temporelle');
      }

      // 4. Similarité des titres (poids: jusqu'à 20 points)
      const titleSimilarity = calculateTextSimilarity(actionTech.titre, actionMob.titre);
      if (titleSimilarity > 0.2) {
        score += titleSimilarity * 20;
        raisons.push('Titres similaires');
      }

      // 5. Similarité des descriptions (poids: jusqu'à 15 points)
      if (actionTech.description && actionMob.description) {
        const descSimilarity = calculateTextSimilarity(actionTech.description, actionMob.description);
        if (descSimilarity > 0.15) {
          score += descSimilarity * 15;
          raisons.push('Descriptions similaires');
        }
      }

      // 6. Matching par mots-clés métier (poids: 15 points)
      const techText = `${actionTech.titre} ${actionTech.description || ''}`.toLowerCase();
      const mobText = `${actionMob.titre} ${actionMob.description || ''}`.toLowerCase();

      for (const group of keywordGroups) {
        const techHasKeyword = group.some((kw) => techText.includes(kw));
        const mobHasKeyword = group.some((kw) => mobText.includes(kw));

        if (techHasKeyword && mobHasKeyword) {
          score += 15;
          raisons.push(`Thématique commune: ${group[0]}`);
          break; // Un seul groupe compte
        }
      }

      // 7. Même catégorie (poids: 10 points)
      if (actionTech.categorie && actionMob.categorie && actionTech.categorie === actionMob.categorie) {
        score += 10;
        raisons.push(`Même catégorie: ${actionTech.categorie}`);
      }

      // Seuil minimum pour suggérer un lien (score >= 30)
      if (score >= 30 && raisons.length >= 2) {
        suggestions.push({
          actionTechnique: actionTech,
          actionMobilisation: actionMob,
          score: Math.round(score),
          raisons,
        });
      }
    }
  }

  // Trier par score décroissant
  return suggestions.sort((a, b) => b.score - a.score);
}

/**
 * Crée automatiquement les liens pour toutes les suggestions au-dessus d'un seuil
 */
export async function autoLinkActions(
  minScore: number = 40,
  maxLinks: number = 50
): Promise<AutoLinkResult> {
  const suggestions = await analyzeAutoLinkSuggestions();

  // Filtrer par score minimum
  const validSuggestions = suggestions.filter((s) => s.score >= minScore).slice(0, maxLinks);

  if (validSuggestions.length === 0) {
    return {
      suggestions: [],
      liensCreated: 0,
      message: 'Aucune correspondance trouvée avec le score minimum requis.',
    };
  }

  // Créer les liens en transaction
  let liensCreated = 0;

  await db.transaction('rw', db.liensSync, async () => {
    for (const suggestion of validSuggestions) {
      await db.liensSync.add({
        action_technique_id: suggestion.actionTechnique.id_action,
        action_mobilisation_id: suggestion.actionMobilisation.id_action,
        propagation_retard: true,
        date_creation: new Date().toISOString(),
      });
      liensCreated++;
    }
  });

  return {
    suggestions: validSuggestions,
    liensCreated,
    message: `${liensCreated} lien(s) créé(s) automatiquement par l'algorithme IA.`,
  };
}

/**
 * Supprime tous les liens existants et recrée via l'algorithme
 */
export async function resetAndAutoLink(minScore: number = 40): Promise<AutoLinkResult> {
  // Supprimer tous les liens existants
  await db.liensSync.clear();

  // Recréer via l'algorithme
  return autoLinkActions(minScore);
}
