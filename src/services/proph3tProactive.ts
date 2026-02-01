/**
 * PROPH3T Proactive Engine
 * Moteur d'analyse proactive qui scanne le projet et génère des insights automatiquement
 */

import { db } from '@/db';
import { Proph3tEngine, type ProjectContext } from './proph3tEngine';
import type { Action, Jalon, Risque, ProjectPhase } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export type InsightSeverity = 'critical' | 'warning' | 'info' | 'success';
export type InsightCategory = 'deadline' | 'risk' | 'budget' | 'blocker' | 'opportunity' | 'trend' | 'suggestion' | 'velocity' | 'phase_sync' | 'postponement';

export interface ProactiveInsight {
  id: string;
  timestamp: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  description: string;
  suggestion?: string;
  entityType?: 'action' | 'jalon' | 'risque' | 'budget';
  entityId?: number;
  entityTitle?: string;
  // Source de l'insight
  source: 'local' | 'openrouter' | 'hybrid';
  aiEnhanced?: string; // Analyse enrichie par IA si disponible
  // Etat
  isDismissed: boolean;
  dismissedAt?: string;
}

export interface ProactiveConfig {
  enabled: boolean;
  scanIntervalMinutes: number;
  hybridMode: boolean; // Exécuter local + OpenRouter en parallèle
  autoSuggest: boolean;
  // Seuils d'alerte
  deadlineWarningDays: number;
  deadlineCriticalDays: number;
  riskScoreCritical: number;
  budgetOverrunWarning: number;
  // Analyse prédictive
  velocityAnalysis: boolean; // Activer l'analyse de vélocité
  phaseSyncAnalysis: boolean; // Activer l'analyse de synchronisation des phases
  minProgressForVelocity: number; // % minimum d'avancement pour calculer la vélocité (ex: 10)
}

// ============================================================================
// CONSTANTS
// ============================================================================

const INSIGHTS_KEY = 'proph3t_proactive_insights';
const CONFIG_KEY = 'proph3t_proactive_config';
const LAST_SCAN_KEY = 'proph3t_last_scan';

const DEFAULT_CONFIG: ProactiveConfig = {
  enabled: true,
  scanIntervalMinutes: 5,
  hybridMode: true, // Activé par défaut
  autoSuggest: true,
  deadlineWarningDays: 7,
  deadlineCriticalDays: 3,
  riskScoreCritical: 12,
  budgetOverrunWarning: 10,
  velocityAnalysis: true, // Activé par défaut
  phaseSyncAnalysis: true, // Activé par défaut
  minProgressForVelocity: 10, // 10% minimum
};

// ============================================================================
// CONFIGURATION
// ============================================================================

export function getProactiveConfig(): ProactiveConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Erreur lecture config proactive:', e);
  }
  return DEFAULT_CONFIG;
}

export function saveProactiveConfig(config: Partial<ProactiveConfig>): void {
  try {
    const current = getProactiveConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Erreur sauvegarde config proactive:', e);
  }
}

// ============================================================================
// INSIGHTS STORAGE
// ============================================================================

