import { CalendarDays, Check, CheckCircle2, ChevronRight, CircleDashed, FilePenLine, Flag, Plus, Trash2, Trophy } from 'lucide-react';
import { useState } from 'react';
import { Button, Modal } from '../../components/ui';
import { makeId } from '../../lib/id';
import { isValidDateInput, todayInputValue } from '../../lib/format';
import type { LearningMilestone, MilestoneStatus, OfferRecord, OutcomeRecord, PromiseOutcome } from '../../types';

interface LearningTrackerProps {
  record: OfferRecord;
  onChange: (record: OfferRecord) => void;
  onToast: (message: string) => void;
  verifyMode?: boolean;
}

const statusLabels: Record<MilestoneStatus, string> = { planned: 'Planned', 'in-progress': 'In progress', completed: 'Completed', postponed: 'Postponed' };
const outcomeLabels: Record<PromiseOutcome, string> = { 'not-assessed': 'Not assessed', fulfilled: 'Fulfilled', unmet: 'Unmet', unresolved: 'Still unresolved' };

function MilestoneEditor({ milestone, onSave, onClose }: { milestone?: LearningMilestone; onSave: (milestone: LearningMilestone) => void; onClose: () => void }) {
  const [title, setTitle] = useState(milestone?.title ?? '');
  const [activity, setActivity] = useState(milestone?.activity ?? '');
  const [evidence, setEvidence] = useState(milestone?.expectedEvidence ?? '');
  const [date, setDate] = useState(milestone?.targetDate ?? todayInputValue());
  const [error, setError] = useState('');
  const save = () => {
    if (!title.trim() || !activity.trim() || !evidence.trim() || !date) { setError('Add a goal, activity, expected evidence and target date.'); return; }
    if (!isValidDateInput(date)) { setError('Add a valid calendar target date.'); return; }
    onSave({ id: milestone?.id ?? makeId('milestone'), title: title.trim(), activity: activity.trim(), expectedEvidence: evidence.trim(), targetDate: date, status: milestone?.status ?? 'planned', origin: milestone?.origin ?? 'personal', outcome: milestone?.outcome });
  };
  return <Modal title={milestone ? 'Edit personal milestone' : 'Add a personal milestone'} description="This is your learning plan. It does not become an employer commitment because it appears here." onClose={onClose} width="lg"><div className="space-y-5"><div><label className="field-label" htmlFor="milestone-title">Goal</label><input id="milestone-title" className="field" maxLength={500} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Practise conducting user interviews" /></div><div><label className="field-label" htmlFor="milestone-activity">Planned activity</label><textarea id="milestone-activity" className="field min-h-[90px]" maxLength={5000} value={activity} onChange={(event) => setActivity(event.target.value)} placeholder="What will you actually do?" /></div><div><label className="field-label" htmlFor="milestone-evidence">Evidence you want to collect</label><textarea id="milestone-evidence" className="field min-h-[80px]" maxLength={5000} value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="A work sample, feedback note, reflection…" /></div><div><label className="field-label" htmlFor="milestone-date">Target date</label><input id="milestone-date" type="date" className="field" value={date} onChange={(event) => setDate(event.target.value)} /></div>{error && <p role="alert" className="text-sm text-danger">{error}</p>}<div className="flex justify-end gap-3 border-t border-line pt-5"><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} icon={<Check size={16} />}>Save personal goal</Button></div></div></Modal>;
}

