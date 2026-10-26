import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  CloudOff,
  Compass,
  Download,
  FileText,
  GraduationCap,
  History,
  Info,
  Menu,
  MessageSquareText,
  Plus,
  Settings2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button, Logo, Modal } from '../components/ui';
import { Clarify } from '../features/clarify/Clarify';
import { DataControlsModal } from '../features/data-controls/DataControlsModal';
import { DecisionBrief } from '../features/decision/DecisionBrief';
import { EvidenceLedger } from '../features/evidence-ledger/EvidenceLedger';
import { LearningTracker } from '../features/learning-tracker/LearningTracker';
import { OfferComparison } from '../features/offer-comparison/OfferComparison';
import { OfferIntake } from '../features/offer-intake/OfferIntake';
import { PrioritiesModal } from '../features/priorities/PrioritiesModal';
import { PromiseDelta } from '../features/promise-delta/PromiseDelta';
import { appendOfferToWorkspace, createOfferRecord, recalculateOffer } from '../lib/offer';
import { DEMO_COMPARISON_OFFER_TEXT, DEMO_OFFER_TEXT } from '../lib/demo';
import { makeId } from '../lib/id';
import { deleteSavedWorkspace, emptyWorkspace, loadWorkspace, saveWorkspace } from '../lib/storage';
import { DEMO_PRIORITIES } from '../lib/terms';
import type { AppView, IntakeMetadata, OfferRecord, PriorityProfile, WorkspaceState } from '../types';

const navigation: Array<{ view: AppView; label: string; caption: string; icon: typeof Compass; step?: string }> = [
  { view: 'evidence', label: 'Offer & evidence', caption: 'Source-linked terms', icon: FileText, step: '01' },
  { view: 'clarify', label: 'Clarify', caption: 'Questions & replies', icon: MessageSquareText, step: '02' },
  { view: 'decide', label: 'Decide', caption: 'Your decision brief', icon: Compass, step: '03' },
  { view: 'learn', label: 'Learn', caption: 'Personal milestones', icon: GraduationCap, step: '04' },
  { view: 'verify', label: 'Verify', caption: 'Record what happened', icon: ClipboardCheck, step: '05' },
];

function initialWorkspace() {
  return loadWorkspace();
}

