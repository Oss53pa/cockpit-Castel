/**
 * Hooks React pour PROPH3T Engine
 * Intégration facile du moteur IA dans les composants
 */

import { useState, useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { Proph3tEngine, type ProjectContext } from '@/services/proph3tEngine';
import type { Action, Jalon, Risque, BudgetItem, Alerte, User, Team } from '@/types';

// ============================================================================
// HOOK: useProjectContext
// Récupère le contexte complet du projet pour les analyses IA
// ============================================================================

export function useProjectContext(): ProjectContext | null {
  const actionsData = useLiveQuery(() => db.actions.toArray());
  const jalonsData = useLiveQuery(() => db.jalons.toArray());
  const risquesData = useLiveQuery(() => db.risques.toArray());
  const budgetData = useLiveQuery(() => db.budget.toArray());
  const alertesData = useLiveQuery(() => db.alertes.toArray());
  const usersData = useLiveQuery(() => db.users.toArray());
  const teamsData = useLiveQuery(() => db.teams.toArray());
  const projectData = useLiveQuery(() => db.project.toArray());
  const sitesData = useLiveQuery(() => db.sites.filter(s => !!s.actif).toArray());

  const context = useMemo<ProjectContext | null>(() => {
    const actions = actionsData ?? [];
    const jalons = jalonsData ?? [];
    const risques = risquesData ?? [];
    const budget = budgetData ?? [];
    const alertes = alertesData ?? [];
    const users = usersData ?? [];
    const teams = teamsData ?? [];
    const project = projectData ?? [];
    const sites = sitesData ?? [];

    // Attendre que les données soient chargées
    if (actions.length === 0 && jalons.length === 0) return null;

    // Get project name from site first, then fallback to project table
    const projectName = sites[0]?.nom ?? project[0]?.name ?? '';

    return {
      actions: actions as Action[],
      jalons: jalons as Jalon[],
      risques: risques as Risque[],
      budget: budget as BudgetItem[],
      alertes: alertes as Alerte[],
      users: users as User[],
      teams: teams as Team[],
      projectName,
    };
  }, [actionsData, jalonsData, risquesData, budgetData, alertesData, usersData, teamsData, projectData, sitesData]);

  return context;
}

// ============================================================================
// HOOK: useProph3tChat
// Chat interactif avec PROPH3T
// ============================================================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  provider?: string;
  processingTime?: number;
}

interface UseProph3tChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

