import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils.js';

export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        className="btn-secondary px-2.5 py-2"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {Array.from({ length: pages }).map((_, index) => {
        const number = index + 1;
        return (
          <button
            key={number}
            type="button"
            onClick={() => onChange(number)}
            aria-current={number === page ? 'page' : undefined}
            className={cn(
              'h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition',
              number === page
                ? 'bg-brand-600 text-white'
                : 'border border-ink-200 bg-white text-ink-600 hover:border-brand-300 dark:border-white/10 dark:bg-white/5 dark:text-ink-300',
            )}
          >
            {number}
          </button>
        );
      })}
      <button
        type="button"
        className="btn-secondary px-2.5 py-2"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
