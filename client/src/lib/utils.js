/** Join class names, skipping falsy values. */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export const DIFFICULTIES = ['easy', 'medium', 'hard'];

export const difficultyStyles = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  hard: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

export const CATEGORY_EMOJI = {
  Programming: '💻',
  Science: '🔬',
  Geography: '🌍',
  History: '🏛️',
  Entertainment: '🎬',
  Sports: '⚽',
  Music: '🎵',
  General: '🧠',
};

export const categoryEmoji = (category) => CATEGORY_EMOJI[category] || '🧠';

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatRelative(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

export function formatDuration(ms = 0) {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export const scoreTone = (percentage) => {
  if (percentage >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (percentage >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
};

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Small client-side form validator used by the auth forms. */
export function validateAuthForm({ name, email, password }, { requireName = false } = {}) {
  const errors = {};
  if (requireName && (!name || name.trim().length < 2)) errors.name = 'Name must be at least 2 characters';
  if (!email) errors.email = 'Email is required';
  else if (!emailPattern.test(email)) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
  return errors;
}
