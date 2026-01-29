/**
 * Algorithme CPM (Critical Path Method) pour le calcul du chemin critique
 */

import type { TypeLien } from '@/types';
import type {
  InterdependencyGraph,
  DependencyNode,
  DependencyEdge,
} from '@/types/interdependency.types';
import { getSuccessors, getPredecessors, getEdge, getRootNodes, getLeafNodes } from './graphBuilder';

/**
 * Détecte les cycles dans le graphe via DFS
 * Retourne la liste des noeuds impliqués dans un cycle, ou undefined si pas de cycle
 */
function detectCycles(graph: InterdependencyGraph): string[] | undefined {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycleNodes: string[] = [];

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const successors = graph.edges
      .filter((e) => e.sourceId === nodeId)
      .map((e) => e.targetId);

    for (const succId of successors) {
      if (!visited.has(succId)) {
        if (dfs(succId)) {
          cycleNodes.push(nodeId);
          return true;
        }
      } else if (recursionStack.has(succId)) {
        cycleNodes.push(succId);
        cycleNodes.push(nodeId);
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const nodeId of graph.nodes.keys()) {
    if (!visited.has(nodeId)) {
      if (dfs(nodeId)) {
        return [...new Set(cycleNodes)];
      }
    }
  }

  return undefined;
}

/**
 * Calcule la contrainte de temps basée sur le type de lien
 * @param sourceNode Noeud source
 * @param edge Arête de dépendance
 * @returns Le temps minimum auquel la cible peut commencer/finir
 */
function calculateConstraint(
  sourceNode: DependencyNode,
  edge: DependencyEdge
): { startConstraint: number; endConstraint: number } {
  const lag = edge.lag || 0;
  const sourceDuration = sourceNode.action.duree_prevue_jours || 1;

  switch (edge.type) {
    case 'FS': // Finish-to-Start: la cible commence après la fin de la source
      return {
        startConstraint: sourceNode.EF + lag,
        endConstraint: -Infinity,
      };
    case 'SS': // Start-to-Start: la cible commence après le début de la source
      return {
        startConstraint: sourceNode.ES + lag,
        endConstraint: -Infinity,
      };
    case 'FF': // Finish-to-Finish: la cible finit après la fin de la source
      return {
        startConstraint: -Infinity,
        endConstraint: sourceNode.EF + lag,
      };
    case 'SF': // Start-to-Finish: la cible finit après le début de la source
      return {
        startConstraint: -Infinity,
        endConstraint: sourceNode.ES + lag,
      };
    default:
      return {
        startConstraint: sourceNode.EF + lag,
        endConstraint: -Infinity,
      };
  }
}

/**
 * Tri topologique du graphe (Kahn's algorithm)
 */
function topologicalSort(graph: InterdependencyGraph): string[] | null {
  const inDegree = new Map<string, number>();
  const queue: string[] = [];
  const result: string[] = [];

  // Initialiser les degrés entrants
  for (const nodeId of graph.nodes.keys()) {
    inDegree.set(nodeId, 0);
  }

  for (const edge of graph.edges) {
    inDegree.set(edge.targetId, (inDegree.get(edge.targetId) || 0) + 1);
  }

  // Ajouter les noeuds sans prédécesseurs
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    result.push(nodeId);

    const successors = graph.edges
      .filter((e) => e.sourceId === nodeId)
      .map((e) => e.targetId);

    for (const succId of successors) {
      const newDegree = (inDegree.get(succId) || 0) - 1;
      inDegree.set(succId, newDegree);
      if (newDegree === 0) {
        queue.push(succId);
      }
    }
  }

  // Si on n'a pas visité tous les noeuds, il y a un cycle
  if (result.length !== graph.nodes.size) {
    return null;
  }

  return result;
}

/**
 * Calcule le chemin critique et met à jour le graphe
 */
export function calculateCriticalPath(graph: InterdependencyGraph): InterdependencyGraph {
  // Vérifier les cycles
  const cycleNodes = detectCycles(graph);
  if (cycleNodes) {
    graph.stats.hasCycles = true;
    graph.stats.cycleNodes = cycleNodes;
    // On continue quand même pour les noeuds non impliqués dans le cycle
  }

  // Tri topologique
  const sortedNodes = topologicalSort(graph);
  if (!sortedNodes) {
    // En cas de cycle, utiliser un ordre basé sur les dates
    const nodeIds = Array.from(graph.nodes.keys());
    nodeIds.sort((a, b) => {
      const nodeA = graph.nodes.get(a)!;
      const nodeB = graph.nodes.get(b)!;
      return nodeA.ES - nodeB.ES;
    });
    return calculateCriticalPathWithOrder(graph, nodeIds);
  }

  return calculateCriticalPathWithOrder(graph, sortedNodes);
}

