import { getTerm } from './extraction';
import { isValidDateInput } from './format';
import { TERM_DEFINITIONS, TERM_LABELS } from './terms';
import type {
  Assessment,
  AssessmentItem,
  AssessmentSnapshot,
  ExtractedTerm,
  LearningMilestone,
  OfferRecord,
  PriorityProfile,
  RecruiterQuestion,
  RecruiterResponse,
  SnapshotTerm,
  TermKey,
} from '../types';
import { makeId } from './id';

const CLARIFYING_QUESTIONS: Record<TermKey, { question: string; rationale: string }> = {
  company: { question: 'Could you confirm the legal or registered name of the organisation offering the internship?', rationale: 'The organisation is not established in the source text.' },
  role: { question: 'Could you confirm the exact internship title and the team I would work with?', rationale: 'The role is not established in the source text.' },
  duration: { question: 'What are the exact start and end dates, and is any part of the period optional?', rationale: 'The time frame affects your other commitments.' },
  stipend: { question: 'Could you confirm the stipend amount, currency and whether it is paid monthly or in total?', rationale: 'The amount and frequency are needed for a financial comparison.' },
  payment: { question: 'When will each payment be made, and are there conditions that could delay it?', rationale: 'Payment timing and conditions are not yet clear.' },
  training: { question: 'Is any training or probation period required, and is that time paid?', rationale: 'Training can change both time and compensation.' },
  hours: { question: 'How many hours per week are expected, and are fixed meeting times required?', rationale: 'This is needed to check the offer against your available time.' },
  fees: { question: 'Are there any fees, deposits, equipment charges or other costs I would need to pay?', rationale: 'A missing fee clause is unknown, not proof that no costs exist.' },
  responsibilities: { question: 'What would a typical week of work involve, and which tasks would take most of my time?', rationale: 'The actual work is needed to assess learning alignment.' },
  mentorship: { question: 'Who would review my work, and how often would I receive feedback or mentorship?', rationale: 'The source does not establish a feedback or mentorship arrangement.' },
  deliverables: { question: 'What deliverables or performance criteria would I be assessed against?', rationale: 'Expected outputs and review criteria are not yet clear.' },
  termination: { question: 'What notice or termination terms apply to either party?', rationale: 'Exit terms are not established in the source text.' },
};

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9₹]+/g, ' ').trim();
}

function usableTerm(terms: ExtractedTerm[], key: TermKey): ExtractedTerm | undefined {
  const term = getTerm(terms, key);
  return term && !term.rejected && term.value.trim() && term.status !== 'unknown' ? term : undefined;
}

function item(kind: AssessmentItem['kind'], title: string, detail: string, termKey?: TermKey): AssessmentItem {
  return { id: makeId('assessment'), kind, title, detail, termKey };
}

function meaningfulWords(value: string): string[] {
  const ignored = new Set(['and', 'the', 'with', 'for', 'intern', 'internship', 'work', 'learn', 'role']);
  return normalise(value).split(/\s+/).filter((word) => word.length > 2 && !ignored.has(word));
}

function parseWeeklyHours(value: string): number | null {
  if (!/\b(?:week|weekly|wk)\b/i.test(value)) return null;
  const range = value.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
  if (range) return Number(range[2]);
  const match = value.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
  return match ? Number(match[1]) : null;
}

function parseMoney(value: string): { amount: number; currency: string | null; monthly: boolean } | null {
  if (/\b(?:unpaid|no stipend|without pay)\b/i.test(value)) return { amount: 0, currency: null, monthly: true };
  const match = value.replace(/,/g, '').match(/(?:₹|rs\.?|inr|\$|usd|€|eur|£|gbp)?\s*(\d+(?:\.\d+)?)/i);
  if (!match) return null;
  const currencies = [
    /(?:\bUSD\b|\bUS\$|\$)/i.test(value) ? 'USD' : null,
    /(?:\bEUR\b|€)/i.test(value) ? 'EUR' : null,
    /(?:\bGBP\b|£)/i.test(value) ? 'GBP' : null,
    /(?:\bINR\b|₹|\bRs\.?(?=\s|\d))/i.test(value) ? 'INR' : null,
  ].filter((currency): currency is string => Boolean(currency));
  return {
    amount: Number(match[1]),
    // An absent or ambiguous currency is not evidence for INR (or any other currency).
    currency: currencies.length === 1 ? currencies[0] : null,
    monthly: /\b(?:month|monthly|per month|\/\s*month|pm)\b/i.test(value),
  };
}