export function getStoredInsights(): ProactiveInsight[] {
  try {
    const stored = localStorage.getItem(INSIGHTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Erreur lecture insights:', e);
  }
  return [];
}

export function saveInsights(insights: ProactiveInsight[]): void {
  try {
    // Garder seulement les 50 derniers insights
    const toSave = insights.slice(0, 50);
    localStorage.setItem(INSIGHTS_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Erreur sauvegarde insights:', e);
  }
}

export function dismissInsight(insightId: string): void {
  const insights = getStoredInsights();
  const updated = insights.map(i =>
    i.id === insightId ? { ...i, isDismissed: true, dismissedAt: new Date().toISOString() } : i
  );
  saveInsights(updated);
}

export function clearInsights(): void {
  localStorage.removeItem(INSIGHTS_KEY);
}

// ============================================================================
// PROACTIVE SCANNING
// ============================================================================

/**
 * Exécute un scan proactif du projet et génère des insights
 */
export async function runProactiveScan(): Promise<ProactiveInsight[]> {
  const config = getProactiveConfig();
  if (!config.enabled) return [];

  const now = new Date();
  const insights: ProactiveInsight[] = [];

  try {
    // Charger les données du projet
    const [actions, jalons, risques, budget, alertes] = await Promise.all([
      db.actions.toArray(),
      db.jalons.toArray(),
      db.risques.toArray(),
      db.budget.toArray(),
      db.alertes.toArray(),
    ]);

    const context: ProjectContext = {
      actions: actions as Action[],
      jalons: jalons as Jalon[],
      risques: risques as Risque[],
      budget,
      alertes,
      users: [],
      teams: [],
    };

    // 1. ANALYSE DES DEADLINES
    insights.push(...analyzeDeadlines(actions as Action[], jalons as Jalon[], config, now));

    // 2. ANALYSE DES BLOCAGES
    insights.push(...analyzeBlockers(actions as Action[]));

    // 3. ANALYSE DES RISQUES
    insights.push(...analyzeRisks(risques as Risque[], config));

    // 4. ANALYSE BUDGET
    insights.push(...analyzeBudget(budget, context));

    // 5. ANALYSE DES TENDANCES
    insights.push(...analyzeTrends(context));

    // 6. ANALYSE DE VÉLOCITÉ (prédiction de retards)
    if (config.velocityAnalysis) {
      insights.push(...analyzeVelocity(actions as Action[], config, now));
    }

    // 7. ANALYSE DE SYNCHRONISATION DES PHASES
    if (config.phaseSyncAnalysis) {
      insights.push(...analyzePhaseSync(actions as Action[], now));
    }

    // 8. ANALYSE DES DÉPENDANCES (propositions de report)
    insights.push(...analyzeDependencies(actions as Action[]));

    // 9. SUGGESTIONS PROACTIVES
    if (config.autoSuggest) {
      insights.push(...generateSuggestions(context));
    }

    // 10. MODE HYBRIDE - Enrichir avec OpenRouter si configuré
    if (config.hybridMode) {
      await enrichWithAI(insights, context);
    }

    // Sauvegarder les insights
    const existingInsights = getStoredInsights().filter(i => !i.isDismissed);
    const newInsights = deduplicateInsights([...insights, ...existingInsights]);
    saveInsights(newInsights);

    // Sauvegarder le timestamp du dernier scan
    localStorage.setItem(LAST_SCAN_KEY, now.toISOString());

    return newInsights.filter(i => !i.isDismissed);
  } catch (e) {
    console.error('Erreur scan proactif:', e);
    return [];
  }
}

function createInsight(
  category: InsightCategory,
  severity: InsightSeverity,
  title: string,
  description: string,
  options?: Partial<ProactiveInsight>
): ProactiveInsight {
  return {
    id: `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    category,
    severity,
    title,
    description,
    source: 'local',
    isDismissed: false,
    ...options,
  };
}

// ============================================================================
// ANALYSES SPECIFIQUES
// ============================================================================

function analyzeDeadlines(
  actions: Action[],
  jalons: Jalon[],
  config: ProactiveConfig,
  now: Date
): ProactiveInsight[] {
  const insights: ProactiveInsight[] = [];

  // Actions proches de l'échéance
  actions
    .filter(a => a.statut !== 'termine' && a.date_fin_prevue)
    .forEach(action => {
      const deadline = new Date(action.date_fin_prevue);
      const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) {
        insights.push(createInsight(
          'deadline',
          'critical',
          `Action en retard: ${action.titre}`,
          `Cette action devait être terminée il y a ${Math.abs(daysUntil)} jour(s). Avancement actuel: ${action.avancement || 0}%`,
          {
            entityType: 'action',
            entityId: action.id,
            entityTitle: action.titre,
            suggestion: 'Organiser une réunion de déblocage ou revoir la priorité de cette action.',
          }
        ));
      } else if (daysUntil <= config.deadlineCriticalDays) {
        insights.push(createInsight(
          'deadline',
          'warning',
          `Échéance critique: ${action.titre}`,
          `Cette action doit être terminée dans ${daysUntil} jour(s). Avancement: ${action.avancement || 0}%`,
          {
            entityType: 'action',
            entityId: action.id,
            entityTitle: action.titre,
            suggestion: 'Prioriser cette action et vérifier les ressources disponibles.',
          }
        ));
      } else if (daysUntil <= config.deadlineWarningDays && (action.avancement || 0) < 50) {
        insights.push(createInsight(
          'deadline',
          'info',
          `Attention échéance: ${action.titre}`,
          `Échéance dans ${daysUntil} jours avec seulement ${action.avancement || 0}% d'avancement.`,
          {
            entityType: 'action',
            entityId: action.id,
            entityTitle: action.titre,
          }
        ));
      }
    });

  // Jalons en danger
  jalons
    .filter(j => j.statut !== 'atteint' && j.date_prevue)
    .forEach(jalon => {
      const deadline = new Date(jalon.date_prevue);
      const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) {
        insights.push(createInsight(
          'deadline',
          'critical',
          `Jalon dépassé: ${jalon.titre}`,
          `Ce jalon devait être atteint il y a ${Math.abs(daysUntil)} jour(s).`,
          {
            entityType: 'jalon',
            entityId: jalon.id,
            entityTitle: jalon.titre,
            suggestion: 'Analyser les causes du retard et communiquer avec les parties prenantes.',
          }
        ));
      } else if (daysUntil <= config.deadlineCriticalDays) {
        insights.push(createInsight(
          'deadline',
          'warning',
          `Jalon imminent: ${jalon.titre}`,
          `Ce jalon doit être atteint dans ${daysUntil} jour(s).`,
          {
            entityType: 'jalon',
            entityId: jalon.id,
            entityTitle: jalon.titre,
          }
        ));
      }
    });

  return insights;
}