function calculateCriticalPathWithOrder(
  graph: InterdependencyGraph,
  sortedNodes: string[]
): InterdependencyGraph {
  // ========== FORWARD PASS ==========
  // Calcul de ES (Earliest Start) et EF (Earliest Finish)

  for (const nodeId of sortedNodes) {
    const node = graph.nodes.get(nodeId)!;
    const duration = node.action.duree_prevue_jours || 1;

    const predecessors = getPredecessors(graph, nodeId);

    if (predecessors.length === 0) {
      // Noeud racine: ES = 0 ou basé sur la date de début
      // On garde l'ES déjà calculé à partir des dates
      node.EF = node.ES + duration;
    } else {
      // ES = max des contraintes des prédécesseurs
      let maxStartConstraint = -Infinity;
      let maxEndConstraint = -Infinity;

      for (const pred of predecessors) {
        const edge = getEdge(graph, pred.id, nodeId);
        if (edge) {
          const { startConstraint, endConstraint } = calculateConstraint(pred, edge);
          maxStartConstraint = Math.max(maxStartConstraint, startConstraint);
          maxEndConstraint = Math.max(maxEndConstraint, endConstraint);
        }
      }

      // Pour FF et SF, on doit calculer ES à partir de EF
      if (maxEndConstraint > -Infinity) {
        // La contrainte est sur la fin
        node.EF = Math.max(maxEndConstraint, maxStartConstraint + duration);
        node.ES = node.EF - duration;
      } else {
        node.ES = Math.max(0, maxStartConstraint);
        node.EF = node.ES + duration;
      }
    }
  }

  // ========== BACKWARD PASS ==========
  // Calcul de LS (Latest Start) et LF (Latest Finish)

  // Trouver la date de fin du projet (max EF)
  let projectEnd = 0;
  for (const node of graph.nodes.values()) {
    projectEnd = Math.max(projectEnd, node.EF);
  }

  // Initialiser LF pour les noeuds feuilles
  const reversedNodes = [...sortedNodes].reverse();

  for (const nodeId of reversedNodes) {
    const node = graph.nodes.get(nodeId)!;
    const duration = node.action.duree_prevue_jours || 1;

    const successors = getSuccessors(graph, nodeId);

    if (successors.length === 0) {
      // Noeud feuille: LF = fin du projet
      node.LF = projectEnd;
      node.LS = node.LF - duration;
    } else {
      // LF = min des contraintes des successeurs
      let minFinishConstraint = Infinity;

      for (const succ of successors) {
        const edge = getEdge(graph, nodeId, succ.id);
        if (edge) {
          const lag = edge.lag || 0;

          switch (edge.type) {
            case 'FS':
              // Le successeur commence après notre fin
              minFinishConstraint = Math.min(minFinishConstraint, succ.LS - lag);
              break;
            case 'SS':
              // Le successeur commence après notre début
              minFinishConstraint = Math.min(minFinishConstraint, succ.LS - lag + duration);
              break;
            case 'FF':
              // Le successeur finit après notre fin
              minFinishConstraint = Math.min(minFinishConstraint, succ.LF - lag);
              break;
            case 'SF':
              // Le successeur finit après notre début
              minFinishConstraint = Math.min(minFinishConstraint, succ.LF - lag + duration);
              break;
          }
        }
      }

      node.LF = minFinishConstraint;
      node.LS = node.LF - duration;
    }

    // Calcul du slack (marge)
    node.slack = node.LS - node.ES;

    // Marquer comme critique si slack = 0 (avec tolérance pour erreurs d'arrondi)
    node.isCritical = Math.abs(node.slack) < 0.001;
  }

  // ========== IDENTIFIER LE CHEMIN CRITIQUE ==========
  const criticalPath: string[] = [];

  for (const nodeId of sortedNodes) {
    const node = graph.nodes.get(nodeId)!;
    if (node.isCritical) {
      criticalPath.push(nodeId);
    }
  }

  // Marquer les arêtes critiques
  for (const edge of graph.edges) {
    const sourceNode = graph.nodes.get(edge.sourceId);
    const targetNode = graph.nodes.get(edge.targetId);

    edge.isCritical =
      sourceNode?.isCritical === true && targetNode?.isCritical === true;
  }

  // Mettre à jour les stats
  graph.criticalPath = criticalPath;
  graph.totalDuration = projectEnd;
  graph.stats.criticalActions = criticalPath.length;

  return graph;
}

/**
 * Recalcule le chemin critique après une simulation de retard
 */
export function recalculateWithDelay(
  graph: InterdependencyGraph,
  nodeId: string,
  delayDays: number
): InterdependencyGraph {
  // Créer une copie profonde du graphe
  const newGraph: InterdependencyGraph = {
    ...graph,
    nodes: new Map(),
    edges: [...graph.edges.map((e) => ({ ...e }))],
    stats: { ...graph.stats },
  };

  // Copier les noeuds
  for (const [id, node] of graph.nodes) {
    newGraph.nodes.set(id, { ...node });
  }

  // Appliquer le retard au noeud spécifié
  const targetNode = newGraph.nodes.get(nodeId);
  if (targetNode) {
    targetNode.ES += delayDays;
    targetNode.EF += delayDays;
    targetNode.simulatedDelay = delayDays;
  }

  // Recalculer le chemin critique
  return calculateCriticalPath(newGraph);
}
