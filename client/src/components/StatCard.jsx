import { cn } from '../lib/utils.js';

const TONES = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
};

export default function StatCard({ icon: Icon, label, value, hint, tone = 'brand' }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-500 dark:text-ink-300">{label}</p>
        {Icon ? (
          <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', TONES[tone])}>
            <Icon className="h-4.5 w-4.5" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-3xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-500 dark:text-ink-300">{hint}</p> : null}
    </div>
  );
}
