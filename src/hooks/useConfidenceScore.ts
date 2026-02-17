/**
 * Hook pour calculer le Score de Confiance d'Ouverture
 * Agrège plusieurs facteurs pondérés pour estimer la probabilité d'ouvrir à temps
 */

import { useMemo, useEffect } from 'react';
import { useActions } from './useActions';
import { useJalons } from './useJalons';
import { useRisques } from './useRisques';
import { useDashboardKPIs } from './useDashboard';
import { useBudgetSynthese } from './useBudget';
import { useSyncStatus } from './useSync';
import { useCurrentSite } from './useSites';
import { PROJET_CONFIG, SEUILS_METEO_REPORT, SEUILS_CONFIDENCE } from '@/data/constants';

// ============================================================================
// P3-9: Historique des scores pour calcul de tendance
// ============================================================================
const SCORE_HISTORY_KEY = 'cockpit_confidence_score_history';
const HISTORY_MAX_DAYS = 30;

interface ScoreHistoryEntry {
  date: string; // YYYY-MM-DD
  score: number;
}

/**
 * Récupère l'historique des scores depuis localStorage
 */
function getScoreHistory(): ScoreHistoryEntry[] {
  try {
    const data = localStorage.getItem(SCORE_HISTORY_KEY);
    if (!data) return [];
    const history = JSON.parse(data) as ScoreHistoryEntry[];
    // Nettoyer les entrées de plus de HISTORY_MAX_DAYS jours
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - HISTORY_MAX_DAYS);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    return history.filter(e => e.date >= cutoffStr);
  } catch {
    return [];
  }
}

/**
 * Enregistre le score du jour dans l'historique
 */
function saveScoreToHistory(score: number): void {
  try {
    const today = new Date().toISOString().split('T')[0];
    const history = getScoreHistory();

    // Vérifier si on a déjà une entrée pour aujourd'hui
    const existingIndex = history.findIndex(e => e.date === today);
    if (existingIndex >= 0) {
      // Mettre à jour le score du jour
      history[existingIndex].score = score;
    } else {
      // Ajouter nouvelle entrée
      history.push({ date: today, score });
    }

    // Garder seulement les HISTORY_MAX_DAYS dernières entrées
    const cleaned = history.slice(-HISTORY_MAX_DAYS);
    localStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(cleaned));
  } catch {
    // Silently fail if localStorage is not available
  }
}

/**
 * Calcule la tendance basée sur l'historique des scores
 * Compare le score actuel avec la moyenne des 7 derniers jours
 */
function calculateTrendFromHistory(currentScore: number): 'up' | 'down' | 'stable' {
  const history = getScoreHistory();
  if (history.length < 3) {
    // Pas assez de données historiques
    return 'stable';
  }

  // Calculer la moyenne des 7 derniers jours (ou moins si pas assez de données)
  const recentHistory = history.slice(-7);
  const avgScore = recentHistory.reduce((sum, e) => sum + e.score, 0) / recentHistory.length;

  // Seuil de variation significative: 3 points
  const threshold = 3;
  if (currentScore > avgScore + threshold) return 'up';
  if (currentScore < avgScore - threshold) return 'down';
  return 'stable';
}

// Types
export interface ConfidenceFactorData {
  value: number;
  weight: number;
  score: number;
}

export interface ConfidenceScoreData {
  score: number;
  status: 'vert' | 'jaune' | 'rouge';
  trend: 'up' | 'down' | 'stable';
  factors: {
    velocite: ConfidenceFactorData & { weight: 0.30 };
    jalons: ConfidenceFactorData & { weight: 0.20 };
    risques: ConfidenceFactorData & { weight: 0.15 };
    occupation: ConfidenceFactorData & { weight: 0.15 };
    budget: ConfidenceFactorData & { weight: 0.10 };
    sync: ConfidenceFactorData & { weight: 0.10 };
  };
  daysToOpening: number;
  openingDate: string;
  /** Indique si les données sont insuffisantes pour un score fiable */
  insufficientData: boolean;
}

const WEIGHTS = {
  velocite: 0.30,
  jalons: 0.20,
  risques: 0.15,
  occupation: 0.15,
  budget: 0.10,
  sync: 0.10,
} as const;

/**
 * Normalise le statut d'action pour gérer les différentes nomenclatures
 * @returns statut normalisé en minuscules
 */
function normalizeActionStatus(statut: string): string {
  const s = statut?.toLowerCase() || '';
  // Mapping des différentes nomenclatures vers un format unifié
  if (s === 'fait' || s === 'termine' || s === 'terminé' || s === 'done') return 'termine';
  if (s === 'en_cours' || s === 'en cours' || s === 'in_progress') return 'en_cours';
  if (s === 'bloque' || s === 'bloqué' || s === 'blocked') return 'bloque';
  return s;
}

