// ============================================================================
// SYNCHRONISATION CONSTRUCTION vs MOBILISATION - Service V2
// Basé sur les vraies données de jalons et actions
// ============================================================================

import { db } from '@/db';
import { SYNC_CONFIG } from '@/config/syncConfig';
import type {
  SyncStatusResult,
  CategoryProgress,
  CategoryActionItem,
  SyncSnapshot,
  SyncAlert,
  SyncAction,
  SyncDimension,
  SyncStatusType,
  SyncAlertLevel,
  SyncPriority,
  SyncCategory,
  RecommendedAction,
  SyncActionStatus,
} from '@/types/sync.types';
import type { Axe, ProjectPhase, Action, Jalon } from '@/types';
import { AXE_LABELS, AXE_SHORT_LABELS, PROJECT_PHASES, PROJECT_PHASE_LABELS } from '@/types';

// ============================================================================
// CONFIGURATION DES CATÉGORIES BASÉE SUR LES AXES RÉELS
// ============================================================================

// Couleurs et icônes pour les axes (spécifications v2.0)
// syncCC = true : l'axe se synchronise avec la progression du Centre Commercial
const AXE_CONFIG: Record<Axe, { color: string; icon: string; weight: number; syncCC: boolean }> = {
  axe1_rh: { color: '#3B82F6', icon: 'Users', weight: 1.5, syncCC: true },
  axe2_commercial: { color: '#10B981', icon: 'Store', weight: 1.3, syncCC: true },
  axe3_technique: { color: '#F59E0B', icon: 'Wrench', weight: 1.5, syncCC: true },
  axe4_budget: { color: '#8B5CF6', icon: 'Calculator', weight: 1.0, syncCC: true },
  axe5_marketing: { color: '#EC4899', icon: 'Megaphone', weight: 1.0, syncCC: true },
  axe6_exploitation: { color: '#6366F1', icon: 'Settings', weight: 1.2, syncCC: true },
  axe7_construction: { color: '#EF4444', icon: 'Building', weight: 2.0, syncCC: false },
};

// Couleurs et icônes pour les phases
const PHASE_CONFIG: Record<ProjectPhase, { color: string; icon: string; weight: number }> = {
  phase1_preparation: { color: '#6366F1', icon: 'FileText', weight: 1.0 },
  phase2_mobilisation: { color: '#F59E0B', icon: 'Rocket', weight: 1.5 },
  phase3_lancement: { color: '#10B981', icon: 'Flag', weight: 2.0 },
  phase4_stabilisation: { color: '#3B82F6', icon: 'TrendingUp', weight: 1.0 },
};

// ============================================================================
// CALCUL DE PROGRESSION À PARTIR DES DONNÉES RÉELLES
// ============================================================================

/**
 * Calcule la progression d'une action basée sur son statut et avancement
 */
function getActionProgress(action: Action): number {
  // Utiliser l'avancement réel s'il existe
  if (action.avancement !== undefined && action.avancement > 0) {
    return action.avancement;
  }

  // Sinon, utiliser le statut pour estimer
  switch (action.statut) {
    case 'termine': return 100;
    case 'en_cours': return 50;
    case 'bloque': return 25;
    case 'annule': return 0;
    case 'a_faire':
    default: return 0;
  }
}

/**
 * Calcule la progression d'un jalon basée sur son statut
 */
function getJalonProgress(jalon: Jalon): number {
  switch (jalon.statut) {
    case 'atteint': return 100;
    case 'en_cours': return jalon.pourcentage_completion ?? 50;
    case 'en_retard': return jalon.pourcentage_completion ?? 30;
    case 'a_risque': return jalon.pourcentage_completion ?? 40;
    case 'non_atteint': return 0;
    case 'prevu':
    default: return 0;
  }
}

/**
 * Calcule la progression par axe basée sur les actions réelles
 */
