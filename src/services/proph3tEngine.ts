/**
 * PROPH3T Engine - Moteur IA Unifié
 *
 * Architecture 100% Frontend:
 * - Algorithme local avancé (fallback)
 * - OpenRouter API (multi-modèles: Claude, GPT, Mistral, etc.)
 * - Anthropic API (Claude direct)
 *
 * Toutes les données sont stockées dans IndexedDB via Dexie
 */

import type { Action, Jalon, Risque, BudgetItem, Alerte, User, Team } from '@/types';
import { PROJET_CONFIG, SEUILS_RISQUES, SEUILS, AXES_POIDS } from '@/data/constants';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export type AIProvider = 'local' | 'openrouter' | 'anthropic' | 'hybrid';

export interface Proph3tConfig {
  provider: AIProvider;
  openrouterApiKey?: string;
  openrouterModel?: string;
  anthropicApiKey?: string;
  anthropicModel?: string;
  // Paramètres
  temperature?: number;
  maxTokens?: number;
  // Mode hybride
  hybridEnabled?: boolean;
}

export interface ProjectContext {
  actions: Action[];
  jalons: Jalon[];
  risques: Risque[];
  budget: BudgetItem[];
  alertes: Alerte[];
  users: User[];
  teams: Team[];
  projectName?: string;
}

export interface HealthAnalysis {
  score: number;
  status: 'vert' | 'jaune' | 'rouge';
  details: {
    planning: number;
    budget: number;
    risques: number;
    ressources: number;
  };
  evm: EVMMetrics;
  issues: string[];
  recommendations: string[];
}

export interface EVMMetrics {
  pv: number;
  ev: number;
  ac: number;
  sv: number;
  cv: number;
  spi: number;
  cpi: number;
  eac: number;
  etc: number;
  vac: number;
  tcpi: number;
}

export interface Prediction {
  type: 'date' | 'budget' | 'completion';
  value: string | number;
  confidence: number;
  scenario: {
    optimistic: string | number;
    realistic: string | number;
    pessimistic: string | number;
  };
  factors: string[];
}

export interface SmartRecommendation {
  priority: 1 | 2 | 3 | 4 | 5;
  category: string;
  title: string;
  description: string;
  impact: 'critique' | 'eleve' | 'moyen' | 'faible';
  effort: 'eleve' | 'moyen' | 'faible';
  actions: string[];
  reasoning?: string;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model?: string;
  tokensUsed?: number;
  processingTime?: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG_KEY = 'proph3t_engine_config';

const DEFAULT_CONFIG: Proph3tConfig = {
  provider: 'local',
  openrouterModel: 'anthropic/claude-3.5-sonnet',
  anthropicModel: 'claude-sonnet-4-20250514',
  temperature: 0.7,
  maxTokens: 4096,
};

export function getProph3tConfig(): Proph3tConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (e) {
    logger.error('Erreur lecture config Proph3t:', e);
  }
  return DEFAULT_CONFIG;
}

export function saveProph3tConfig(config: Partial<Proph3tConfig>): void {
  try {
    const current = getProph3tConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
  } catch (e) {
    logger.error('Erreur sauvegarde config Proph3t:', e);
  }
}

export function isProph3tConfigured(): boolean {
  const config = getProph3tConfig();
  if (config.provider === 'local') return true;
  if (config.provider === 'openrouter') return !!config.openrouterApiKey;
  if (config.provider === 'anthropic') return !!config.anthropicApiKey;
  return false;
}

// ============================================================================
// API CLIENTS
// ============================================================================

/**
 * Appel OpenRouter API (multi-modèles)
 */
async function callOpenRouter(
  messages: Array<{ role: string; content: string }>,
  config: Proph3tConfig
): Promise<string> {
  if (!config.openrouterApiKey) {
    throw new Error('Clé API OpenRouter non configurée');
  }

  const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openrouterApiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': `Cockpit ${PROJET_CONFIG.nom}`,
    },
    body: JSON.stringify({
      model: config.openrouterModel || 'anthropic/claude-3.5-sonnet',
      messages,
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 4096,
    }),
  }, API_TIMEOUT_MS);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Appel Anthropic API (Claude direct)
 */
async function callAnthropic(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  config: Proph3tConfig
): Promise<string> {
  if (!config.anthropicApiKey) {
    throw new Error('Clé API Anthropic non configurée');
  }

  // Utiliser le proxy Vite pour éviter les appels directs depuis le navigateur
  const apiUrl = import.meta.env.DEV
    ? '/api/anthropic/v1/messages'  // Proxy en développement
    : (import.meta.env.VITE_WORKER_URL || 'https://api.anthropic.com') + '/v1/messages';

  const response = await fetchWithTimeout(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(import.meta.env.PROD && config.anthropicApiKey && {
        'x-api-key': config.anthropicApiKey,
      }),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.anthropicModel || 'claude-sonnet-4-20250514',
      max_tokens: config.maxTokens || 4096,
      system: systemPrompt,
      messages: messages.filter(m => m.role !== 'system'),
    }),
  }, API_TIMEOUT_MS);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Anthropic: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

