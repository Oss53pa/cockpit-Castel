// ============================================================================
// GANTT SERVICE - Convert SyncItems to Gantt Tasks
// ============================================================================

import { differenceInDays, addDays, format } from 'date-fns';
import type { SyncItem, SyncCategory, SyncDimension } from '@/types/sync.types';
import type { GanttTask, GanttViewMode, GanttBarColors } from '@/types/gantt.types';

/**
 * Convert SyncItems to GanttTasks
 */
export function convertSyncItemsToGanttTasks(
  items: SyncItem[],
  categories: SyncCategory[]
): GanttTask[] {
  const tasks: GanttTask[] = [];
  const categoryMap = new Map<string, SyncCategory>();
  categories.forEach(cat => categoryMap.set(cat.id, cat));

  // Group items by category
  const itemsByCategory = new Map<string, SyncItem[]>();
  items.forEach(item => {
    const list = itemsByCategory.get(item.categoryId) || [];
    list.push(item);
    itemsByCategory.set(item.categoryId, list);
  });

  // Create category group tasks and item tasks
  categories.forEach(category => {
    const categoryItems = itemsByCategory.get(category.id) || [];
    if (categoryItems.length === 0) return;

    // Calculate category date range
    const itemsWithDates = categoryItems.filter(i => i.plannedStartDate && i.plannedEndDate);
    if (itemsWithDates.length === 0) return;

    const startDates = itemsWithDates.map(i => new Date(i.plannedStartDate!));
    const endDates = itemsWithDates.map(i => new Date(i.plannedEndDate!));

    const categoryStart = new Date(Math.min(...startDates.map(d => d.getTime())));
    const categoryEnd = new Date(Math.max(...endDates.map(d => d.getTime())));

    // Calculate category progress
    const categoryProgress = calculateCategoryProgress(categoryItems);

    // Category group task
    tasks.push({
      id: category.id,
      name: category.name,
      shortName: category.code,
      start: categoryStart,
      end: categoryEnd,
      progress: categoryProgress,
      type: 'project',
      dependencies: [],
      dimension: category.dimension,
      categoryId: category.id,
      categoryName: category.name,
      categoryColor: category.color,
      isExpanded: true,
    });

    // Item tasks
    categoryItems.forEach(item => {
      if (!item.plannedStartDate || !item.plannedEndDate) return;

      const itemStart = new Date(item.plannedStartDate);
      const itemEnd = new Date(item.plannedEndDate);
      const isMilestone = differenceInDays(itemEnd, itemStart) === 0;

      tasks.push({
        id: `item-${item.id}`,
        name: item.name,
        shortName: item.code,
        start: itemStart,
        end: itemEnd,
        progress: item.progressPercent,
        type: isMilestone ? 'milestone' : 'task',
        dependencies: [], // Could be populated from item dependencies if available
        dimension: category.dimension,
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color,
        responsible: item.responsible,
        parentId: category.id,
      });
    });
  });

  return tasks;
}

/**
 * Calculate weighted progress for items
 */
function calculateCategoryProgress(items: SyncItem[]): number {
  if (items.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  items.forEach(item => {
    weightedSum += item.progressPercent * (item.weight || 1);
    totalWeight += item.weight || 1;
  });

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Get bar colors based on category and progress
 */
export function getTaskBarColors(task: GanttTask): GanttBarColors {
  const baseColor = task.categoryColor || '#3B82F6';

  return {
    backgroundColor: `${baseColor}40`, // 25% opacity
    progressColor: baseColor,
    selectedColor: adjustColorBrightness(baseColor, -15),
  };
}

/**
 * Adjust color brightness
 */
export function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * Get column width for view mode
 */
export function getColumnWidth(viewMode: GanttViewMode): number {
  const widths: Record<GanttViewMode, number> = {
    Day: 60,
    Week: 120,
    Month: 200,
    Quarter: 280,
    Year: 400,
  };
  return widths[viewMode];
}

/**
 * Generate date range for timeline header
 */
export function generateTimelineRange(
  tasks: GanttTask[],
  viewMode: GanttViewMode,
  padding: number = 30 // days
): { start: Date; end: Date; units: Date[] } {
  if (tasks.length === 0) {
    const now = new Date();
    return {
      start: addDays(now, -padding),
      end: addDays(now, padding),
      units: generateTimeUnits(addDays(now, -padding), addDays(now, padding), viewMode),
    };
  }

  const minStart = new Date(Math.min(...tasks.map(t => t.start.getTime())));
  const maxEnd = new Date(Math.max(...tasks.map(t => t.end.getTime())));

  const start = addDays(minStart, -padding);
  const end = addDays(maxEnd, padding);

  return {
    start,
    end,
    units: generateTimeUnits(start, end, viewMode),
  };
}

/**
 * Generate time units for the timeline header
 */
function generateTimeUnits(start: Date, end: Date, viewMode: GanttViewMode): Date[] {
  const units: Date[] = [];
  let current = new Date(start);

  while (current <= end) {
    units.push(new Date(current));

    switch (viewMode) {
      case 'Day':
        current = addDays(current, 1);
        break;
      case 'Week':
        current = addDays(current, 7);
        break;
      case 'Month':
        current.setMonth(current.getMonth() + 1);
        break;
      case 'Quarter':
        current.setMonth(current.getMonth() + 3);
        break;
      case 'Year':
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
  }

  return units;
}

/**
 * Format date for timeline header
 */
export function formatTimeUnit(date: Date, viewMode: GanttViewMode): string {
  switch (viewMode) {
    case 'Day':
      return format(date, 'dd');
    case 'Week':
      return `S${format(date, 'w')}`;
    case 'Month':
      return format(date, 'MMM yy');
    case 'Quarter':
      return `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`;
    case 'Year':
      return format(date, 'yyyy');
  }
}

/**
 * Calculate task position on timeline
 */
export function calculateTaskPosition(
  task: GanttTask,
  timelineStart: Date,
  columnWidth: number,
  viewMode: GanttViewMode
): { left: number; width: number } {
  const startDays = differenceInDays(task.start, timelineStart);
  const durationDays = Math.max(1, differenceInDays(task.end, task.start));

  let unitsPerDay: number;
  switch (viewMode) {
    case 'Day':
      unitsPerDay = 1;
      break;
    case 'Week':
      unitsPerDay = 1 / 7;
      break;
    case 'Month':
      unitsPerDay = 1 / 30;
      break;
    case 'Quarter':
      unitsPerDay = 1 / 90;
      break;
    case 'Year':
      unitsPerDay = 1 / 365;
      break;
  }

  return {
    left: startDays * unitsPerDay * columnWidth,
    width: durationDays * unitsPerDay * columnWidth,
  };
}

/**
 * Filter tasks by dimension
 */
export function filterTasksByDimension(
  tasks: GanttTask[],
  dimension: SyncDimension | 'ALL'
): GanttTask[] {
  if (dimension === 'ALL') return tasks;
  return tasks.filter(t => t.dimension === dimension);
}

/**
 * Sort tasks for display (categories first, then items by start date)
 */
export function sortTasksForDisplay(tasks: GanttTask[]): GanttTask[] {
  return [...tasks].sort((a, b) => {
    // Categories (project type) first
    if (a.type === 'project' && b.type !== 'project') return -1;
    if (a.type !== 'project' && b.type === 'project') return 1;

    // Then by category ID
    if (a.categoryId !== b.categoryId) {
      return a.categoryId.localeCompare(b.categoryId);
    }

    // Then by start date
    return a.start.getTime() - b.start.getTime();
  });
}
