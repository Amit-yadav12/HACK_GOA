import { Check, ChevronDown, FileText, Pencil, RotateCcw, Search, ShieldCheck, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button, Modal, StatusBadge } from '../../components/ui';
import { reviewTerm, setTermRejected } from '../../lib/offer';
import { EVIDENCE_STATUS_LABELS } from '../../lib/terms';
import type { EvidenceStatus, ExtractedTerm, OfferRecord } from '../../types';

interface EvidenceLedgerProps {
  record: OfferRecord;
  onChange: (record: OfferRecord) => void;
  onToast: (message: string) => void;
  compact?: boolean;
  onViewAll?: () => void;
}

function TermReviewModal({ term, record, onChange, onClose }: { term: ExtractedTerm; record: OfferRecord; onChange: (record: OfferRecord) => void; onClose: () => void }) {
  const [value, setValue] = useState(term.value);
  const [status, setStatus] = useState<EvidenceStatus>(term.status === 'unknown' ? 'user' : term.status);
  const [verificationSource, setVerificationSource] = useState(term.verificationSource ?? '');
  const [error, setError] = useState('');

  const save = () => {
    try {
      onChange(reviewTerm(record, term.id, { value, status, verificationSource }));
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'This term could not be saved.');
    }
  };

  return (
    <Modal title={`Review ${term.label.toLowerCase()}`} description="Keep the source and your interpretation distinct. Editing a value never edits the original offer text." onClose={onClose} width="lg">
      {term.excerpt && <div className="mb-5"><p className="eyebrow mb-2">Current source excerpt</p><blockquote className="quote">“{term.excerpt.text}”</blockquote></div>}
      <div>
        <label htmlFor="term-value" className="field-label">Value in your ledger</label>
        <textarea id="term-value" className="field min-h-[100px] resize-y" maxLength={20000} value={value} onChange={(event) => setValue(event.target.value)} placeholder="Leave blank if this is not established" />
        <p className="field-hint">Blank values are treated as unknown. Missing information is not a negative finding.</p>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="term-status" className="field-label">Evidence status</label>
          <select id="term-status" className="field" value={status} onChange={(event) => setStatus(event.target.value as EvidenceStatus)}>
            {Object.entries(EVIDENCE_STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>
        <div className="flex items-end pb-3 text-xs leading-5 text-muted">
          {status === 'explicit' && 'Use only when the current value is directly supported by offer text.'}
          {status === 'user' && 'Use for your correction or information you supplied.'}
          {status === 'inferred' && 'Use for an interpretation that still needs confirmation.'}
          {status === 'unknown' && 'The current evidence does not establish this term.'}
          {status === 'verified' && 'You must cite a source you independently inspected.'}
        </div>
      </div>
      {status === 'verified' && (
        <div className="mt-5">
          <label htmlFor="verification-source" className="field-label">Independent source you inspected <span className="text-danger">*</span></label>
          <textarea id="verification-source" className="field min-h-[80px]" maxLength={4000} value={verificationSource} onChange={(event) => setVerificationSource(event.target.value)} placeholder="Name the document, registry entry or source and how you inspected it" />
          <p className="field-hint flex items-start gap-1.5"><ShieldCheck size={13} className="mt-0.5 shrink-0" />RoleWorth does not check this source or certify the employer. This label records your inspection only.</p>
        </div>
      )}
      {error && <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <div className="mt-6 flex justify-end gap-3 border-t border-line pt-5"><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} icon={<Check size={16} />}>Save reviewed term</Button></div>
    </Modal>
  );
}

export function EvidenceLedger({ record, onChange, onToast, compact = false, onViewAll }: EvidenceLedgerProps) {
  const [filter, setFilter] = useState<'all' | 'review' | 'explicit' | 'user'>('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<ExtractedTerm | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = useMemo(() => record.terms.filter((term) => {
    const matchesFilter = filter === 'all'
      || (filter === 'review' && (term.status === 'unknown' || term.status === 'inferred' || term.rejected))
      || (filter === 'explicit' && term.status === 'explicit' && !term.rejected)
      || (filter === 'user' && (term.status === 'user' || term.status === 'verified') && !term.rejected);
    const matchesQuery = !query.trim() || `${term.label} ${term.value}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  }), [record.terms, filter, query]);

  const displayed = compact ? visible.slice(0, 6) : visible;
  const unknownCount = record.terms.filter((term) => term.status === 'unknown' || term.rejected).length;

  return (
    <section className={compact ? '' : 'surface overflow-hidden'} aria-labelledby="ledger-heading">
      {!compact && (
        <div className="border-b border-line px-5 py-5 sm:px-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-3"><h2 id="ledger-heading" className="font-display text-[25px] tracking-[-0.025em] text-navy">Evidence ledger</h2><span className="rounded-md bg-[#f0f1eb] px-2 py-1 font-mono text-[10px] text-muted">{record.terms.length} terms</span></div>
              <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted">A fact is only as useful as its source. Inspect, correct or reject any extraction.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted"><FileText size={15} className="text-teal" />Original text remains unchanged</div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter evidence">
              {([['all', 'All terms'], ['review', `Needs review · ${unknownCount}`], ['explicit', 'Offer-backed'], ['user', 'Added by you']] as const).map(([key, label]) => <button key={key} onClick={() => setFilter(key)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${filter === key ? 'bg-navy text-white' : 'bg-[#f1f2ec] text-muted hover:text-navy'}`}>{label}</button>)}
            </div>
            <label className="relative block sm:w-[210px]"><span className="sr-only">Search terms</span><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input className="field !py-2 !pl-9 !text-xs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ledger" /></label>
          </div>
        </div>
      )}
      {compact && <div className="mb-4 flex items-end justify-between gap-4"><div><div className="flex items-center gap-3"><h2 id="ledger-heading" className="font-display text-[24px] tracking-[-0.02em] text-navy">Evidence at a glance</h2><span className="font-mono text-[10px] text-muted">{record.terms.length} terms</span></div><p className="mt-1 text-sm text-muted">The source is always part of the story.</p></div>{onViewAll && <Button size="sm" variant="ghost" onClick={onViewAll}>Open full ledger <span aria-hidden="true">→</span></Button>}</div>}
      <div className={compact ? 'overflow-hidden rounded-2xl border border-line bg-paper' : ''}>
        {displayed.length === 0 ? <div className="px-6 py-12 text-center text-sm text-muted">No terms match this filter. Try another view.</div> : displayed.map((term) => {
          const isExpanded = expanded === term.id;
          return (
            <article key={term.id} className={`ledger-row border-b border-line ${compact ? 'px-4 py-4 sm:px-5' : 'px-5 py-5 sm:px-7'}`}>
              <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)_auto] md:items-start md:gap-5">
                <div>
                  <h3 className="text-sm font-semibold text-navy">{term.label}</h3>
                  {!compact && <p className="mt-1 text-xs leading-5 text-muted">{term.key === 'company' ? 'Who is making the offer' : term.key === 'role' ? 'The named position' : 'Review the source and status'}</p>}
                </div>
                <div className="min-w-0">
                  {term.rejected ? <p className="text-sm italic text-muted">Excluded from this assessment by you.</p> : term.value && term.status !== 'unknown' ? <p className="break-words text-[15px] leading-6 text-[#344c5b]">{term.value}</p> : <p className="text-sm italic leading-6 text-amber">Not established in the current evidence.</p>}
                  {term.note && <p className="mt-1.5 break-words text-xs leading-5 text-muted">{term.note}</p>}
                  {term.excerpt && <div className="mt-3">
                    <button onClick={() => setExpanded(isExpanded ? null : term.id)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal hover:text-navy" aria-expanded={isExpanded}><FileText size={13} />{isExpanded ? 'Hide source excerpt' : 'Inspect source excerpt'}<ChevronDown size={13} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></button>
                    {isExpanded && <blockquote className="quote mt-3">“{term.excerpt.text}”<footer className="mt-2 font-sans text-[10px] not-italic tracking-wide text-muted">{term.source === 'recruiter' ? 'Recruiter reply · linked by you' : term.source === 'independent' ? 'Independent source · supplied by you' : 'Offer text · extracted locally'}{term.excerpt.page ? ` · page ${term.excerpt.page}` : ''}</footer></blockquote>}
                  </div>}
                  {term.verificationSource && <p className="mt-2 text-xs leading-5 text-[#426860]"><span className="font-semibold">Source you supplied:</span> {term.verificationSource}</p>}
                </div>
                <div className="flex items-center gap-2 md:flex-col md:items-end">
                  <StatusBadge status={term.status} rejected={term.rejected} />
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditing(term)} className="rounded-lg p-2 text-muted transition-colors hover:bg-[#eef1eb] hover:text-navy" aria-label={`Review ${term.label}`} title="Review term"><Pencil size={14} /></button>
                    <button onClick={() => { onChange(setTermRejected(record, term.id, !term.rejected)); onToast(term.rejected ? `${term.label} restored for review.` : `${term.label} excluded from the assessment.`); }} className="rounded-lg p-2 text-muted transition-colors hover:bg-[#eef1eb] hover:text-navy" aria-label={term.rejected ? `Restore ${term.label}` : `Reject ${term.label}`} title={term.rejected ? 'Restore term' : 'Reject term'}>{term.rejected ? <RotateCcw size={14} /> : <X size={15} />}</button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!compact && <div className="flex flex-col gap-2 border-t border-line bg-[#faf9f5] px-5 py-4 text-xs leading-5 text-muted sm:flex-row sm:items-center sm:justify-between sm:px-7"><span><span className="font-semibold text-navy">Unknown is a useful answer.</span> It tells you what to ask next.</span><span>Excerpts are from your local source or linked reply.</span></div>}
      {editing && <TermReviewModal term={editing} record={record} onChange={(updated) => { onChange(updated); onToast('Term reviewed. Your decision brief was recalculated.'); }} onClose={() => setEditing(null)} />}
    </section>
  );
}
