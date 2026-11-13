import { forwardRef, useId } from 'react';
import { cn } from '../lib/utils.js';

const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon, className, id, type = 'text', ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 dark:text-ink-300" />
        ) : null}
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn('input', Icon && 'pl-9', error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/30', className)}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-400 dark:text-ink-300">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
