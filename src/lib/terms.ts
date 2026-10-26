import type { EvidenceStatus, PriorityProfile, TermKey } from '../types';

export const TERM_DEFINITIONS: Array<{ key: TermKey; label: string; description: string }> = [
  { key: 'company', label: 'Organisation', description: 'Who is making the offer' },
  { key: 'role', label: 'Role', description: 'The named internship position' },
  { key: 'duration', label: 'Duration', description: 'Start, end or total length' },
  { key: 'stipend', label: 'Stipend', description: 'Amount, currency and frequency' },
  { key: 'payment', label: 'Payment conditions', description: 'When and how payment happens' },
  { key: 'training', label: 'Training period', description: 'Onboarding or unpaid training' },
  { key: 'hours', label: 'Working hours', description: 'Weekly time or daily schedule' },
  { key: 'fees', label: 'Fees & deposits', description: 'Any payment requested from you' },
  { key: 'responsibilities', label: 'Responsibilities', description: 'The work you will actually do' },
  { key: 'mentorship', label: 'Mentorship', description: 'Named guidance or review rhythm' },
  { key: 'deliverables', label: 'Deliverables', description: 'Expected outputs or performance criteria' },
  { key: 'termination', label: 'Exit terms', description: 'Notice and termination conditions' },
];

export const TERM_LABELS = Object.fromEntries(
  TERM_DEFINITIONS.map((term) => [term.key, term.label]),
) as Record<TermKey, string>;

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  explicit: 'Explicit in offer',
  user: 'Provided by you',
  inferred: 'Inferred',
  unknown: 'Unknown',
  verified: 'Independently verified',
};

export const DEFAULT_PRIORITIES: PriorityProfile = {
  targetRole: '',
  skills: '',
  availableHours: null,
  minimumStipend: null,
  currency: 'INR',
  mentorship: 'preferred',
  preferredWork: '',
  nonNegotiables: '',
};

export const DEMO_PRIORITIES: PriorityProfile = {
  targetRole: 'Product design',
  skills: 'User research, prototyping, visual design',
  availableHours: 25,
  minimumStipend: 15000,
  currency: 'INR',
  mentorship: 'preferred',
  preferredWork: 'Research, prototyping and interface design',
  nonNegotiables: 'No fees or deposits',
};
