/**
 * Proph3t AI Service - Version Avancée
 * Multi-backend AI assistant for COSMOS ANGRE Cockpit
 * Supports: OpenRouter, Anthropic, Local Advanced Algorithm
 *
 * Fonctionnalités locales avancées:
 * - Détection d'intention NLP avancée
 * - Analyse de tendances temporelles
 * - Analyse prédictive et EVM
 * - Analyse de charge et ressources
 * - Analyse des dépendances
 * - Contexte conversationnel
 * - Recommandations intelligentes avec scoring
 */

import type { Action, Jalon, Risque, Alerte, User, Team, EVMIndicators, DashboardKPIs } from '../types';
import { API_ENDPOINTS } from '../lib/apiEndpoints';

export type AIProvider = 'openrouter' | 'anthropic' | 'local' | 'hybrid';

export interface AIConfig {
  provider: AIProvider;
  openrouterApiKey?: string;
  anthropicApiKey?: string;
  openrouterModel?: string;
  anthropicModel?: string;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Budget synthese type (matches useBudgetSynthese() return)
export interface BudgetSynthese {
  prevu: number;
  engage: number;
  realise: number;
  ecartEngagement: number;
  ecartRealisation: number;
  tauxEngagement: number;
  tauxRealisation: number;
}

export interface ProjectContext {
  actions: Action[];
  jalons: Jalon[];
  risques: Risque[];
  budget: BudgetSynthese;
  alertes: Alerte[];
  users: User[];
  teams: Team[];
  kpis: DashboardKPIs;
  historique?: Record<string, unknown>[];
  evm?: EVMIndicators;
}

// Types pour l'analyse avancée
interface IntentResult {
  intent: string;
  confidence: number;
  entities: Record<string, string>;
  subIntent?: string;
}

interface TrendData {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  forecast: number;
}

interface EVMMetrics {
  pv: number; // Planned Value
  ev: number; // Earned Value
  ac: number; // Actual Cost
  sv: number; // Schedule Variance
  cv: number; // Cost Variance
  spi: number; // Schedule Performance Index
  cpi: number; // Cost Performance Index
  eac: number; // Estimate at Completion
  etc: number; // Estimate to Complete
  vac: number; // Variance at Completion
  tcpi: number; // To-Complete Performance Index
}

interface WorkloadAnalysis {
  userId: string;
  userName: string;
  totalActions: number;
  activeActions: number;
  blockedActions: number;
  workloadScore: number; // 0-100
  status: 'sous-charge' | 'optimal' | 'surcharge' | 'critique';
}

interface RecommendationItem {
  priority: number; // 1-5
  category: string;
  title: string;
  description: string;
  impact: 'faible' | 'moyen' | 'eleve' | 'critique';
  effort: 'faible' | 'moyen' | 'eleve';
  actions: string[];
}

const DEFAULT_CONFIG: AIConfig = {
  provider: 'local',
  openrouterModel: 'anthropic/claude-3.5-sonnet',
  anthropicModel: 'claude-3-5-sonnet-20241022',
};

// Storage keys
const CONFIG_KEY = 'prophet_config';
const HISTORY_KEY = 'prophet_history';
const CONTEXT_KEY = 'prophet_context';

// ============================================
// CONFIGURATION MANAGEMENT
// ============================================

export function getConfig(): AIConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error loading Prophet config:', e);
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(config: Partial<AIConfig>): void {
  try {
    const current = getConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving Prophet config:', e);
  }
}

export function getHistory(): AIMessage[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading Prophet history:', e);
  }
  return [];
}

