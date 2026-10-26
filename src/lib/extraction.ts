import { makeId } from './id';
import { TERM_DEFINITIONS } from './terms';
import type { ExtractedTerm, SourceExcerpt, TermKey } from '../types';

interface LineMatch {
  value: string;
  excerpt: SourceExcerpt;
}

interface TextLine {
  raw: string;
  start: number;
  end: number;
}

const UNKNOWN_VALUES = /^(?:n\/?a|not (?:specified|mentioned|stated|provided)|tbd|to be determined|unknown)[.\s]*$/i;

function getLines(text: string): TextLine[] {
  const lines: TextLine[] = [];
  let start = 0;
  for (const rawWithNewline of text.split('\n')) {
    const raw = rawWithNewline.replace(/\r$/, '');
    const end = start + raw.length;
    lines.push({ raw, start, end });
    start = end + 1 + (rawWithNewline.endsWith('\r') ? 1 : 0);
  }
  return lines;
}

function excerptForLine(line: TextLine, text: string): SourceExcerpt {
  const leftTrimmed = line.raw.trimStart();
  const leading = line.raw.length - leftTrimmed.length;
  const trimmed = leftTrimmed.trimEnd();
  const start = line.start + leading;
  return { text: text.slice(start, start + trimmed.length), start, end: start + trimmed.length };
}

function labeledLine(text: string, labels: string[]): LineMatch | undefined {
  const expression = new RegExp(`^\\s*(?:${labels.join('|')})\\s*[:\\-–]\\s*(.*?)\\s*$`, 'i');
  for (const line of getLines(text)) {
    const match = line.raw.match(expression);
    if (!match) continue;
    const value = match[1].trim();
    const excerpt = excerptForLine(line, text);
    if (!value || UNKNOWN_VALUES.test(value)) return { value: '', excerpt };
    return { value, excerpt };
  }
  return undefined;
}

function keywordLine(text: string, keywords: RegExp, valuePattern?: RegExp): LineMatch | undefined {
  for (const line of getLines(text)) {
    if (!keywords.test(line.raw)) continue;
    const value = valuePattern ? line.raw.match(valuePattern)?.[0]?.trim() : line.raw.trim();
    if (!value) continue;
    return { value, excerpt: excerptForLine(line, text) };
  }
  return undefined;
}

function companyFallback(text: string): LineMatch | undefined {
  const expression = /\b([A-Z][A-Za-z0-9&.' -]{2,55}?)\s+(?:is pleased to offer|offers you|welcomes you as)\b/;
  const match = expression.exec(text);
  if (!match) return undefined;
  const value = match[1].trim();
  return {
    value,
    excerpt: { text: match[0], start: match.index, end: match.index + match[0].length },
  };
}

function roleFallback(text: string): LineMatch | undefined {
  const expression = /\b(?:as|position of)\s+(?:an?\s+)?([A-Z][A-Za-z0-9/&' -]{2,55}?\b(?:Intern|Internship|Trainee))\b/i;
  const match = expression.exec(text);
  if (!match) return undefined;
  return {
    value: match[1].trim(),
    excerpt: { text: match[0], start: match.index, end: match.index + match[0].length },
  };
}

function findTerm(text: string, key: TermKey): LineMatch | undefined {
  switch (key) {
    case 'company':
      return labeledLine(text, ['Organisation', 'Organization', 'Company', 'Employer']) ?? companyFallback(text);
    case 'role':
      return labeledLine(text, ['Role', 'Position', 'Internship title', 'Designation']) ?? roleFallback(text);
    case 'duration':
      return labeledLine(text, ['Duration', 'Internship period', 'Term', 'Dates'])
        ?? keywordLine(text, /\b(?:duration|weeks?|months?)\b/i, /\b\d+[ -]?(?:weeks?|months?)(?:[^.\n]*)/i);
    case 'stipend':
      return labeledLine(text, ['Stipend', 'Compensation', 'Salary', 'Pay'])
        ?? keywordLine(text, /\b(?:stipend|compensation|salary)\b/i);
    case 'payment':
      return labeledLine(text, ['Payment conditions', 'Payment terms', 'Payment schedule', 'Pay schedule'])
        ?? keywordLine(text, /\b(?:paid|payment)\b.*\b(?:days?|month|week|transfer|completion)\b/i);
    case 'training':
      return labeledLine(text, ['Training period', 'Training', 'Onboarding', 'Probation'])
        ?? keywordLine(text, /\b(?:training|onboarding|probation)\b/i);
    case 'hours':
      return labeledLine(text, ['Working hours', 'Work hours', 'Hours', 'Time commitment', 'Schedule'])
        ?? keywordLine(text, /\b\d+\s*(?:hours?|hrs?)\b/i);
    case 'fees':
      return labeledLine(text, ['Fees & deposits', 'Fees and deposits', 'Fees', 'Deposit', 'Charges'])
        ?? keywordLine(text, /\b(?:fee|fees|deposit|security deposit|registration charge)\b/i);
    case 'responsibilities':
      return labeledLine(text, ['Responsibilities', 'Responsibility', 'Work scope', 'What you will do', 'Duties']);
    case 'mentorship':
      return labeledLine(text, ['Mentorship', 'Mentoring', 'Mentor', 'Supervision', 'Feedback'])
        ?? keywordLine(text, /\b(?:mentor|mentorship|supervisor|weekly feedback)\b/i);
    case 'deliverables':
      return labeledLine(text, ['Deliverables', 'Expected outputs', 'Performance criteria', 'Outcomes'])
        ?? keywordLine(text, /\b(?:deliverables?|expected outputs?|performance criteria)\b/i);
    case 'termination':
      return labeledLine(text, ['Exit terms', 'Termination', 'Termination terms', 'Notice period'])
        ?? keywordLine(text, /\b(?:termination|terminate|notice period|days written notice)\b/i);
  }
}

export function identifyCandidateTerms(text: string, now = new Date().toISOString()): ExtractedTerm[] {
  return TERM_DEFINITIONS.map(({ key, label }) => {
    const match = findTerm(text, key);
    const hasValue = Boolean(match?.value);
    return {
      id: makeId('term'),
      key,
      label,
      value: match?.value ?? '',
      status: hasValue ? 'explicit' : 'unknown',
      source: hasValue ? 'offer' : 'none',
      excerpt: match?.excerpt,
      note: !hasValue && match?.excerpt ? 'The source mentions this field but does not establish a value.' : undefined,
      rejected: false,
      updatedAt: now,
    } satisfies ExtractedTerm;
  });
}

export function getTerm(terms: ExtractedTerm[], key: TermKey): ExtractedTerm | undefined {
  return terms.find((term) => term.key === key);
}
