// Reports components index
// ============================================================================

// Main report components
export { AxisExco } from './AxisExco';

// Shared components
export { ReportHeader, KPICard } from './shared';

// ============================================================================
// EXCO sub-components
// ============================================================================
export { AxisHeader } from './AxisExco/AxisHeader';
export { AxisMilestones } from './AxisExco/AxisMilestones';
export { AxisActions } from './AxisExco/AxisActions';
export { AxisRisks } from './AxisExco/AxisRisks';
export { AxisRecommendations } from './AxisExco/AxisRecommendations';
export { AxisSync } from './AxisExco/AxisSync';

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
