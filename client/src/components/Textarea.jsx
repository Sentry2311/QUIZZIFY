import { forwardRef, useId } from 'react';
import { cn } from '../lib/utils.js';

const Textarea = forwardRef(function Textarea({ label, error, hint, className, id, rows = 3, ...props }, ref) {
  const generatedId = useId();
  const textareaId = id || generatedId;

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={textareaId} className="label">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={cn('input resize-y', error && 'border-rose-400', className)}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
});

export default Textarea;
