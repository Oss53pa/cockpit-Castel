import { useMemo, useState, useRef } from 'react';
import { parseISO, differenceInDays } from 'date-fns';
import {
  CheckSquare,
  Network,
  AlertTriangle,
  Clock,
  Info,
  ZoomIn,
  ZoomOut,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge, EmptyState, Button, Progress, Tooltip } from '@/components/ui';
import { useActions } from '@/hooks';
import {
  AXE_LABELS,
  ACTION_STATUS_LABELS,
  AXES,
  type Action,
  type ActionStatus,
  type ActionFilters,
} from '@/types';

interface PertNode {
  id: number;
  action: Action;
  ES: number;
  EF: number;
  LS: number;
  LF: number;
  slack: number;
  duration: number;
  isCritical: boolean;
  phase: number;
  column: number;
  predecessors: number[];
  successors: number[];
}

const statusColors: Record<ActionStatus, { bg: string; border: string; text: string }> = {
  a_planifier: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
  planifie: { bg: 'bg-primary-100', border: 'border-primary-400', text: 'text-primary-700' },
  a_faire: { bg: 'bg-primary-200', border: 'border-primary-500', text: 'text-primary-800' },
  en_cours: { bg: 'bg-info-100', border: 'border-info-400', text: 'text-info-700' },
  en_attente: { bg: 'bg-warning-100', border: 'border-warning-400', text: 'text-warning-700' },
  bloque: { bg: 'bg-error-100', border: 'border-error-400', text: 'text-error-700' },
  en_validation: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700' },
  termine: { bg: 'bg-success-100', border: 'border-success-400', text: 'text-success-700' },
  annule: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-600' },
  reporte: { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
};

const phaseColors = [
  { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100', text: 'text-blue-800' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-100', text: 'text-emerald-800' },
  { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-100', text: 'text-amber-800' },
  { bg: 'bg-purple-50', border: 'border-purple-200', header: 'bg-purple-100', text: 'text-purple-800' },
  { bg: 'bg-rose-50', border: 'border-rose-200', header: 'bg-rose-100', text: 'text-rose-800' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', header: 'bg-cyan-100', text: 'text-cyan-800' },
];

interface ActionsPertProps {
  filters: ActionFilters;
  onEdit: (action: Action) => void;
  onView: (action: Action) => void;
}

function PertNodeCard({
  node,
  onView,
}: {
  node: PertNode;
  onView: () => void;
}) {
  const { action } = node;
  const config = statusColors[action.statut] || statusColors.a_planifier;

  return (
    <Tooltip
      content={
        <div className="text-xs max-w-[280px]">
          <p className="font-semibold mb-1">{action.titre}</p>
          {action.description && (
            <p className="text-primary-300 mb-1 line-clamp-2">{action.description}</p>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 pt-2 border-t border-primary-600">
            <span>ES (Début tôt):</span><span className="font-mono">J{node.ES}</span>
            <span>EF (Fin tôt):</span><span className="font-mono">J{node.EF}</span>
            <span>LS (Début tard):</span><span className="font-mono">J{node.LS}</span>
            <span>LF (Fin tard):</span><span className="font-mono">J{node.LF}</span>
            <span>Marge:</span>
            <span className={cn('font-mono', node.slack === 0 ? 'text-error-400' : 'text-success-400')}>
              {node.slack}j
            </span>
            <span>Avancement:</span><span>{action.avancement}%</span>
          </div>
        </div>
      }
    >
      <div
        className={cn(
          'w-[180px] rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg hover:scale-105',
          config.border,
          config.bg,
          node.isCritical && 'ring-2 ring-error-500 ring-offset-2'
        )}
        onClick={onView}
      >
        {/* PERT Header */}
        <div className="flex justify-between text-[9px] font-mono px-2 py-1 border-b border-inherit bg-white/50">
          <span title="Early Start">{node.ES}</span>
          <span className="font-bold" title="Durée">{node.duration}j</span>
          <span title="Early Finish">{node.EF}</span>
        </div>

        {/* Content */}
        <div className="px-2 py-2">
          <h4 className={cn('text-xs font-semibold line-clamp-2 leading-tight', config.text)}>
            {action.titre}
          </h4>
          <div className="flex items-center justify-between mt-1.5">
            <Badge className={cn('text-[9px] px-1.5 py-0', config.bg, config.text, config.border)}>
              {ACTION_STATUS_LABELS[action.statut] || 'À planifier'}
            </Badge>
          </div>
          {action.responsable && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-primary-500">
              <User className="h-3 w-3" />
              <span className="truncate">{action.responsable}</span>
            </div>
          )}
          <div className="mt-2">
            <Progress value={action.avancement} size="sm" className="h-1.5" />
            <span className="text-[10px] text-primary-500">{action.avancement}%</span>
          </div>
        </div>

        {/* PERT Footer */}
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

export function ActionsPert({ filters, onView }: ActionsPertProps) {
  const actions = useActions(filters);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const { nodesByPhase, allNodes, projectDuration, criticalPathCount, maxColumns } = useMemo(() => {
    if (actions.length === 0) {
      return { nodesByPhase: {}, allNodes: [], projectDuration: 0, criticalPathCount: 0, maxColumns: 0 };
    }

    // Group actions by axe and sort by date
    const actionsByAxe: Record<string, Action[]> = {};
    AXES.forEach(axe => {
      actionsByAxe[axe] = actions
        .filter(a => a.axe === axe)
        .sort((a, b) => {
          const dateA = a.date_debut_prevue ? new Date(a.date_debut_prevue).getTime() : 0;
          const dateB = b.date_debut_prevue ? new Date(b.date_debut_prevue).getTime() : 0;
          return dateA - dateB;
        });
    });

    // Find project start
    const allStartDates = actions
      .filter(a => a.date_debut_prevue)
      .map(a => new Date(a.date_debut_prevue!).getTime());
    const projectStart = allStartDates.length > 0 ? new Date(Math.min(...allStartDates)) : new Date();

    // Create nodes
    const nodes: PertNode[] = [];
    let maxCol = 0;

    AXES.forEach((axe, phaseIndex) => {
      const axeActions = actionsByAxe[axe] || [];

      axeActions.forEach((action, colIndex) => {
        const startDate = action.date_debut_prevue ? parseISO(action.date_debut_prevue) : projectStart;
        const endDate = action.date_fin_prevue ? parseISO(action.date_fin_prevue) : startDate;
        const duration = Math.max(1, differenceInDays(endDate, startDate));
        const daysFromStart = Math.max(0, differenceInDays(startDate, projectStart));

        const node: PertNode = {
          id: action.id || nodes.length,
          action,
          ES: daysFromStart,
          EF: daysFromStart + duration,
          LS: 0,
          LF: 0,
          slack: 0,
          duration,
          isCritical: false,
          phase: phaseIndex,
          column: colIndex,
          predecessors: [],
          successors: [],
        };

        nodes.push(node);
        maxCol = Math.max(maxCol, colIndex);
      });
    });

    // Build dependencies within same phase
    nodes.forEach((node, idx) => {
      const samePhaseNodes = nodes.filter(n => n.phase === node.phase && n.column < node.column);
      if (samePhaseNodes.length > 0) {
        const prevNode = samePhaseNodes[samePhaseNodes.length - 1];
        const prevIdx = nodes.indexOf(prevNode);
        node.predecessors.push(prevIdx);
        prevNode.successors.push(idx);
      }
    });

    // Cross-phase dependencies
    nodes.forEach((node, idx) => {
      if (node.column === 0 && node.phase > 0) {
        const prevPhaseNodes = nodes.filter(n => n.phase === node.phase - 1);
        if (prevPhaseNodes.length > 0) {
          const lastPrevPhase = prevPhaseNodes[prevPhaseNodes.length - 1];
          const prevIdx = nodes.indexOf(lastPrevPhase);
          if (!node.predecessors.includes(prevIdx)) {
            node.predecessors.push(prevIdx);
            lastPrevPhase.successors.push(idx);
          }
        }
      }
    });

    // Forward pass
    nodes.forEach((node) => {
      if (node.predecessors.length > 0) {
        node.ES = Math.max(...node.predecessors.map(p => nodes[p].EF));
        node.EF = node.ES + node.duration;
      }
    });

    // Find project end
    const projectEnd = Math.max(...nodes.map(n => n.EF), 1);

    // Backward pass
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

    // Group by phase
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
  }, [actions]);

  // Dependency paths for SVG
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

  const NODE_WIDTH = 180;
  const NODE_HEIGHT = 140;
  const H_GAP = 60;
  const V_GAP = 30;
  const PHASE_HEADER_WIDTH = 120;
  const PADDING = 40;

  const getNodePosition = (node: PertNode) => {
    const x = PHASE_HEADER_WIDTH + PADDING + node.column * (NODE_WIDTH + H_GAP);
    const y = PADDING + node.phase * (NODE_HEIGHT + V_GAP);
    return { x, y };
  };

  if (actions.length === 0) {
    return (
      <EmptyState
        icon={<CheckSquare className="h-12 w-12" />}
        title="Aucune action"
        description="Aucune action ne correspond à vos critères"
      />
    );
  }

  const totalWidth = PHASE_HEADER_WIDTH + PADDING * 2 + maxColumns * (NODE_WIDTH + H_GAP) + 100;
  const totalHeight = PADDING * 2 + Object.keys(nodesByPhase).length * (NODE_HEIGHT + V_GAP);

  return (
    <div className="rounded-lg border bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary-50 shrink-0">
        <div className="flex items-center gap-3">
          <Network className="h-5 w-5 text-primary-600" />
          <div>
            <h3 className="font-semibold text-primary-900">Diagramme PERT - Actions par Phase</h3>
            <p className="text-xs text-primary-500">
              Réseau des dépendances et chemin critique
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="secondary">{actions.length} actions</Badge>
            <div className="flex items-center gap-1 text-primary-600">
              <Clock className="h-4 w-4" />
              <span>Durée: <strong>{projectDuration}j</strong></span>
            </div>
            <div className="flex items-center gap-1 text-error-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Chemin critique: <strong>{criticalPathCount}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-1 border rounded-lg bg-white px-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setScale(Math.max(0.4, scale - 0.1))}
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
      <div className="flex-1 overflow-auto min-h-[500px]" ref={containerRef}>
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
          {/* SVG connections */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={totalWidth}
            height={totalHeight}
          >
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#94A3B8" />
              </marker>
              <marker id="arrow-crit" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#EF4444" />
              </marker>
            </defs>

            {dependencyPaths.map(({ from, to, isCritical }, idx) => {
              const fromPos = getNodePosition(from);
              const toPos = getNodePosition(to);

              const startX = fromPos.x + NODE_WIDTH;
              const startY = fromPos.y + NODE_HEIGHT / 2;
              const endX = toPos.x;
              const endY = toPos.y + NODE_HEIGHT / 2;

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
                  markerEnd={`url(#arrow${isCritical ? '-crit' : ''})`}
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
                      {phaseNodes.length} action{phaseNodes.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Phase stripe */}
                <div
                  className={cn('absolute rounded-r-lg opacity-30', phaseColor.bg)}
                  style={{
                    left: PHASE_HEADER_WIDTH,
                    top: y - V_GAP / 4,
                    width: totalWidth - PHASE_HEADER_WIDTH,
                    height: NODE_HEIGHT + V_GAP / 2,
                  }}
                />

                {/* Nodes */}
                {phaseNodes.map(node => {
                  const pos = getNodePosition(node);
                  return (
                    <div
                      key={node.id}
                      className="absolute"
                      style={{ left: pos.x, top: pos.y }}
                    >
                      <PertNodeCard node={node} onView={() => onView(node.action)} />
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Start node */}
          <div
            className="absolute flex items-center justify-center"
            style={{ left: PADDING / 2, top: totalHeight / 2 - 30, width: 60, height: 60 }}
          >
            <div className="w-14 h-14 rounded-full bg-primary-900 flex flex-col items-center justify-center text-white shadow-lg">
              <span className="text-xs font-bold">START</span>
              <span className="text-[10px] opacity-75">J0</span>
            </div>
          </div>

          {/* End node */}
          <div
            className="absolute flex items-center justify-center"
            style={{ left: totalWidth - 80, top: totalHeight / 2 - 30, width: 60, height: 60 }}
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
              <span>Action critique</span>
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
