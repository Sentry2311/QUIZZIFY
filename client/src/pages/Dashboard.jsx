import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import Button from '../components/Button.jsx';
import StatCard from '../components/StatCard.jsx';
import QuizCard from '../components/QuizCard.jsx';
import Avatar from '../components/Avatar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { CardSkeleton } from '../components/Spinner.jsx';
import Alert from '../components/Alert.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { cn, formatRelative, scoreTone } from '../lib/utils.js';

export default function Dashboard() {
  const { user, stats } = useAuth();

  const { data: attemptData, loading: attemptsLoading, error: attemptsError } = useApi('/attempts/mine');
  const { data: quizData, loading: quizzesLoading } = useApi('/quizzes', { params: { limit: 3, sort: 'popular' } });

  const attempts = attemptData?.attempts ?? [];
  const recommended = quizData?.quizzes ?? [];

  const bestScore = stats?.bestScore ?? attempts.reduce((max, attempt) => Math.max(max, attempt.percentage), 0);
  const averageScore = stats?.averageScore ?? 0;

  return (
    <div className="container-page py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name} size="lg" />
          <div>
            <p className="text-sm text-ink-500 dark:text-ink-300">Welcome back</p>
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{user?.name}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button to="/quizzes">
            <BookOpen className="h-4 w-4" /> Browse quizzes
          </Button>
          {user?.role === 'admin' ? (
            <Button variant="secondary" to="/admin/quizzes">
              <Sparkles className="h-4 w-4" /> Create quiz
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Target} label="Attempts" value={stats?.attempts ?? attempts.length} hint="Quizzes completed" />
        <StatCard icon={Trophy} label="Best score" value={`${bestScore}%`} hint="Personal record" tone="amber" />
        <StatCard icon={BarChart3} label="Average" value={`${averageScore}%`} hint="Across all attempts" tone="emerald" />
        <StatCard icon={Zap} label="Rank" value={bestScore >= 80 ? 'Pro' : bestScore >= 50 ? 'Rising' : 'Rookie'} hint="Based on your best score" tone="rose" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-display text-xl font-bold">Recent attempts</h2>

          <div className="mt-4">
            {attemptsError ? <Alert>{attemptsError}</Alert> : null}
            {attemptsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="skeleton h-20" />
                ))}
              </div>
            ) : attempts.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No attempts yet"
                description="Play your first quiz and your results will show up here."
                action={
                  <Button to="/quizzes" className="mt-2">
                    Find a quiz
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-3">
                {attempts.map((attempt) => (
                  <li key={attempt.id} className="card flex items-center gap-4 p-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-xl dark:bg-white/10">
                      {attempt.quiz?.cover || '🧠'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/quizzes/${attempt.quiz?.id}`}
                        className="truncate font-medium transition hover:text-brand-700 dark:hover:text-accent-300"
                      >
                        {attempt.quiz?.title ?? 'Deleted quiz'}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-300">
                        {attempt.correctCount}/{attempt.totalQuestions} correct · {formatRelative(attempt.createdAt)}
                      </p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            attempt.percentage >= 80 ? 'bg-emerald-500' : attempt.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500',
                          )}
                          style={{ width: `${attempt.percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className={cn('font-display text-lg font-bold', scoreTone(attempt.percentage))}>
                      {attempt.percentage}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl font-bold">Your progress</h2>
          <div className="card mt-4 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink-600 dark:text-ink-300">Best score</span>
              <span className={cn('font-display text-lg font-bold', scoreTone(bestScore))}>{bestScore}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
              <div className="h-full rounded-full bg-brand-700 dark:bg-brand-300" style={{ width: `${bestScore}%` }} />
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm font-medium text-ink-600 dark:text-ink-300">Average score</span>
              <span className={cn('font-display text-lg font-bold', scoreTone(averageScore))}>{averageScore}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
              <div className="h-full rounded-full bg-accent-400" style={{ width: `${averageScore}%` }} />
            </div>

            <div className="mt-6 space-y-2 border-t border-ink-100 pt-5 dark:border-white/10">
              <Button variant="secondary" to="/quizzes" className="w-full justify-between">
                Explore quizzes <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" to="/leaderboard" className="w-full justify-between">
                View leaderboard <Trophy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-xl font-bold">Recommended for you</h2>
          <Link to="/quizzes" className="link inline-flex items-center gap-1 text-sm">
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4">
          {quizzesLoading ? (
            <CardSkeleton count={3} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.map((quiz, index) => (
                <QuizCard key={quiz.id} quiz={quiz} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
