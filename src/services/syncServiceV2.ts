// ============================================================================
// SYNCHRONISATION CONSTRUCTION vs MOBILISATION - Service V2
// Basé sur les vraies données de jalons et actions
// ============================================================================

import { db } from '@/db';
import { SYNC_CONFIG } from '@/config/syncConfig';
import type {
  SyncStatusResult,
  CategoryProgress,
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

// Couleurs et icônes pour les axes
const AXE_CONFIG: Record<Axe, { color: string; icon: string; weight: number }> = {
  axe1_rh: { color: '#EF4444', icon: 'Users', weight: 1.5 },
  axe2_commercial: { color: '#F97316', icon: 'ShoppingBag', weight: 1.3 },
  axe3_technique: { color: '#3B82F6', icon: 'Wrench', weight: 1.5 },
  axe4_budget: { color: '#10B981', icon: 'Wallet', weight: 1.0 },
  axe5_marketing: { color: '#EC4899', icon: 'Megaphone', weight: 1.0 },
  axe6_exploitation: { color: '#8B5CF6', icon: 'Settings', weight: 1.2 },
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
 * Calcule la progression d'une action basée sur son statut
 */
function getActionProgress(action: Action): number {
  switch (action.status) {
    case 'termine': return 100;
    case 'en_cours': return action.avancementReel ?? 50;
    case 'bloque': return action.avancementReel ?? 25;
    case 'en_attente': return 10;
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
  const actions = await db.actions
    .where('siteId')
    .equals(siteId)
    .filter(a => a.axe === axe)
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

    if (action.status === 'termine') {
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
  const jalons = await db.jalons
    .where('siteId')
    .equals(siteId)
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
 * Calcule la progression globale de la CONSTRUCTION (basée sur jalons + actions technique)
 */
export async function calculateConstructionProgress(siteId: number): Promise<{
  progress: number;
  byPhase: Record<ProjectPhase, CategoryProgress>;
}> {
  const byPhase: Partial<Record<ProjectPhase, CategoryProgress>> = {};
  let totalWeightedProgress = 0;
  let totalWeight = 0;

  for (const phase of PROJECT_PHASES) {
    const phaseData = await calculatePhaseProgress(siteId, phase);
    const config = PHASE_CONFIG[phase];

    byPhase[phase] = {
      categoryId: phase,
      categoryCode: phase,
      categoryName: PROJECT_PHASE_LABELS[phase],
      progress: phaseData.progress,
      itemsCount: phaseData.totalItems,
      completedCount: phaseData.completedItems,
    };

    totalWeightedProgress += phaseData.progress * config.weight;
    totalWeight += config.weight;
  }

  // Ajouter la progression de l'axe technique (construction)
  const techniqueData = await calculateAxeProgress(siteId, 'axe3_technique');
  const techniqueWeight = AXE_CONFIG.axe3_technique.weight;

  totalWeightedProgress += techniqueData.progress * techniqueWeight;
  totalWeight += techniqueWeight;

  return {
    progress: totalWeight > 0 ? Math.round((totalWeightedProgress / totalWeight) * 100) / 100 : 0,
    byPhase: byPhase as Record<ProjectPhase, CategoryProgress>,
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
 */
export async function calculateSyncStatusV2(siteId: number): Promise<SyncStatusResult> {
  const constructionData = await calculateConstructionProgress(siteId);
  const mobilisationData = await calculateMobilisationProgress(siteId);

  const projectProgress = constructionData.progress;
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
 * Obtient les détails de progression par catégorie pour la Construction
 */
export async function getConstructionCategoryDetails(siteId: number): Promise<CategoryProgress[]> {
  const result: CategoryProgress[] = [];

  for (const phase of PROJECT_PHASES) {
    const phaseData = await calculatePhaseProgress(siteId, phase);
    result.push({
      categoryId: `CONST-${phase}`,
      categoryCode: phase,
      categoryName: PROJECT_PHASE_LABELS[phase],
      progress: phaseData.progress,
      itemsCount: phaseData.totalItems,
      completedCount: phaseData.completedItems,
    });
  }

  return result;
}

/**
 * Obtient les détails de progression par catégorie pour la Mobilisation
 */
export async function getMobilisationCategoryDetails(siteId: number): Promise<CategoryProgress[]> {
  const mobilisationAxes: Axe[] = ['axe1_rh', 'axe2_commercial', 'axe4_budget', 'axe5_marketing', 'axe6_exploitation'];
  const result: CategoryProgress[] = [];

  for (const axe of mobilisationAxes) {
    const axeData = await calculateAxeProgress(siteId, axe);
    result.push({
      categoryId: `MOB-${axe}`,
      categoryCode: axe,
      categoryName: AXE_SHORT_LABELS[axe],
      progress: axeData.progress,
      itemsCount: axeData.totalItems,
      completedCount: axeData.completedItems,
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
export async function getSnapshotHistoryV2(projectId: string, limit?: number): Promise<SyncSnapshot[]> {
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
export async function getAlertsByProjectV2(projectId: string, onlyActive = false): Promise<SyncAlert[]> {
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
export async function getActionsByProjectV2(projectId: string): Promise<SyncAction[]> {
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
  // Jalons
  const jalons = await db.jalons.where('siteId').equals(siteId).toArray();
  const jalonsAtteints = jalons.filter(j => j.statut === 'atteint').length;

  // Actions
  const actions = await db.actions.where('siteId').equals(siteId).toArray();
  const actionsTerminees = actions.filter(a => a.status === 'termine').length;

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
