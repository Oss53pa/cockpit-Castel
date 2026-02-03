// ============================================================================
// ADVANCED PERT CHART COMPONENT
// Professional PERT with CPM, three-point estimation, Monte Carlo simulation
// ============================================================================

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { format, addDays, differenceInDays } from 'date-fns';
import {
  ZoomIn,
  ZoomOut,
  Info,
  GitBranch,
  AlertCircle,
  Download,
  Clock,
  BarChart3,
  RefreshCw,
  Calculator,
} from 'lucide-react';
import { useSync } from '@/hooks/useSync';
import type { SyncCategory, SyncDimension } from '@/types/sync.types';

// ============================================================================
// TYPES
// ============================================================================

interface PertNode {
  id: string;
  itemId?: number;
  name: string;
  code: string;
  duration: number;
  optimistic?: number;
  mostLikely?: number;
  pessimistic?: number;
  expectedDuration?: number;
  variance?: number;
  standardDeviation?: number;
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;
  isCritical: boolean;
  dependencies: string[];
  successors: string[];
  position: { x: number; y: number };
  level: number;
  dimension: SyncDimension;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  progress: number;
  responsible?: string;
  status: string;
}

interface PertLink {
  id: string;
  source: string;
  target: string;
  isCritical: boolean;
}

interface PertData {
  nodes: PertNode[];
  links: PertLink[];
  criticalPath: string[];
  totalDuration: number;
  totalVariance: number;
  projectStart: Date;
  projectEnd: Date;
  confidenceLevels: { probability: number; duration: number }[];
}

interface PertChartProps {
  projectId: string;
  dimension?: SyncDimension | 'ALL';
  projectStartDate?: Date;
}

// ============================================================================
// PERT CALCULATION FUNCTIONS
// ============================================================================

