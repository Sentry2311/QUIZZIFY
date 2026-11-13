import { cn, initials } from '../lib/utils.js';

const PALETTE = [
  'from-brand-700 to-brand-900',
  'from-accent-400 to-accent-600',
  'from-emerald-500 to-teal-700',
  'from-amber-500 to-brand-700',
  'from-rose-500 to-brand-800',
  'from-accent-300 to-brand-700',
];

export default function Avatar({ name = '?', size = 'md', className }) {
  const hash = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
  };

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-sm',
        PALETTE[hash % PALETTE.length],
        sizes[size] || sizes.md,
        className,
      )}
      aria-hidden="true"
    >
      {initials(name) || '?'}
    </span>
  );
}
