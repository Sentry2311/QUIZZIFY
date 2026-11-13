import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '../lib/utils.js';

export const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
};

const TONES = {
  success: 'border-emerald-200 bg-white text-emerald-700 dark:border-emerald-500/30 dark:bg-ink-900 dark:text-emerald-300',
  error: 'border-rose-200 bg-white text-rose-700 dark:border-rose-500/30 dark:bg-ink-900 dark:text-rose-300',
  info: 'border-brand-200 bg-white text-brand-700 dark:border-brand-500/30 dark:bg-ink-900 dark:text-brand-300',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const toast = useCallback(
    ({ type = 'info', title, message }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
      setToasts((current) => [...current.slice(-2), { id, type, title, message }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 4200),
      );
      return id;
    },
    [dismiss],
  );

  const success = useCallback((title, message) => toast({ type: 'success', title, message }), [toast]);
  const error = useCallback((title, message) => toast({ type: 'error', title, message }), [toast]);
  const info = useCallback((title, message) => toast({ type: 'info', title, message }), [toast]);

  const value = useMemo(() => ({ toast, success, error, info, dismiss }), [toast, success, error, info, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-[4.75rem] z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
        role="status"
        aria-live="polite"
      >
        {toasts.map((item) => {
          const Icon = ICONS[item.type] || Info;
          return (
            <div
              key={item.id}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm animate-slide-in items-start gap-3 rounded-xl border px-4 py-3 shadow-soft',
                TONES[item.type],
              )}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.message ? <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-300">{item.message}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded-md p-1 text-ink-400 dark:text-ink-300 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