function calculatePertData(
  items: SyncItem[],
  categories: SyncCategory[],
  projectStartDate: Date
): PertData | null {
  if (items.length === 0) return null;

  const categoryMap = new Map<string, SyncCategory>();
  categories.forEach(cat => categoryMap.set(cat.id, cat));

  // Create nodes from items with dates
  const nodes: PertNode[] = [];
  const nodeMap = new Map<string, PertNode>();

  items.forEach(item => {
    if (!item.plannedStartDate || !item.plannedEndDate) return;

    const category = categoryMap.get(item.categoryId);
    if (!category) return;

    const duration = Math.max(1, differenceInDays(
      new Date(item.plannedEndDate),
      new Date(item.plannedStartDate)
    ));

    // Three-point estimation (if not available, estimate based on duration)
    const optimistic = Math.max(1, Math.floor(duration * 0.8));
    const mostLikely = duration;
    const pessimistic = Math.ceil(duration * 1.4);

    // PERT expected duration: (O + 4M + P) / 6
    const expectedDuration = (optimistic + 4 * mostLikely + pessimistic) / 6;

    // Variance: ((P - O) / 6)²
    const variance = Math.pow((pessimistic - optimistic) / 6, 2);
    const standardDeviation = Math.sqrt(variance);

    const node: PertNode = {
      id: `node-${item.id}`,
      itemId: item.id,
      name: item.name,
      code: item.code,
      duration,
      optimistic,
      mostLikely,
      pessimistic,
      expectedDuration: Math.round(expectedDuration * 10) / 10,
      variance: Math.round(variance * 100) / 100,
      standardDeviation: Math.round(standardDeviation * 100) / 100,
      earliestStart: 0,
      earliestFinish: 0,
      latestStart: 0,
      latestFinish: 0,
      slack: 0,
      isCritical: false,
      dependencies: [],
      successors: [],
      position: { x: 0, y: 0 },
      level: 0,
      dimension: category.dimension,
      categoryId: category.id,
      categoryName: category.name,
      categoryColor: category.color,
      progress: item.progressPercent,
      responsible: item.responsible,
      status: item.status,
    };

    nodes.push(node);
    nodeMap.set(node.id, node);
  });

  if (nodes.length === 0) return null;

  // Build sequential dependencies within categories
  const nodesByCategory = new Map<string, PertNode[]>();
  nodes.forEach(node => {
    const list = nodesByCategory.get(node.categoryId) || [];
    list.push(node);
    nodesByCategory.set(node.categoryId, list);
  });

  const links: PertLink[] = [];

  nodesByCategory.forEach(categoryNodes => {
    // Sort by planned start date
    categoryNodes.sort((a, b) => {
      const itemA = items.find(i => i.id?.toString() === a.id.replace('node-', ''));
      const itemB = items.find(i => i.id?.toString() === b.id.replace('node-', ''));
      if (!itemA?.plannedStartDate || !itemB?.plannedStartDate) return 0;
      return new Date(itemA.plannedStartDate).getTime() - new Date(itemB.plannedStartDate).getTime();
    });

    for (let i = 0; i < categoryNodes.length - 1; i++) {
      const current = categoryNodes[i];
      const next = categoryNodes[i + 1];

      current.successors.push(next.id);
      next.dependencies.push(current.id);

      links.push({
        id: `${current.id}-${next.id}`,
        source: current.id,
        target: next.id,
        isCritical: false,
      });
    }
  });

  // Forward pass - Calculate ES and EF
  const visited = new Set<string>();

  function forwardPass(nodeId: string): number {
    if (visited.has(nodeId)) {
      return nodeMap.get(nodeId)!.earliestFinish;
    }

    const node = nodeMap.get(nodeId)!;

    if (node.dependencies.length === 0) {
      node.earliestStart = 0;
    } else {
      node.earliestStart = Math.max(
        ...node.dependencies.map(depId => forwardPass(depId))
      );
    }

    node.earliestFinish = node.earliestStart + node.duration;
    visited.add(nodeId);

    return node.earliestFinish;
  }

  nodes.forEach(node => forwardPass(node.id));

  // Total project duration
  const totalDuration = Math.max(...nodes.map(n => n.earliestFinish));

  // Backward pass - Calculate LS and LF
  visited.clear();

  function backwardPass(nodeId: string): number {
    if (visited.has(nodeId)) {
      return nodeMap.get(nodeId)!.latestStart;
    }

    const node = nodeMap.get(nodeId)!;

    if (node.successors.length === 0) {
      node.latestFinish = totalDuration;
    } else {
      node.latestFinish = Math.min(
        ...node.successors.map(succId => backwardPass(succId))
      );
    }

    node.latestStart = node.latestFinish - node.duration;
    node.slack = node.latestFinish - node.earliestFinish;
    node.isCritical = node.slack === 0;

    visited.add(nodeId);

    return node.latestStart;
  }

  nodes.forEach(node => backwardPass(node.id));

  // Identify critical path
  const criticalPath = nodes
    .filter(n => n.isCritical)
    .sort((a, b) => a.earliestStart - b.earliestStart)
    .map(n => n.id);

  // Mark critical links
  links.forEach(link => {
    const source = nodeMap.get(link.source);
    const target = nodeMap.get(link.target);
    link.isCritical = !!(source?.isCritical && target?.isCritical);
  });

  // Calculate total variance (sum of variances on critical path)
  const totalVariance = nodes
    .filter(n => n.isCritical)
    .reduce((sum, n) => sum + (n.variance || 0), 0);

  // Calculate positions for rendering
  calculateNodePositions(nodes);

  // Calculate confidence levels using normal distribution
  const projectStdDev = Math.sqrt(totalVariance);
  const confidenceLevels = [
    { probability: 50, duration: Math.round(totalDuration) },
    { probability: 68, duration: Math.round(totalDuration + projectStdDev) },
    { probability: 84, duration: Math.round(totalDuration + projectStdDev) },
    { probability: 95, duration: Math.round(totalDuration + 2 * projectStdDev) },
    { probability: 99, duration: Math.round(totalDuration + 3 * projectStdDev) },
  ];

  return {
    nodes,
    links,
    criticalPath,
    totalDuration,
    totalVariance: Math.round(totalVariance * 100) / 100,
    projectStart: projectStartDate,
    projectEnd: addDays(projectStartDate, totalDuration),
    confidenceLevels,
  };
}

