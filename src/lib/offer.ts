import { buildClarificationQuestions, createLearningPlan, createSnapshot, evaluateOffer } from './assessment';
import { identifyCandidateTerms } from './extraction';
import { makeId } from './id';
import type {
  EvidenceStatus,
  ExtractedTerm,
  IntakeMetadata,
  OfferRecord,
  PriorityProfile,
  TermKey,
  WorkspaceState,
} from '../types';

export function recalculateOffer(record: OfferRecord, priorities = record.priorities): OfferRecord {
  const now = new Date().toISOString();
  return {
    ...record,
    priorities,
    assessment: evaluateOffer(record.terms, priorities, now),
    questions: buildClarificationQuestions(record.terms, priorities),
    updatedAt: now,
  };
}

export function createOfferRecord(
  text: string,
  priorities: PriorityProfile,
  metadata: IntakeMetadata,
): OfferRecord {
  const cleanText = text.trim();
  if (cleanText.length < 40) throw new Error('Add at least 40 characters so there is enough offer text to review.');
  if (cleanText.length > 120_000) throw new Error('This text is too long. Keep the offer under 120,000 characters.');

  const now = new Date().toISOString();
  const terms = identifyCandidateTerms(cleanText, now);
  const oversizedTerm = terms.find((term) => term.value.length > 20_000);
  if (oversizedTerm) {
    throw new Error(`${oversizedTerm.label} is too long to review safely. Shorten this field to 20,000 characters or fewer before building the ledger.`);
  }
  const company = terms.find((term) => term.key === 'company')?.value;
  const role = terms.find((term) => term.key === 'role')?.value;
  const fallbackName = company || metadata.fileName?.replace(/\.pdf$/i, '') || role || 'Untitled internship offer';
  // The display label is bounded separately; the full term and original source remain intact.
  const name = fallbackName.length > 500 ? `${fallbackName.slice(0, 497)}...` : fallbackName;
  const base: OfferRecord = {
    id: makeId('offer'),
    name,
    sourceKind: metadata.sourceKind,
    fileName: metadata.fileName,
    isDemo: Boolean(metadata.isDemo),
    originalText: cleanText,
    sourceText: cleanText,
    terms,
    priorities,
    assessment: evaluateOffer(terms, priorities, now),
    questions: buildClarificationQuestions(terms, priorities),
    responses: [],
    snapshots: [],
    milestones: [],
    decisionNote: '',
    createdAt: now,
    updatedAt: now,
  };
  const withSnapshot = { ...base, snapshots: [createSnapshot(base, 'Initial offer assessment', now)] };
  return { ...withSnapshot, milestones: createLearningPlan(withSnapshot, new Date(now)) };
}

export function appendOfferToWorkspace(current: WorkspaceState, offer: OfferRecord, makeActive = true): WorkspaceState {
  const offers = [...current.offers.filter((item) => item.id !== offer.id), offer].slice(-50);
  const activeOfferId = makeActive
    ? offer.id
    : offers.some((item) => item.id === current.activeOfferId)
      ? current.activeOfferId
      : offers[0]?.id ?? null;
  const active = offers.find((item) => item.id === activeOfferId);
  return {
    ...current,
    offers,
    activeOfferId,
    priorities: makeActive ? offer.priorities : active?.priorities ?? current.priorities,
  };
}

export interface TermReviewInput {
  value: string;
  status: EvidenceStatus;
  verificationSource?: string;
}

export function reviewTerm(record: OfferRecord, termId: string, input: TermReviewInput): OfferRecord {
  const now = new Date().toISOString();
  const terms = record.terms.map((term) => {
    if (term.id !== termId) return term;
    const value = input.value.trim();
    const status = value ? input.status : 'unknown';
    if (status === 'verified' && !input.verificationSource?.trim()) {
      throw new Error('Add the independent source you inspected before using this status.');
    }
    const source: ExtractedTerm['source'] = status === 'explicit'
      ? 'offer'
      : status === 'verified'
        ? 'independent'
        : status === 'inferred'
          ? 'inference'
          : status === 'user'
            ? 'user'
            : 'none';
    return {
      ...term,
      value,
      status,
      source,
      rejected: false,
      verificationSource: status === 'verified' ? input.verificationSource?.trim() : undefined,
      note: status === 'verified'
        ? 'Verification source supplied by you; RoleWorth has not checked it.'
        : status === 'inferred'
          ? 'Your interpretation, not a direct quotation. Confirm it before relying on it.'
          : status === 'user' && term.value !== value
            ? 'Edited by you. Any retained excerpt is the original offer context, not proof of this correction.'
            : term.note,
      updatedAt: now,
    };
  });
  return recalculateOffer({ ...record, terms });
}

export function setTermRejected(record: OfferRecord, termId: string, rejected: boolean): OfferRecord {
  const terms = record.terms.map((term) => term.id === termId
    ? {
        ...term,
        rejected,
        status: rejected ? 'unknown' as const : term.value ? 'user' as const : 'unknown' as const,
        source: rejected ? 'none' as const : 'user' as const,
        verificationSource: undefined,
        note: rejected ? 'Rejected by you and excluded from the assessment.' : 'Restored by you as user-provided information. Review its source and status.',
        updatedAt: new Date().toISOString(),
      }
    : term);
  return recalculateOffer({ ...record, terms });
}

export function addSnapshot(record: OfferRecord, reason: string): OfferRecord {
  return { ...record, snapshots: [...record.snapshots, createSnapshot(record, reason)] };
}

export function updateTermValue(record: OfferRecord, key: TermKey, value: string): OfferRecord {
  const term = record.terms.find((entry) => entry.key === key);
  if (!term) return record;
  return reviewTerm(record, term.id, { value, status: 'user' });
}
