// ============================================================================
// PERT SERVICE - Calculate PERT/CPM Data
// ============================================================================

import { differenceInDays, addDays } from 'date-fns';
import type { SyncItem, SyncCategory, SyncDimension } from '@/types/sync.types';
import type { PertNode, PertLink, PertData, PertStatistics } from '@/types/pert.types';

/**
 * Calculate complete PERT data from SyncItems
 */
export function calculatePertData(
  items: SyncItem[],
  categories: SyncCategory[],
  projectStartDate: Date
): PertData {
  const categoryMap = new Map<string, SyncCategory>();
  categories.forEach(cat => categoryMap.set(cat.id, cat));

  // 1. Create initial nodes
  const nodes: PertNode[] = items
    .filter(item => item.plannedStartDate && item.plannedEndDate)
    .map(item => {
      const category = categoryMap.get(item.categoryId);
      const duration = Math.max(
        1,
        differenceInDays(new Date(item.plannedEndDate!), new Date(item.plannedStartDate!)) + 1
      );

      return {
        id: item.id?.toString() || item.code,
        itemId: item.id?.toString() || item.code,
        name: item.name,
        shortName: item.code,
        duration,
        earliestStart: 0,
        earliestFinish: 0,
        latestStart: 0,
        latestFinish: 0,
        slack: 0,
        isCritical: false,
        dependencies: [], // Would be populated if items have dependencies
        successors: [],
        position: { x: 0, y: 0 },
        dimension: category?.dimension || 'PROJECT',
        categoryId: item.categoryId,
        categoryName: category?.name,
        categoryColor: category?.color,
        progress: item.progressPercent,
        responsible: item.responsible,
      };
    });

  // 2. Build links based on sequential ordering within categories
  const links: PertLink[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Group nodes by category for automatic dependencies
  const nodesByCategory = new Map<string, PertNode[]>();
  nodes.forEach(node => {
    const list = nodesByCategory.get(node.categoryId) || [];
    list.push(node);
    nodesByCategory.set(node.categoryId, list);
  });

  // Create sequential dependencies within categories
  nodesByCategory.forEach(categoryNodes => {
    // Sort by planned start date
    categoryNodes.sort((a, b) => {
      const itemA = items.find(i => i.id?.toString() === a.id);
      const itemB = items.find(i => i.id?.toString() === b.id);
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

  // 3. Forward Pass (Calculate ES and EF)
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

  // Calculate forward pass for all nodes
  nodes.forEach(node => forwardPass(node.id));

  // 4. Calculate total project duration
  const totalDuration = Math.max(...nodes.map(n => n.earliestFinish));

  // 5. Backward Pass (Calculate LS and LF)
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

  // Calculate backward pass for all nodes
  nodes.forEach(node => backwardPass(node.id));

  // 6. Identify critical path
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

  // 7. Calculate node positions for rendering
  calculateNodePositions(nodes, nodeMap);

  // 8. Calculate project dates
  const projectEnd = addDays(projectStartDate, totalDuration);

  return {
    nodes,
    links,
    criticalPath,
    totalDuration,
    projectStart: projectStartDate,
    projectEnd,
  };
}

/**
 * Calculate node positions for visual layout
 */
function calculateNodePositions(
  nodes: PertNode[]
): void {
  // Group by level (based on earliest start)
  const levels = new Map<number, PertNode[]>();

  nodes.forEach(node => {
    const level = node.earliestStart;
    const list = levels.get(level) || [];
    list.push(node);
    levels.set(level, list);
  });

  // Assign positions
  const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b);
  const levelWidth = 200;
  const nodeHeight = 100;
  const padding = 50;

  // Normalize levels to sequential indices
  const levelIndices = new Map<number, number>();
  sortedLevels.forEach((level, index) => {
    levelIndices.set(level, index);
  });

  sortedLevels.forEach(level => {
    const nodesAtLevel = levels.get(level)!;
    const levelIndex = levelIndices.get(level)!;

    nodesAtLevel.forEach((node, nodeIndex) => {
      node.position = {
        x: padding + levelIndex * levelWidth,
        y: padding + nodeIndex * nodeHeight * 1.2,
      };
    });
  });
}

/**
 * Calculate PERT statistics
 */
export function calculatePertStatistics(data: PertData): PertStatistics {
  const totalTasks = data.nodes.length;
  const criticalTasks = data.nodes.filter(n => n.isCritical).length;
  const slacks = data.nodes.map(n => n.slack);
  const averageSlack = slacks.length > 0
    ? slacks.reduce((a, b) => a + b, 0) / slacks.length
    : 0;
  const tasksWithZeroSlack = data.nodes.filter(n => n.slack === 0).length;

  return {
    totalTasks,
    criticalTasks,
    averageSlack: Math.round(averageSlack * 10) / 10,
    totalDuration: data.totalDuration,
    criticalPathLength: data.criticalPath.length,
    tasksWithZeroSlack,
  };
}

/**
 * Filter PERT data by dimension
 */
export function filterPertDataByDimension(
  data: PertData,
  dimension: SyncDimension | 'ALL'
): PertData {
  if (dimension === 'ALL') return data;

  const filteredNodes = data.nodes.filter(n => n.dimension === dimension);
  const nodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredLinks = data.links.filter(
    l => nodeIds.has(l.source) && nodeIds.has(l.target)
  );

  // Recalculate critical path for filtered data
  const filteredCriticalPath = data.criticalPath.filter(id => nodeIds.has(id));

  return {
    ...data,
    nodes: filteredNodes,
    links: filteredLinks,
    criticalPath: filteredCriticalPath,
  };
}

/**
 * Get node color based on status
 */
export function getPertNodeColor(node: PertNode): {
  background: string;
  border: string;
  text: string;
} {
  if (node.progress >= 100) {
    return {
      background: '#DCFCE7',
      border: '#22C55E',
      text: '#166534',
    };
  }

  if (node.isCritical) {
    return {
      background: '#FEE2E2',
      border: '#EF4444',
      text: '#991B1B',
    };
  }

  if (node.progress > 0) {
    return {
      background: '#FEF9C3',
      border: '#EAB308',
      text: '#854D0E',
    };
  }

  return {
    background: '#EFF6FF',
    border: '#3B82F6',
    text: '#1E40AF',
  };
}

/**
 * Generate SVG path for curved links
 */
export function generateLinkPath(
  source: PertNode,
  target: PertNode,
  nodeWidth: number,
  nodeHeight: number
): string {
  const startX = source.position.x + nodeWidth;
  const startY = source.position.y + nodeHeight / 2;
  const endX = target.position.x;
  const endY = target.position.y + nodeHeight / 2;

  const midX = (startX + endX) / 2;

  return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
}

/**
 * Calculate node date from project start
 */
export function calculateNodeDate(
  projectStart: Date,
  dayOffset: number
): Date {
  return addDays(projectStart, dayOffset);
}