function analyzeBlockers(actions: Action[]): ProactiveInsight[] {
  const insights: ProactiveInsight[] = [];
  const blocked = actions.filter(a => a.statut === 'bloque');

  if (blocked.length > 0) {
    insights.push(createInsight(
      'blocker',
      'critical',
      `${blocked.length} action(s) bloquée(s)`,
      `Actions bloquées: ${blocked.slice(0, 3).map(a => a.titre).join(', ')}${blocked.length > 3 ? '...' : ''}`,
      {
        suggestion: 'Organiser une réunion de déblocage avec les responsables concernés.',
      }
    ));

    // Détail par action bloquée
    blocked.forEach(action => {
      insights.push(createInsight(
        'blocker',
        'warning',
        `Bloqué: ${action.titre}`,
        `Cette action est bloquée depuis sa dernière mise à jour.`,
        {
          entityType: 'action',
          entityId: action.id,
          entityTitle: action.titre,
          suggestion: 'Identifier la cause du blocage et les ressources nécessaires.',
        }
      ));
    });
  }

  return insights;
}

function analyzeRisks(risques: Risque[], config: ProactiveConfig): ProactiveInsight[] {
  const insights: ProactiveInsight[] = [];
  const criticalRisks = risques.filter(r => (r.score || 0) >= config.riskScoreCritical && r.statut !== 'ferme');

  if (criticalRisks.length > 0) {
    insights.push(createInsight(
      'risk',
      'critical',
      `${criticalRisks.length} risque(s) critique(s) actif(s)`,
      `Risques avec score ≥ ${config.riskScoreCritical}: ${criticalRisks.slice(0, 3).map(r => r.titre).join(', ')}`,
      {
        suggestion: 'Activer immédiatement les plans de mitigation.',
      }
    ));

    criticalRisks.forEach(risque => {
      const hasMitigation = risque.plan_mitigation && risque.plan_mitigation.trim().length > 0;
      insights.push(createInsight(
        'risk',
        'warning',
        `Risque critique: ${risque.titre}`,
        `Score: ${risque.score} | ${hasMitigation ? 'Plan de mitigation défini' : 'AUCUN plan de mitigation!'}`,
        {
          entityType: 'risque',
          entityId: risque.id,
          entityTitle: risque.titre,
          suggestion: hasMitigation ? 'Vérifier l\'avancement du plan de mitigation.' : 'Définir urgemment un plan de mitigation!',
        }
      ));
    });
  }

  // Risques sans mitigation
  const risksWithoutMitigation = risques.filter(r =>
    r.statut !== 'ferme' &&
    (!r.plan_mitigation || r.plan_mitigation.trim().length === 0)
  );

  if (risksWithoutMitigation.length > 3) {
    insights.push(createInsight(
      'risk',
      'info',
      `${risksWithoutMitigation.length} risques sans plan de mitigation`,
      'Plusieurs risques n\'ont pas de plan de mitigation défini.',
      {
        suggestion: 'Planifier une session de travail sur les plans de mitigation.',
      }
    ));
  }

  return insights;
}

