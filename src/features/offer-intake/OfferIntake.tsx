import {
  ArrowRight,
  CheckCircle2,
  FileLock2,
  FileText,
  FlaskConical,
  Loader2,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import type { IntakeMetadata } from '../../types';
import { Button, CheckItem } from '../../components/ui';

interface OfferIntakeProps {
  onAnalyze: (text: string, metadata: IntakeMetadata) => void;
  onDemo: () => void;
}

export function OfferIntake({ onAnalyze, onDemo }: OfferIntakeProps) {
  const [mode, setMode] = useState<'paste' | 'pdf'>('paste');
  const [text, setText] = useState('');
  const [sourceKind, setSourceKind] = useState<'paste' | 'pdf'>('paste');
  const [fileName, setFileName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);

  useEffect(() => () => {
    // Ignore a worker result if the intake is unmounted or replaced.
    requestRef.current += 1;
  }, []);

  const processFile = async (file?: File) => {
    if (!file || processing) return;
    const request = ++requestRef.current;
    setProcessing(true);
    setError('');
    setNotice('');
    setFileName(file.name);
    try {
      // Keep PDF.js out of the initial paste-only bundle.
      const { extractPdfText } = await import('../../lib/pdf');
      const result = await extractPdfText(file);
      if (request !== requestRef.current) return;
      setText(result.text);
      setSourceKind('pdf');
      setNotice(`Extracted ${result.pageCount} ${result.pageCount === 1 ? 'page' : 'pages'} locally. Review the text below before creating your ledger.`);
    } catch (caught) {
      if (request !== requestRef.current) return;
      setText('');
      setError(caught instanceof Error ? caught.message : 'The PDF could not be read. Paste the offer text instead.');
    } finally {
      if (request === requestRef.current) {
        setProcessing(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    }
  };

  const handleModeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (processing || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'paste' : event.key === 'End' ? 'pdf' : mode === 'paste' ? 'pdf' : 'paste';
    setMode(next);
    document.getElementById(`offer-mode-${next}`)?.focus();
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void processFile(event.dataTransfer.files[0]);
  };

  const clear = () => {
    requestRef.current += 1;
    setProcessing(false);
    setText('');
    setError('');
    setNotice('');
    setFileName('');
    setSourceKind('paste');
    if (inputRef.current) inputRef.current.value = '';
  };

  const submit = () => {
    setError('');
    try {
      onAnalyze(text, { sourceKind, fileName: fileName || undefined });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The offer could not be analysed.');
    }
  };

  return (
    <div className="animate-enter mx-auto max-w-[1220px] px-5 pb-16 pt-10 sm:px-8 lg:px-12 lg:pt-14">
      <section className="grid items-end gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="eyebrow !text-teal">The internship promise-to-proof ledger</span>
            <span className="hidden h-px w-12 bg-[#a8c7bd] sm:block" />
          </div>
          <h1 className="display-title max-w-[780px] text-[42px] leading-[1.04] sm:text-[54px] lg:text-[62px]">
            Don’t just read the offer.<br />
            <span className="italic text-[#31576a]">Read between the lines.</span>
          </h1>
          <p className="mt-6 max-w-[650px] text-[16px] leading-7 text-[#60717c] sm:text-[17px]">
            Turn internship language into a clear, evidence-backed decision. See what’s promised, what’s missing, and what fits <em className="font-display text-navy">your</em> priorities.
          </p>
        </div>
        <div className="flex items-center gap-3 lg:justify-end">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#cadbd3] bg-[#eef4ef] text-teal">
            <FileLock2 size={20} strokeWidth={1.7} />
          </div>
          <div>
            <p className="text-sm font-semibold text-navy">Private by design</p>
            <p className="mt-0.5 text-xs text-muted">No account. No upload. No API key.</p>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,.75fr)]">
        <section className="surface overflow-hidden" aria-labelledby="intake-title">
          <div className="flex items-center justify-between border-b border-line px-5 pt-5 sm:px-7">
            <div className="flex gap-1" role="tablist" aria-label="Offer input method" onKeyDown={handleModeKeyDown}>
              <button
                role="tab"
                id="offer-mode-paste"
                aria-controls="offer-input-panel"
                aria-selected={mode === 'paste'}
                tabIndex={mode === 'paste' ? 0 : -1}
                disabled={processing}
                onClick={() => setMode('paste')}
                className={`relative px-4 pb-4 pt-1 text-sm font-semibold transition-colors ${mode === 'paste' ? 'text-navy after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-teal' : 'text-muted hover:text-navy'}`}
              >
                Paste offer text
              </button>
              <button
                role="tab"
                id="offer-mode-pdf"
                aria-controls="offer-input-panel"
                aria-selected={mode === 'pdf'}
                tabIndex={mode === 'pdf' ? 0 : -1}
                disabled={processing}
                onClick={() => setMode('pdf')}
                className={`relative px-4 pb-4 pt-1 text-sm font-semibold transition-colors ${mode === 'pdf' ? 'text-navy after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-teal' : 'text-muted hover:text-navy'}`}
              >
                Read a PDF
              </button>
            </div>
            {text && <button onClick={clear} className="mb-3 flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-ivory hover:text-navy"><RotateCcw size={13} />Clear</button>}
          </div>

          <div id="offer-input-panel" role="tabpanel" aria-labelledby={`offer-mode-${mode}`} className="p-5 sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="intake-title" className="font-display text-[23px] tracking-[-0.02em] text-navy">Start with the actual wording</h2>
                <p className="mt-1.5 text-sm leading-6 text-muted">Paste the complete offer, including stipend, time and exit terms.</p>
              </div>
              <span className="hidden rounded-lg bg-[#f0f1eb] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted sm:block">Step 01</span>
            </div>

            {mode === 'pdf' && (
              <div
                onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                aria-busy={processing}
                className={`mb-5 rounded-xl border border-dashed px-5 py-6 text-center transition-colors ${dragging ? 'border-teal bg-teal-soft' : 'border-[#c9d0c9] bg-[#faf9f5]'}`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={processing}
                  className="sr-only"
                  id="offer-pdf"
                  onChange={(event) => void processFile(event.target.files?.[0])}
                />
                <label htmlFor="offer-pdf" className="flex cursor-pointer flex-col items-center">
                  {processing ? <Loader2 className="animate-spin text-teal" size={24} /> : <Upload className="text-[#698078]" size={24} strokeWidth={1.6} />}
                  <span className="mt-3 text-sm font-semibold text-navy">{processing ? `Reading ${fileName}…` : 'Drop a PDF here, or choose a file'}</span>
                  <span className="mt-1.5 text-xs leading-5 text-muted">Text-based PDF · up to 8 MB · up to 40 pages<br />Processed in this browser. The file is never saved.</span>
                </label>
              </div>
            )}

            <div className="relative">
              <label htmlFor="offer-text" className="sr-only">Offer text</label>
              <textarea
                id="offer-text"
                value={text}
                onChange={(event) => { setText(event.target.value); setError(''); setNotice(''); }}
                placeholder={'Paste the internship offer here…\n\nFor example: role, duration, stipend, working hours, responsibilities, mentorship and termination terms.'}
                maxLength={120_000}
                rows={mode === 'pdf' ? 9 : 11}
                disabled={processing}
                className="field scrollbar-thin min-h-[250px] resize-y !bg-[#fffefa] !px-5 !py-4 !font-display !text-[16px] !leading-7"
              />
              <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-white/90 px-2 py-1 font-mono text-[10px] text-muted">
                {text.length.toLocaleString()} / 120,000
              </div>
            </div>

            {error && <div role="alert" className="mt-4 rounded-xl border border-[#e8cbc5] bg-danger-soft px-4 py-3 text-sm leading-6 text-[#93443f]">{error}</div>}
            {notice && <div role="status" className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#cee1d9] bg-teal-soft px-4 py-3 text-sm leading-6 text-[#226a65]"><CheckCircle2 size={17} className="mt-0.5 shrink-0" />{notice}</div>}

            <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs leading-5 text-muted"><LockKeyhole size={14} className="shrink-0 text-teal" />Analysis happens on your device.</p>
              <Button
                variant="primary"
                size="lg"
                onClick={submit}
                disabled={processing || text.trim().length < 40}
                title={text.trim().length < 40 ? 'Add at least 40 characters of offer text' : undefined}
                icon={<ArrowRight size={17} />}
                className="w-full sm:w-auto"
              >
                Build my evidence ledger
              </Button>
            </div>
            {text.trim().length > 0 && text.trim().length < 40 && <p className="mt-2 text-right text-xs text-amber">Add {40 - text.trim().length} more characters to continue.</p>}
          </div>
        </section>

        <aside className="flex flex-col gap-5">
          <section className="rounded-2xl bg-navy px-6 py-6 text-white shadow-paper">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9fb5c1]">One offer. A clearer decision.</p>
            <h2 className="mt-3 font-display text-[25px] leading-8 tracking-[-0.02em]">From wording to what-next.</h2>
            <ul className="mt-6 space-y-5">
              <CheckItem><span className="text-[#dbe5e8]">Terms linked to their exact source</span></CheckItem>
              <CheckItem><span className="text-[#dbe5e8]">Unknowns kept honestly unknown</span></CheckItem>
              <CheckItem><span className="text-[#dbe5e8]">Trade-offs weighed against your goals</span></CheckItem>
              <CheckItem><span className="text-[#dbe5e8]">A recruiter note you can actually send</span></CheckItem>
            </ul>
            <div className="mt-6 border-t border-white/10 pt-5 text-xs leading-5 text-[#9fb5c1]">
              No universal trust score. No scam verdict. Your decision stays yours.
            </div>
          </section>

          <section className="surface-flat paper-texture flex-1 px-6 py-6">
            <div className="flex items-center gap-2 text-teal"><FlaskConical size={17} /><span className="eyebrow !text-teal">Just exploring?</span></div>
            <h3 className="mt-3 font-display text-[21px] text-navy">Open the sample workspace.</h3>
            <p className="mt-2 text-sm leading-6 text-muted">A fully synthetic offer with realistic gaps, ready for you to inspect and clarify.</p>
            <Button variant="secondary" className="mt-5 w-full" onClick={onDemo} icon={<ArrowRight size={15} />}>Try the synthetic demo</Button>
            <div className="mt-5 flex items-start gap-2 border-t border-line pt-4 text-xs leading-5 text-muted"><ShieldCheck size={14} className="mt-0.5 shrink-0" />Sample content is always labelled and never presented as a real opportunity.</div>
          </section>
        </aside>
      </div>

      <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center">
        <p className="flex items-center gap-2"><FileText size={14} />Offer → Clarify → Decide → Learn → Verify</p>
        <p>RoleWorth supports your judgement. It does not replace it.</p>
      </div>
    </div>
  );
}
