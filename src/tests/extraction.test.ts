import { describe, expect, it } from 'vitest';
import { DEMO_OFFER_TEXT } from '../lib/demo';
import { getTerm, identifyCandidateTerms } from '../lib/extraction';
import { createOfferRecord, reviewTerm, setTermRejected } from '../lib/offer';
import { DEFAULT_PRIORITIES } from '../lib/terms';
import { offerRecordSchema } from '../lib/schemas';

const NOW = '2026-10-24T00:00:00.000Z';

describe('deterministic offer extraction', () => {
  it('extracts explicit terms with exact inspectable excerpts', () => {
    const terms = identifyCandidateTerms(DEMO_OFFER_TEXT, NOW);
    expect(getTerm(terms, 'company')?.value).toBe('Northstar Studio (synthetic)');
    expect(getTerm(terms, 'role')?.value).toBe('Product Design Intern');
    expect(getTerm(terms, 'stipend')?.value).toBe('₹18,000 per month');
    expect(getTerm(terms, 'hours')?.value).toContain('20 hours per week');
    expect(getTerm(terms, 'fees')?.status).toBe('explicit');

    for (const term of terms.filter((entry) => entry.excerpt?.start !== undefined)) {
      const { start, end, text } = term.excerpt!;
      expect(DEMO_OFFER_TEXT.slice(start, end)).toBe(text);
      expect(DEMO_OFFER_TEXT).toContain(text);
    }
  });

  it('keeps missing and unspecified terms unknown instead of inventing values', () => {
    const terms = identifyCandidateTerms('Organisation: Example Studio\nRole: Design Intern\nMentorship: Not specified\nDuration: TBD', NOW);
    expect(getTerm(terms, 'mentorship')).toMatchObject({ value: '', status: 'unknown', source: 'none' });
    expect(getTerm(terms, 'duration')).toMatchObject({ value: '', status: 'unknown' });
    expect(getTerm(terms, 'fees')).toMatchObject({ value: '', status: 'unknown' });
    expect(getTerm(terms, 'stipend')).toMatchObject({ value: '', status: 'unknown' });
  });

  it('requires a source for independently verified corrections', () => {
    const offer = createOfferRecord(DEMO_OFFER_TEXT, DEFAULT_PRIORITIES, { sourceKind: 'demo', isDemo: true });
    const term = getTerm(offer.terms, 'mentorship')!;
    expect(() => reviewTerm(offer, term.id, { value: 'Weekly review', status: 'verified' })).toThrow(/independent source/i);
    const reviewed = reviewTerm(offer, term.id, { value: 'Weekly review', status: 'verified', verificationSource: 'Signed schedule inspected by the student' });
    expect(getTerm(reviewed.terms, 'mentorship')).toMatchObject({ status: 'verified', source: 'independent' });
    expect(reviewed.originalText).toBe(offer.originalText);
  });

  it('excludes rejected terms without turning the rejection into a negative fact', () => {
    const offer = createOfferRecord(DEMO_OFFER_TEXT, DEFAULT_PRIORITIES, { sourceKind: 'demo', isDemo: true });
    const term = getTerm(offer.terms, 'stipend')!;
    const rejected = setTermRejected(offer, term.id, true);
    expect(getTerm(rejected.terms, 'stipend')).toMatchObject({ rejected: true, status: 'unknown', value: term.value });
    expect(rejected.assessment.conflicts.some((entry) => entry.termKey === 'stipend')).toBe(false);
  });

  it('does not carry a verification claim through rejection and restoration', () => {
    const offer = createOfferRecord(DEMO_OFFER_TEXT, DEFAULT_PRIORITIES, { sourceKind: 'demo', isDemo: true });
    const term = getTerm(offer.terms, 'mentorship')!;
    const verified = reviewTerm(offer, term.id, { value: 'Weekly review', status: 'verified', verificationSource: 'Signed schedule inspected by the student' });
    const rejected = setTermRejected(verified, term.id, true);
    expect(getTerm(rejected.terms, 'mentorship')?.verificationSource).toBeUndefined();
    const restored = setTermRejected(rejected, term.id, false);
    expect(getTerm(restored.terms, 'mentorship')).toMatchObject({ status: 'user', source: 'user', verificationSource: undefined });
  });

  it('keeps long organisation names display-safe without altering the source evidence', () => {
    const company = 'A'.repeat(501);
    const offer = createOfferRecord(`Organisation: ${company}\nRole: Design Intern\nDuration: 8 weeks\nStipend: INR 18000 per month`, DEFAULT_PRIORITIES, { sourceKind: 'paste' });
    expect(offer.name.length).toBeLessThanOrEqual(500);
    expect(getTerm(offer.terms, 'company')?.value).toBe(company);
    expect(offer.originalText).toContain(company);
    expect(offerRecordSchema.safeParse(offer).success).toBe(true);
  });

  it('rejects oversized extracted term values before they can invalidate persisted state', () => {
    const text = `Organisation: Example Studio\nRole: Design Intern\nResponsibilities: ${'x'.repeat(20_001)}`;
    expect(() => createOfferRecord(text, DEFAULT_PRIORITIES, { sourceKind: 'paste' })).toThrow(/20,000/);
  });
});
