import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

export const MAX_PDF_BYTES = 8 * 1024 * 1024;
export const MAX_PDF_PAGES = 40;

export class PdfExtractionError extends Error {
  code: 'unsupported' | 'too-large' | 'encrypted' | 'no-text' | 'too-many-pages' | 'corrupt' | 'empty';
  constructor(code: PdfExtractionError['code'], message: string) {
    super(message);
    this.name = 'PdfExtractionError';
    this.code = code;
  }
}

export async function extractPdfText(file: File): Promise<{ text: string; pageCount: number }> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new PdfExtractionError('unsupported', 'Choose a PDF file, or paste the offer text instead.');
  }
  if (file.size === 0) throw new PdfExtractionError('empty', 'This file is empty. Choose another PDF or paste the text.');
  if (file.size > MAX_PDF_BYTES) {
    throw new PdfExtractionError('too-large', 'This PDF is over 8 MB. Paste the relevant offer text instead.');
  }

  let document;
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    const task = getDocument({ data, useWorkerFetch: false, isEvalSupported: false });
    document = await task.promise;
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    if (name === 'PasswordException') {
      throw new PdfExtractionError('encrypted', 'This PDF is password-protected. Unlock it locally or paste the offer text.');
    }
    throw new PdfExtractionError('corrupt', 'RoleWorth could not read this PDF. It may be corrupt or unsupported. Paste the offer text instead.');
  }

  try {
    if (document.numPages > MAX_PDF_PAGES) {
      throw new PdfExtractionError('too-many-pages', 'This PDF has more than 40 pages. Paste the relevant offer pages instead.');
    }
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      let pageText = '';
      for (const item of content.items) {
        if (!('str' in item)) continue;
        pageText += item.str;
        pageText += item.hasEOL ? '\n' : ' ';
      }
      const text = pageText
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trim())
        .filter(Boolean)
        .join('\n')
        .trim();
      if (text) pages.push(`Page ${pageNumber}\n${text}`);
      page.cleanup();
    }
    const combined = pages.join('\n\n').trim();
    if (combined.replace(/Page \d+/g, '').trim().length < 20) {
      throw new PdfExtractionError('no-text', 'No selectable text was found. This may be a scanned PDF. OCR is not included; paste or type the offer text instead.');
    }
    return { text: combined, pageCount: document.numPages };
  } catch (error) {
    if (error instanceof PdfExtractionError) throw error;
    throw new PdfExtractionError('corrupt', 'Text extraction failed partway through this PDF. Paste the offer text instead.');
  } finally {
    await document.destroy();
  }
}