export async function calculateAxeProgress(siteId: number, axe: Axe): Promise<{
  progress: number;
  totalItems: number;
  completedItems: number;
  actions: Action[];
}> {
  // Note: siteId parameter kept for API compatibility, but actions don't have siteId
  const actions = await db.actions
    .where('axe')
    .equals(axe)
    .toArray();

  if (actions.length === 0) {
    return { progress: 0, totalItems: 0, completedItems: 0, actions: [] };
  }

  let weightedSum = 0;
  let totalWeight = 0;
  let completedCount = 0;

  for (const action of actions) {
    const weight = action.priorite === 'critique' ? 2 :
                   action.priorite === 'haute' ? 1.5 :
                   action.priorite === 'moyenne' ? 1 : 0.8;
    const progress = getActionProgress(action);

    weightedSum += progress * weight;
    totalWeight += weight;

    if (action.statut === 'termine') {
      completedCount++;
    }
  }

  return {
    progress: totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0,
    totalItems: actions.length,
    completedItems: completedCount,
    actions,
  };
}

/**
 * Calcule la progression par phase basée sur les jalons réels
 */
export async function calculatePhaseProgress(siteId: number, phase: ProjectPhase): Promise<{
  progress: number;
  totalItems: number;
  completedItems: number;
  jalons: Jalon[];
}> {
  // Note: siteId parameter kept for API compatibility, but jalons don't have siteId
  const jalons = await db.jalons
    .filter(j => j.projectPhase === phase)
    .toArray();

  if (jalons.length === 0) {
    return { progress: 0, totalItems: 0, completedItems: 0, jalons: [] };
  }

  let weightedSum = 0;
  let totalWeight = 0;
  let completedCount = 0;

  for (const jalon of jalons) {
    // Poids basé sur si le jalon est critique ou non
    const weight = jalon.critique ? 2 : 1;
    const progress = getJalonProgress(jalon);

    weightedSum += progress * weight;
    totalWeight += weight;

    if (jalon.statut === 'atteint') {
      completedCount++;
    }
  }

  return {
    progress: totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0,
    totalItems: jalons.length,
    completedItems: completedCount,
    jalons,
  };
}

/**
 * Calcule la progression du CENTRE COMMERCIAL uniquement
 * Car seul le CC se synchronise avec la mobilisation
 */
export async function calculateConstructionProgress(siteId: number): Promise<{
  progress: number;
  ccProgress: number;
  byPhase: Record<string, CategoryProgress>;
}> {
  // Récupérer le jalon du Centre Commercial
  const ccJalon = await db.jalons
    .filter(j => j.axe === 'axe7_construction' && j.buildingCode === 'CC')
    .first();

  if (!ccJalon) {
    return { progress: 0, ccProgress: 0, byPhase: {} };
  }

  // Récupérer les actions liées au CC
  const ccActions = await db.actions
    .filter(a => a.jalonId === ccJalon.id || (a.axe === 'axe7_construction' && a.id_action?.includes('CON-1')))
    .toArray();

  // Calculer la progression globale du CC
  let totalProgress = 0;
  let completedCount = 0;

  for (const action of ccActions) {
    const progress = getActionProgress(action);
    totalProgress += progress;
    if (action.statut === 'termine') {
      completedCount++;
    }
  }

  const ccProgress = ccActions.length > 0 ? totalProgress / ccActions.length : 0;

  return {
    progress: Math.round(ccProgress * 100) / 100,
    ccProgress: Math.round(ccProgress * 100) / 100,
    byPhase: {},
  };
}

/**
 * Calcule la progression globale de la MOBILISATION (basée sur actions des 5 axes)
 */
export async function calculateMobilisationProgress(siteId: number): Promise<{
  progress: number;
  byAxe: Record<Axe, CategoryProgress>;
}> {
  // Les axes de mobilisation (tous sauf technique qui est construction)
  const mobilisationAxes: Axe[] = ['axe1_rh', 'axe2_commercial', 'axe4_budget', 'axe5_marketing', 'axe6_exploitation'];

  const byAxe: Partial<Record<Axe, CategoryProgress>> = {};
  let totalWeightedProgress = 0;
  let totalWeight = 0;

  for (const axe of mobilisationAxes) {
    const axeData = await calculateAxeProgress(siteId, axe);
    const config = AXE_CONFIG[axe];

    byAxe[axe] = {
      categoryId: axe,
      categoryCode: axe,
      categoryName: AXE_SHORT_LABELS[axe],
      progress: axeData.progress,
      itemsCount: axeData.totalItems,
      completedCount: axeData.completedItems,
    };

    totalWeightedProgress += axeData.progress * config.weight;
    totalWeight += config.weight;
  }

  // Ajouter aussi l'axe technique pour avoir la vue complète
  const techniqueData = await calculateAxeProgress(siteId, 'axe3_technique');
  byAxe['axe3_technique'] = {
    categoryId: 'axe3_technique',
    categoryCode: 'axe3_technique',
    categoryName: AXE_SHORT_LABELS.axe3_technique,
    progress: techniqueData.progress,
    itemsCount: techniqueData.totalItems,
    completedCount: techniqueData.completedItems,
  };

  return {
    progress: totalWeight > 0 ? Math.round((totalWeightedProgress / totalWeight) * 100) / 100 : 0,
    byAxe: byAxe as Record<Axe, CategoryProgress>,
  };
}

