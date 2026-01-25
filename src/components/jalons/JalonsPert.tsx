import { useMemo, useState, useRef } from 'react';
import { parseISO, differenceInDays } from 'date-fns';
import {
  Flag,
  Network,
  AlertTriangle,
  Clock,
  Info,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge, EmptyState, Button, Tooltip } from '@/components/ui';
import { useJalons, useActionsByJalon } from '@/hooks';
import { formatDate } from '@/lib/utils';
import {
  AXE_LABELS,
  AXES,
  type Jalon,
  type JalonStatus,
  type JalonFilters,
} from '@/types';

interface PertNode {
  id: number;
  jalon: Jalon;
  ES: number;
  EF: number;
  LS: number;
  LF: number;
  slack: number;
  duration: number;
  isCritical: boolean;
  // Position in grid
  phase: number; // Y axis (axe index)
  column: number; // X axis (time-based position)
  predecessors: number[];
  successors: number[];
}

const statusColors: Record<JalonStatus, { bg: string; border: string; text: string }> = {
  a_venir: { bg: 'bg-primary-100', border: 'border-primary-400', text: 'text-primary-700' },
  en_approche: { bg: 'bg-warning-100', border: 'border-warning-400', text: 'text-warning-700' },
  en_danger: { bg: 'bg-error-100', border: 'border-error-400', text: 'text-error-700' },
  atteint: { bg: 'bg-success-100', border: 'border-success-400', text: 'text-success-700' },
  depasse: { bg: 'bg-gray-700', border: 'border-gray-800', text: 'text-white' },
  annule: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-600' },
};

