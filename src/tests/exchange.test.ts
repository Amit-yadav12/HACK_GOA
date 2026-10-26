import { describe, expect, it } from 'vitest';
import { createExportBundle, exportMarkdown, parseImportBundle } from '../lib/exchange';
import { applyRecruiterResponse } from '../lib/assessment';
import { DEMO_OFFER_TEXT } from '../lib/demo';
import { createOfferRecord } from '../lib/offer';
import { DEMO_PRIORITIES } from '../lib/terms';

function offer() {
  return createOfferRecord(DEMO_OFFER_TEXT, DEMO_PRIORITIES, { sourceKind: 'demo', isDemo: true });
}

describe('validated import and export', () => {
  it('round-trips a schema-versioned JSON backup', () => {
    const original = offer();
    const raw = JSON.stringify(createExportBundle([original]));
    const [imported] = parseImportBundle(raw);
    expect(imported.id).toBe(original.id);
    expect(imported.sourceKind).toBe('import');
    expect(imported.sourceText).toBe(original.sourceText);
    expect(imported.terms.find((term) => term.key === 'mentorship')?.status).toBe('unknown');
  });

  it('rejects malformed JSON and invalid schemas with actionable errors', () => {
    expect(() => parseImportBundle('{broken')).toThrow(/not valid JSON/i);
    expect(() => parseImportBundle(JSON.stringify({ kind: 'roleworth-export', schemaVersion: 99, offers: [] }))).toThrow(/validation failed/i);
    expect(() => parseImportBundle(JSON.stringify({ kind: 'roleworth-export', schemaVersion: 1, exportedAt: 'now', offers: [{ id: 'not-an-offer' }] }))).toThrow(/validation failed/i);
  });

  it('round-trips recruiter replies and immutable snapshots', () => {
    const original = applyRecruiterResponse(offer(), { replyDate: '2026-10-24', source: 'Email', text: 'We meet weekly.', updates: { mentorship: 'Weekly review' } });
    const [imported] = parseImportBundle(JSON.stringify(createExportBundle([original])));
    expect(imported.responses).toHaveLength(1);
    expect(imported.snapshots).toHaveLength(3);
    expect(imported.terms.find((term) => term.key === 'mentorship')?.source).toBe('recruiter');
  });

  it('recalculates imported assessment instead of trusting a tampered summary', () => {
    const original = offer();
    original.assessment.summary = 'Tampered universal trust score: 100%';
    const [imported] = parseImportBundle(JSON.stringify(createExportBundle([original])));
    expect(imported.assessment.summary).not.toContain('100%');
  });

  it('rejects duplicate offer IDs in import bundles', () => {
    const original = offer();
    const duplicate = { ...original, name: 'Duplicate identity' };
    const bundle = { ...createExportBundle([original]), offers: [original, duplicate] };
    expect(() => parseImportBundle(JSON.stringify(bundle))).toThrow(/validation failed/i);
  });

  it('rejects schema-shaped offers with duplicate canonical terms', () => {
    const original = offer();
    original.terms[1].key = original.terms[0].key;
    expect(() => parseImportBundle(JSON.stringify(createExportBundle([original])))).toThrow(/validation failed/i);
  });

  it('exports provenance, unknowns and personal goals while escaping embedded HTML', () => {
    const original = { ...offer(), decisionNote: '<script>alert(1)</script>' };
    const markdown = exportMarkdown(original);
    expect(markdown).toContain('## Evidence ledger');
    expect(markdown).toContain('## Personal learning milestones');
    expect(markdown).toContain('- Preferred work: Research, prototyping and interface design');
    expect(markdown).toContain('personal goals, not employer commitments');
    expect(markdown).toContain('Unknown / not established');
    expect(markdown).toContain('&lt;script&gt;');
    expect(markdown).not.toContain('<script>');
  });
});
