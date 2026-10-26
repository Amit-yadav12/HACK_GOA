import { exportBundleSchema } from './schemas';
import { TERM_LABELS } from './terms';
import { recalculateOffer } from './offer';
import type { ExportBundle, OfferRecord } from '../types';

export function createExportBundle(offers: OfferRecord[]): ExportBundle {
  if (!offers.length) throw new Error('There is no offer to export yet.');
  return { kind: 'roleworth-export', schemaVersion: 1, exportedAt: new Date().toISOString(), offers };
}

export function parseImportBundle(raw: string): OfferRecord[] {
  if (raw.length > 5_000_000) throw new Error('This import is over 5 MB. Choose a smaller RoleWorth JSON backup.');
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('This file is not valid JSON. Choose an unedited RoleWorth export.');
  }
  const result = exportBundleSchema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.length ? ` at ${issue.path.join('.')}` : '';
    throw new Error(`Import validation failed${path}: ${issue?.message ?? 'unsupported data'}.`);
  }
  return result.data.offers.map((offer) => recalculateOffer({
    ...(offer as OfferRecord),
    sourceKind: 'import',
    terms: offer.terms.map((term) => term.status === 'verified'
      ? { ...term, note: 'Imported verification claim. RoleWorth has not checked the supplied source.' }
      : term),
  })) as OfferRecord[];
}

function inline(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/([\\`*_[\]#])/g, '\\$1')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function quote(value: string): string {
  return inline(value) || '_No excerpt available._';
}

export function exportMarkdown(record: OfferRecord): string {
  const { assessment } = record;
  const lines: string[] = [
    '# RoleWorth decision report',
    '',
    `**Offer:** ${inline(record.name)}  `,
    `**Exported:** ${inline(new Date().toISOString())}  `,
    `**Record type:** ${record.isDemo ? 'Synthetic demo data' : 'User-provided local record'}`,
    '',
    '> This report organises evidence and personal priorities. It is not an employer rating, legal determination or fraud assessment. Unknown means not established in the available evidence.',
    '',
    '## Decision brief',
    '',
    inline(assessment.summary),
    '',
    `- Supporting priority evidence: ${assessment.aligned.length}`,
    `- Priority conflicts: ${assessment.conflicts.length}`,
    `- Topics to clarify: ${assessment.unknowns.length}`,
    '',
  ];

  if (record.decisionNote.trim()) lines.push('## Personal decision note', '', inline(record.decisionNote), '');

  lines.push('## Personal priorities', '');
  lines.push(`- Target role: ${inline(record.priorities.targetRole) || 'Not set'}`);
  lines.push(`- Skills to practise: ${inline(record.priorities.skills) || 'Not set'}`);
  lines.push(`- Preferred work: ${inline(record.priorities.preferredWork) || 'Not set'}`);
  lines.push(`- Available hours per week: ${record.priorities.availableHours ?? 'Not set'}`);
  lines.push(`- Minimum monthly stipend: ${record.priorities.minimumStipend === null ? 'Not set' : `${record.priorities.currency} ${record.priorities.minimumStipend}`}`);
  lines.push(`- Mentorship preference: ${record.priorities.mentorship}`);
  lines.push(`- Non-negotiables: ${inline(record.priorities.nonNegotiables) || 'Not set'}`, '');

  lines.push('## Evidence ledger', '');
  for (const term of record.terms) {
    const value = term.rejected || term.status === 'unknown' || !term.value ? 'Unknown / not established' : term.value;
    lines.push(`### ${inline(term.label)}`, '');
    lines.push(`- **Value:** ${inline(value)}`);
    lines.push(`- **Status:** ${term.rejected ? 'Rejected by user' : term.status}`);
    if (term.excerpt) lines.push(`- **Source excerpt:** ${quote(term.excerpt.text)}`);
    if (term.verificationSource) lines.push(`- **User-supplied verification source:** ${quote(term.verificationSource)}`);
    if (term.note) lines.push(`- **Note:** ${inline(term.note)}`);
    lines.push('');
  }

  lines.push('## Alignment, trade-offs and unknowns', '');
  for (const [title, entries] of [['Supporting evidence', assessment.aligned], ['Conflicts', assessment.conflicts], ['To clarify', assessment.unknowns]] as const) {
    lines.push(`### ${title}`, '');
    if (!entries.length) lines.push('- None recorded.');
    for (const entry of entries) lines.push(`- **${inline(entry.title)}:** ${inline(entry.detail)}`);
    lines.push('');
  }

  lines.push('## Recruiter clarification', '');
  const questions = record.questions;
  if (!questions.length) lines.push('No generated questions remain.');
  for (const question of questions) lines.push(`- **${TERM_LABELS[question.termKey]}:** ${inline(question.question)}`);
  lines.push('');
  for (const response of record.responses) {
    lines.push(`### Reply recorded ${inline(response.replyDate)}`, '');
    lines.push(`Source/context: ${inline(response.source)}`, '', quote(response.text), '');
    lines.push(`Linked terms: ${response.linkedTermKeys.map((key) => TERM_LABELS[key]).join(', ')}`, '');
  }

  lines.push('## Personal learning milestones', '', '> These are personal goals, not employer commitments.', '');
  for (const milestone of record.milestones) {
    lines.push(`### ${inline(milestone.title)}`, '');
    lines.push(`- Target: ${milestone.targetDate}`);
    lines.push(`- Status: ${milestone.status}`);
    lines.push(`- Activity: ${inline(milestone.activity)}`);
    lines.push(`- Expected evidence: ${inline(milestone.expectedEvidence)}`);
    if (milestone.outcome) {
      lines.push(`- Actual outcome (${milestone.outcome.date}): ${inline(milestone.outcome.workPerformed)}`);
      lines.push(`- Feedback received: ${inline(milestone.outcome.feedback) || 'Not recorded'}`);
      lines.push(`- Evidence: ${inline(milestone.outcome.evidence) || 'Not recorded'}`);
      lines.push(`- Promise outcome marked by user: ${milestone.outcome.promiseOutcome}`);
    }
    lines.push('');
  }

  lines.push('## Assessment history', '');
  for (const snapshot of record.snapshots) {
    lines.push(`- ${inline(snapshot.createdAt)} — ${inline(snapshot.reason)}: ${snapshot.assessment.aligned.length} aligned, ${snapshot.assessment.conflicts.length} conflicts, ${snapshot.assessment.unknowns.length} unknowns.`);
  }
  lines.push('', '---', 'Generated locally by RoleWorth 2.0. No third-party verification is implied.');
  return lines.join('\n');
}
