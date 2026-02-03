/**
 * Hook pour calculer le Score de Confiance d'Ouverture
 * Agrège plusieurs facteurs pondérés pour estimer la probabilité d'ouvrir à temps
 */

import { useMemo } from 'react';
import { useActions } from './useActions';
import { useJalons } from './useJalons';
import { useRisques } from './useRisques';
import { useDashboardKPIs } from './useDashboard';
import { useBudgetSynthese } from './useBudget';
import { useSyncStatus } from './useSync';
import { useCurrentSite } from './useSites';

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
 * Calcule le score de vélocité basé sur les actions terminées vs attendues
 */
function calculateVelocityScore(actions: { statut: string; date_fin_prevue: string }[]): number {
  if (actions.length === 0) return 100;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Actions qui auraient dû être terminées (date fin <= aujourd'hui)
  const actionsDue = actions.filter(a => a.date_fin_prevue <= todayStr);
  if (actionsDue.length === 0) return 100;

  // Actions effectivement terminées parmi celles attendues
  const actionsCompleted = actionsDue.filter(a => a.statut === 'termine').length;

  return Math.round((actionsCompleted / actionsDue.length) * 100);
}

/**
 * Calcule le score des jalons (jalons atteints / jalons passés ou proches)
 */
function calculateMilestoneScore(jalons: { statut: string; date_prevue: string }[]): number {
  if (jalons.length === 0) return 100;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Jalons passés ou à moins de 30 jours
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0];

  const relevantMilestones = jalons.filter(j => j.date_prevue <= thirtyDaysStr);
  if (relevantMilestones.length === 0) return 100;

  const achieved = relevantMilestones.filter(j => j.statut === 'atteint').length;
  const onTrack = relevantMilestones.filter(j =>
    j.statut === 'en_approche' || j.statut === 'a_venir'
  ).length;

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

  // Risques critiques (score >= 12)
  const criticalRisks = activeRisks.filter(r => (r.score ?? 0) >= 12).length;
  // Risques majeurs (score 8-11)
  const majorRisks = activeRisks.filter(r => {
    const s = r.score ?? 0;
    return s >= 8 && s < 12;
  }).length;

  // Pénalité: -20 par risque critique, -10 par risque majeur
  const penalty = criticalRisks * 20 + majorRisks * 10;
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

  return useMemo(() => {
    // Attendre que les données soient chargées
    if (!actions || !jalons || !dashboardKPIs) return null;

    // Date d'ouverture
    const openingDate = currentSite?.dateOuverture ?? '2026-11-15';
    const today = new Date();
    const opening = new Date(openingDate);
    const daysToOpening = Math.ceil((opening.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Calcul des scores par facteur
    const velociteValue = calculateVelocityScore(actions);
    const jalonsValue = calculateMilestoneScore(jalons);
    const risquesValue = calculateRiskScore(risques);
    const occupationValue = Math.round(dashboardKPIs.tauxOccupation);
    const budgetValue = calculateBudgetScore(budgetSynthese);
    const syncValue = calculateSyncScore(syncStatus);

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

    // Score global
    const totalScore = Math.round(
      factors.velocite.score +
      factors.jalons.score +
      factors.risques.score +
      factors.occupation.score +
      factors.budget.score +
      factors.sync.score
    );

    // Statut basé sur le score
    const status: 'vert' | 'jaune' | 'rouge' =
      totalScore >= 80 ? 'vert' :
      totalScore >= 50 ? 'jaune' : 'rouge';

    // Tendance (simplifiée - stable pour l'instant, pourrait être basée sur historique)
    const trend: 'up' | 'down' | 'stable' =
      velociteValue > 80 && jalonsValue > 70 ? 'up' :
      velociteValue < 50 || risquesValue < 50 ? 'down' : 'stable';

    return {
      score: totalScore,
      status,
      trend,
      factors,
      daysToOpening,
      openingDate,
    };
  }, [actions, jalons, risques, dashboardKPIs, budgetSynthese, syncStatus, currentSite]);
}
