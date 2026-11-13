import { Link } from 'react-router-dom';
import { Clock, HelpCircle, Play, Users } from 'lucide-react';
import { cn, difficultyStyles } from '../lib/utils.js';

export default function QuizCard({ quiz, index = 0 }) {
  return (
    <Link
      to={`/quizzes/${quiz.id}`}
      className="card card-hover group flex h-full flex-col p-5 animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-100 to-accent-200 text-2xl dark:from-accent-300/15 dark:to-accent-300/5">
          {quiz.cover || '🧠'}
        </span>
        <span className={cn('badge capitalize', difficultyStyles[quiz.difficulty] || difficultyStyles.medium)}>
          {quiz.difficulty}
        </span>
      </div>

      <h3 className="mt-4 font-display text-lg font-semibold leading-snug transition group-hover:text-brand-800 dark:group-hover:text-accent-300">
        {quiz.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-ink-500 dark:text-ink-300">
        {quiz.description || 'Test your knowledge with this quiz.'}
      </p>

      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-500 dark:text-ink-300">
          <span className="inline-flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" /> {quiz.questionCount} questions
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {quiz.timeLimitSeconds}s
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {quiz.plays}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 text-sm dark:border-white/5">
          <span className="font-medium text-ink-500 dark:text-ink-300">{quiz.category}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-brand-700 dark:text-accent-300">
            <Play className="h-3.5 w-3.5" /> Play
          </span>
        </div>
      </div>
    </Link>
  );
}