function classifyFeeLanguage(value: string): 'no-fee' | 'fee' | 'unclear' {
  const noFee = /^\s*(?:no|none|free|not applicable)\.?\s*$/i.test(value)
    || /\bnone\b/i.test(value)
    || /\b(?:no|without|free of)\b[^.\n;]{0,60}\b(?:fees?|deposits?|charges?|costs?)\b/i.test(value)
    || /\b(?:fees?|deposits?|charges?)\b[^.\n;]{0,40}\b(?:waived|not required|not charged|not applicable)\b/i.test(value);
  const qualified = /\b(?:reimburs\w*|refund\w*|unless|if|may|might|could|conditional|depending|except|unknown|tbd|information|details|whether|unclear|knowing|specified|stated|mentioned|provided|disclosed)\b/i.test(value)
    || /\bnot\s+(?:specified|stated|mentioned|provided|disclosed|clear)\b/i.test(value);
  const feeWord = '(?:fees?|deposits?|charges?|costs?)';
  const negatedWaiver = new RegExp(`\\b(?:no|none|not)\\b[^.\\n;]{0,60}\\b${feeWord}\\b[^.\\n;]{0,50}\\b(?:waived|waiver)\\b`, 'i').test(value)
    || new RegExp(`\\b${feeWord}\\b[^.\\n;]{0,50}\\b(?:not|never)\\s+(?:waived|waiver)\\b`, 'i').test(value);
  const contrastingClause = /\b(?:but|however|except|although|though|whereas)\b/i.test(value);
  const chargePattern = new RegExp(`\\b${feeWord}\\b[^.\\n;]{0,50}\\b(?:\\d[\\d,]*|required|payable|due|must\\s+be\\s+paid)\\b`, 'gi');
  const affirmativeCharge = [...value.matchAll(chargePattern)].some((match) => {
    const clausePrefix = value.slice(0, match.index ?? 0).split(/[.;\n]/).pop() ?? '';
    return !/\b(?:no|none|not|without)\b[^.;\n]{0,30}$/i.test(clausePrefix);
  });
  // Reimbursement, conditions, negated waivers and mixed clauses do not establish free participation.
  if (qualified || negatedWaiver || (noFee && (contrastingClause || affirmativeCharge))) return 'unclear';
  return noFee ? 'no-fee' : 'fee';
}

function addUnique(target: AssessmentItem[], candidate: AssessmentItem): void {
  if (!target.some((existing) => existing.termKey === candidate.termKey && existing.kind === candidate.kind)) {
    target.push(candidate);
  }
}