export function saveHistory(history: AIMessage[]): void {
  try {
    const trimmed = history.slice(-50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving Prophet history:', e);
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(CONTEXT_KEY);
}

// Contexte conversationnel
function getConversationContext(): Record<string, unknown> {
  try {
    const stored = localStorage.getItem(CONTEXT_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore JSON parse errors, return empty context
  }
  return {};
}

function saveConversationContext(ctx: Record<string, unknown>): void {
  try {
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
  } catch {
    // Ignore storage errors
  }
}

// ============================================
// INTENT DETECTION - NLP AVANCÉ
// ============================================

const INTENT_PATTERNS: Record<string, { keywords: string[]; weight: number; synonyms?: string[] }> = {
  probleme: {
    keywords: ['probleme', 'problème', 'issue', 'blocage', 'bloque', 'bloqué', 'souci', 'difficulte', 'difficulté', 'obstacle', 'frein', 'empechement', 'empêchement'],
    weight: 1.0,
    synonyms: ['pb', 'prb', 'bug', 'erreur', 'dysfonctionnement']
  },
  risque: {
    keywords: ['risque', 'danger', 'menace', 'vulnerabilite', 'vulnérabilité', 'exposition', 'aleatoire', 'aléatoire', 'incertitude'],
    weight: 1.0,
    synonyms: ['risk', 'peril', 'hazard']
  },
  rapport: {
    keywords: ['rapport', 'synthese', 'synthèse', 'resume', 'résumé', 'bilan', 'recapitulatif', 'récapitulatif', 'compte-rendu', 'cr'],
    weight: 1.0,
    synonyms: ['report', 'summary', 'digest']
  },
  budget: {
    keywords: ['budget', 'financier', 'cout', 'coût', 'depense', 'dépense', 'argent', 'finance', 'tresorerie', 'trésorerie', 'fcfa', 'euro', 'economique', 'économique'],
    weight: 1.0,
    synonyms: ['money', 'cost', 'expense', 'fric', 'sous']
  },
  action: {
    keywords: ['action', 'tache', 'tâche', 'activite', 'activité', 'travail', 'mission', 'todo', 'a faire', 'à faire'],
    weight: 1.0,
    synonyms: ['task', 'work', 'job', 'assignment']
  },
  jalon: {
    keywords: ['jalon', 'milestone', 'echeance', 'échéance', 'deadline', 'livrable', 'delivery', 'etape', 'étape', 'phase'],
    weight: 1.0,
    synonyms: ['gate', 'checkpoint', 'milestone']
  },
  alerte: {
    keywords: ['alerte', 'notification', 'avertissement', 'warning', 'attention', 'signal', 'alarme'],
    weight: 1.0,
    synonyms: ['alert', 'notif']
  },
  equipe: {
    keywords: ['equipe', 'équipe', 'membre', 'ressource', 'personnel', 'collaborateur', 'effectif', 'staff', 'team'],
    weight: 1.0,
    synonyms: ['rh', 'hr', 'people']
  },
  recommandation: {
    keywords: ['recommandation', 'conseil', 'suggestion', 'avis', 'preconisation', 'préconisation', 'proposition', 'idee', 'idée'],
    weight: 1.0,
    synonyms: ['advice', 'tip', 'hint', 'reco']
  },
  statut: {
    keywords: ['statut', 'status', 'etat', 'état', 'situation', 'position', 'avancement', 'progression', 'progres', 'progrès'],
    weight: 1.0,
    synonyms: ['state', 'progress']
  },
  prevision: {
    keywords: ['prevision', 'prévision', 'forecast', 'prediction', 'prédiction', 'projection', 'estimation', 'tendance', 'trend', 'evolution', 'évolution'],
    weight: 1.0,
    synonyms: ['forecast', 'predict']
  },
  evm: {
    keywords: ['evm', 'earned value', 'valeur acquise', 'performance', 'cpi', 'spi', 'variance', 'indice'],
    weight: 1.2,
    synonyms: ['earned', 'value']
  },
  charge: {
    keywords: ['charge', 'workload', 'capacite', 'capacité', 'occupation', 'disponibilite', 'disponibilité', 'affectation', 'repartition', 'répartition'],
    weight: 1.0,
    synonyms: ['load', 'capacity']
  },
  critique: {
    keywords: ['critique', 'critical', 'urgent', 'prioritaire', 'important', 'grave', 'serieux', 'sérieux', 'majeur'],
    weight: 0.8,
    synonyms: ['prio', 'asap']
  },
  historique: {
    keywords: ['historique', 'histoire', 'passe', 'passé', 'evolution', 'évolution', 'changement', 'modification', 'log'],
    weight: 1.0,
    synonyms: ['history', 'log', 'audit']
  },
  comparaison: {
    keywords: ['comparaison', 'compare', 'versus', 'vs', 'difference', 'différence', 'ecart', 'écart', 'delta'],
    weight: 0.9,
    synonyms: ['diff', 'compare']
  },
  export: {
    keywords: ['export', 'exporter', 'telecharger', 'télécharger', 'download', 'extraction', 'extraire'],
    weight: 1.0,
    synonyms: ['dl', 'get']
  },
  import: {
    keywords: ['import', 'importer', 'upload', 'charger', 'integrer', 'intégrer', 'ajouter'],
    weight: 1.0,
    synonyms: ['ul', 'add']
  },
  aide: {
    keywords: ['aide', 'help', 'comment', 'quoi', 'pourquoi', 'expliquer', 'explication', 'guide', 'tutoriel'],
    weight: 0.7,
    synonyms: ['?', 'how', 'what', 'why']
  }
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectIntent(message: string): IntentResult {
  const normalized = normalizeText(message);
  const words = normalized.split(' ');

  const scores: Record<string, number> = {};
  const entities: Record<string, string> = {};

  // Calcul des scores pour chaque intent
  for (const [intent, config] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;
    const allKeywords = [...config.keywords, ...(config.synonyms || [])];

    for (const keyword of allKeywords) {
      const normalizedKeyword = normalizeText(keyword);

      // Match exact
      if (normalized.includes(normalizedKeyword)) {
        score += config.weight * 2;
      }

      // Match partiel (début de mot)
      for (const word of words) {
        if (word.startsWith(normalizedKeyword.substring(0, 3)) && normalizedKeyword.length > 3) {
          score += config.weight * 0.5;
        }
      }
    }

    if (score > 0) {
      scores[intent] = score;
    }
  }

  // Extraction d'entités (nombres, dates, etc.)
  const numberMatch = message.match(/\d+/g);
  if (numberMatch) {
    entities.numbers = numberMatch.join(', ');
  }

  const dateMatch = message.match(/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/g);
  if (dateMatch) {
    entities.dates = dateMatch.join(', ');
  }

  // Détection de période
  if (normalized.includes('semaine')) entities.period = 'semaine';
  else if (normalized.includes('mois')) entities.period = 'mois';
  else if (normalized.includes('trimestre')) entities.period = 'trimestre';
  else if (normalized.includes('annee') || normalized.includes('an')) entities.period = 'annee';

  // Contexte conversationnel - utiliser le dernier intent si question de suivi
  const followUpWords = ['et', 'aussi', 'egalement', 'également', 'plus', 'autre', 'ensuite', 'maintenant'];
  const isFollowUp = followUpWords.some(w => normalized.startsWith(w)) || normalized.startsWith('ok') || normalized.startsWith('oui');

  if (isFollowUp && Object.keys(scores).length === 0) {
    const ctx = getConversationContext();
    if (ctx.lastIntent) {
      scores[ctx.lastIntent] = 0.5;
    }
  }

  // Déterminer l'intent principal
  let mainIntent = 'general';
  let maxScore = 0;
  let subIntent: string | undefined;

  const sortedIntents = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  if (sortedIntents.length > 0 && sortedIntents[0][1] > 0) {
    mainIntent = sortedIntents[0][0];
    maxScore = sortedIntents[0][1];

    if (sortedIntents.length > 1 && sortedIntents[1][1] > 0.5) {
      subIntent = sortedIntents[1][0];
    }
  }

  // Sauvegarde du contexte
  saveConversationContext({
    lastIntent: mainIntent,
    lastEntities: entities,
    timestamp: Date.now()
  });

  return {
    intent: mainIntent,
    confidence: Math.min(maxScore / 4, 1), // Normaliser entre 0 et 1
    entities,
    subIntent
  };
}

// ============================================
// CALCULS EVM (EARNED VALUE MANAGEMENT)
// ============================================

function calculateEVM(ctx: ProjectContext): EVMMetrics {
  const now = new Date();

  // Calcul basé sur les actions et le budget
  const totalActions = ctx.actions.length || 1;
  const completedActions = ctx.actions.filter(a => a.statut === 'termine').length;
  const totalWeight = ctx.actions.reduce((sum, a) => sum + (a.poids || 1), 0) || 1;
  const completedWeight = ctx.actions
    .filter(a => a.statut === 'termine')
    .reduce((sum, a) => sum + (a.poids || 1), 0);

  // Calcul du % planifié (basé sur les dates)
  let plannedPercent = 0;
  const actionsWithDates = ctx.actions.filter(a => a.date_debut && a.date_fin_prevue);

  if (actionsWithDates.length > 0) {
    const minDate = new Date(Math.min(...actionsWithDates.map(a => new Date(a.date_debut).getTime())));
    const maxDate = new Date(Math.max(...actionsWithDates.map(a => new Date(a.date_fin_prevue).getTime())));
    const totalDuration = maxDate.getTime() - minDate.getTime();
    const elapsed = now.getTime() - minDate.getTime();
    plannedPercent = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0;
  } else {
    plannedPercent = (completedActions / totalActions) * 100;
  }

  // Valeurs EVM
  const budgetPrevu = ctx.budget?.prevu || 0;
  const budgetRealise = ctx.budget?.realise || 0;

  const pv = budgetPrevu * (plannedPercent / 100); // Planned Value
  const ev = budgetPrevu * (completedWeight / totalWeight); // Earned Value
  const ac = budgetRealise; // Actual Cost

  const sv = ev - pv; // Schedule Variance
  const cv = ev - ac; // Cost Variance

  const spi = pv > 0 ? ev / pv : 1; // Schedule Performance Index
  const cpi = ac > 0 ? ev / ac : 1; // Cost Performance Index

  const eac = cpi > 0 ? budgetPrevu / cpi : budgetPrevu; // Estimate at Completion
  const etc = eac - ac; // Estimate to Complete
  const vac = budgetPrevu - eac; // Variance at Completion

  const remainingWork = budgetPrevu - ev;
  const remainingBudget = budgetPrevu - ac;
  const tcpi = remainingBudget > 0 ? remainingWork / remainingBudget : 1; // To-Complete Performance Index

  return { pv, ev, ac, sv, cv, spi, cpi, eac, etc, vac, tcpi };
}

// ============================================
// ANALYSE DES TENDANCES
// ============================================

function analyzeTrends(ctx: ProjectContext): Record<string, TrendData> {
  const trends: Record<string, TrendData> = {};

  // Tendance des actions (basée sur l'historique si disponible)
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Actions complétées cette semaine vs semaine précédente (simulation basée sur dates)
  const recentlyCompleted = ctx.actions.filter(a =>
    a.statut === 'termine' &&
    a.date_fin_reelle &&
    new Date(a.date_fin_reelle) >= oneWeekAgo
  ).length;

  const blocked = ctx.actions.filter(a => a.statut === 'bloque').length;

  // Tendance progression
  const avgProgress = ctx.actions.length > 0
    ? ctx.actions.reduce((sum, a) => sum + (a.avancement || 0), 0) / ctx.actions.length
    : 0;

  trends.actions = {
    direction: recentlyCompleted > 2 ? 'up' : recentlyCompleted > 0 ? 'stable' : 'down',
    percentage: avgProgress,
    forecast: Math.min(100, avgProgress + (recentlyCompleted * 5))
  };

  // Tendance risques
  const criticalRisks = ctx.risques.filter(r => r.score >= 12).length;
  const totalRisks = ctx.risques.length || 1;
  const riskRatio = (criticalRisks / totalRisks) * 100;

  trends.risques = {
    direction: criticalRisks > 3 ? 'up' : criticalRisks > 0 ? 'stable' : 'down',
    percentage: riskRatio,
    forecast: Math.max(0, riskRatio - (blocked > 0 ? 10 : 5))
  };

  // Tendance budget
  const budgetUsage = ctx.budget?.prevu > 0
    ? (ctx.budget.realise / ctx.budget.prevu) * 100
    : 0;

  trends.budget = {
    direction: budgetUsage > 90 ? 'up' : budgetUsage > 70 ? 'stable' : 'down',
    percentage: budgetUsage,
    forecast: Math.min(150, budgetUsage * 1.1)
  };

  return trends;
}

// ============================================
// ANALYSE DE CHARGE DE TRAVAIL
// ============================================

function analyzeWorkload(ctx: ProjectContext): WorkloadAnalysis[] {
  const workloads: WorkloadAnalysis[] = [];

  if (!ctx.users || ctx.users.length === 0) return workloads;

  // Actions par utilisateur
  const actionsByUser: Record<string, Action[]> = {};

  ctx.actions.forEach(action => {
    const responsable = action.responsable || action.responsable_id || 'non_assigne';
    if (!actionsByUser[responsable]) actionsByUser[responsable] = [];
    actionsByUser[responsable].push(action);
  });

  ctx.users.forEach(user => {
    const userId = user.id || `${user.prenom}_${user.nom}`;
    const userName = `${user.prenom} ${user.nom}`;
    const userActions = actionsByUser[userId] || actionsByUser[userName] || [];

    const totalActions = userActions.length;
    const activeActions = userActions.filter(a => a.statut === 'en_cours').length;
    const blockedActions = userActions.filter(a => a.statut === 'bloque').length;

    // Score de charge (0-100)
    // Base: 5 actions actives = 100% charge optimale
    const baseScore = (activeActions / 5) * 70;
    const blockedPenalty = blockedActions * 10;
    const pendingBonus = userActions.filter(a => a.statut === 'a_faire').length * 5;

    const workloadScore = Math.min(100, Math.max(0, baseScore + blockedPenalty + pendingBonus));

    let status: WorkloadAnalysis['status'];
    if (workloadScore < 30) status = 'sous-charge';
    else if (workloadScore <= 70) status = 'optimal';
    else if (workloadScore <= 90) status = 'surcharge';
    else status = 'critique';

    workloads.push({
      userId,
      userName,
      totalActions,
      activeActions,
      blockedActions,
      workloadScore,
      status
    });
  });

  return workloads.sort((a, b) => b.workloadScore - a.workloadScore);
}

// ============================================
// ANALYSE DES DÉPENDANCES ET CHEMIN CRITIQUE
// ============================================

interface CriticalPathResult {
  criticalActions: Action[];
  totalDuration: number;
  bottlenecks: Action[];
  dependencyIssues: string[];
}

function analyzeCriticalPath(ctx: ProjectContext): CriticalPathResult {
  const result: CriticalPathResult = {
    criticalActions: [],
    totalDuration: 0,
    bottlenecks: [],
    dependencyIssues: []
  };

  const actionsWithDates = ctx.actions.filter(a => a.date_debut && a.date_fin_prevue);

  if (actionsWithDates.length === 0) {
    result.dependencyIssues.push("Pas assez d'actions avec des dates pour calculer le chemin critique");
    return result;
  }

  // Identifier les actions sans marge
  const now = new Date();

  actionsWithDates.forEach(action => {
    const startDate = new Date(action.date_debut);
    const endDate = new Date(action.date_fin_prevue);
    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    // Actions critiques: en retard ou avec peu de marge
    const daysRemaining = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    const progressExpected = duration > 0 ? ((now.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100 : 0;
    const progressActual = action.avancement || 0;

    const isCritical =
      (daysRemaining < 7 && action.statut !== 'termine') ||
      (progressActual < progressExpected - 20) ||
      action.statut === 'bloque';

    if (isCritical) {
      result.criticalActions.push({
        ...action,
        daysRemaining: Math.round(daysRemaining),
        progressGap: Math.round(progressExpected - progressActual)
      });
    }
  });

  // Identifier les goulots d'étranglement (actions bloquées avec dépendances)
  const blockedActions = ctx.actions.filter(a => a.statut === 'bloque');
  blockedActions.forEach(action => {
    // Compter combien d'actions pourraient dépendre de celle-ci
    const potentialDependents = ctx.actions.filter(a =>
      a.date_debut && action.date_fin_prevue &&
      new Date(a.date_debut) > new Date(action.date_fin_prevue)
    );

    if (potentialDependents.length > 2) {
      result.bottlenecks.push({
        action,
        impactedCount: potentialDependents.length
      });
    }
  });

  // Calculer la durée totale
  if (actionsWithDates.length > 0) {
    const minStart = Math.min(...actionsWithDates.map(a => new Date(a.date_debut).getTime()));
    const maxEnd = Math.max(...actionsWithDates.map(a => new Date(a.date_fin_prevue).getTime()));
    result.totalDuration = Math.round((maxEnd - minStart) / (1000 * 60 * 60 * 24));
  }

  return result;
}

// ============================================
// SYSTÈME DE RECOMMANDATIONS INTELLIGENT
// ============================================

function generateSmartRecommendations(ctx: ProjectContext): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];

  // Analyse complète
  const evm = calculateEVM(ctx);
  const workloads = analyzeWorkload(ctx);
  const criticalPath = analyzeCriticalPath(ctx);
  analyzeTrends(ctx); // Called for side effects, result not needed directly

  // 1. Recommandations sur les actions bloquées
  const blockedActions = ctx.actions.filter(a => a.statut === 'bloque');
  if (blockedActions.length > 0) {
    recommendations.push({
      priority: 1,
      category: 'Actions',
      title: `Débloquer ${blockedActions.length} action(s) urgente(s)`,
      description: `Des actions sont bloquées et impactent potentiellement ${criticalPath.bottlenecks.length} autres tâches.`,
      impact: blockedActions.length > 3 ? 'critique' : 'eleve',
      effort: 'moyen',
      actions: [
        'Organiser une réunion de déblocage immédiate',
        'Identifier les responsables des blocages',
        'Escalader si nécessaire au niveau supérieur',
        ...blockedActions.slice(0, 3).map(a => `- "${a.titre}"`)
      ]
    });
  }

  // 2. Recommandations sur les risques critiques
  const criticalRisks = ctx.risques.filter(r => r.score >= 12);
  if (criticalRisks.length > 0) {
    recommendations.push({
      priority: 1,
      category: 'Risques',
      title: `Mitiger ${criticalRisks.length} risque(s) critique(s)`,
      description: 'Des risques avec un score >= 12 nécessitent une attention immédiate.',
      impact: 'critique',
      effort: 'eleve',
      actions: [
        'Convoquer un comité de gestion des risques',
        'Activer les plans de mitigation existants',
        'Allouer des ressources dédiées',
        ...criticalRisks.slice(0, 3).map(r => `- "${r.titre}" (Score: ${r.score})`)
      ]
    });
  }

  // 3. Recommandations EVM
  if (evm.cpi < 0.9) {
    recommendations.push({
      priority: 2,
      category: 'Budget',
      title: 'Améliorer l\'efficience des coûts',
      description: `CPI de ${evm.cpi.toFixed(2)} indique un dépassement budgétaire. EAC estimé: ${Math.round(evm.eac).toLocaleString('fr-FR')} FCFA.`,
      impact: 'eleve',
      effort: 'eleve',
      actions: [
        'Analyser les postes de dépense majeurs',
        'Identifier les économies possibles',
        'Renégocier les contrats si possible',
        'Réviser le budget si nécessaire'
      ]
    });
  }

  if (evm.spi < 0.9) {
    recommendations.push({
      priority: 2,
      category: 'Planning',
      title: 'Rattraper le retard de planning',
      description: `SPI de ${evm.spi.toFixed(2)} indique un retard significatif par rapport au planning prévu.`,
      impact: 'eleve',
      effort: 'moyen',
      actions: [
        'Revoir les priorités des actions',
        'Ajouter des ressources si disponibles',
        'Réduire le scope si acceptable',
        'Fast-tracking des activités parallélisables'
      ]
    });
  }

  // 4. Recommandations charge de travail
  const overloadedUsers = workloads.filter(w => w.status === 'critique' || w.status === 'surcharge');
  const underloadedUsers = workloads.filter(w => w.status === 'sous-charge');

  if (overloadedUsers.length > 0 && underloadedUsers.length > 0) {
    recommendations.push({
      priority: 3,
      category: 'Ressources',
      title: 'Rééquilibrer la charge de travail',
      description: `${overloadedUsers.length} membre(s) en surcharge, ${underloadedUsers.length} sous-utilisé(s).`,
      impact: 'moyen',
      effort: 'faible',
      actions: [
        'Réaffecter des tâches des personnes surchargées',
        ...overloadedUsers.slice(0, 2).map(u => `- ${u.userName}: ${u.activeActions} actions actives`),
        'Vers:',
        ...underloadedUsers.slice(0, 2).map(u => `- ${u.userName}: ${u.activeActions} actions actives`)
      ]
    });
  }

  // 5. Recommandations jalons en danger
  const jalonsEnDanger = ctx.jalons.filter(j => j.statut === 'en_danger' || j.statut === 'depasse');
  if (jalonsEnDanger.length > 0) {
    recommendations.push({
      priority: 2,
      category: 'Jalons',
      title: `Sauver ${jalonsEnDanger.length} jalon(s) en danger`,
      description: 'Des jalons importants risquent de ne pas être atteints.',
      impact: jalonsEnDanger.length > 2 ? 'critique' : 'eleve',
      effort: 'eleve',
      actions: [
        'Mobiliser les équipes sur les livrables clés',
        'Identifier les dépendances bloquantes',
        'Communiquer avec les parties prenantes',
        ...jalonsEnDanger.slice(0, 3).map(j => `- "${j.titre}" (${j.date_prevue})`)
      ]
    });
  }

  // 6. Recommandations alertes non traitées
  const alertesCritiques = ctx.alertes.filter(a => !a.traitee && (a.criticite === 'critical' || a.criticite === 'high'));
  if (alertesCritiques.length > 5) {
    recommendations.push({
      priority: 2,
      category: 'Alertes',
      title: `Traiter ${alertesCritiques.length} alertes importantes`,
      description: 'Trop d\'alertes critiques non traitées s\'accumulent.',
      impact: 'moyen',
      effort: 'faible',
      actions: [
        'Trier les alertes par priorité',
        'Assigner des responsables pour chaque alerte',
        'Définir des délais de résolution',
        'Mettre en place un suivi quotidien'
      ]
    });
  }

  // 7. Recommandation proactive si tout va bien
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 5,
      category: 'Général',
      title: 'Maintenir la dynamique positive',
      description: 'Le projet est en bonne santé. Continuez ainsi!',
      impact: 'faible',
      effort: 'faible',
      actions: [
        'Féliciter l\'équipe pour le travail accompli',
        'Documenter les bonnes pratiques',
        'Anticiper les prochaines échéances',
        'Préparer les rapports pour la direction'
      ]
    });
  }

  return recommendations.sort((a, b) => a.priority - b.priority);
}

// ============================================
// FONCTIONS D'ANALYSE SPÉCIALISÉES
// ============================================

function analyzeProblems(ctx: ProjectContext): string {
  const evm = calculateEVM(ctx);
  const criticalPath = analyzeCriticalPath(ctx);

  // En-tete
  let report = `# Analyse des Problemes\n\n`;
  report += `*Analyse approfondie generee le ${new Date().toLocaleString('fr-FR')}*\n\n`;

  // Score de sante global
  const healthScore = calculateHealthScore(ctx, evm);
  report += `## Score de Sante du Projet: ${healthScore}/100 ${getHealthLabel(healthScore)}\n\n`;

  // Actions bloquees
  const blocked = ctx.actions.filter(a => a.statut === 'bloque');
  if (blocked.length > 0) {
    report += `## Actions Bloquees (${blocked.length})\n\n`;
    report += `| Action | Responsable | Duree blocage |\n|--------|-------------|---------------|\n`;
    blocked.forEach(a => {
      const daysSinceUpdate = a.updated_at
        ? Math.floor((Date.now() - new Date(a.updated_at).getTime()) / (1000 * 60 * 60 * 24))
        : '?';
      report += `| ${a.titre.substring(0, 40)}... | ${a.responsable || 'N/A'} | ${daysSinceUpdate} jours |\n`;
    });
    report += '\n';
  }

  // Actions en retard
  const overdue = ctx.actions.filter(a =>
    a.date_fin_prevue &&
    new Date(a.date_fin_prevue) < new Date() &&
    a.statut !== 'termine' &&
    a.statut !== 'annule'
  );
  if (overdue.length > 0) {
    report += `## Actions en Retard (${overdue.length})\n\n`;
    overdue.slice(0, 8).forEach(a => {
      const days = Math.floor((Date.now() - new Date(a.date_fin_prevue).getTime()) / (1000 * 60 * 60 * 24));
      report += `- **${a.titre}** — ${days} jours de retard (${a.avancement || 0}% complété)\n`;
    });
    report += '\n';
  }

  // Goulots d'etranglement
  if (criticalPath.bottlenecks.length > 0) {
    report += `## Goulots d'Etranglement\n\n`;
    criticalPath.bottlenecks.forEach(b => {
      report += `- **${b.action.titre}** bloque potentiellement ${b.impactedCount} autres actions\n`;
    });
    report += '\n';
  }

  // Risques critiques
  const criticalRisks = ctx.risques.filter(r => r.score >= 12);
  if (criticalRisks.length > 0) {
    report += `## Risques Critiques (${criticalRisks.length})\n\n`;
    criticalRisks.forEach(r => {
      report += `### ${r.titre}\n`;
      report += `- Score: **${r.score}** (P:${r.probabilite} × I:${r.impact})\n`;
      report += `- Categorie: ${r.categorie || 'Non classe'}\n`;
      if (r.plan_mitigation) report += `- Plan: ${r.plan_mitigation}\n`;
      report += '\n';
    });
  }

  // Problemes budgetaires
  if (evm.cv < 0) {
    report += `## Depassement Budgetaire\n\n`;
    report += `- Ecart de cout: **${Math.abs(Math.round(evm.cv)).toLocaleString('fr-FR')} FCFA**\n`;
    report += `- CPI: ${evm.cpi.toFixed(2)} (< 1 = depassement)\n`;
    report += `- Estimation finale: ${Math.round(evm.eac).toLocaleString('fr-FR')} FCFA\n\n`;
  }

  // Problemes de planning
  if (evm.spi < 0.9) {
    report += `## Retard de Planning\n\n`;
    report += `- SPI: ${evm.spi.toFixed(2)} (< 1 = en retard)\n`;
    report += `- Variance: ${Math.round(evm.sv).toLocaleString('fr-FR')} FCFA d'ecart\n\n`;
  }

  // Alertes critiques non traitees
  const criticalAlerts = ctx.alertes.filter(a => !a.traitee && a.criticite === 'critical');
  if (criticalAlerts.length > 0) {
    report += `## Alertes Critiques Non Traitees (${criticalAlerts.length})\n\n`;
    criticalAlerts.slice(0, 5).forEach(a => {
      report += `- ${a.titre}\n`;
    });
    report += '\n';
  }

  if (blocked.length === 0 && overdue.length === 0 && criticalRisks.length === 0 && evm.cpi >= 1 && evm.spi >= 0.9) {
    report += `## Aucun Probleme Majeur\n\nLe projet est en bonne sante!\n`;
  }

  return report;
}

function analyzeRisks(ctx: ProjectContext): string {
  if (ctx.risques.length === 0) {
    return "# Analyse des Risques\n\nAucun risque enregistre dans le systeme. Pensez a identifier les risques potentiels!";
  }

  const critical = ctx.risques.filter(r => r.score >= 12);
  const high = ctx.risques.filter(r => r.score >= 8 && r.score < 12);
  const medium = ctx.risques.filter(r => r.score >= 4 && r.score < 8);
  const low = ctx.risques.filter(r => r.score < 4);

  let report = `# Analyse Complete des Risques\n\n`;
  report += `*${ctx.risques.length} risques analyses le ${new Date().toLocaleString('fr-FR')}*\n\n`;

  // Matrice des risques
  report += `## Repartition\n\n`;
  report += `| Niveau | Nombre | % | Indicateur |\n|--------|--------|---|------------|\n`;
  report += `| Critique (>=12) | ${critical.length} | ${Math.round(critical.length / ctx.risques.length * 100)}% | ${critical.length > 0 ? 'ACTION URGENTE' : 'OK'} |\n`;
  report += `| Eleve (8-11) | ${high.length} | ${Math.round(high.length / ctx.risques.length * 100)}% | ${high.length > 2 ? 'A surveiller' : 'OK'} |\n`;
  report += `| Modere (4-7) | ${medium.length} | ${Math.round(medium.length / ctx.risques.length * 100)}% | OK |\n`;
  report += `| Faible (<4) | ${low.length} | ${Math.round(low.length / ctx.risques.length * 100)}% | OK |\n\n`;

  // Score de risque global
  const avgScore = ctx.risques.reduce((sum, r) => sum + r.score, 0) / ctx.risques.length;
  report += `**Score de risque moyen:** ${avgScore.toFixed(1)}/25\n\n`;

  // Detail des risques critiques
  if (critical.length > 0) {
    report += `## Risques Critiques - Action Immediate Requise\n\n`;
    critical.forEach((r, i) => {
      report += `### ${i + 1}. ${r.titre}\n`;
      report += `- **Score:** ${r.score} (Probabilite: ${r.probabilite} x Impact: ${r.impact})\n`;
      report += `- **Categorie:** ${r.categorie || 'Non classe'}\n`;
      report += `- **Proprietaire:** ${r.proprietaire || 'Non assigne'}\n`;
      if (r.description) report += `- **Description:** ${r.description}\n`;
      if (r.plan_mitigation) report += `- **Plan de mitigation:** ${r.plan_mitigation}\n`;
      if (r.plan_contingence) report += `- **Plan de contingence:** ${r.plan_contingence}\n`;
      report += '\n';
    });
  }

  // Analyse par categorie
  const byCategory: Record<string, Risque[]> = {};
  ctx.risques.forEach(r => {
    const cat = r.categorie || 'Non classe';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(r);
  });

  report += `## Repartition par Categorie\n\n`;
  Object.entries(byCategory)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([cat, risks]) => {
      const avgCatScore = risks.reduce((s, r) => s + r.score, 0) / risks.length;
      report += `- **${cat}:** ${risks.length} risques (score moyen: ${avgCatScore.toFixed(1)})\n`;
    });

  return report;
}

