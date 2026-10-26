import { ArrowRight, Columns2, FilePlus2, FlaskConical, GitCompareArrows, Info } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button, EmptyState } from '../../components/ui';
import { evaluateOffer } from '../../lib/assessment';
import { compareOffers } from '../../lib/comparison';
import type { OfferRecord } from '../../types';

interface OfferComparisonProps {
  offers: OfferRecord[];
  activeOfferId: string | null;
  onSelectOffer: (id: string) => void;
  onNewOffer: () => void;
  onDemoSecond: () => void;
}

export function OfferComparison({ offers, activeOfferId, onSelectOffer, onNewOffer, onDemoSecond }: OfferComparisonProps) {
  const [aId, setAId] = useState(activeOfferId ?? offers[0]?.id ?? '');
  const [bId, setBId] = useState(offers.find((offer) => offer.id !== (activeOfferId ?? offers[0]?.id))?.id ?? '');
  useEffect(() => {
    if (!offers.some((offer) => offer.id === aId)) setAId(offers[0]?.id ?? '');
    if (!offers.some((offer) => offer.id === bId) || bId === aId) setBId(offers.find((offer) => offer.id !== aId)?.id ?? '');
  }, [offers, aId, bId]);
  const a = offers.find((offer) => offer.id === aId);
  const b = offers.find((offer) => offer.id === bId);
  const rows = useMemo(() => a && b && a.id !== b.id ? compareOffers(a, b) : [], [a, b]);
  const priorities = a?.priorities;
  const assessmentA = a && priorities ? evaluateOffer(a.terms, priorities) : null;
  const assessmentB = b && priorities ? evaluateOffer(b.terms, priorities) : null;

  return <div className="animate-enter mx-auto max-w-[1220px] px-5 pb-16 pt-8 sm:px-8 lg:px-12 lg:pt-10">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Workspace tool</p><h1 className="display-title mt-3 text-[38px] leading-tight sm:text-[44px]">Two offers. Same questions.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-[15px]">Compare only what the evidence establishes. Unknowns stay visible instead of becoming zeroes, guesses or artificial winners.</p></div><Button variant="secondary" onClick={onNewOffer} icon={<FilePlus2 size={16} />}>Add another offer</Button></div>
    {offers.length < 2 ? <div className="mt-8"><EmptyState icon={<Columns2 size={22} />} title="A comparison needs two separate ledgers" description="Your current offer is safe. Add another offer from the intake screen, or load a second synthetic sample to see how comparison handles missing terms." action={<div className="flex flex-col justify-center gap-3 sm:flex-row"><Button variant="primary" onClick={onNewOffer} icon={<ArrowRight size={15} />}>Add an offer</Button><Button onClick={onDemoSecond} icon={<FlaskConical size={15} />}>Load synthetic second offer</Button></div>} /></div> : <>
      <section className="surface mt-8 p-5 sm:p-6"><div className="grid gap-4 md:grid-cols-2"><OfferSelect label="Offer A" value={aId} offers={offers} exclude={bId} onChange={setAId} /><OfferSelect label="Offer B" value={bId} offers={offers} exclude={aId} onChange={setBId} /></div><div className="mt-5 flex items-start gap-2 border-t border-line pt-4 text-xs leading-5 text-muted"><Info size={14} className="mt-0.5 shrink-0 text-teal" />The priority readout below uses Offer A’s priorities for both offers, so the lens stays consistent. Source evidence remains separate.</div></section>
      {a && b && <><section className="mt-6 grid min-w-0 gap-4 md:grid-cols-2"><ComparisonAssessment offer={a} assessment={assessmentA} onOpen={() => onSelectOffer(a.id)} /><ComparisonAssessment offer={b} assessment={assessmentB} onOpen={() => onSelectOffer(b.id)} /></section><section className="surface mt-6 overflow-hidden"><div className="border-b border-line px-5 py-5 sm:px-7"><div className="flex items-center gap-2"><GitCompareArrows size={18} className="text-teal" /><h2 className="font-display text-[25px] text-navy">Term-by-term comparison</h2></div><p className="mt-1.5 text-sm text-muted">A blank or missing clause is shown as unknown, never silently filled in.</p></div><div className="overflow-x-auto"><table aria-label="Term-by-term offer comparison" className="w-full min-w-[680px] border-collapse text-left"><thead><tr className="border-b border-line bg-[#faf9f5]"><th scope="col" className="w-[19%] px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-muted sm:px-7">Term</th><th scope="col" className="w-[40.5%] px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-muted">{a.name}</th><th scope="col" className="w-[40.5%] px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-muted">{b.name}</th></tr></thead><tbody>{rows.map((row) => <tr key={row.key} className="border-b border-line last:border-0"><th scope="row" className="px-5 py-5 align-top text-sm font-semibold text-navy sm:px-7">{row.label}</th><td className={`px-5 py-5 align-top text-sm leading-6 ${row.a.startsWith('Unknown') ? 'italic text-amber' : 'text-[#4f626f]'}`}>{row.a}</td><td className={`px-5 py-5 align-top text-sm leading-6 ${row.b.startsWith('Unknown') ? 'italic text-amber' : 'text-[#4f626f]'}`}>{row.b}</td></tr>)}</tbody></table></div><div className="border-t border-line bg-[#faf9f5] px-5 py-4 text-xs leading-5 text-muted sm:px-7">Comparability is a property of the evidence, not a judgement of either employer. Review each offer’s ledger for excerpts and provenance.</div></section></>}
    </>}
  </div>;
}

function OfferSelect({ label, value, offers, exclude, onChange }: { label: string; value: string; offers: OfferRecord[]; exclude: string; onChange: (value: string) => void }) {
  return <div><label className="field-label" htmlFor={`compare-${label.replace(' ', '-').toLowerCase()}`}>{label}</label><select id={`compare-${label.replace(' ', '-').toLowerCase()}`} className="field" value={value} onChange={(event) => onChange(event.target.value)}>{offers.filter((offer) => offer.id !== exclude).map((offer) => <option key={offer.id} value={offer.id}>{offer.name}{offer.isDemo ? ' · synthetic' : ''}</option>)}</select></div>;
}

function ComparisonAssessment({ offer, assessment, onOpen }: { offer: OfferRecord; assessment: ReturnType<typeof evaluateOffer> | null; onOpen: () => void }) {
  if (!assessment) return null;
  return <article className="surface-flat min-w-0 px-5 py-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="eyebrow">Priority readout</p><h2 className="mt-2 max-w-[280px] truncate font-display text-[22px] text-navy" title={offer.name}>{offer.name}</h2></div>{offer.isDemo && <span className="shrink-0 rounded-md bg-[#eee8d9] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#765b24]">Synthetic</span>}</div><div className="mt-5 flex min-w-0 flex-wrap gap-x-5 gap-y-2 text-sm"><span className="text-teal"><strong className="font-display text-2xl">{assessment.aligned.length}</strong> supported</span><span className="text-danger"><strong className="font-display text-2xl">{assessment.conflicts.length}</strong> conflicts</span><span className="text-amber"><strong className="font-display text-2xl">{assessment.unknowns.length}</strong> unknowns</span></div><Button size="sm" variant="ghost" className="mt-3 !px-0" onClick={onOpen} icon={<ArrowRight size={13} />}>Open this ledger</Button></article>;
}
