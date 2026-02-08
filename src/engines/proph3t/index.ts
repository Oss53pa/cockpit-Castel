// ============================================================================
// PROPH3T ENGINE V2 — MODULE PRINCIPAL
// ============================================================================
// Export centralisé de tous les composants du moteur
// ============================================================================

// Core
export * from './core/types';
export * from './core/constants';
export { Proph3tEngine, getProph3tEngine, resetProph3tEngine } from './core/proph3tEngine';
export type { EngineConfig, AnalysisResult, QuickDiagnostic } from './core/proph3tEngine';

// Analyzers
export { AnomalyDetector } from './analyzers/anomalyDetector';
export { CorrelationEngine } from './analyzers/correlationEngine';
export { CoherenceScanner } from './analyzers/coherenceScanner';
export type { CoherenceIssue, CoherenceScanResult } from './analyzers/coherenceScanner';

// Predictors
export { RiskPredictor } from './predictors/riskPredictor';
export { CostPredictor } from './predictors/costPredictor';
export type { EVMResult } from './predictors/costPredictor';
export { SchedulePredictor } from './predictors/schedulePredictor';
export { RevenuePredictor } from './predictors/revenuePredictor';

// Simulators
export { WhatIfSimulator } from './simulators/whatIfSimulator';

// Prescribers
export { ActionPrescriber } from './prescribers/actionPrescriber';
export type { PrescriptionInput, PrescriptionOutput, PrescriptionSummary } from './prescribers/actionPrescriber';
export { PriorityMatrix } from './prescribers/priorityMatrix';
export type { PrioritizedAction, PriorityScore, EisenhowerQuadrant } from './prescribers/priorityMatrix';
export { DecisionTree } from './prescribers/decisionTree';

// Memory
export { ProjectMemory } from './memory/projectMemory';
export type { MemoryExport, HistoricalEvent, ProjectTimeline, Milestone, Decision } from './memory/projectMemory';
export { PatternStore } from './memory/patternStore';
export type { Pattern, PatternMatch, PatternCategory } from './memory/patternStore';
export { FeedbackLoop } from './memory/feedbackLoop';
export type { Feedback, FeedbackStats, LearningInsight, FeedbackRating } from './memory/feedbackLoop';

// Reporters
export { ExcoReportGenerator } from './reporters/excoReportGenerator';
export type { ReportConfig, ReportContext } from './reporters/excoReportGenerator';
export { InsightNarrator } from './reporters/insightNarrator';
export type { NarrativeSection, ExecutiveSummary, ModuleNarrative, TrendNarrative } from './reporters/insightNarrator';
export { AlertManager } from './reporters/alertManager';
export type { Alert, AlertLevel, AlertStatus, AlertSummary } from './reporters/alertManager';
export { ReportCatalog, REPORT_CATALOG, REPORT_TEMPLATES } from './reporters/reportCatalog';
export type { ReportType, ReportDefinition, ScheduledReport } from './reporters/reportCatalog';

// Autonomous
export { AutonomousScheduler } from './autonomous/autonomousScheduler';
export type { ScheduledTask, TaskResult, SchedulerStatus } from './autonomous/autonomousScheduler';
export { NotificationManager } from './autonomous/notificationManager';
export type { Notification, NotificationChannel, NotificationPreferences } from './autonomous/notificationManager';

// ============================================================================
// ADDENDUM 2 MODULES
// ============================================================================

// Commitments
export { CommitmentTracker } from './commitments/commitmentTracker';
export type {
  Commitment,
  CommitmentStatus,
  CommitmentSource,
  CommitmentPriority,
  CommitmentStats,
  CommitmentByOwner,
} from './commitments/commitmentTracker';
export { ReliabilityScorer } from './commitments/reliabilityScorer';
export type {
  ReliabilityScore,
  ReliabilityFactors,
  ReliabilityComparison,
} from './commitments/reliabilityScorer';
export { ReminderEngine } from './commitments/reminderEngine';
export type {
  ReminderConfig,
  PendingReminder,
  ReminderBatch,
  ReminderTemplate,
} from './commitments/reminderEngine';

// Velocity
export { VelocityAnalyzer } from './velocity/velocityAnalyzer';
export type {
  VelocityMetrics,
  VelocityTrend,
  TeamVelocity,
  VelocityDataPoint,
} from './velocity/velocityAnalyzer';
export { BurnRateCalculator } from './velocity/burnRateCalculator';
export type {
  BurnRateMetrics,
  BurnProjection,
  CategoryBurn,
} from './velocity/burnRateCalculator';
export { ProjectionEngine } from './velocity/projectionEngine';
export type {
  ProjectionInput,
  CompletionProjection,
  IntegratedProjection,
  SensitivityAnalysis,
} from './velocity/projectionEngine';

