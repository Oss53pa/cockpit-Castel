/**
 * Algorithme de positionnement des noeuds (Sugiyama simplifié)
 */

import type {
  InterdependencyGraph,
  DependencyNode,
  LayoutConfig,
  NodeDimensions,
} from '@/types/interdependency.types';

/**
 * Configuration par défaut du layout
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  nodeDimensions: {
    width: 180,
    height: 80,
    padding: 12,
    marginX: 60,
    marginY: 30,
  },
  levelSpacing: 250, // Espacement horizontal entre colonnes
  nodeSpacing: 100, // Espacement vertical entre noeuds
  startX: 50,
  startY: 50,
};

/**
 * Assigne les niveaux topologiques aux noeuds (colonnes)
 */
function assignLevels(graph: InterdependencyGraph): Map<string, number> {
  const levels = new Map<string, number>();
  const inDegree = new Map<string, number>();

  // Calculer les degrés entrants
  for (const nodeId of graph.nodes.keys()) {
    inDegree.set(nodeId, 0);
  }
  for (const edge of graph.edges) {
    inDegree.set(edge.targetId, (inDegree.get(edge.targetId) || 0) + 1);
  }

  // BFS pour assigner les niveaux
  const queue: string[] = [];

  // Noeuds racines (niveau 0)
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      levels.set(nodeId, 0);
      queue.push(nodeId);
    }
  }

  // Si pas de racines (cycle?), commencer par n'importe quel noeud
  if (queue.length === 0 && graph.nodes.size > 0) {
    const firstNode = graph.nodes.keys().next().value;
    if (firstNode) {
      levels.set(firstNode, 0);
      queue.push(firstNode);
    }
  }

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const currentLevel = levels.get(nodeId) || 0;

    // Trouver les successeurs
    const successorEdges = graph.edges.filter((e) => e.sourceId === nodeId);

    for (const edge of successorEdges) {
      const existingLevel = levels.get(edge.targetId);

      // Le successeur doit être au moins au niveau suivant
      const newLevel = currentLevel + 1;

      if (existingLevel === undefined || newLevel > existingLevel) {
        levels.set(edge.targetId, newLevel);
        queue.push(edge.targetId);
      }
    }
  }

  // Gérer les noeuds isolés (sans connexions)
  for (const nodeId of graph.nodes.keys()) {
    if (!levels.has(nodeId)) {
      levels.set(nodeId, 0);
    }
  }

  return levels;
}

/**
 * Groupe les noeuds par niveau
 */
function groupByLevel(
  graph: InterdependencyGraph,
  levels: Map<string, number>
): Map<number, string[]> {
  const groups = new Map<number, string[]>();

  for (const [nodeId, level] of levels) {
    if (!groups.has(level)) {
      groups.set(level, []);
    }
    groups.get(level)!.push(nodeId);
  }

  return groups;
}

/**
 * Minimise les croisements d'arêtes via ordonnancement barycentrique
 */
function minimizeCrossings(
  graph: InterdependencyGraph,
  groups: Map<number, string[]>
): Map<number, string[]> {
  const maxLevel = Math.max(...groups.keys());

  // Plusieurs passes pour améliorer l'ordonnancement
  for (let pass = 0; pass < 4; pass++) {
    // Passe descendante (niveau 0 -> max)
    for (let level = 1; level <= maxLevel; level++) {
      const nodes = groups.get(level);
      if (!nodes || nodes.length <= 1) continue;

      const barycenters = new Map<string, number>();

      for (const nodeId of nodes) {
        // Calculer le barycentre basé sur les prédécesseurs
        const predecessorEdges = graph.edges.filter((e) => e.targetId === nodeId);
        const predecessorPositions = predecessorEdges
          .map((e) => {
            const predLevel = level - 1;
            const predNodes = groups.get(predLevel) || [];
            return predNodes.indexOf(e.sourceId);
          })
          .filter((pos) => pos >= 0);

        if (predecessorPositions.length > 0) {
          const avg =
            predecessorPositions.reduce((a, b) => a + b, 0) /
            predecessorPositions.length;
          barycenters.set(nodeId, avg);
        } else {
          barycenters.set(nodeId, nodes.indexOf(nodeId));
        }
      }

      // Trier par barycentre
      nodes.sort((a, b) => (barycenters.get(a) || 0) - (barycenters.get(b) || 0));
    }

    // Passe ascendante (niveau max -> 0)
    for (let level = maxLevel - 1; level >= 0; level--) {
      const nodes = groups.get(level);
      if (!nodes || nodes.length <= 1) continue;

      const barycenters = new Map<string, number>();

      for (const nodeId of nodes) {
        // Calculer le barycentre basé sur les successeurs
        const successorEdges = graph.edges.filter((e) => e.sourceId === nodeId);
        const successorPositions = successorEdges
          .map((e) => {
            const succLevel = level + 1;
            const succNodes = groups.get(succLevel) || [];
            return succNodes.indexOf(e.targetId);
          })
          .filter((pos) => pos >= 0);

        if (successorPositions.length > 0) {
          const avg =
            successorPositions.reduce((a, b) => a + b, 0) /
            successorPositions.length;
          barycenters.set(nodeId, avg);
        } else {
          barycenters.set(nodeId, nodes.indexOf(nodeId));
        }
      }

      // Trier par barycentre
      nodes.sort((a, b) => (barycenters.get(a) || 0) - (barycenters.get(b) || 0));
    }
  }

  return groups;
}