export function useProph3tChat(): UseProph3tChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const context = useProjectContext();

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Utiliser le system prompt honnête
      const systemPrompt = Proph3tEngine.HONEST_SYSTEM_PROMPT;

      const response = await Proph3tEngine.call(message, systemPrompt, context || undefined);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        provider: response.provider,
        processingTime: response.processingTime,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);

      // Ajouter un message d'erreur
      const errorChatMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Erreur: ${errorMessage}\n\nJe vais essayer avec l'algorithme local...`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorChatMessage]);

      // Fallback local
      if (context) {
        const localResponse = Proph3tEngine.generateReport(context);
        const fallbackMessage: ChatMessage = {
          id: `fallback-${Date.now()}`,
          role: 'assistant',
          content: localResponse,
          timestamp: new Date(),
          provider: 'local',
        };
        setMessages(prev => [...prev, fallbackMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}

// ============================================================================
// HOOK: useProph3tAnalysis
// Analyses automatiques du projet
// ============================================================================

interface HealthData {
  score: number;
  status: 'vert' | 'jaune' | 'rouge';
  planningScore: number;
  budgetScore: number;
  riskScore: number;
  alertScore: number;
  spi: number;
  cpi: number;
  issues: string[];
}

/**
 * Hook unifié pour le score de santé - VALEURS RÉELLES (pas de transformation)
 * Utilise: Avancement, Jalons, Budget, Occupation, Vélocité
 */
export function useProph3tHealth(): HealthData | null {
  // Données réelles de la DB
  const actionsData = useLiveQuery(() => db.actions.toArray());
  const jalonsData = useLiveQuery(() => db.jalons.toArray());
  const budgetData = useLiveQuery(() => db.budget.toArray());

  return useMemo(() => {
    const actions = actionsData ?? [];
    const jalons = jalonsData ?? [];
    const budget = budgetData ?? [];

    // Attendre que les données soient chargées
    if (actions.length === 0 && jalons.length === 0) return null;

    // Budget depuis la DB
    const budgetTotal = budget.reduce((s, b) => s + (b.montantPrevu || 0), 0);
    const budgetConsomme = budget.reduce((s, b) => s + (b.montantRealise || 0), 0);

    // 1. Avancement RÉEL (moyenne des avancements)
    const avancementReel = actions.length > 0
      ? Math.round(actions.reduce((acc, a) => acc + (a.avancement || 0), 0) / actions.length)
      : 0;

    // 2. Jalons - % de jalons atteints RÉEL
    const jalonsAtteints = jalons.filter((j) => j.statut === 'atteint').length;
    const jalonsTotal = jalons.length || 1;
    const jalonsScore = Math.round((jalonsAtteints / jalonsTotal) * 100);

    // 3. Budget - % consommé RÉEL
    const budgetScore = budgetTotal > 0
      ? Math.round((budgetConsomme / budgetTotal) * 100)
      : 0;

    // 4. Occupation RÉEL (basé sur actions commerciales)
    const commercialActions = actions.filter((a) => a.axe === 'axe2_commercial');
    const occupationScore = commercialActions.length > 0
      ? Math.round(commercialActions.reduce((sum, a) => sum + (a.avancement || 0), 0) / commercialActions.length)
      : 0;

    // 5. Vélocité - % d'actions terminées RÉEL
    const actionsTerminees = actions.filter(a => a.statut === 'termine').length;
    const velocityScore = actions.length > 0
      ? Math.round((actionsTerminees / actions.length) * 100)
      : 0;

    // Score global pondéré avec valeurs réelles
    const weights = { avancement: 30, jalons: 25, budget: 20, occupation: 15, velocite: 10 };
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const score = Math.round(
      (avancementReel * weights.avancement +
       jalonsScore * weights.jalons +
       budgetScore * weights.budget +
       occupationScore * weights.occupation +
       velocityScore * weights.velocite) / totalWeight
    );

    const status = score >= 80 ? 'vert' : score >= 60 ? 'jaune' : 'rouge';

    // Issues basées sur données réelles
    const issues: string[] = [];
    const blocked = actions.filter(a => a.statut === 'bloque').length;
    const today = new Date();
    const overdue = actions.filter(a => {
      if (a.statut === 'termine') return false;
      return a.date_fin_prevue && new Date(a.date_fin_prevue) < new Date();
    }).length;
    const jalonsEnRetard = jalons.filter((j) => {
      const date = new Date(j.date_prevue);
      return date < today && j.statut !== 'atteint';
    }).length;

    if (blocked > 0) issues.push(`${blocked} action(s) bloquée(s)`);
    if (overdue > 0) issues.push(`${overdue} action(s) en retard`);
    if (jalonsEnRetard > 0) issues.push(`${jalonsEnRetard} jalon(s) en retard`);
    if (avancementReel < 10) issues.push(`Avancement faible (${avancementReel}%)`);
    if (occupationScore < 50) issues.push(`Occupation faible (${occupationScore}%)`);

    // SPI/CPI basés sur données réelles
    const spi = jalonsTotal > 0 ? (jalonsAtteints / jalonsTotal) : 1;
    const cpi = budgetTotal > 0 && budgetConsomme > 0 ? Math.min(2, budgetTotal / budgetConsomme) : 1;

    return {
      score,
      status,
      planningScore: avancementReel,
      budgetScore,
      riskScore: jalonsScore,
      alertScore: occupationScore,
      spi,
      cpi,
      issues,
    };
  }, [actionsData, jalonsData, budgetData]);
}

// ============================================================================
// HOOK: useProph3tRecommendations
// Recommandations intelligentes
// ============================================================================

interface Recommendation {
  priority: 1 | 2 | 3 | 4 | 5;
  category: string;
  title: string;
  description: string;
  impact: 'critique' | 'eleve' | 'moyen' | 'faible';
  effort: 'eleve' | 'moyen' | 'faible';
  actions: string[];
}

export function useProph3tRecommendations(): Recommendation[] {
  const context = useProjectContext();

  return useMemo(() => {
    if (!context) return [];

    const recommendations: Recommendation[] = [];
    const evm = Proph3tEngine.calculateEVM(context);

    // Actions bloquées
    const blocked = context.actions.filter(a => a.statut === 'bloque');
    if (blocked.length > 0) {
      recommendations.push({
        priority: 1,
        category: 'Actions',
        title: `Débloquer ${blocked.length} action(s)`,
        description: 'Actions bloquées impactant le projet',
        impact: blocked.length > 3 ? 'critique' : 'eleve',
        effort: 'moyen',
        actions: blocked.slice(0, 3).map(a => a.titre),
      });
    }

    // Risques critiques
    const criticalRisks = context.risques.filter(r => (r.score || 0) >= 12);
    if (criticalRisks.length > 0) {
      recommendations.push({
        priority: 1,
        category: 'Risques',
        title: `Mitiger ${criticalRisks.length} risque(s) critique(s)`,
        description: 'Risques nécessitant une attention immédiate',
        impact: 'critique',
        effort: 'eleve',
        actions: criticalRisks.slice(0, 3).map(r => r.titre),
      });
    }

    // Budget
    if (evm.cpi < 0.9) {
      recommendations.push({
        priority: 2,
        category: 'Budget',
        title: 'Optimiser les coûts',
        description: `CPI de ${evm.cpi.toFixed(2)} - dépassement détecté`,
        impact: 'eleve',
        effort: 'eleve',
        actions: ['Analyser les dépenses', 'Identifier les économies', 'Renégocier les contrats'],
      });
    }

    // Planning
    if (evm.spi < 0.9) {
      recommendations.push({
        priority: 2,
        category: 'Planning',
        title: 'Rattraper le retard',
        description: `SPI de ${evm.spi.toFixed(2)} - retard significatif`,
        impact: 'eleve',
        effort: 'moyen',
        actions: ['Revoir les priorités', 'Ajouter des ressources', 'Paralléliser les tâches'],
      });
    }

    // Jalons en danger
    const jalonsEnDanger = context.jalons.filter(j => j.statut === 'en_danger');
    if (jalonsEnDanger.length > 0) {
      recommendations.push({
        priority: 2,
        category: 'Jalons',
        title: `Sauver ${jalonsEnDanger.length} jalon(s)`,
        description: 'Jalons risquant de ne pas être atteints',
        impact: 'eleve',
        effort: 'eleve',
        actions: jalonsEnDanger.slice(0, 3).map(j => j.titre),
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }, [context]);
}

// ============================================================================
// HOOK: useProph3tConfig
// Configuration du moteur IA
// ============================================================================

interface UseProph3tConfigReturn {
  config: ReturnType<typeof Proph3tEngine.getConfig>;
  isConfigured: boolean;
  updateConfig: (config: Parameters<typeof Proph3tEngine.saveConfig>[0]) => void;
}

export function useProph3tConfig(): UseProph3tConfigReturn {
  const [config, setConfig] = useState(() => Proph3tEngine.getConfig());

  const updateConfig = useCallback((newConfig: Parameters<typeof Proph3tEngine.saveConfig>[0]) => {
    Proph3tEngine.saveConfig(newConfig);
    setConfig(Proph3tEngine.getConfig());
  }, []);

  const isConfigured = useMemo(() => {
    if (config.provider === 'local') return true;
    if (config.provider === 'openrouter') return !!config.openrouterApiKey;
    if (config.provider === 'anthropic') return !!config.anthropicApiKey;
    return false;
  }, [config]);

  return { config, isConfigured, updateConfig };
}

// ============================================================================
// HOOK: useProph3tQuickAnalysis
// Analyse rapide pour un affichage inline
// ============================================================================

type AnalysisType = 'health' | 'problems' | 'risks' | 'budget' | 'report' | 'recommendations' | 'predictions';

interface UseQuickAnalysisReturn {
  analysis: string | null;
  isLoading: boolean;
  error: string | null;
  runAnalysis: (type: AnalysisType) => void;
}

export function useProph3tQuickAnalysis(): UseQuickAnalysisReturn {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const context = useProjectContext();

  const runAnalysis = useCallback((type: AnalysisType) => {
    if (!context) {
      setError('Contexte projet non disponible');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let result: string;
      switch (type) {
        case 'health':
          result = Proph3tEngine.analyzeHealth(context);
          break;
        case 'problems':
          result = Proph3tEngine.analyzeProblems(context);
          break;
        case 'risks':
          result = Proph3tEngine.analyzeRisks(context);
          break;
        case 'budget':
          result = Proph3tEngine.analyzeBudget(context);
          break;
        case 'report':
          result = Proph3tEngine.generateReport(context);
          break;
        case 'recommendations':
          result = Proph3tEngine.generateRecommendations(context);
          break;
        case 'predictions':
          result = Proph3tEngine.generatePredictions(context);
          break;
        default:
          result = Proph3tEngine.generateReport(context);
      }
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  return { analysis, isLoading, error, runAnalysis };
}

// ============================================================================
// HOOK: useProph3tReportAssistant
// Assistant pour la génération de rapports honnêtes
// ============================================================================

interface HonestReportData {
  generatedAt: string;
  projectName: string;
  healthScore: number;
  healthStatus: 'vert' | 'jaune' | 'rouge';
  truthStatement: string;
  sections: Array<{
    title: string;
    content: string;
    type: string;
    data?: Record<string, unknown>;
  }>;
  rawMetrics: Record<string, unknown>;
}

interface UseReportAssistantReturn {
  reportData: HonestReportData | null;
  reportContent: string | null;
  isGenerating: boolean;
  error: string | null;
  generateReport: () => void;
  refreshData: () => void;
}

export function useProph3tReportAssistant(): UseReportAssistantReturn {
  const [reportData, setReportData] = useState<HonestReportData | null>(null);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const context = useProjectContext();

  const generateReport = useCallback(() => {
    if (!context) {
      setError('Données du projet non disponibles');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Générer le rapport honnête basé sur les données réelles
      const data = Proph3tEngine.generateHonestReport(context);
      const content = Proph3tEngine.generateReportContent(context);

      setReportData(data as HonestReportData);
      setReportContent(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération du rapport');
    } finally {
      setIsGenerating(false);
    }
  }, [context]);

  const refreshData = useCallback(() => {
    // Force la regénération avec les données fraîches
    generateReport();
  }, [generateReport]);

  return {
    reportData,
    reportContent,
    isGenerating,
    error,
    generateReport,
    refreshData,
  };
}