// Meetings
export { MeetingPrepEngine } from './meetings/meetingPrepEngine';
export type {
  MeetingType,
  MeetingPrep,
  MeetingSummary,
  TalkingPoint,
  DecisionPoint,
  RiskHighlight,
} from './meetings/meetingPrepEngine';
export { DecisionTracker } from './meetings/decisionTracker';
export type {
  Decision as MeetingDecision,
  DecisionStatus,
  DecisionImpact,
  DecisionStats,
} from './meetings/decisionTracker';
export { TalkingPointsGenerator } from './meetings/talkingPointsGenerator';
export type {
  Audience,
  TalkingPointConfig,
  GeneratedTalkingPoint,
  TalkingPointsOutput,
} from './meetings/talkingPointsGenerator';

// Health
export { FatigueDetector } from './health/fatigueDetector';
export type {
  FatigueLevel,
  FatigueIndicator,
  FatigueSignal,
  FatigueAssessment,
  TeamFatigue,
} from './health/fatigueDetector';
export { MomentumTracker } from './health/momentumTracker';
export type {
  MomentumState,
  MomentumDataPoint,
  MomentumAnalysis,
  MomentumInsight,
  MomentumForecast,
} from './health/momentumTracker';

// Dependencies
export { ExternalDependencyMap } from './dependencies/externalDependencyMap';
export type {
  DependencyType,
  DependencyStatus,
  ExternalDependency,
  DependencyImpact,
  DependencyStats,
  DependencyChain,
} from './dependencies/externalDependencyMap';
export { BufferCalculator } from './dependencies/bufferCalculator';
export type {
  BufferType,
  Buffer,
  BufferAnalysis,
  BufferRecommendation,
  BufferAllocation,
} from './dependencies/bufferCalculator';

// Planning
export { DynamicRetroPlanner } from './planning/dynamicRetroPlanner';
export type {
  RetroplanItem,
  RetroPlan,
  PlanAdjustment,
  CriticalPathAnalysis,
  PlanningScenario,
} from './planning/dynamicRetroPlanner';
export { CriticalChainManager } from './planning/criticalChainManager';
export type {
  ChainTask,
  CriticalChain,
  ChainStatus,
  FeverChartData,
  ResourceConflict,
} from './planning/criticalChainManager';

// Decisions
export { DecisionAnalyzer } from './decisions/decisionAnalyzer';
export type {
  DecisionCategory,
  DecisionUrgency,
  DecisionContext,
  DecisionOption,
  DecisionAnalysis,
  SensitivityResult,
} from './decisions/decisionAnalyzer';
export { AlternativeGenerator } from './decisions/alternativeGenerator';
export type {
  AlternativeOption,
  AlternativeSet,
} from './decisions/alternativeGenerator';

// Journal
export { ProjectJournal } from './journal/projectJournal';
export type {
  JournalEntryType,
  JournalEntryImportance,
  JournalEntry,
  JournalFilter,
  JournalSummary,
  JournalExport,
} from './journal/projectJournal';
export { NarrativeGenerator } from './journal/narrativeGenerator';
export type {
  NarrativeStyle,
  NarrativeTone,
  NarrativeConfig,
  Narrative,
  NarrativeSection as NarrativeContentSection,
} from './journal/narrativeGenerator';

// Benchmark
export { ProjectComparator } from './benchmark/projectComparator';
export type {
  ProjectMetrics,
  BenchmarkData,
  ComparisonResult,
  MetricComparison,
  TrendComparison,
} from './benchmark/projectComparator';
export { LessonsLearnedStore } from './benchmark/lessonsLearnedStore';
export type {
  LessonCategory,
  LessonType,
  LessonImpact,
  LessonLearned,
  LessonSummary,
  LessonRecommendation,
} from './benchmark/lessonsLearnedStore';

// Export
export { AudienceAdapter } from './export/audienceAdapter';
export type {
  AudienceType,
  AudienceProfile,
  AdaptedContent,
  ContentSection,
} from './export/audienceAdapter';
export { TalkingPointsFormatter } from './export/talkingPointsFormatter';
export type {
  OutputFormat,
  FormattedOutput,
  SlideContent,
} from './export/talkingPointsFormatter';

// ============================================================================
// VERSION
// ============================================================================

export const PROPH3T_VERSION = '2.1.0';