/**
 * Calcule le statut de synchronisation Construction vs Mobilisation
 * IMPORTANT: Seul le Centre Commercial (CC) est synchronisé avec la mobilisation
 */
export async function calculateSyncStatusV2(siteId: number): Promise<SyncStatusResult> {
  const constructionData = await calculateConstructionProgress(siteId);
  const mobilisationData = await calculateMobilisationProgress(siteId);

  // Utiliser la progression du CC pour la synchronisation (pas la progression globale)
  const projectProgress = constructionData.ccProgress;
  const mobilizationProgress = mobilisationData.progress;

  const gap = Math.round((projectProgress - mobilizationProgress) * 100) / 100;
  const absGap = Math.abs(gap);

  // Calculate days gap (basé sur 18 mois = 540 jours)
  const gapDays = Math.round((absGap / 100) * SYNC_CONFIG.projectDurationDays);

  // Determine status and alert level
  let status: SyncStatusType;
  let alertLevel: SyncAlertLevel;

  if (absGap <= SYNC_CONFIG.thresholds.green) {
    status = 'SYNC';
    alertLevel = 'GREEN';
  } else if (absGap <= SYNC_CONFIG.thresholds.orange) {
    status = gap > 0 ? 'PROJECT_AHEAD' : 'MOBILIZATION_AHEAD';
    alertLevel = 'ORANGE';
  } else {
    status = absGap > SYNC_CONFIG.thresholds.red ? 'CRITICAL' : (gap > 0 ? 'PROJECT_AHEAD' : 'MOBILIZATION_AHEAD');
    alertLevel = 'RED';
  }

  return {
    projectProgress,
    mobilizationProgress,
    gap,
    gapDays,
    status,
    alertLevel,
  };
}

// ============================================================================
// CATÉGORIES DYNAMIQUES BASÉES SUR LES AXES RÉELS
// ============================================================================

/**
 * Génère les catégories de synchronisation basées sur les axes réels
 */
export function generateSyncCategories(): SyncCategory[] {
  const now = new Date().toISOString();
  const categories: SyncCategory[] = [];

  // Catégories Construction (Phases)
  PROJECT_PHASES.forEach((phase, index) => {
    const config = PHASE_CONFIG[phase];
    categories.push({
      id: `CONST-${phase}`,
      code: phase,
      name: PROJECT_PHASE_LABELS[phase],
      dimension: 'PROJECT',
      weight: config.weight,
      displayOrder: index + 1,
      color: config.color,
      icon: config.icon,
      createdAt: now,
      updatedAt: now,
    });
  });

  // Catégories Mobilisation (Axes)
  const mobilisationAxes: Axe[] = ['axe1_rh', 'axe2_commercial', 'axe4_budget', 'axe5_marketing', 'axe6_exploitation'];
  mobilisationAxes.forEach((axe, index) => {
    const config = AXE_CONFIG[axe];
    categories.push({
      id: `MOB-${axe}`,
      code: axe,
      name: AXE_SHORT_LABELS[axe],
      dimension: 'MOBILIZATION',
      weight: config.weight,
      displayOrder: index + 1,
      color: config.color,
      icon: config.icon,
      createdAt: now,
      updatedAt: now,
    });
  });

  return categories;
}

/**
 * Obtient les détails de progression pour le CENTRE COMMERCIAL uniquement
 * Car seul le CC se synchronise avec la mobilisation
 * Affiche les actions du CC groupées par phase de construction
 */