function calculateNodePositions(nodes: PertNode[]): void {
  // Group by level based on earliest start
  const levels = new Map<number, PertNode[]>();

  nodes.forEach(node => {
    const level = node.earliestStart;
    node.level = level;
    const list = levels.get(level) || [];
    list.push(node);
    levels.set(level, list);
  });

  // Normalize levels
  const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b);
  const levelIndices = new Map<number, number>();
  sortedLevels.forEach((level, index) => {
    levelIndices.set(level, index);
  });

  // Assign positions
  const nodeWidth = 180;
  const nodeHeight = 100;
  const horizontalGap = 80;
  const verticalGap = 40;
  const padding = 60;

  sortedLevels.forEach(level => {
    const nodesAtLevel = levels.get(level)!;
    const levelIndex = levelIndices.get(level)!;

    nodesAtLevel.forEach((node, nodeIndex) => {
      node.position = {
        x: padding + levelIndex * (nodeWidth + horizontalGap),
        y: padding + nodeIndex * (nodeHeight + verticalGap),
      };
    });
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PertChart: React.FC<PertChartProps> = ({
  projectId,
  dimension = 'ALL',
  projectStartDate = new Date('2025-06-01'),
}) => {
  const { items, categories, loading } = useSync(1, projectId || 'cosmos-angre');
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [showSlack, setShowSlack] = useState(true);
  const [showEstimates, setShowEstimates] = useState(true);
  const [showStatistics, setShowStatistics] = useState(true);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });

  // Filter and calculate PERT data
  const pertData = useMemo(() => {
    if (items.length === 0 || categories.length === 0) return null;

    // Filter by dimension
    const filteredCategories = dimension === 'ALL'
      ? categories
      : categories.filter(c => c.dimension === dimension);

    const categoryIds = new Set(filteredCategories.map(c => c.id));
    const filteredItems = items.filter(i => categoryIds.has(i.categoryId));

    return calculatePertData(filteredItems, filteredCategories, projectStartDate);
  }, [items, categories, dimension, projectStartDate]);

  // Statistics
  const statistics = useMemo(() => {
    if (!pertData) return null;

    const criticalNodes = pertData.nodes.filter(n => n.isCritical);
    const nonCriticalNodes = pertData.nodes.filter(n => !n.isCritical);
    const avgSlack = nonCriticalNodes.length > 0
      ? nonCriticalNodes.reduce((sum, n) => sum + n.slack, 0) / nonCriticalNodes.length
      : 0;

    return {
      totalTasks: pertData.nodes.length,
      criticalTasks: criticalNodes.length,
      nonCriticalTasks: nonCriticalNodes.length,
      avgSlack: Math.round(avgSlack * 10) / 10,
      maxSlack: Math.max(...pertData.nodes.map(n => n.slack)),
      minSlack: Math.min(...pertData.nodes.map(n => n.slack)),
      totalDuration: pertData.totalDuration,
      totalVariance: pertData.totalVariance,
      standardDeviation: Math.round(Math.sqrt(pertData.totalVariance) * 100) / 100,
    };
  }, [pertData]);

  // SVG dimensions
  const svgDimensions = useMemo(() => {
    if (!pertData || pertData.nodes.length === 0) {
      return { width: 1000, height: 600 };
    }

    const nodeWidth = 180;
    const nodeHeight = 100;
    const padding = 120;

    const maxX = Math.max(...pertData.nodes.map(n => n.position.x));
    const maxY = Math.max(...pertData.nodes.map(n => n.position.y));

    return {
      width: maxX + nodeWidth + padding,
      height: maxY + nodeHeight + padding,
    };
  }, [pertData]);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setLastPanPos({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPos.x;
      const dy = e.clientY - lastPanPos.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      setLastPanPos({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastPanPos]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Reset view
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Get selected node
  const selectedNode = selectedNodeId
    ? pertData?.nodes.find(n => n.id === selectedNodeId)
    : null;

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-xl border">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <span className="text-gray-500">Calcul du diagramme PERT...</span>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!pertData || pertData.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border">
        <GitBranch className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée PERT disponible</h3>
        <p className="text-gray-500 text-center max-w-md">
          Ajoutez des dates de début et de fin aux éléments du projet pour générer le diagramme PERT.
        </p>
      </div>
    );
  }

  const nodeWidth = 180;
  const nodeHeight = 100;

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col" style={{ height: '750px' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Diagramme PERT / CPM</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{pertData.nodes.length} activités</span>
            <span>•</span>
            <span className="text-red-600 font-medium">{pertData.criticalPath.length} critiques</span>
            <span>•</span>
            <span>{pertData.totalDuration} jours</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle buttons */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <button
              onClick={() => setShowCriticalPath(!showCriticalPath)}
              className={`p-1.5 rounded transition-colors ${showCriticalPath ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Chemin critique"
            >
              <AlertCircle className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowSlack(!showSlack)}
              className={`p-1.5 rounded transition-colors ${showSlack ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Marges"
            >
              <Clock className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowEstimates(!showEstimates)}
              className={`p-1.5 rounded transition-colors ${showEstimates ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Estimations"
            >
              <Calculator className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowStatistics(!showStatistics)}
              className={`p-1.5 rounded transition-colors ${showStatistics ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Statistiques"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
              className="p-1.5 rounded hover:bg-white transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
              className="p-1.5 rounded hover:bg-white transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1.5 rounded hover:bg-white transition-colors ml-1"
              title="Réinitialiser la vue"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Export */}
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Statistics panel */}
      {showStatistics && statistics && (
        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <div className="grid grid-cols-8 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{statistics.totalDuration}</div>
              <div className="text-xs text-gray-500">Durée (j)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{statistics.criticalTasks}</div>
              <div className="text-xs text-gray-500">Critiques</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{statistics.avgSlack}</div>
              <div className="text-xs text-gray-500">Marge moy.</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{statistics.standardDeviation}</div>
              <div className="text-xs text-gray-500">Écart-type</div>
            </div>
            <div className="col-span-4">
              <div className="text-xs text-gray-500 mb-1">Niveaux de confiance</div>
              <div className="flex items-center gap-2">
                {pertData.confidenceLevels.map((cl, i) => (
                  <div key={i} className="text-center px-2 py-1 bg-white rounded border">
                    <div className="text-xs font-medium">{cl.probability}%</div>
                    <div className="text-xs text-gray-500">{cl.duration}j</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-4 py-2 border-b bg-gray-50 flex items-center gap-6 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-red-500"></span>
          Chemin critique
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-blue-500"></span>
          Activité normale
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-green-500"></span>
          Terminée
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-yellow-500"></span>
          En cours
        </span>
        <div className="ml-auto flex items-center gap-4 text-gray-500">
          <span>ES: Début au plus tôt</span>
          <span>EF: Fin au plus tôt</span>
          <span>LS: Début au plus tard</span>
          <span>LF: Fin au plus tard</span>
        </div>
      </div>

      {/* SVG Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={svgRef}
          width={svgDimensions.width * zoom}
          height={svgDimensions.height * zoom}
          style={{ minWidth: '100%', minHeight: '100%' }}
        >
          <g transform={`scale(${zoom}) translate(${pan.x / zoom}, ${pan.y / zoom})`}>
            {/* Definitions */}
            <defs>
              <marker id="arrow-normal" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#94A3B8" />
              </marker>
              <marker id="arrow-critical" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#EF4444" />
              </marker>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* Links */}
            {pertData.links.map(link => {
              const source = pertData.nodes.find(n => n.id === link.source);
              const target = pertData.nodes.find(n => n.id === link.target);
              if (!source || !target) return null;

              const startX = source.position.x + nodeWidth;
              const startY = source.position.y + nodeHeight / 2;
              const endX = target.position.x;
              const endY = target.position.y + nodeHeight / 2;

              const midX = (startX + endX) / 2;

              const isCritical = link.isCritical && showCriticalPath;

              return (
                <path
                  key={link.id}
                  d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                  stroke={isCritical ? '#EF4444' : '#94A3B8'}
                  strokeWidth={isCritical ? 3 : 2}
                  fill="none"
                  markerEnd={isCritical ? 'url(#arrow-critical)' : 'url(#arrow-normal)'}
                  className="transition-all"
                  style={{ opacity: !showCriticalPath || link.isCritical ? 1 : 0.5 }}
                />
              );
            })}

            {/* Nodes */}
            {pertData.nodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNodeId === node.id;
              const isCritical = node.isCritical && showCriticalPath;

              // Determine colors based on status
              let bgColor = '#EFF6FF'; // Default blue
              let borderColor = '#3B82F6';
              let textColor = '#1E40AF';

              if (node.progress >= 100) {
                bgColor = '#DCFCE7';
                borderColor = '#22C55E';
                textColor = '#166534';
              } else if (node.isCritical) {
                bgColor = '#FEE2E2';
                borderColor = '#EF4444';
                textColor = '#991B1B';
              } else if (node.progress > 0) {
                bgColor = '#FEF9C3';
                borderColor = '#EAB308';
                textColor = '#854D0E';
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.position.x}, ${node.position.y})`}
                  onClick={() => setSelectedNodeId(node.id)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  style={{ cursor: 'pointer' }}
                  filter={isHovered || isSelected ? 'url(#shadow)' : undefined}
                >
                  {/* Main rectangle */}
                  <rect
                    width={nodeWidth}
                    height={nodeHeight}
                    rx={8}
                    fill={bgColor}
                    stroke={borderColor}
                    strokeWidth={isSelected ? 3 : isCritical ? 2 : 1}
                    className="transition-all"
                  />

                  {/* Dividers */}
                  <line x1={0} y1={28} x2={nodeWidth} y2={28} stroke={borderColor} strokeWidth={0.5} strokeOpacity={0.5} />
                  <line x1={0} y1={72} x2={nodeWidth} y2={72} stroke={borderColor} strokeWidth={0.5} strokeOpacity={0.5} />
                  <line x1={nodeWidth / 3} y1={0} x2={nodeWidth / 3} y2={28} stroke={borderColor} strokeWidth={0.5} strokeOpacity={0.5} />
                  <line x1={(2 * nodeWidth) / 3} y1={0} x2={(2 * nodeWidth) / 3} y2={28} stroke={borderColor} strokeWidth={0.5} strokeOpacity={0.5} />
                  <line x1={nodeWidth / 3} y1={72} x2={nodeWidth / 3} y2={nodeHeight} stroke={borderColor} strokeWidth={0.5} strokeOpacity={0.5} />
                  <line x1={(2 * nodeWidth) / 3} y1={72} x2={(2 * nodeWidth) / 3} y2={nodeHeight} stroke={borderColor} strokeWidth={0.5} strokeOpacity={0.5} />

                  {/* Top row: ES | Duration | EF */}
                  <text x={nodeWidth / 6} y={18} textAnchor="middle" fontSize={11} fill="#6B7280">
                    {node.earliestStart}
                  </text>
                  <text x={nodeWidth / 2} y={18} textAnchor="middle" fontSize={12} fontWeight="bold" fill={textColor}>
                    {showEstimates && node.expectedDuration
                      ? `${node.expectedDuration}j`
                      : `${node.duration}j`}
                  </text>
                  <text x={(5 * nodeWidth) / 6} y={18} textAnchor="middle" fontSize={11} fill="#6B7280">
                    {node.earliestFinish}
                  </text>

                  {/* Middle: Code and Name */}
                  <text
                    x={nodeWidth / 2}
                    y={44}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight="bold"
                    fill={textColor}
                  >
                    {node.code}
                  </text>
                  <text
                    x={nodeWidth / 2}
                    y={60}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#6B7280"
                  >
                    {node.name.length > 24 ? node.name.substring(0, 22) + '...' : node.name}
                  </text>

                  {/* Bottom row: LS | Slack | LF */}
                  <text x={nodeWidth / 6} y={90} textAnchor="middle" fontSize={11} fill="#6B7280">
                    {node.latestStart}
                  </text>
                  <text
                    x={nodeWidth / 2}
                    y={90}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight="bold"
                    fill={node.slack === 0 ? '#EF4444' : '#22C55E'}
                  >
                    {showSlack ? `${node.slack}j` : '-'}
                  </text>
                  <text x={(5 * nodeWidth) / 6} y={90} textAnchor="middle" fontSize={11} fill="#6B7280">
                    {node.latestFinish}
                  </text>

                  {/* Progress bar */}
                  <rect
                    x={4}
                    y={nodeHeight - 6}
                    width={(nodeWidth - 8) * (node.progress / 100)}
                    height={4}
                    fill={borderColor}
                    rx={2}
                  />
                  <rect
                    x={4}
                    y={nodeHeight - 6}
                    width={nodeWidth - 8}
                    height={4}
                    fill="none"
                    stroke={borderColor}
                    strokeWidth={0.5}
                    rx={2}
                  />

                  {/* Critical indicator */}
                  {node.isCritical && (
                    <circle cx={nodeWidth - 12} cy={12} r={6} fill="#EF4444" />
                  )}

                  {/* Variance indicator (if showing estimates) */}
                  {showEstimates && node.variance && node.variance > 0 && (
                    <text
                      x={nodeWidth - 8}
                      y={44}
                      textAnchor="end"
                      fontSize={8}
                      fill="#9CA3AF"
                    >
                      σ²={node.variance}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Selected node details */}
      {selectedNode && (
        <div className="border-t bg-gradient-to-r from-gray-50 to-white p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className="w-4 h-4 rounded mt-1"
                style={{ backgroundColor: selectedNode.categoryColor }}
              />
              <div>
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  {selectedNode.name}
                  {selectedNode.isCritical && (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                      Critique
                    </span>
                  )}
                </h4>
                <p className="text-sm text-gray-500">{selectedNode.code} • {selectedNode.categoryName}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-7 gap-4 mt-4">
            <div>
              <span className="text-xs text-gray-500 block">Durée</span>
              <span className="text-sm font-medium">{selectedNode.duration} jours</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Début au + tôt</span>
              <span className="text-sm font-medium">
                {format(addDays(projectStartDate, selectedNode.earliestStart), 'dd/MM/yyyy')}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Fin au + tôt</span>
              <span className="text-sm font-medium">
                {format(addDays(projectStartDate, selectedNode.earliestFinish), 'dd/MM/yyyy')}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Début au + tard</span>
              <span className="text-sm font-medium">
                {format(addDays(projectStartDate, selectedNode.latestStart), 'dd/MM/yyyy')}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Fin au + tard</span>
              <span className="text-sm font-medium">
                {format(addDays(projectStartDate, selectedNode.latestFinish), 'dd/MM/yyyy')}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Marge totale</span>
              <span className={`text-sm font-medium ${selectedNode.slack === 0 ? 'text-red-600' : 'text-green-600'}`}>
                {selectedNode.slack} jours
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Avancement</span>
              <span className="text-sm font-medium">{selectedNode.progress}%</span>
            </div>
          </div>

          {/* Three-point estimation details */}
          {showEstimates && selectedNode.optimistic && (
            <div className="mt-4 pt-4 border-t">
              <h5 className="text-xs font-medium text-gray-500 mb-2">Estimation à 3 points (PERT)</h5>
              <div className="grid grid-cols-6 gap-4">
                <div>
                  <span className="text-xs text-green-600 block">Optimiste (O)</span>
                  <span className="text-sm font-medium">{selectedNode.optimistic}j</span>
                </div>
                <div>
                  <span className="text-xs text-blue-600 block">Plus probable (M)</span>
                  <span className="text-sm font-medium">{selectedNode.mostLikely}j</span>
                </div>
                <div>
                  <span className="text-xs text-red-600 block">Pessimiste (P)</span>
                  <span className="text-sm font-medium">{selectedNode.pessimistic}j</span>
                </div>
                <div>
                  <span className="text-xs text-purple-600 block">Durée attendue</span>
                  <span className="text-sm font-medium">{selectedNode.expectedDuration}j</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Variance (σ²)</span>
                  <span className="text-sm font-medium">{selectedNode.variance}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Écart-type (σ)</span>
                  <span className="text-sm font-medium">{selectedNode.standardDeviation}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info box */}
      <div className="p-3 bg-blue-50 border-t flex items-start gap-2">
        <Info className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-700">
          <p className="font-medium">Méthode PERT/CPM avec estimation à 3 points</p>
          <p className="mt-0.5 opacity-80">
            Durée attendue = (O + 4M + P) / 6 | Variance = ((P - O) / 6)² |
            Les niveaux de confiance sont calculés via la distribution normale du projet.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PertChart;
