/**
 * Simulateur What-If pour analyser l'impact des retards
 */

import type {
  InterdependencyGraph,
  DependencyNode,
  WhatIfScenario,
} from '@/types/interdependency.types';
import { calculateCriticalPath } from './criticalPath';
import { addDays } from 'date-fns';

/**
 * Simule un retard sur une action et calcule l'impact sur le projet
 */
export function simulateDelay(
  graph: InterdependencyGraph,
  actionId: string,
  delayDays: number
): WhatIfScenario {
  // Sauvegarder les valeurs originales
  const originalValues = new Map<string, { ES: number; EF: number }>();
  for (const [id, node] of graph.nodes) {
    originalValues.set(id, { ES: node.ES, EF: node.EF });
  }

  const originalProjectEnd = graph.projectEnd;
  const originalCriticalPath = [...graph.criticalPath];

  // Créer une copie profonde du graphe pour la simulation
  const simulatedGraph: InterdependencyGraph = {
    nodes: new Map(),
    edges: graph.edges.map((e) => ({ ...e, isImpacted: false })),
    criticalPath: [],
    totalDuration: graph.totalDuration,
    projectStart: graph.projectStart,
    projectEnd: graph.projectEnd,
    stats: { ...graph.stats },
  };

  // Copier les noeuds
  for (const [id, node] of graph.nodes) {
    simulatedGraph.nodes.set(id, {
      ...node,
      simulatedDelay: undefined,
      isImpacted: false,
      impactDelay: undefined,
    });
  }

  // Appliquer le retard initial
  const targetNode = simulatedGraph.nodes.get(actionId);
  if (!targetNode) {
    return {
      sourceActionId: actionId,
      delayDays,
      impactedActions: [],
      originalProjectEnd,
      newProjectEnd: originalProjectEnd,
      totalDelayDays: 0,
      criticalPathAffected: false,
      newCriticalPath: originalCriticalPath,
    };
  }

  // Propager le retard en utilisant BFS
  const impactedActions: WhatIfScenario['impactedActions'] = [];
  const visited = new Set<string>();
  const queue: Array<{ id: string; propagatedDelay: number }> = [
    { id: actionId, propagatedDelay: delayDays },
  ];

  while (queue.length > 0) {
    const { id, propagatedDelay } = queue.shift()!;

    if (visited.has(id)) continue;
    visited.add(id);

    const node = simulatedGraph.nodes.get(id);
    if (!node) continue;

    const original = originalValues.get(id)!;

    // Appliquer le retard
    if (propagatedDelay > 0) {
      const actualDelay = Math.max(0, propagatedDelay);
      node.ES = original.ES + actualDelay;
      node.EF = original.EF + actualDelay;
      node.simulatedDelay = actualDelay;
      node.isImpacted = true;
      node.impactDelay = actualDelay;

      if (id !== actionId) {
        impactedActions.push({
          actionId: id,
          originalES: original.ES,
          newES: node.ES,
          delay: actualDelay,
        });
      }
    }

    // Propager aux successeurs
    const successorEdges = simulatedGraph.edges.filter((e) => e.sourceId === id);

    for (const edge of successorEdges) {
      const successor = simulatedGraph.nodes.get(edge.targetId);
      if (!successor || visited.has(edge.targetId)) continue;

      let successorDelay = 0;
      const lag = edge.lag || 0;

      switch (edge.type) {
        case 'FS': // Finish-to-Start
          // Le successeur commence après la fin
          successorDelay = Math.max(
            0,
            node.EF + lag - (originalValues.get(edge.targetId)?.ES || 0)
          );
          break;

        case 'SS': // Start-to-Start
          // Le successeur commence après le début
          successorDelay = Math.max(
            0,
            node.ES + lag - (originalValues.get(edge.targetId)?.ES || 0)
          );
          break;

        case 'FF': // Finish-to-Finish
          // Le successeur finit après la fin
          const origEF = originalValues.get(edge.targetId)?.EF || 0;
          const requiredEF = node.EF + lag;
          if (requiredEF > origEF) {
            successorDelay = requiredEF - origEF;
          }
          break;

        case 'SF': // Start-to-Finish (rare)
          // Le successeur finit après le début
          const origEFSF = originalValues.get(edge.targetId)?.EF || 0;
          const requiredEFSF = node.ES + lag;
          if (requiredEFSF > origEFSF) {
            successorDelay = requiredEFSF - origEFSF;
          }
          break;
      }

      if (successorDelay > 0) {
        edge.isImpacted = true;
        queue.push({ id: edge.targetId, propagatedDelay: successorDelay });
      }
    }
  }

  // Recalculer le chemin critique
  const recalculatedGraph = calculateCriticalPath(simulatedGraph);

  // Calculer la nouvelle date de fin
  let maxEF = 0;
  for (const node of recalculatedGraph.nodes.values()) {
    maxEF = Math.max(maxEF, node.EF);
  }

  const totalDelayDays = maxEF - graph.totalDuration;
  const newProjectEnd = addDays(graph.projectStart, maxEF);

  // Vérifier si le chemin critique est affecté
  const criticalPathAffected =
    recalculatedGraph.criticalPath.some((id) =>
      impactedActions.some((a) => a.actionId === id)
    ) || recalculatedGraph.criticalPath.includes(actionId);

  return {
    sourceActionId: actionId,
    delayDays,
    impactedActions: impactedActions.sort((a, b) => a.delay - b.delay),
    originalProjectEnd,
    newProjectEnd,
    totalDelayDays: Math.max(0, totalDelayDays),
    criticalPathAffected,
    newCriticalPath: recalculatedGraph.criticalPath,
  };
}

/**
 * Applique visuellement les résultats d'une simulation sur le graphe
 * (modifie le graphe en place pour l'affichage)
 */
export function applySimulationVisuals(
  graph: InterdependencyGraph,
  scenario: WhatIfScenario
): void {
  // Réinitialiser les indicateurs
  for (const node of graph.nodes.values()) {
    node.isImpacted = false;
    node.impactDelay = undefined;
  }
  for (const edge of graph.edges) {
    edge.isImpacted = false;
  }

  // Marquer l'action source
  const sourceNode = graph.nodes.get(scenario.sourceActionId);
  if (sourceNode) {
    sourceNode.simulatedDelay = scenario.delayDays;
    sourceNode.isImpacted = true;
    sourceNode.impactDelay = scenario.delayDays;
  }

  // Marquer les actions impactées
  for (const impact of scenario.impactedActions) {
    const node = graph.nodes.get(impact.actionId);
    if (node) {
      node.isImpacted = true;
      node.impactDelay = impact.delay;
    }
  }

  // Marquer les arêtes impactées
  const impactedIds = new Set([
    scenario.sourceActionId,
    ...scenario.impactedActions.map((a) => a.actionId),
  ]);

  for (const edge of graph.edges) {
    if (impactedIds.has(edge.sourceId) && impactedIds.has(edge.targetId)) {
      edge.isImpacted = true;
    }
  }
}

/**
 * Efface les indicateurs de simulation du graphe
 */
export function clearSimulationVisuals(graph: InterdependencyGraph): void {
  for (const node of graph.nodes.values()) {
    node.simulatedDelay = undefined;
    node.isImpacted = false;
    node.impactDelay = undefined;
  }
  for (const edge of graph.edges) {
    edge.isImpacted = false;
  }
}

/**
 * Calcule l'impact d'un retard sur une date spécifique
 */
export function calculateDateImpact(
  originalDate: Date,
  delayDays: number
): Date {
  return addDays(originalDate, delayDays);
}