function generateReportSummary(ctx: ProjectContext): string {
  const evm = calculateEVM(ctx);
  const trends = analyzeTrends(ctx);
  const recommendations = generateSmartRecommendations(ctx);

  const completedActions = ctx.actions.filter(a => a.statut === 'termine').length;
  const completionRate = ctx.actions.length > 0 ? Math.round(completedActions / ctx.actions.length * 100) : 0;
  const completedJalons = ctx.jalons.filter(j => j.statut === 'atteint').length;
  const jalonRate = ctx.jalons.length > 0 ? Math.round(completedJalons / ctx.jalons.length * 100) : 0;

  let report = `# Rapport de Synthese - COSMOS ANGRE\n\n`;
  report += `**Date:** ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}\n\n`;

  // Score de sante
  const healthScore = calculateHealthScore(ctx, evm);
  report += `## Score de Sante Global: ${healthScore}/100 ${getHealthLabel(healthScore)}\n\n`;

  // KPIs principaux
  report += `## Indicateurs Cles\n\n`;
  report += `| Indicateur | Valeur | Tendance | Statut |\n|------------|--------|----------|--------|\n`;
  report += `| Avancement Actions | ${completionRate}% (${completedActions}/${ctx.actions.length}) | ${getTrendArrow(trends.actions.direction)} | ${getStatusLabel(completionRate, 70, 40)} |\n`;
  report += `| Jalons Atteints | ${jalonRate}% (${completedJalons}/${ctx.jalons.length}) | - | ${getStatusLabel(jalonRate, 70, 40)} |\n`;
  report += `| SPI (Performance Planning) | ${evm.spi.toFixed(2)} | - | ${evm.spi >= 1 ? 'OK' : evm.spi >= 0.9 ? 'ATTENTION' : 'CRITIQUE'} |\n`;
  report += `| CPI (Performance Couts) | ${evm.cpi.toFixed(2)} | ${getTrendArrow(trends.budget.direction === 'up' ? 'down' : 'up')} | ${evm.cpi >= 1 ? 'OK' : evm.cpi >= 0.9 ? 'ATTENTION' : 'CRITIQUE'} |\n`;
  report += `| Risques Critiques | ${ctx.risques.filter(r => r.score >= 12).length} | ${getTrendArrow(trends.risques.direction)} | ${ctx.risques.filter(r => r.score >= 12).length === 0 ? 'OK' : 'CRITIQUE'} |\n`;
  report += `| Alertes Actives | ${ctx.alertes.filter(a => !a.traitee).length} | - | ${ctx.alertes.filter(a => !a.traitee).length < 5 ? 'OK' : 'ATTENTION'} |\n\n`;

  // Budget
  report += `## Situation Budgetaire\n\n`;
  report += `- **Prevu:** ${(ctx.budget?.prevu || 0).toLocaleString('fr-FR')} FCFA\n`;
  report += `- **Realise:** ${(ctx.budget?.realise || 0).toLocaleString('fr-FR')} FCFA (${Math.round((ctx.budget?.realise || 0) / (ctx.budget?.prevu || 1) * 100)}%)\n`;
  report += `- **Estimation finale (EAC):** ${Math.round(evm.eac).toLocaleString('fr-FR')} FCFA\n`;
  report += `- **Ecart prevu:** ${Math.round(evm.vac).toLocaleString('fr-FR')} FCFA ${evm.vac >= 0 ? '(economie)' : '(depassement)'}\n\n`;

  // Points d'attention
  report += `## Points d'Attention\n\n`;
  const issues: string[] = [];
  if (ctx.actions.filter(a => a.statut === 'bloque').length > 0) {
    issues.push(`- [BLOQUE] ${ctx.actions.filter(a => a.statut === 'bloque').length} action(s) bloquee(s)`);
  }
  if (ctx.jalons.filter(j => j.statut === 'en_danger').length > 0) {
    issues.push(`- [DANGER] ${ctx.jalons.filter(j => j.statut === 'en_danger').length} jalon(s) en danger`);
  }
  if (ctx.risques.filter(r => r.score >= 12).length > 0) {
    issues.push(`- [CRITIQUE] ${ctx.risques.filter(r => r.score >= 12).length} risque(s) critique(s)`);
  }
  if (evm.spi < 0.9) {
    issues.push(`- [PLANNING] Retard de planning significatif (SPI: ${evm.spi.toFixed(2)})`);
  }
  if (evm.cpi < 0.9) {
    issues.push(`- [BUDGET] Depassement budgetaire (CPI: ${evm.cpi.toFixed(2)})`);
  }
  report += issues.length > 0 ? issues.join('\n') : '- Aucun point d\'attention majeur';
  report += '\n\n';

  // Top 3 recommandations
  report += `## Recommandations Prioritaires\n\n`;
  recommendations.slice(0, 3).forEach((rec, i) => {
    report += `${i + 1}. **${rec.title}** (${rec.category})\n`;
    report += `   - Impact: ${rec.impact} | Effort: ${rec.effort}\n`;
  });

  return report + `\n---\n*Rapport genere par Proph3t IA - ${new Date().toLocaleString('fr-FR')}*`;
}

