// ============================================================================
// PERT CHART TYPES
// ============================================================================

import type { SyncDimension } from './sync.types';

// PERT Node (Task)
export interface PertNode {
  id: string;
  itemId: string;
  name: string;
  shortName: string; // Code for display
  duration: number; // Duration in days
  earliestStart: number; // ES - Earliest Start
  earliestFinish: number; // EF - Earliest Finish
  latestStart: number; // LS - Latest Start
  latestFinish: number; // LF - Latest Finish
  slack: number; // Total slack (LF - EF)
  isCritical: boolean; // On critical path
  dependencies: string[]; // IDs of predecessor nodes
  successors: string[]; // IDs of successor nodes
  position: { x: number; y: number }; // Position for rendering
  dimension: SyncDimension;
  categoryId: string;
  categoryName?: string;
  categoryColor?: string;
  progress: number; // 0-100
  responsible?: string;
}

// PERT Link (Dependency)
export interface PertLink {
  id: string;
  source: string; // Source node ID
  target: string; // Target node ID
  isCritical: boolean;
  lagDays?: number; // Optional lag/lead time
}

// Complete PERT data
export interface PertData {
  nodes: PertNode[];
  links: PertLink[];
  criticalPath: string[]; // IDs of nodes on critical path
  totalDuration: number; // Total project duration
  projectStart: Date;
  projectEnd: Date;
}

// PERT chart configuration
export interface PertConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  showSlack: boolean;
  showDates: boolean;
  showProgress: boolean;
  highlightCriticalPath: boolean;
}

// PERT chart state
export interface PertState {
  data: PertData | null;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  zoom: number;
  pan: { x: number; y: number };
}

// PERT Node visual styles
export interface PertNodeStyle {
  backgroundColor: string;
  borderColor: string;
  criticalColor: string;
  normalColor: string;
  selectedBorderWidth: number;
  normalBorderWidth: number;
}

// PERT event handlers
export interface PertEventHandlers {
  onNodeClick?: (node: PertNode) => void;
  onNodeDoubleClick?: (node: PertNode) => void;
  onLinkClick?: (link: PertLink) => void;
}

// PERT statistics
export interface PertStatistics {
  totalTasks: number;
  criticalTasks: number;
  averageSlack: number;
  totalDuration: number;
  criticalPathLength: number;
  tasksWithZeroSlack: number;
}

// Default PERT configuration
export const DEFAULT_PERT_CONFIG: PertConfig = {
  nodeWidth: 160,
  nodeHeight: 80,
  horizontalSpacing: 200,
  verticalSpacing: 120,
  showSlack: true,
  showDates: true,
  showProgress: true,
  highlightCriticalPath: true,
};

// PERT node colors
export const PERT_COLORS = {
  critical: {
    background: '#FEE2E2',
    border: '#EF4444',
    text: '#991B1B',
  },
  normal: {
    background: '#EFF6FF',
    border: '#3B82F6',
    text: '#1E40AF',
  },
  completed: {
    background: '#DCFCE7',
    border: '#22C55E',
    text: '#166534',
  },
  inProgress: {
    background: '#FEF9C3',
    border: '#EAB308',
    text: '#854D0E',
  },
};
