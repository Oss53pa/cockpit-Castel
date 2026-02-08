// ============================================================================
// PROPH3T ENGINE V2 — MEETINGS MODULE
// ============================================================================

export { MeetingPrepEngine } from './meetingPrepEngine';
export type {
  MeetingType,
  MeetingConfig,
  MeetingParticipant,
  AgendaItem,
  MeetingPrep,
  MeetingSummary,
  TalkingPoint,
  DecisionPoint,
  RiskHighlight,
  ActionReviewItem,
  CommitmentReviewItem,
  AlertOverview,
} from './meetingPrepEngine';

export { DecisionTracker } from './decisionTracker';
export type {
  Decision,
  DecisionStatus,
  DecisionImpact,
  DecisionOption,
  DecisionHistoryEntry,
  DecisionStats,
  DecisionSearchFilters,
} from './decisionTracker';

export { TalkingPointsGenerator } from './talkingPointsGenerator';
export type {
  Audience,
  CommunicationTone,
  TalkingPointConfig,
  GeneratedTalkingPoint,
  TalkingPointsOutput,
} from './talkingPointsGenerator';