export function App() {
  const initialRef = useRef<ReturnType<typeof initialWorkspace> | null>(null);
  if (!initialRef.current) initialRef.current = initialWorkspace();
  const [workspace, setWorkspace] = useState<WorkspaceState>(initialRef.current.state);
  const [view, setView] = useState<AppView>('decide');
  const [prioritiesOpen, setPrioritiesOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [offerMenuOpen, setOfferMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [storageError, setStorageError] = useState<string | null>(initialRef.current.error);
  const toastTimer = useRef<number | undefined>(undefined);
  const skipNextSave = useRef(true);

  const activeOffer = workspace.offers.find((offer) => offer.id === workspace.activeOfferId) ?? null;

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    setStorageError(saveWorkspace(workspace));
  }, [workspace]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const notify = (message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 4200);
  };

  const navigate = (next: AppView) => {
    setView(next);
    setMobileMenuOpen(false);
    setOfferMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addOffer = (offer: OfferRecord, makeActive = true) => {
    setWorkspace((current) => appendOfferToWorkspace(current, offer, makeActive));
  };

  const handleAnalyze = (text: string, metadata: IntakeMetadata) => {
    const offer = createOfferRecord(text, workspace.priorities, metadata);
    addOffer(offer);
    navigate('decide');
    notify('Evidence ledger created. Review the source excerpts before relying on it.');
  };

  const handleDemo = () => {
    const offer = createOfferRecord(DEMO_OFFER_TEXT, DEMO_PRIORITIES, { sourceKind: 'demo', isDemo: true });
    addOffer(offer);
    navigate('decide');
    notify('Synthetic demo loaded. Nothing here describes a real employer.');
  };

  const handleDemoSecond = () => {
    const existing = workspace.offers.find((offer) => offer.isDemo && offer.name.includes('Fieldwork Systems'));
    if (!workspace.offers.length) {
      const first = createOfferRecord(DEMO_OFFER_TEXT, DEMO_PRIORITIES, { sourceKind: 'demo', isDemo: true });
      const second = createOfferRecord(DEMO_COMPARISON_OFFER_TEXT, DEMO_PRIORITIES, { sourceKind: 'demo', isDemo: true });
      setWorkspace((current) => ({ ...current, offers: [first, second], activeOfferId: first.id, priorities: first.priorities }));
    } else if (!existing) {
      addOffer(createOfferRecord(DEMO_COMPARISON_OFFER_TEXT, workspace.priorities, { sourceKind: 'demo', isDemo: true }), false);
    }
    navigate('compare');
    notify('Synthetic comparison offers ready. Both ledgers remain separate.');
  };

  const updateActive = (updated: OfferRecord) => {
    setWorkspace((current) => ({
      ...current,
      offers: current.offers.map((offer) => offer.id === updated.id ? updated : offer),
      activeOfferId: updated.id,
      priorities: updated.priorities,
    }));
  };

  const handlePriorities = (priorities: PriorityProfile) => {
    if (activeOffer) updateActive(recalculateOffer(activeOffer, priorities));
    else setWorkspace((current) => ({ ...current, priorities }));
    setPrioritiesOpen(false);
    notify('Priorities updated. The current brief was recalculated.');
  };

  const handleNewOffer = () => {
    setWorkspace((current) => ({ ...current, activeOfferId: null }));
    navigate('decide');
  };

  const handleSelectOffer = (id: string) => {
    setWorkspace((current) => ({ ...current, activeOfferId: id, priorities: current.offers.find((offer) => offer.id === id)?.priorities ?? current.priorities }));
    navigate('decide');
  };

  const handleDeleteOffer = () => {
    if (!activeOffer) return;
    const remaining = workspace.offers.filter((offer) => offer.id !== activeOffer.id);
    setWorkspace((current) => ({ ...current, offers: remaining, activeOfferId: remaining[0]?.id ?? null, priorities: remaining[0]?.priorities ?? current.priorities }));
    navigate('decide');
    notify('Current offer deleted from this browser.');
  };

  const handleReset = () => {
    const error = deleteSavedWorkspace();
    skipNextSave.current = true;
    setWorkspace(emptyWorkspace());
    setStorageError(error);
    navigate('decide');
    notify(error ?? 'Workspace reset. All RoleWorth local records were deleted.');
  };

  const handleImport = (imported: OfferRecord[]) => {
    const offers = imported.map((offer) => ({ ...offer, id: makeId('offer'), sourceKind: 'import' as const }));
    setWorkspace((current) => ({
      ...current,
      offers: [...current.offers, ...offers].slice(-50),
      activeOfferId: offers[0]?.id ?? current.activeOfferId,
      priorities: offers[0]?.priorities ?? current.priorities,
    }));
    navigate('decide');
  };

  const showIntake = !activeOffer && view !== 'compare';

  return (
    <div className="min-h-screen bg-ivory text-navy">
      <header className="sticky top-0 z-30 border-b border-line bg-ivory/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-4"><button onClick={() => activeOffer ? navigate('decide') : handleNewOffer()} className="rounded-xl" aria-label="Go to RoleWorth workspace"><span className="sm:hidden"><Logo compact /></span><span className="hidden sm:block"><Logo /></span></button>{activeOffer && <span className="hidden h-6 w-px bg-line sm:block" />}{activeOffer && <span className="hidden max-w-[220px] truncate text-xs font-medium text-muted md:block">{activeOffer.name}</span>}</div>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation"><button onClick={() => navigate(activeOffer ? 'decide' : 'decide')} className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${view !== 'compare' ? 'bg-[#e9eee9] text-navy' : 'text-muted hover:text-navy'}`}>Workspace</button><button onClick={() => navigate('compare')} className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${view === 'compare' ? 'bg-[#e9eee9] text-navy' : 'text-muted hover:text-navy'}`}>Compare offers</button></nav>
          <div className="flex items-center gap-1.5 sm:gap-2"><span className="mr-1 hidden items-center gap-1.5 text-[11px] font-medium text-muted lg:flex" title="Records are stored in this browser only"><span className={`h-1.5 w-1.5 rounded-full ${storageError ? 'bg-amber' : 'bg-teal'}`} />{storageError ? 'Session only' : 'Saved locally'}</span><Button size="sm" variant="ghost" onClick={() => setDataOpen(true)} icon={<Download size={14} />} aria-label="Data & export"><span className="hidden sm:inline">Data & export</span><span className="sm:hidden">Export</span></Button>{activeOffer && <Button size="sm" variant="primary" onClick={handleNewOffer} icon={<Plus size={14} />} aria-label="New offer"><span className="hidden sm:inline">New offer</span><span className="sm:hidden">New</span></Button>}<button className="rounded-lg p-2 text-muted hover:bg-[#e9eee9] hover:text-navy lg:hidden" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Toggle navigation" aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button></div>
        </div>
        {mobileMenuOpen && <div id="mobile-navigation" className="border-t border-line bg-paper px-5 py-3 lg:hidden"><div className="flex gap-2"><Button size="sm" variant={view !== 'compare' ? 'primary' : 'secondary'} onClick={() => navigate('decide')}>Workspace</Button><Button size="sm" variant={view === 'compare' ? 'primary' : 'secondary'} onClick={() => navigate('compare')}>Compare offers</Button><Button size="sm" variant="ghost" onClick={() => setMethodOpen(true)} icon={<Info size={14} />}>Method</Button></div>{activeOffer && <div className="mt-3 grid grid-cols-2 gap-1 border-t border-line pt-3">{navigation.map((item) => <button key={item.view} onClick={() => navigate(item.view)} className={`rounded-lg px-3 py-2 text-left text-xs font-semibold ${view === item.view ? 'bg-[#e9eee9] text-navy' : 'text-muted'}`}>{item.label}</button>)}<button onClick={() => navigate('delta')} className={`rounded-lg px-3 py-2 text-left text-xs font-semibold ${view === 'delta' ? 'bg-[#e9eee9] text-navy' : 'text-muted'}`}>Promise Delta</button></div>}</div>}
      </header>

      {storageError && <div className="border-b border-[#ead8b8] bg-amber-soft px-5 py-2.5 text-center text-xs leading-5 text-[#805b27]" role="status"><CloudOff size={13} className="mr-1.5 inline" />{storageError} <button onClick={() => setDataOpen(true)} className="ml-1 font-semibold underline underline-offset-2">Open data controls</button></div>}

      <div className="mx-auto flex max-w-[1440px] items-start">
        {activeOffer && <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] w-[238px] shrink-0 flex-col border-r border-line bg-[#f3f3ed] px-4 py-6 lg:flex" aria-label="Workspace steps">
          <div className="px-3"><p className="eyebrow">Your workspace</p><div className="relative mt-3"><button onClick={() => setOfferMenuOpen((open) => !open)} className="flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-paper px-3 py-3 text-left shadow-sm"><span className="min-w-0"><span className="block truncate text-xs font-semibold text-navy">{activeOffer.name}</span><span className="mt-1 block text-[10px] text-muted">{activeOffer.isDemo ? 'Synthetic sample' : 'Local offer ledger'}</span></span><ChevronDown size={14} className="shrink-0 text-muted" /></button>{offerMenuOpen && <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-xl border border-line bg-paper p-1.5 shadow-lift">{workspace.offers.map((offer) => <button key={offer.id} onClick={() => handleSelectOffer(offer.id)} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs ${offer.id === activeOffer.id ? 'bg-[#e9eee9] font-semibold text-navy' : 'text-muted hover:bg-ivory'}`}><span className="truncate">{offer.name}</span>{offer.id === activeOffer.id && <Check size={13} className="ml-auto shrink-0 text-teal" />}</button>)}<button onClick={handleNewOffer} className="mt-1 flex w-full items-center gap-2 border-t border-line px-2.5 py-2 text-left text-xs font-semibold text-teal"><Plus size={13} />New offer</button></div>}</div></div>
          <nav className="mt-7 space-y-1" aria-label="Promise to proof steps">{navigation.map((item) => { const Icon = item.icon; return <button key={item.view} onClick={() => navigate(item.view)} className={`nav-item ${view === item.view ? 'nav-item-active' : ''}`}><span className="font-mono text-[10px] text-navy">{item.step}</span><Icon size={16} strokeWidth={1.8} /><span className="flex-1">{item.label}</span>{item.view === 'clarify' && activeOffer.assessment.unknowns.length > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-soft px-1 font-mono text-[10px] text-amber">{activeOffer.assessment.unknowns.length}</span>}</button>; })}<button onClick={() => navigate('delta')} className={`nav-item ml-7 !py-2 text-xs ${view === 'delta' ? 'nav-item-active' : ''}`}><History size={14} /><span>Promise Delta</span>{activeOffer.snapshots.length > 1 && <span className="h-1.5 w-1.5 rounded-full bg-teal" />}</button></nav>
          <div className="mt-7 border-t border-line pt-5"><div className="flex items-center justify-between px-3"><p className="eyebrow !text-[10px]">Saved ledgers</p><span className="font-mono text-[10px] text-muted">{workspace.offers.length}</span></div><div className="mt-2 space-y-0.5">{workspace.offers.slice(-4).reverse().map((offer) => <button key={offer.id} onClick={() => handleSelectOffer(offer.id)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${offer.id === activeOffer.id ? 'bg-[#e9eee9] font-semibold text-navy' : 'text-muted hover:bg-[#ebece6]'}`}><Archive size={13} className="shrink-0" /><span className="truncate">{offer.name}</span></button>)}</div></div>
          <div className="mt-auto space-y-3"><button onClick={() => setDataOpen(true)} className="nav-item !py-2 text-xs"><Settings2 size={15} />Data & privacy controls</button><div className="rounded-xl border border-[#dbe3da] bg-[#edf2eb] px-3.5 py-3.5"><div className="flex items-center gap-2 text-teal"><ShieldCheck size={15} /><span className="text-[11px] font-bold uppercase tracking-wider">Private by default</span></div><p className="mt-2 text-[11px] leading-5 text-[#536b63]">Your offer stays in this browser. No account, analytics or external AI.</p></div><button onClick={() => setMethodOpen(true)} className="flex items-center gap-2 px-3 text-[11px] font-medium text-muted hover:text-navy"><CircleHelp size={13} />How RoleWorth works</button></div>
        </aside>}

        <main className="min-w-0 flex-1">
          {showIntake && <OfferIntake onAnalyze={handleAnalyze} onDemo={handleDemo} />}
          {activeOffer && view === 'decide' && <DecisionBrief record={activeOffer} onChange={updateActive} onNavigate={navigate} onEditPriorities={() => setPrioritiesOpen(true)} onToast={notify} />}
          {activeOffer && view === 'evidence' && <div className="animate-enter mx-auto max-w-[1220px] px-5 pb-16 pt-8 sm:px-8 lg:px-12 lg:pt-10"><div className="mb-8"><p className="eyebrow">01 / Offer & evidence</p><h1 className="display-title mt-3 text-[38px] leading-tight sm:text-[44px]">Keep the source in sight.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-[15px]">Review every term before it shapes your decision. Explicit, user-provided, inferred, unknown and independently verified are different kinds of knowledge.</p></div><EvidenceLedger record={activeOffer} onChange={updateActive} onToast={notify} /></div>}
          {activeOffer && view === 'clarify' && <Clarify record={activeOffer} onChange={updateActive} onToast={notify} />}
          {activeOffer && view === 'delta' && <div className="animate-enter mx-auto max-w-[1120px] px-5 pb-16 pt-8 sm:px-8 lg:px-12 lg:pt-10"><Button variant="ghost" size="sm" className="mb-5 !px-0" onClick={() => navigate('clarify')} icon={<ArrowLeft size={14} />}>Back to clarification</Button><PromiseDelta record={activeOffer} standalone /></div>}
          {activeOffer && view === 'learn' && <LearningTracker record={activeOffer} onChange={updateActive} onToast={notify} />}
          {activeOffer && view === 'verify' && <LearningTracker record={activeOffer} onChange={updateActive} onToast={notify} verifyMode />}
          {view === 'compare' && <OfferComparison offers={workspace.offers} activeOfferId={workspace.activeOfferId} onSelectOffer={handleSelectOffer} onNewOffer={handleNewOffer} onDemoSecond={handleDemoSecond} />}
          {!activeOffer && view === 'compare' && workspace.offers.length === 0 && <div className="mx-auto max-w-[1220px] px-5 pb-16 sm:px-8 lg:px-12"><div className="surface-flat mt-6 flex items-start gap-3 px-5 py-4 text-sm leading-6 text-muted"><Info size={17} className="mt-1 shrink-0 text-teal" />You can also paste two offers one at a time. Each one gets its own ledger and source history.</div></div>}
        </main>
      </div>

      <footer className="border-t border-line bg-[#f3f3ed] px-5 py-5 sm:px-8 lg:px-10"><div className="mx-auto flex max-w-[1340px] flex-col justify-between gap-3 text-[11px] leading-5 text-muted sm:flex-row sm:items-center"><p>RoleWorth 2.0 <span className="mx-1 text-muted" aria-hidden="true">·</span> Promise to proof, not promises to trust.</p><div className="flex items-center gap-4"><button onClick={() => setMethodOpen(true)} className="hover:text-navy">Method & limitations</button><button onClick={() => setDataOpen(true)} className="hover:text-navy">Privacy & data</button><span>Local-first MVP</span></div></div></footer>

      {prioritiesOpen && activeOffer && <PrioritiesModal priorities={activeOffer.priorities} onSave={handlePriorities} onClose={() => setPrioritiesOpen(false)} />}
      {dataOpen && <DataControlsModal record={activeOffer} offers={workspace.offers} onImport={handleImport} onDeleteOffer={handleDeleteOffer} onReset={handleReset} onClose={() => setDataOpen(false)} onToast={notify} />}
      {methodOpen && <Modal title="A ledger, not a verdict." description="RoleWorth is designed to make an internship decision more inspectable—not to make the decision for you." onClose={() => setMethodOpen(false)} width="lg"><div className="space-y-6"><div className="grid gap-3 sm:grid-cols-5">{[['01', 'Offer'], ['02', 'Clarify'], ['03', 'Decide'], ['04', 'Learn'], ['05', 'Verify']].map(([number, label]) => <div key={number} className="rounded-xl bg-[#f3f4ee] px-3 py-3"><p className="font-mono text-[10px] text-teal">{number}</p><p className="mt-1 text-sm font-semibold text-navy">{label}</p></div>)}</div><div><h3 className="font-display text-[22px] text-navy">What the app does</h3><p className="mt-2 text-sm leading-6 text-muted">It finds obvious terms in text you provide, preserves source excerpts, compares those terms with your stated priorities, drafts questions, stores your replies as new evidence, and keeps personal learning outcomes separate from employer commitments.</p></div><div><h3 className="font-display text-[22px] text-navy">What it does not do</h3><ul className="mt-2 space-y-2 text-sm leading-6 text-muted"><li>• It does not certify employers, detect fraud or predict outcomes.</li><li>• It does not fill in missing clauses or treat unknowns as wrongdoing.</li><li>• It does not send documents to an external service. PDF parsing and rules run locally.</li><li>• It does not perform OCR on scanned PDFs or independently check a source you cite.</li></ul></div><div className="rounded-xl border border-[#d5e2db] bg-[#edf4ef] px-4 py-3 text-sm leading-6 text-[#5c7168]"><strong className="font-semibold text-navy">A note on “verified”:</strong> that status is available only when you provide an independent source you inspected. RoleWorth records your provenance claim; it does not independently validate it.</div><Button variant="primary" onClick={() => setMethodOpen(false)} icon={<ArrowRight size={15} />}>Back to my workspace</Button></div></Modal>}
      {toast && <div className="animate-toast fixed bottom-5 left-1/2 z-[60] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2.5 rounded-xl bg-navy px-4 py-3 text-sm text-white shadow-lift" role="status" aria-live="polite"><Check size={16} className="shrink-0 text-[#8bd0bc]" />{toast}<button onClick={() => setToast('')} className="ml-2 rounded p-0.5 text-white/60 hover:text-white" aria-label="Dismiss notification"><X size={14} /></button></div>}
    </div>
  );
}