function analyzeBudget(budget: any[], context: ProjectContext): ProactiveInsight[] {
  const insights: ProactiveInsight[] = [];
  const evm = Proph3tEngine.calculateEVM(context);

  // CPI faible (dépassement budget)
  if (evm.cpi < 0.9) {
    insights.push(createInsight(
      'budget',
      'critical',
      'Dépassement budgétaire détecté',
      `CPI de ${evm.cpi.toFixed(2)} indique que vous dépensez plus que prévu pour le travail accompli.`,
      {
        suggestion: 'Analyser les postes de dépense et identifier les économies possibles.',
      }
    ));
  } else if (evm.cpi < 0.95) {
    insights.push(createInsight(
      'budget',
      'warning',
      'Attention au budget',
      `CPI de ${evm.cpi.toFixed(2)} - tendance au dépassement.`,
      {
        suggestion: 'Surveiller les dépenses et optimiser si possible.',
      }
    ));
  }

  // SPI faible (retard planning)
  if (evm.spi < 0.85) {
    insights.push(createInsight(
      'trend',
      'critical',
      'Retard planning significatif',
      `SPI de ${evm.spi.toFixed(2)} - le projet avance moins vite que prévu.`,
      {
        suggestion: 'Revoir les priorités, ajouter des ressources ou replanifier.',
      }
    ));
  } else if (evm.spi < 0.95) {
    insights.push(createInsight(
      'trend',
      'warning',
      'Léger retard planning',
      `SPI de ${evm.spi.toFixed(2)} - tendance au retard.`,
      {
        suggestion: 'Surveiller l\'avancement et anticiper les problèmes.',
      }
    ));
  }

  return insights;
}

// ============================================================================
// ANALYSE DE VÉLOCITÉ (Prédiction de retards)
// ============================================================================

/**
 * Calcule la vélocité d'une action et prédit si elle sera terminée à temps
 * Vélocité = avancement / jours écoulés depuis le début
 */
function analyzeVelocity(
  actions: Action[],
  config: ProactiveConfig,
  now: Date
): ProactiveInsight[] {
  const insights: ProactiveInsight[] = [];

  actions
    .filter(a =>
      a.statut !== 'termine' &&
      a.date_debut_prevue &&
      a.date_fin_prevue &&
      (a.avancement || 0) >= config.minProgressForVelocity // Au moins X% d'avancement pour calculer
    )
    .forEach(action => {
      const startDate = new Date(action.date_debut_prevue);
      const endDate = new Date(action.date_fin_prevue);
      const avancement = action.avancement || 0;

      // Jours écoulés depuis le début
      const daysElapsed = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      // Durée totale prévue
      const totalDuration = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      // Jours restants
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Vélocité: % par jour
      const velocity = avancement / daysElapsed;

      // Avancement attendu à ce stade (progression linéaire)
      const expectedProgress = (daysElapsed / totalDuration) * 100;

      // Prédiction: combien de jours pour atteindre 100%?
      const remainingProgress = 100 - avancement;
      const predictedDaysToComplete = velocity > 0 ? Math.ceil(remainingProgress / velocity) : Infinity;
      const predictedEndDate = new Date(now.getTime() + predictedDaysToComplete * 24 * 60 * 60 * 1000);

      // Écart prédit vs échéance
      const delayPredicted = Math.ceil((predictedEndDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));

      // Si la vélocité indique un retard significatif
      if (delayPredicted > 7 && daysRemaining > 0) {
        insights.push(createInsight(
          'velocity',
          'critical',
          `Retard prévu: ${action.titre}`,
          `À la vélocité actuelle (${velocity.toFixed(1)}%/jour), cette action sera terminée avec ~${delayPredicted} jours de retard. Avancement: ${avancement}% (attendu: ${expectedProgress.toFixed(0)}%).`,
          {
            entityType: 'action',
            entityId: action.id,
            entityTitle: action.titre,
            suggestion: `Augmenter les ressources ou revoir le périmètre. Date fin prévue: ${endDate.toLocaleDateString('fr-FR')}, fin estimée: ${predictedEndDate.toLocaleDateString('fr-FR')}.`,
          }
        ));
      } else if (delayPredicted > 3 && daysRemaining > 0) {
        insights.push(createInsight(
          'velocity',
          'warning',
          `Risque de retard: ${action.titre}`,
          `Vélocité actuelle insuffisante. Avancement ${avancement}% (attendu: ${expectedProgress.toFixed(0)}%). Retard estimé: ~${delayPredicted} jours.`,
          {
            entityType: 'action',
            entityId: action.id,
            entityTitle: action.titre,
            suggestion: 'Surveiller de près et envisager des actions correctives.',
          }
        ));
      } else if (avancement > expectedProgress + 15) {
        // L'action est en avance
        insights.push(createInsight(
          'velocity',
          'success',
          `En avance: ${action.titre}`,
          `Cette action progresse plus vite que prévu (${avancement}% vs ${expectedProgress.toFixed(0)}% attendu).`,
          {
            entityType: 'action',
            entityId: action.id,
            entityTitle: action.titre,
          }
        ));
      }
    });

  return insights;
}

