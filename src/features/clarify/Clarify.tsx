import { ArrowRight, Check, Copy, FileQuestion, Link2, MessageSquareReply, Plus, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button, EmptyState, StatusBadge } from '../../components/ui';
import { applyRecruiterResponse, buildClarificationQuestions, buildRecruiterMessage } from '../../lib/assessment';
import { copyText } from '../../lib/download';
import { todayInputValue } from '../../lib/format';
import { TERM_LABELS } from '../../lib/terms';
import type { OfferRecord, TermKey } from '../../types';
import { PromiseDelta } from '../promise-delta/PromiseDelta';

interface ClarifyProps {
  record: OfferRecord;
  onChange: (record: OfferRecord) => void;
  onToast: (message: string) => void;
}

export function Clarify({ record, onChange, onToast }: ClarifyProps) {
  const questions = useMemo(() => buildClarificationQuestions(record.terms, record.priorities), [record.terms, record.priorities]);
  const [message, setMessage] = useState(() => buildRecruiterMessage(record));
  const [copied, setCopied] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyDate, setReplyDate] = useState(todayInputValue());
  const [replySource, setReplySource] = useState('Email');
  const [selected, setSelected] = useState<TermKey[]>([]);
  const [updates, setUpdates] = useState<Partial<Record<TermKey, string>>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    setMessage(buildRecruiterMessage(record));
  }, [record]);

  const copyMessage = async () => {
    try {
      await copyText(message);
      setCopied(true);
      onToast('Recruiter message copied to your clipboard.');
      window.setTimeout(() => setCopied(false), 2200);
    } catch (caught) {
      onToast(caught instanceof Error ? caught.message : 'Copy failed. Select the message text manually.');
    }
  };

  const toggleTerm = (key: TermKey) => {
    setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
    setError('');
  };

  const applyReply = () => {
    try {
      const selectedUpdates = Object.fromEntries(selected.filter((key) => updates[key]?.trim()).map((key) => [key, updates[key]])) as Partial<Record<TermKey, string>>;
      if (selected.some((key) => !updates[key]?.trim())) {
        setError('For every linked term, record the specific value the reply establishes.');
        return;
      }
      const updated = applyRecruiterResponse(record, { replyDate, source: replySource, text: replyText, updates: selectedUpdates });
      onChange(updated);
      setReplyText(''); setSelected([]); setUpdates({}); setError('');
      onToast('Reply added. Promise Delta snapshots are ready to inspect.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The reply could not be applied.');
    }
  };

  const insertSyntheticReply = () => {
    setReplyText('Thanks for asking. I would be your mentor and we would have a 30-minute feedback session every Friday. There are no fees or deposits.');
    setReplySource('Synthetic demo reply');
    setSelected(['mentorship']);
    setUpdates({ mentorship: 'Weekly 30-minute feedback session with the recruiter on Fridays' });
    setError('');
  };

  return (
    <div className="animate-enter mx-auto max-w-[1220px] px-5 pb-16 pt-8 sm:px-8 lg:px-12 lg:pt-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">02 / Clarify</p><h1 className="display-title mt-3 text-[38px] leading-tight sm:text-[44px]">Ask before you assume.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-[15px]">Turn unresolved terms into a concise message. A reply becomes evidence only when you link it to a specific term.</p></div><div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3.5 py-3 text-xs text-muted"><ShieldCheck size={16} className="text-teal" />Nothing is sent automatically</div></div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
        <section className="surface overflow-hidden"><div className="border-b border-line px-5 py-5 sm:px-7"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-soft text-amber"><FileQuestion size={18} /></span><div><h2 className="font-display text-[24px] text-navy">Questions worth asking</h2><p className="mt-1 text-xs text-muted">Prioritised from your current evidence gaps</p></div></div></div>
          {questions.length ? <div className="divide-y divide-line px-5 sm:px-7">{questions.map((question, index) => <article key={question.id} className="flex gap-4 py-5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1f2ec] font-mono text-[11px] text-muted">{String(index + 1).padStart(2, '0')}</span><div><div className="mb-2 flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-wider text-amber">{TERM_LABELS[question.termKey]}</span><StatusBadge status="unknown" compact /></div><p className="text-[15px] font-medium leading-6 text-navy">{question.question}</p><p className="mt-1.5 text-xs leading-5 text-muted">{question.rationale}</p></div></article>)}</div> : <div className="p-5 sm:p-7"><EmptyState icon={<Check size={20} />} title="No generated gaps remain" description="Your current ledger has no unknown terms in the question set. You can still edit the message or add a reply if new information arrives." /></div>}
          <div className="border-t border-line bg-[#faf9f5] px-5 py-4 text-xs leading-5 text-muted sm:px-7">Questions are generated from your ledger, not from outside employer data.</div>
        </section>

        <section className="surface-flat h-fit px-5 py-5 sm:px-6"><div className="flex items-center gap-2"><Link2 size={17} className="text-teal" /><p className="eyebrow !text-teal">The evidence rule</p></div><h2 className="mt-3 font-display text-[24px] leading-7 text-navy">A reply is new evidence.<br />Not a rewrite.</h2><ol className="mt-5 space-y-4">{['Record the exact reply and its context.', 'Choose the terms it actually answers.', 'Review the before / after Promise Delta.'].map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6 text-[#5f7079]"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy font-mono text-[10px] text-white">{index + 1}</span>{step}</li>)}</ol><div className="mt-5 border-t border-line pt-4 text-xs leading-5 text-muted">Recruiter replies are marked <strong className="font-semibold text-navy">Provided by you</strong>. They are never automatically labelled independently verified.</div></section>
      </div>

      <section className="surface mt-6 overflow-hidden"><div className="flex flex-col justify-between gap-3 border-b border-line px-5 py-5 sm:flex-row sm:items-center sm:px-7"><div><p className="eyebrow">Editable draft</p><h2 className="mt-2 font-display text-[24px] text-navy">A note you can send yourself</h2></div><Button size="sm" variant="secondary" onClick={() => void copyMessage()} icon={copied ? <Check size={14} /> : <Copy size={14} />}>{copied ? 'Copied' : 'Copy message'}</Button></div><div className="p-5 sm:p-7"><label htmlFor="recruiter-message" className="sr-only">Recruiter message draft</label><textarea id="recruiter-message" className="field min-h-[265px] resize-y !bg-[#fffefa] !px-5 !py-4 !font-display !text-[16px] !leading-7" value={message} onChange={(event) => setMessage(event.target.value)} /><div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted"><span>Review names, tone and questions before sending.</span><span className="font-mono">{message.length} characters</span></div></div></section>

      <section className="surface mt-6 overflow-hidden" aria-labelledby="reply-heading"><div className="border-b border-line px-5 py-5 sm:px-7"><div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-soft text-teal"><MessageSquareReply size={18} /></span><div><h2 id="reply-heading" className="font-display text-[24px] text-navy">Add a recruiter reply</h2><p className="mt-1 text-sm text-muted">Keep the original offer intact. Add only what this reply establishes.</p></div></div></div><div className="p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="reply-date" className="field-label">Reply date</label><input id="reply-date" type="date" className="field" value={replyDate} onChange={(event) => setReplyDate(event.target.value)} /></div><div><label htmlFor="reply-source" className="field-label">Source / context</label><input id="reply-source" className="field" maxLength={500} value={replySource} onChange={(event) => setReplySource(event.target.value)} placeholder="Email, call notes, message…" /></div></div>
        <div className="mt-5"><label htmlFor="reply-text" className="field-label">Exact reply or your faithful call notes <span className="text-danger">*</span></label><textarea id="reply-text" className="field min-h-[125px] resize-y" maxLength={30000} value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Paste the recruiter’s response here. Do not paraphrase it into a stronger promise than they made." /><p className="field-hint">If these are call notes, say so in Source / context. You are responsible for the accuracy of the record.</p></div>
        <div className="mt-6"><p className="field-label">Which terms does this reply answer? <span className="text-danger">*</span></p><div className="flex flex-wrap gap-2">{record.terms.filter((term) => !term.rejected).map((term) => <button key={term.key} onClick={() => toggleTerm(term.key)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${selected.includes(term.key) ? 'border-teal bg-teal-soft text-teal' : 'border-line bg-[#faf9f5] text-muted hover:border-[#b9c8c0] hover:text-navy'}`} aria-pressed={selected.includes(term.key)}>{selected.includes(term.key) && <Check size={12} className="mr-1 inline" />}{term.label}</button>)}</div></div>
        {selected.length > 0 && <div className="mt-5 space-y-4 rounded-xl border border-[#dbe5dd] bg-[#f5f8f3] p-4"><p className="text-xs font-semibold uppercase tracking-wider text-teal">Record the new value for each linked term</p>{selected.map((key) => <div key={key}><label htmlFor={`update-${key}`} className="mb-1.5 block text-sm font-medium text-navy">{TERM_LABELS[key]} <span className="text-danger">*</span></label><input id={`update-${key}`} className="field !bg-white" maxLength={20000} value={updates[key] ?? ''} onChange={(event) => setUpdates((current) => ({ ...current, [key]: event.target.value }))} placeholder={`What does the reply establish about ${TERM_LABELS[key].toLowerCase()}?`} /></div>)}</div>}
        {record.isDemo && <button onClick={insertSyntheticReply} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#765b24] underline decoration-[#d9c9a8] underline-offset-4 hover:text-navy"><Plus size={13} />Insert a clearly labelled synthetic reply for the demo</button>}
        {error && <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}
        <div className="mt-6 flex flex-col justify-between gap-3 border-t border-line pt-5 sm:flex-row sm:items-center"><p className="text-xs leading-5 text-muted">This creates before + after snapshots.<br />It does not contact the recruiter.</p><Button variant="primary" onClick={applyReply} icon={<ArrowRight size={16} />}>Apply reply & view delta</Button></div>
      </div></section>

      {record.responses.length > 0 && <section className="mt-8"><div className="mb-4 flex items-end justify-between"><div><p className="eyebrow">Evidence history</p><h2 className="mt-2 font-display text-[25px] text-navy">Recorded replies</h2></div><span className="font-mono text-xs text-muted">{record.responses.length} total</span></div><div className="space-y-4">{record.responses.slice().reverse().map((response) => <article key={response.id} className="surface-flat px-5 py-5 sm:px-6"><div className="flex flex-wrap items-center gap-2 text-xs text-muted"><span className="font-semibold text-navy">{response.source}</span><span>·</span><span>{response.replyDate}</span><span className="rounded-full bg-[#edf1f3] px-2 py-1 text-[10px] font-semibold text-[#425e70]">Provided by you</span></div><blockquote className="quote mt-4">“{response.text}”</blockquote><div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted"><Link2 size={13} />Linked to {response.linkedTermKeys.map((key) => TERM_LABELS[key]).join(', ')}</div></article>)}</div></section>}
      {record.snapshots.length > 1 && <PromiseDelta record={record} />}
    </div>
  );
}
