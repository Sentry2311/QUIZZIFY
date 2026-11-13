import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Radio,
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
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const { data: attemptData, loading: attemptsLoading, error: attemptsError } = useApi('/attempts/mine');
  const { data: quizData, loading: quizzesLoading } = useApi('/quizzes', { params: { limit: 3, sort: 'popular' } });

  const attempts = attemptData?.attempts ?? [];
  const recommended = quizData?.quizzes ?? [];

  const joinRoom = (event) => {
    event.preventDefault();
    const cleaned = code.trim().toUpperCase();
    if (cleaned.length < 4) {
      setCodeError('Room codes are 5 characters');
      return;
    }
    setCodeError('');
    navigate(`/live/${cleaned}`);
  };

  const bestScore = stats?.bestScore ?? attempts.reduce((max, attempt) => Math.max(max, attempt.percentage), 0);
  const averageScore = stats?.averageScore ?? 0;

  return (
    <div className="container-page py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name} size="lg" />
          <div>
            <p className="text-sm text-ink-500 dark:text-ink-400">Welcome back</p>
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
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Recent attempts</h2>
            <Link to="/leaderboard" className="link text-sm">
              Leaderboard
            </Link>
          </div>

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
                        className="truncate font-medium transition hover:text-brand-600 dark:hover:text-brand-300"
                      >
                        {attempt.quiz?.title ?? 'Deleted quiz'}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
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
          <h2 className="font-display text-xl font-bold">Join a live room</h2>
          <form onSubmit={joinRoom} className="card mt-4 p-5">
            <label htmlFor="room-code" className="label">
              Room code
            </label>
            <input
              id="room-code"
              value={code}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase());
                setCodeError('');
              }}
              placeholder="ABCDE"
              maxLength={5}
              className="input text-center font-display text-2xl font-bold uppercase tracking-[0.4em]"
              aria-invalid={Boolean(codeError)}
            />
            {codeError ? <p className="mt-1.5 text-xs text-rose-500">{codeError}</p> : null}
            <Button type="submit" className="mt-3 w-full">
              <Radio className="h-4 w-4" /> Join room
            </Button>
            <p className="mt-3 text-xs text-ink-400">
              Ask the host for their 5-character code. No account needed to join as a guest.
            </p>
          </form>
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
