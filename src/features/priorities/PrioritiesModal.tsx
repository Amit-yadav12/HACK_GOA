import { ArrowRight, Info } from 'lucide-react';
import { useState } from 'react';
import { Button, Modal } from '../../components/ui';
import type { PriorityProfile } from '../../types';

interface PrioritiesModalProps {
  priorities: PriorityProfile;
  onSave: (priorities: PriorityProfile) => void;
  onClose: () => void;
}

export function PrioritiesModal({ priorities, onSave, onClose }: PrioritiesModalProps) {
  const [draft, setDraft] = useState(priorities);
  const [hours, setHours] = useState(priorities.availableHours?.toString() ?? '');
  const [stipend, setStipend] = useState(priorities.minimumStipend?.toString() ?? '');
  const [error, setError] = useState('');

  const update = <K extends keyof PriorityProfile>(key: K, value: PriorityProfile[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const submit = () => {
    const parsedHours = hours.trim() === '' ? null : Number(hours);
    const parsedStipend = stipend.trim() === '' ? null : Number(stipend);
    if (parsedHours !== null && (!Number.isFinite(parsedHours) || parsedHours < 0 || parsedHours > 168)) {
      setError('Available hours must be between 0 and 168.'); return;
    }
    if (parsedStipend !== null && (!Number.isFinite(parsedStipend) || parsedStipend < 0 || parsedStipend > 1_000_000_000)) {
      setError('Minimum stipend must be between 0 and 1,000,000,000, or left blank.'); return;
    }
    onSave({ ...draft, availableHours: parsedHours, minimumStipend: parsedStipend });
  };

  return (
    <Modal title="Make the brief yours" description="Your priorities are inputs to transparent rules—not a score of an employer. Leave anything blank if you do not want to use it." onClose={onClose} width="lg">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="priority-role">Target role or direction</label>
          <input id="priority-role" className="field" maxLength={300} value={draft.targetRole} onChange={(event) => update('targetRole', event.target.value)} placeholder="e.g. Product design" />
        </div>
        <div>
          <label className="field-label" htmlFor="priority-hours">Hours available per week</label>
          <input id="priority-hours" className="field" type="number" min="0" max="168" step="1" value={hours} onChange={(event) => setHours(event.target.value)} placeholder="e.g. 25" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="priority-skills">Skills you want to practise</label>
          <input id="priority-skills" className="field" maxLength={1500} value={draft.skills} onChange={(event) => update('skills', event.target.value)} placeholder="Separate skills with commas: research, prototyping, Excel" />
          <p className="field-hint">The brief looks for these words in responsibilities, training and deliverables. It does not infer skill growth from a job title.</p>
        </div>
        <div>
          <label className="field-label" htmlFor="priority-stipend">Minimum monthly stipend</label>
          <div className="flex gap-2">
            <select aria-label="Stipend currency" className="field w-[92px] px-2" value={draft.currency} onChange={(event) => update('currency', event.target.value)}>
              <option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
            </select>
            <input id="priority-stipend" className="field" type="number" min="0" max="1000000000" value={stipend} onChange={(event) => setStipend(event.target.value)} placeholder="Optional" />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="priority-mentorship">Mentorship preference</label>
          <select id="priority-mentorship" className="field" value={draft.mentorship} onChange={(event) => update('mentorship', event.target.value as PriorityProfile['mentorship'])}>
            <option value="essential">Essential — I need a feedback rhythm</option>
            <option value="preferred">Preferred — it matters to me</option>
            <option value="flexible">Flexible — not a deciding factor</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="priority-work">Preferred kind of work <span className="font-normal text-muted">(optional)</span></label>
          <textarea id="priority-work" className="field min-h-[80px] resize-y" maxLength={1500} value={draft.preferredWork} onChange={(event) => update('preferredWork', event.target.value)} placeholder="What would make this internship worthwhile?" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="priority-boundaries">Personal non-negotiables <span className="font-normal text-muted">(optional)</span></label>
          <textarea id="priority-boundaries" className="field min-h-[80px] resize-y" maxLength={1500} value={draft.nonNegotiables} onChange={(event) => update('nonNegotiables', event.target.value)} placeholder="e.g. No fees or deposits; no unpaid training" />
          <p className="field-hint">The current rules inspect fee/deposit and “no unpaid training” wording. Keep other boundaries here as personal notes and review them yourself.</p>
        </div>
      </div>
      <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-[#f3f4ee] px-4 py-3 text-xs leading-5 text-muted"><Info size={15} className="mt-0.5 shrink-0 text-teal" />Changing a priority recalculates the current brief. It does not rewrite earlier assessment snapshots.</div>
      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      <div className="mt-6 flex justify-end gap-3 border-t border-line pt-5"><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={submit} icon={<ArrowRight size={16} />}>Update my brief</Button></div>
    </Modal>
  );
}
