import { describe, expect, it, vi } from 'vitest';

// Vite's browser asset URL is root-relative in jsdom; give Node the real worker file.
vi.mock('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url', () => ({
  default: `${process.cwd()}/node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs`,
}));
import { extractPdfText, MAX_PDF_BYTES } from '../lib/pdf';
import { makePdf } from '../test/pdfFixture';
import { getTerm, identifyCandidateTerms } from '../lib/extraction';

describe('PDF intake validation', () => {
  it('rejects unsupported and empty files before parsing', async () => {
    await expect(extractPdfText(new File(['hello'], 'offer.txt', { type: 'text/plain' }))).rejects.toMatchObject({ code: 'unsupported' });
    await expect(extractPdfText(new File([], 'offer.pdf', { type: 'application/pdf' }))).rejects.toMatchObject({ code: 'empty' });
  });

  it('rejects oversized files without reading their contents', async () => {
    const file = new File(['x'], 'large.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: MAX_PDF_BYTES + 1 });
    await expect(extractPdfText(file)).rejects.toMatchObject({ code: 'too-large' });
  });

  it('turns corrupt PDFs into an actionable manual-paste error', async () => {
    const file = new File(['this is not a pdf'], 'corrupt.pdf', { type: 'application/pdf' });
    await expect(extractPdfText(file)).rejects.toEqual(expect.objectContaining({ code: 'corrupt' }));
    await expect(extractPdfText(file)).rejects.toThrow(/paste the offer text/i);
  });

  it('extracts editable text from a valid text-based PDF', async () => {
    const bytes = makePdf([
      'Organisation: Example Studio',
      'Role: Product Design Intern',
      'Duration: 8 weeks',
      'Stipend: INR 18000 per month',
      'Working hours: 20 hours per week',
      'Responsibilities: Build prototypes and conduct research',
    ]);
    const file = new File([bytes.buffer as ArrayBuffer], 'text-offer.pdf', { type: 'application/pdf' });
    const result = await extractPdfText(file);
    expect(result.pageCount).toBe(1);
    expect(result.text).toContain('Organisation: Example Studio');
    const terms = identifyCandidateTerms(result.text);
    expect(getTerm(terms, 'role')?.value).toBe('Product Design Intern');
    expect(getTerm(terms, 'hours')?.value).toContain('20 hours per week');
  });

  it('reports a valid image-only or no-text PDF without claiming OCR', async () => {
    const bytes = makePdf([]);
    const file = new File([bytes.buffer as ArrayBuffer], 'scanned.pdf', { type: 'application/pdf' });
    await expect(extractPdfText(file)).rejects.toMatchObject({ code: 'no-text' });
    await expect(extractPdfText(file)).rejects.toThrow(/OCR is not included/i);
  });
});
