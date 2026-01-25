// ============================================================================
// GANTT CHART TYPES
// ============================================================================

import type { SyncDimension } from './sync.types';

// Task type for Gantt chart
export interface GanttTask {
  id: string;
  name: string;
  shortName: string;
  start: Date;
  end: Date;
  progress: number; // 0-100
  type: 'task' | 'milestone' | 'project';
  dependencies: string[];
  dimension: SyncDimension;
  categoryId: string;
  categoryName?: string;
  categoryColor?: string;
  responsible?: string;
  isDisabled?: boolean;
  isExpanded?: boolean;
  parentId?: string; // For grouping under category
}

// View mode options
export type GanttViewMode = 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year';

// Filter options
export interface GanttFilters {
  dimension: SyncDimension | 'ALL';
  status: 'ALL' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  categoryIds: string[];
  showMilestones: boolean;
  showDependencies: boolean;
}

// Column configuration
export interface GanttColumn {
  key: string;
  label: string;
  width: number;
  visible: boolean;
}

// Time scale configuration
export interface GanttTimeScale {
  startDate: Date;
  endDate: Date;
  viewMode: GanttViewMode;
  columnWidth: number;
}

// Gantt chart configuration
export interface GanttConfig {
  showTaskList: boolean;
  showToday: boolean;
  showProgress: boolean;
  showDependencies: boolean;
  barHeight: number;
  barCornerRadius: number;
  rowHeight: number;
  headerHeight: number;
}

// Task bar colors
export interface GanttBarColors {
  backgroundColor: string;
  progressColor: string;
  selectedColor?: string;
}

// Gantt chart state
export interface GanttState {
  tasks: GanttTask[];
  expandedGroups: Set<string>;
  selectedTaskId: string | null;
  hoveredTaskId: string | null;
  scrollPosition: { x: number; y: number };
  zoom: number;
}

// Event handlers
export interface GanttEventHandlers {
  onTaskClick?: (task: GanttTask) => void;
  onTaskDoubleClick?: (task: GanttTask) => void;
  onTaskDrag?: (task: GanttTask, start: Date, end: Date) => void;
  onProgressChange?: (task: GanttTask, progress: number) => void;
  onExpanderClick?: (task: GanttTask) => void;
}

// View mode column widths
export const GANTT_VIEW_MODE_COLUMN_WIDTHS: Record<GanttViewMode, number> = {
  Day: 60,
  Week: 120,
  Month: 200,
  Quarter: 280,
  Year: 400,
};

// Default configuration
export const DEFAULT_GANTT_CONFIG: GanttConfig = {
  showTaskList: true,
  showToday: true,
  showProgress: true,
  showDependencies: true,
  barHeight: 24,
  barCornerRadius: 4,
  rowHeight: 40,
  headerHeight: 50,
};
