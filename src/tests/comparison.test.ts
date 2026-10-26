import { describe, expect, it } from 'vitest';
import { compareOffers } from '../lib/comparison';
import { DEMO_COMPARISON_OFFER_TEXT, DEMO_OFFER_TEXT } from '../lib/demo';
import { createOfferRecord } from '../lib/offer';
import { DEMO_PRIORITIES } from '../lib/terms';

describe('two-offer comparison', () => {
  it('keeps terms separate and preserves unknowns', () => {
    const a = createOfferRecord(DEMO_OFFER_TEXT, DEMO_PRIORITIES, { sourceKind: 'demo', isDemo: true });
    const b = createOfferRecord(DEMO_COMPARISON_OFFER_TEXT, DEMO_PRIORITIES, { sourceKind: 'demo', isDemo: true });
    const rows = compareOffers(a, b);
    expect(rows.find((row) => row.key === 'role')).toMatchObject({ a: 'Product Design Intern', b: 'UX Research Intern', comparable: true });
    expect(rows.find((row) => row.key === 'mentorship')).toMatchObject({ a: 'Unknown — not established', comparable: false });
    expect(rows.find((row) => row.key === 'mentorship')?.b).toContain('Weekly feedback');
    expect(rows.find((row) => row.key === 'training')?.b).toBe('Unknown — not established');
  });

  it('refuses to compare an offer with itself', () => {
    const offer = createOfferRecord(DEMO_OFFER_TEXT, DEMO_PRIORITIES, { sourceKind: 'demo', isDemo: true });
    expect(() => compareOffers(offer, offer)).toThrow(/different offers/i);
  });
});