export async function getConstructionCategoryDetails(siteId: number): Promise<CategoryProgress[]> {
  const result: CategoryProgress[] = [];

  // Récupérer TOUTES les actions (siteId n'existe pas sur les actions)
  const allSiteActions = await db.actions.toArray();

  // Debug: log pour voir ce qu'on a
  console.log('[SyncService] Total actions:', allSiteActions.length);
  console.log('[SyncService] Axes présents:', [...new Set(allSiteActions.map(a => a.axe))]);
  console.log('[SyncService] BuildingCodes présents:', [...new Set(allSiteActions.map(a => a.buildingCode).filter(Boolean))]);

  // Filtrer les actions du Centre Commercial uniquement
  // Priorité: buildingCode === 'CC', sinon id_action contient CON-1, sinon titre contient "Centre Commercial"
  let ccActions = allSiteActions.filter(a => a.buildingCode === 'CC');

  // Si pas de buildingCode CC, chercher par id_action
  if (ccActions.length === 0) {
    ccActions = allSiteActions.filter(a =>
      a.id_action?.startsWith('A-CON-1') || // Convention: CON-1.x = Centre Commercial
      a.id_action?.includes('CC-')
    );
  }

  // Si toujours rien, chercher par titre
  if (ccActions.length === 0) {
    ccActions = allSiteActions.filter(a =>
      a.titre?.toLowerCase().includes('centre commercial') ||
      (a.axe === 'axe7_construction' && a.titre?.includes('- Centre Commercial'))
    );
  }

  // Si toujours rien, prendre toutes les actions de construction (axe7)
  if (ccActions.length === 0) {
    ccActions = allSiteActions.filter(a => a.axe === 'axe7_construction');
  }

  console.log('[SyncService] Actions CC filtrées:', ccActions.length);

  const allConstructionActions = ccActions;

  // Configuration des phases de construction du CC
  const phaseConfig: Record<string, { name: string; color: string; order: number }> = {
    'gros_oeuvre': { name: 'Gros œuvre', color: '#6366F1', order: 1 },
    'second_oeuvre': { name: 'Second œuvre', color: '#F59E0B', order: 2 },
    'lots_techniques': { name: 'Lots techniques', color: '#3B82F6', order: 3 },
    'amenagement_externe': { name: 'Aménagement externe', color: '#10B981', order: 4 },
    'pre_reception': { name: 'Pré-réception', color: '#8B5CF6', order: 5 },
    'reception_provisoire': { name: 'Réception provisoire', color: '#EC4899', order: 6 },
    'reception_definitive': { name: 'Réception définitive', color: '#22C55E', order: 7 },
  };

  const actionsToProcess = allConstructionActions;

  // Si pas d'actions de construction, retourner vide
  if (actionsToProcess.length === 0) {
    return [];
  }

  // Mapper les actions vers les phases basées sur leur titre ou catégorie
  const actionsByPhase = new Map<string, typeof actionsToProcess>();

  for (const action of actionsToProcess) {
    let phase = 'autre';
    const titre = (action.titre || '').toLowerCase();
    const categorie = (action.categorie || '').toLowerCase();

    // Essayer de détecter la phase par le titre ou la catégorie
    if (titre.includes('gros') && titre.includes('uvre') || categorie.includes('gros')) phase = 'gros_oeuvre';
    else if (titre.includes('second') && titre.includes('uvre') || categorie.includes('second')) phase = 'second_oeuvre';
    else if (titre.includes('lots') && titre.includes('technique') || categorie.includes('technique')) phase = 'lots_techniques';
    else if (titre.includes('aménagement') || titre.includes('amenagement') || titre.includes('externe') || categorie.includes('externe')) phase = 'amenagement_externe';
    else if (titre.includes('pré-réception') || titre.includes('pre-reception') || categorie.includes('réception')) phase = 'pre_reception';
    else if (titre.includes('réception') && titre.includes('provisoire')) phase = 'reception_provisoire';
    else if (titre.includes('réception') && titre.includes('définitive')) phase = 'reception_definitive';
    // Si aucune phase détectée, utiliser la catégorie de l'action ou "Actions CC"
    else if (action.categorie) phase = action.categorie;
    else phase = 'actions_cc';

    if (!actionsByPhase.has(phase)) {
      actionsByPhase.set(phase, []);
    }
    actionsByPhase.get(phase)!.push(action);
  }

  // Récupérer toutes les sous-tâches en une seule requête pour éviter N+1 queries
  const allSousTaches = await db.sousTaches.toArray();
  const sousTachesByActionId = new Map<string, typeof allSousTaches>();
  for (const st of allSousTaches) {
    if (!sousTachesByActionId.has(st.actionId)) {
      sousTachesByActionId.set(st.actionId, []);
    }
    sousTachesByActionId.get(st.actionId)!.push(st);
  }

  // Récupérer les utilisateurs pour les noms des responsables
  const users = await db.users.toArray();
  const usersById = new Map(users.map(u => [u.id, u]));

  // Calculer la progression pour chaque phase/groupe
  for (const [phaseCode, actions] of actionsByPhase.entries()) {
    const config = phaseConfig[phaseCode] || { name: phaseCode === 'actions_cc' ? 'Actions CC' : phaseCode, color: '#9CA3AF', order: 99 };

    let totalProgress = 0;
    let completedCount = 0;

    // Construire les items avec leurs sous-tâches
    const items: CategoryActionItem[] = [];

    for (const action of actions) {
      const progress = getActionProgress(action);
      totalProgress += progress;
      if (action.statut === 'termine') {
        completedCount++;
      }

      // Récupérer les sous-tâches de cette action
      const actionSousTaches = sousTachesByActionId.get(action.id_action) || [];
      const responsable = action.responsableId ? usersById.get(action.responsableId) : undefined;

      items.push({
        id: action.id!,
        id_action: action.id_action,
        titre: action.titre,
        avancement: action.avancement,
        statut: action.statut,
        responsable: responsable?.nom,
        date_fin_prevue: action.date_fin_prevue,
        sousTaches: actionSousTaches.map(st => ({
          id: st.id!,
          libelle: st.libelle,
          fait: st.fait,
          avancement: st.avancement || 0,
        })).sort((a, b) => a.id - b.id),
      });
    }

    const avgProgress = actions.length > 0 ? totalProgress / actions.length : 0;

    result.push({
      categoryId: `CC-${phaseCode}`,
      categoryCode: phaseCode,
      categoryName: config.name,
      progress: Math.round(avgProgress * 100) / 100,
      itemsCount: actions.length,
      completedCount,
      items, // Ajouter les items avec leurs sous-tâches
    });
  }

  // Trier par ordre d'affichage
  result.sort((a, b) => {
    const orderA = phaseConfig[a.categoryCode]?.order || 99;
    const orderB = phaseConfig[b.categoryCode]?.order || 99;
    return orderA - orderB;
  });

  return result;
}

