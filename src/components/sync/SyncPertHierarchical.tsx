/**
 * SyncPertHierarchical - PERT Chart avec 3 niveaux de hiérarchie
 * Niveau 1: AXE
 * Niveau 2: JALONS (sous chaque axe)
 * Niveau 3: ACTIONS (sous chaque jalon)
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ZoomIn,
  ZoomOut,
  Info,
  GitBranch,
  AlertCircle,
  Download,
  Clock,
  RefreshCw,
  Layers,
  Diamond,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Filter,
  X,
  SlidersHorizontal,
  AlertTriangle,
  ShieldCheck,
  Bug,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJalons, useActions } from '@/hooks';
import { Badge, Button, ScrollArea } from '@/components/ui';
import {
  AXES,
  AXE_LABELS,
  AXE_SHORT_LABELS,
  JALON_STATUS_LABELS,
  type Axe,
  type Jalon,
  type Action,
  type JalonStatus,
} from '@/types';

// ============================================================================
// TYPES
// ============================================================================

interface PertNode {
  id: string;
  type: 'axe' | 'jalon' | 'action';
  name: string;
  code: string;
  axe: Axe;
  duration: number;
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
  progress: number;
  color: string;
  jalonId?: number;
  jalonStatus?: JalonStatus;
  data: Axe | Jalon | Action;
}

interface PertLink {
  id: string;
  source: string;
  target: string;
  isCritical: boolean;
  type: 'axe-jalon' | 'jalon-jalon' | 'jalon-action' | 'action-action';
}

// Couleurs par axe
const axeColors: Record<Axe, { bg: string; light: string; dark: string }> = {
  axe1_rh: { bg: '#3B82F6', light: '#DBEAFE', dark: '#1E40AF' },
  axe2_commercial: { bg: '#10B981', light: '#D1FAE5', dark: '#065F46' },
  axe3_technique: { bg: '#F97316', light: '#FFEDD5', dark: '#9A3412' },
  axe4_budget: { bg: '#8B5CF6', light: '#EDE9FE', dark: '#5B21B6' },
  axe5_marketing: { bg: '#EC4899', light: '#FCE7F3', dark: '#9D174D' },
  axe6_exploitation: { bg: '#06B6D4', light: '#CFFAFE', dark: '#0E7490' },
  axe7_construction: { bg: '#14B8A6', light: '#CCFBF1', dark: '#0F766E' },
};

// Helper to safely get axe colors with fallback
const getAxeColors = (axe: string) => {
  return axeColors[axe as Axe] || axeColors.axe1_rh;
};

const jalonStatusColors: Record<JalonStatus, string> = {
  a_venir: '#6B7280',
  en_approche: '#F59E0B',
  en_danger: '#EF4444',
  atteint: '#22C55E',
  depasse: '#1F2937',
  annule: '#9CA3AF',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SyncPertHierarchicalProps {
  projectId: string;
}

export function SyncPertHierarchical({ projectId: _projectId }: SyncPertHierarchicalProps) {
  const jalons = useJalons({});
  const actions = useActions({});
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [showSlack, setShowSlack] = useState(true);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  const [expandedAxes, setExpandedAxes] = useState<Set<Axe>>(new Set(AXES));
  const [expandedJalons, setExpandedJalons] = useState<Set<number>>(new Set());

  // FILTRES
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAxes, setSelectedAxes] = useState<Set<Axe>>(new Set(AXES));
  const [selectedStatuses, setSelectedStatuses] = useState<Set<JalonStatus>>(
    new Set(['a_venir', 'en_approche', 'en_danger', 'atteint', 'depasse', 'annule'])
  );
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [progressFilter, setProgressFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');

  // Toggle axe filter
  const toggleAxeFilter = (axe: Axe) => {
    const newSet = new Set(selectedAxes);
    if (newSet.has(axe)) {
      newSet.delete(axe);
    } else {
      newSet.add(axe);
    }
    setSelectedAxes(newSet);
  };

  // Toggle status filter
  const toggleStatusFilter = (status: JalonStatus) => {
    const newSet = new Set(selectedStatuses);
    if (newSet.has(status)) {
      newSet.delete(status);
    } else {
      newSet.add(status);
    }
    setSelectedStatuses(newSet);
  };

  // Select all axes
  const selectAllAxes = () => setSelectedAxes(new Set(AXES));
  const clearAllAxes = () => setSelectedAxes(new Set());

  // Select all statuses
  const selectAllStatuses = () => setSelectedStatuses(new Set(['a_venir', 'en_approche', 'en_danger', 'atteint', 'depasse', 'annule']));
  const clearAllStatuses = () => setSelectedStatuses(new Set());

  // Reset all filters
  const resetFilters = () => {
    setSelectedAxes(new Set(AXES));
    setSelectedStatuses(new Set(['a_venir', 'en_approche', 'en_danger', 'atteint', 'depasse', 'annule']));
    setCriticalOnly(false);
    setProgressFilter('all');
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedAxes.size < AXES.length) count++;
    if (selectedStatuses.size < 6) count++;
    if (criticalOnly) count++;
    if (progressFilter !== 'all') count++;
    return count;
  }, [selectedAxes, selectedStatuses, criticalOnly, progressFilter]);

  // ============================================================================
  // VÉRIFICATION D'INTÉGRITÉ DES DONNÉES
  // ============================================================================
  const dataIntegrityIssues = useMemo(() => {
    const issues: {
      duplicateJalons: { id_jalon: string; count: number; jalons: Jalon[] }[];
      duplicateActions: { id_action: string; count: number; actions: Action[] }[];
      orphanActions: Action[];
      axeMismatchActions: { action: Action; actionAxe: Axe; jalonAxe: Axe }[];
    } = {
      duplicateJalons: [],
      duplicateActions: [],
      orphanActions: [],
      axeMismatchActions: [],
    };

    // 1. Détecter les jalons en double (par id_jalon)
    const jalonsByIdJalon = new Map<string, Jalon[]>();
    jalons.forEach(jalon => {
      const key = jalon.id_jalon;
      if (!jalonsByIdJalon.has(key)) {
        jalonsByIdJalon.set(key, []);
      }
      jalonsByIdJalon.get(key)!.push(jalon);
    });
    jalonsByIdJalon.forEach((jalonList, id_jalon) => {
      if (jalonList.length > 1) {
        issues.duplicateJalons.push({ id_jalon, count: jalonList.length, jalons: jalonList });
      }
    });

    // 2. Détecter les actions en double (par id_action)
    const actionsByIdAction = new Map<string, Action[]>();
    actions.forEach(action => {
      const key = action.id_action;
      if (!actionsByIdAction.has(key)) {
        actionsByIdAction.set(key, []);
      }
      actionsByIdAction.get(key)!.push(action);
    });
    actionsByIdAction.forEach((actionList, id_action) => {
      if (actionList.length > 1) {
        issues.duplicateActions.push({ id_action, count: actionList.length, actions: actionList });
      }
    });

    // 3. Créer un set des IDs de jalons existants
    const existingJalonIds = new Set(jalons.map(j => j.id));

    // 4. Détecter les actions orphelines et les incohérences d'axe
    actions.forEach(action => {
      if (action.jalonId) {
        // Vérifier si le jalon existe
        if (!existingJalonIds.has(action.jalonId)) {
          issues.orphanActions.push(action);
        } else {
          // Vérifier la cohérence de l'axe
          const linkedJalon = jalons.find(j => j.id === action.jalonId);
          if (linkedJalon && action.axe !== linkedJalon.axe) {
            issues.axeMismatchActions.push({
              action,
              actionAxe: action.axe,
              jalonAxe: linkedJalon.axe,
            });
          }
        }
      }
    });

    return issues;
  }, [jalons, actions]);

  // Calculer le nombre total de problèmes
  const totalIssues = useMemo(() => {
    return (
      dataIntegrityIssues.duplicateJalons.length +
      dataIntegrityIssues.duplicateActions.length +
      dataIntegrityIssues.orphanActions.length +
      dataIntegrityIssues.axeMismatchActions.length
    );
  }, [dataIntegrityIssues]);

  // État pour afficher/masquer le panneau de diagnostic
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Toggle axe
  const toggleAxe = (axe: Axe) => {
    const newSet = new Set(expandedAxes);
    if (newSet.has(axe)) {
      newSet.delete(axe);
    } else {
      newSet.add(axe);
    }
    setExpandedAxes(newSet);
  };

  // Toggle jalon
  const toggleJalon = (jalonId: number) => {
    const newSet = new Set(expandedJalons);
    if (newSet.has(jalonId)) {
      newSet.delete(jalonId);
    } else {
      newSet.add(jalonId);
    }
    setExpandedJalons(newSet);
  };

  // Expand/Collapse all
  const expandAll = () => {
    setExpandedAxes(new Set(AXES));
    setExpandedJalons(new Set(jalons.map(j => j.id!).filter(Boolean)));
  };

  const collapseAll = () => {
    setExpandedAxes(new Set());
    setExpandedJalons(new Set());
  };

  // Group jalons by axe - AVEC FILTRES
  const jalonsByAxe = useMemo(() => {
    const map = new Map<Axe, Jalon[]>();
    AXES.forEach(axe => map.set(axe, []));

    jalons.forEach(jalon => {
      // Appliquer les filtres
      if (!selectedAxes.has(jalon.axe)) return;
      if (!selectedStatuses.has(jalon.statut)) return;
      if (criticalOnly && !jalon.chemin_critique) return;

      const axeJalons = map.get(jalon.axe) || [];
      axeJalons.push(jalon);
      map.set(jalon.axe, axeJalons);
    });

    // Sort by date
    map.forEach((axeJalons, axe) => {
      map.set(axe, axeJalons.sort((a, b) => {
        const dateA = a.date_prevue ? new Date(a.date_prevue).getTime() : 0;
        const dateB = b.date_prevue ? new Date(b.date_prevue).getTime() : 0;
        return dateA - dateB;
      }));
    });

    return map;
  }, [jalons, selectedAxes, selectedStatuses, criticalOnly]);

  // Group actions by jalon - AVEC FILTRES
  const actionsByJalon = useMemo(() => {
    const map = new Map<number, Action[]>();

    actions.forEach(action => {
      if (action.jalonId) {
        // Appliquer filtre de progression
        if (progressFilter === 'not_started' && action.avancement > 0) return;
        if (progressFilter === 'in_progress' && (action.avancement === 0 || action.avancement >= 100)) return;
        if (progressFilter === 'completed' && action.avancement < 100) return;
        if (criticalOnly && !action.chemin_critique) return;

        const jalonActions = map.get(action.jalonId) || [];
        jalonActions.push(action);
        map.set(action.jalonId, jalonActions);
      }
    });

    // Sort by start date
    map.forEach((jalonActions, jalonId) => {
      map.set(jalonId, jalonActions.sort((a, b) => {
        const dateA = a.date_debut_prevue ? new Date(a.date_debut_prevue).getTime() : 0;
        const dateB = b.date_debut_prevue ? new Date(b.date_debut_prevue).getTime() : 0;
        return dateA - dateB;
      }));
    });

    return map;
  }, [actions, progressFilter, criticalOnly]);

  // Build PERT data
  const pertData = useMemo(() => {
    const nodes: PertNode[] = [];
    const links: PertLink[] = [];
    const nodeMap = new Map<string, PertNode>();

    const projectStartDate = new Date('2025-06-01');
    // AUGMENTÉ pour meilleure lisibilité
    const nodeWidth = 280;
    const nodeHeight = 100;
    const horizontalGap = 150;
    const verticalGap = 50;
    const padding = 80;

    let currentY = padding;

    // Process each axe
    AXES.forEach(axe => {
      const axeJalons = jalonsByAxe.get(axe) || [];
      if (axeJalons.length === 0) return;

      const axeColor = getAxeColors(axe);

      // Calculate axe duration from jalons
      const allDates: Date[] = [];
      axeJalons.forEach(j => {
        if (j.date_prevue) allDates.push(parseISO(j.date_prevue));
      });

      const axeStartDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : projectStartDate;
      const axeEndDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : projectStartDate;
      const axeDuration = Math.max(1, differenceInDays(axeEndDate, axeStartDate));
      const axeES = differenceInDays(axeStartDate, projectStartDate);

      // Calculate axe progress
      let totalProgress = 0;
      let progressCount = 0;
      axeJalons.forEach(jalon => {
        const jalonActions = actionsByJalon.get(jalon.id!) || [];
        jalonActions.forEach(a => {
          totalProgress += a.avancement;
          progressCount++;
        });
      });
      const axeProgress = progressCount > 0 ? Math.round(totalProgress / progressCount) : 0;

      // Create axe node
      const axeNode: PertNode = {
        id: `axe-${axe}`,
        type: 'axe',
        name: AXE_SHORT_LABELS[axe],
        code: axe.toUpperCase(),
        axe,
        duration: axeDuration,
        earliestStart: axeES,
        earliestFinish: axeES + axeDuration,
        latestStart: axeES,
        latestFinish: axeES + axeDuration,
        slack: 0,
        isCritical: false,
        dependencies: [],
        successors: [],
        position: { x: padding, y: currentY },
        level: 0,
        progress: axeProgress,
        color: axeColor.bg,
        data: axe,
      };

      nodes.push(axeNode);
      nodeMap.set(axeNode.id, axeNode);

      const axeStartY = currentY;
      currentY += nodeHeight + verticalGap;

      if (expandedAxes.has(axe)) {
        let prevJalonId: string | null = null;

        // Process jalons
        axeJalons.forEach((jalon, jalonIndex) => {
          const jalonDate = jalon.date_prevue ? parseISO(jalon.date_prevue) : projectStartDate;
          const jalonES = differenceInDays(jalonDate, projectStartDate);

          // Calculate jalon duration from actions
          const jalonActions = actionsByJalon.get(jalon.id!) || [];
          let jalonDuration = 1;
          let jalonProgress = jalon.statut === 'atteint' ? 100 : 0;

          if (jalonActions.length > 0) {
            const actionDates = jalonActions.flatMap(a => {
              const dates: Date[] = [];
              if (a.date_debut_prevue) dates.push(parseISO(a.date_debut_prevue));
              if (a.date_fin_prevue) dates.push(parseISO(a.date_fin_prevue));
              return dates;
            });
            if (actionDates.length > 0) {
              const minDate = new Date(Math.min(...actionDates.map(d => d.getTime())));
              jalonDuration = Math.max(1, differenceInDays(jalonDate, minDate));
            }
            jalonProgress = Math.round(jalonActions.reduce((sum, a) => sum + a.avancement, 0) / jalonActions.length);
          }

          const statusColor = jalonStatusColors[jalon.statut] || jalonStatusColors.a_venir;

          const jalonNode: PertNode = {
            id: `jalon-${jalon.id}`,
            type: 'jalon',
            name: jalon.titre,
            code: jalon.id_jalon,
            axe,
            duration: jalonDuration,
            earliestStart: Math.max(0, jalonES - jalonDuration),
            earliestFinish: jalonES,
            latestStart: Math.max(0, jalonES - jalonDuration),
            latestFinish: jalonES,
            slack: 0,
            isCritical: jalon.chemin_critique || false,
            dependencies: prevJalonId ? [prevJalonId] : [`axe-${axe}`],
            successors: [],
            position: { x: padding + nodeWidth + horizontalGap, y: currentY },
            level: 1,
            progress: jalonProgress,
            color: statusColor,
            jalonId: jalon.id,
            jalonStatus: jalon.statut,
            data: jalon,
          };

          nodes.push(jalonNode);
          nodeMap.set(jalonNode.id, jalonNode);

          // Link from previous jalon or axe
          if (prevJalonId) {
            links.push({
              id: `${prevJalonId}-${jalonNode.id}`,
              source: prevJalonId,
              target: jalonNode.id,
              isCritical: jalonNode.isCritical,
              type: 'jalon-jalon',
            });
            const prevNode = nodeMap.get(prevJalonId);
            if (prevNode) prevNode.successors.push(jalonNode.id);
          } else {
            links.push({
              id: `axe-${axe}-${jalonNode.id}`,
              source: `axe-${axe}`,
              target: jalonNode.id,
              isCritical: false,
              type: 'axe-jalon',
            });
            axeNode.successors.push(jalonNode.id);
          }

          currentY += nodeHeight + verticalGap;

          // Process actions if jalon is expanded
          if (expandedJalons.has(jalon.id!)) {
            let prevActionId: string | null = null;

            jalonActions.forEach((action, actionIndex) => {
              const actionStart = action.date_debut_prevue ? parseISO(action.date_debut_prevue) : projectStartDate;
              const actionEnd = action.date_fin_prevue ? parseISO(action.date_fin_prevue) : actionStart;
              const actionES = differenceInDays(actionStart, projectStartDate);
              const actionDuration = Math.max(1, differenceInDays(actionEnd, actionStart));

              const actionNode: PertNode = {
                id: `action-${action.id}`,
                type: 'action',
                name: action.titre,
                code: action.id_action,
                axe,
                duration: actionDuration,
                earliestStart: actionES,
                earliestFinish: actionES + actionDuration,
                latestStart: actionES,
                latestFinish: actionES + actionDuration,
                slack: 0,
                isCritical: action.chemin_critique || false,
                dependencies: prevActionId ? [prevActionId] : [jalonNode.id],
                successors: [],
                position: { x: padding + 2 * (nodeWidth + horizontalGap), y: currentY },
                level: 2,
                progress: action.avancement,
                color: axeColor.bg,
                jalonId: jalon.id,
                data: action,
              };

              nodes.push(actionNode);
              nodeMap.set(actionNode.id, actionNode);

              // Link
              if (prevActionId) {
                links.push({
                  id: `${prevActionId}-${actionNode.id}`,
                  source: prevActionId,
                  target: actionNode.id,
                  isCritical: actionNode.isCritical,
                  type: 'action-action',
                });
                const prevNode = nodeMap.get(prevActionId);
                if (prevNode) prevNode.successors.push(actionNode.id);
              } else {
                links.push({
                  id: `${jalonNode.id}-${actionNode.id}`,
                  source: jalonNode.id,
                  target: actionNode.id,
                  isCritical: false,
                  type: 'jalon-action',
                });
                jalonNode.successors.push(actionNode.id);
              }

              currentY += 80 + 30; // Augmenté pour meilleure lisibilité
              prevActionId = actionNode.id;
            });
          }

          prevJalonId = jalonNode.id;
        });
      }

      currentY += 20; // Gap between axes
    });

    // Calculate critical path
    const criticalPath = nodes.filter(n => n.isCritical).map(n => n.id);

    // Total duration
    const totalDuration = nodes.length > 0
      ? Math.max(...nodes.map(n => n.earliestFinish))
      : 0;

    return {
      nodes,
      links,
      criticalPath,
      totalDuration,
      nodeMap,
    };
  }, [jalonsByAxe, actionsByJalon, expandedAxes, expandedJalons]);

  // SVG dimensions - AUGMENTÉ
  const svgDimensions = useMemo(() => {
    if (pertData.nodes.length === 0) {
      return { width: 1200, height: 800 };
    }

    const maxX = Math.max(...pertData.nodes.map(n => n.position.x));
    const maxY = Math.max(...pertData.nodes.map(n => n.position.y));

    return {
      width: maxX + 400,
      height: maxY + 200,
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

  const handleResetView = () => {
    setZoom(0.8);
    setPan({ x: 0, y: 0 });
  };

  // Get selected node
  const selectedNode = selectedNodeId ? pertData.nodeMap.get(selectedNodeId) : null;

  // Statistics
  const stats = useMemo(() => {
    const axeCount = AXES.filter(a => (jalonsByAxe.get(a)?.length || 0) > 0).length;
    const jalonCount = jalons.length;
    const actionCount = actions.filter(a => a.jalonId).length;
    const criticalCount = pertData.nodes.filter(n => n.isCritical).length;

    return { axeCount, jalonCount, actionCount, criticalCount, totalDuration: pertData.totalDuration };
  }, [jalonsByAxe, jalons, actions, pertData]);

  // Node dimensions - AUGMENTÉ pour meilleure lisibilité
  const getNodeDimensions = (type: 'axe' | 'jalon' | 'action') => {
    switch (type) {
      case 'axe': return { width: 280, height: 100 };
      case 'jalon': return { width: 280, height: 100 };
      case 'action': return { width: 250, height: 80 };
    }
  };

  // Render
  if (jalons.length === 0 && actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border">
        <GitBranch className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée PERT disponible</h3>
        <p className="text-gray-500 text-center max-w-md">
          Ajoutez des jalons et des actions pour générer le diagramme PERT hiérarchique.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col" style={{ height: '850px' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary-50 to-white">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary-100 rounded-lg">
            <GitBranch className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">PERT Hiérarchique</h3>
            <p className="text-xs text-gray-500">
              {stats.axeCount} axes • {stats.jalonCount} jalons • {stats.actionCount} actions •{' '}
              <span className="text-red-600 font-medium">{stats.criticalCount} critiques</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Expand/Collapse */}
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={expandAll}>
              <ChevronDown className="h-4 w-4 mr-1" />
              Déplier
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              <ChevronRight className="h-4 w-4 mr-1" />
              Replier
            </Button>
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors',
              showFilters || activeFiltersCount > 0
                ? 'bg-purple-100 border-purple-300 text-purple-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            )}
          >
            <Filter className="h-4 w-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-purple-600 text-white rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Diagnostics button */}
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors',
              totalIssues > 0
                ? 'bg-red-100 border-red-300 text-red-700'
                : 'bg-green-100 border-green-300 text-green-700'
            )}
          >
            {totalIssues > 0 ? (
              <Bug className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {totalIssues > 0 ? `${totalIssues} problème${totalIssues > 1 ? 's' : ''}` : 'Données OK'}
          </button>

          {/* Toggle buttons */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <button
              onClick={() => setShowCriticalPath(!showCriticalPath)}
              className={cn(
                'p-1.5 rounded transition-colors',
                showCriticalPath ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-gray-600'
              )}
              title="Chemin critique"
            >
              <AlertCircle className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowSlack(!showSlack)}
              className={cn(
                'p-1.5 rounded transition-colors',
                showSlack ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'
              )}
              title="Marges"
            >
              <Clock className="h-4 w-4" />
            </button>
          </div>

          {/* Zoom */}
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
              title="Réinitialiser"
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

      {/* Filter Panel */}
      {showFilters && (
        <div className="px-4 py-4 border-b bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Filtres</h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetFilters}
                className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Réinitialiser
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {/* Filter by Axe */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Par Axe</span>
                <div className="flex gap-1">
                  <button onClick={selectAllAxes} className="text-xs text-blue-600 hover:underline">Tous</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={clearAllAxes} className="text-xs text-blue-600 hover:underline">Aucun</button>
                </div>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {AXES.map(axe => (
                  <label key={axe} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded">
                    <input
                      type="checkbox"
                      checked={selectedAxes.has(axe)}
                      onChange={() => toggleAxeFilter(axe)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: getAxeColors(axe).bg }}
                    />
                    <span className="text-sm text-gray-700">{AXE_SHORT_LABELS[axe]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter by Status */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Par Statut Jalon</span>
                <div className="flex gap-1">
                  <button onClick={selectAllStatuses} className="text-xs text-blue-600 hover:underline">Tous</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={clearAllStatuses} className="text-xs text-blue-600 hover:underline">Aucun</button>
                </div>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {(Object.keys(JALON_STATUS_LABELS) as JalonStatus[]).map(status => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.has(status)}
                      onChange={() => toggleStatusFilter(status)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: jalonStatusColors[status] }}
                    />
                    <span className="text-sm text-gray-700">{JALON_STATUS_LABELS[status]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter by Progress */}
            <div>
              <span className="text-sm font-medium text-gray-700 block mb-2">Par Avancement</span>
              <div className="space-y-1.5">
                {[
                  { value: 'all', label: 'Tous', color: 'bg-gray-400' },
                  { value: 'not_started', label: 'Non démarrés (0%)', color: 'bg-gray-300' },
                  { value: 'in_progress', label: 'En cours (1-99%)', color: 'bg-blue-500' },
                  { value: 'completed', label: 'Terminés (100%)', color: 'bg-green-500' },
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded">
                    <input
                      type="radio"
                      name="progressFilter"
                      checked={progressFilter === option.value}
                      onChange={() => setProgressFilter(option.value as typeof progressFilter)}
                      className="border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className={cn('w-3 h-3 rounded', option.color)} />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Critical Path Filter */}
            <div>
              <span className="text-sm font-medium text-gray-700 block mb-2">Options</span>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded border">
                  <input
                    type="checkbox"
                    checked={criticalOnly}
                    onChange={() => setCriticalOnly(!criticalOnly)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-700">Chemin critique uniquement</span>
                </label>
              </div>

              {/* Active filters summary */}
              {activeFiltersCount > 0 && (
                <div className="mt-3 p-2 bg-purple-100 rounded-lg">
                  <p className="text-xs text-purple-700">
                    <strong>{activeFiltersCount}</strong> filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    {pertData.nodes.filter(n => n.type === 'jalon').length} jalons •{' '}
                    {pertData.nodes.filter(n => n.type === 'action').length} actions affichés
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Diagnostics Panel */}
      {showDiagnostics && (
        <div className="px-4 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {totalIssues > 0 ? (
                <Bug className="h-5 w-5 text-red-600" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-green-600" />
              )}
              <h4 className="font-semibold text-gray-900">
                Diagnostic d'intégrité des données
              </h4>
            </div>
            <button
              onClick={() => setShowDiagnostics(false)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {totalIssues === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <ShieldCheck className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">Aucun problème détecté</p>
                <p className="text-sm text-green-600">
                  {jalons.length} jalons et {actions.length} actions vérifiés - Toutes les données sont cohérentes.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Jalons en double */}
              {dataIntegrityIssues.duplicateJalons.length > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-orange-800">
                      {dataIntegrityIssues.duplicateJalons.length} jalon(s) en double
                    </span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {dataIntegrityIssues.duplicateJalons.map((dup, idx) => (
                      <div key={idx} className="text-sm text-orange-700 bg-orange-100 p-2 rounded">
                        <span className="font-mono font-medium">{dup.id_jalon}</span>
                        <span className="mx-2">→</span>
                        <span>{dup.count} occurrences</span>
                        <span className="ml-2 text-xs">
                          (IDs: {dup.jalons.map(j => j.id).join(', ')})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions en double */}
              {dataIntegrityIssues.duplicateActions.length > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-orange-800">
                      {dataIntegrityIssues.duplicateActions.length} action(s) en double
                    </span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {dataIntegrityIssues.duplicateActions.map((dup, idx) => (
                      <div key={idx} className="text-sm text-orange-700 bg-orange-100 p-2 rounded">
                        <span className="font-mono font-medium">{dup.id_action}</span>
                        <span className="mx-2">→</span>
                        <span>{dup.count} occurrences</span>
                        <span className="ml-2 text-xs">
                          (IDs: {dup.actions.map(a => a.id).join(', ')})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions orphelines */}
              {dataIntegrityIssues.orphanActions.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-800">
                      {dataIntegrityIssues.orphanActions.length} action(s) orpheline(s)
                    </span>
                    <span className="text-xs text-red-600">(liées à des jalons inexistants)</span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {dataIntegrityIssues.orphanActions.map((action, idx) => (
                      <div key={idx} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                        <span className="font-mono font-medium">{action.id_action}</span>
                        <span className="mx-2">→</span>
                        <span>"{action.titre}"</span>
                        <span className="ml-2 text-xs">
                          (jalonId: {action.jalonId} n'existe pas)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incohérences d'axe */}
              {dataIntegrityIssues.axeMismatchActions.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-800">
                      {dataIntegrityIssues.axeMismatchActions.length} incohérence(s) d'axe
                    </span>
                    <span className="text-xs text-yellow-600">(axe de l'action ≠ axe du jalon)</span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {dataIntegrityIssues.axeMismatchActions.map((item, idx) => (
                      <div key={idx} className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded">
                        <span className="font-mono font-medium">{item.action.id_action}</span>
                        <span className="mx-2">→</span>
                        <span>Action: {AXE_SHORT_LABELS[item.actionAxe]}</span>
                        <span className="mx-1">≠</span>
                        <span>Jalon: {AXE_SHORT_LABELS[item.jalonAxe]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Résumé */}
              <div className="text-sm text-gray-600 pt-2 border-t">
                <span className="font-medium">Total vérifié:</span> {jalons.length} jalons, {actions.length} actions
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="px-4 py-2 border-b bg-gray-50 flex items-center gap-6 text-xs">
        <span className="flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-blue-600" />
          Axe
        </span>
        <span className="flex items-center gap-1.5">
          <Diamond className="h-4 w-4 text-orange-600" />
          Jalon
        </span>
        <span className="flex items-center gap-1.5">
          <CheckSquare className="h-4 w-4 text-gray-600" />
          Action
        </span>
        <span className="border-l pl-4 ml-2 flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-500"></span>
          Critique
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-500"></span>
          Terminé
        </span>
        <div className="ml-auto text-gray-500">
          ES: Début tôt • EF: Fin tôt • Marge: Flexibilité
        </div>
      </div>

      {/* SVG Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing bg-gray-50"
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
            {/* Definitions - FLÈCHES PLUS GRANDES */}
            <defs>
              <marker id="arrow-pert-normal" markerWidth="14" markerHeight="10" refX="14" refY="5" orient="auto">
                <polygon points="0 0, 14 5, 0 10" fill="#94A3B8" />
              </marker>
              <marker id="arrow-pert-critical" markerWidth="14" markerHeight="10" refX="14" refY="5" orient="auto">
                <polygon points="0 0, 14 5, 0 10" fill="#EF4444" />
              </marker>
              <filter id="pert-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.2" />
              </filter>
            </defs>

            {/* Links */}
            {pertData.links.map(link => {
              const source = pertData.nodeMap.get(link.source);
              const target = pertData.nodeMap.get(link.target);
              if (!source || !target) return null;

              const sourceDim = getNodeDimensions(source.type);
              const targetDim = getNodeDimensions(target.type);

              const startX = source.position.x + sourceDim.width;
              const startY = source.position.y + sourceDim.height / 2;
              const endX = target.position.x;
              const endY = target.position.y + targetDim.height / 2;

              const midX = (startX + endX) / 2;
              const isCritical = link.isCritical && showCriticalPath;

              return (
                <path
                  key={link.id}
                  d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                  stroke={isCritical ? '#EF4444' : '#64748B'}
                  strokeWidth={isCritical ? 4 : 3}
                  fill="none"
                  markerEnd={isCritical ? 'url(#arrow-pert-critical)' : 'url(#arrow-pert-normal)'}
                  opacity={0.85}
                />
              );
            })}

            {/* Nodes */}
            {pertData.nodes.map(node => {
              const dim = getNodeDimensions(node.type);
              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNodeId === node.id;
              const isCritical = node.isCritical && showCriticalPath;

              // Colors
              let bgColor = node.color + '20';
              let borderColor = node.color;
              const textColor = node.color;

              if (node.progress >= 100) {
                bgColor = '#DCFCE7';
                borderColor = '#22C55E';
              } else if (isCritical) {
                bgColor = '#FEE2E2';
                borderColor = '#EF4444';
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.position.x}, ${node.position.y})`}
                  onClick={() => setSelectedNodeId(node.id)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  style={{ cursor: 'pointer' }}
                  filter={isHovered || isSelected ? 'url(#pert-shadow)' : undefined}
                >
                  {/* Main rect */}
                  <rect
                    width={dim.width}
                    height={dim.height}
                    rx={node.type === 'axe' ? 12 : node.type === 'jalon' ? 8 : 6}
                    fill={bgColor}
                    stroke={borderColor}
                    strokeWidth={isSelected ? 3 : isCritical ? 2 : 1.5}
                  />

                  {/* Icon - AGRANDI */}
                  {node.type === 'axe' && (
                    <g transform={`translate(12, ${dim.height / 2 - 12})`}>
                      <rect width={24} height={24} rx={6} fill={node.color} />
                      <text x={12} y={17} textAnchor="middle" fontSize={14} fill="white" fontWeight="bold">
                        {(AXES.indexOf(node.axe) + 1)}
                      </text>
                    </g>
                  )}
                  {node.type === 'jalon' && (
                    <g transform={`translate(12, ${dim.height / 2 - 10})`}>
                      <polygon points="10,0 20,10 10,20 0,10" fill={node.color} />
                    </g>
                  )}
                  {node.type === 'action' && (
                    <g transform={`translate(10, ${dim.height / 2 - 8})`}>
                      <rect width={16} height={16} rx={4} fill={node.color} opacity={0.8} />
                    </g>
                  )}

                  {/* Name - POLICE PLUS GRANDE */}
                  <text
                    x={node.type === 'action' ? 34 : 44}
                    y={node.type === 'action' ? 30 : 35}
                    fontSize={node.type === 'axe' ? 18 : node.type === 'jalon' ? 15 : 14}
                    fontWeight={node.type === 'action' ? '500' : 'bold'}
                    fill="#1F2937"
                  >
                    {node.name.length > 28 ? node.name.substring(0, 26) + '...' : node.name}
                  </text>

                  {/* Code */}
                  <text
                    x={node.type === 'action' ? 34 : 44}
                    y={node.type === 'action' ? 48 : 54}
                    fontSize={12}
                    fill="#6B7280"
                  >
                    {node.code}
                  </text>

                  {/* Duration & ES/EF */}
                  {node.type !== 'action' && (
                    <>
                      <text x={dim.width - 14} y={24} textAnchor="end" fontSize={14} fill="#4B5563" fontWeight="600">
                        {node.duration}j
                      </text>
                      <text x={dim.width - 14} y={42} textAnchor="end" fontSize={11} fill="#9CA3AF">
                        ES:{node.earliestStart} EF:{node.earliestFinish}
                      </text>
                    </>
                  )}

                  {/* Progress bar - PLUS GRAND */}
                  <rect
                    x={6}
                    y={dim.height - 14}
                    width={(dim.width - 12) * (node.progress / 100)}
                    height={8}
                    fill={borderColor}
                    rx={4}
                  />
                  <rect
                    x={6}
                    y={dim.height - 14}
                    width={dim.width - 12}
                    height={8}
                    fill="none"
                    stroke={borderColor}
                    strokeWidth={1}
                    rx={4}
                  />

                  {/* Progress text */}
                  <text x={dim.width - 14} y={dim.height - 20} textAnchor="end" fontSize={12} fill="#4B5563" fontWeight="600">
                    {node.progress}%
                  </text>

                  {/* Critical indicator */}
                  {node.isCritical && (
                    <circle cx={dim.width - 16} cy={16} r={8} fill="#EF4444" />
                  )}

                  {/* Slack indicator */}
                  {showSlack && node.slack > 0 && (
                    <text
                      x={dim.width / 2}
                      y={dim.height - 20}
                      textAnchor="middle"
                      fontSize={11}
                      fill="#22C55E"
                      fontWeight="bold"
                    >
                      +{node.slack}j
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
            <div className="flex items-start gap-3">
              <div
                className="w-4 h-4 rounded mt-1"
                style={{ backgroundColor: selectedNode.color }}
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
                <p className="text-sm text-gray-500">
                  {selectedNode.code} • {AXE_LABELS[selectedNode.axe]}
                  {selectedNode.jalonStatus && ` • ${JALON_STATUS_LABELS[selectedNode.jalonStatus]}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-6 gap-4 mt-4">
            <div>
              <span className="text-xs text-gray-500 block">Type</span>
              <span className="text-sm font-medium capitalize">{selectedNode.type}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Durée</span>
              <span className="text-sm font-medium">{selectedNode.duration} jours</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Début au + tôt</span>
              <span className="text-sm font-medium">J+{selectedNode.earliestStart}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Fin au + tôt</span>
              <span className="text-sm font-medium">J+{selectedNode.earliestFinish}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Marge</span>
              <span className={cn('text-sm font-medium', selectedNode.slack === 0 ? 'text-red-600' : 'text-green-600')}>
                {selectedNode.slack} jours
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Avancement</span>
              <span className="text-sm font-medium">{selectedNode.progress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-3 bg-blue-50 border-t flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-700">
          <p className="font-medium">Diagramme PERT Hiérarchique (AXE → JALON → ACTION)</p>
          <p className="mt-0.5 opacity-80">
            Cliquez sur les noeud pour voir les détails. Le chemin critique est affiché en rouge.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SyncPertHierarchical;
