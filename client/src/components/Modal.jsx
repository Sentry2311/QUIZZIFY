import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../lib/utils.js';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export default function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
        onClick={() => onClose?.()}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-ink-200 bg-white shadow-2xl animate-pop-in dark:border-white/10 dark:bg-ink-900 sm:rounded-2xl',
          SIZES[size] || SIZES.md,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className="font-display text-lg font-semibold">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-300">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="rounded-lg p-1.5 text-ink-400 dark:text-ink-300 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">{children}</div>
        {footer ? (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-ink-100 px-5 py-3 dark:border-white/10">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