export function evaluateOffer(
  terms: ExtractedTerm[],
  priorities: PriorityProfile,
  now = new Date().toISOString(),
): Assessment {
  const aligned: AssessmentItem[] = [];
  const conflicts: AssessmentItem[] = [];
  const unknowns: AssessmentItem[] = [];

  const role = usableTerm(terms, 'role');
  if (priorities.targetRole.trim()) {
    if (!role) {
      unknowns.push(item('unknown', 'Role fit is still open', `You are targeting ${priorities.targetRole}, but the role is not established.`, 'role'));
    } else {
      const roleWords = meaningfulWords(role.value);
      const targetWords = meaningfulWords(priorities.targetRole);
      const matches = targetWords.some((word) => roleWords.includes(word));
      if (matches) {
        aligned.push(item('aligned', 'Role direction matches', `${role.value} overlaps with your ${priorities.targetRole} target.`, 'role'));
      } else {
        conflicts.push(item('conflict', 'Role direction differs', `${role.value} does not visibly match your ${priorities.targetRole} target. Review the work itself before deciding.`, 'role'));
      }
    }
  }

  const workText = (['responsibilities', 'training', 'deliverables'] as TermKey[])
    .map((key) => usableTerm(terms, key)?.value ?? '')
    .join(' ');

  if (priorities.skills.trim()) {
    const skills = priorities.skills.split(',').map((skill) => skill.trim()).filter(Boolean);
    const matches = skills.filter((skill) => meaningfulWords(skill).some((word) => normalise(workText).includes(word)));
    if (matches.length) {
      aligned.push(item('aligned', 'Skill practice is described', `The described work mentions ${matches.join(', ')}.`, 'responsibilities'));
    } else {
      unknowns.push(item('unknown', 'Skill practice needs examples', `The source does not clearly show where you would practise ${skills.join(', ')}. Ask for a typical project.`, 'responsibilities'));
    }
  }

  if (priorities.preferredWork.trim()) {
    const matches = meaningfulWords(priorities.preferredWork).filter((word) => normalise(workText).includes(word));
    if (matches.length) {
      aligned.push(item('aligned', 'Preferred work is described', `The described work overlaps with your preferred work (${matches.slice(0, 3).join(', ')}).`, 'responsibilities'));
    } else {
      unknowns.push(item('unknown', 'Preferred work needs examples', `The source does not clearly describe your preferred work: ${priorities.preferredWork}. Ask for a typical project.`, 'responsibilities'));
    }
  }

  const hours = usableTerm(terms, 'hours');
  if (priorities.availableHours !== null) {
    const weeklyHours = hours ? parseWeeklyHours(hours.value) : null;
    if (!hours || weeklyHours === null) {
      unknowns.push(item('unknown', 'Weekly time is not comparable', `You have ${priorities.availableHours} hours available. The offer needs a clear weekly commitment.`, 'hours'));
    } else if (weeklyHours <= priorities.availableHours) {
      aligned.push(item('aligned', 'Time fits your availability', `${weeklyHours} stated hours per week fit within your ${priorities.availableHours}-hour limit.`, 'hours'));
    } else {
      conflicts.push(item('conflict', 'Time exceeds your availability', `${weeklyHours} stated hours per week exceed your ${priorities.availableHours}-hour limit.`, 'hours'));
    }
  }

  const stipend = usableTerm(terms, 'stipend');
  if (priorities.minimumStipend !== null) {
    const money = stipend ? parseMoney(stipend.value) : null;
    if (!stipend || !money || !money.monthly || (money.amount !== 0 && money.currency !== priorities.currency)) {
      unknowns.push(item('unknown', 'Compensation is not comparable', 'Confirm the amount, currency and monthly frequency before comparing it with your minimum.', 'stipend'));
    } else if (money.amount >= priorities.minimumStipend) {
      aligned.push(item('aligned', 'Stipend meets your minimum', `The stated monthly amount meets your ${priorities.currency} ${priorities.minimumStipend.toLocaleString('en-IN')} minimum.`, 'stipend'));
    } else {
      conflicts.push(item('conflict', 'Stipend is below your minimum', `The stated monthly amount is below your ${priorities.currency} ${priorities.minimumStipend.toLocaleString('en-IN')} minimum.`, 'stipend'));
    }
  }

  const mentorship = usableTerm(terms, 'mentorship');
  if (priorities.mentorship !== 'flexible') {
    if (!mentorship) {
      unknowns.push(item('unknown', 'Feedback rhythm is unknown', `You marked mentorship as ${priorities.mentorship}; the source does not establish it.`, 'mentorship'));
    } else if (/\b(?:no mentor|no mentorship|not provided|no supervision)\b/i.test(mentorship.value)) {
      conflicts.push(item('conflict', 'Mentorship conflicts with your preference', 'The source explicitly says mentorship is not provided.', 'mentorship'));
    } else {
      aligned.push(item('aligned', 'Mentorship is described', 'The source contains a mentorship or feedback commitment you can inspect.', 'mentorship'));
    }
  }

  const fees = usableTerm(terms, 'fees');
  if (/fee|deposit|charge/i.test(priorities.nonNegotiables)) {
    if (!fees) {
      unknowns.push(item('unknown', 'Your no-fee boundary needs confirmation', 'You do not want fees or deposits, but the source does not establish whether any apply.', 'fees'));
    } else {
      const feeLanguage = classifyFeeLanguage(fees.value);
      if (feeLanguage === 'no-fee') {
        aligned.push(item('aligned', 'Your no-fee boundary is supported', 'The offer explicitly states that no listed fees or deposits apply.', 'fees'));
      } else if (feeLanguage === 'fee') {
        conflicts.push(item('conflict', 'A cost conflicts with your boundary', 'The offer mentions a fee, deposit or charge. Inspect the source before deciding.', 'fees'));
      } else {
        addUnique(unknowns, item('unknown', 'Fee wording needs confirmation', 'The source mentions fees, reimbursement or conditions, but does not clearly establish whether you must pay anything.', 'fees'));
      }
    }
  }

  const noUnpaidTraining = /\bno\s+(?:unpaid|without\s+pay)\s+(?:training|onboarding|probation)\b/i.test(priorities.nonNegotiables);
  if (noUnpaidTraining) {
    const training = usableTerm(terms, 'training');
    if (!training) {
      addUnique(unknowns, item('unknown', 'Training compensation needs confirmation', 'You do not want unpaid training, but the source does not establish whether training is paid.', 'training'));
    } else if (/\b(?:unpaid|without\s+pay|not\s+paid)\b/i.test(training.value)) {
      conflicts.push(item('conflict', 'Unpaid training conflicts with your boundary', 'The source describes unpaid training or probation. Inspect the exact term before deciding.', 'training'));
    } else if (/\b(?:paid|compensated)\b/i.test(training.value)) {
      aligned.push(item('aligned', 'Your paid-training boundary is supported', 'The source describes the training or onboarding period as paid.', 'training'));
    } else {
      addUnique(unknowns, item('unknown', 'Training compensation needs confirmation', 'The source mentions training but does not establish whether that time is paid.', 'training'));
    }
  }

  for (const key of ['payment', 'training', 'deliverables', 'termination'] as TermKey[]) {
    if (!usableTerm(terms, key)) {
      addUnique(unknowns, item('unknown', `${TERM_LABELS[key]} need clarification`, `The current evidence does not establish ${TERM_LABELS[key].toLowerCase()}. Missing text is not a negative finding.`, key));
    }
  }

  const posture = conflicts.length ? 'resolve' : unknowns.length ? 'clarify' : aligned.length ? 'ready' : 'reflect';
  const summary = conflicts.length
    ? `${conflicts.length} priority ${conflicts.length === 1 ? 'conflict needs' : 'conflicts need'} your attention. ${unknowns.length} ${unknowns.length === 1 ? 'topic remains' : 'topics remain'} unresolved.`
    : unknowns.length
      ? `${aligned.length} ${aligned.length === 1 ? 'priority has' : 'priorities have'} supporting evidence. ${unknowns.length} ${unknowns.length === 1 ? 'topic needs' : 'topics need'} clarification before you commit.`
      : aligned.length
        ? 'Your stated priorities have supporting evidence. The final decision remains yours.'
        : 'Add your priorities to make this brief personally useful.';

  return { aligned, conflicts, unknowns, posture, summary, generatedAt: now };
}

