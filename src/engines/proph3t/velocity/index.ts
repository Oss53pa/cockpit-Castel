// ============================================================================
// PROPH3T ENGINE V2 — VELOCITY MODULE
// ============================================================================

export { VelocityAnalyzer } from './velocityAnalyzer';
export type {
  VelocityUnit,
  VelocityDataPoint,
  VelocityTrend,
  VelocityMetrics,
  TeamVelocity,
  VelocityConfig,
} from './velocityAnalyzer';

export { BurnRateCalculator } from './burnRateCalculator';
export type {
  BurnRateDataPoint,
  BurnRateMetrics,
  BurnProjection,
  BurnScenario,
  CategoryBurn,
} from './burnRateCalculator';

export { ProjectionEngine } from './projectionEngine';
export type {
  ProjectionInput,
  CompletionProjection,
  IntegratedProjection,
  ScenarioOutcome,
  SensitivityAnalysis,
} from './projectionEngine';
