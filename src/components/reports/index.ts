// Reports components index
// ============================================================================

// Main report components
export { AxisDeepDive } from './AxisDeepDive';

// Shared components
export { ReportHeader, KPICard } from './shared';

// ============================================================================
// Deep Dive sub-components
// ============================================================================
export { AxisHeader } from './AxisDeepDive/AxisHeader';
export { AxisMilestones } from './AxisDeepDive/AxisMilestones';
export { AxisActions } from './AxisDeepDive/AxisActions';
export { AxisRisks } from './AxisDeepDive/AxisRisks';
export { AxisRecommendations } from './AxisDeepDive/AxisRecommendations';
export { AxisSync } from './AxisDeepDive/AxisSync';

// ============================================================================
// Weekly Report components
// ============================================================================
export {
  WeeklyReport,
  WeeklySync,
  WeeklyKPIs,
  WeeklyActions,
  WeeklyMilestones,
  WeeklyAlerts,
  WeeklyWeather,
} from './WeeklyReport';

// ============================================================================
// Monthly Report components
// ============================================================================
export {
  MonthlyReport,
  MonthlySync,
  MonthlySummary,
  MonthlyKPIs,
  MonthlyCharts,
  MonthlyBudget,
  MonthlyRisks,
  MonthlyPlan,
} from './MonthlyReport';
