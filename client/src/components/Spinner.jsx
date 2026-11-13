import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils.js';

export default function Spinner({ className, label = 'Loading' }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
      <Loader2 className={cn('h-4 w-4 animate-spin', className)} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      <p className="text-sm text-ink-500 dark:text-ink-400">{label}</p>
    </div>
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card p-5">
          <div className="skeleton h-10 w-10 rounded-xl" />
          <div className="skeleton mt-4 h-4 w-3/4" />
          <div className="skeleton mt-2 h-3 w-full" />
          <div className="skeleton mt-2 h-3 w-2/3" />
          <div className="skeleton mt-5 h-8 w-24" />
        </div>
      ))}
    </div>
  );
}