function analyzeBudget(ctx: ProjectContext): string {
  const evm = calculateEVM(ctx);

  if (!ctx.budget || ctx.budget.prevu === 0) {
    return "# Analyse Budgetaire\n\nAucune donnee budgetaire disponible.";
  }

  const tauxEngagement = Math.round((ctx.budget.engage || 0) / ctx.budget.prevu * 100);
  const tauxRealisation = Math.round(ctx.budget.realise / ctx.budget.prevu * 100);
  const ecart = ctx.budget.prevu - ctx.budget.realise;

  let report = `# Analyse Budgetaire Complete\n\n`;
  report += `*Analyse EVM generee le ${new Date().toLocaleString('fr-FR')}*\n\n`;

  // Situation globale
  report += `## Situation Globale\n\n`;
  report += `| Poste | Montant (FCFA) | Taux |\n|-------|----------------|------|\n`;
  report += `| Budget Prévu | ${ctx.budget.prevu.toLocaleString('fr-FR')} | 100% |\n`;
  report += `| Engagé | ${(ctx.budget.engage || 0).toLocaleString('fr-FR')} | ${tauxEngagement}% |\n`;
  report += `| Realise | ${ctx.budget.realise.toLocaleString('fr-FR')} | ${tauxRealisation}% |\n`;
  report += `| Disponible | ${ecart.toLocaleString('fr-FR')} | ${ecart >= 0 ? `${Math.round(ecart / ctx.budget.prevu * 100)}%` : 'DEPASSE'} |\n\n`;

  // Indicateurs EVM
  report += `## Indicateurs de Performance (EVM)\n\n`;
  report += `| Indicateur | Valeur | Interpretation |\n|------------|--------|----------------|\n`;
  report += `| PV (Valeur Planifiee) | ${Math.round(evm.pv).toLocaleString('fr-FR')} | Travail prevu a date |\n`;
  report += `| EV (Valeur Acquise) | ${Math.round(evm.ev).toLocaleString('fr-FR')} | Travail reellement accompli |\n`;
  report += `| AC (Cout Reel) | ${Math.round(evm.ac).toLocaleString('fr-FR')} | Depenses effectives |\n`;
  report += `| SV (Ecart Planning) | ${Math.round(evm.sv).toLocaleString('fr-FR')} | ${evm.sv >= 0 ? 'En avance' : 'En retard'} |\n`;
  report += `| CV (Ecart Cout) | ${Math.round(evm.cv).toLocaleString('fr-FR')} | ${evm.cv >= 0 ? 'Sous budget' : 'Depassement'} |\n`;
  report += `| SPI | ${evm.spi.toFixed(2)} | ${evm.spi >= 1 ? 'Performant' : evm.spi >= 0.9 ? 'Acceptable' : 'Critique'} |\n`;
  report += `| CPI | ${evm.cpi.toFixed(2)} | ${evm.cpi >= 1 ? 'Efficient' : evm.cpi >= 0.9 ? 'Acceptable' : 'Critique'} |\n\n`;

  // Previsions
  report += `## Previsions\n\n`;
  report += `| Prevision | Montant | Statut |\n|-----------|---------|--------|\n`;
  report += `| EAC (Estimation Finale) | ${Math.round(evm.eac).toLocaleString('fr-FR')} FCFA | ${evm.eac <= ctx.budget.prevu ? 'OK' : 'CRITIQUE'} |\n`;
  report += `| ETC (Reste a Depenser) | ${Math.round(evm.etc).toLocaleString('fr-FR')} FCFA | - |\n`;
  report += `| VAC (Ecart Final Prevu) | ${Math.round(evm.vac).toLocaleString('fr-FR')} FCFA | ${evm.vac >= 0 ? 'Economie' : 'Depassement'} |\n`;
  report += `| TCPI (Index Performance Requis) | ${evm.tcpi.toFixed(2)} | ${evm.tcpi <= 1.1 ? 'Atteignable' : 'Difficile'} |\n\n`;

  // Evaluation
  report += `## Evaluation\n\n`;
  if (evm.cpi >= 1 && evm.spi >= 1) {
    report += `**Excellent** - Le projet est sous budget et dans les temps.\n`;
  } else if (evm.cpi >= 0.9 && evm.spi >= 0.9) {
    report += `**Attention** - Legeres derives detectees, surveillance recommandee.\n`;
  } else {
    report += `**Critique** - Des actions correctives urgentes sont necessaires.\n\n`;
    report += `**Recommandations:**\n`;
    if (evm.cpi < 0.9) {
      report += `- Reduire les couts de ${Math.round((1 - evm.cpi) * 100)}%\n`;
      report += `- Identifier les postes de depense excessifs\n`;
    }
    if (evm.spi < 0.9) {
      report += `- Accelerer les travaux de ${Math.round((1 - evm.spi) * 100)}%\n`;
      report += `- Ajouter des ressources ou reduire le scope\n`;
    }
  }

  return report;
}

