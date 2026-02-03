/**
 * Types pour le diagramme d'interdépendance des actions
 * Utilise les types existants TypeLien et Dependance de src/types/index.ts
 */

import type { Action, Axe, TypeLien, ActionStatus } from './index';

/**
 * Noeud du graphe de dépendances avec calculs CPM (Critical Path Method)
 */
export interface DependencyNode {
  id: string; // id_action
  action: Action;

  // Position dans le graphe (calculée par layout)
  x: number;
  y: number;
  level: number; // Niveau topologique (colonne)

  // Valeurs CPM (en jours depuis le début du projet)
  ES: number; // Earliest Start
  EF: number; // Earliest Finish
  LS: number; // Latest Start
  LF: number; // Latest Finish
  slack: number; // Marge = LS - ES ou LF - EF

  // Flags
  isCritical: boolean; // Sur le chemin critique (slack = 0)
  isBlocked: boolean; // Predecesseur non terminé
  blockingReason?: string; // Raison du blocage

  // Pour simulation What-If
  simulatedDelay?: number;
  isImpacted?: boolean;
  impactDelay?: number;
}

/**
 * Arête du graphe (lien de dépendance)
 */
export interface DependencyEdge {
  id: string;
  sourceId: string; // id_action source
  targetId: string; // id_action cible
  type: TypeLien; // FS, FF, SS, SF
  lag: number; // decalage_jours

  // Flags
  isCritical: boolean; // Sur le chemin critique
  isImpacted?: boolean; // Impacté par simulation
}

/**
 * Graphe complet des interdépendances
 */
export interface InterdependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: DependencyEdge[];

  // Métadonnées
  criticalPath: string[]; // IDs des actions sur le chemin critique
  totalDuration: number; // Durée totale du projet (jours)
  projectStart: Date;
  projectEnd: Date;

  // Statistiques
  stats: {
    totalActions: number;
    totalDependencies: number;
    blockedActions: number;
    criticalActions: number;
    hasCycles: boolean;
    cycleNodes?: string[]; // IDs des actions dans un cycle
  };
}

/**
 * Résultat d'une simulation What-If
 */
export interface WhatIfScenario {
  sourceActionId: string;
  delayDays: number;

  // Impact
  impactedActions: Array<{
    actionId: string;
    originalES: number;
    newES: number;
    delay: number;
  }>;

  // Impact global
  originalProjectEnd: Date;
  newProjectEnd: Date;
  totalDelayDays: number;
  criticalPathAffected: boolean;
  newCriticalPath: string[];
}

/**
 * Filtres pour l'UI du diagramme
 */
export interface InterdependencyFilters {
  axe?: Axe;
  jalonId?: number;
  showCriticalOnly?: boolean;
  showBlockedOnly?: boolean;
  statuses?: ActionStatus[];
}

/**
 * État de la vue du diagramme
 */
export interface InterdependencyViewState {
  zoom: number;
  pan: { x: number; y: number };
  selectedNodeId: string | null;
  highlightedPath: string[]; // IDs des noeuds à mettre en évidence
  whatIfMode: boolean;
  whatIfDelay: number;
}

/**
 * Dimensions d'un noeud dans le diagramme
 */
export interface NodeDimensions {
  width: number;
  height: number;
  padding: number;
  marginX: number;
  marginY: number;
}

/**
 * Configuration du layout
 */
export interface LayoutConfig {
  nodeDimensions: NodeDimensions;
  levelSpacing: number; // Espacement horizontal entre niveaux
  nodeSpacing: number; // Espacement vertical entre noeuds du même niveau
  startX: number;
  startY: number;
}

/**
 * Résultat de la détection de blocages
 */
export interface BlockageInfo {
  blockedActionId: string;
  blockedActionTitle: string;
  blockingActionId: string;
  blockingActionTitle: string;
  dependencyType: TypeLien;
  reason: string;
}

/**
 * Type pour les couleurs d'axe (hex)
 */
export interface AxeColorSet {
  bg: string;
  light: string;
  dark: string;
}

// Couleurs unifiées avec AXES_CONFIG_FULL de constants.ts
export const AXE_COLORS: Record<Axe, AxeColorSet> = {
  axe1_rh: { bg: '#EF4444', light: '#FEE2E2', dark: '#B91C1C' },
  axe2_commercial: { bg: '#3B82F6', light: '#DBEAFE', dark: '#1E40AF' },
  axe3_technique: { bg: '#8B5CF6', light: '#EDE9FE', dark: '#5B21B6' },
  axe4_budget: { bg: '#F59E0B', light: '#FEF3C7', dark: '#B45309' },
  axe5_marketing: { bg: '#EC4899', light: '#FCE7F3', dark: '#9D174D' },
  axe6_exploitation: { bg: '#10B981', light: '#D1FAE5', dark: '#065F46' },
};

/**
 * Styles pour les types de dépendances
 */
export const DEPENDENCY_STYLES: Record<TypeLien, { dashArray: string; label: string }> = {
  FS: { dashArray: '', label: 'Fin-Début' },
  SS: { dashArray: '5,5', label: 'Début-Début' },
  FF: { dashArray: '5,5', label: 'Fin-Fin' },
  SF: { dashArray: '10,5', label: 'Début-Fin' },
};
