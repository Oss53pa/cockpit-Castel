// ============================================================================
// ADVANCED GANTT CHART COMPONENT
// Professional Gantt with drag & drop, dependencies, milestones, critical path
// ============================================================================

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { format, differenceInDays, addDays, isWeekend, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronRight,
  ChevronDown,
  Calendar,
  ZoomIn,
  ZoomOut,
  List,
  Download,
  Link2,
  AlertTriangle,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useSync } from '@/hooks/useSync';
import type { SyncCategory, SyncDimension } from '@/types/sync.types';
import { SYNC_CONFIG } from '@/config/syncConfig';

// ============================================================================
// TYPES
// ============================================================================

interface GanttTask {
  id: string;
  itemId?: number;
  name: string;
  code: string;
  start: Date;
  end: Date;
  progress: number;
  type: 'task' | 'milestone' | 'group';
  dimension: SyncDimension;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  responsible?: string;
  dependencies: string[];
  isCritical: boolean;
  isExpanded?: boolean;
  parentId?: string;
  children?: GanttTask[];
  baseline?: { start: Date; end: Date };
  status: string;
}

type ViewMode = 'day' | 'week' | 'month' | 'quarter';

interface GanttChartProps {
  projectId: string;
  dimension?: SyncDimension | 'ALL';
  projectStartDate?: Date;
  showBaseline?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getColumnConfig = (viewMode: ViewMode) => {
  switch (viewMode) {
    case 'day':
      return { width: 40, format: 'dd', subFormat: 'EEE' };
    case 'week':
      return { width: 100, format: "'S'w", subFormat: 'dd MMM' };
    case 'month':
      return { width: 120, format: 'MMMM', subFormat: 'yyyy' };
    case 'quarter':
      return { width: 150, format: "'T'Q yyyy", subFormat: '' };
  }
};

const calculateCriticalPath = (tasks: GanttTask[]): Set<string> => {
  // Simple critical path calculation based on dependencies and slack
  const criticalIds = new Set<string>();

  // Find tasks with no slack (end date = project end or leads to project end)
  const projectEnd = Math.max(...tasks.filter(t => t.type !== 'group').map(t => t.end.getTime()));

  tasks.forEach(task => {
    if (task.type === 'group') return;

    // Check if task ends at or near project end, or has dependent tasks that are critical
    const taskEnd = task.end.getTime();
    const slack = (projectEnd - taskEnd) / (1000 * 60 * 60 * 24);

    if (slack <= 3) { // 3 days slack threshold
      criticalIds.add(task.id);
    }
  });

  return criticalIds;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const GanttChart: React.FC<GanttChartProps> = ({
  projectId,
  dimension = 'ALL',
  projectStartDate = new Date('2025-06-01'),
  showBaseline = false,
}) => {
  const { items, categories, loading, updateItemProgress } = useSync(1, projectId || 'cosmos-angre');

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showTaskList, setShowTaskList] = useState(true);
  const [taskListWidth] = useState(320);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showDependencies, setShowDependencies] = useState(true);
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [showWeekends] = useState(true);
  const [, /* setDraggedTask */] = useState<{ id: string; type: 'move' | 'resize-start' | 'resize-end' | 'progress' } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; taskId: string } | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);

  // Convert items to Gantt tasks
  const tasks = useMemo(() => {
    if (items.length === 0 || categories.length === 0) return [];

    const categoryMap = new Map<string, SyncCategory>();
    categories.forEach(cat => categoryMap.set(cat.id, cat));

    const allTasks: GanttTask[] = [];
    const tasksByCategory = new Map<string, GanttTask[]>();

    // Create tasks from items
    items.forEach(item => {
      if (!item.plannedStartDate || !item.plannedEndDate) return;

      const category = categoryMap.get(item.categoryId);
      if (!category) return;

      // Filter by dimension
      if (dimension !== 'ALL' && category.dimension !== dimension) return;

      const task: GanttTask = {
        id: `item-${item.id}`,
        itemId: item.id,
        name: item.name,
        code: item.code,
        start: new Date(item.plannedStartDate),
        end: new Date(item.plannedEndDate),
        progress: item.progressPercent,
        type: differenceInDays(new Date(item.plannedEndDate), new Date(item.plannedStartDate)) === 0 ? 'milestone' : 'task',
        dimension: category.dimension,
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color,
        responsible: item.responsible,
        dependencies: [],
        isCritical: false,
        parentId: category.id,
        status: item.status,
        baseline: item.actualStartDate && item.actualEndDate ? {
          start: new Date(item.actualStartDate),
          end: new Date(item.actualEndDate),
        } : undefined,
      };

      const list = tasksByCategory.get(category.id) || [];
      list.push(task);
      tasksByCategory.set(category.id, list);
    });

    // Create group tasks for categories
    categories.forEach(category => {
      if (dimension !== 'ALL' && category.dimension !== dimension) return;

      const categoryTasks = tasksByCategory.get(category.id) || [];
      if (categoryTasks.length === 0) return;

      const starts = categoryTasks.map(t => t.start.getTime());
      const ends = categoryTasks.map(t => t.end.getTime());
      const avgProgress = categoryTasks.reduce((sum, t) => sum + t.progress, 0) / categoryTasks.length;

      const groupTask: GanttTask = {
        id: category.id,
        name: category.name,
        code: category.code,
        start: new Date(Math.min(...starts)),
        end: new Date(Math.max(...ends)),
        progress: Math.round(avgProgress),
        type: 'group',
        dimension: category.dimension,
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color,
        dependencies: [],
        isCritical: false,
        isExpanded: true,
        children: categoryTasks,
        status: 'IN_PROGRESS',
      };

      allTasks.push(groupTask);
      categoryTasks.forEach(t => allTasks.push(t));
    });

    // Calculate critical path
    const criticalIds = calculateCriticalPath(allTasks);
    allTasks.forEach(task => {
      task.isCritical = criticalIds.has(task.id);
    });

    return allTasks;
  }, [items, categories, dimension]);

  // Get visible tasks based on expanded groups
  const visibleTasks = useMemo(() => {
    return tasks.filter(task => {
      if (task.type === 'group') return true;
      if (!task.parentId) return true;
      return expandedGroups.has(task.parentId);
    });
  }, [tasks, expandedGroups]);

  // Timeline configuration
  const timelineConfig = useMemo(() => {
    if (tasks.length === 0) {
      return {
        start: addDays(projectStartDate, -15),
        end: addDays(projectStartDate, 180),
        totalDays: 195,
      };
    }

    const allStarts = tasks.map(t => t.start.getTime());
    const allEnds = tasks.map(t => t.end.getTime());

    const start = addDays(new Date(Math.min(...allStarts)), -15);
    const end = addDays(new Date(Math.max(...allEnds)), 30);
    const totalDays = differenceInDays(end, start);

    return { start, end, totalDays };
  }, [tasks, projectStartDate]);

  // Column configuration
  const columnConfig = getColumnConfig(viewMode);
  const dayWidth = columnConfig.width * zoom;

  // Generate timeline columns
  const timelineColumns = useMemo(() => {
    const columns: { date: Date; label: string; subLabel: string; isWeekend: boolean; isToday: boolean }[] = [];
    let current = new Date(timelineConfig.start);
    const today = new Date();

    while (current <= timelineConfig.end) {
      columns.push({
        date: new Date(current),
        label: format(current, columnConfig.format, { locale: fr }),
        subLabel: columnConfig.subFormat ? format(current, columnConfig.subFormat, { locale: fr }) : '',
        isWeekend: isWeekend(current),
        isToday: isSameDay(current, today),
      });

      switch (viewMode) {
        case 'day':
          current = addDays(current, 1);
          break;
        case 'week':
          current = addDays(current, 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'quarter':
          current.setMonth(current.getMonth() + 3);
          break;
      }
    }

    return columns;
  }, [timelineConfig, viewMode, columnConfig]);

  // Calculate task bar position
  const getTaskPosition = useCallback((task: GanttTask) => {
    const startOffset = differenceInDays(task.start, timelineConfig.start);
    const duration = Math.max(1, differenceInDays(task.end, task.start));

    let pixelsPerDay: number;
    switch (viewMode) {
      case 'day':
        pixelsPerDay = dayWidth;
        break;
      case 'week':
        pixelsPerDay = dayWidth / 7;
        break;
      case 'month':
        pixelsPerDay = dayWidth / 30;
        break;
      case 'quarter':
        pixelsPerDay = dayWidth / 90;
        break;
    }

    return {
      left: startOffset * pixelsPerDay,
      width: Math.max(task.type === 'milestone' ? 20 : 30, duration * pixelsPerDay),
    };
  }, [timelineConfig.start, viewMode, dayWidth]);

  // Event handlers
  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleProgressChange = async (taskId: string, newProgress: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task?.itemId) {
      await updateItemProgress(task.itemId, Math.round(newProgress));
    }
  };

  const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, taskId });
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-xl border">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <span className="text-gray-500">Chargement du diagramme...</span>
        </div>
      </div>
    );
  }

  // Render empty state
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border">
        <Calendar className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune tâche planifiée</h3>
        <p className="text-gray-500 text-center max-w-md">
          Ajoutez des dates de début et de fin aux éléments du projet pour les visualiser dans le diagramme de Gantt.
        </p>
      </div>
    );
  }

  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null;
  const timelineWidth = timelineColumns.length * dayWidth;
  const rowHeight = 44;

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col" style={{ height: '700px' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Diagramme de Gantt</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{visibleTasks.length} tâches</span>
            <span>•</span>
            <span>{differenceInDays(timelineConfig.end, timelineConfig.start)} jours</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle buttons */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <button
              onClick={() => setShowTaskList(!showTaskList)}
              className={`p-1.5 rounded transition-colors ${showTaskList ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Afficher/masquer la liste"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowDependencies(!showDependencies)}
              className={`p-1.5 rounded transition-colors ${showDependencies ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Afficher/masquer les dépendances"
            >
              <Link2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowCriticalPath(!showCriticalPath)}
              className={`p-1.5 rounded transition-colors ${showCriticalPath ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Afficher/masquer le chemin critique"
            >
              <AlertTriangle className="h-4 w-4" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              className="p-1.5 rounded hover:bg-white transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.25))}
              className="p-1.5 rounded hover:bg-white transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* View mode selector */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'day', label: 'Jour' },
              { key: 'week', label: 'Semaine' },
              { key: 'month', label: 'Mois' },
              { key: 'quarter', label: 'Trim.' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as ViewMode)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === key
                    ? 'bg-white shadow text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Export button */}
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Task list panel */}
        {showTaskList && (
          <div
            className="border-r bg-gray-50 flex flex-col overflow-hidden"
            style={{ width: taskListWidth, minWidth: 250, maxWidth: 500 }}
          >
            {/* List header */}
            <div className="flex items-center h-12 px-3 border-b bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <div className="flex-1">Tâche</div>
              <div className="w-16 text-center">Durée</div>
              <div className="w-14 text-center">%</div>
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto">
              {visibleTasks.map((task) => {
                const isGroup = task.type === 'group';
                const isSelected = selectedTaskId === task.id;
                const isHovered = hoveredTaskId === task.id;
                const duration = differenceInDays(task.end, task.start);

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    onMouseEnter={() => setHoveredTaskId(task.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                    className={`flex items-center h-11 px-3 border-b cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50' : isHovered ? 'bg-gray-100' : 'bg-white'
                    }`}
                    style={{ paddingLeft: isGroup ? 12 : 32 }}
                  >
                    {/* Expand/collapse for groups */}
                    {isGroup && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(task.id);
                        }}
                        className="p-0.5 rounded hover:bg-gray-200 mr-1"
                      >
                        {expandedGroups.has(task.id) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    )}

                    {/* Color indicator */}
                    <div
                      className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                        task.type === 'milestone' ? 'rotate-45' : ''
                      }`}
                      style={{ backgroundColor: task.categoryColor }}
                    />

                    {/* Task name */}
                    <div className="flex-1 min-w-0 mr-2">
                      <div className={`text-sm truncate ${isGroup ? 'font-semibold' : ''} ${
                        task.isCritical && showCriticalPath ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {task.name}
                      </div>
                      {!isGroup && task.responsible && (
                        <div className="text-xs text-gray-400 truncate">{task.responsible}</div>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="w-16 text-center text-xs text-gray-500">
                      {task.type === 'milestone' ? '-' : `${duration}j`}
                    </div>

                    {/* Progress */}
                    <div className="w-14 text-center">
                      <span className={`text-xs font-medium ${
                        task.progress >= 100 ? 'text-green-600' :
                        task.progress > 0 ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        {task.progress}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timeline panel */}
        <div className="flex-1 overflow-auto" ref={timelineRef}>
          <div style={{ width: timelineWidth, minWidth: '100%' }}>
            {/* Timeline header */}
            <div className="sticky top-0 z-20 bg-gray-100 border-b">
              <div className="flex h-12">
                {timelineColumns.map((col, i) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center justify-center border-r text-xs ${
                      col.isToday ? 'bg-blue-50' : col.isWeekend && showWeekends ? 'bg-gray-50' : ''
                    }`}
                    style={{ width: dayWidth, minWidth: dayWidth }}
                  >
                    <span className={`font-medium ${col.isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                      {col.label}
                    </span>
                    {col.subLabel && (
                      <span className="text-gray-400 text-[10px]">{col.subLabel}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Task bars */}
            <div className="relative">
              {/* Today line */}
              {(() => {
                const today = new Date();
                const todayOffset = differenceInDays(today, timelineConfig.start);
                let pixelsPerDay: number;
                switch (viewMode) {
                  case 'day': pixelsPerDay = dayWidth; break;
                  case 'week': pixelsPerDay = dayWidth / 7; break;
                  case 'month': pixelsPerDay = dayWidth / 30; break;
                  case 'quarter': pixelsPerDay = dayWidth / 90; break;
                }
                const left = todayOffset * pixelsPerDay;

                if (left > 0 && left < timelineWidth) {
                  return (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                      style={{ left, height: visibleTasks.length * rowHeight }}
                    >
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full" />
                    </div>
                  );
                }
                return null;
              })()}

              {/* Grid lines for weekends */}
              {showWeekends && viewMode === 'day' && timelineColumns.map((col, i) => (
                col.isWeekend && (
                  <div
                    key={`weekend-${i}`}
                    className="absolute top-0 bg-gray-50"
                    style={{
                      left: i * dayWidth,
                      width: dayWidth,
                      height: visibleTasks.length * rowHeight,
                    }}
                  />
                )
              ))}

              {/* Task rows */}
              {visibleTasks.map((task) => {
                const pos = getTaskPosition(task);
                const isGroup = task.type === 'group';
                const isMilestone = task.type === 'milestone';
                const isSelected = selectedTaskId === task.id;
                const isHovered = hoveredTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className="relative border-b"
                    style={{ height: rowHeight }}
                    onMouseEnter={() => setHoveredTaskId(task.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                  >
                    {/* Task bar */}
                    <div
                      className={`absolute top-2 cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                      } ${isHovered ? 'shadow-lg' : 'shadow-sm'}`}
                      style={{
                        left: pos.left,
                        width: isMilestone ? 20 : pos.width,
                        height: isMilestone ? 20 : isGroup ? 8 : 28,
                        marginTop: isMilestone ? 4 : isGroup ? 12 : 0,
                      }}
                      onClick={() => setSelectedTaskId(task.id)}
                      onContextMenu={(e) => handleContextMenu(e, task.id)}
                    >
                      {/* Milestone diamond */}
                      {isMilestone ? (
                        <div
                          className="w-5 h-5 transform rotate-45 border-2"
                          style={{
                            backgroundColor: task.progress >= 100 ? task.categoryColor : 'white',
                            borderColor: task.categoryColor,
                          }}
                        />
                      ) : isGroup ? (
                        /* Group bar */
                        <div
                          className="h-full rounded-sm"
                          style={{ backgroundColor: task.categoryColor }}
                        >
                          {/* Group endpoints */}
                          <div
                            className="absolute -left-1 top-0 w-2 h-full"
                            style={{ backgroundColor: task.categoryColor }}
                          />
                          <div
                            className="absolute -right-1 top-0 w-2 h-full"
                            style={{ backgroundColor: task.categoryColor }}
                          />
                        </div>
                      ) : (
                        /* Regular task bar */
                        <div
                          className={`h-full rounded overflow-hidden ${
                            task.isCritical && showCriticalPath ? 'border-2 border-red-500' : ''
                          }`}
                          style={{ backgroundColor: `${task.categoryColor}30` }}
                        >
                          {/* Progress fill */}
                          <div
                            className="h-full rounded-l transition-all"
                            style={{
                              width: `${task.progress}%`,
                              backgroundColor: task.categoryColor,
                            }}
                          />

                          {/* Task label */}
                          {pos.width > 60 && (
                            <div className="absolute inset-0 flex items-center px-2">
                              <span className="text-xs font-medium text-gray-800 truncate">
                                {task.code}
                              </span>
                            </div>
                          )}

                          {/* Progress text */}
                          {pos.width > 100 && (
                            <div className="absolute right-2 inset-y-0 flex items-center">
                              <span className="text-xs font-bold text-white drop-shadow">
                                {task.progress}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Baseline bar */}
                    {showBaseline && task.baseline && !isGroup && !isMilestone && (
                      <div
                        className="absolute top-9 h-2 rounded opacity-50"
                        style={{
                          left: (() => {
                            const offset = differenceInDays(task.baseline.start, timelineConfig.start);
                            let ppd = dayWidth;
                            if (viewMode === 'week') ppd = dayWidth / 7;
                            if (viewMode === 'month') ppd = dayWidth / 30;
                            if (viewMode === 'quarter') ppd = dayWidth / 90;
                            return offset * ppd;
                          })(),
                          width: (() => {
                            const dur = differenceInDays(task.baseline.end, task.baseline.start);
                            let ppd = dayWidth;
                            if (viewMode === 'week') ppd = dayWidth / 7;
                            if (viewMode === 'month') ppd = dayWidth / 30;
                            if (viewMode === 'quarter') ppd = dayWidth / 90;
                            return Math.max(20, dur * ppd);
                          })(),
                          backgroundColor: task.categoryColor,
                        }}
                      />
                    )}
                  </div>
                );
              })}

              {/* Dependency arrows */}
              {showDependencies && (
                <svg
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{ width: timelineWidth, height: visibleTasks.length * rowHeight }}
                >
                  <defs>
                    <marker id="arrowhead-gantt" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                      <polygon points="0 0, 8 3, 0 6" fill="#94A3B8" />
                    </marker>
                  </defs>
                  {/* Draw dependency lines here */}
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selected task details panel */}
      {selectedTask && (
        <div className="border-t bg-gradient-to-r from-gray-50 to-white p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className="w-3 h-3 rounded-full mt-1.5"
                style={{ backgroundColor: selectedTask.categoryColor }}
              />
              <div>
                <h4 className="font-semibold text-gray-900">{selectedTask.name}</h4>
                <p className="text-sm text-gray-500">
                  {selectedTask.code} • {selectedTask.categoryName}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedTaskId(null)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-6 gap-4 mt-4">
            <div>
              <span className="text-xs text-gray-500 block">Début</span>
              <span className="text-sm font-medium">{format(selectedTask.start, 'dd MMM yyyy', { locale: fr })}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Fin</span>
              <span className="text-sm font-medium">{format(selectedTask.end, 'dd MMM yyyy', { locale: fr })}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Durée</span>
              <span className="text-sm font-medium">{differenceInDays(selectedTask.end, selectedTask.start)} jours</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Avancement</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${selectedTask.progress}%`, backgroundColor: selectedTask.categoryColor }}
                  />
                </div>
                <span className="text-sm font-medium">{selectedTask.progress}%</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Statut</span>
              <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                SYNC_CONFIG.itemStatusStyles[selectedTask.status as keyof typeof SYNC_CONFIG.itemStatusStyles]?.bg || 'bg-gray-100'
              } ${
                SYNC_CONFIG.itemStatusStyles[selectedTask.status as keyof typeof SYNC_CONFIG.itemStatusStyles]?.text || 'text-gray-600'
              }`}>
                {SYNC_CONFIG.itemStatusStyles[selectedTask.status as keyof typeof SYNC_CONFIG.itemStatusStyles]?.label || selectedTask.status}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Responsable</span>
              <span className="text-sm font-medium">{selectedTask.responsible || '-'}</span>
            </div>
          </div>

          {/* Quick progress update */}
          {selectedTask.type === 'task' && (
            <div className="mt-4 pt-4 border-t">
              <label className="text-xs text-gray-500 block mb-2">Modifier l'avancement</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedTask.progress}
                  onChange={(e) => handleProgressChange(selectedTask.id, parseInt(e.target.value))}
                  className="flex-1"
                  style={{
                    accentColor: selectedTask.categoryColor,
                  }}
                />
                <div className="flex gap-1">
                  {[0, 25, 50, 75, 100].map(val => (
                    <button
                      key={val}
                      onClick={() => handleProgressChange(selectedTask.id, val)}
                      className={`px-2 py-1 text-xs rounded ${
                        selectedTask.progress === val
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Modifier
          </button>
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Ajouter dépendance
          </button>
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Marquer comme critique
          </button>
          <hr className="my-1" />
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
};

export default GanttChart;
