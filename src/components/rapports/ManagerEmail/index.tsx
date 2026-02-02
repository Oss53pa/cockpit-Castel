// ============================================================================
// MODULE - Rapport Email Mensuel pour Managers
// ============================================================================

// Composants principaux
export { EmailTemplate, generateEmailHtml } from './EmailTemplate';
export { MonthlyReportPage } from './MonthlyReportPage';

// Composants UI
export { ReportHeader } from './components/ReportHeader';
export { SummaryCards } from './components/SummaryCards';
export { ActionsByAxis } from './components/ActionsByAxis';
export { MilestonesList } from './components/MilestonesList';
export { ResponsableSummary } from './components/ResponsableSummary';
export { ExportButtons } from './components/ExportButtons';

// Administration
export { EmailScheduleConfig } from './admin/EmailScheduleConfig';
export { EmailHistory } from './admin/EmailHistory';

// Hooks
export { useMonthlyReport, MOIS_FR, AXE_LABELS, formatDateFr, getMonthBounds } from './hooks/useMonthlyReport';
export type { MonthlyReportData, ResponsableSummary as ResponsableSummaryType } from './hooks/useMonthlyReport';

// Export par défaut : la page principale
export { MonthlyReportPage as default } from './MonthlyReportPage';