// ============================================================================
// ANALYSE DE SYNCHRONISATION DES PHASES
// ============================================================================

/**
 * Analyse les dépendances entre phases du projet
 * Ex: La mobilisation dépend de la construction
 */
function analyzePhaseSync(actions: Action[], now: Date): ProactiveInsight[] {
  const insights: ProactiveInsight[] = [];

  // Définir les dépendances entre phases
  const PHASE_DEPENDENCIES: Record<string, string[]> = {
    'phase2_mobilisation': ['phase1_preparation'],
    'phase3_lancement': ['phase2_mobilisation', 'phase1_preparation'],
    'phase4_stabilisation': ['phase3_lancement'],
  };

  // Dépendances entre axes (Construction → autres axes)
  const AXE_DEPENDENCIES: Record<string, string[]> = {
    'axe1_rh': ['axe7_construction'],
    'axe2_commercial': ['axe7_construction'],
    'axe3_technique': ['axe7_construction'],
    'axe6_exploitation': ['axe7_construction', 'axe3_technique'],
  };

  // Grouper les actions par phase et axe
  const actionsByPhase: Record<string, Action[]> = {};
  const actionsByAxe: Record<string, Action[]> = {};

  actions.forEach(action => {
    const phase = action.projectPhase || 'unknown';
    const axe = action.axe;

    if (!actionsByPhase[phase]) actionsByPhase[phase] = [];
    actionsByPhase[phase].push(action);

    if (!actionsByAxe[axe]) actionsByAxe[axe] = [];
    actionsByAxe[axe].push(action);
  });

  // Calculer l'avancement moyen par phase
  const phaseProgress: Record<string, number> = {};
  Object.entries(actionsByPhase).forEach(([phase, phaseActions]) => {
    const total = phaseActions.reduce((sum, a) => sum + (a.avancement || 0), 0);
    phaseProgress[phase] = phaseActions.length > 0 ? total / phaseActions.length : 0;
  });

  // Calculer l'avancement moyen par axe
  const axeProgress: Record<string, number> = {};
  Object.entries(actionsByAxe).forEach(([axe, axeActions]) => {
    const total = axeActions.reduce((sum, a) => sum + (a.avancement || 0), 0);
    axeProgress[axe] = axeActions.length > 0 ? total / axeActions.length : 0;
  });

  // Vérifier les dépendances de phases
  Object.entries(PHASE_DEPENDENCIES).forEach(([dependentPhase, prerequisitePhases]) => {
    const dependentProgress = phaseProgress[dependentPhase] || 0;

    prerequisitePhases.forEach(prereqPhase => {
      const prereqProgress = phaseProgress[prereqPhase] || 0;

      // Si la phase dépendante a progressé mais pas les prérequis
      if (dependentProgress > 20 && prereqProgress < 80) {
        const phaseLabel = dependentPhase.replace('phase', 'Phase ').replace('_', ' - ');
        const prereqLabel = prereqPhase.replace('phase', 'Phase ').replace('_', ' - ');

        insights.push(createInsight(
          'phase_sync',
          'warning',
          `Désynchronisation: ${phaseLabel}`,
          `La ${phaseLabel} progresse (${dependentProgress.toFixed(0)}%) alors que ${prereqLabel} n'est pas terminée (${prereqProgress.toFixed(0)}%).`,
          {
            suggestion: `Prioriser les actions de ${prereqLabel} avant de continuer ${phaseLabel}.`,
          }
        ));
      }
    });
  });

  // Vérifier les dépendances d'axes (Construction → Mobilisation RH, Commercial, etc.)
  const constructionProgress = axeProgress['axe7_construction'] || 0;

  Object.entries(AXE_DEPENDENCIES).forEach(([dependentAxe, prerequisiteAxes]) => {
    if (!prerequisiteAxes.includes('axe7_construction')) return;

    const dependentProgress = axeProgress[dependentAxe] || 0;
    const axeActions = actionsByAxe[dependentAxe] || [];

    // Trouver les actions de mobilisation qui démarrent alors que la construction n'est pas assez avancée
    axeActions
      .filter(a =>
        a.statut !== 'termine' &&
        (a.avancement || 0) > 0 &&
        (a.projectPhase === 'phase2_mobilisation' || a.projectPhase === 'phase3_lancement')
      )
      .forEach(action => {
        // Si l'action de mobilisation/lancement avance mais la construction est en retard
        if (constructionProgress < 70 && (action.avancement || 0) > 30) {
          const axeLabel = dependentAxe.replace('axe', 'Axe ').replace('_', ' - ');

          insights.push(createInsight(
            'phase_sync',
            'warning',
            `Synchronisation Construction/${axeLabel}`,
            `"${action.titre}" avance (${action.avancement}%) alors que la construction n'est qu'à ${constructionProgress.toFixed(0)}%.`,
            {
              entityType: 'action',
              entityId: action.id,
              entityTitle: action.titre,
              suggestion: `Vérifier que cette action peut réellement progresser sans dépendre de la fin de la construction.`,
            }
          ));
        }
      });
  });

  // Alerter si la construction est en retard critique
  if (constructionProgress < 50 && now > new Date('2026-06-01')) {
    insights.push(createInsight(
      'phase_sync',
      'critical',
      'Construction en retard critique',
      `L'avancement construction (${constructionProgress.toFixed(0)}%) est insuffisant pour une ouverture en octobre 2026.`,
      {
        suggestion: 'Réunion de crise avec les équipes construction. Envisager un report de l\'ouverture.',
      }
    ));
  }

  return insights;
}