function analyzeActions(ctx: ProjectContext): string {
  const workloads = analyzeWorkload(ctx);
  const criticalPath = analyzeCriticalPath(ctx);

  const byStatus: Record<string, number> = {};
  ctx.actions.forEach(a => {
    byStatus[a.statut] = (byStatus[a.statut] || 0) + 1;
  });

  let report = `# Analyse des Actions\n\n`;
  report += `*${ctx.actions.length} actions analysees le ${new Date().toLocaleString('fr-FR')}*\n\n`;

  // Vue d'ensemble
  report += `## Repartition par Statut\n\n`;
  report += `| Statut | Nombre | % | Barre |\n|--------|--------|---|-------|\n`;
  const statusOrder = ['termine', 'en_cours', 'a_faire', 'bloque', 'annule'];
  const statusLabels: Record<string, string> = {
    termine: 'Termine',
    en_cours: 'En cours',
    a_faire: 'A faire',
    bloque: 'Bloque',
    annule: 'Annule'
  };

  statusOrder.forEach(status => {
    const count = byStatus[status] || 0;
    const pct = ctx.actions.length > 0 ? Math.round(count / ctx.actions.length * 100) : 0;
    const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
    report += `| ${statusLabels[status] || status} | ${count} | ${pct}% | ${bar} |\n`;
  });
  report += '\n';

  // Avancement moyen
  const avgProgress = ctx.actions.length > 0
    ? Math.round(ctx.actions.reduce((sum, a) => sum + (a.avancement || 0), 0) / ctx.actions.length)
    : 0;
  report += `**Avancement moyen global:** ${avgProgress}%\n\n`;

  // Actions critiques
  if (criticalPath.criticalActions.length > 0) {
    report += `## Actions Critiques (${criticalPath.criticalActions.length})\n\n`;
    criticalPath.criticalActions.slice(0, 5).forEach(a => {
      report += `- **${a.titre}**\n`;
      report += `  - Avancement: ${a.avancement || 0}% | Écart: ${a.progressGap || 0}% de retard\n`;
      report += `  - Jours restants: ${a.daysRemaining}\n`;
    });
    report += '\n';
  }

  // Charge par personne
  if (workloads.length > 0) {
    report += `## Charge de Travail\n\n`;
    report += `| Membre | Actions | Actives | Charge | Statut |\n|--------|---------|---------|--------|--------|\n`;
    workloads.forEach(w => {
      const statusLabel = w.status === 'optimal' ? '[OK]' : w.status === 'sous-charge' ? '[SOUS-CHARGE]' : w.status === 'surcharge' ? '[SURCHARGE]' : '[CRITIQUE]';
      report += `| ${w.userName} | ${w.totalActions} | ${w.activeActions} | ${w.workloadScore}% | ${statusLabel} ${w.status} |\n`;
    });
  }

  return report;
}

