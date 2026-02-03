/**
 * Hook pour la Projection du Taux d'Occupation
 * Projette le taux d'occupation à l'ouverture basé sur la progression commerciale
 */

import { useMemo } from 'react';
import { useActions } from './useActions';
import { useDashboardKPIs } from './useDashboard';
import { useCurrentSite } from './useSites';

export interface TimelinePoint {
  date: string;
  rate: number;
  isProjection: boolean;
}

export interface OccupancyProjectionData {
  currentRate: number;
  targetRate: number;              // 85% par défaut
  projectedRateAtOpening: number;
  monthlyProgressionRate: number;
  gap: number;
  gapStatus: 'on_track' | 'at_risk' | 'critical';
  timeline: TimelinePoint[];
  recommendations: string[];
  daysToOpening: number;
  openingDate: string;
}

/**
 * Génère les recommandations basées sur l'écart
 */
function generateRecommendations(
  gap: number,
  monthlyRate: number,
  currentRate: number,
  daysToOpening: number
): string[] {
  const recommendations: string[] = [];

  if (gap <= 0) {
    recommendations.push('Objectif d\'occupation atteignable dans les délais actuels.');
  } else {
    // Calcul du taux mensuel nécessaire pour combler l'écart
    const monthsLeft = daysToOpening / 30;
    const requiredMonthlyRate = gap / monthsLeft;

    if (requiredMonthlyRate > monthlyRate * 1.5) {
      recommendations.push(`Accélérer les négociations commerciales de ${Math.round((requiredMonthlyRate / monthlyRate - 1) * 100)}%`);
    }

    if (currentRate < 30) {
      recommendations.push('Prioriser les enseignes locomotives pour attirer d\'autres preneurs');
    }

    if (gap > 20) {
      recommendations.push('Envisager des conditions commerciales plus attractives temporairement');
      recommendations.push('Renforcer l\'équipe commerciale ou faire appel à des partenaires');
    }

    if (gap > 10 && gap <= 20) {
      recommendations.push('Intensifier les relances sur les prospects chauds');
      recommendations.push('Organiser des événements B2B pour accélérer les signatures');
    }

    if (daysToOpening < 180 && gap > 5) {
      recommendations.push('Activer le plan de contingence commerciale');
    }
  }

  return recommendations.slice(0, 4); // Limiter à 4 recommandations
}

/**
 * Génère la timeline de projection
 */
function generateTimeline(
  currentRate: number,
  monthlyRate: number,
  openingDate: string,
  targetRate: number
): TimelinePoint[] {
  const timeline: TimelinePoint[] = [];
  const today = new Date();
  const opening = new Date(openingDate);

  // Point actuel
  timeline.push({
    date: today.toISOString().split('T')[0],
    rate: currentRate,
    isProjection: false,
  });

  // Points intermédiaires (chaque mois)
  const currentDate = new Date(today);
  currentDate.setMonth(currentDate.getMonth() + 1);
  let projectedRate = currentRate;

  while (currentDate <= opening) {
    projectedRate = Math.min(100, projectedRate + monthlyRate);
    timeline.push({
      date: currentDate.toISOString().split('T')[0],
      rate: Math.round(projectedRate * 10) / 10,
      isProjection: true,
    });
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Point d'ouverture
  if (timeline[timeline.length - 1]?.date !== openingDate) {
    timeline.push({
      date: openingDate,
      rate: Math.round(Math.min(100, projectedRate + monthlyRate) * 10) / 10,
      isProjection: true,
    });
  }

  return timeline;
}

/**
 * Hook principal pour la projection d'occupation
 */
export function useOccupancyProjection(): OccupancyProjectionData | null {
  const actions = useActions();
  const dashboardKPIs = useDashboardKPIs();
  const currentSite = useCurrentSite();

  return useMemo(() => {
    if (!actions || !dashboardKPIs) return null;

    // Configuration
    const openingDate = currentSite?.dateOuverture ?? '2026-11-15';
    const targetRate = currentSite?.occupationCible ?? 85;

    const today = new Date();
    const opening = new Date(openingDate);
    const daysToOpening = Math.ceil((opening.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const monthsToOpening = daysToOpening / 30;

    // Taux d'occupation actuel
    const currentRate = dashboardKPIs.tauxOccupation;

    // Calculer le taux de progression mensuel
    // Basé sur les actions commerciales terminées récemment
    const commercialActions = actions.filter(a => a.axe === 'axe2_commercial');
    const totalCommercial = commercialActions.length;
    const completedCommercial = commercialActions.filter(a => a.statut === 'termine').length;

    // Actions terminées dans les 60 derniers jours
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const recentlyCompleted = commercialActions.filter(a => {
      if (a.statut !== 'termine' || !a.date_fin_reelle) return false;
      return new Date(a.date_fin_reelle) >= sixtyDaysAgo;
    }).length;

    // Taux de progression mensuel estimé
    // (recentlyCompleted / totalCommercial) * 100 / 2 mois = progression par mois
    const monthlyProgressionRate = totalCommercial > 0
      ? (recentlyCompleted / totalCommercial) * 100 / 2
      : 2; // Default 2% par mois si pas de données

    // Projection à l'ouverture
    const projectedRateAtOpening = Math.min(100, currentRate + (monthlyProgressionRate * monthsToOpening));

    // Écart avec l'objectif
    const gap = targetRate - projectedRateAtOpening;

    // Statut de l'écart
    let gapStatus: 'on_track' | 'at_risk' | 'critical';
    if (gap <= 0) {
      gapStatus = 'on_track';
    } else if (gap <= 10) {
      gapStatus = 'at_risk';
    } else {
      gapStatus = 'critical';
    }

    // Générer la timeline
    const timeline = generateTimeline(currentRate, monthlyProgressionRate, openingDate, targetRate);

    // Générer les recommandations
    const recommendations = generateRecommendations(gap, monthlyProgressionRate, currentRate, daysToOpening);

    return {
      currentRate: Math.round(currentRate * 10) / 10,
      targetRate,
      projectedRateAtOpening: Math.round(projectedRateAtOpening * 10) / 10,
      monthlyProgressionRate: Math.round(monthlyProgressionRate * 10) / 10,
      gap: Math.round(gap * 10) / 10,
      gapStatus,
      timeline,
      recommendations,
      daysToOpening,
      openingDate,
    };
  }, [actions, dashboardKPIs, currentSite]);
}