/**
 * Calcule le score de vélocité basé sur les actions terminées vs attendues
 * Retourne null si données insuffisantes
 */
function calculateVelocityScore(actions: { statut: string; date_fin_prevue: string }[]): number | null {
  // Données insuffisantes : retourner null pour signaler le problème
  if (actions.length === 0) return null;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Actions qui auraient dû être terminées (date fin <= aujourd'hui)
  const actionsDue = actions.filter(a => a.date_fin_prevue && a.date_fin_prevue <= todayStr);
  // Si aucune action n'est encore due, retourner null (pas assez de données)
  if (actionsDue.length === 0) return null;

  // Actions effectivement terminées parmi celles attendues (statut normalisé)
  const actionsCompleted = actionsDue.filter(a => normalizeActionStatus(a.statut) === 'termine').length;

  return Math.round((actionsCompleted / actionsDue.length) * 100);
}

/**
 * Normalise le statut de jalon pour gérer les différentes nomenclatures
 */
function normalizeMilestoneStatus(statut: string): string {
  const s = statut?.toLowerCase() || '';
  // Mapping des différentes nomenclatures
  if (s === 'atteint' || s === 'achieved' || s === 'done') return 'atteint';
  if (s === 'en_approche' || s === 'en approche' || s === 'approaching') return 'en_approche';
  if (s === 'a_venir' || s === 'à venir' || s === 'upcoming') return 'a_venir';
  if (s === 'en_danger' || s === 'at_risk') return 'en_danger';
  if (s === 'depasse' || s === 'dépassé' || s === 'overdue') return 'depasse';
  return s;
}

/**
 * Calcule le score des jalons (jalons atteints / jalons passés ou proches)
 * Retourne null si données insuffisantes
 */
function calculateMilestoneScore(jalons: { statut: string; date_prevue: string }[]): number | null {
  // Données insuffisantes
  if (jalons.length === 0) return null;

  const today = new Date();

  // Jalons passés ou à moins de 30 jours
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0];

  const relevantMilestones = jalons.filter(j => j.date_prevue && j.date_prevue <= thirtyDaysStr);
  // Si aucun jalon proche, données insuffisantes pour évaluer
  if (relevantMilestones.length === 0) return null;

  const achieved = relevantMilestones.filter(j => normalizeMilestoneStatus(j.statut) === 'atteint').length;
  const onTrack = relevantMilestones.filter(j => {
    const s = normalizeMilestoneStatus(j.statut);
    return s === 'en_approche' || s === 'a_venir';
  }).length;

  // Score: 100% pour atteints, 50% pour en approche/à venir, 0% pour en danger/dépassés
  const score = (achieved * 100 + onTrack * 50) / relevantMilestones.length;
  return Math.round(score);
}

/**
 * Calcule le score des risques (pénalité pour risques critiques)
 */
function calculateRiskScore(risques: { score?: number; status?: string }[]): number {
  const activeRisks = risques.filter(r => r.status !== 'closed' && r.status !== 'ferme');
  if (activeRisks.length === 0) return 100;

  // Seuils alignés sur matrice 5×5 (SEUILS_RISQUES: critique >= 16, majeur >= 10)
  const criticalRisks = activeRisks.filter(r => (r.score ?? 0) >= 16).length;
  // Risques majeurs (score 10-15)
  const majorRisks = activeRisks.filter(r => {
    const s = r.score ?? 0;
    return s >= 10 && s < 16;
  }).length;

  // Pénalité plafonnée pour éviter la saturation immédiate à 0
  const rawPenalty = criticalRisks * SEUILS_CONFIDENCE.penaliteRisqueCritique + majorRisks * SEUILS_CONFIDENCE.penaliteRisqueMajeur;
  const penalty = Math.min(rawPenalty, SEUILS_CONFIDENCE.maxPenalite);
  return Math.max(0, 100 - penalty);
}

/**
 * Calcule le score du budget
 */
function calculateBudgetScore(budgetSynthese: { tauxEngagement: number; tauxRealisation: number }): number {
  // Score basé sur l'écart entre engagement et prévision
  // Un écart de 0% = 100, un écart de 20%+ = 0
  const ecart = Math.abs(budgetSynthese.tauxEngagement - budgetSynthese.tauxRealisation);
  const overBudget = budgetSynthese.tauxRealisation > 100 ? budgetSynthese.tauxRealisation - 100 : 0;

  const score = Math.max(0, 100 - ecart * 2 - overBudget * 3);
  return Math.round(score);
}

/**
 * Calcule le score de synchronisation construction/mobilisation
 */
function calculateSyncScore(syncStatus: { ecart?: number; status?: string } | null): number {
  if (!syncStatus) return 100;

  // Basé sur l'écart de synchronisation
  const ecart = Math.abs(syncStatus.ecart ?? 0);

  // Status mapping
  if (syncStatus.status === 'critique') return 20;
  if (syncStatus.status === 'en_retard') return 50;
  if (syncStatus.status === 'en_avance') return 80;
  if (syncStatus.status === 'en_phase') return 100;

  // Fallback basé sur l'écart
  return Math.max(0, 100 - ecart * 2);
}

