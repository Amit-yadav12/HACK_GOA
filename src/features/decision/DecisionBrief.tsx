import { ArrowRight, Check, CircleAlert, Clock3, Edit3, FileQuestion, Flag, Lightbulb, MessageSquareText, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui';
import { formatDate } from '../../lib/format';
import type { AppView, AssessmentItem, OfferRecord } from '../../types';
import { EvidenceLedger } from '../evidence-ledger/EvidenceLedger';

interface DecisionBriefProps {
  record: OfferRecord;
  onChange: (record: OfferRecord) => void;
  onNavigate: (view: AppView) => void;
  onEditPriorities: () => void;
  onToast: (message: string) => void;
}

const postureCopy = {
  clarify: { title: 'Clarify before committing', icon: FileQuestion, className: 'bg-[#eef2ee] border-[#d6e0d6]' },
  resolve: { title: 'Resolve a priority conflict', icon: ShieldAlert, className: 'bg-[#fbf0e8] border-[#ead4bd]' },
  ready: { title: 'Evidence for your decision', icon: Check, className: 'bg-teal-soft border-[#c8dfd7]' },
  reflect: { title: 'Start with your priorities', icon: Lightbulb, className: 'bg-[#eef1f3] border-[#d9e0e4]' },
};

function AssessmentEntry({ entry }: { entry: AssessmentItem }) {
  const Icon = entry.kind === 'aligned' ? Check : entry.kind === 'conflict' ? ShieldAlert : CircleAlert;
  const style = entry.kind === 'aligned' ? 'bg-teal-soft text-teal' : entry.kind === 'conflict' ? 'bg-danger-soft text-danger' : 'bg-amber-soft text-amber';
  return <li className="flex gap-3 border-b border-line py-4 last:border-0 last:pb-0 first:pt-0"><span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style}`}><Icon size={15} /></span><div><p className="text-sm font-semibold leading-5 text-navy">{entry.title}</p><p className="mt-1 text-sm leading-6 text-muted">{entry.detail}</p></div></li>;
}

export function DecisionBrief({ record, onChange, onNavigate, onEditPriorities, onToast }: DecisionBriefProps) {
  const [note, setNote] = useState(record.decisionNote);
  useEffect(() => setNote(record.decisionNote), [record.id, record.decisionNote]);
  const posture = postureCopy[record.assessment.posture];
  const PostureIcon = posture.icon;
  const { aligned, conflicts, unknowns } = record.assessment;
  const saveNote = () => {
    if (note !== record.decisionNote) {
      onChange({ ...record, decisionNote: note, updatedAt: new Date().toISOString() });
      onToast('Personal decision note saved locally.');
    }
  };

  return (
    <div className="animate-enter mx-auto max-w-[1220px] px-5 pb-16 pt-8 sm:px-8 lg:px-12 lg:pt-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2"><span className="eyebrow">03 / Decide</span>{record.isDemo && <span className="rounded-md bg-[#eee8d9] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#765b24]">Synthetic demo</span>}<span className="text-xs text-muted">Updated {formatDate(record.updatedAt, true)}</span></div>
          <h1 className="display-title text-[38px] leading-tight sm:text-[44px]">A decision you can explain.</h1>
          <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-muted sm:text-[15px]">{record.name} <span className="mx-1.5 text-muted" aria-hidden="true">/</span> {record.terms.find((term) => term.key === 'role')?.value || 'Internship offer'}</p>
        </div>
        <Button variant="secondary" onClick={() => onNavigate('evidence')} icon={<FileQuestion size={16} />}>Inspect all evidence</Button>
      </div>

      <section className={`mt-8 rounded-2xl border px-5 py-5 sm:px-7 sm:py-6 ${posture.className}`} aria-labelledby="posture-heading">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/65 text-navy"><PostureIcon size={21} strokeWidth={1.7} /></span><div><p className="eyebrow !text-[#536b63]">Your current decision posture</p><h2 id="posture-heading" className="mt-1 font-display text-[27px] tracking-[-0.02em] text-navy">{posture.title}</h2><p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#5e6f73]">{record.assessment.summary}</p></div></div>
          <Button variant="primary" className="shrink-0" onClick={() => onNavigate(unknowns.length ? 'clarify' : 'verify')} icon={<ArrowRight size={16} />}>{unknowns.length ? 'Ask the right questions' : 'Record what happened'}</Button>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(290px,.65fr)]">
        <div className="surface px-5 py-6 sm:px-7">
          <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Transparent readout</p><h2 className="mt-2 font-display text-[25px] tracking-[-0.025em] text-navy">What the evidence says to you</h2></div><span className="rounded-lg bg-[#f2f3ed] px-2.5 py-1.5 text-[10px] font-semibold text-muted">Rules, not a rating</span></div>
          <div className="mt-6 grid grid-cols-3 divide-x divide-line rounded-xl border border-line bg-[#faf9f5] py-4 text-center"><div><p className="font-display text-3xl text-teal">{aligned.length}</p><p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Supported</p></div><div><p className={`font-display text-3xl ${conflicts.length ? 'text-danger' : 'text-navy'}`}>{conflicts.length}</p><p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Conflicts</p></div><div><p className={`font-display text-3xl ${unknowns.length ? 'text-amber' : 'text-navy'}`}>{unknowns.length}</p><p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted">To clarify</p></div></div>
          <div className="mt-6 space-y-6">
            {aligned.length > 0 && <div><h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-teal"><Check size={14} />Supporting your priorities</h3><ul>{aligned.map((entry) => <AssessmentEntry key={entry.id} entry={entry} />)}</ul></div>}
            {conflicts.length > 0 && <div><h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-danger"><ShieldAlert size={14} />Trade-offs to resolve</h3><ul>{conflicts.map((entry) => <AssessmentEntry key={entry.id} entry={entry} />)}</ul></div>}
            {unknowns.length > 0 && <div><h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-amber"><CircleAlert size={14} />Still unknown</h3><ul>{unknowns.map((entry) => <AssessmentEntry key={entry.id} entry={entry} />)}</ul></div>}
            {!aligned.length && !conflicts.length && !unknowns.length && <div className="py-8 text-center text-sm text-muted">Add your priorities to create a personal readout.</div>}
          </div>
          <p className="mt-6 border-t border-line pt-4 text-xs leading-5 text-muted">This is a structured reflection based on the terms and preferences above. It is not an empirical prediction, employer verification or recommendation to accept or reject.</p>
        </div>

        <aside className="space-y-6">
          <section className="surface-flat px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Your lens</p><h2 className="mt-2 font-display text-[23px] text-navy">Personal priorities</h2></div><button onClick={onEditPriorities} className="rounded-lg p-2 text-muted hover:bg-[#eef1eb] hover:text-navy" aria-label="Edit personal priorities"><Edit3 size={16} /></button></div>
            <dl className="mt-5 space-y-4 text-sm">
              <div><dt className="text-xs text-muted">Target direction</dt><dd className="mt-1 font-medium text-navy">{record.priorities.targetRole || 'Not set'}</dd></div>
              <div><dt className="text-xs text-muted">Skills to practise</dt><dd className="mt-1 break-words leading-5 text-navy">{record.priorities.skills || 'Not set'}</dd></div>
              {record.priorities.preferredWork && <div><dt className="text-xs text-muted">Preferred work</dt><dd className="mt-1 break-words leading-5 text-navy">{record.priorities.preferredWork}</dd></div>}
              <div className="grid grid-cols-2 gap-3"><div><dt className="text-xs text-muted">Time available</dt><dd className="mt-1 font-medium text-navy">{record.priorities.availableHours === null ? 'Not set' : `${record.priorities.availableHours} hrs / week`}</dd></div><div><dt className="text-xs text-muted">Monthly minimum</dt><dd className="mt-1 font-medium text-navy">{record.priorities.minimumStipend === null ? 'Not set' : `${record.priorities.currency} ${record.priorities.minimumStipend.toLocaleString('en-IN')}`}</dd></div></div>
              <div><dt className="text-xs text-muted">Mentorship</dt><dd className="mt-1 capitalize text-navy">{record.priorities.mentorship}</dd></div>
              {record.priorities.nonNegotiables && <div><dt className="text-xs text-muted">Non-negotiables</dt><dd className="mt-1 leading-5 text-navy">{record.priorities.nonNegotiables}</dd></div>}
            </dl>
            <Button variant="secondary" size="sm" className="mt-5 w-full" onClick={onEditPriorities} icon={<Edit3 size={13} />}>Edit priorities</Button>
          </section>
          <section className="rounded-2xl border border-[#d9e4de] bg-[#edf4ef] px-5 py-5 sm:px-6">
            <div className="flex items-center gap-2 text-teal"><MessageSquareText size={17} /><p className="eyebrow !text-teal">Next best action</p></div>
            <h2 className="mt-3 font-display text-[22px] leading-7 text-navy">{unknowns.length ? `${unknowns.length} ${unknowns.length === 1 ? 'question' : 'questions'} worth asking.` : 'Keep the promise visible.'}</h2>
            <p className="mt-2 text-sm leading-6 text-[#536b63]">{unknowns.length ? 'Turn the most consequential gaps into one concise recruiter message. You choose what to send.' : 'When you join, record what actually happens without confusing it with what was promised.'}</p>
            <Button variant="teal" size="sm" className="mt-4" onClick={() => onNavigate(unknowns.length ? 'clarify' : 'learn')} icon={<ArrowRight size={14} />}>{unknowns.length ? 'Draft a clarification' : 'Open learning plan'}</Button>
          </section>
        </aside>
      </section>

      <section className="mt-8"><EvidenceLedger record={record} onChange={onChange} onToast={onToast} compact onViewAll={() => onNavigate('evidence')} /></section>

      <section className="surface-flat mt-8 px-5 py-5 sm:px-7"><div className="flex items-center gap-2"><Flag size={16} className="text-teal" /><h2 className="font-display text-[22px] text-navy">Your decision note</h2><span className="text-xs text-muted">Private to this ledger</span></div><label htmlFor="decision-note" className="sr-only">Personal decision note</label><textarea id="decision-note" className="field mt-4 min-h-[90px] resize-y" maxLength={10000} value={note} onChange={(event) => setNote(event.target.value)} onBlur={saveNote} placeholder="What are you leaning towards, and what would change your mind?" /><div className="mt-2 flex items-center justify-between gap-3"><p className="text-xs text-muted">Your note is separate from employer evidence.</p><Button size="sm" variant="ghost" onClick={saveNote}>Save note</Button></div></section>
      <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-muted"><Clock3 size={13} />Snapshots preserve earlier assessments. New evidence never silently rewrites history.</div>
    </div>
  );
}