// ============================================================================
// ANALYSE DES DÉPENDANCES (Propositions de report)
// ============================================================================

/**
 * Analyse les dépendances entre actions et suggère des reports si nécessaire
 */
function analyzeDependencies(actions: Action[]): ProactiveInsight[] {
  const insights: ProactiveInsight[] = [];

  // Créer un index des actions par ID
  const actionsById: Record<string | number, Action> = {};
  actions.forEach(a => {
    actionsById[a.id] = a;
    if (a.id_action) actionsById[a.id_action] = a;
  });

  // Analyser chaque action avec des prédécesseurs
  actions.forEach(action => {
    if (!action.predecesseurs || action.predecesseurs.length === 0) return;
    if (action.statut === 'termine') return;

    // Vérifier l'état des prédécesseurs
    const incompletePredecessors: Action[] = [];
    const blockedPredecessors: Action[] = [];

    action.predecesseurs.forEach(pred => {
      const predAction = actionsById[pred.actionId];
      if (!predAction) return;

      if (predAction.statut === 'bloque') {
        blockedPredecessors.push(predAction);
      } else if (predAction.statut !== 'termine' && (predAction.avancement || 0) < 100) {
        incompletePredecessors.push(predAction);
      }
    });

    // Si des prédécesseurs sont bloqués
    if (blockedPredecessors.length > 0) {
      insights.push(createInsight(
        'postponement',
        'critical',
        `Report suggéré: ${action.titre}`,
        `Cette action dépend de ${blockedPredecessors.length} action(s) bloquée(s): ${blockedPredecessors.slice(0, 2).map(p => p.titre).join(', ')}.`,
        {
          entityType: 'action',
          entityId: action.id,
          entityTitle: action.titre,
          suggestion: `Reporter cette action jusqu'à la résolution des blocages. Débloquer en priorité: "${blockedPredecessors[0].titre}".`,
        }
      ));
    }
    // Si des prédécesseurs sont incomplets et l'action en cours a commencé
    else if (incompletePredecessors.length > 0 && (action.avancement || 0) > 0) {
      // Vérifier si les prédécesseurs sont en retard
      const now = new Date();
      const latePredecessors = incompletePredecessors.filter(pred => {
        if (!pred.date_fin_prevue) return false;
        return new Date(pred.date_fin_prevue) < now;
      });

      if (latePredecessors.length > 0) {
        insights.push(createInsight(
          'postponement',
          'warning',
          `Dépendance en retard: ${action.titre}`,
          `Cette action dépend de ${latePredecessors.length} action(s) en retard: ${latePredecessors.slice(0, 2).map(p => `"${p.titre}" (${p.avancement || 0}%)`).join(', ')}.`,
          {
            entityType: 'action',
            entityId: action.id,
            entityTitle: action.titre,
            suggestion: `Vérifier si cette action peut continuer ou doit attendre. Accélérer: "${latePredecessors[0].titre}".`,
          }
        ));
      }
    }
    // Si l'action n'a pas commencé mais les prédécesseurs sont loin d'être terminés
    else if ((action.avancement || 0) === 0 && incompletePredecessors.length > 0) {
      const avgPredProgress = incompletePredecessors.reduce((sum, p) => sum + (p.avancement || 0), 0) / incompletePredecessors.length;

      if (avgPredProgress < 50 && action.date_debut_prevue) {
        const startDate = new Date(action.date_debut_prevue);
        const now = new Date();
        const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilStart <= 14 && daysUntilStart > 0) {
          insights.push(createInsight(
            'postponement',
            'info',
            `Anticipation: ${action.titre}`,
            `Démarrage prévu dans ${daysUntilStart} jours, mais les prédécesseurs sont à ${avgPredProgress.toFixed(0)}% en moyenne.`,
            {
              entityType: 'action',
              entityId: action.id,
              entityTitle: action.titre,
              suggestion: `Envisager de reporter le démarrage. Prédécesseurs à terminer: ${incompletePredecessors.slice(0, 2).map(p => p.titre).join(', ')}.`,
            }
          ));
        }
      }
    }
  });

  // Analyse Construction → Mobilisation spécifique
  const constructionActions = actions.filter(a => a.axe === 'axe7_construction' && a.statut !== 'termine');
  const mobilisationActions = actions.filter(a =>
    a.projectPhase === 'phase2_mobilisation' &&
    a.axe !== 'axe7_construction' &&
    a.statut !== 'termine'
  );

  // Vérifier si des actions de mobilisation devraient attendre la construction
  const constructionAvg = constructionActions.length > 0
    ? constructionActions.reduce((sum, a) => sum + (a.avancement || 0), 0) / constructionActions.length
    : 100;

  if (constructionAvg < 60) {
    const riskMobilisation = mobilisationActions.filter(a =>
      (a.avancement || 0) > 50 &&
      (a.axe === 'axe1_rh' || a.axe === 'axe6_exploitation')
    );

    riskMobilisation.forEach(action => {
      insights.push(createInsight(
        'postponement',
        'warning',
        `Mobilisation prématurée: ${action.titre}`,
        `Cette action de mobilisation (${action.avancement}%) avance alors que la construction n'est qu'à ${constructionAvg.toFixed(0)}%.`,
        {
          entityType: 'action',
          entityId: action.id,
          entityTitle: action.titre,
          suggestion: `Ralentir cette action ou s'assurer qu'elle ne génère pas de coûts inutiles avant la fin de la construction.`,
        }
      ));
    });
  }

  return insights;
}