// Configuration des timeouts et retries
const API_TIMEOUT_MS = 30000; // 30 secondes
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * Wrapper fetch avec timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Retry wrapper avec délai exponentiel
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Ne pas retry si c'est une erreur d'authentification ou de validation
      if (lastError.message.includes('401') || lastError.message.includes('403') ||
          lastError.message.includes('non configurée') || lastError.message.includes('invalide')) {
        throw lastError;
      }

      if (attempt < maxRetries) {
        logger.warn(`[PROPH3T] Tentative ${attempt + 1}/${maxRetries + 1} échouée, retry dans ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Échec après plusieurs tentatives');
}

/**
 * Appel IA unifié avec fallback et mode hybride
 */
export async function callAI(
  prompt: string,
  systemPrompt: string,
  context?: ProjectContext
): Promise<AIResponse> {
  const config = getProph3tConfig();
  const startTime = Date.now();

  // Enrichir le prompt avec le contexte projet
  let enrichedPrompt = prompt;
  if (context) {
    enrichedPrompt = `${prompt}\n\n--- CONTEXTE PROJET ---\n${buildContextSummary(context)}`;
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: enrichedPrompt },
  ];

  try {
    let content: string;
    let model: string | undefined;

    // Mode HYBRIDE: exécuter local + OpenRouter en parallèle
    if (config.provider === 'hybrid' || config.hybridEnabled) {
      const results = await callHybrid(prompt, messages, systemPrompt, config, context);
      return {
        content: results.content,
        provider: 'hybrid',
        model: results.model,
        processingTime: Date.now() - startTime,
      };
    }

    switch (config.provider) {
      case 'openrouter':
        content = await callOpenRouter(messages, config);
        model = config.openrouterModel;
        break;

      case 'anthropic':
        content = await callAnthropic(messages, systemPrompt, config);
        model = config.anthropicModel;
        break;

      case 'local':
      default:
        // Utiliser l'algorithme local
        content = await processWithLocalAlgorithm(prompt, context);
        model = 'local-algorithm';
        break;
    }

    return {
      content,
      provider: config.provider,
      model,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    logger.error(`Erreur ${config.provider}:`, error);

    // Fallback vers algorithme local
    if (config.provider !== 'local') {
      const content = await processWithLocalAlgorithm(prompt, context);
      return {
        content,
        provider: 'local',
        model: 'local-algorithm-fallback',
        processingTime: Date.now() - startTime,
      };
    }

    throw error;
  }
}

/**
 * Mode Hybride: exécute local + OpenRouter en parallèle et combine les résultats
 */
async function callHybrid(
  prompt: string,
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  config: Proph3tConfig,
  context?: ProjectContext
): Promise<{ content: string; model: string }> {
  // Exécuter local immédiatement
  const localPromise = processWithLocalAlgorithm(prompt, context);

  // Exécuter OpenRouter si configuré
  let aiPromise: Promise<string> | null = null;
  if (config.openrouterApiKey) {
    aiPromise = callOpenRouter(messages, config).catch(e => {
      logger.warn('OpenRouter non disponible en mode hybride:', e);
      return null;
    });
  } else if (config.anthropicApiKey) {
    aiPromise = callAnthropic(messages, systemPrompt, config).catch(e => {
      logger.warn('Anthropic non disponible en mode hybride:', e);
      return null;
    });
  }

  // Attendre les deux résultats
  const [localResult, aiResult] = await Promise.all([
    localPromise,
    aiPromise || Promise.resolve(null),
  ]);

  // Combiner les résultats
  if (aiResult) {
    // Si on a les deux, combiner intelligemment
    const combined = `## Analyse Locale (Algorithme)

${localResult}

---

## Analyse IA (${config.openrouterApiKey ? config.openrouterModel : config.anthropicModel})

${aiResult}`;

    return {
      content: combined,
      model: `hybrid (local + ${config.openrouterApiKey ? 'openrouter' : 'anthropic'})`,
    };
  }

  // Si seulement local disponible
  return {
    content: localResult,
    model: 'local-algorithm (hybrid-mode)',
  };
}

// ============================================================================
// ALGORITHME LOCAL AVANCE
// ============================================================================

function calcWeightedAvancement(actions: Action[]): number {
  if (actions.length === 0) return 0;
  const axeWeightMap: Record<string, number> = AXES_POIDS;
  const axeGroups: Record<string, { sum: number; count: number; poids: number }> = {};
  for (const a of actions) {
    if (!axeGroups[a.axe]) axeGroups[a.axe] = { sum: 0, count: 0, poids: axeWeightMap[a.axe] ?? 0 };
    axeGroups[a.axe].sum += a.avancement || 0;
    axeGroups[a.axe].count++;
  }
  const entries = Object.values(axeGroups);
  const totalPoids = entries.reduce((s, e) => s + e.poids, 0);
  if (totalPoids === 0) return Math.round(actions.reduce((s, a) => s + (a.avancement || 0), 0) / actions.length);
  return Math.round(entries.reduce((s, e) => s + (e.sum / e.count) * (e.poids / totalPoids), 0));
}

function buildContextSummary(ctx: ProjectContext): string {
  const avancementPondere = calcWeightedAvancement(ctx.actions);
  const stats = {
    actions: {
      total: ctx.actions.length,
      termine: ctx.actions.filter(a => a.statut === 'termine').length,
      en_cours: ctx.actions.filter(a => a.statut === 'en_cours').length,
      bloque: ctx.actions.filter(a => a.statut === 'bloque').length,
      en_retard: ctx.actions.filter(a => {
        if (a.statut === 'termine') return false;
        return a.date_fin_prevue && new Date(a.date_fin_prevue) < new Date();
      }).length,
    },
    jalons: {
      total: ctx.jalons.length,
      atteint: ctx.jalons.filter(j => j.statut === 'atteint').length,
      en_danger: ctx.jalons.filter(j => j.statut === 'en_danger').length,
    },
    risques: {
      total: ctx.risques.length,
      critiques: ctx.risques.filter(r => (r.score || 0) >= SEUILS_RISQUES.critique).length,
      eleves: ctx.risques.filter(r => (r.score || 0) >= SEUILS_RISQUES.majeur && (r.score || 0) < SEUILS_RISQUES.critique).length,
    },
    budget: {
      prevu: ctx.budget.reduce((sum, b) => sum + (b.montantPrevu || 0), 0),
      realise: ctx.budget.reduce((sum, b) => sum + (b.montantRealise || 0), 0),
    },
    alertes: {
      nonTraitees: ctx.alertes.filter(a => !a.traitee).length,
      critiques: ctx.alertes.filter(a => !a.traitee && a.criticite === 'critical').length,
    },
  };

  return `
Projet: ${ctx.projectName || PROJET_CONFIG.nom}
Date: ${new Date().toLocaleDateString('fr-FR')}

ACTIONS (${stats.actions.total}):
- Terminées: ${stats.actions.termine}
- En cours: ${stats.actions.en_cours}
- Bloquées: ${stats.actions.bloque}
- En retard: ${stats.actions.en_retard}
- Avancement moyen pondéré: ${avancementPondere}%

JALONS (${stats.jalons.total}):
- Atteints: ${stats.jalons.atteint}
- En danger: ${stats.jalons.en_danger}

RISQUES (${stats.risques.total}):
- Critiques (score ≥${SEUILS_RISQUES.critique}): ${stats.risques.critiques}
- Élevés (score ${SEUILS_RISQUES.majeur}-${SEUILS_RISQUES.critique - 1}): ${stats.risques.eleves}

BUDGET:
- Prévu: ${stats.budget.prevu.toLocaleString('fr-FR')} FCFA
- Réalisé: ${stats.budget.realise.toLocaleString('fr-FR')} FCFA
- Consommation: ${stats.budget.prevu > 0 ? Math.round(stats.budget.realise / stats.budget.prevu * 100) : 0}%

ALERTES:
- Non traitées: ${stats.alertes.nonTraitees}
- Critiques: ${stats.alertes.critiques}

SYNCHRONISATION:
- Avancement global pondéré: ${avancementPondere}%
- Jalons atteints: ${Math.round((stats.jalons.atteint / (stats.jalons.total || 1)) * 100)}%
- Score sync (écart avancement/jalons): ${Math.round(Math.max(0, 100 - Math.abs(avancementPondere - (stats.jalons.atteint / (stats.jalons.total || 1)) * 100) * 2))}%
`;
}

async function processWithLocalAlgorithm(
  prompt: string,
  context?: ProjectContext
): Promise<string> {
  const normalizedPrompt = prompt.toLowerCase();

  // Détection d'intention
  if (containsAny(normalizedPrompt, ['probleme', 'problème', 'issue', 'blocage', 'bloque'])) {
    return context ? analyzeProblemsLocal(context) : 'Veuillez fournir le contexte projet.';
  }

  if (containsAny(normalizedPrompt, ['risque', 'danger', 'menace'])) {
    return context ? analyzeRisksLocal(context) : 'Veuillez fournir le contexte projet.';
  }

  if (containsAny(normalizedPrompt, ['budget', 'cout', 'coût', 'finance', 'depense'])) {
    return context ? analyzeBudgetLocal(context) : 'Veuillez fournir le contexte projet.';
  }

  if (containsAny(normalizedPrompt, ['rapport', 'synthese', 'synthèse', 'resume', 'bilan'])) {
    return context ? generateReportLocal(context) : 'Veuillez fournir le contexte projet.';
  }

  if (containsAny(normalizedPrompt, ['recommandation', 'conseil', 'suggestion', 'que faire'])) {
    return context ? generateRecommendationsLocal(context) : 'Veuillez fournir le contexte projet.';
  }

  if (containsAny(normalizedPrompt, ['prevision', 'prévision', 'prediction', 'forecast', 'estimation'])) {
    return context ? generatePredictionsLocal(context) : 'Veuillez fournir le contexte projet.';
  }

  if (containsAny(normalizedPrompt, ['sante', 'santé', 'health', 'etat', 'état', 'statut'])) {
    return context ? analyzeHealthLocal(context) : 'Veuillez fournir le contexte projet.';
  }

  // Réponse par défaut
  return context ? generateReportLocal(context) : `
Je suis PROPH3T, l'assistant IA du Cockpit ${PROJET_CONFIG.nom}.

Je peux vous aider avec:
- Analyse de la sante du projet
- Identification des problemes et blocages
- Evaluation des risques
- Analyse budgetaire
- Generation de rapports
- Recommandations intelligentes
- Previsions et estimations

Posez-moi une question sur votre projet!
`;
}

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some(kw => text.includes(kw));
}

// ============================================================================
// ANALYSES LOCALES
// ============================================================================

function calculateEVMLocal(ctx: ProjectContext): EVMMetrics {
  const now = new Date();
  const _totalActions = ctx.actions.length || 1;
  const completedWeight = ctx.actions
    .filter(a => a.statut === 'termine')
    .reduce((sum, a) => sum + (a.poids || 1), 0);
  const totalWeight = ctx.actions.reduce((sum, a) => sum + (a.poids || 1), 0) || 1;

  // Calcul du % planifié
  let plannedPercent = 0;
  const actionsWithDates = ctx.actions.filter(a => a.date_debut && a.date_fin_prevue);
  if (actionsWithDates.length > 0) {
    const minDate = Math.min(...actionsWithDates.map(a => new Date(a.date_debut).getTime()));
    const maxDate = Math.max(...actionsWithDates.map(a => new Date(a.date_fin_prevue).getTime()));
    const elapsed = now.getTime() - minDate;
    const totalDuration = maxDate - minDate;
    plannedPercent = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 50;
  } else {
    plannedPercent = 50;
  }

  const budgetPrevu = ctx.budget.reduce((sum, b) => sum + (b.montantPrevu || 0), 0);
  const budgetRealise = ctx.budget.reduce((sum, b) => sum + (b.montantRealise || 0), 0);

  const pv = budgetPrevu * (plannedPercent / 100);
  const ev = budgetPrevu * (completedWeight / totalWeight);
  const ac = budgetRealise;

  const sv = ev - pv;
  const cv = ev - ac;
  const spi = pv > 0 ? ev / pv : 1;
  const cpi = ac > 0 ? ev / ac : 1;
  const eac = cpi > 0 ? budgetPrevu / cpi : budgetPrevu;
  const etc = eac - ac;
  const vac = budgetPrevu - eac;
  const remainingWork = budgetPrevu - ev;
  const remainingBudget = budgetPrevu - ac;
  const tcpi = remainingBudget > 0 ? remainingWork / remainingBudget : 1;

  return { pv, ev, ac, sv, cv, spi, cpi, eac, etc, vac, tcpi };
}

function analyzeHealthLocal(ctx: ProjectContext): string {
  const evm = calculateEVMLocal(ctx);

  // Calcul des scores par dimension
  const blocked = ctx.actions.filter(a => a.statut === 'bloque').length;
  const overdue = ctx.actions.filter(a => {
    if (a.statut === 'termine') return false;
    return a.date_fin_prevue && new Date(a.date_fin_prevue) < new Date();
  }).length;
  const criticalRisks = ctx.risques.filter(r => (r.score || 0) >= SEUILS_RISQUES.critique).length;
  const untreatedAlerts = ctx.alertes.filter(a => !a.traitee && a.criticite === 'critical').length;

  const planningScore = Math.max(0, 100 - (overdue * 10) - (blocked * 15));
  const budgetScore = Math.min(100, Math.max(0, evm.cpi * 100));
  const riskScore = Math.max(0, 100 - (criticalRisks * 25));
  const alertScore = Math.max(0, 100 - (untreatedAlerts * 20));

  const healthScore = Math.round((planningScore + budgetScore + riskScore + alertScore) / 4);
  const status = healthScore >= SEUILS.confiance.bon ? 'vert' : healthScore >= SEUILS.confiance.moyen ? 'jaune' : 'rouge';
  const statusIndicator = status === 'vert' ? '[VERT]' : status === 'jaune' ? '[JAUNE]' : '[ROUGE]';

  return `# ${statusIndicator} Analyse de Sante du Projet

## Score Global: ${healthScore}/100

### Detail par Dimension
| Dimension | Score | Statut |
|-----------|-------|--------|
| Planning | ${planningScore}% | ${planningScore >= SEUILS.confiance.bon ? 'OK' : planningScore >= SEUILS.confiance.moyen ? 'ATTENTION' : 'CRITIQUE'} |
| Budget | ${budgetScore.toFixed(0)}% | ${budgetScore >= SEUILS.confiance.bon ? 'OK' : budgetScore >= SEUILS.confiance.moyen ? 'ATTENTION' : 'CRITIQUE'} |
| Risques | ${riskScore}% | ${riskScore >= SEUILS.confiance.bon ? 'OK' : riskScore >= SEUILS.confiance.moyen ? 'ATTENTION' : 'CRITIQUE'} |
| Alertes | ${alertScore}% | ${alertScore >= SEUILS.confiance.bon ? 'OK' : alertScore >= SEUILS.confiance.moyen ? 'ATTENTION' : 'CRITIQUE'} |

### Indicateurs EVM
- **SPI** (Performance Planning): ${evm.spi.toFixed(2)} ${evm.spi >= 1 ? 'OK' : 'ATTENTION'}
- **CPI** (Performance Couts): ${evm.cpi.toFixed(2)} ${evm.cpi >= 1 ? 'OK' : 'ATTENTION'}
- **EAC** (Estimation Finale): ${Math.round(evm.eac).toLocaleString('fr-FR')} FCFA

### Points d'Attention
${blocked > 0 ? `- [BLOQUE] ${blocked} action(s) bloquee(s)\n` : ''}${overdue > 0 ? `- [RETARD] ${overdue} action(s) en retard\n` : ''}${criticalRisks > 0 ? `- [CRITIQUE] ${criticalRisks} risque(s) critique(s)\n` : ''}${untreatedAlerts > 0 ? `- [ALERTE] ${untreatedAlerts} alerte(s) critique(s) non traitee(s)\n` : ''}${blocked === 0 && overdue === 0 && criticalRisks === 0 && untreatedAlerts === 0 ? 'Aucun point d\'attention majeur' : ''}

*Analyse générée le ${new Date().toLocaleString('fr-FR')}*
`;
}

function analyzeProblemsLocal(ctx: ProjectContext): string {
  const blocked = ctx.actions.filter(a => a.statut === 'bloque');
  const overdue = ctx.actions.filter(a => {
    if (a.statut === 'termine') return false;
    return a.date_fin_prevue && new Date(a.date_fin_prevue) < new Date();
  });
  const criticalRisks = ctx.risques.filter(r => (r.score || 0) >= SEUILS_RISQUES.critique);
  const criticalAlerts = ctx.alertes.filter(a => !a.traitee && a.criticite === 'critical');

  let report = `# Analyse des Problemes\n\n`;

  if (blocked.length > 0) {
    report += `## Actions Bloquees (${blocked.length})\n\n`;
    blocked.slice(0, 5).forEach(a => {
      report += `- **${a.titre}** — Responsable: ${a.responsable || 'Non assigné'}\n`;
    });
    report += '\n';
  }

  if (overdue.length > 0) {
    report += `## Actions en Retard (${overdue.length})\n\n`;
    overdue.slice(0, 5).forEach(a => {
      const days = Math.floor((Date.now() - new Date(a.date_fin_prevue).getTime()) / (1000 * 60 * 60 * 24));
      report += `- **${a.titre}** — ${days} jours de retard (${a.avancement || 0}% complété)\n`;
    });
    report += '\n';
  }

  if (criticalRisks.length > 0) {
    report += `## Risques Critiques (${criticalRisks.length})\n\n`;
    criticalRisks.forEach(r => {
      report += `- **${r.titre}** — Score: ${r.score}\n`;
    });
    report += '\n';
  }

  if (criticalAlerts.length > 0) {
    report += `## Alertes Critiques Non Traitees (${criticalAlerts.length})\n\n`;
    criticalAlerts.slice(0, 5).forEach(a => {
      report += `- ${a.titre}\n`;
    });
    report += '\n';
  }

  if (blocked.length === 0 && overdue.length === 0 && criticalRisks.length === 0 && criticalAlerts.length === 0) {
    report += `## Aucun Probleme Majeur Detecte\n\nLe projet se deroule normalement.\n`;
  }

  return report + `\n*Analyse générée le ${new Date().toLocaleString('fr-FR')}*`;
}

function analyzeRisksLocal(ctx: ProjectContext): string {
  if (ctx.risques.length === 0) {
    return `# Analyse des Risques\n\nAucun risque enregistre. Pensez a identifier les risques potentiels!`;
  }

  const critical = ctx.risques.filter(r => (r.score || 0) >= SEUILS_RISQUES.critique);
  const high = ctx.risques.filter(r => (r.score || 0) >= SEUILS_RISQUES.majeur && (r.score || 0) < SEUILS_RISQUES.critique);
  const medium = ctx.risques.filter(r => (r.score || 0) >= 4 && (r.score || 0) < 8);
  const low = ctx.risques.filter(r => (r.score || 0) < 4);

  let report = `# Analyse des Risques\n\n`;
  report += `**Total:** ${ctx.risques.length} risques identifies\n\n`;

  report += `## Repartition\n\n`;
  report += `| Niveau | Nombre | % |\n|--------|--------|---|\n`;
  report += `| Critique (>=${SEUILS_RISQUES.critique}) | ${critical.length} | ${Math.round(critical.length / ctx.risques.length * 100)}% |\n`;
  report += `| Eleve (${SEUILS_RISQUES.majeur}-${SEUILS_RISQUES.critique - 1}) | ${high.length} | ${Math.round(high.length / ctx.risques.length * 100)}% |\n`;
  report += `| Modere (4-7) | ${medium.length} | ${Math.round(medium.length / ctx.risques.length * 100)}% |\n`;
  report += `| Faible (<4) | ${low.length} | ${Math.round(low.length / ctx.risques.length * 100)}% |\n\n`;

  if (critical.length > 0) {
    report += `## Risques Critiques - Action Immediate\n\n`;
    critical.forEach(r => {
      report += `### ${r.titre}\n`;
      report += `- Score: **${r.score}** (P: ${r.probabilite_actuelle ?? r.probabilite} × I: ${r.impact_actuel ?? r.impact})\n`;
      report += `- Categorie: ${r.categorie || 'Non classe'}\n`;
      if (r.plan_mitigation) report += `- Plan: ${r.plan_mitigation}\n`;
      report += '\n';
    });
  }

  return report + `\n*Analyse generee le ${new Date().toLocaleString('fr-FR')}*`;
}

function analyzeBudgetLocal(ctx: ProjectContext): string {
  const evm = calculateEVMLocal(ctx);
  const budgetPrevu = ctx.budget.reduce((sum, b) => sum + (b.montantPrevu || 0), 0);
  const budgetRealise = ctx.budget.reduce((sum, b) => sum + (b.montantRealise || 0), 0);
  const budgetEngage = ctx.budget.reduce((sum, b) => sum + (b.montantEngage || 0), 0);

  let report = `# Analyse Budgetaire\n\n`;

  report += `## Situation Globale\n\n`;
  report += `| Poste | Montant (FCFA) | % |\n|-------|----------------|---|\n`;
  report += `| Budget Prévu | ${budgetPrevu.toLocaleString('fr-FR')} | 100% |\n`;
  report += `| Engagé | ${budgetEngage.toLocaleString('fr-FR')} | ${budgetPrevu > 0 ? Math.round(budgetEngage / budgetPrevu * 100) : 0}% |\n`;
  report += `| Réalisé | ${budgetRealise.toLocaleString('fr-FR')} | ${budgetPrevu > 0 ? Math.round(budgetRealise / budgetPrevu * 100) : 0}% |\n`;
  report += `| Disponible | ${(budgetPrevu - budgetRealise).toLocaleString('fr-FR')} | ${budgetPrevu > 0 ? Math.round((budgetPrevu - budgetRealise) / budgetPrevu * 100) : 0}% |\n\n`;

  report += `## Indicateurs EVM\n\n`;
  report += `| Indicateur | Valeur | Interpretation |\n|------------|--------|----------------|\n`;
  report += `| CPI | ${evm.cpi.toFixed(2)} | ${evm.cpi >= SEUILS.evm.bon ? 'Efficient' : evm.cpi >= SEUILS.evm.attention ? 'Acceptable' : 'Depassement'} |\n`;
  report += `| SPI | ${evm.spi.toFixed(2)} | ${evm.spi >= SEUILS.evm.bon ? 'Dans les temps' : evm.spi >= SEUILS.evm.attention ? 'Acceptable' : 'Retard'} |\n`;
  report += `| EAC | ${Math.round(evm.eac).toLocaleString('fr-FR')} | Estimation finale |\n`;
  report += `| VAC | ${Math.round(evm.vac).toLocaleString('fr-FR')} | ${evm.vac >= 0 ? 'Economie' : 'Depassement'} prevue |\n\n`;

  return report + `\n*Analyse générée le ${new Date().toLocaleString('fr-FR')}*`;
}

function generateReportLocal(ctx: ProjectContext): string {
  const evm = calculateEVMLocal(ctx);
  const completedActions = ctx.actions.filter(a => a.statut === 'termine').length;
  const completionRate = ctx.actions.length > 0 ? Math.round(completedActions / ctx.actions.length * 100) : 0;
  const avgProgress = ctx.actions.length > 0 ? Math.round(ctx.actions.reduce((s, a) => s + (a.avancement || 0), 0) / ctx.actions.length) : 0;

  let report = `# Rapport de Synthese - ${PROJET_CONFIG.nom}\n\n`;
  report += `**Date:** ${new Date().toLocaleDateString('fr-FR')}\n\n`;

  // Score de sante
  const blocked = ctx.actions.filter(a => a.statut === 'bloque').length;
  const overdue = ctx.actions.filter(a => a.statut !== 'termine' && a.date_fin_prevue && new Date(a.date_fin_prevue) < new Date()).length;
  const criticalRisks = ctx.risques.filter(r => (r.score || 0) >= SEUILS_RISQUES.critique).length;
  const healthScore = Math.max(0, 100 - (blocked * 15) - (overdue * 10) - (criticalRisks * 20));
  const statusLabel = healthScore >= 70 ? '[VERT]' : healthScore >= 40 ? '[JAUNE]' : '[ROUGE]';

  report += `## ${statusLabel} Score de Sante: ${healthScore}/100\n\n`;

  report += `## Indicateurs Cles\n\n`;
  report += `| Indicateur | Valeur | Statut |\n|------------|--------|--------|\n`;
  report += `| Actions terminees | ${completedActions}/${ctx.actions.length} (${completionRate}%) | ${completionRate >= 70 ? 'OK' : 'ATTENTION'} |\n`;
  report += `| Avancement moyen | ${avgProgress}% | ${avgProgress >= 70 ? 'OK' : 'ATTENTION'} |\n`;
  report += `| Jalons atteints | ${ctx.jalons.filter(j => j.statut === 'atteint').length}/${ctx.jalons.length} | - |\n`;
  report += `| SPI | ${evm.spi.toFixed(2)} | ${evm.spi >= 1 ? 'OK' : 'ATTENTION'} |\n`;
  report += `| CPI | ${evm.cpi.toFixed(2)} | ${evm.cpi >= 1 ? 'OK' : 'ATTENTION'} |\n`;
  report += `| Risques critiques | ${criticalRisks} | ${criticalRisks === 0 ? 'OK' : 'CRITIQUE'} |\n\n`;

  // Points d'attention
  const issues: string[] = [];
  if (blocked > 0) issues.push(`- [BLOQUE] ${blocked} action(s) bloquee(s)`);
  if (overdue > 0) issues.push(`- [RETARD] ${overdue} action(s) en retard`);
  if (criticalRisks > 0) issues.push(`- [CRITIQUE] ${criticalRisks} risque(s) critique(s)`);
  if (evm.cpi < 0.9) issues.push(`- [BUDGET] Depassement budgetaire (CPI: ${evm.cpi.toFixed(2)})`);

  report += `## Points d'Attention\n\n`;
  report += issues.length > 0 ? issues.join('\n') : 'Aucun point d\'attention majeur';
  report += '\n\n';

  return report + `---\n*Rapport genere par PROPH3T - ${new Date().toLocaleString('fr-FR')}*`;
}

function generateRecommendationsLocal(ctx: ProjectContext): string {
  const recommendations: SmartRecommendation[] = [];
  const evm = calculateEVMLocal(ctx);

  // Actions bloquées
  const blocked = ctx.actions.filter(a => a.statut === 'bloque');
  if (blocked.length > 0) {
    recommendations.push({
      priority: 1,
      category: 'Actions',
      title: `Débloquer ${blocked.length} action(s) urgente(s)`,
      description: 'Des actions sont bloquées et impactent le projet',
      impact: blocked.length > 3 ? 'critique' : 'eleve',
      effort: 'moyen',
      actions: [
        'Organiser une réunion de déblocage',
        'Identifier les responsables',
        ...blocked.slice(0, 3).map(a => `- "${a.titre}"`),
      ],
    });
  }

  // Risques critiques
  const criticalRisks = ctx.risques.filter(r => (r.score || 0) >= SEUILS_RISQUES.critique);
  if (criticalRisks.length > 0) {
    recommendations.push({
      priority: 1,
      category: 'Risques',
      title: `Mitiger ${criticalRisks.length} risque(s) critique(s)`,
      description: 'Des risques nécessitent une attention immédiate',
      impact: 'critique',
      effort: 'eleve',
      actions: [
        'Activer les plans de mitigation',
        'Convoquer un comité de risques',
        ...criticalRisks.slice(0, 2).map(r => `- "${r.titre}"`),
      ],
    });
  }

  // Budget
  if (evm.cpi < 0.9) {
    recommendations.push({
      priority: 2,
      category: 'Budget',
      title: 'Améliorer l\'efficience des coûts',
      description: `CPI de ${evm.cpi.toFixed(2)} indique un dépassement`,
      impact: 'eleve',
      effort: 'eleve',
      actions: [
        'Analyser les postes de dépense',
        'Identifier les économies possibles',
        'Renégocier les contrats si possible',
      ],
    });
  }

  // Planning
  if (evm.spi < 0.9) {
    recommendations.push({
      priority: 2,
      category: 'Planning',
      title: 'Rattraper le retard de planning',
      description: `SPI de ${evm.spi.toFixed(2)} indique un retard significatif`,
      impact: 'eleve',
      effort: 'moyen',
      actions: [
        'Revoir les priorités',
        'Ajouter des ressources si possible',
        'Paralléliser les activités',
      ],
    });
  }

  // Jalons en danger
  const jalonsEnDanger = ctx.jalons.filter(j => j.statut === 'en_danger');
  if (jalonsEnDanger.length > 0) {
    recommendations.push({
      priority: 2,
      category: 'Jalons',
      title: `Sauver ${jalonsEnDanger.length} jalon(s) en danger`,
      description: 'Des jalons risquent de ne pas être atteints',
      impact: 'eleve',
      effort: 'eleve',
      actions: [
        'Mobiliser les équipes',
        'Identifier les dépendances bloquantes',
        ...jalonsEnDanger.slice(0, 2).map(j => `- "${j.titre}"`),
      ],
    });
  }

  // Generer le rapport
  let report = `# Recommandations Intelligentes\n\n`;

  if (recommendations.length === 0) {
    report += `## Projet en Bonne Sante\n\n`;
    report += `Aucune recommandation urgente. Continuez ainsi!\n\n`;
    report += `**Suggestions:**\n`;
    report += `- Documenter les bonnes pratiques\n`;
    report += `- Anticiper les prochaines echeances\n`;
    report += `- Preparer les rapports pour la direction\n`;
  } else {
    const priorityLabels: Record<number, string> = {
      1: '[URGENT]',
      2: '[Important]',
      3: '[Recommande]',
      4: '[Optionnel]',
      5: '[Maintenance]',
    };

    recommendations.sort((a, b) => a.priority - b.priority);

    recommendations.forEach((rec, i) => {
      report += `## ${i + 1}. ${priorityLabels[rec.priority]} — ${rec.title}\n\n`;
      report += `**Categorie:** ${rec.category} | **Impact:** ${rec.impact} | **Effort:** ${rec.effort}\n\n`;
      report += `${rec.description}\n\n`;
      report += `**Actions suggerees:**\n`;
      rec.actions.forEach(a => report += `- ${a}\n`);
      report += '\n';
    });
  }

  return report + `---\n*Recommandations generees par PROPH3T - ${new Date().toLocaleString('fr-FR')}*`;
}

function generatePredictionsLocal(ctx: ProjectContext): string {
  const evm = calculateEVMLocal(ctx);
  const now = new Date();

  let report = `# Previsions et Estimations\n\n`;

  // Prevision de fin de projet
  const actionsWithDates = ctx.actions.filter(a => a.date_fin_prevue);
  if (actionsWithDates.length > 0) {
    const maxDate = new Date(Math.max(...actionsWithDates.map(a => new Date(a.date_fin_prevue).getTime())));
    const daysRemaining = Math.ceil((maxDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Ajustement base sur SPI
    const adjustedDays = evm.spi > 0 ? Math.round(daysRemaining / evm.spi) : daysRemaining;
    const predictedDate = new Date(now.getTime() + adjustedDays * 24 * 60 * 60 * 1000);

    report += `## Date de Fin Estimee\n\n`;
    report += `| Scénario | Date | Jours |\n|----------|------|-------|\n`;
    report += `| Optimiste | ${new Date(now.getTime() + daysRemaining * 0.9 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')} | ${Math.round(daysRemaining * 0.9)} |\n`;
    report += `| Réaliste | ${predictedDate.toLocaleDateString('fr-FR')} | ${adjustedDays} |\n`;
    report += `| Pessimiste | ${new Date(now.getTime() + daysRemaining * 1.3 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')} | ${Math.round(daysRemaining * 1.3)} |\n\n`;

    const confidence = evm.spi >= 0.9 && evm.cpi >= 0.9 ? 'Elevee' : evm.spi >= 0.7 ? 'Moyenne' : 'Faible';
    report += `**Confiance:** ${confidence}\n\n`;
  }

  // Prevision budgetaire
  const budgetPrevu = ctx.budget.reduce((sum, b) => sum + (b.montantPrevu || 0), 0);
  report += `## Estimation Budgetaire Finale\n\n`;
  report += `| Scénario | Montant (FCFA) | Écart |\n|----------|----------------|-------|\n`;
  report += `| Optimiste | ${Math.round(evm.eac * 0.95).toLocaleString('fr-FR')} | ${Math.round((evm.eac * 0.95 - budgetPrevu) / budgetPrevu * 100)}% |\n`;
  report += `| Réaliste (EAC) | ${Math.round(evm.eac).toLocaleString('fr-FR')} | ${Math.round((evm.eac - budgetPrevu) / budgetPrevu * 100)}% |\n`;
  report += `| Pessimiste | ${Math.round(evm.eac * 1.1).toLocaleString('fr-FR')} | ${Math.round((evm.eac * 1.1 - budgetPrevu) / budgetPrevu * 100)}% |\n\n`;

  // Taux de completion prevu
  const currentProgress = ctx.actions.length > 0
    ? ctx.actions.reduce((s, a) => s + (a.avancement || 0), 0) / ctx.actions.length
    : 0;

  report += `## Progression Previsionnelle\n\n`;
  report += `- Avancement actuel: **${Math.round(currentProgress)}%**\n`;
  report += `- Tendance: ${evm.spi >= 1 ? 'Positive' : evm.spi >= 0.9 ? 'Stable' : 'Negative'}\n`;
  report += `- A 30 jours: ~${Math.min(100, Math.round(currentProgress + (100 - currentProgress) * 0.3 * evm.spi))}%\n`;
  report += `- A 60 jours: ~${Math.min(100, Math.round(currentProgress + (100 - currentProgress) * 0.5 * evm.spi))}%\n\n`;

  return report + `---\n*Previsions generees par PROPH3T - ${new Date().toLocaleString('fr-FR')}*`;
}

// ============================================================================
// ASSISTANT RAPPORT - Génération honnête basée sur les données réelles
// ============================================================================

export interface ReportSection {
  title: string;
  content: string;
  type: 'summary' | 'kpis' | 'actions' | 'risks' | 'budget' | 'milestones' | 'issues' | 'recommendations';
  data?: Record<string, unknown>;
}

export interface HonestReportData {
  generatedAt: string;
  projectName: string;
  healthScore: number;
  healthStatus: 'vert' | 'jaune' | 'rouge';
  truthStatement: string;
  sections: ReportSection[];
  rawMetrics: {
    actions: { total: number; completed: number; inProgress: number; blocked: number; overdue: number; avgProgress: number };
    milestones: { total: number; achieved: number; atRisk: number; overdue: number };
    risks: { total: number; critical: number; high: number; open: number };
    budget: { planned: number; spent: number; variance: number; cpi: number };
    alerts: { total: number; untreated: number; critical: number };
    evm: EVMMetrics;
  };
}

/**
 * Génère un rapport honnête et factuel basé sur les données réelles du projet.
 * PROPH3T ne maquille jamais la réalité - il dit toujours la vérité.
 */
function generateHonestReport(ctx: ProjectContext): HonestReportData {
  const now = new Date();
  const evm = calculateEVMLocal(ctx);

  // Calculs bruts et honnêtes
  const actionsCompleted = ctx.actions.filter(a => a.statut === 'termine').length;
  const actionsInProgress = ctx.actions.filter(a => a.statut === 'en_cours').length;
  const actionsBlocked = ctx.actions.filter(a => a.statut === 'bloque').length;
  const actionsOverdue = ctx.actions.filter(a => {
    if (a.statut === 'termine') return false;
    return a.date_fin_prevue && new Date(a.date_fin_prevue) < now;
  }).length;
  const avgProgress = ctx.actions.length > 0
    ? Math.round(ctx.actions.reduce((s, a) => s + (a.avancement || 0), 0) / ctx.actions.length)
    : 0;

  const milestonesAchieved = ctx.jalons.filter(j => j.statut === 'atteint').length;
  const milestonesAtRisk = ctx.jalons.filter(j => j.statut === 'en_danger').length;
  const milestonesOverdue = ctx.jalons.filter(j => j.statut === 'depasse').length;

  const criticalRisks = ctx.risques.filter(r => (r.score || 0) >= SEUILS_RISQUES.critique).length;
  const highRisks = ctx.risques.filter(r => (r.score || 0) >= SEUILS_RISQUES.majeur && (r.score || 0) < SEUILS_RISQUES.critique).length;
  const openRisks = ctx.risques.filter(r => r.statut !== 'ferme').length;

  const budgetPlanned = ctx.budget.reduce((sum, b) => sum + (b.montantPrevu || 0), 0);
  const budgetSpent = ctx.budget.reduce((sum, b) => sum + (b.montantRealise || 0), 0);
  const budgetVariance = budgetSpent - budgetPlanned;

  const untreatedAlerts = ctx.alertes.filter(a => !a.traitee).length;
  const criticalAlerts = ctx.alertes.filter(a => !a.traitee && a.criticite === 'critical').length;

  // Score de santé honnête
  const healthScore = Math.max(0, Math.min(100,
    100
    - (actionsBlocked * 15)
    - (actionsOverdue * 10)
    - (criticalRisks * 20)
    - (criticalAlerts * 10)
    - (evm.cpi < 0.9 ? 15 : 0)
    - (evm.spi < 0.9 ? 10 : 0)
  ));
  const healthStatus = healthScore >= 70 ? 'vert' : healthScore >= 40 ? 'jaune' : 'rouge';

  // Déclaration de vérité - PROPH3T dit toujours la vérité
  let truthStatement = '';
  if (healthScore >= 80) {
    truthStatement = 'Le projet progresse bien. Les indicateurs sont favorables.';
  } else if (healthScore >= 60) {
    truthStatement = 'Le projet avance mais présente des points de vigilance à surveiller.';
  } else if (healthScore >= 40) {
    truthStatement = 'Le projet rencontre des difficultés significatives qui nécessitent une attention immédiate.';
  } else {
    truthStatement = 'ALERTE: Le projet est en situation critique. Des actions correctives urgentes sont nécessaires.';
  }

  // Ajout des problèmes spécifiques à la déclaration
  const problems: string[] = [];
  if (actionsBlocked > 0) problems.push(`${actionsBlocked} action(s) bloquée(s)`);
  if (actionsOverdue > 0) problems.push(`${actionsOverdue} action(s) en retard`);
  if (criticalRisks > 0) problems.push(`${criticalRisks} risque(s) critique(s)`);
  if (evm.cpi < 0.9) problems.push(`dépassement budgétaire (CPI: ${evm.cpi.toFixed(2)})`);
  if (evm.spi < 0.9) problems.push(`retard planning (SPI: ${evm.spi.toFixed(2)})`);

  if (problems.length > 0) {
    truthStatement += ` Problèmes identifiés: ${problems.join(', ')}.`;
  }

  // Sections du rapport
  const sections: ReportSection[] = [
    {
      title: 'Synthèse Exécutive',
      type: 'summary',
      content: truthStatement,
    },
    {
      title: 'Indicateurs Clés de Performance',
      type: 'kpis',
      content: `Score santé: ${healthScore}/100 | SPI: ${evm.spi.toFixed(2)} | CPI: ${evm.cpi.toFixed(2)} | Avancement: ${avgProgress}%`,
      data: {
        healthScore,
        spi: evm.spi,
        cpi: evm.cpi,
        avgProgress,
        completionRate: ctx.actions.length > 0 ? Math.round(actionsCompleted / ctx.actions.length * 100) : 0,
      },
    },
    {
      title: 'État des Actions',
      type: 'actions',
      content: `${actionsCompleted}/${ctx.actions.length} terminées | ${actionsInProgress} en cours | ${actionsBlocked} bloquées | ${actionsOverdue} en retard`,
      data: {
        total: ctx.actions.length,
        completed: actionsCompleted,
        inProgress: actionsInProgress,
        blocked: actionsBlocked,
        overdue: actionsOverdue,
        blockedList: ctx.actions.filter(a => a.statut === 'bloque').map(a => ({ id: a.id, titre: a.titre })),
        overdueList: ctx.actions.filter(a => a.statut !== 'termine' && a.date_fin_prevue && new Date(a.date_fin_prevue) < now).map(a => ({ id: a.id, titre: a.titre, dateFin: a.date_fin_prevue })),
      },
    },
    {
      title: 'Jalons',
      type: 'milestones',
      content: `${milestonesAchieved}/${ctx.jalons.length} atteints | ${milestonesAtRisk} en danger | ${milestonesOverdue} dépassés`,
      data: {
        total: ctx.jalons.length,
        achieved: milestonesAchieved,
        atRisk: milestonesAtRisk,
        overdue: milestonesOverdue,
        atRiskList: ctx.jalons.filter(j => j.statut === 'en_danger').map(j => ({ id: j.id, titre: j.titre, datePrevue: j.date_prevue })),
      },
    },
    {
      title: 'Risques',
      type: 'risks',
      content: `${openRisks} risques ouverts | ${criticalRisks} critiques | ${highRisks} élevés`,
      data: {
        total: ctx.risques.length,
        open: openRisks,
        critical: criticalRisks,
        high: highRisks,
        criticalList: ctx.risques.filter(r => (r.score || 0) >= SEUILS_RISQUES.critique && r.statut !== 'ferme').map(r => ({ id: r.id, titre: r.titre, score: r.score })),
      },
    },
    {
      title: 'Budget',
      type: 'budget',
      content: `Prévu: ${budgetPlanned.toLocaleString('fr-FR')} FCFA | Réalisé: ${budgetSpent.toLocaleString('fr-FR')} FCFA | Écart: ${budgetVariance >= 0 ? '+' : ''}${budgetVariance.toLocaleString('fr-FR')} FCFA`,
      data: {
        planned: budgetPlanned,
        spent: budgetSpent,
        variance: budgetVariance,
        cpi: evm.cpi,
        consumptionRate: budgetPlanned > 0 ? Math.round(budgetSpent / budgetPlanned * 100) : 0,
      },
    },
  ];

  // Section problèmes si nécessaire
  if (problems.length > 0) {
    sections.push({
      title: 'Points d\'Attention Critiques',
      type: 'issues',
      content: problems.map(p => `• ${p}`).join('\n'),
      data: { problems },
    });
  }

  // Recommandations basées sur les problèmes réels
  const recommendations: string[] = [];
  if (actionsBlocked > 0) {
    recommendations.push('Organiser une réunion de déblocage immédiate pour les actions bloquées');
  }
  if (actionsOverdue > 0) {
    recommendations.push('Revoir les priorités et réaffecter les ressources aux actions en retard');
  }
  if (criticalRisks > 0) {
    recommendations.push('Activer les plans de mitigation pour les risques critiques');
  }
  if (evm.cpi < 0.9) {
    recommendations.push('Analyser les dépassements budgétaires et identifier des économies');
  }
  if (evm.spi < 0.9) {
    recommendations.push('Accélérer le rythme ou revoir le planning');
  }

  if (recommendations.length > 0) {
    sections.push({
      title: 'Recommandations',
      type: 'recommendations',
      content: recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n'),
      data: { recommendations },
    });
  }

  return {
    generatedAt: now.toISOString(),
    projectName: ctx.projectName || PROJET_CONFIG.nom,
    healthScore,
    healthStatus,
    truthStatement,
    sections,
    rawMetrics: {
      actions: { total: ctx.actions.length, completed: actionsCompleted, inProgress: actionsInProgress, blocked: actionsBlocked, overdue: actionsOverdue, avgProgress },
      milestones: { total: ctx.jalons.length, achieved: milestonesAchieved, atRisk: milestonesAtRisk, overdue: milestonesOverdue },
      risks: { total: ctx.risques.length, critical: criticalRisks, high: highRisks, open: openRisks },
      budget: { planned: budgetPlanned, spent: budgetSpent, variance: budgetVariance, cpi: evm.cpi },
      alerts: { total: ctx.alertes.length, untreated: untreatedAlerts, critical: criticalAlerts },
      evm,
    },
  };
}

/**
 * Génère le contenu texte du rapport pour intégration dans le Report Studio
 */
function generateReportContentForStudio(ctx: ProjectContext): string {
  const data = generateHonestReport(ctx);

  let content = `# Rapport de Suivi - ${data.projectName}\n\n`;
  content += `**Généré le:** ${new Date(data.generatedAt).toLocaleString('fr-FR')}\n\n`;
  content += `---\n\n`;

  // Synthèse avec indicateur visuel
  const statusEmoji = data.healthStatus === 'vert' ? '🟢' : data.healthStatus === 'jaune' ? '🟡' : '🔴';
  content += `## ${statusEmoji} Synthèse\n\n`;
  content += `**Score de Santé: ${data.healthScore}/100**\n\n`;
  content += `${data.truthStatement}\n\n`;

  // Sections
  data.sections.forEach(section => {
    if (section.type !== 'summary') {
      content += `## ${section.title}\n\n`;
      content += `${section.content}\n\n`;
    }
  });

  content += `---\n\n`;
  content += `*Ce rapport a été généré automatiquement par PROPH3T sur la base des données réelles du projet. PROPH3T dit toujours la vérité.*\n`;

  return content;
}

// ============================================================================
// SYSTEM PROMPT AVEC PRINCIPE D'HONNÊTETÉ
// ============================================================================

export const PROPH3T_HONEST_SYSTEM_PROMPT = `Tu es PROPH3T, l'assistant IA du Cockpit de gestion de projet ${PROJET_CONFIG.nom}.

## PRINCIPE FONDAMENTAL: L'HONNÊTETÉ ABSOLUE

Tu dois TOUJOURS dire la vérité, même si elle est désagréable. Tu ne dois JAMAIS:
- Maquiller ou embellir les résultats
- Minimiser les problèmes
- Rassurer faussement l'utilisateur
- Omettre des informations négatives

Si le projet va mal, tu dois le dire clairement. Si des actions sont bloquées, tu dois alerter. Si le budget dérape, tu dois avertir.

## Tes responsabilités:
- Analyser la santé réelle du projet basée sur les données
- Identifier et signaler TOUS les problèmes et blocages
- Évaluer les risques de manière objective
- Donner des prévisions réalistes (pas optimistes)
- Générer des rapports factuels et honnêtes
- Faire des recommandations concrètes basées sur les faits

## Format de réponse:
- Sois direct et factuel
- Utilise des chiffres précis
- Structure tes réponses clairement
- N'utilise pas de formules de politesse excessives
- Va droit au but

## Référentiel de seuils (constants.ts):
- Risques (grille 5×5, score max=25): faible <${SEUILS_RISQUES.modere}, modéré ≥${SEUILS_RISQUES.modere}, majeur ≥${SEUILS_RISQUES.majeur}, critique ≥${SEUILS_RISQUES.critique}
- Budget en FCFA. La date cible d'ouverture (Soft Opening) est le ${PROJET_CONFIG.jalonsClés.softOpening}.
- EVM: SPI/CPI ≥${SEUILS.evm.bon} = OK, ≥${SEUILS.evm.attention} = attention, <${SEUILS.evm.critique} = critique
- Alertes temporelles: J-${SEUILS.alertes.j30}, J-${SEUILS.alertes.j15}, J-${SEUILS.alertes.j7}, J-${SEUILS.alertes.j3}, J-${SEUILS.alertes.j1}
- 8 axes de projet (construction = 30% du poids, divers = 0%)

Rappel: La vérité est toujours préférable à une fausse assurance. Ton rôle est d'aider à prendre les bonnes décisions, pas de rassurer.`;

// ============================================================================
// EXPORTS PUBLICS
// ============================================================================

export const Proph3tEngine = {
  // Configuration
  getConfig: getProph3tConfig,
  saveConfig: saveProph3tConfig,
  isConfigured: isProph3tConfigured,

  // Appels IA
  call: callAI,

  // Analyses locales directes
  analyzeHealth: analyzeHealthLocal,
  analyzeProblems: analyzeProblemsLocal,
  analyzeRisks: analyzeRisksLocal,
  analyzeBudget: analyzeBudgetLocal,
  generateReport: generateReportLocal,
  generateRecommendations: generateRecommendationsLocal,
  generatePredictions: generatePredictionsLocal,
  calculateEVM: calculateEVMLocal,

  // Assistant Rapport (données réelles, honnêtes)
  generateHonestReport,
  generateReportContent: generateReportContentForStudio,
  HONEST_SYSTEM_PROMPT: PROPH3T_HONEST_SYSTEM_PROMPT,

  // Utilitaires
  buildContext: buildContextSummary,
};

export default Proph3tEngine;