function OutcomeEditor({ milestone, onSave, onClose }: { milestone: LearningMilestone; onSave: (outcome: OutcomeRecord) => void; onClose: () => void }) {
  const existing = milestone.outcome;
  const [date, setDate] = useState(existing?.date ?? todayInputValue());
  const [work, setWork] = useState(existing?.workPerformed ?? '');
  const [feedback, setFeedback] = useState(existing?.feedback ?? '');
  const [skills, setSkills] = useState(existing?.skillsPracticed ?? '');
  const [evidence, setEvidence] = useState(existing?.evidence ?? '');
  const [promise, setPromise] = useState<PromiseOutcome>(existing?.promiseOutcome ?? 'not-assessed');
  const [error, setError] = useState('');
  const save = () => {
    if (!date) { setError('Add the date when this outcome happened.'); return; }
    if (!isValidDateInput(date)) { setError('Add a valid calendar outcome date.'); return; }
    if (!work.trim()) { setError('Record what actually happened before saving an outcome.'); return; }
    onSave({ date, workPerformed: work.trim(), feedback: feedback.trim(), skillsPracticed: skills.trim(), evidence: evidence.trim(), promiseOutcome: promise, updatedAt: new Date().toISOString() });
  };
  return <Modal title="Record what actually happened" description={`${milestone.title} · This outcome is your dated account, not an automatic verification.`} onClose={onClose} width="lg"><div className="space-y-5"><div><label className="field-label" htmlFor="outcome-date">Outcome date</label><input id="outcome-date" type="date" className="field" value={date} onChange={(event) => setDate(event.target.value)} /></div><div><label className="field-label" htmlFor="outcome-work">Work performed <span className="text-danger">*</span></label><textarea id="outcome-work" className="field min-h-[90px]" maxLength={10000} value={work} onChange={(event) => setWork(event.target.value)} placeholder="What did you actually work on?" /></div><div className="grid gap-5 sm:grid-cols-2"><div><label className="field-label" htmlFor="outcome-skills">Skills practised</label><input id="outcome-skills" className="field" maxLength={5000} value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Research, prototyping…" /></div><div><label className="field-label" htmlFor="outcome-promise">Related promise outcome</label><select id="outcome-promise" className="field" value={promise} onChange={(event) => setPromise(event.target.value as PromiseOutcome)}>{Object.entries(outcomeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div></div><div><label className="field-label" htmlFor="outcome-feedback">Review or feedback received</label><textarea id="outcome-feedback" className="field min-h-[75px]" maxLength={10000} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Only record feedback you actually received." /></div><div><label className="field-label" htmlFor="outcome-evidence">Evidence or artefact reference</label><textarea id="outcome-evidence" className="field min-h-[75px]" maxLength={10000} value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="A dated note, file name or your own description. Do not paste secrets." /></div>{error && <p role="alert" className="text-sm text-danger">{error}</p>}<div className="rounded-xl bg-amber-soft px-4 py-3 text-xs leading-5 text-[#805b27]">Completing a personal milestone does <strong>not</strong> prove that an employer commitment was fulfilled. Choose the promise outcome yourself, or leave it unassessed.</div><div className="flex justify-end gap-3 border-t border-line pt-5"><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} icon={<Check size={16} />}>Save outcome</Button></div></div></Modal>;
}

