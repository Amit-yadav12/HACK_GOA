export type EvidenceStatus = 'explicit' | 'user' | 'inferred' | 'unknown' | 'verified';

export type TermKey =
  | 'company'
  | 'role'
  | 'duration'
  | 'stipend'
  | 'payment'
  | 'training'
  | 'hours'
  | 'fees'
  | 'responsibilities'
  | 'mentorship'
  | 'deliverables'
  | 'termination';

export type EvidenceSource = 'offer' | 'user' | 'recruiter' | 'inference' | 'independent' | 'none';

export interface SourceExcerpt {
  text: string;
  start?: number;
  end?: number;
  page?: number;
}

export interface ExtractedTerm {
  id: string;
  key: TermKey;
  label: string;
  value: string;
  status: EvidenceStatus;
  source: EvidenceSource;
  excerpt?: SourceExcerpt;
  note?: string;
  verificationSource?: string;
  rejected: boolean;
  updatedAt: string;
}

export type MentorshipPreference = 'essential' | 'preferred' | 'flexible';

export interface PriorityProfile {
  targetRole: string;
  skills: string;
  availableHours: number | null;
  minimumStipend: number | null;
  currency: string;
  mentorship: MentorshipPreference;
  preferredWork: string;
  nonNegotiables: string;
}

export type AssessmentItemKind = 'aligned' | 'conflict' | 'unknown';

export interface AssessmentItem {
  id: string;
  kind: AssessmentItemKind;
  termKey?: TermKey;
  title: string;
  detail: string;
}

export type DecisionPosture = 'clarify' | 'resolve' | 'ready' | 'reflect';

export interface Assessment {
  aligned: AssessmentItem[];
  conflicts: AssessmentItem[];
  unknowns: AssessmentItem[];
  posture: DecisionPosture;
  summary: string;
  generatedAt: string;
}

export interface SnapshotTerm {
  key: TermKey;
  value: string;
  status: EvidenceStatus;
  rejected: boolean;
}

export interface AssessmentSnapshot {
  id: string;
  createdAt: string;
  reason: string;
  assessment: Assessment;
  terms: SnapshotTerm[];
}

export interface RecruiterQuestion {
  id: string;
  termKey: TermKey;
  question: string;
  rationale: string;
}

export interface RecruiterResponse {
  id: string;
  replyDate: string;
  source: string;
  text: string;
  linkedTermKeys: TermKey[];
  updates: Partial<Record<TermKey, string>>;
  createdAt: string;
}

export type MilestoneStatus = 'planned' | 'in-progress' | 'completed' | 'postponed';
export type PromiseOutcome = 'not-assessed' | 'fulfilled' | 'unmet' | 'unresolved';

export interface OutcomeRecord {
  date: string;
  workPerformed: string;
  feedback: string;
  skillsPracticed: string;
  evidence: string;
  promiseOutcome: PromiseOutcome;
  updatedAt: string;
}

export interface LearningMilestone {
  id: string;
  title: string;
  activity: string;
  expectedEvidence: string;
  targetDate: string;
  status: MilestoneStatus;
  origin: 'suggested' | 'personal';
  outcome?: OutcomeRecord;
}

export type OfferSource = 'paste' | 'pdf' | 'demo' | 'import';

export interface OfferRecord {
  id: string;
  name: string;
  sourceKind: OfferSource;
  fileName?: string;
  isDemo: boolean;
  originalText: string;
  sourceText: string;
  terms: ExtractedTerm[];
  priorities: PriorityProfile;
  assessment: Assessment;
  questions: RecruiterQuestion[];
  responses: RecruiterResponse[];
  snapshots: AssessmentSnapshot[];
  milestones: LearningMilestone[];
  decisionNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceState {
  version: 1;
  offers: OfferRecord[];
  activeOfferId: string | null;
  priorities: PriorityProfile;
}

export interface ExportBundle {
  kind: 'roleworth-export';
  schemaVersion: 1;
  exportedAt: string;
  offers: OfferRecord[];
}

export type AppView = 'decide' | 'evidence' | 'clarify' | 'delta' | 'learn' | 'verify' | 'compare';

export interface IntakeMetadata {
  sourceKind: OfferSource;
  fileName?: string;
  isDemo?: boolean;
}
