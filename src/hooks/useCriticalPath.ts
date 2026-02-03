/**
 * Hook pour l'Analyse du Chemin Critique
 * Identifie les actions critiques et les goulots d'étranglement
 */

import { useMemo } from 'react';
import { useActions } from './useActions';
import { useJalons } from './useJalons';
import { useUsers } from './useUsers';
import { useCurrentSite } from './useSites';
import type { Action, Jalon, User } from '@/types';

export interface CriticalAction {
  id: number;
  titre: string;
  responsable: string;
  responsableId: number;
  dateFinPrevue: string;
  margin: number;           // Jours de marge
  isBottleneck: boolean;
  successorsCount: number;
  statut: string;
  avancement: number;
  jalonId: number | null;
  jalonTitre?: string;
}

export interface CriticalPathData {
  criticalActions: CriticalAction[];
  bottlenecks: CriticalAction[];
  openingDate: string;
  daysToOpening: number;
  totalCriticalActions: number;
  actionsNoMargin: number;
  actionsLowMargin: number;
}

/**
 * Trouve le nom complet d'un utilisateur par son ID
 */
function getUserName(users: User[], userId: number): string {
  const user = users.find(u => u.id === userId);
  return user ? `${user.prenom} ${user.nom}` : 'Non assigné';
}

/**
 * Calcule la marge d'une action
 * Marge = date de fin prévue - date de début du plus proche successeur
 * Si pas de successeur, marge = jours jusqu'à l'ouverture
 */
function calculateMargin(
  action: Action,
  allActions: Action[],
  openingDate: string
): number {
  const actionEndDate = new Date(action.date_fin_prevue);
  const opening = new Date(openingDate);

  // Chercher les successeurs
  const successors = action.successeurs || [];

  if (successors.length === 0) {
    // Pas de successeur direct - marge jusqu'à l'ouverture
    const marginDays = Math.ceil((opening.getTime() - actionEndDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, marginDays);
  }

  // Trouver la date de début la plus proche parmi les successeurs
  let earliestSuccessorStart: Date | null = null;

  for (const successor of successors) {
    const successorAction = allActions.find(a => a.id_action === successor.id);
    if (successorAction) {
      const successorStart = new Date(successorAction.date_debut_prevue);
      if (!earliestSuccessorStart || successorStart < earliestSuccessorStart) {
        earliestSuccessorStart = successorStart;
      }
    }
  }

  if (!earliestSuccessorStart) {
    // Successeurs non trouvés - marge jusqu'à l'ouverture
    return Math.max(0, Math.ceil((opening.getTime() - actionEndDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  const marginDays = Math.ceil((earliestSuccessorStart.getTime() - actionEndDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, marginDays);
}

/**
 * Détermine si une action est un goulot d'étranglement
 * Critères: 3+ successeurs ET non terminée
 */
function isBottleneck(action: Action): boolean {
  const successors = action.successeurs || [];
  return successors.length >= 3 && action.statut !== 'termine';
}

/**
 * Compte le nombre de successeurs d'une action
 */
function countSuccessors(action: Action): number {
  return (action.successeurs || []).length;
}

/**
 * Hook principal pour l'analyse du chemin critique
 */
export function useCriticalPath(): CriticalPathData | null {
  const actions = useActions();
  const jalons = useJalons();
  const users = useUsers();
  const currentSite = useCurrentSite();

  return useMemo(() => {
    if (!actions || actions.length === 0) return null;

    // Date d'ouverture
    const openingDate = currentSite?.dateOuverture ?? '2026-11-15';
    const today = new Date();
    const opening = new Date(openingDate);
    const daysToOpening = Math.ceil((opening.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Créer un map des jalons pour lookup rapide
    const jalonMap = new Map<number, Jalon>();
    jalons.forEach(j => {
      if (j.id) jalonMap.set(j.id, j);
    });

    // Filtrer les actions non terminées
    const activeActions = actions.filter(a => a.statut !== 'termine' && a.statut !== 'annule');

    // Calculer les données pour chaque action
    const criticalActionsData: CriticalAction[] = activeActions.map(action => {
      const margin = calculateMargin(action, actions, openingDate);
      const successorsCount = countSuccessors(action);
      const bottleneck = isBottleneck(action);
      const jalonTitre = action.jalonId ? jalonMap.get(action.jalonId)?.titre : undefined;

      return {
        id: action.id!,
        titre: action.titre,
        responsable: getUserName(users, action.responsableId),
        responsableId: action.responsableId,
        dateFinPrevue: action.date_fin_prevue,
        margin,
        isBottleneck: bottleneck,
        successorsCount,
        statut: action.statut,
        avancement: action.avancement,
        jalonId: action.jalonId,
        jalonTitre,
      };
    });

    // Trier par marge (les plus critiques en premier)
    criticalActionsData.sort((a, b) => {
      // D'abord par marge
      if (a.margin !== b.margin) return a.margin - b.margin;
      // Puis par nombre de successeurs (desc)
      return b.successorsCount - a.successorsCount;
    });

    // Filtrer pour garder uniquement les actions vraiment critiques
    // (marge < 30 jours OU est un bottleneck)
    const criticalActions = criticalActionsData.filter(a =>
      a.margin < 30 || a.isBottleneck
    );

    // Bottlenecks
    const bottlenecks = criticalActionsData.filter(a => a.isBottleneck);

    // Statistiques
    const actionsNoMargin = criticalActionsData.filter(a => a.margin === 0).length;
    const actionsLowMargin = criticalActionsData.filter(a => a.margin > 0 && a.margin <= 7).length;

    return {
      criticalActions: criticalActions.slice(0, 20), // Limiter à 20 pour l'affichage
      bottlenecks,
      openingDate,
      daysToOpening,
      totalCriticalActions: criticalActions.length,
      actionsNoMargin,
      actionsLowMargin,
    };
  }, [actions, jalons, users, currentSite]);
}