/**
 * Hook principal pour le score de confiance d'ouverture
 */
export function useConfidenceScore(): ConfidenceScoreData | null {
  const actions = useActions();
  const jalons = useJalons();
  const risques = useRisques();
  const dashboardKPIs = useDashboardKPIs();
  const budgetSynthese = useBudgetSynthese();
  const currentSite = useCurrentSite();
  const syncStatus = useSyncStatus(currentSite?.id ?? 1);

  const result = useMemo(() => {
    // Attendre que les données soient chargées
    if (!actions || !jalons || !dashboardKPIs) return null;

    // Date d'ouverture depuis config centralisée
    const openingDate = currentSite?.dateOuverture ?? PROJET_CONFIG.jalonsClés.softOpening;
    const today = new Date();
    const opening = new Date(openingDate);
    const daysToOpening = Math.ceil((opening.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Calcul des scores par facteur (peut retourner null si données insuffisantes)
    const velociteRaw = calculateVelocityScore(actions);
    const jalonsRaw = calculateMilestoneScore(jalons);
    const risquesValue = calculateRiskScore(risques);
    // CLAMP occupation entre 0 et 100 pour éviter débordement
    const occupationValue = Math.max(0, Math.min(100, Math.round(dashboardKPIs.tauxOccupation)));
    const budgetValue = calculateBudgetScore(budgetSynthese);
    const syncValue = calculateSyncScore(syncStatus);

    // Détection des données insuffisantes
    // Si vélocité OU jalons sont null, on a un projet sans données exploitables
    const insufficientData = velociteRaw === null || jalonsRaw === null;

    // Valeurs par défaut pour les facteurs avec données insuffisantes
    // On utilise 0 au lieu de 100 pour ne pas gonfler artificiellement le score
    const velociteValue = velociteRaw ?? 0;
    const jalonsValue = jalonsRaw ?? 0;

    // Application des poids
    const factors = {
      velocite: {
        value: velociteValue,
        weight: WEIGHTS.velocite as 0.30,
        score: velociteValue * WEIGHTS.velocite,
      },
      jalons: {
        value: jalonsValue,
        weight: WEIGHTS.jalons as 0.20,
        score: jalonsValue * WEIGHTS.jalons,
      },
      risques: {
        value: risquesValue,
        weight: WEIGHTS.risques as 0.15,
        score: risquesValue * WEIGHTS.risques,
      },
      occupation: {
        value: occupationValue,
        weight: WEIGHTS.occupation as 0.15,
        score: occupationValue * WEIGHTS.occupation,
      },
      budget: {
        value: budgetValue,
        weight: WEIGHTS.budget as 0.10,
        score: budgetValue * WEIGHTS.budget,
      },
      sync: {
        value: syncValue,
        weight: WEIGHTS.sync as 0.10,
        score: syncValue * WEIGHTS.sync,
      },
    };

    // Score global avec CLAMP obligatoire [0, 100]
    const rawScore = Math.round(
      factors.velocite.score +
      factors.jalons.score +
      factors.risques.score +
      factors.occupation.score +
      factors.budget.score +
      factors.sync.score
    );
    // CLAMP: score toujours entre 0 et 100
    const totalScore = Math.max(0, Math.min(100, rawScore));

    // Si données insuffisantes, forcer un score bas et statut rouge
    const finalScore = insufficientData ? Math.min(totalScore, 10) : totalScore;

    // Statut basé sur le score (seuils alignés avec SEUILS_METEO_REPORT)
    // Si données insuffisantes, toujours rouge
    const status: 'vert' | 'jaune' | 'rouge' = insufficientData
      ? 'rouge'
      : finalScore >= SEUILS_METEO_REPORT.globalBleu ? 'vert'
      : finalScore >= SEUILS_METEO_REPORT.scoreAlerte ? 'jaune'
      : 'rouge';

    // Tendance basée sur l'historique (P3-9)
    // Si données insuffisantes, toujours 'down'
    const trend: 'up' | 'down' | 'stable' = insufficientData
      ? 'down'
      : calculateTrendFromHistory(finalScore);

    return {
      score: finalScore,
      status,
      trend,
      factors,
      daysToOpening,
      openingDate,
      insufficientData,
    };
  }, [actions, jalons, risques, dashboardKPIs, budgetSynthese, syncStatus, currentSite]);

  // P3-9: Sauvegarder le score dans l'historique (effet secondaire)
  useEffect(() => {
    if (result && !result.insufficientData) {
      saveScoreToHistory(result.score);
    }
  }, [result?.score, result?.insufficientData]);

  return result;
}
