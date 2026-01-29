/**
 * Hook principal pour la gestion des interdépendances
 */

import { useMemo, useState, useCallback } from 'react';
import { useActions } from './useActions';
import { useJalons } from './useJalons';
import type { Axe, Action } from '@/types';
import type {
  InterdependencyGraph,
  InterdependencyFilters,
  WhatIfScenario,
  BlockageInfo,
  DependencyNode,
  DependencyEdge,
} from '@/types/interdependency.types';
import {
  buildDependencyGraph,
  calculateCriticalPath,
  detectBlockages,
  simulateDelay,
  calculateLayout,
  DEFAULT_LAYOUT_CONFIG,
} from '@/lib/interdependency';

interface UseInterdependencyResult {
  // Données
  graph: InterdependencyGraph | null;
  blockages: BlockageInfo[];
  isLoading: boolean;

  // Dimensions SVG
  svgDimensions: { width: number; height: number };

  // Filtres
  filters: InterdependencyFilters;
  setFilters: (filters: InterdependencyFilters) => void;

  // Données filtrées
  filteredActions: Action[];
  availableAxes: Axe[];
  availableJalons: Array<{ id: number; titre: string }>;

  // Simulation What-If
  whatIfScenario: WhatIfScenario | null;
  simulateWhatIf: (actionId: string, delayDays: number) => void;
  clearWhatIf: () => void;

  // Sélection
  selectedActionId: string | null;
  setSelectedActionId: (id: string | null) => void;

  // Actions utilitaires
  refreshGraph: () => void;
}

export function useInterdependency(
  initialFilters?: InterdependencyFilters
): UseInterdependencyResult {
  // État local
  const [filters, setFiltersState] = useState<InterdependencyFilters>(
    initialFilters || {}
  );
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [whatIfScenario, setWhatIfScenario] = useState<WhatIfScenario | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);

  // Wrapper pour setFilters qui force le rafraîchissement
  const setFilters = useCallback((newFilters: InterdependencyFilters) => {
    setFiltersState(newFilters);
    setSelectedActionId(null); // Reset selection when filters change
  }, []);

  // Récupérer les données
  const allActions = useActions();
  const allJalons = useJalons();

  // Filtrer les actions par axe/jalon/statut
  const filteredActions = useMemo(() => {
    let result = allActions;

    if (filters.axe) {
      result = result.filter((a) => a.axe === filters.axe);
    }

    if (filters.jalonId) {
      result = result.filter((a) => a.jalonId === filters.jalonId);
    }

    if (filters.statuses && filters.statuses.length > 0) {
      result = result.filter((a) => filters.statuses!.includes(a.statut));
    }

    return result;
  }, [allActions, filters.axe, filters.jalonId, filters.statuses, refreshKey]);

  // Construire le graphe complet (sans filtres visuels)
  const { baseGraph, blockages } = useMemo(() => {
    if (filteredActions.length === 0) {
      return {
        baseGraph: null,
        blockages: [],
      };
    }

    // Construire le graphe de base
    let g = buildDependencyGraph(filteredActions);

    // Calculer le chemin critique
    g = calculateCriticalPath(g);

    // Détecter les blocages
    const b = detectBlockages(g);

    return {
      baseGraph: g,
      blockages: b,
    };
  }, [filteredActions, refreshKey]);

  // Appliquer les filtres de visualisation (showCriticalOnly, showBlockedOnly)
  const { graph, svgDimensions } = useMemo(() => {
    if (!baseGraph) {
      return {
        graph: null,
        svgDimensions: { width: 800, height: 600 },
      };
    }

    // Créer une copie du graphe pour ne pas modifier l'original
    const newNodes = new Map<string, DependencyNode>();
    const newEdges: DependencyEdge[] = [];

    // Déterminer quels noeuds garder
    let nodesToKeep: Set<string>;

    if (filters.showCriticalOnly) {
      // Garder seulement les noeuds du chemin critique
      nodesToKeep = new Set(baseGraph.criticalPath);
    } else if (filters.showBlockedOnly) {
      // Garder seulement les noeuds bloqués et leurs bloqueurs
      nodesToKeep = new Set<string>();
      for (const blockage of blockages) {
        nodesToKeep.add(blockage.blockedActionId);
        nodesToKeep.add(blockage.blockingActionId);
      }
    } else {
      // Garder tous les noeuds
      nodesToKeep = new Set(baseGraph.nodes.keys());
    }

    // Copier les noeuds filtrés
    for (const [id, node] of baseGraph.nodes) {
      if (nodesToKeep.has(id)) {
        newNodes.set(id, { ...node });
      }
    }

    // Copier les arêtes dont les deux extrémités sont dans le filtre
    for (const edge of baseGraph.edges) {
      if (nodesToKeep.has(edge.sourceId) && nodesToKeep.has(edge.targetId)) {
        newEdges.push({ ...edge });
      }
    }

    // Si pas de noeuds après filtrage
    if (newNodes.size === 0) {
      return {
        graph: null,
        svgDimensions: { width: 800, height: 600 },
      };
    }

    // Créer le nouveau graphe filtré
    const filteredGraph: InterdependencyGraph = {
      nodes: newNodes,
      edges: newEdges,
      criticalPath: baseGraph.criticalPath.filter((id) => nodesToKeep.has(id)),
      totalDuration: baseGraph.totalDuration,
      projectStart: baseGraph.projectStart,
      projectEnd: baseGraph.projectEnd,
      stats: {
        totalActions: newNodes.size,
        totalDependencies: newEdges.length,
        blockedActions: Array.from(newNodes.values()).filter((n) => n.isBlocked).length,
        criticalActions: Array.from(newNodes.values()).filter((n) => n.isCritical).length,
        hasCycles: baseGraph.stats.hasCycles,
        cycleNodes: baseGraph.stats.cycleNodes,
      },
    };

    // Recalculer le layout pour le graphe filtré
    const dims = calculateLayout(filteredGraph, DEFAULT_LAYOUT_CONFIG);

    return {
      graph: filteredGraph,
      svgDimensions: dims,
    };
  }, [baseGraph, blockages, filters.showCriticalOnly, filters.showBlockedOnly]);

  // Axes disponibles
  const availableAxes = useMemo(() => {
    const axeSet = new Set(allActions.map((a) => a.axe));
    return Array.from(axeSet).sort();
  }, [allActions]);

  // Jalons disponibles (filtré par axe si sélectionné)
  const availableJalons = useMemo(() => {
    let jalons = allJalons;

    if (filters.axe) {
      jalons = jalons.filter((j) => j.axe === filters.axe);
    }

    return jalons
      .filter((j) => j.id !== undefined)
      .map((j) => ({
        id: j.id!,
        titre: j.titre,
      }));
  }, [allJalons, filters.axe]);

  // Simulation What-If
  const simulateWhatIf = useCallback(
    (actionId: string, delayDays: number) => {
      if (!baseGraph) return;

      const scenario = simulateDelay(baseGraph, actionId, delayDays);
      setWhatIfScenario(scenario);
    },
    [baseGraph]
  );

  const clearWhatIf = useCallback(() => {
    setWhatIfScenario(null);
  }, []);

  // Rafraîchir le graphe
  const refreshGraph = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setWhatIfScenario(null);
    setSelectedActionId(null);
  }, []);

  return {
    graph,
    blockages,
    isLoading: false,
    svgDimensions,
    filters,
    setFilters,
    filteredActions,
    availableAxes,
    availableJalons,
    whatIfScenario,
    simulateWhatIf,
    clearWhatIf,
    selectedActionId,
    setSelectedActionId,
    refreshGraph,
  };
}
