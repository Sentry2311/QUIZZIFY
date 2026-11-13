import { Compass } from 'lucide-react';
import Button from '../components/Button.jsx';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
        <Compass className="h-8 w-8" />
      </span>
      <p className="mt-6 font-display text-5xl font-extrabold">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold">This page took a wrong turn</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-500 dark:text-ink-300">
        The page you were looking for does not exist. Maybe a quiz is waiting for you instead.
      </p>
      <div className="mt-6 flex gap-2">
        <Button to="/">Go home</Button>
        <Button variant="secondary" to="/quizzes">
          Browse quizzes
        </Button>
      </div>
    </div>
  );
}
