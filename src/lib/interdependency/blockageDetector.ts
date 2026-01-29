/**
 * Détection des blocages basée sur les dépendances et les statuts
 */

import type { ActionStatus, TypeLien } from '@/types';
import type {
  InterdependencyGraph,
  DependencyNode,
  BlockageInfo,
} from '@/types/interdependency.types';
import { getPredecessors, getEdge } from './graphBuilder';

/**
 * Statuts considérés comme "terminés"
 */
const COMPLETED_STATUSES: ActionStatus[] = ['terminee', 'annulee'];

/**
 * Statuts considérés comme "démarrés"
 */
const STARTED_STATUSES: ActionStatus[] = ['en_cours', 'terminee'];

/**
 * Vérifie si une action est bloquée selon son type de lien
 */
function isBlockedByDependency(
  predecessorStatus: ActionStatus,
  linkType: TypeLien
): boolean {
  switch (linkType) {
    case 'FS': // Finish-to-Start: le prédécesseur doit être terminé
      return !COMPLETED_STATUSES.includes(predecessorStatus);

    case 'SS': // Start-to-Start: le prédécesseur doit être démarré
      return !STARTED_STATUSES.includes(predecessorStatus);

    case 'FF': // Finish-to-Finish: pas de blocage au démarrage
      // FF ne bloque que la fin, pas le début
      return false;

    case 'SF': // Start-to-Finish: le prédécesseur doit être démarré pour finir
      // SF est rare et ne bloque pas le début
      return false;

    default:
      return !COMPLETED_STATUSES.includes(predecessorStatus);
  }
}

/**
 * Génère le message de raison du blocage
 */
function getBlockageReason(
  predecessorTitle: string,
  predecessorStatus: ActionStatus,
  linkType: TypeLien
): string {
  const statusLabels: Record<ActionStatus, string> = {
    non_demarree: 'non démarrée',
    en_cours: 'en cours',
    en_attente: 'en attente',
    bloquee: 'bloquée',
    terminee: 'terminée',
    annulee: 'annulée',
  };

  const linkLabels: Record<TypeLien, string> = {
    FS: 'doit être terminée avant le début',
    SS: 'doit être démarrée avant le début',
    FF: 'doit être terminée avant la fin',
    SF: 'doit être démarrée avant la fin',
  };

  return `"${predecessorTitle}" (${statusLabels[predecessorStatus]}) ${linkLabels[linkType]}`;
}

/**
 * Détecte tous les blocages dans le graphe
 */
export function detectBlockages(graph: InterdependencyGraph): BlockageInfo[] {
  const blockages: BlockageInfo[] = [];

  for (const [nodeId, node] of graph.nodes) {
    // Une action terminée ou annulée ne peut pas être bloquée
    if (COMPLETED_STATUSES.includes(node.action.statut)) {
      node.isBlocked = false;
      node.blockingReason = undefined;
      continue;
    }

    const predecessors = getPredecessors(graph, nodeId);
    let isBlocked = false;
    let blockingReason: string | undefined;

    for (const pred of predecessors) {
      const edge = getEdge(graph, pred.id, nodeId);
      if (!edge) continue;

      if (isBlockedByDependency(pred.action.statut, edge.type)) {
        isBlocked = true;
        blockingReason = getBlockageReason(
          pred.action.titre,
          pred.action.statut,
          edge.type
        );

        blockages.push({
          blockedActionId: nodeId,
          blockedActionTitle: node.action.titre,
          blockingActionId: pred.id,
          blockingActionTitle: pred.action.titre,
          dependencyType: edge.type,
          reason: blockingReason,
        });

        // On garde seulement le premier blocage pour l'affichage
        break;
      }
    }

    node.isBlocked = isBlocked;
    node.blockingReason = blockingReason;
  }

  // Mettre à jour les stats
  graph.stats.blockedActions = blockages.length;

  return blockages;
}

/**
 * Vérifie si une action spécifique est bloquée
 */
export function isActionBlocked(
  graph: InterdependencyGraph,
  actionId: string
): { blocked: boolean; reason?: string } {
  const node = graph.nodes.get(actionId);
  if (!node) {
    return { blocked: false };
  }

  return {
    blocked: node.isBlocked,
    reason: node.blockingReason,
  };
}

/**
 * Récupère la chaîne de blocage complète (tous les ancêtres bloquants)
 */
export function getBlockageChain(
  graph: InterdependencyGraph,
  actionId: string
): string[] {
  const chain: string[] = [];
  const visited = new Set<string>();

  function traverse(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = graph.nodes.get(nodeId);
    if (!node) return;

    const predecessors = getPredecessors(graph, nodeId);

    for (const pred of predecessors) {
      const edge = getEdge(graph, pred.id, nodeId);
      if (!edge) continue;

      if (isBlockedByDependency(pred.action.statut, edge.type)) {
        chain.push(pred.id);
        traverse(pred.id);
      }
    }
  }

  traverse(actionId);
  return chain;
}

/**
 * Récupère toutes les actions qui seraient débloquées si une action était terminée
 */
export function getUnblockableActions(
  graph: InterdependencyGraph,
  actionId: string
): string[] {
  const unblockable: string[] = [];

  // Trouver tous les successeurs directs
  const successorEdges = graph.edges.filter((e) => e.sourceId === actionId);

  for (const edge of successorEdges) {
    const successorNode = graph.nodes.get(edge.targetId);
    if (!successorNode) continue;

    // Vérifier si cette action est actuellement bloquée par notre action
    if (successorNode.isBlocked) {
      const predecessors = getPredecessors(graph, edge.targetId);

      // Compter combien de prédécesseurs bloquent encore
      let blockingCount = 0;
      for (const pred of predecessors) {
        if (pred.id === actionId) continue; // Exclure l'action qu'on simule comme terminée

        const predEdge = getEdge(graph, pred.id, edge.targetId);
        if (predEdge && isBlockedByDependency(pred.action.statut, predEdge.type)) {
          blockingCount++;
        }
      }

      // Si c'était le seul bloqueur, l'action serait débloquée
      if (blockingCount === 0) {
        unblockable.push(edge.targetId);
      }
    }
  }

  return unblockable;
}
