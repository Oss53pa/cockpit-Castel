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
import { PROJET_CONFIG, SEUILS_CHEMIN_CRITIQUE, AXES_CONFIG_FULL } from '@/data/constants';

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
  axe: string;              // Code axe (axe1_rh, axe2_commercial, etc.)
  axeLabel: string;         // Label court (Opérations, Technique, etc.)
  phase: string | null;     // Phase jalon (SOFT OPENING, HANDOVER, etc.)
  predecesseursTitres: string[];  // Titres des actions prédécesseurs
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

// Dérivé de AXES_CONFIG_FULL pour éviter la duplication
const AXE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  Object.values(AXES_CONFIG_FULL).map(a => [a.code, a.labelCourt])
);

const PHASE_REF_MAP: Record<string, string> = {
  dateSoftOpening: 'SOFT OPENING',
  dateDebutMobilisation: 'MOBILISATION',
  dateDebutConstruction: 'CONSTRUCTION',
  dateFinMobilisation: 'CLÔTURE',
};

function derivePhaseLabel(action: Action, jalon: Jalon | undefined): string | null {
  if (action.jalon_reference && PHASE_REF_MAP[action.jalon_reference]) {
    return PHASE_REF_MAP[action.jalon_reference];
  }
  if (jalon?.titre) {
    const t = jalon.titre.toLowerCase();
    if (t.includes('soft') || t.includes('pré-ouverture') || t.includes('ouverture')) return 'SOFT OPENING';
    if (t.includes('commerc') || t.includes('leasing')) return 'COMMERCIALISATION';
    if (t.includes('handover') || t.includes('réception') || t.includes('technique')) return 'HANDOVER';
    if (t.includes('mobilis')) return 'MOBILISATION';
    if (t.includes('budget') || t.includes('financ')) return 'BUDGET';
    if (t.includes('construct')) return 'CONSTRUCTION';
    return jalon.titre.length > 20 ? jalon.titre.substring(0, 20).toUpperCase() : jalon.titre.toUpperCase();
  }
  return null;
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
 *
 * DÉFINITION AMÉLIORÉE (P1-4 AUDIT):
 * Un goulot est une action qui peut bloquer plusieurs autres actions.
 *
 * Critères pondérés:
 * 1. Nombre de successeurs directs >= seuil (impact direct)
 * 2. Est sur le chemin critique (marge faible)
 * 3. A des prédécesseurs non terminés (cascade de retards)
 *
 * NOTE: Pour une analyse CPM complète, utiliser criticalPath.ts.
 * Ce hook utilise une heuristique simplifiée pour la performance.
 *
 * TODO P1-4: Intégrer calculateCriticalPath() de lib/interdependency/criticalPath.ts
 * pour calculer le vrai slack PMI (LS - ES) au lieu de l'approximation par dates.
 */
function isBottleneck(action: Action, margin: number, allActions: Action[]): boolean {
  const successors = action.successeurs || [];
  const predecessors = action.predecesseurs || [];

  // Critère 1: Nombre de successeurs (impact direct)
  const hasManySucessors = successors.length >= SEUILS_CHEMIN_CRITIQUE.seuilGoulot;

  // Critère 2: Marge faible (sur chemin critique ou proche)
  const isOnCriticalPath = margin <= SEUILS_CHEMIN_CRITIQUE.margeFaible;

  // Critère 3: Prédécesseurs non terminés (risque de cascade)
  const hasBlockingPredecessors = predecessors.some(p => {
    const predAction = allActions.find(a => a.id_action === p.id);
    return predAction && predAction.statut !== 'termine' && predAction.statut !== 'annule';
  });

  // Un goulot si:
  // - Beaucoup de successeurs OU
  // - Sur chemin critique avec au moins 1 successeur ET des prédécesseurs bloquants
  const isBottleneckBySuccessors = hasManySucessors && action.statut !== 'termine';
  const isBottleneckByCriticalChain = isOnCriticalPath &&
                                       successors.length >= 1 &&
                                       hasBlockingPredecessors &&
                                       action.statut !== 'termine';

  return isBottleneckBySuccessors || isBottleneckByCriticalChain;
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
    const openingDate = currentSite?.dateOuverture ?? PROJET_CONFIG.jalonsClés.softOpening;
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

    // Map id_action → titre pour lookup prédécesseurs
    const actionTitreMap = new Map<string, string>();
    actions.forEach(a => actionTitreMap.set(a.id_action, a.titre));

    // Calculer les données pour chaque action
    const criticalActionsData: CriticalAction[] = activeActions.map(action => {
      const margin = calculateMargin(action, actions, openingDate);
      const successorsCount = countSuccessors(action);
      // Passer margin et allActions pour une détection améliorée des goulots
      const bottleneck = isBottleneck(action, margin, actions);
      const jalon = action.jalonId ? jalonMap.get(action.jalonId) : undefined;
      const jalonTitre = jalon?.titre;

      // Prédécesseurs
      const predecesseursTitres = (action.predecesseurs || [])
        .map(p => actionTitreMap.get(p.id) ?? p.titre)
        .filter(Boolean);

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
        axe: action.axe,
        axeLabel: AXE_LABEL_MAP[action.axe] ?? action.axe,
        phase: derivePhaseLabel(action, jalon),
        predecesseursTitres,
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
      a.margin < SEUILS_CHEMIN_CRITIQUE.margeCritique || a.isBottleneck
    );

    // Bottlenecks
    const bottlenecks = criticalActionsData.filter(a => a.isBottleneck);

    // Statistiques
    const actionsNoMargin = criticalActionsData.filter(a => a.margin === 0).length;
    const actionsLowMargin = criticalActionsData.filter(a => a.margin > 0 && a.margin <= SEUILS_CHEMIN_CRITIQUE.margeFaible).length;

    return {
      criticalActions: criticalActions.slice(0, SEUILS_CHEMIN_CRITIQUE.topActions),
      bottlenecks,
      openingDate,
      daysToOpening,
      totalCriticalActions: criticalActions.length,
      actionsNoMargin,
      actionsLowMargin,
    };
  }, [actions, jalons, users, currentSite]);
}