function analyzeTrends(context: ProjectContext): ProactiveInsight[] {
  const insights: ProactiveInsight[] = [];
  const { actions, jalons } = context;

  // Taux de complétion
  const completed = actions.filter(a => a.statut === 'termine').length;
  const total = actions.length;
  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  if (completionRate > 80 && total > 5) {
    insights.push(createInsight(
      'success',
      'success',
      'Excellent avancement!',
      `${completionRate.toFixed(0)}% des actions sont terminées. Continuez ainsi!`,
      {}
    ));
  }

  // Jalons atteints
  const jalonsAtteints = jalons.filter(j => j.statut === 'atteint').length;
  if (jalonsAtteints > 0 && jalons.length > 0) {
    const jalonsRate = (jalonsAtteints / jalons.length) * 100;
    if (jalonsRate >= 50) {
      insights.push(createInsight(
        'success',
        'success',
        `${jalonsAtteints}/${jalons.length} jalons atteints`,
        `${jalonsRate.toFixed(0)}% des jalons du projet sont validés.`,
        {}
      ));
    }
  }

  return insights;
}

function generateSuggestions(context: ProjectContext): ProactiveInsight[] {
  const insights: ProactiveInsight[] = [];
  const { actions, risques, alertes } = context;

  // Alertes non traitées
  const untreatedAlerts = alertes.filter(a => !a.traitee);
  if (untreatedAlerts.length > 5) {
    insights.push(createInsight(
      'suggestion',
      'info',
      `${untreatedAlerts.length} alertes en attente`,
      'Plusieurs alertes n\'ont pas été traitées.',
      {
        suggestion: 'Prendre le temps de traiter les alertes pour maintenir la visibilité.',
      }
    ));
  }

  // Actions sans responsable
  const actionsNoOwner = actions.filter(a => !a.responsableId && a.statut !== 'termine');
  if (actionsNoOwner.length > 0) {
    insights.push(createInsight(
      'suggestion',
      'info',
      `${actionsNoOwner.length} action(s) sans responsable`,
      'Des actions n\'ont pas de responsable assigné.',
      {
        suggestion: 'Assigner un responsable pour améliorer le suivi.',
      }
    ));
  }

  // Suggestion de revue des risques
  const openRisks = risques.filter(r => r.statut !== 'ferme');
  if (openRisks.length > 10) {
    insights.push(createInsight(
      'suggestion',
      'info',
      'Revue des risques recommandée',
      `${openRisks.length} risques ouverts - une revue pourrait aider à prioriser.`,
      {
        suggestion: 'Planifier une revue des risques avec l\'équipe projet.',
      }
    ));
  }

  return insights;
}

