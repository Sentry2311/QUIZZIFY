import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, PenLine, Sparkles, Trophy, Zap } from 'lucide-react';
import Button from '../components/Button.jsx';
import QuizCard from '../components/QuizCard.jsx';
import { CardSkeleton } from '../components/Spinner.jsx';
import Alert from '../components/Alert.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant scoring',
    description: 'Answers are graded on the server the moment you submit, with a full answer review.',
  },
  {
    icon: PenLine,
    title: 'Build your own',
    description: 'Admins create quizzes with a visual question builder, then publish them to everyone.',
  },
  {
    icon: Trophy,
    title: 'Leaderboards',
    description: 'Compare your best scores with everyone else and keep chasing your personal record.',
  },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const { data, loading, error } = useApi('/quizzes', { params: { limit: 3, sort: 'popular' } });
  const quizzes = data?.quizzes ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-accent-200/45 blur-3xl dark:bg-accent-500/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-700/20"
          aria-hidden="true"
        />

        <div className="container-page relative grid gap-12 py-12 lg:grid-cols-2 lg:items-center lg:py-20">
          <div className="animate-fade-up">
            <span className="chip border-accent-300 bg-accent-100 text-brand-900 dark:border-accent-300/40 dark:bg-accent-300/10 dark:text-accent-200">
              <Sparkles className="h-3.5 w-3.5" /> Quiz platform for curious people
            </span>

            <h1 className="mt-5 text-balance font-display text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
              Learn something new,
              <span className="bg-gradient-to-r from-brand-900 to-brand-600 bg-clip-text text-transparent dark:from-accent-200 dark:to-accent-400"> one question </span>
              at a time.
            </h1>

            <p className="mt-5 max-w-xl text-base text-ink-600 dark:text-ink-300 sm:text-lg">
              Quizzify is where curious people take quizzes, see exactly what they got wrong and track how much
              they actually remember.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button to={isAuthenticated ? '/quizzes' : '/register'}>
                Start playing free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" to="/leaderboard">
                <Trophy className="h-4 w-4" /> See leaderboard
              </Button>
            </div>

            <div className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                { label: 'Quizzes', value: total || '10+' },
                { label: 'Per question', value: '20s' },
                { label: 'Ranking', value: 'Global' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-300">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-up lg:justify-self-end" style={{ animationDelay: '120ms' }}>
            <div className="card w-full max-w-md p-6 shadow-lift">
              <div className="flex items-center justify-between">
                <span className="badge bg-accent-100 text-brand-900 dark:bg-accent-300/15 dark:text-accent-200">
                  Question 3 of 5
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-accent-300">
                  <Clock3 className="h-4 w-4" /> 14s
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">Which hook stores local component state?</h3>
              <div className="mt-4 space-y-2.5">
                {['useEffect', 'useState', 'useMemo'].map((option, index) => (
                  <div
                    key={option}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm ${
                      index === 1
                        ? 'border-emerald-400 bg-emerald-50 font-semibold text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'border-ink-200 dark:border-white/10'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        index === 1
                          ? 'bg-emerald-500 text-white'
                          : 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between rounded-xl bg-accent-50 px-4 py-3 text-sm dark:bg-white/5">
                <span className="inline-flex items-center gap-1.5 text-ink-600 dark:text-ink-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Server graded
                </span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">+14 pts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="grid gap-5 sm:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <div key={feature.title} className="card p-6 animate-fade-up" style={{ animationDelay: `${index * 80}ms` }}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-800 dark:bg-accent-300/10 dark:text-accent-300">
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Popular right now</h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">Hand-picked quizzes the community keeps coming back to.</p>
          </div>
          <Link to="/quizzes" className="link inline-flex items-center gap-1 text-sm">
            Browse all quizzes <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6">
          {error ? <Alert>{error}</Alert> : null}
          {loading ? (
            <CardSkeleton count={3} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz, index) => (
                <QuizCard key={quiz.id} quiz={quiz} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="container-page py-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 px-6 py-12 text-center sm:px-12">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent-300/20 blur-2xl"
            aria-hidden="true"
          />
          <h2 className="text-balance font-display text-3xl font-extrabold text-brand-50 sm:text-4xl">
            Ready to test what you know?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-200">
            Pick a quiz, beat the timer and review every answer afterwards. Your scores build a history you can
            track on the dashboard.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button
              to={isAuthenticated ? '/admin/quizzes' : '/register'}
              className="bg-accent-300 text-brand-900 hover:bg-accent-200"
            >
              {isAuthenticated ? 'Create a quiz' : 'Create an account'}
            </Button>
            <Button to="/quizzes" variant="ghost" className="text-brand-100 hover:bg-white/10">
              Explore quizzes
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