/**
 * Obtient les détails de progression par catégorie pour la Mobilisation
 */
export async function getMobilisationCategoryDetails(siteId: number): Promise<CategoryProgress[]> {
  const mobilisationAxes: Axe[] = ['axe1_rh', 'axe2_commercial', 'axe4_budget', 'axe5_marketing', 'axe6_exploitation'];
  const result: CategoryProgress[] = [];

  // Récupérer toutes les sous-tâches et utilisateurs pour éviter N+1 queries
  const allSousTaches = await db.sousTaches.toArray();
  const sousTachesByActionId = new Map<string, typeof allSousTaches>();
  for (const st of allSousTaches) {
    if (!sousTachesByActionId.has(st.actionId)) {
      sousTachesByActionId.set(st.actionId, []);
    }
    sousTachesByActionId.get(st.actionId)!.push(st);
  }

  const users = await db.users.toArray();
  const usersById = new Map(users.map(u => [u.id, u]));

  for (const axe of mobilisationAxes) {
    const axeData = await calculateAxeProgress(siteId, axe);

    // Construire les items avec leurs sous-tâches
    const items: CategoryActionItem[] = axeData.actions.map(action => {
      const actionSousTaches = sousTachesByActionId.get(action.id_action) || [];
      const responsable = action.responsableId ? usersById.get(action.responsableId) : undefined;

      return {
        id: action.id!,
        id_action: action.id_action,
        titre: action.titre,
        avancement: action.avancement,
        statut: action.statut,
        responsable: responsable?.nom,
        date_fin_prevue: action.date_fin_prevue,
        sousTaches: actionSousTaches.map(st => ({
          id: st.id!,
          libelle: st.libelle,
          fait: st.fait,
          avancement: st.avancement || 0,
        })).sort((a, b) => a.id - b.id),
      };
    });

    result.push({
      categoryId: `MOB-${axe}`,
      categoryCode: axe,
      categoryName: AXE_SHORT_LABELS[axe],
      progress: axeData.progress,
      itemsCount: axeData.totalItems,
      completedCount: axeData.completedItems,
      items,
    });
  }

  return result;
}

