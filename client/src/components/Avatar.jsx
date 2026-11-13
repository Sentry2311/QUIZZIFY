import { cn, initials } from '../lib/utils.js';

const PALETTE = [
  'from-brand-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-600',
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
