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

// ============================================================================
// TYPES
// ============================================================================

export type AIProvider = 'local' | 'openrouter' | 'anthropic';

export interface Proph3tConfig {
  provider: AIProvider;
  openrouterApiKey?: string;
  openrouterModel?: string;
  anthropicApiKey?: string;
  anthropicModel?: string;
  // Paramètres
  temperature?: number;
  maxTokens?: number;
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
// const CACHE_KEY = 'proph3t_cache';

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
    console.error('Erreur lecture config Proph3t:', e);
  }
  return DEFAULT_CONFIG;
}

export function saveProph3tConfig(config: Partial<Proph3tConfig>): void {
  try {
    const current = getProph3tConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Erreur sauvegarde config Proph3t:', e);
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

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openrouterApiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Cockpit COSMOS ANGRE',
    },
    body: JSON.stringify({
      model: config.openrouterModel || 'anthropic/claude-3.5-sonnet',
      messages,
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 4096,
    }),
  });

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

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.anthropicApiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.anthropicModel || 'claude-sonnet-4-20250514',
      max_tokens: config.maxTokens || 4096,
      system: systemPrompt,
      messages: messages.filter(m => m.role !== 'system'),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Anthropic: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

/**
 * Appel IA unifié avec fallback
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
    console.error(`Erreur ${config.provider}:`, error);

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

// ============================================================================
// ALGORITHME LOCAL AVANCE
// ============================================================================

function buildContextSummary(ctx: ProjectContext): string {
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
      critiques: ctx.risques.filter(r => (r.score || 0) >= 12).length,
      eleves: ctx.risques.filter(r => (r.score || 0) >= 8 && (r.score || 0) < 12).length,
    },
    budget: {
      prevu: ctx.budget.reduce((sum, b) => sum + (b.montant_prevu || 0), 0),
      realise: ctx.budget.reduce((sum, b) => sum + (b.montant_realise || 0), 0),
    },
    alertes: {
      nonTraitees: ctx.alertes.filter(a => !a.traitee).length,
      critiques: ctx.alertes.filter(a => !a.traitee && a.criticite === 'critical').length,
    },
  };

  return `
Projet: ${ctx.projectName || 'COSMOS ANGRE'}
Date: ${new Date().toLocaleDateString('fr-FR')}

ACTIONS (${stats.actions.total}):
- Terminées: ${stats.actions.termine}
- En cours: ${stats.actions.en_cours}
- Bloquées: ${stats.actions.bloque}
- En retard: ${stats.actions.en_retard}
- Avancement moyen: ${ctx.actions.length > 0 ? Math.round(ctx.actions.reduce((s, a) => s + (a.avancement || 0), 0) / ctx.actions.length) : 0}%

JALONS (${stats.jalons.total}):
- Atteints: ${stats.jalons.atteint}
- En danger: ${stats.jalons.en_danger}

RISQUES (${stats.risques.total}):
- Critiques (score ≥12): ${stats.risques.critiques}
- Élevés (score 8-11): ${stats.risques.eleves}

BUDGET:
- Prévu: ${stats.budget.prevu.toLocaleString('fr-FR')} FCFA
- Réalisé: ${stats.budget.realise.toLocaleString('fr-FR')} FCFA
- Consommation: ${stats.budget.prevu > 0 ? Math.round(stats.budget.realise / stats.budget.prevu * 100) : 0}%

ALERTES:
- Non traitées: ${stats.alertes.nonTraitees}
- Critiques: ${stats.alertes.critiques}
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
Je suis PROPH3T, l'assistant IA du Cockpit COSMOS ANGRE.

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

  const budgetPrevu = ctx.budget.reduce((sum, b) => sum + (b.montant_prevu || 0), 0);
  const budgetRealise = ctx.budget.reduce((sum, b) => sum + (b.montant_realise || 0), 0);

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
  const criticalRisks = ctx.risques.filter(r => (r.score || 0) >= 12).length;
  const untreatedAlerts = ctx.alertes.filter(a => !a.traitee && a.criticite === 'critical').length;

  const planningScore = Math.max(0, 100 - (overdue * 10) - (blocked * 15));
  const budgetScore = Math.min(100, Math.max(0, evm.cpi * 100));
  const riskScore = Math.max(0, 100 - (criticalRisks * 25));
  const alertScore = Math.max(0, 100 - (untreatedAlerts * 20));

  const healthScore = Math.round((planningScore + budgetScore + riskScore + alertScore) / 4);
  const status = healthScore >= 70 ? 'vert' : healthScore >= 40 ? 'jaune' : 'rouge';
  const statusIndicator = status === 'vert' ? '[VERT]' : status === 'jaune' ? '[JAUNE]' : '[ROUGE]';

  return `# ${statusIndicator} Analyse de Sante du Projet

## Score Global: ${healthScore}/100

### Detail par Dimension
| Dimension | Score | Statut |
|-----------|-------|--------|
| Planning | ${planningScore}% | ${planningScore >= 70 ? 'OK' : planningScore >= 40 ? 'ATTENTION' : 'CRITIQUE'} |
| Budget | ${budgetScore.toFixed(0)}% | ${budgetScore >= 70 ? 'OK' : budgetScore >= 40 ? 'ATTENTION' : 'CRITIQUE'} |
| Risques | ${riskScore}% | ${riskScore >= 70 ? 'OK' : riskScore >= 40 ? 'ATTENTION' : 'CRITIQUE'} |
| Alertes | ${alertScore}% | ${alertScore >= 70 ? 'OK' : alertScore >= 40 ? 'ATTENTION' : 'CRITIQUE'} |

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
  const criticalRisks = ctx.risques.filter(r => (r.score || 0) >= 12);
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

  const critical = ctx.risques.filter(r => (r.score || 0) >= 12);
  const high = ctx.risques.filter(r => (r.score || 0) >= 8 && (r.score || 0) < 12);
  const medium = ctx.risques.filter(r => (r.score || 0) >= 4 && (r.score || 0) < 8);
  const low = ctx.risques.filter(r => (r.score || 0) < 4);

  let report = `# Analyse des Risques\n\n`;
  report += `**Total:** ${ctx.risques.length} risques identifies\n\n`;

  report += `## Repartition\n\n`;
  report += `| Niveau | Nombre | % |\n|--------|--------|---|\n`;
  report += `| Critique (>=12) | ${critical.length} | ${Math.round(critical.length / ctx.risques.length * 100)}% |\n`;
  report += `| Eleve (8-11) | ${high.length} | ${Math.round(high.length / ctx.risques.length * 100)}% |\n`;
  report += `| Modere (4-7) | ${medium.length} | ${Math.round(medium.length / ctx.risques.length * 100)}% |\n`;
  report += `| Faible (<4) | ${low.length} | ${Math.round(low.length / ctx.risques.length * 100)}% |\n\n`;

  if (critical.length > 0) {
    report += `## Risques Critiques - Action Immediate\n\n`;
    critical.forEach(r => {
      report += `### ${r.titre}\n`;
      report += `- Score: **${r.score}** (P: ${r.probabilite_actuelle} × I: ${r.impact_actuel})\n`;
      report += `- Categorie: ${r.categorie || 'Non classe'}\n`;
      if (r.plan_mitigation) report += `- Plan: ${r.plan_mitigation}\n`;
      report += '\n';
    });
  }

  return report + `\n*Analyse generee le ${new Date().toLocaleString('fr-FR')}*`;
}

function analyzeBudgetLocal(ctx: ProjectContext): string {
  const evm = calculateEVMLocal(ctx);
  const budgetPrevu = ctx.budget.reduce((sum, b) => sum + (b.montant_prevu || 0), 0);
  const budgetRealise = ctx.budget.reduce((sum, b) => sum + (b.montant_realise || 0), 0);
  const budgetEngage = ctx.budget.reduce((sum, b) => sum + (b.montant_engage || 0), 0);

  let report = `# Analyse Budgetaire\n\n`;

  report += `## Situation Globale\n\n`;
  report += `| Poste | Montant (FCFA) | % |\n|-------|----------------|---|\n`;
  report += `| Budget Prévu | ${budgetPrevu.toLocaleString('fr-FR')} | 100% |\n`;
  report += `| Engagé | ${budgetEngage.toLocaleString('fr-FR')} | ${budgetPrevu > 0 ? Math.round(budgetEngage / budgetPrevu * 100) : 0}% |\n`;
  report += `| Réalisé | ${budgetRealise.toLocaleString('fr-FR')} | ${budgetPrevu > 0 ? Math.round(budgetRealise / budgetPrevu * 100) : 0}% |\n`;
  report += `| Disponible | ${(budgetPrevu - budgetRealise).toLocaleString('fr-FR')} | ${budgetPrevu > 0 ? Math.round((budgetPrevu - budgetRealise) / budgetPrevu * 100) : 0}% |\n\n`;

  report += `## Indicateurs EVM\n\n`;
  report += `| Indicateur | Valeur | Interpretation |\n|------------|--------|----------------|\n`;
  report += `| CPI | ${evm.cpi.toFixed(2)} | ${evm.cpi >= 1 ? 'Efficient' : evm.cpi >= 0.9 ? 'Acceptable' : 'Depassement'} |\n`;
  report += `| SPI | ${evm.spi.toFixed(2)} | ${evm.spi >= 1 ? 'Dans les temps' : evm.spi >= 0.9 ? 'Acceptable' : 'Retard'} |\n`;
  report += `| EAC | ${Math.round(evm.eac).toLocaleString('fr-FR')} | Estimation finale |\n`;
  report += `| VAC | ${Math.round(evm.vac).toLocaleString('fr-FR')} | ${evm.vac >= 0 ? 'Economie' : 'Depassement'} prevue |\n\n`;

  return report + `\n*Analyse générée le ${new Date().toLocaleString('fr-FR')}*`;
}

function generateReportLocal(ctx: ProjectContext): string {
  const evm = calculateEVMLocal(ctx);
  const completedActions = ctx.actions.filter(a => a.statut === 'termine').length;
  const completionRate = ctx.actions.length > 0 ? Math.round(completedActions / ctx.actions.length * 100) : 0;
  const avgProgress = ctx.actions.length > 0 ? Math.round(ctx.actions.reduce((s, a) => s + (a.avancement || 0), 0) / ctx.actions.length) : 0;

  let report = `# Rapport de Synthese - COSMOS ANGRE\n\n`;
  report += `**Date:** ${new Date().toLocaleDateString('fr-FR')}\n\n`;

  // Score de sante
  const blocked = ctx.actions.filter(a => a.statut === 'bloque').length;
  const overdue = ctx.actions.filter(a => a.statut !== 'termine' && a.date_fin_prevue && new Date(a.date_fin_prevue) < new Date()).length;
  const criticalRisks = ctx.risques.filter(r => (r.score || 0) >= 12).length;
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
  const criticalRisks = ctx.risques.filter(r => (r.score || 0) >= 12);
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
  const budgetPrevu = ctx.budget.reduce((sum, b) => sum + (b.montant_prevu || 0), 0);
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

  // Utilitaires
  buildContext: buildContextSummary,
};

export default Proph3tEngine;