// ============================================================================
// SNAPSHOTS
// ============================================================================

/**
 * Crée un snapshot avec les vraies données
 */
export async function createSnapshotV2(siteId: number, projectId: string): Promise<number> {
  const syncStatus = await calculateSyncStatusV2(siteId);
  const projectDetails = await getConstructionCategoryDetails(siteId);
  const mobilizationDetails = await getMobilisationCategoryDetails(siteId);
  const now = new Date().toISOString();

  const snapshot: Omit<SyncSnapshot, 'id'> = {
    projectId,
    snapshotDate: now.split('T')[0],
    projectProgress: syncStatus.projectProgress,
    mobilizationProgress: syncStatus.mobilizationProgress,
    syncGap: syncStatus.gap,
    syncStatus: syncStatus.status,
    projectDetails,
    mobilizationDetails,
    createdAt: now,
  };

  // Générer des alertes si nécessaire
  if (syncStatus.alertLevel !== 'GREEN') {
    await generateSyncAlertsV2(siteId, projectId, syncStatus);
  }

  return db.syncSnapshots.add(snapshot as SyncSnapshot);
}

/**
 * Obtient l'historique des snapshots
 */
export async function getSnapshotHistoryV2(projectId: string | undefined | null, limit?: number): Promise<SyncSnapshot[]> {
  if (!projectId || typeof projectId !== 'string') return [];
  const snapshots = await db.syncSnapshots
    .where('projectId')
    .equals(projectId)
    .reverse()
    .toArray();

  return limit ? snapshots.slice(0, limit) : snapshots;
}

// ============================================================================
// ALERTES
// ============================================================================

/**
 * Identifie les catégories problématiques
 */
async function identifyProblemCategoriesV2(
  siteId: number,
  syncStatus: SyncStatusResult
): Promise<{ dimension: SyncDimension; code: string; name: string; progress: number }[]> {
  const problems: { dimension: SyncDimension; code: string; name: string; progress: number }[] = [];

  if (syncStatus.gap > 0) {
    // Construction en avance → identifier les axes de mobilisation en retard
    const mobilisationAxes: Axe[] = ['axe1_rh', 'axe2_commercial', 'axe4_budget', 'axe5_marketing', 'axe6_exploitation'];
    for (const axe of mobilisationAxes) {
      const axeData = await calculateAxeProgress(siteId, axe);
      if (axeData.progress < syncStatus.mobilizationProgress - 5) {
        problems.push({
          dimension: 'MOBILIZATION',
          code: axe,
          name: AXE_SHORT_LABELS[axe],
          progress: axeData.progress,
        });
      }
    }
  } else {
    // Mobilisation en avance → identifier les phases construction en retard
    for (const phase of PROJECT_PHASES) {
      const phaseData = await calculatePhaseProgress(siteId, phase);
      if (phaseData.progress < syncStatus.projectProgress - 5) {
        problems.push({
          dimension: 'PROJECT',
          code: phase,
          name: PROJECT_PHASE_LABELS[phase],
          progress: phaseData.progress,
        });
      }
    }
  }

  return problems;
}

/**
 * Génère les actions recommandées
 */
