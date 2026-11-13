import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils.js';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

export default function Button({
  children,
  variant = 'primary',
  to,
  href,
  loading = false,
  className,
  disabled,
  type = 'button',
  ...props
}) {
  const classes = cn(VARIANTS[variant] || VARIANTS.primary, className);
  const content = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
