import { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Inbox, Loader2 } from 'lucide-react';
import { statusLabel, statusTone } from '../lib/format';

export const Spinner = ({ label = 'Loading' }: { label?: string }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted" role="status"><Loader2 className="h-4 w-4 animate-spin" />{label}…</div>
);
export const ErrorState = ({ message, retry }: { message: string; retry?: () => void }) => (
  <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center" role="alert">
    <AlertTriangle className="h-6 w-6 text-bad" />
    <p className="max-w-md text-sm">{message}</p>
    {retry && <button className="btn-ghost btn-sm" onClick={retry}>Try again</button>}
  </div>
);
export const Empty = ({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) => (
  <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
    <Inbox className="h-6 w-6 text-muted" />
    <p className="font-display font-semibold">{title}</p>
    {hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);
export const Success = ({ children }: { children: ReactNode }) => (
  <div className="flex items-start gap-2 rounded-xl border border-ok/30 bg-ok/5 px-4 py-3 text-sm" role="status"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" /><div>{children}</div></div>
);
export const Status = ({ s }: { s: string }) => <span className={`badge ${statusTone(s)}`}>{statusLabel[s] || s}</span>;
export const PageHead = ({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-2xl font-semibold">{title}</h1>{sub && <p className="mt-1 text-sm text-muted">{sub}</p>}</div>{right}
  </div>
);
export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block"><span className="label">{label}</span>{children}</label>
);
export const Toggle = ({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
    className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-brand' : 'bg-line'}`}>
    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
  </button>
);