function generateRecommendedActionsV2(
  syncStatus: SyncStatusResult,
  problemCategories: { dimension: SyncDimension; code: string; name: string }[]
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];
  const priority: SyncPriority = syncStatus.alertLevel === 'RED' ? 'URGENT' : 'HIGH';

  if (syncStatus.status === 'PROJECT_AHEAD' || syncStatus.status === 'CRITICAL') {
    // Construction > Mobilisation: accélérer la mobilisation
    problemCategories
      .filter(c => c.dimension === 'MOBILIZATION')
      .forEach(cat => {
        actions.push({
          dimension: 'MOBILIZATION',
          categoryCode: cat.code,
          actionType: 'ACCELERATE',
          title: `Accélérer ${cat.name}`,
          priority,
        });
      });

    if (syncStatus.alertLevel === 'RED') {
      actions.push({
        dimension: 'PROJECT',
        categoryCode: 'GLOBAL',
        actionType: 'MONITOR',
        title: 'Évaluer possibilité de ralentir certains lots non critiques',
        priority: 'MEDIUM',
      });
    }
  } else if (syncStatus.status === 'MOBILIZATION_AHEAD') {
    // Mobilisation > Construction: accélérer la construction
    problemCategories
      .filter(c => c.dimension === 'PROJECT')
      .forEach(cat => {
        actions.push({
          dimension: 'PROJECT',
          categoryCode: cat.code,
          actionType: 'ACCELERATE',
          title: `Débloquer/Accélérer ${cat.name}`,
          priority,
        });
      });

    actions.push({
      dimension: 'MOBILIZATION',
      categoryCode: 'GLOBAL',
      actionType: 'OPTIMIZE',
      title: 'Différer certains engagements pour optimiser les coûts',
      priority: 'MEDIUM',
    });
  }

  return actions;
}

/**
 * Génère des alertes automatiques basées sur les vraies données
 */
export async function generateSyncAlertsV2(
  siteId: number,
  projectId: string,
  syncStatus?: SyncStatusResult
): Promise<SyncAlert | null> {
  const status = syncStatus || await calculateSyncStatusV2(siteId);

  if (status.alertLevel === 'GREEN') return null;

  const problemCategories = await identifyProblemCategoriesV2(siteId, status);
  const recommendedActions = generateRecommendedActionsV2(status, problemCategories);
  const now = new Date().toISOString();

  let title: string;
  let description: string;

  if (status.status === 'CRITICAL') {
    title = `CRITIQUE : Écart de synchronisation de ${Math.abs(status.gap).toFixed(0)}%`;
    description = `L'écart entre Construction et Mobilisation dépasse le seuil critique. Action immédiate requise.`;
  } else if (status.status === 'PROJECT_AHEAD') {
    title = `Construction en avance de ${status.gap.toFixed(0)}% sur la Mobilisation`;
    const catNames = problemCategories.map(c => c.name).join(', ');
    description = `La construction avance plus vite que la préparation opérationnelle. Axes en retard : ${catNames || 'N/A'}. Risque de ne pas être prêt à l'ouverture.`;
  } else {
    title = `Mobilisation en avance de ${Math.abs(status.gap).toFixed(0)}% sur la Construction`;
    const catNames = problemCategories.map(c => c.name).join(', ');
    description = `La mobilisation avance plus vite que le chantier. Phases en retard : ${catNames || 'N/A'}. Possibilité d'optimiser les coûts.`;
  }

  const alert: Omit<SyncAlert, 'id'> = {
    projectId,
    alertDate: now,
    alertType: status.alertLevel === 'RED' ? 'CRITICAL' : 'WARNING',
    dimension: status.gap > 0 ? 'MOBILIZATION' : 'PROJECT',
    title,
    description,
    recommendedActions,
    isAcknowledged: false,
    createdAt: now,
  };

  const id = await db.syncAlerts.add(alert as SyncAlert);
  return { ...alert, id } as SyncAlert;
}

// ============================================================================
// ACTIONS CORRECTIVES
// ============================================================================

/**
 * Obtient les alertes d'un projet
 */
