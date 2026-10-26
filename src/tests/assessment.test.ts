import { describe, expect, it } from 'vitest';
import { applyRecruiterResponse, buildClarificationQuestions, getPromiseDelta } from '../lib/assessment';
import { DEMO_OFFER_TEXT } from '../lib/demo';
import { createOfferRecord, recalculateOffer, reviewTerm } from '../lib/offer';
import { DEMO_PRIORITIES } from '../lib/terms';
import { todayInputValue } from '../lib/format';

function demoOffer() {
  return createOfferRecord(DEMO_OFFER_TEXT, DEMO_PRIORITIES, { sourceKind: 'demo', isDemo: true });
}

describe('priority-aware assessment', () => {
  it('uses personal rules and does not count unknown mentorship as a conflict', () => {
    const offer = demoOffer();
    expect(offer.assessment.aligned.length).toBeGreaterThanOrEqual(4);
    expect(offer.assessment.unknowns.some((entry) => entry.termKey === 'mentorship')).toBe(true);
    expect(offer.assessment.conflicts.some((entry) => entry.termKey === 'mentorship')).toBe(false);
    expect(offer.assessment.posture).toBe('clarify');
    expect(buildClarificationQuestions(offer.terms, offer.priorities).some((question) => question.termKey === 'mentorship')).toBe(true);
  });

  it('recalculates time and financial trade-offs when priorities change', () => {
    const offer = demoOffer();
    const updated = recalculateOffer(offer, { ...offer.priorities, availableHours: 10, minimumStipend: 25000 });
    expect(updated.assessment.conflicts.some((entry) => entry.termKey === 'hours')).toBe(true);
    expect(updated.assessment.conflicts.some((entry) => entry.termKey === 'stipend')).toBe(true);
    expect(updated.assessment.posture).toBe('resolve');
    expect(offer.assessment.conflicts).toHaveLength(0);
  });

  it('keeps a reply as new user-provided evidence and preserves before/after history', () => {
    const offer = demoOffer();
    const originalText = offer.originalText;
    const updated = applyRecruiterResponse(offer, {
      replyDate: todayInputValue(),
      source: 'Email',
      text: 'We meet every Friday for 30 minutes.',
      updates: { mentorship: 'Friday 30-minute review' },
    });
    const mentorship = updated.terms.find((term) => term.key === 'mentorship')!;
    expect(mentorship).toMatchObject({ value: 'Friday 30-minute review', status: 'user', source: 'recruiter' });
    expect(mentorship.excerpt?.text).toBe('We meet every Friday for 30 minutes.');
    expect(updated.originalText).toBe(originalText);
    expect(updated.snapshots).toHaveLength(3);
    const delta = getPromiseDelta(updated)!;
    expect(delta.changes.map((change) => change.key)).toContain('mentorship');
    expect(delta.before.terms.find((term) => term.key === 'mentorship')?.status).toBe('unknown');
    expect(delta.after.terms.find((term) => term.key === 'mentorship')?.status).toBe('user');
    expect(delta.after.terms.every((term) => term.status !== 'verified')).toBe(true);
  });

  it('requires both reply text and a specific linked term update', () => {
    const offer = demoOffer();
    expect(() => applyRecruiterResponse(offer, { replyDate: '2026-10-24', source: 'Email', text: '', updates: { mentorship: 'Weekly' } })).toThrow(/reply text/i);
    expect(() => applyRecruiterResponse(offer, { replyDate: '2026-10-24', source: 'Email', text: 'Reply', updates: {} })).toThrow(/at least one term/i);
    expect(() => applyRecruiterResponse(offer, { replyDate: '', source: 'Email', text: 'Reply', updates: { mentorship: 'Weekly' } })).toThrow(/date/i);
    expect(() => applyRecruiterResponse(offer, { replyDate: '2026-02-30', source: 'Email', text: 'Reply', updates: { mentorship: 'Weekly' } })).toThrow(/valid calendar date/i);
  });

  it('does not infer a currency or compare incompatible currency codes', () => {
    const text = 'Organisation: Example Studio\nRole: Design Intern\nDuration: 8 weeks\nStipend: 18000 per month\nWorking hours: 20 hours per week';
    const offer = createOfferRecord(text, { ...DEMO_PRIORITIES, preferredWork: '', skills: '' }, { sourceKind: 'paste' });
    const noCurrency = recalculateOffer(offer, { ...offer.priorities, minimumStipend: 15000, currency: 'INR' });
    expect(noCurrency.assessment.unknowns.some((entry) => entry.termKey === 'stipend')).toBe(true);
    expect(noCurrency.assessment.aligned.some((entry) => entry.termKey === 'stipend')).toBe(false);

    const usd = reviewTerm(offer, offer.terms.find((term) => term.key === 'stipend')!.id, { value: 'USD 18000 per month', status: 'explicit' });
    const wrongLens = recalculateOffer(usd, { ...usd.priorities, minimumStipend: 15000, currency: 'INR' });
    expect(wrongLens.assessment.unknowns.some((entry) => entry.termKey === 'stipend')).toBe(true);
    const matchingLens = recalculateOffer(usd, { ...usd.priorities, minimumStipend: 15000, currency: 'USD' });
    expect(matchingLens.assessment.aligned.some((entry) => entry.termKey === 'stipend')).toBe(true);
  });

  it('uses preferred work as evidence or an explicit follow-up, never a silent mismatch', () => {
    const offer = demoOffer();
    const matched = recalculateOffer(offer, { ...offer.priorities, preferredWork: 'interface design' });
    expect(matched.assessment.aligned.some((entry) => entry.title === 'Preferred work is described')).toBe(true);
    const unmatched = recalculateOffer(offer, { ...offer.priorities, preferredWork: 'quantum welding' });
    expect(unmatched.assessment.unknowns.some((entry) => entry.title === 'Preferred work needs examples')).toBe(true);
    expect(unmatched.assessment.conflicts.some((entry) => entry.termKey === 'responsibilities')).toBe(false);
  });

  it('assesses paid and unpaid training only against the stated boundary', () => {
    const offer = demoOffer();
    const paid = recalculateOffer(offer, { ...offer.priorities, nonNegotiables: 'No unpaid training' });
    expect(paid.assessment.aligned.some((entry) => entry.termKey === 'training')).toBe(true);
    const unpaid = reviewTerm(offer, offer.terms.find((term) => term.key === 'training')!.id, { value: '3 days of unpaid onboarding', status: 'explicit' });
    const conflict = recalculateOffer(unpaid, { ...unpaid.priorities, nonNegotiables: 'No unpaid training' });
    expect(conflict.assessment.conflicts.some((entry) => entry.termKey === 'training')).toBe(true);
  });

  it('keeps reimbursement and conditional fee wording unknown', () => {
    const offer = demoOffer();
    for (const value of ['No reimbursement for fees', 'Reimbursement for fees', 'Fees may be waived', 'No fee information provided', 'No fees are waived', 'None of the fees are waived', 'No tuition fees; a registration charge of 500 is required']) {
      const reviewed = reviewTerm(offer, offer.terms.find((term) => term.key === 'fees')!.id, { value, status: 'explicit' });
      const result = recalculateOffer(reviewed, { ...reviewed.priorities, nonNegotiables: 'No fees or deposits' });
      expect(result.assessment.unknowns.some((entry) => entry.termKey === 'fees')).toBe(true);
      expect(result.assessment.aligned.some((entry) => entry.termKey === 'fees')).toBe(false);
      expect(result.assessment.conflicts.some((entry) => entry.termKey === 'fees')).toBe(false);
    }
    for (const value of ['No upfront fees', 'No registration charges', 'None', 'Fees waived']) {
      const reviewed = reviewTerm(offer, offer.terms.find((term) => term.key === 'fees')!.id, { value, status: 'explicit' });
      const result = recalculateOffer(reviewed, { ...reviewed.priorities, nonNegotiables: 'No fees or deposits' });
      expect(result.assessment.aligned.some((entry) => entry.termKey === 'fees')).toBe(true);
      expect(result.assessment.unknowns.some((entry) => entry.termKey === 'fees')).toBe(false);
    }
    const explicit = recalculateOffer(offer, { ...offer.priorities, nonNegotiables: 'No fees or deposits' });
    expect(explicit.assessment.aligned.some((entry) => entry.termKey === 'fees')).toBe(true);

    const charged = reviewTerm(offer, offer.terms.find((term) => term.key === 'fees')!.id, { value: 'A registration charge of 500 is required', status: 'explicit' });
    const conflict = recalculateOffer(charged, { ...charged.priorities, nonNegotiables: 'No fees or deposits' });
    expect(conflict.assessment.conflicts.some((entry) => entry.termKey === 'fees')).toBe(true);
    expect(conflict.assessment.unknowns.some((entry) => entry.termKey === 'fees')).toBe(false);
    expect(conflict.assessment.aligned.some((entry) => entry.termKey === 'fees')).toBe(false);
  });

  it('removes stale independent verification when a recruiter reply supersedes a term', () => {
    const offer = demoOffer();
    const term = offer.terms.find((entry) => entry.key === 'mentorship')!;
    const verified = reviewTerm(offer, term.id, { value: 'Weekly review', status: 'verified', verificationSource: 'Signed schedule inspected by the student' });
    const updated = applyRecruiterResponse(verified, { replyDate: '2026-10-24', source: 'Email', text: 'We meet every Friday.', updates: { mentorship: 'Friday review' } });
    expect(updated.terms.find((entry) => entry.key === 'mentorship')?.verificationSource).toBeUndefined();
  });
});
