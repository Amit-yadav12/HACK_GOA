import { ArrowDown, ArrowRight, Check, CircleAlert, History, Minus, Plus } from 'lucide-react';
import { EmptyState, StatusBadge } from '../../components/ui';
import { getPromiseDelta } from '../../lib/assessment';
import { formatDate } from '../../lib/format';
import { TERM_LABELS } from '../../lib/terms';
import type { OfferRecord, SnapshotTerm } from '../../types';

function snapshotValue(term: SnapshotTerm | undefined): string {
  if (!term || term.rejected || term.status === 'unknown' || !term.value) return 'Unknown';
  return term.value;
}

export function PromiseDelta({ record, standalone = false }: { record: OfferRecord; standalone?: boolean }) {
  const delta = getPromiseDelta(record);
  if (!delta) return <EmptyState icon={<History size={20} />} title="Your first snapshot is ready" description="Add a recruiter reply and link it to a term. RoleWorth will preserve the before and after assessments here." />;

  const count = (snapshot: typeof delta.before, key: 'aligned' | 'conflicts' | 'unknowns') => snapshot.assessment[key].length;
  const countChange = (key: 'aligned' | 'conflicts' | 'unknowns') => count(delta.after, key) - count(delta.before, key);
  const changeLabel = (key: 'aligned' | 'conflicts' | 'unknowns') => {
    const difference = countChange(key);
    if (!difference) return <span className="inline-flex items-center gap-1 text-xs text-muted"><Minus size={12} />No change</span>;
    const improves = key === 'aligned' ? difference > 0 : difference < 0;
    const tone = improves ? 'text-teal' : key === 'conflicts' && difference > 0 ? 'text-danger' : 'text-amber';
    return <span className={`inline-flex items-center gap-1 text-xs font-semibold ${tone}`}>{difference > 0 ? <Plus size={12} /> : <ArrowDown size={12} />}{Math.abs(difference)} {difference > 0 ? 'more' : 'fewer'}</span>;
  };

  return (
    <section id="promise-delta" className={`mt-8 ${standalone ? 'surface overflow-hidden' : ''}`} aria-labelledby="delta-heading">
      <div className={standalone ? 'border-b border-line px-5 py-5 sm:px-7' : 'mb-5'}>
        <div className="flex items-center gap-2"><History size={17} className="text-teal" /><p className="eyebrow !text-teal">Promise Delta</p></div>
        <h2 id="delta-heading" className="mt-2 font-display text-[27px] tracking-[-0.025em] text-navy">What changed—and what didn’t.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">The original assessment stays visible. This delta compares the two most recent snapshots so a new reply cannot quietly rewrite the past.</p>
      </div>
      <div className={standalone ? 'p-5 sm:p-7' : ''}>
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <SnapshotSummary label="Before" snapshot={delta.before} />
          <div className="hidden justify-center md:flex"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-teal"><ArrowRight size={17} /></span></div>
          <SnapshotSummary label="After" snapshot={delta.after} />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-line bg-[#faf9f5] p-4 text-center sm:gap-4">
          {(['aligned', 'conflicts', 'unknowns'] as const).map((key) => <div key={key} className="border-r border-line last:border-0"><p className="text-[11px] font-bold uppercase tracking-wider text-muted">{key === 'aligned' ? 'Supported' : key === 'conflicts' ? 'Conflicts' : 'To clarify'}</p><div className="mt-2 flex items-center justify-center gap-2 font-display text-2xl text-navy"><span>{count(delta.before, key)}</span><ArrowRight size={14} className="text-muted" /><span>{count(delta.after, key)}</span></div><div className="mt-1">{changeLabel(key)}</div></div>)}
        </div>

        <div className="mt-7"><h3 className="flex items-center gap-2 text-sm font-bold text-navy"><Check size={16} className="text-teal" />Evidence changes</h3>{delta.changes.length ? <div className="mt-3 space-y-3">{delta.changes.map((change) => <article key={change.key} className="rounded-xl border border-line bg-[#faf9f5] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold text-navy">{TERM_LABELS[change.key]}</h4><div className="flex items-center gap-2"><StatusBadge status={change.before.status} compact /><ArrowRight size={13} className="text-muted" /><StatusBadge status={change.after.status} compact /></div></div><div className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><div><p className="eyebrow !text-[10px]">Before</p><p className="mt-1 leading-6 text-muted">{snapshotValue(change.before)}</p></div><div><p className="eyebrow !text-[10px] !text-teal">After</p><p className="mt-1 leading-6 text-navy">{snapshotValue(change.after)}</p></div></div></article>)}</div> : <p className="mt-3 rounded-xl bg-[#faf9f5] px-4 py-3 text-sm text-muted">No term values changed between these snapshots. The assessment may have changed because your priorities changed.</p>}</div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#ead8b8] bg-amber-soft px-4 py-3"><CircleAlert size={17} className="mt-0.5 shrink-0 text-amber" /><p className="text-sm leading-6 text-[#805b27]">{delta.remainingUnknowns.length ? <><strong className="font-semibold">{delta.remainingUnknowns.length} terms remain unresolved:</strong> {delta.remainingUnknowns.map((key) => TERM_LABELS[key]).join(', ')}. Unknown is not proof of a problem.</> : 'No unknown terms remain in this snapshot. Continue to check actual experience against the recorded commitments.'}</p></div>

        <details className="mt-6 rounded-xl border border-line bg-paper px-4 py-3"><summary className="cursor-pointer text-sm font-semibold text-navy">View snapshot history <span className="ml-1 font-mono text-xs font-normal text-muted">{record.snapshots.length}</span></summary><ol className="mt-4 space-y-3 border-l border-line pl-4">{record.snapshots.slice().reverse().map((snapshot) => <li key={snapshot.id} className="relative text-sm"><span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-teal" /><p className="font-medium text-navy">{snapshot.reason}</p><p className="mt-0.5 text-xs text-muted">{formatDate(snapshot.createdAt, true)} · {snapshot.assessment.aligned.length} supported · {snapshot.assessment.unknowns.length} to clarify</p></li>)}</ol></details>
      </div>
    </section>
  );
}

function SnapshotSummary({ label, snapshot }: { label: string; snapshot: OfferRecord['snapshots'][number] }) {
  return <div className="rounded-xl border border-line bg-[#faf9f5] px-4 py-4"><div className="flex items-center justify-between gap-2"><p className="eyebrow">{label}</p><span className="text-[11px] text-muted">{formatDate(snapshot.createdAt)}</span></div><p className="mt-2 text-sm font-semibold text-navy">{snapshot.reason}</p><p className="mt-1 text-xs leading-5 text-muted">{snapshot.assessment.summary}</p></div>;
}