// ============================================================================
// ENRICHISSEMENT IA (MODE HYBRIDE)
// ============================================================================

async function enrichWithAI(insights: ProactiveInsight[], context: ProjectContext): Promise<void> {
  const config = Proph3tEngine.getConfig();

  // Vérifier si OpenRouter est configuré
  if (!config.openrouterApiKey) return;

  // Prendre les 3 insights les plus critiques pour les enrichir
  const criticalInsights = insights
    .filter(i => i.severity === 'critical' || i.severity === 'warning')
    .slice(0, 3);

  if (criticalInsights.length === 0) return;

  try {
    const prompt = `Analyse ces problèmes du projet et donne des conseils concrets (2-3 phrases max par problème):

${criticalInsights.map((i, idx) => `${idx + 1}. [${i.severity.toUpperCase()}] ${i.title}: ${i.description}`).join('\n')}

Réponds en JSON: [{"index": 0, "conseil": "..."}]`;

    const systemPrompt = `Tu es PROPH3T, assistant IA expert en gestion de projet.
Analyse les problèmes et donne des conseils pratiques et actionnables.
Sois direct et concis. Réponds UNIQUEMENT en JSON valide.`;

    const response = await Proph3tEngine.call(prompt, systemPrompt, context);

    try {
      const suggestions = JSON.parse(response.content);
      suggestions.forEach((s: { index: number; conseil: string }) => {
        if (criticalInsights[s.index]) {
          criticalInsights[s.index].aiEnhanced = s.conseil;
          criticalInsights[s.index].source = 'hybrid';
        }
      });
    } catch (e) {
      // Si le parsing JSON échoue, utiliser la réponse brute
      if (criticalInsights[0]) {
        criticalInsights[0].aiEnhanced = response.content;
        criticalInsights[0].source = 'hybrid';
      }
    }
  } catch (e) {
    console.warn('Enrichissement IA non disponible:', e);
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

function deduplicateInsights(insights: ProactiveInsight[]): ProactiveInsight[] {
  const seen = new Set<string>();
  return insights.filter(insight => {
    // Clé de déduplication basée sur le type et l'entité
    const key = `${insight.category}-${insight.entityType || 'none'}-${insight.entityId || insight.title}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function getLastScanTime(): Date | null {
  try {
    const stored = localStorage.getItem(LAST_SCAN_KEY);
    return stored ? new Date(stored) : null;
  } catch {
    return null;
  }
}

// ============================================================================
// AUTO-SCAN SCHEDULER
// ============================================================================

let scanInterval: ReturnType<typeof setInterval> | null = null;

export function startProactiveScan(): void {
  const config = getProactiveConfig();
  if (!config.enabled) return;

  // Arrêter l'intervalle existant
  stopProactiveScan();

  // Exécuter immédiatement
  runProactiveScan();

  // Planifier les scans suivants
  scanInterval = setInterval(() => {
    runProactiveScan();
  }, config.scanIntervalMinutes * 60 * 1000);

  console.info(`PROPH3T Proactive: Scan planifié toutes les ${config.scanIntervalMinutes} minutes`);
}

export function stopProactiveScan(): void {
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const Proph3tProactive = {
  // Configuration
  getConfig: getProactiveConfig,
  saveConfig: saveProactiveConfig,

  // Insights
  getInsights: getStoredInsights,
  dismissInsight,
  clearInsights,

  // Scanning
  runScan: runProactiveScan,
  startAutoScan: startProactiveScan,
  stopAutoScan: stopProactiveScan,
  getLastScanTime,
};

export default Proph3tProactive;