export function buildClarificationQuestions(terms: ExtractedTerm[], priorities: PriorityProfile): RecruiterQuestion[] {
  const assessment = evaluateOffer(terms, priorities);
  const priorityOrder = assessment.unknowns.map((entry) => entry.termKey).filter((key): key is TermKey => Boolean(key));
  const unresolved = new Set(priorityOrder);
  const missing = TERM_DEFINITIONS
    .map(({ key }) => key)
    .filter((key) => !usableTerm(terms, key) || unresolved.has(key))
    .sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a);
      const bIndex = priorityOrder.indexOf(b);
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    });
  return missing.slice(0, 6).map((key) => ({
    id: makeId('question'),
    termKey: key,
    ...CLARIFYING_QUESTIONS[key],
  }));
}

export function buildRecruiterMessage(record: OfferRecord): string {
  const questions = buildClarificationQuestions(record.terms, record.priorities).slice(0, 4);
  const role = usableTerm(record.terms, 'role')?.value ?? 'the internship';
  if (!questions.length) {
    return `Hello,\n\nThank you for the ${role} offer. I have reviewed the terms and would be happy to discuss the next steps.\n\nBest regards`;
  }
  return `Hello,\n\nThank you for the ${role} offer. I am reviewing the details carefully and would appreciate your help clarifying a few points:\n\n${questions.map((entry, index) => `${index + 1}. ${entry.question}`).join('\n')}\n\nThank you for your time. Your answers will help me make an informed decision.\n\nBest regards`;
}

export function createSnapshot(record: OfferRecord, reason: string, now = new Date().toISOString()): AssessmentSnapshot {
  const terms: SnapshotTerm[] = record.terms.map(({ key, value, status, rejected }) => ({ key, value, status, rejected }));
  return {
    id: makeId('snapshot'),
    createdAt: now,
    reason,
    assessment: structuredClone(record.assessment),
    terms,
  };
}

