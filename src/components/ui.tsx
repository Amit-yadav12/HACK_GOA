import {
  BadgeCheck,
  Check,
  CircleHelp,
  FileCheck2,
  Lightbulb,
  UserRound,
  X,
} from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { EVIDENCE_STATUS_LABELS } from '../lib/terms';
import type { EvidenceStatus } from '../types';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5" aria-label="RoleWorth 2.0">
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-navy" aria-hidden="true">
        <span className="flex w-[18px] flex-col gap-[4px]">
          <span className="h-[2px] rounded-full bg-ivory" />
          <span className="relative h-[2px] w-[13px] rounded-full bg-ivory">
            <span className="absolute -right-[5px] -top-[2px] h-[6px] w-[6px] rounded-full bg-[#70b9aa]" />
          </span>
          <span className="h-[2px] rounded-full bg-ivory" />
        </span>
      </span>
      {!compact && (
        <span className="flex items-baseline gap-2">
          <span className="font-display text-[24px] font-bold tracking-[-0.045em] text-navy">roleworth</span>
          <span className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-muted">2.0</span>
        </span>
      )}
    </div>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'teal' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'border-navy bg-navy text-white hover:bg-[#23465d] hover:border-[#23465d] shadow-sm',
  secondary: 'border-[#d9ddd6] bg-paper text-navy hover:border-[#b7c3bc] hover:bg-[#f4f5ef]',
  ghost: 'border-transparent bg-transparent text-[#5f6f79] hover:bg-[#ebece6] hover:text-navy',
  teal: 'border-teal bg-teal text-white hover:bg-[#116c69] hover:border-[#116c69] shadow-sm',
  danger: 'border-[#e4c5c0] bg-danger-soft text-[#963e3a] hover:bg-[#f5ded9]',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'min-h-11 px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'min-h-12 px-5 py-3 text-[15px] rounded-xl gap-2.5',
};

export function Button({ variant = 'secondary', size = 'md', icon, className = '', children, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center border font-semibold transition-all duration-200 disabled:opacity-45 ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

const statusStyles: Record<EvidenceStatus, string> = {
  explicit: 'border-[#c8dfd7] bg-teal-soft text-[#146863]',
  user: 'border-[#d7dde1] bg-[#edf1f3] text-[#425e70]',
  inferred: 'border-[#ead8b8] bg-amber-soft text-[#8d5b1c]',
  unknown: 'border-[#ead8b8] bg-amber-soft text-[#8d5b1c]',
  verified: 'border-[#b9d8ce] bg-[#e1f1eb] text-[#0e665f]',
};

const statusIcons = {
  explicit: FileCheck2,
  user: UserRound,
  inferred: Lightbulb,
  unknown: CircleHelp,
  verified: BadgeCheck,
};

export function StatusBadge({ status, rejected = false, compact = false }: { status: EvidenceStatus; rejected?: boolean; compact?: boolean }) {
  if (rejected) {
    return <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e4c5c0] bg-danger-soft px-2.5 py-1 text-[11px] font-semibold text-[#963e3a]"><X size={12} />Rejected</span>;
  }
  const Icon = statusIcons[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-4 ${statusStyles[status]}`}>
      <Icon size={compact ? 11 : 12} strokeWidth={1.8} aria-hidden="true" />
      {EVIDENCE_STATUS_LABELS[status]}
    </span>
  );
}

interface ModalProps {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  width?: 'md' | 'lg' | 'xl';
}

export function Modal({ title, description, children, onClose, width = 'md' }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])') ?? []);
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [onClose]);

  const widths = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-paper shadow-lift sm:rounded-3xl ${widths[width]}`}
      >
        <div className="flex shrink-0 items-start justify-between gap-5 border-b border-line px-5 py-5 sm:px-7">
          <div>
            <h2 id={titleId} className="font-display text-[25px] tracking-[-0.025em] text-navy">{title}</h2>
            {description && <p id={descriptionId} className="mt-1.5 max-w-xl text-sm leading-6 text-muted">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted transition-colors hover:bg-ivory hover:text-navy" aria-label="Close dialog"><X size={20} /></button>
        </div>
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#cfd4ce] bg-[#faf9f5] px-6 py-12 text-center">
      {icon && <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#eceee8] text-[#63757d]">{icon}</div>}
      <h3 className="font-display text-xl text-navy">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function CheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm leading-6 text-[#4f626f]">
      <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-soft text-teal"><Check size={11} strokeWidth={2.4} /></span>
      <span>{children}</span>
    </li>
  );
}

export function DividerLabel({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center gap-3 ${props.className ?? ''}`}>
      <span className="eyebrow whitespace-nowrap">{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
