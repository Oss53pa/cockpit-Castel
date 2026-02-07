/**
 * Construction du graphe de dépendances à partir des actions
 */

import type { Action } from '@/types';
import type {
  DependencyNode,
  DependencyEdge,
  InterdependencyGraph,
} from '@/types/interdependency.types';
import { differenceInDays, parseISO, min, max } from 'date-fns';

/**
 * Construit le graphe de dépendances à partir d'une liste d'actions
 */
export function buildDependencyGraph(actions: Action[]): InterdependencyGraph {
  const nodes = new Map<string, DependencyNode>();
  const edges: DependencyEdge[] = [];
  const actionMap = new Map<string, Action>();

  // Index des actions par id_action
  actions.forEach((action) => {
    actionMap.set(action.id_action, action);
  });

  // Trouver les dates min/max du projet
  const validDates = actions
    .map((a) => parseISO(a.date_debut_prevue))
    .filter((d) => !isNaN(d.getTime()));

  const projectStart = validDates.length > 0 ? min(validDates) : new Date();
  const projectEndDates = actions
    .map((a) => parseISO(a.date_fin_prevue))
    .filter((d) => !isNaN(d.getTime()));
  const projectEnd = projectEndDates.length > 0 ? max(projectEndDates) : new Date();

  // Créer les noeuds
  actions.forEach((action) => {
    const startDate = parseISO(action.date_debut_prevue);
    const endDate = parseISO(action.date_fin_prevue);

    // Guard: skip actions avec dates invalides
    const startValid = !isNaN(startDate.getTime());
    const endValid = !isNaN(endDate.getTime());

    // ES/EF initiaux basés sur les dates prévues (sera recalculé par CPM)
    const ES = startValid ? differenceInDays(startDate, projectStart) : 0;
    const duration = action.duree_prevue_jours || (startValid && endValid ? differenceInDays(endDate, startDate) : 0) || 1;
    const EF = ES + duration;

    const node: DependencyNode = {
      id: action.id_action,
      action,
      x: 0,
      y: 0,
      level: 0,
      ES,
      EF,
      LS: ES, // Sera recalculé
      LF: EF, // Sera recalculé
      slack: 0, // Sera recalculé
      isCritical: false,
      isBlocked: false,
    };

    nodes.set(action.id_action, node);
  });

  // Créer les arêtes à partir des predecesseurs
  const edgeSet = new Set<string>(); // Pour éviter les doublons

  actions.forEach((action) => {
    if (action.predecesseurs && action.predecesseurs.length > 0) {
      action.predecesseurs.forEach((pred) => {
        // Vérifier que le predecesseur existe dans notre liste d'actions
        if (actionMap.has(pred.id)) {
          const edgeId = `${pred.id}->${action.id_action}`;

          if (!edgeSet.has(edgeId)) {
            edgeSet.add(edgeId);

            const edge: DependencyEdge = {
              id: edgeId,
              sourceId: pred.id,
              targetId: action.id_action,
              type: pred.type_lien || 'FS',
              lag: pred.decalage_jours || 0,
              isCritical: false,
            };

            edges.push(edge);
          }
        }
      });
    }

    // Aussi vérifier les successeurs pour capturer toutes les relations
    if (action.successeurs && action.successeurs.length > 0) {
      action.successeurs.forEach((succ) => {
        if (actionMap.has(succ.id)) {
          const edgeId = `${action.id_action}->${succ.id}`;

          if (!edgeSet.has(edgeId)) {
            edgeSet.add(edgeId);

            const edge: DependencyEdge = {
              id: edgeId,
              sourceId: action.id_action,
              targetId: succ.id,
              type: succ.type_lien || 'FS',
              lag: succ.decalage_jours || 0,
              isCritical: false,
            };

            edges.push(edge);
          }
        }
      });
    }
  });

  // Calculer les statistiques initiales
  const stats = {
    totalActions: nodes.size,
    totalDependencies: edges.length,
    blockedActions: 0, // Sera calculé par blockageDetector
    criticalActions: 0, // Sera calculé par criticalPath
    hasCycles: false, // Sera vérifié par criticalPath
    cycleNodes: undefined as string[] | undefined,
  };

  return {
    nodes,
    edges,
    criticalPath: [],
    totalDuration: differenceInDays(projectEnd, projectStart),
    projectStart,
    projectEnd,
    stats,
  };
}

/**
 * Récupère les successeurs directs d'un noeud
 */
export function getSuccessors(
  graph: InterdependencyGraph,
  nodeId: string
): DependencyNode[] {
  const successorIds = graph.edges
    .filter((e) => e.sourceId === nodeId)
    .map((e) => e.targetId);

  return successorIds
    .map((id) => graph.nodes.get(id))
    .filter((n): n is DependencyNode => n !== undefined);
}

/**
 * Récupère les prédécesseurs directs d'un noeud
 */
export function getPredecessors(
  graph: InterdependencyGraph,
  nodeId: string
): DependencyNode[] {
  const predecessorIds = graph.edges
    .filter((e) => e.targetId === nodeId)
    .map((e) => e.sourceId);

  return predecessorIds
    .map((id) => graph.nodes.get(id))
    .filter((n): n is DependencyNode => n !== undefined);
}

/**
 * Récupère l'arête entre deux noeuds
 */
export function getEdge(
  graph: InterdependencyGraph,
  sourceId: string,
  targetId: string
): DependencyEdge | undefined {
  return graph.edges.find((e) => e.sourceId === sourceId && e.targetId === targetId);
}

/**
 * Récupère tous les noeuds racines (sans prédécesseurs)
 */
export function getRootNodes(graph: InterdependencyGraph): DependencyNode[] {
  const nodesWithPredecessors = new Set(graph.edges.map((e) => e.targetId));

  return Array.from(graph.nodes.values()).filter(
    (node) => !nodesWithPredecessors.has(node.id)
  );
}

/**
 * Récupère tous les noeuds feuilles (sans successeurs)
 */
export function getLeafNodes(graph: InterdependencyGraph): DependencyNode[] {
  const nodesWithSuccessors = new Set(graph.edges.map((e) => e.sourceId));

  return Array.from(graph.nodes.values()).filter(
    (node) => !nodesWithSuccessors.has(node.id)
  );
}