const phaseColors = [
  { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100', text: 'text-blue-800' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-100', text: 'text-emerald-800' },
  { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-100', text: 'text-amber-800' },
  { bg: 'bg-purple-50', border: 'border-purple-200', header: 'bg-purple-100', text: 'text-purple-800' },
  { bg: 'bg-rose-50', border: 'border-rose-200', header: 'bg-rose-100', text: 'text-rose-800' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', header: 'bg-cyan-100', text: 'text-cyan-800' },
];

interface JalonsPertProps {
  filters: JalonFilters;
  onEdit: (jalon: Jalon) => void;
  onView: (jalon: Jalon) => void;
}

function PertNodeCard({
  node,
  onView,
}: {
  node: PertNode;
  onView: () => void;
}) {
  const { jalon } = node;
  const config = statusColors[jalon.statut] || statusColors.a_venir;
  const actions = useActionsByJalon(jalon.id);
  const avancement = actions.length > 0
    ? Math.round(actions.reduce((sum, a) => sum + a.avancement, 0) / actions.length)
    : 0;

  return (
    <Tooltip
      content={
        <div className="text-xs max-w-[250px]">
          <p className="font-semibold mb-1">{jalon.titre}</p>
          <p className="text-primary-300 mb-1">{jalon.description}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 pt-2 border-t border-primary-600">
            <span>ES (Début tôt):</span><span className="font-mono">J{node.ES}</span>
            <span>EF (Fin tôt):</span><span className="font-mono">J{node.EF}</span>
            <span>LS (Début tard):</span><span className="font-mono">J{node.LS}</span>
            <span>LF (Fin tard):</span><span className="font-mono">J{node.LF}</span>
            <span>Marge:</span><span className={cn('font-mono', node.slack === 0 ? 'text-error-400' : 'text-success-400')}>{node.slack}j</span>
          </div>
        </div>
      }
    >
      <div
        className={cn(
          'w-[160px] rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg hover:scale-105',
          config.border,
          config.bg,
          node.isCritical && 'ring-2 ring-error-500 ring-offset-2'
        )}
        onClick={onView}
      >
        {/* PERT Header - ES / Duration / EF */}
        <div className="flex justify-between text-[9px] font-mono px-2 py-1 border-b border-inherit bg-white/50">
          <span title="Early Start">{node.ES}</span>
          <span className="font-bold" title="Durée">{node.duration}j</span>
          <span title="Early Finish">{node.EF}</span>
        </div>

        {/* Title */}
        <div className="px-2 py-2">
          <h4 className={cn('text-xs font-semibold line-clamp-2 leading-tight', config.text)}>
            {jalon.titre}
          </h4>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-primary-500">{formatDate(jalon.date_prevue)}</span>
            <span className="text-[10px] font-medium">{avancement}%</span>
          </div>
        </div>

        {/* PERT Footer - LS / Slack / LF */}
        <div className="flex justify-between text-[9px] font-mono px-2 py-1 border-t border-inherit bg-white/50">
          <span title="Late Start">{node.LS}</span>
          <span className={cn('font-bold', node.slack === 0 ? 'text-error-600' : 'text-success-600')} title="Marge">
            {node.slack}j
          </span>
          <span title="Late Finish">{node.LF}</span>
        </div>
      </div>
    </Tooltip>
  );
}

export function JalonsPert({ filters, onView }: JalonsPertProps) {
  const jalons = useJalons(filters);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Build PERT network with phases
  const { nodesByPhase, allNodes, projectDuration, criticalPathCount, maxColumns } = useMemo(() => {
    if (jalons.length === 0) {
      return { nodesByPhase: {}, allNodes: [], projectDuration: 0, criticalPathCount: 0, maxColumns: 0 };
    }

    // Group jalons by axe and sort by date within each axe
    const jalonsByAxe: Record<string, Jalon[]> = {};
    AXES.forEach(axe => {
      jalonsByAxe[axe] = jalons
        .filter(j => j.axe === axe)
        .sort((a, b) => {
          const dateA = a.date_prevue ? new Date(a.date_prevue).getTime() : 0;
          const dateB = b.date_prevue ? new Date(b.date_prevue).getTime() : 0;
          return dateA - dateB;
        });
    });

    // Find project start date
    const allDates = jalons
      .filter(j => j.date_prevue)
      .map(j => new Date(j.date_prevue!).getTime());
    const projectStart = allDates.length > 0 ? new Date(Math.min(...allDates)) : new Date();

    // Create nodes for each jalon
    const nodes: PertNode[] = [];
    const nodeMap: Record<number, PertNode> = {};
    let maxCol = 0;

    // Safe parse helper
    const safeParse = (dateStr: string | null | undefined, fallback: Date): Date => {
      if (!dateStr || typeof dateStr !== 'string') return fallback;
      try {
        const parsed = parseISO(dateStr);
        return isNaN(parsed.getTime()) ? fallback : parsed;
      } catch {
        return fallback;
      }
    };

    AXES.forEach((axe, phaseIndex) => {
      const axeJalons = jalonsByAxe[axe] || [];

      axeJalons.forEach((jalon, colIndex) => {
        const jalonDate = safeParse(jalon.date_prevue, projectStart);
        const daysFromStart = Math.max(0, differenceInDays(jalonDate, projectStart));

        const node: PertNode = {
          id: jalon.id || nodes.length,
          jalon,
          ES: 0,
          EF: daysFromStart,
          LS: 0,
          LF: 0,
          slack: 0,
          duration: 1,
          isCritical: false,
          phase: phaseIndex,
          column: colIndex,
          predecessors: [],
          successors: [],
        };

        nodes.push(node);
        if (jalon.id) nodeMap[jalon.id] = node;
        maxCol = Math.max(maxCol, colIndex);
      });
    });

    // Calculate durations based on consecutive jalons in same phase
    nodes.forEach((node, idx) => {
      const samePhaseNodes = nodes.filter(n => n.phase === node.phase && n.column < node.column);
      if (samePhaseNodes.length > 0) {
        const prevNode = samePhaseNodes[samePhaseNodes.length - 1];
        node.duration = Math.max(1, node.EF - prevNode.EF);
        node.predecessors.push(nodes.indexOf(prevNode));
        prevNode.successors.push(idx);
      } else {
        node.duration = Math.max(1, node.EF);
      }
    });

    // Add cross-phase dependencies (jalons that depend on previous phase completion)
    nodes.forEach((node, idx) => {
      if (node.column === 0 && node.phase > 0) {
        // First jalon of a phase depends on last jalon of previous phase
        const prevPhaseNodes = nodes.filter(n => n.phase === node.phase - 1);
        if (prevPhaseNodes.length > 0) {
          const lastPrevPhase = prevPhaseNodes[prevPhaseNodes.length - 1];
          if (!node.predecessors.includes(nodes.indexOf(lastPrevPhase))) {
            node.predecessors.push(nodes.indexOf(lastPrevPhase));
            lastPrevPhase.successors.push(idx);
          }
        }
      }
    });

    // Forward pass (calculate ES and EF)
    nodes.forEach((node) => {
      if (node.predecessors.length === 0) {
        node.ES = 0;
      } else {
        node.ES = Math.max(...node.predecessors.map(p => nodes[p].EF));
      }
      node.EF = node.ES + node.duration;
    });

    // Find project end
    const projectEnd = Math.max(...nodes.map(n => n.EF), 1);

    // Backward pass (calculate LS and LF)
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (node.successors.length === 0) {
        node.LF = projectEnd;
      } else {
        node.LF = Math.min(...node.successors.map(s => nodes[s].LS));
      }
      node.LS = node.LF - node.duration;
      node.slack = node.LS - node.ES;
      node.isCritical = node.slack === 0;
    }

    // Group nodes by phase
    const byPhase: Record<number, PertNode[]> = {};
    nodes.forEach(node => {
      if (!byPhase[node.phase]) byPhase[node.phase] = [];
      byPhase[node.phase].push(node);
    });

    const criticalCount = nodes.filter(n => n.isCritical).length;

    return {
      nodesByPhase: byPhase,
      allNodes: nodes,
      projectDuration: projectEnd,
      criticalPathCount: criticalCount,
      maxColumns: maxCol + 1,
    };
  }, [jalons]);

  // Calculate SVG paths for dependencies
  const dependencyPaths = useMemo(() => {
    const paths: { from: PertNode; to: PertNode; isCritical: boolean }[] = [];

    allNodes.forEach(node => {
      node.successors.forEach(succIdx => {
        const successor = allNodes[succIdx];
        paths.push({
          from: node,
          to: successor,
          isCritical: node.isCritical && successor.isCritical,
        });
      });
    });

    return paths;
  }, [allNodes]);

  const NODE_WIDTH = 160;
  const NODE_HEIGHT = 100;
  const H_GAP = 80;
  const V_GAP = 40;
  const PHASE_HEADER_WIDTH = 120;
  const PADDING = 40;

  // Get node position
  const getNodePosition = (node: PertNode) => {
    const x = PHASE_HEADER_WIDTH + PADDING + node.column * (NODE_WIDTH + H_GAP);
    const y = PADDING + node.phase * (NODE_HEIGHT + V_GAP);
    return { x, y };
  };

  if (jalons.length === 0) {
    return (
      <EmptyState
        icon={<Flag className="h-12 w-12" />}
        title="Aucun jalon"
        description="Aucun jalon ne correspond à vos critères"
      />
    );
  }

  const totalWidth = PHASE_HEADER_WIDTH + PADDING * 2 + maxColumns * (NODE_WIDTH + H_GAP);
  const totalHeight = PADDING * 2 + Object.keys(nodesByPhase).length * (NODE_HEIGHT + V_GAP);

  return (
    <div className="rounded-lg border bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary-50 shrink-0">
        <div className="flex items-center gap-3">
          <Network className="h-5 w-5 text-primary-600" />
          <div>
            <h3 className="font-semibold text-primary-900">Diagramme PERT - Jalons par Phase</h3>
            <p className="text-xs text-primary-500">
              Réseau des dépendances et chemin critique
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="secondary">{jalons.length} jalons</Badge>
            <div className="flex items-center gap-1 text-primary-600">
              <Clock className="h-4 w-4" />
              <span>Durée: <strong>{projectDuration}j</strong></span>
            </div>
            <div className="flex items-center gap-1 text-error-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Chemin critique: <strong>{criticalPathCount}</strong></span>
            </div>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 border rounded-lg bg-white px-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-primary-600 px-2 min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setScale(Math.min(1.5, scale + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* PERT Diagram */}
      <div className="flex-1 overflow-auto" ref={containerRef}>
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: totalWidth,
            height: totalHeight,
            minWidth: totalWidth,
            minHeight: totalHeight,
          }}
          className="relative"
        >
          {/* SVG for connection lines */}
          <svg
            ref={svgRef}
            className="absolute inset-0 pointer-events-none"
            width={totalWidth}
            height={totalHeight}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#94A3B8" />
              </marker>
              <marker
                id="arrowhead-critical"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#EF4444" />
              </marker>
            </defs>

            {/* Dependency arrows */}
            {dependencyPaths.map(({ from, to, isCritical }, idx) => {
              const fromPos = getNodePosition(from);
              const toPos = getNodePosition(to);

              const startX = fromPos.x + NODE_WIDTH;
              const startY = fromPos.y + NODE_HEIGHT / 2;
              const endX = toPos.x;
              const endY = toPos.y + NODE_HEIGHT / 2;

              // Create curved path if nodes are on different phases
              let pathD: string;
              if (from.phase !== to.phase) {
                const midX = (startX + endX) / 2;
                pathD = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
              } else {
                pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
              }

              return (
                <path
                  key={idx}
                  d={pathD}
                  fill="none"
                  stroke={isCritical ? '#EF4444' : '#94A3B8'}
                  strokeWidth={isCritical ? 3 : 1.5}
                  strokeDasharray={isCritical ? undefined : '4 2'}
                  markerEnd={`url(#arrowhead${isCritical ? '-critical' : ''})`}
                />
              );
            })}
          </svg>

          {/* Phase rows */}
          {Object.entries(nodesByPhase).map(([phaseIdx, phaseNodes]) => {
            const phase = parseInt(phaseIdx);
            const axe = AXES[phase];
            const phaseColor = phaseColors[phase % phaseColors.length];
            const y = PADDING + phase * (NODE_HEIGHT + V_GAP);

            return (
              <div key={phase}>
                {/* Phase header */}
                <div
                  className={cn(
                    'absolute rounded-lg border-2 flex items-center justify-center',
                    phaseColor.border,
                    phaseColor.header
                  )}
                  style={{
                    left: PADDING / 2,
                    top: y,
                    width: PHASE_HEADER_WIDTH - PADDING / 2,
                    height: NODE_HEIGHT,
                  }}
                >
                  <div className="text-center px-2">
                    <p className={cn('text-xs font-bold', phaseColor.text)}>
                      {AXE_LABELS[axe]}
                    </p>
                    <p className="text-[10px] text-primary-500 mt-1">
                      {phaseNodes.length} jalon{phaseNodes.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Phase background stripe */}
                <div
                  className={cn('absolute rounded-r-lg opacity-30', phaseColor.bg)}
                  style={{
                    left: PHASE_HEADER_WIDTH,
                    top: y - V_GAP / 4,
                    width: totalWidth - PHASE_HEADER_WIDTH,
                    height: NODE_HEIGHT + V_GAP / 2,
                  }}
                />

                {/* Nodes in this phase */}
                {phaseNodes.map(node => {
                  const pos = getNodePosition(node);
                  return (
                    <div
                      key={node.id}
                      className="absolute"
                      style={{ left: pos.x, top: pos.y }}
                    >
                      <PertNodeCard node={node} onView={() => onView(node.jalon)} />
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Start node */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: PADDING / 2,
              top: totalHeight / 2 - 30,
              width: 60,
              height: 60,
            }}
          >
            <div className="w-14 h-14 rounded-full bg-primary-900 flex flex-col items-center justify-center text-white shadow-lg">
              <span className="text-xs font-bold">START</span>
              <span className="text-[10px] opacity-75">J0</span>
            </div>
          </div>

          {/* End node */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: totalWidth - 80,
              top: totalHeight / 2 - 30,
              width: 60,
              height: 60,
            }}
          >
            <div className="w-14 h-14 rounded-full bg-success-600 flex flex-col items-center justify-center text-white shadow-lg">
              <span className="text-xs font-bold">FIN</span>
              <span className="text-[10px] opacity-75">J{projectDuration}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-3 border-t bg-primary-50 shrink-0">
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary-500" />
            <span className="font-medium text-primary-600">Légende:</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-8 h-0.5 bg-error-500" />
              <span>Chemin critique</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-8 h-0.5 border-t-2 border-dashed border-primary-400" />
              <span>Dépendance</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded border-2 border-error-500 ring-2 ring-error-500 ring-offset-1 bg-white" />
              <span>Jalon critique</span>
            </div>
          </div>

          <div className="h-4 w-px bg-primary-300" />

          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span><strong>ES</strong>=Début tôt</span>
            <span><strong>EF</strong>=Fin tôt</span>
            <span><strong>LS</strong>=Début tard</span>
            <span><strong>LF</strong>=Fin tard</span>
          </div>
        </div>
      </div>
    </div>
  );
}
