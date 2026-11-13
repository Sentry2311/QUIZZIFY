import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-200/70 bg-white dark:border-white/10 dark:bg-ink-950">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-800 to-brand-950 font-bold text-brand-50 ring-1 ring-accent-300/40">
              Q
            </span>
            <span className="font-display text-lg font-bold">Quizzify</span>
          </div>
          <p className="mt-2 max-w-sm text-sm text-ink-600 dark:text-ink-300">
            Create quizzes, challenge yourself and track how much you actually remember.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Footer navigation">
          <Link to="/quizzes" className="text-ink-600 transition hover:text-brand-800 dark:text-ink-300 dark:hover:text-accent-300">
            Explore quizzes
          </Link>
          <Link to="/leaderboard" className="text-ink-600 transition hover:text-brand-800 dark:text-ink-300 dark:hover:text-accent-300">
            Leaderboard
          </Link>
          <Link to="/dashboard" className="text-ink-600 transition hover:text-brand-800 dark:text-ink-300 dark:hover:text-accent-300">
            Dashboard
          </Link>
          <Link to="/register" className="text-ink-600 transition hover:text-brand-800 dark:text-ink-300 dark:hover:text-accent-300">
            Create an account
          </Link>
        </nav>
      </div>
      <div className="border-t border-ink-100 py-4 dark:border-white/5">
        <p className="container-page text-xs text-ink-500">
          © {new Date().getFullYear()} Quizzify. Built with React, Express, MongoDB and Socket.IO.
        </p>
      </div>
    </footer>
  );
}