/**
 * Calcule les positions finales des noeuds
 */
export function calculateLayout(
  graph: InterdependencyGraph,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): { width: number; height: number } {
  // Assigner les niveaux
  const levels = assignLevels(graph);

  // Grouper par niveau
  let groups = groupByLevel(graph, levels);

  // Minimiser les croisements
  groups = minimizeCrossings(graph, groups);

  // Calculer les positions
  const { nodeDimensions, levelSpacing, nodeSpacing, startX, startY } = config;

  let maxX = 0;
  let maxY = 0;

  for (const [level, nodeIds] of groups) {
    const x = startX + level * levelSpacing;

    // Centrer verticalement les noeuds du niveau
    const totalHeight = nodeIds.length * (nodeDimensions.height + nodeSpacing) - nodeSpacing;
    let y = startY;

    for (let i = 0; i < nodeIds.length; i++) {
      const nodeId = nodeIds[i];
      const node = graph.nodes.get(nodeId);

      if (node) {
        node.x = x;
        node.y = y;
        node.level = level;

        maxX = Math.max(maxX, x + nodeDimensions.width);
        maxY = Math.max(maxY, y + nodeDimensions.height);
      }

      y += nodeDimensions.height + nodeSpacing;
    }
  }

  return {
    width: maxX + startX,
    height: maxY + startY,
  };
}

/**
 * Calcule les points de contrôle pour une courbe de Bézier entre deux noeuds
 */
export function calculateEdgePath(
  sourceNode: DependencyNode,
  targetNode: DependencyNode,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): {
  start: { x: number; y: number };
  end: { x: number; y: number };
  control1: { x: number; y: number };
  control2: { x: number; y: number };
} {
  const { nodeDimensions } = config;

  // Point de départ (côté droit du noeud source)
  const start = {
    x: sourceNode.x + nodeDimensions.width,
    y: sourceNode.y + nodeDimensions.height / 2,
  };

  // Point d'arrivée (côté gauche du noeud cible)
  const end = {
    x: targetNode.x,
    y: targetNode.y + nodeDimensions.height / 2,
  };

  // Points de contrôle pour la courbe de Bézier
  const dx = end.x - start.x;
  const controlOffset = Math.min(dx / 2, 100);

  const control1 = {
    x: start.x + controlOffset,
    y: start.y,
  };

  const control2 = {
    x: end.x - controlOffset,
    y: end.y,
  };

  return { start, end, control1, control2 };
}

/**
 * Génère le path SVG pour une arête
 */
export function generateEdgeSVGPath(
  sourceNode: DependencyNode,
  targetNode: DependencyNode,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): string {
  const { start, end, control1, control2 } = calculateEdgePath(
    sourceNode,
    targetNode,
    config
  );

  return `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`;
}

/**
 * Calcule les dimensions totales nécessaires pour le SVG
 */
export function calculateSVGDimensions(
  graph: InterdependencyGraph,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): { width: number; height: number } {
  let maxX = 0;
  let maxY = 0;

  for (const node of graph.nodes.values()) {
    maxX = Math.max(maxX, node.x + config.nodeDimensions.width);
    maxY = Math.max(maxY, node.y + config.nodeDimensions.height);
  }

  return {
    width: maxX + config.startX * 2,
    height: maxY + config.startY * 2,
  };
}