export function LearningTracker({ record, onChange, onToast, verifyMode = false }: LearningTrackerProps) {
  const [editing, setEditing] = useState<LearningMilestone | null>(null);
  const [adding, setAdding] = useState(false);
  const [outcomeFor, setOutcomeFor] = useState<LearningMilestone | null>(null);
  const completed = record.milestones.filter((milestone) => milestone.status === 'completed').length;
  const outcomes = record.milestones.filter((milestone) => milestone.outcome).length;

  const saveMilestone = (milestone: LearningMilestone) => {
    const exists = record.milestones.some((item) => item.id === milestone.id);
    onChange({ ...record, milestones: exists ? record.milestones.map((item) => item.id === milestone.id ? milestone : item) : [...record.milestones, milestone], updatedAt: new Date().toISOString() });
    setEditing(null); setAdding(false); onToast(exists ? 'Personal milestone updated.' : 'Personal milestone added.');
  };
  const saveOutcome = (outcome: OutcomeRecord) => {
    if (!outcomeFor) return;
    onChange({ ...record, milestones: record.milestones.map((item) => item.id === outcomeFor.id ? { ...item, outcome } : item), updatedAt: new Date().toISOString() });
    setOutcomeFor(null); onToast('Dated outcome saved. Employer promises remain separate.');
  };
  const updateStatus = (id: string, status: MilestoneStatus) => onChange({ ...record, milestones: record.milestones.map((item) => item.id === id ? { ...item, status } : item), updatedAt: new Date().toISOString() });
  const remove = (milestone: LearningMilestone) => {
    if (!window.confirm(`Delete “${milestone.title}” and its recorded outcome?`)) return;
    onChange({ ...record, milestones: record.milestones.filter((item) => item.id !== milestone.id), updatedAt: new Date().toISOString() });
    onToast('Personal milestone deleted.');
  };

  return <div className="animate-enter mx-auto max-w-[1120px] px-5 pb-16 pt-8 sm:px-8 lg:px-12 lg:pt-10">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">{verifyMode ? '05 / Verify' : '04 / Learn'}</p><h1 className="display-title mt-3 text-[38px] leading-tight sm:text-[44px]">{verifyMode ? 'Compare promise with practice.' : 'Make the learning visible.'}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-[15px]">{verifyMode ? 'Record dated outcomes and your own assessment of what was fulfilled, unmet or still unresolved.' : 'A 30-day plan built from your goals and the work described in the offer. Every item here is a personal goal—not an employer promise.'}</p></div><Button variant="primary" onClick={() => setAdding(true)} icon={<Plus size={16} />}>Add personal goal</Button></div>
    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="surface-flat px-4 py-4"><p className="font-display text-3xl text-navy">{record.milestones.length}</p><p className="mt-1 text-xs text-muted">Personal goals</p></div><div className="surface-flat px-4 py-4"><p className="font-display text-3xl text-teal">{completed}</p><p className="mt-1 text-xs text-muted">Marked complete</p></div><div className="surface-flat col-span-2 px-4 py-4 sm:col-span-1"><p className="font-display text-3xl text-navy">{outcomes}</p><p className="mt-1 text-xs text-muted">Dated outcomes</p></div></div>
    <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#d5e2db] bg-[#edf4ef] px-4 py-3.5 text-sm leading-6 text-[#5c7168]"><Flag size={17} className="mt-1 shrink-0 text-teal" /><p><strong className="font-semibold text-navy">Two different ledgers:</strong> offer terms and recruiter replies describe commitments. These milestones describe your intentions and experience. Checking one never changes the other.</p></div>
    <section className="mt-8 space-y-4" aria-label="Personal learning milestones">{record.milestones.length ? record.milestones.map((milestone, index) => <article key={milestone.id} className="surface-flat overflow-hidden"><div className="flex flex-col gap-4 p-5 sm:p-6 md:flex-row md:items-start"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef1eb] font-mono text-sm text-muted">{String(index + 1).padStart(2, '0')}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-[#f0f1eb] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">{milestone.origin === 'suggested' ? 'Suggested personal goal' : 'Your personal goal'}</span>{milestone.outcome && <span className="inline-flex items-center gap-1 rounded-md bg-teal-soft px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-teal"><CheckCircle2 size={11} />Outcome recorded</span>}</div><h2 className="mt-3 break-words font-display text-[23px] text-navy">{milestone.title}</h2><p className="mt-2 break-words text-sm leading-6 text-[#5c6e79]">{milestone.activity}</p><div className="mt-4 grid gap-3 text-xs leading-5 text-muted sm:grid-cols-2"><p className="flex items-start gap-2"><CalendarDays size={14} className="mt-0.5 shrink-0" />Target {milestone.targetDate}</p><p className="flex items-start gap-2 break-words"><Trophy size={14} className="mt-0.5 shrink-0" />{milestone.expectedEvidence}</p></div>{milestone.outcome && <div className="mt-4 rounded-xl border border-[#d5e2db] bg-[#f3f7f1] px-4 py-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-wider text-teal">Actual outcome · {milestone.outcome.date}</p><span className="text-xs font-semibold text-navy">{outcomeLabels[milestone.outcome.promiseOutcome]}</span></div><p className="mt-2 break-words text-sm leading-6 text-[#536b63]">{milestone.outcome.workPerformed}</p>{milestone.outcome.feedback && <p className="mt-1 text-xs leading-5 text-muted">Feedback: {milestone.outcome.feedback}</p>}</div>}</div><div className="flex shrink-0 flex-wrap items-center gap-2 md:w-[165px] md:flex-col md:items-stretch"><label className="sr-only" htmlFor={`status-${milestone.id}`}>Status for {milestone.title}</label><select id={`status-${milestone.id}`} className="field !py-2 !text-xs" value={milestone.status} onChange={(event) => updateStatus(milestone.id, event.target.value as MilestoneStatus)}>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><Button size="sm" variant="secondary" onClick={() => setOutcomeFor(milestone)} icon={<ChevronRight size={13} />}>{milestone.outcome ? 'Edit outcome' : 'Record outcome'}</Button><div className="flex gap-1 md:justify-end"><button className="rounded-lg p-2 text-muted hover:bg-[#eef1eb] hover:text-navy" onClick={() => setEditing(milestone)} aria-label={`Edit ${milestone.title}`}><FilePenLine size={14} /></button><button className="rounded-lg p-2 text-muted hover:bg-danger-soft hover:text-danger" onClick={() => remove(milestone)} aria-label={`Delete ${milestone.title}`}><Trash2 size={14} /></button></div></div></div></article>) : <div className="surface-flat p-8 text-center"><CircleDashed className="mx-auto text-muted" size={24} /><h2 className="mt-3 font-display text-xl text-navy">No personal goals yet</h2><p className="mt-2 text-sm text-muted">Add one small goal and the evidence you want to collect.</p></div>}</section>
    <div className="mt-8 flex items-start gap-2 text-xs leading-5 text-muted"><CircleDashed size={14} className="mt-0.5 shrink-0" />Suggested goals are deterministic starting points based on your stated skills and offer text. Edit or delete anything that does not serve you.</div>
    {adding && <MilestoneEditor onSave={saveMilestone} onClose={() => setAdding(false)} />}
    {editing && <MilestoneEditor milestone={editing} onSave={saveMilestone} onClose={() => setEditing(null)} />}
    {outcomeFor && <OutcomeEditor milestone={outcomeFor} onSave={saveOutcome} onClose={() => setOutcomeFor(null)} />}
  </div>;
}