function analyzeJalons(ctx: ProjectContext): string {
  const now = new Date();

  let report = `# Analyse des Jalons\n\n`;
  report += `*${ctx.jalons.length} jalons analyses le ${new Date().toLocaleString('fr-FR')}*\n\n`;

  // Repartition par statut
  const byStatus: Record<string, number> = {};
  ctx.jalons.forEach(j => {
    byStatus[j.statut] = (byStatus[j.statut] || 0) + 1;
  });

  report += `## Repartition\n\n`;
  const statusLabels: Record<string, string> = {
    atteint: 'Atteint',
    a_venir: 'A venir',
    en_danger: 'En danger',
    depasse: 'Depasse'
  };

  Object.entries(statusLabels).forEach(([status, label]) => {
    const count = byStatus[status] || 0;
    const pct = ctx.jalons.length > 0 ? Math.round(count / ctx.jalons.length * 100) : 0;
    report += `- ${label}: **${count}** (${pct}%)\n`;
  });
  report += '\n';

  // Prochains jalons
  const upcoming = ctx.jalons
    .filter(j => j.statut === 'a_venir' && j.date_prevue)
    .sort((a, b) => new Date(a.date_prevue).getTime() - new Date(b.date_prevue).getTime())
    .slice(0, 5);

  if (upcoming.length > 0) {
    report += `## Prochains Jalons\n\n`;
    report += `| Jalon | Date Prevue | Jours Restants | Statut |\n|-------|-------------|----------------|--------|\n`;
    upcoming.forEach(j => {
      const days = Math.ceil((new Date(j.date_prevue).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const statusLabel = days > 14 ? 'OK' : days > 7 ? 'ATTENTION' : 'CRITIQUE';
      report += `| ${j.titre} | ${j.date_prevue} | ${days} | ${statusLabel} |\n`;
    });
    report += '\n';
  }

  // Jalons en danger
  const atRisk = ctx.jalons.filter(j => j.statut === 'en_danger' || j.statut === 'depasse');
  if (atRisk.length > 0) {
    report += `## Jalons a Risque\n\n`;
    atRisk.forEach(j => {
      report += `### ${j.titre}\n`;
      report += `- Date prévue: ${j.date_prevue}\n`;
      report += `- Statut: ${statusLabels[j.statut] || j.statut}\n`;
      if (j.livrables) report += `- Livrables: ${j.livrables}\n`;
      report += '\n';
    });
  }

  return report;
}

function analyzeAlertes(ctx: ProjectContext): string {
  const actives = ctx.alertes.filter(a => !a.traitee);

  let report = `# Analyse des Alertes\n\n`;
  report += `*Total: ${ctx.alertes.length} alertes (${actives.length} actives)*\n\n`;

  if (actives.length === 0) {
    report += `**Toutes les alertes ont ete traitees!**\n`;
    return report;
  }

  // Par criticite
  const byCriticite: Record<string, Alerte[]> = {};
  actives.forEach(a => {
    const crit = a.criticite || 'unknown';
    if (!byCriticite[crit]) byCriticite[crit] = [];
    byCriticite[crit].push(a);
  });

  const critOrder = ['critical', 'high', 'medium', 'low'];
  const critLabels: Record<string, string> = {
    critical: '[CRITIQUE]',
    high: '[Elevee]',
    medium: '[Moderee]',
    low: '[Faible]'
  };

  report += `## Par Criticite\n\n`;
  critOrder.forEach(crit => {
    if (byCriticite[crit]?.length > 0) {
      report += `### ${critLabels[crit]} (${byCriticite[crit].length})\n\n`;
      byCriticite[crit].slice(0, 5).forEach(a => {
        report += `- **${a.titre}**\n`;
        if (a.description) report += `  ${a.description.substring(0, 100)}...\n`;
      });
      report += '\n';
    }
  });

  return report;
}

function analyzeTeam(ctx: ProjectContext): string {
  const workloads = analyzeWorkload(ctx);

  let report = `# Analyse de l'Equipe\n\n`;
  report += `**Membres:** ${ctx.users.length} | **Equipes:** ${ctx.teams.length}\n\n`;

  // Charge de travail
  if (workloads.length > 0) {
    report += `## Repartition de la Charge\n\n`;
    report += `| Membre | Actions | En cours | Bloquees | Charge | Statut |\n|--------|---------|----------|----------|--------|--------|\n`;
    workloads.forEach(w => {
      const statusLabel = w.status === 'optimal' ? '[OK]' : w.status === 'sous-charge' ? '[SOUS-CHARGE]' : w.status === 'surcharge' ? '[SURCHARGE]' : '[CRITIQUE]';
      report += `| ${w.userName} | ${w.totalActions} | ${w.activeActions} | ${w.blockedActions} | ${w.workloadScore}% | ${statusLabel} |\n`;
    });
    report += '\n';

    // Recommandations
    const overloaded = workloads.filter(w => w.status === 'surcharge' || w.status === 'critique');
    const underloaded = workloads.filter(w => w.status === 'sous-charge');

    if (overloaded.length > 0 || underloaded.length > 0) {
      report += `## Recommandations\n\n`;
      if (overloaded.length > 0) {
        report += `**Membres surcharges a soulager:**\n`;
        overloaded.forEach(w => report += `- ${w.userName} (${w.workloadScore}%)\n`);
      }
      if (underloaded.length > 0) {
        report += `\n**Membres disponibles:**\n`;
        underloaded.forEach(w => report += `- ${w.userName} (${w.workloadScore}%)\n`);
      }
    }
  }

  // Liste des equipes
  if (ctx.teams.length > 0) {
    report += `\n## Equipes\n\n`;
    ctx.teams.forEach(t => {
      report += `### ${t.nom}\n`;
      if (t.description) report += `${t.description}\n`;
      report += '\n';
    });
  }

  return report;
}

function generateRecommendations(ctx: ProjectContext): string {
  const recommendations = generateSmartRecommendations(ctx);

  let report = `# Recommandations Intelligentes\n\n`;
  report += `*${recommendations.length} recommandations generees le ${new Date().toLocaleString('fr-FR')}*\n\n`;

  const priorityLabels: Record<number, string> = {
    1: '[URGENT]',
    2: '[Important]',
    3: '[Recommande]',
    4: '[Optionnel]',
    5: '[Maintenance]'
  };

  recommendations.forEach((rec, i) => {
    report += `## ${i + 1}. ${rec.title}\n\n`;
    report += `**Priorité:** ${priorityLabels[rec.priority] || rec.priority} | `;
    report += `**Categorie:** ${rec.category} | `;
    report += `**Impact:** ${rec.impact} | `;
    report += `**Effort:** ${rec.effort}\n\n`;
    report += `${rec.description}\n\n`;
    report += `**Actions suggerees:**\n`;
    rec.actions.forEach(action => {
      report += `${action}\n`;
    });
    report += '\n---\n\n';
  });

  return report;
}

function analyzeEVM(ctx: ProjectContext): string {
  const evm = calculateEVM(ctx);

  let report = `# Analyse EVM (Earned Value Management)\n\n`;
  report += `*Analyse de la valeur acquise - ${new Date().toLocaleString('fr-FR')}*\n\n`;

  // Graphique ASCII des performances
  report += `## Performance Globale\n\n`;
  report += "```\n";
  report += `SPI: ${'█'.repeat(Math.round(Math.min(evm.spi, 1.5) * 10))}${'░'.repeat(15 - Math.round(Math.min(evm.spi, 1.5) * 10))} ${evm.spi.toFixed(2)}\n`;
  report += `CPI: ${'█'.repeat(Math.round(Math.min(evm.cpi, 1.5) * 10))}${'░'.repeat(15 - Math.round(Math.min(evm.cpi, 1.5) * 10))} ${evm.cpi.toFixed(2)}\n`;
  report += "```\n\n";

  // Tableau des valeurs
  report += `## Indicateurs Detailles\n\n`;
  report += `| Indicateur | Valeur | Formule | Interpretation |\n|------------|--------|---------|----------------|\n`;
  report += `| PV | ${Math.round(evm.pv).toLocaleString('fr-FR')} | Budget x Temps ecoule | Valeur planifiee |\n`;
  report += `| EV | ${Math.round(evm.ev).toLocaleString('fr-FR')} | Budget x % Accompli | Valeur acquise |\n`;
  report += `| AC | ${Math.round(evm.ac).toLocaleString('fr-FR')} | Depenses reelles | Cout actuel |\n`;
  report += `| SV | ${Math.round(evm.sv).toLocaleString('fr-FR')} | EV - PV | ${evm.sv >= 0 ? 'En avance' : 'En retard'} |\n`;
  report += `| CV | ${Math.round(evm.cv).toLocaleString('fr-FR')} | EV - AC | ${evm.cv >= 0 ? 'Economie' : 'Depassement'} |\n`;
  report += `| SPI | ${evm.spi.toFixed(2)} | EV / PV | ${evm.spi >= 1 ? 'Efficace' : 'Sous-performant'} |\n`;
  report += `| CPI | ${evm.cpi.toFixed(2)} | EV / AC | ${evm.cpi >= 1 ? 'Efficient' : 'Sous-performant'} |\n`;
  report += `| EAC | ${Math.round(evm.eac).toLocaleString('fr-FR')} | BAC / CPI | Estimation finale |\n`;
  report += `| ETC | ${Math.round(evm.etc).toLocaleString('fr-FR')} | EAC - AC | Reste a depenser |\n`;
  report += `| VAC | ${Math.round(evm.vac).toLocaleString('fr-FR')} | BAC - EAC | Ecart final prevu |\n`;
  report += `| TCPI | ${evm.tcpi.toFixed(2)} | (BAC-EV)/(BAC-AC) | Performance requise |\n\n`;

  // Diagnostic
  report += `## Diagnostic\n\n`;
  if (evm.spi >= 1 && evm.cpi >= 1) {
    report += `**EXCELLENT** - Le projet performe au-dessus des attentes.\n`;
  } else if (evm.spi >= 0.9 && evm.cpi >= 0.9) {
    report += `**ACCEPTABLE** - Legeres derives a surveiller.\n`;
  } else if (evm.spi >= 0.8 || evm.cpi >= 0.8) {
    report += `**PREOCCUPANT** - Actions correctives necessaires.\n`;
  } else {
    report += `**CRITIQUE** - Intervention urgente requise.\n`;
  }

  return report;
}

function analyzeWorkloadDetailed(ctx: ProjectContext): string {
  const workloads = analyzeWorkload(ctx);

  let report = `# Analyse de la Charge de Travail\n\n`;
  report += `*Analyse detaillee - ${new Date().toLocaleString('fr-FR')}*\n\n`;

  if (workloads.length === 0) {
    return report + "Aucune donnée de charge disponible.";
  }

  // Stats globales
  const avgLoad = workloads.reduce((s, w) => s + w.workloadScore, 0) / workloads.length;
  report += `## Vue d'ensemble\n\n`;
  report += `- **Charge moyenne:** ${Math.round(avgLoad)}%\n`;
  report += `- **Optimal (40-70%):** ${workloads.filter(w => w.status === 'optimal').length} membres\n`;
  report += `- **Sous-charge (<40%):** ${workloads.filter(w => w.status === 'sous-charge').length} membres\n`;
  report += `- **Surcharge (>70%):** ${workloads.filter(w => w.status === 'surcharge').length} membres\n`;
  report += `- **Critique (>90%):** ${workloads.filter(w => w.status === 'critique').length} membres\n\n`;

  // Detail par membre
  report += `## Detail par Membre\n\n`;
  workloads.forEach(w => {
    const bar = '|'.repeat(Math.round(w.workloadScore / 5)) + '.'.repeat(20 - Math.round(w.workloadScore / 5));
    const statusLabel = w.status === 'optimal' ? '[OK]' : w.status === 'sous-charge' ? '[SOUS-CHARGE]' : w.status === 'surcharge' ? '[SURCHARGE]' : '[CRITIQUE]';

    report += `### ${w.userName} ${statusLabel}\n`;
    report += `[${bar}] ${w.workloadScore}%\n`;
    report += `- Actions totales: ${w.totalActions}\n`;
    report += `- En cours: ${w.activeActions}\n`;
    report += `- Bloquees: ${w.blockedActions}\n\n`;
  });

  return report;
}

function generateProjectOverview(ctx: ProjectContext): string {
  const evm = calculateEVM(ctx);
  const healthScore = calculateHealthScore(ctx, evm);

  let report = `# Bienvenue dans Proph3t\n\n`;
  report += `Je suis votre assistant IA pour le projet **COSMOS ANGRE**.\n\n`;

  report += `## Etat du Projet\n\n`;
  report += `**Score de Sante:** ${healthScore}/100 ${getHealthLabel(healthScore)}\n\n`;

  report += `| Metrique | Valeur |\n|----------|--------|\n`;
  report += `| Actions | ${ctx.actions.length} (${ctx.actions.filter(a => a.statut === 'termine').length} terminees) |\n`;
  report += `| Jalons | ${ctx.jalons.length} (${ctx.jalons.filter(j => j.statut === 'atteint').length} atteints) |\n`;
  report += `| Risques | ${ctx.risques.length} (${ctx.risques.filter(r => r.score >= 12).length} critiques) |\n`;
  report += `| Alertes | ${ctx.alertes.filter(a => !a.traitee).length} actives |\n`;
  report += `| Equipe | ${ctx.users.length} membres |\n\n`;

  report += `## Ce que je peux faire\n\n`;
  report += `| Commande | Description |\n|----------|-------------|\n`;
  report += `| "problemes" | Identifier les blocages et retards |\n`;
  report += `| "risques" | Analyser les risques du projet |\n`;
  report += `| "rapport" ou "synthese" | Generer un rapport complet |\n`;
  report += `| "budget" | Analyse budgetaire et EVM |\n`;
  report += `| "actions" | Etat des actions en cours |\n`;
  report += `| "jalons" | Suivi des echeances |\n`;
  report += `| "equipe" ou "charge" | Analyse de la charge de travail |\n`;
  report += `| "recommandations" | Conseils prioritaires |\n`;
  report += `| "EVM" | Indicateurs de valeur acquise |\n`;
  report += `| "previsions" | Tendances et projections |\n\n`;

  report += `*Comment puis-je vous aider?*`;

  return report;
}

function analyzePrevisions(ctx: ProjectContext): string {
  const evm = calculateEVM(ctx);
  const trends = analyzeTrends(ctx);

  let report = `# Previsions et Tendances\n\n`;
  report += `*Analyse predictive - ${new Date().toLocaleString('fr-FR')}*\n\n`;

  // Tendances actuelles
  report += `## Tendances Actuelles\n\n`;
  report += `| Domaine | Direction | Actuel | Prevision |\n|---------|-----------|--------|----------|\n`;
  report += `| Actions | ${getTrendArrow(trends.actions.direction)} | ${Math.round(trends.actions.percentage)}% | ${Math.round(trends.actions.forecast)}% |\n`;
  report += `| Risques | ${getTrendArrow(trends.risques.direction)} | ${Math.round(trends.risques.percentage)}% critiques | ${Math.round(trends.risques.forecast)}% |\n`;
  report += `| Budget | ${getTrendArrow(trends.budget.direction)} | ${Math.round(trends.budget.percentage)}% consomme | ${Math.round(trends.budget.forecast)}% |\n\n`;

  // Previsions budgetaires
  report += `## Previsions Budgetaires\n\n`;
  report += `- **Budget initial:** ${(ctx.budget?.prevu || 0).toLocaleString('fr-FR')} FCFA\n`;
  report += `- **Estimation finale (EAC):** ${Math.round(evm.eac).toLocaleString('fr-FR')} FCFA\n`;
  report += `- **Ecart prevu:** ${Math.round(evm.vac).toLocaleString('fr-FR')} FCFA\n`;
  report += `- **Performance requise (TCPI):** ${evm.tcpi.toFixed(2)}\n\n`;

  // Prevision de fin de projet
  const completionRate = ctx.actions.length > 0
    ? ctx.actions.filter(a => a.statut === 'termine').length / ctx.actions.length
    : 0;

  report += `## Estimation de Fin\n\n`;
  if (evm.spi > 0 && completionRate < 1) {
    const remainingWork = 1 - completionRate;
    const adjustedRemaining = remainingWork / evm.spi;
    report += `Au rythme actuel (SPI: ${evm.spi.toFixed(2)}), le projet necessite **${Math.round(adjustedRemaining * 100)}%** du temps restant prevu.\n\n`;

    if (evm.spi < 1) {
      report += `[ATTENTION] Le projet est en retard. Pour terminer dans les delais:\n`;
      report += `- Augmenter la velocite de ${Math.round((1 - evm.spi) * 100)}%\n`;
      report += `- Ou ajouter des ressources\n`;
      report += `- Ou reduire le scope\n`;
    } else {
      report += `Le projet est en avance sur le planning.\n`;
    }
  }

  return report;
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function calculateHealthScore(ctx: ProjectContext, evm: EVMMetrics): number {
  let score = 100;

  // Pénalités
  const blockedRatio = ctx.actions.filter(a => a.statut === 'bloque').length / (ctx.actions.length || 1);
  score -= blockedRatio * 30;

  const criticalRisksRatio = ctx.risques.filter(r => r.score >= 12).length / (ctx.risques.length || 1);
  score -= criticalRisksRatio * 20;

  if (evm.spi < 1) score -= (1 - evm.spi) * 20;
  if (evm.cpi < 1) score -= (1 - evm.cpi) * 20;

  const untreatedAlertsRatio = ctx.alertes.filter(a => !a.traitee).length / (ctx.alertes.length || 1);
  score -= untreatedAlertsRatio * 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getHealthLabel(score: number): string {
  if (score >= 80) return '[VERT]';
  if (score >= 60) return '[JAUNE]';
  if (score >= 40) return '[ORANGE]';
  return '[ROUGE]';
}

function getStatusLabel(value: number, goodThreshold: number, warnThreshold: number): string {
  if (value >= goodThreshold) return 'OK';
  if (value >= warnThreshold) return 'ATTENTION';
  return 'CRITIQUE';
}

function getTrendArrow(direction: string): string {
  switch (direction) {
    case 'up': return '[HAUSSE]';
    case 'down': return '[BAISSE]';
    default: return '[STABLE]';
  }
}

// ============================================
// ALGORITHME LOCAL PRINCIPAL
// ============================================

function localAnalysis(userMessage: string, context: ProjectContext, history: AIMessage[] = []): string {
  const intentResult = detectIntent(userMessage, history);

  // Dispatch selon l'intention détectée
  switch (intentResult.intent) {
    case 'probleme':
      return analyzeProblems(context);

    case 'risque':
      return analyzeRisks(context);

    case 'rapport':
      return generateReportSummary(context);

    case 'budget':
      return analyzeBudget(context);

    case 'action':
      return analyzeActions(context);

    case 'jalon':
      return analyzeJalons(context);

    case 'alerte':
      return analyzeAlertes(context);

    case 'equipe':
      return analyzeTeam(context);

    case 'recommandation':
      return generateRecommendations(context);

    case 'statut':
      return generateReportSummary(context);

    case 'prevision':
      return analyzePrevisions(context);

    case 'evm':
      return analyzeEVM(context);

    case 'charge':
      return analyzeWorkloadDetailed(context);

    case 'historique':
      return `# Historique\n\n*Fonctionnalité en cours de développement*\n\nL'historique complet sera bientôt disponible.`;

    case 'aide':
      return generateProjectOverview(context);

    default:
      return generateProjectOverview(context);
  }
}

// ============================================
// SYSTEM PROMPT BUILDER
// ============================================

function buildSystemPrompt(context: ProjectContext): string {
  const evm = calculateEVM(context);
  const actionsEnCours = context.actions.filter(a => a.statut === 'en_cours').length;
  const actionsBloquees = context.actions.filter(a => a.statut === 'bloque').length;
  const risquesCritiques = context.risques.filter(r => r.score >= 12).length;
  const alertesActives = context.alertes.filter(a => !a.traitee).length;
  const jalonsEnDanger = context.jalons.filter(j => j.statut === 'en_danger').length;

  return `Tu es Proph3t, l'assistant IA avancé du Cockpit COSMOS ANGRE. Tu aides l'équipe projet à:
- Analyser les problèmes et risques du projet en profondeur
- Rédiger des rapports et synthèses professionnels
- Extraire et analyser les données avec des indicateurs EVM
- Proposer des recommandations actionnables avec priorisation
- Gérer les tendances et faire des prévisions

CONTEXTE PROJET ACTUEL:
- ${context.actions.length} actions totales (${actionsEnCours} en cours, ${actionsBloquees} bloquées)
- ${context.jalons.length} jalons (${jalonsEnDanger} en danger)
- ${context.risques.length} risques identifiés (${risquesCritiques} critiques)
- ${alertesActives} alertes non traitées
- Budget: ${context.budget?.prevu?.toLocaleString('fr-FR') || 0} FCFA prévu, ${context.budget?.realise?.toLocaleString('fr-FR') || 0} FCFA réalisé
- Équipe: ${context.users.length} membres, ${context.teams.length} équipes

INDICATEURS EVM:
- SPI: ${evm.spi.toFixed(2)} (${evm.spi >= 1 ? 'en avance' : 'en retard'})
- CPI: ${evm.cpi.toFixed(2)} (${evm.cpi >= 1 ? 'sous budget' : 'dépassement'})
- EAC: ${Math.round(evm.eac).toLocaleString('fr-FR')} FCFA (estimation finale)

DONNÉES DÉTAILLÉES:

ACTIONS BLOQUÉES OU EN RETARD:
${context.actions
  .filter(a => a.statut === 'bloque' || (a.date_fin_prevue && new Date(a.date_fin_prevue) < new Date() && a.statut !== 'termine'))
  .slice(0, 10)
  .map(a => `- [${a.statut}] ${a.titre} (${a.avancement}%)`)
  .join('\n') || 'Aucune'}

RISQUES CRITIQUES:
${context.risques
  .filter(r => r.score >= 12)
  .slice(0, 5)
  .map(r => `- ${r.titre} (Score: ${r.score}, ${r.categorie})`)
  .join('\n') || 'Aucun'}

ALERTES ACTIVES:
${context.alertes
  .filter(a => !a.traitee)
  .slice(0, 5)
  .map(a => `- [${a.criticite}] ${a.titre}`)
  .join('\n') || 'Aucune'}

JALONS PROCHES OU EN DANGER:
${context.jalons
  .filter(j => j.statut === 'en_danger' || j.statut === 'a_venir')
  .slice(0, 5)
  .map(j => `- [${j.statut}] ${j.titre} (${j.date_prevue})`)
  .join('\n') || 'Aucun'}

Réponds en français de manière claire, professionnelle et actionnable. Utilise des tableaux markdown, des listes et des émojis pour la lisibilité.`;
}

// ============================================
// API CALLS
// ============================================

async function callOpenRouter(
  messages: AIMessage[],
  systemPrompt: string,
  config: AIConfig
): Promise<string> {
  if (!config.openrouterApiKey) {
    throw new Error('Clé API OpenRouter non configurée');
  }

  const response = await fetch(API_ENDPOINTS.openrouter.chat, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openrouterApiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'COSMOS ANGRE Cockpit',
    },
    body: JSON.stringify({
      model: config.openrouterModel || 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Erreur OpenRouter: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Pas de réponse';
}

async function callAnthropic(
  messages: AIMessage[],
  systemPrompt: string,
  config: AIConfig
): Promise<string> {
  if (!config.anthropicApiKey) {
    throw new Error('Clé API Anthropic non configurée');
  }

  const response = await fetch(API_ENDPOINTS.anthropic.messages, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.anthropicApiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.anthropicModel || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Erreur Anthropic: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || 'Pas de réponse';
}

// ============================================
// MAIN CHAT FUNCTION
// ============================================

export async function chat(
  userMessage: string,
  context: ProjectContext,
  history: AIMessage[] = []
): Promise<string> {
  const config = getConfig();
  const systemPrompt = buildSystemPrompt(context);

  const messages: AIMessage[] = [
    ...history,
    { role: 'user', content: userMessage },
  ];

  try {
    let response: string;

    switch (config.provider) {
      case 'openrouter':
        response = await callOpenRouter(messages, systemPrompt, config);
        break;
      case 'anthropic':
        response = await callAnthropic(messages, systemPrompt, config);
        break;
      case 'local':
      default:
        response = localAnalysis(userMessage, context, history);
        break;
    }

    return response;
  } catch (error) {
    console.error('Prophet chat error:', error);

    // Fallback to local analysis if API fails
    if (config.provider !== 'local') {
      return localAnalysis(userMessage, context, history) +
        `\n\n---\n*Mode local active (erreur API: ${error instanceof Error ? error.message : 'Inconnue'})*`;
    }

    throw error;
  }
}

// ============================================
// DATA IMPORT/EXPORT
// ============================================

export function extractDataForImport(context: ProjectContext, type: 'actions' | 'jalons' | 'risques' | 'budget'): string {
  switch (type) {
    case 'actions':
      return JSON.stringify(context.actions, null, 2);
    case 'jalons':
      return JSON.stringify(context.jalons, null, 2);
    case 'risques':
      return JSON.stringify(context.risques, null, 2);
    case 'budget':
      return JSON.stringify(context.budget, null, 2);
    default:
      return '[]';
  }
}

export function parseImportData(jsonString: string): unknown[] {
  try {
    const data = JSON.parse(jsonString);
    return Array.isArray(data) ? data : [data];
  } catch {
    throw new Error('Format JSON invalide');
  }
}

// Export des fonctions d'analyse pour utilisation externe
export {
  calculateEVM,
  analyzeTrends,
  analyzeWorkload,
  analyzeCriticalPath,
  generateSmartRecommendations,
  calculateHealthScore
};