export function createLearningPlan(record: OfferRecord, now = new Date()): LearningMilestone[] {
  const skills = record.priorities.skills.split(',').map((skill) => skill.trim()).filter(Boolean);
  const primarySkill = skills[0] || 'the core skill for this role';
  const work = usableTerm(record.terms, 'responsibilities')?.value ?? 'the work agreed with your supervisor';
  const dateAfter = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  };
  return [
    {
      id: makeId('milestone'),
      title: `Map your ${primarySkill} baseline`,
      activity: `Write down what you can already do in ${primarySkill}, then choose one specific gap to practise during ${work}.`,
      expectedEvidence: 'A dated baseline note and one concrete practice goal.',
      targetDate: dateAfter(3),
      status: 'planned',
      origin: 'suggested',
    },
    {
      id: makeId('milestone'),
      title: 'Create one inspectable work sample',
      activity: `Turn a real task into a small before-and-after work sample. Ask for feedback; do not treat the sample itself as proof of an employer promise.`,
      expectedEvidence: 'A work sample, your reflection and any feedback you actually received.',
      targetDate: dateAfter(14),
      status: 'planned',
      origin: 'suggested',
    },
    {
      id: makeId('milestone'),
      title: 'Review promise against experience',
      activity: 'Compare the original offer and recruiter clarifications with the work, feedback and skills you experienced.',
      expectedEvidence: 'A dated outcome note with fulfilled, unmet or unresolved marked only where you have evidence.',
      targetDate: dateAfter(30),
      status: 'planned',
      origin: 'suggested',
    },
  ];
}

export interface RecruiterResponseInput {
  replyDate: string;
  source: string;
  text: string;
  updates: Partial<Record<TermKey, string>>;
}

export function applyRecruiterResponse(record: OfferRecord, input: RecruiterResponseInput): OfferRecord {
  const linkedTermKeys = Object.keys(input.updates).filter((key) => input.updates[key as TermKey]?.trim()) as TermKey[];
  if (!input.text.trim()) throw new Error('Add the recruiter reply text before applying it.');
  if (!isValidDateInput(input.replyDate)) throw new Error('Add a valid calendar date for the recruiter reply.');
  if (!linkedTermKeys.length) throw new Error('Link the reply to at least one term and record what it establishes.');

  const now = new Date().toISOString();
  const before = createSnapshot(record, 'Before recruiter reply', now);
  const response: RecruiterResponse = {
    id: makeId('response'),
    replyDate: input.replyDate,
    source: input.source.trim() || 'Recruiter reply',
    text: input.text.trim(),
    linkedTermKeys,
    updates: Object.fromEntries(linkedTermKeys.map((key) => [key, input.updates[key]?.trim()])),
    createdAt: now,
  };
  const terms = record.terms.map((term) => {
    const value = input.updates[term.key]?.trim();
    if (!value) return term;
    return {
      ...term,
      value,
      status: 'user' as const,
      source: 'recruiter' as const,
      excerpt: { text: response.text },
      note: 'Linked by you to a recruiter reply. This is not independent verification.',
      verificationSource: undefined,
      rejected: false,
      updatedAt: now,
    };
  });
  const withResponse = { ...record, terms, responses: [...record.responses, response], updatedAt: now };
  const assessment = evaluateOffer(terms, record.priorities, now);
  const updated = {
    ...withResponse,
    assessment,
    questions: buildClarificationQuestions(terms, record.priorities),
  };
  const after = createSnapshot(updated, 'After recruiter reply', new Date(Date.now() + 1).toISOString());
  return { ...updated, snapshots: [...record.snapshots, before, after] };
}

export interface PromiseDelta {
  before: AssessmentSnapshot;
  after: AssessmentSnapshot;
  changes: Array<{
    key: TermKey;
    before: SnapshotTerm;
    after: SnapshotTerm;
  }>;
  remainingUnknowns: TermKey[];
}

export function getPromiseDelta(record: OfferRecord): PromiseDelta | null {
  if (record.snapshots.length < 2) return null;
  const before = record.snapshots[record.snapshots.length - 2];
  const after = record.snapshots[record.snapshots.length - 1];
  const changes = after.terms.flatMap((afterTerm) => {
    const beforeTerm = before.terms.find((term) => term.key === afterTerm.key);
    if (!beforeTerm || (beforeTerm.value === afterTerm.value && beforeTerm.status === afterTerm.status && beforeTerm.rejected === afterTerm.rejected)) return [];
    return [{ key: afterTerm.key, before: beforeTerm, after: afterTerm }];
  });
  return {
    before,
    after,
    changes,
    remainingUnknowns: after.terms.filter((term) => term.status === 'unknown' || term.rejected || !term.value).map((term) => term.key),
  };
}
