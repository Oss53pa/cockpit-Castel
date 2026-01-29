/**
 * Composant principal du diagramme d'interdépendance
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GitBranch, AlertCircle } from 'lucide-react';
import { useInterdependency } from '@/hooks/useInterdependency';
import { InterdependencyNode } from './InterdependencyNode';
import { InterdependencyEdge } from './InterdependencyEdge';
import { InterdependencyToolbar } from './InterdependencyToolbar';
import { InterdependencyLegend } from './InterdependencyLegend';
import { InterdependencyDetails } from './InterdependencyDetails';
import { WhatIfPanel } from './WhatIfPanel';
import { BlockageAlert } from './BlockageAlert';
import { DEFAULT_LAYOUT_CONFIG } from '@/lib/interdependency';

interface InterdependencyDiagramProps {
  projectId?: number;
}

export const InterdependencyDiagram: React.FC<InterdependencyDiagramProps> = ({
  projectId,
}) => {
  // Hook principal
  const {
    graph,
    blockages,
    svgDimensions,
    filters,
    setFilters,
    availableAxes,
    availableJalons,
    whatIfScenario,
    simulateWhatIf,
    clearWhatIf,
    selectedActionId,
    setSelectedActionId,
    refreshGraph,
  } = useInterdependency();

  // État de la vue
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  const [showWhatIfPanel, setShowWhatIfPanel] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Gestionnaires de zoom
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.1, 0.3));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(0.8);
    setPan({ x: 0, y: 0 });
  }, []);

  // Gestionnaires de pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setLastPanPos({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - lastPanPos.x;
        const dy = e.clientY - lastPanPos.y;
        setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
        setLastPanPos({ x: e.clientX, y: e.clientY });
      }
    },
    [isPanning, lastPanPos]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Zoom avec la molette
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((z) => Math.max(0.3, Math.min(2, z + delta)));
  }, []);

  // Sélection d'un noeud
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedActionId(nodeId);
      clearWhatIf();
      setShowWhatIfPanel(false);
    },
    [setSelectedActionId, clearWhatIf]
  );

  // Centrer sur un noeud
  const centerOnNode = useCallback(
    (nodeId: string) => {
      if (!graph || !containerRef.current) return;

      const node = graph.nodes.get(nodeId);
      if (!node) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();

      // Calculer le pan nécessaire pour centrer le noeud
      const nodeX = node.x + DEFAULT_LAYOUT_CONFIG.nodeDimensions.width / 2;
      const nodeY = node.y + DEFAULT_LAYOUT_CONFIG.nodeDimensions.height / 2;

      const targetX = containerRect.width / 2 - nodeX * zoom;
      const targetY = containerRect.height / 2 - nodeY * zoom;

      setPan({ x: targetX, y: targetY });
      setSelectedActionId(nodeId);
    },
    [graph, zoom, setSelectedActionId]
  );

  // Obtenir le noeud sélectionné
  const selectedNode = selectedActionId ? graph?.nodes.get(selectedActionId) : null;

  // Rendu si pas de graphe
  if (!graph || graph.nodes.size === 0) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <InterdependencyToolbar
          filters={filters}
          onFiltersChange={setFilters}
          availableAxes={availableAxes}
          availableJalons={availableJalons}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          onRefresh={refreshGraph}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <GitBranch className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Aucune action avec des dépendances
            </h3>
            <p className="text-sm text-gray-500">
              Les actions avec des prédécesseurs ou successeurs apparaîtront ici.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Alerte cycle
  const hasCycles = graph.stats.hasCycles;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Toolbar */}
      <InterdependencyToolbar
        filters={filters}
        onFiltersChange={setFilters}
        availableAxes={availableAxes}
        availableJalons={availableJalons}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onRefresh={refreshGraph}
        stats={graph.stats}
      />

      {/* Alerte cycles */}
      {hasCycles && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <span className="text-sm text-amber-800">
            Cycle de dépendances détecté. Le calcul du chemin critique peut être
            approximatif.
          </span>
        </div>
      )}

      {/* Alerte blocages */}
      <BlockageAlert blockages={blockages} onActionClick={centerOnNode} />

      {/* Zone principale */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas SVG */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ display: 'block' }}
          >
            <g
              transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
            >
              {/* Arêtes (en premier pour être derrière les noeuds) */}
              {graph.edges.map((edge) => {
                const sourceNode = graph.nodes.get(edge.sourceId);
                const targetNode = graph.nodes.get(edge.targetId);

                if (!sourceNode || !targetNode) return null;

                return (
                  <InterdependencyEdge
                    key={edge.id}
                    edge={edge}
                    sourceNode={sourceNode}
                    targetNode={targetNode}
                    isHighlighted={
                      selectedActionId === edge.sourceId ||
                      selectedActionId === edge.targetId
                    }
                  />
                );
              })}

              {/* Noeuds */}
              {Array.from(graph.nodes.values()).map((node) => (
                <InterdependencyNode
                  key={node.id}
                  node={node}
                  isSelected={selectedActionId === node.id}
                  onClick={() => handleNodeClick(node.id)}
                  width={DEFAULT_LAYOUT_CONFIG.nodeDimensions.width}
                  height={DEFAULT_LAYOUT_CONFIG.nodeDimensions.height}
                />
              ))}
            </g>
          </svg>

          {/* Légende flottante */}
          <div className="absolute bottom-4 left-4">
            <InterdependencyLegend compact />
          </div>

          {/* Panel What-If flottant */}
          {showWhatIfPanel && selectedNode && (
            <div className="absolute top-4 right-4">
              <WhatIfPanel
                selectedNode={selectedNode}
                scenario={whatIfScenario}
                onSimulate={(delay) => simulateWhatIf(selectedNode.id, delay)}
                onClose={() => {
                  setShowWhatIfPanel(false);
                  clearWhatIf();
                }}
              />
            </div>
          )}
        </div>

        {/* Panel de détails */}
        {selectedNode && !showWhatIfPanel && (
          <InterdependencyDetails
            node={selectedNode}
            graph={graph}
            onClose={() => setSelectedActionId(null)}
            onNodeClick={centerOnNode}
            onSimulateClick={() => setShowWhatIfPanel(true)}
          />
        )}
      </div>
    </div>
  );
};
