import { z } from 'zod';
import { isValidDateInput } from './format';

const id = z.string().min(1).max(160);
const timestamp = z.string().min(4).max(80);
const date = z.string().refine(isValidDateInput, 'Expected a valid YYYY-MM-DD calendar date.');
const safeText = (max: number) => z.string().max(max);
const termKey = z.enum(['company', 'role', 'duration', 'stipend', 'payment', 'training', 'hours', 'fees', 'responsibilities', 'mentorship', 'deliverables', 'termination']);
const evidenceStatus = z.enum(['explicit', 'user', 'inferred', 'unknown', 'verified']);
const evidenceSource = z.enum(['offer', 'user', 'recruiter', 'inference', 'independent', 'none']);

export const priorityProfileSchema = z.object({
  targetRole: safeText(300),
  skills: safeText(1500),
  availableHours: z.number().min(0).max(168).nullable(),
  minimumStipend: z.number().min(0).max(1_000_000_000).nullable(),
  currency: z.string().min(3).max(3),
  mentorship: z.enum(['essential', 'preferred', 'flexible']),
  preferredWork: safeText(1500),
  nonNegotiables: safeText(1500),
});

const excerptSchema = z.object({
  text: safeText(120_000),
  start: z.number().int().nonnegative().optional(),
  end: z.number().int().nonnegative().optional(),
  page: z.number().int().positive().optional(),
});

const termSchema = z.object({
  id,
  key: termKey,
  label: safeText(100),
  value: safeText(20_000),
  status: evidenceStatus,
  source: evidenceSource,
  excerpt: excerptSchema.optional(),
  note: safeText(2000).optional(),
  verificationSource: safeText(4000).optional(),
  rejected: z.boolean(),
  updatedAt: timestamp,
});

const termsSchema = z.array(termSchema).length(12)
  .refine((terms) => new Set(terms.map((term) => term.key)).size === 12, {
    message: 'Offer terms must contain each canonical term exactly once.',
  })
  .refine((terms) => new Set(terms.map((term) => term.id)).size === 12, {
    message: 'Offer term IDs must be unique.',
  });

const assessmentItemSchema = z.object({
  id,
  kind: z.enum(['aligned', 'conflict', 'unknown']),
  termKey: termKey.optional(),
  title: safeText(500),
  detail: safeText(4000),
});

const assessmentSchema = z.object({
  aligned: z.array(assessmentItemSchema).max(100),
  conflicts: z.array(assessmentItemSchema).max(100),
  unknowns: z.array(assessmentItemSchema).max(100),
  posture: z.enum(['clarify', 'resolve', 'ready', 'reflect']),
  summary: safeText(4000),
  generatedAt: timestamp,
});

const snapshotTermSchema = z.object({
  key: termKey,
  value: safeText(20_000),
  status: evidenceStatus,
  rejected: z.boolean(),
});

const snapshotSchema = z.object({
  id,
  createdAt: timestamp,
  reason: safeText(500),
  assessment: assessmentSchema,
  terms: z.array(snapshotTermSchema).max(12),
});

const questionSchema = z.object({
  id,
  termKey,
  question: safeText(2000),
  rationale: safeText(2000),
});

const responseSchema = z.object({
  id,
  replyDate: date,
  source: safeText(500),
  text: safeText(30_000),
  linkedTermKeys: z.array(termKey).max(12),
  updates: z.partialRecord(termKey, safeText(20_000)),
  createdAt: timestamp,
});

const outcomeSchema = z.object({
  date,
  workPerformed: safeText(10_000),
  feedback: safeText(10_000),
  skillsPracticed: safeText(5000),
  evidence: safeText(10_000),
  promiseOutcome: z.enum(['not-assessed', 'fulfilled', 'unmet', 'unresolved']),
  updatedAt: timestamp,
});

const milestoneSchema = z.object({
  id,
  title: safeText(500),
  activity: safeText(5000),
  expectedEvidence: safeText(5000),
  targetDate: date,
  status: z.enum(['planned', 'in-progress', 'completed', 'postponed']),
  origin: z.enum(['suggested', 'personal']),
  outcome: outcomeSchema.optional(),
});

const offerIdsAreUnique = (offers: Array<{ id: string }>) => new Set(offers.map((offer) => offer.id)).size === offers.length;

export const offerRecordSchema = z.object({
  id,
  name: safeText(500),
  sourceKind: z.enum(['paste', 'pdf', 'demo', 'import']),
  fileName: safeText(500).optional(),
  isDemo: z.boolean(),
  originalText: safeText(120_000),
  sourceText: safeText(120_000),
  terms: termsSchema,
  priorities: priorityProfileSchema,
  assessment: assessmentSchema,
  questions: z.array(questionSchema).max(12),
  responses: z.array(responseSchema).max(500),
  snapshots: z.array(snapshotSchema).max(500),
  milestones: z.array(milestoneSchema).max(200),
  decisionNote: safeText(10_000),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const workspaceSchema = z.object({
  version: z.literal(1),
  offers: z.array(offerRecordSchema).max(50).refine(offerIdsAreUnique, { message: 'Offer IDs must be unique.' }),
  activeOfferId: z.string().max(160).nullable(),
  priorities: priorityProfileSchema,
});

export const exportBundleSchema = z.object({
  kind: z.literal('roleworth-export'),
  schemaVersion: z.literal(1),
  exportedAt: timestamp,
  offers: z.array(offerRecordSchema).min(1).max(50).refine(offerIdsAreUnique, { message: 'Offer IDs must be unique.' }),
});
