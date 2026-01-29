/**
 * Module de gestion des interdépendances entre actions
 */

export {
  buildDependencyGraph,
  getSuccessors,
  getPredecessors,
  getEdge,
  getRootNodes,
  getLeafNodes,
} from './graphBuilder';

export { calculateCriticalPath, recalculateWithDelay } from './criticalPath';

export {
  detectBlockages,
  isActionBlocked,
  getBlockageChain,
  getUnblockableActions,
} from './blockageDetector';

export {
  simulateDelay,
  applySimulationVisuals,
  clearSimulationVisuals,
  calculateDateImpact,
} from './whatIfSimulator';

export {
  calculateLayout,
  calculateEdgePath,
  generateEdgeSVGPath,
  calculateSVGDimensions,
  DEFAULT_LAYOUT_CONFIG,
} from './layout';
