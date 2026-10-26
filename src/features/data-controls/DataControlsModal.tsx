import { Download, FileJson, FileText, FolderOpen, HardDrive, Import, LockKeyhole, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button, Modal } from '../../components/ui';
import { downloadTextFile } from '../../lib/download';
import { createExportBundle, exportMarkdown, parseImportBundle } from '../../lib/exchange';
import { slugify } from '../../lib/format';
import type { OfferRecord } from '../../types';

interface DataControlsModalProps {
  record: OfferRecord | null;
  offers: OfferRecord[];
  onImport: (offers: OfferRecord[]) => void;
  onDeleteOffer: () => void;
  onReset: () => void;
  onClose: () => void;
  onToast: (message: string) => void;
}

export function DataControlsModal({ record, offers, onImport, onDeleteOffer, onReset, onClose, onToast }: DataControlsModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const exportFile = (format: 'markdown' | 'json', all = false) => {
    try {
      const selected = all ? offers : record ? [record] : [];
      if (!selected.length) throw new Error('Create an offer before exporting.');
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === 'markdown') {
        downloadTextFile(exportMarkdown(selected[0]), `roleworth-${slugify(selected[0].name)}-${stamp}.md`, 'text/markdown');
      } else {
        downloadTextFile(JSON.stringify(createExportBundle(selected), null, 2), `roleworth-${all ? 'workspace' : slugify(selected[0].name)}-${stamp}.json`, 'application/json');
      }
      onToast(`${format === 'markdown' ? 'Markdown report' : 'JSON backup'} downloaded locally.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Export failed. Try again.');
    }
  };

  const importFile = async (file?: File) => {
    if (!file || importing) return;
    setImporting(true); setError('');
    try {
      if (file.size > 5_000_000) throw new Error('This file is over 5 MB. Choose a smaller RoleWorth JSON backup.');
      const imported = parseImportBundle(await file.text());
      onImport(imported);
      onToast(`${imported.length} ${imported.length === 1 ? 'offer' : 'offers'} imported and validated.`);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Import failed. Choose a valid RoleWorth export.');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return <Modal title="Your data, your call." description="Export a portable record, restore a validated backup, or delete local data. No file leaves this browser during these actions." onClose={onClose} width="lg">
    <section aria-labelledby="export-heading"><div className="flex items-center gap-2"><Download size={17} className="text-teal" /><h3 id="export-heading" className="font-display text-[22px] text-navy">Export a decision report</h3></div><p className="mt-2 text-sm leading-6 text-muted">Markdown is readable anywhere. JSON preserves the ledger, snapshots, replies and milestones for a future import.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><Button variant="primary" onClick={() => exportFile('markdown')} disabled={!record} icon={<FileText size={15} />}>Download Markdown</Button><Button onClick={() => exportFile('json')} disabled={!record} icon={<FileJson size={15} />}>Download offer JSON</Button></div><Button variant="ghost" size="sm" className="mt-2 !px-0" onClick={() => exportFile('json', true)} disabled={!offers.length} icon={<Download size={14} />}>Export all {offers.length || ''} saved offers as JSON</Button></section>
    <section className="mt-7 border-t border-line pt-6" aria-labelledby="import-heading"><div className="flex items-center gap-2"><Import size={17} className="text-teal" /><h3 id="import-heading" className="font-display text-[22px] text-navy">Restore a JSON backup</h3></div><p className="mt-2 text-sm leading-6 text-muted">Only RoleWorth schema version 1 exports are accepted. Imported assessments are recalculated from their terms and priorities.</p><input ref={fileRef} type="file" accept="application/json,.json" disabled={importing} className="sr-only" id="import-json" onChange={(event) => void importFile(event.target.files?.[0])} /><label htmlFor="import-json" className={`mt-4 flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-[#c7d0c9] bg-[#faf9f5] px-4 py-5 text-sm font-semibold text-navy transition-colors hover:border-teal hover:bg-teal-soft ${importing ? 'pointer-events-none opacity-50' : ''}`}><FolderOpen size={18} className="text-teal" />{importing ? 'Validating backup…' : 'Choose a RoleWorth JSON file'}</label></section>
    {error && <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-sm leading-6 text-danger">{error}</p>}
    <section className="mt-7 border-t border-line pt-6"><div className="flex items-start gap-2"><HardDrive size={17} className="mt-0.5 text-teal" /><div><h3 className="font-display text-[22px] text-navy">Local storage</h3><p className="mt-2 text-sm leading-6 text-muted">Saved offers live in this browser’s local storage. Uploaded PDF binaries are not saved. Clearing site data or using another device will not transfer them.</p></div></div><div className="mt-4 flex items-start gap-2 rounded-xl bg-[#f3f4ee] px-4 py-3 text-xs leading-5 text-muted"><LockKeyhole size={14} className="mt-0.5 shrink-0 text-teal" />For a device shared with other people, export what you need and reset the workspace when you finish.</div></section>
    <section className="mt-7 border-t border-line pt-6"><h3 className="font-display text-[22px] text-navy">Delete controls</h3><div className="mt-4 flex flex-col gap-3 sm:flex-row"><Button variant="danger" size="sm" onClick={() => { if (record && window.confirm(`Delete the local ledger for “${record.name}”? This cannot be undone unless you exported it.`)) { onDeleteOffer(); onClose(); } }} disabled={!record} icon={<Trash2 size={14} />}>Delete current offer</Button><Button variant="danger" size="sm" onClick={() => setConfirmReset(true)} icon={<X size={14} />}>Reset entire workspace</Button></div>{confirmReset && <div className="mt-4 rounded-xl border border-[#e4c5c0] bg-danger-soft p-4"><p className="text-sm font-semibold text-[#913f3a]">Delete every saved offer, reply, snapshot and milestone?</p><p className="mt-1 text-xs leading-5 text-[#863f3a]">This removes RoleWorth’s local storage key. Export a backup first if you may need it.</p><div className="mt-3 flex gap-2"><Button size="sm" onClick={() => setConfirmReset(false)}>Keep my data</Button><Button size="sm" variant="danger" onClick={() => { onReset(); onClose(); }} icon={<Trash2 size={13} />}>Yes, reset everything</Button></div></div>}</section>
  </Modal>;
}
