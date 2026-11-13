import { CheckCircle2, TriangleAlert } from 'lucide-react';
import { cn } from '../lib/utils.js';

const TONES = {
  error: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
};

export default function Alert({ tone = 'error', children, className }) {
  const Icon = tone === 'success' ? CheckCircle2 : TriangleAlert;
  return (
    <div className={cn('flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm', TONES[tone], className)} role="alert">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
