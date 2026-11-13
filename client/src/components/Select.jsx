import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils.js';

const Select = forwardRef(function Select({ label, error, className, id, children, ...props }, ref) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={selectId} className="label">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          className={cn('input appearance-none pr-9', error && 'border-rose-400', className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      </div>
      {error ? <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p> : null}
    </div>
  );
});

export default Select;