export async function getAlertsByProjectV2(projectId: string | undefined | null, onlyActive = false): Promise<SyncAlert[]> {
  if (!projectId || typeof projectId !== 'string') return [];
  let alerts = await db.syncAlerts.where('projectId').equals(projectId).toArray();
  if (onlyActive) {
    alerts = alerts.filter(a => !a.isAcknowledged);
  }
  return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Accuse réception d'une alerte
 */
export async function acknowledgeAlertV2(id: number, by: string): Promise<void> {
  await db.syncAlerts.update(id, {
    isAcknowledged: true,
    acknowledgedBy: by,
    acknowledgedAt: new Date().toISOString(),
  });
}

/**
 * Obtient les actions correctives d'un projet
 */
export async function getActionsByProjectV2(projectId: string | undefined | null): Promise<SyncAction[]> {
  if (!projectId || typeof projectId !== 'string') return [];
  return db.syncActions.where('projectId').equals(projectId).toArray();
}

/**
 * Crée une action corrective
 */
export async function createActionV2(action: Omit<SyncAction, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date().toISOString();
  return db.syncActions.add({
    ...action,
    createdAt: now,
    updatedAt: now,
  } as SyncAction);
}

/**
 * Met à jour le statut d'une action
 */
export async function updateActionStatusV2(id: number, status: SyncActionStatus): Promise<void> {
  await db.syncActions.update(id, {
    status,
    updatedAt: new Date().toISOString(),
  });
}

// ============================================================================
// DONNÉES COMPLÈTES
// ============================================================================

/**
 * Obtient toutes les données de synchronisation pour un site/projet
 */
export async function getSyncDataV2(siteId: number, projectId: string) {
  const [
    syncStatus,
    constructionCategories,
    mobilisationCategories,
    alerts,
    actions,
    snapshots,
  ] = await Promise.all([
    calculateSyncStatusV2(siteId),
    getConstructionCategoryDetails(siteId),
    getMobilisationCategoryDetails(siteId),
    getAlertsByProjectV2(projectId),
    getActionsByProjectV2(projectId),
    getSnapshotHistoryV2(projectId, 30),
  ]);

  // Générer les catégories dynamiquement
  const categories = generateSyncCategories();

  return {
    syncStatus,
    projectCategories: constructionCategories,
    mobilizationCategories: mobilisationCategories,
    alerts,
    actions,
    snapshots,
    categories,
  };
}

// ============================================================================
// STATISTIQUES DÉTAILLÉES
// ============================================================================

/**
 * Obtient des statistiques détaillées pour le tableau de bord
 */
export async function getSyncStatsV2(siteId: number): Promise<{
  totalJalons: number;
  jalonsAtteints: number;
  totalActions: number;
  actionsTerminees: number;
  progressionMoyenne: number;
  axeEnRetard: string | null;
  phaseEnRetard: string | null;
}> {
  // Jalons (siteId not used - jalons don't have this field)
  const jalons = await db.jalons.toArray();
  const jalonsAtteints = jalons.filter(j => j.statut === 'atteint').length;

  // Actions (siteId not used - actions don't have this field)
  const actions = await db.actions.toArray();
  const actionsTerminees = actions.filter(a => a.statut === 'termine').length;

  // Calculer progression moyenne
  const syncStatus = await calculateSyncStatusV2(siteId);
  const progressionMoyenne = (syncStatus.projectProgress + syncStatus.mobilizationProgress) / 2;

  // Identifier l'axe en retard
  let axeEnRetard: string | null = null;
  let minAxeProgress = Infinity;
  const mobilisationAxes: Axe[] = ['axe1_rh', 'axe2_commercial', 'axe4_budget', 'axe5_marketing', 'axe6_exploitation'];
  for (const axe of mobilisationAxes) {
    const axeData = await calculateAxeProgress(siteId, axe);
    if (axeData.progress < minAxeProgress && axeData.totalItems > 0) {
      minAxeProgress = axeData.progress;
      axeEnRetard = AXE_SHORT_LABELS[axe];
    }
  }

  // Identifier la phase en retard
  let phaseEnRetard: string | null = null;
  let minPhaseProgress = Infinity;
  for (const phase of PROJECT_PHASES) {
    const phaseData = await calculatePhaseProgress(siteId, phase);
    if (phaseData.progress < minPhaseProgress && phaseData.totalItems > 0) {
      minPhaseProgress = phaseData.progress;
      phaseEnRetard = PROJECT_PHASE_LABELS[phase];
    }
  }

  return {
    totalJalons: jalons.length,
    jalonsAtteints,
    totalActions: actions.length,
    actionsTerminees,
    progressionMoyenne: Math.round(progressionMoyenne * 100) / 100,
    axeEnRetard,
    phaseEnRetard,
  };
}
