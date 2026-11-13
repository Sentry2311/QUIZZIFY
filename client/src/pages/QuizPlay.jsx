import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  HelpCircle,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import Spinner, { PageLoader } from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { quizApi } from '../lib/api.js';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { useCountdown } from '../hooks/useCountdown.js';
import { cn, difficultyStyles, formatDuration, scoreTone } from '../lib/utils.js';

function ScoreRing({ percentage }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative h-36 w-36">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
        <circle cx="64" cy="64" r={radius} fill="none" strokeWidth="10" className="stroke-ink-200 dark:stroke-white/10" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={percentage >= 80 ? 'stroke-emerald-500' : percentage >= 50 ? 'stroke-amber-500' : 'stroke-rose-500'}
          style={{ transition: 'stroke-dashoffset 900ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-extrabold">{percentage}%</span>
        <span className="text-xs text-ink-500 dark:text-ink-300">score</span>
      </div>
    </div>
  );
}

export default function QuizPlay() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const { data, loading, error } = useApi(`/quizzes/${id}`);
  const quiz = data?.quiz;

  const [phase, setPhase] = useState('intro');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [endsAt, setEndsAt] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const startedAt = useRef(null);
  const questionStartedAt = useRef(null);
  const advanceLock = useRef(false);

  const question = quiz?.questions?.[index];
  const totalSeconds = question?.timeLimitSeconds || quiz?.timeLimitSeconds || 20;
  const { secondsLeft, progress, expired } = useCountdown(phase === 'playing' ? endsAt : null, totalSeconds);

  // Reset when navigating between quizzes.
  useEffect(() => {
    setPhase('intro');
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setResult(null);
    setSubmitError('');
  }, [id]);

  const start = () => {
    if (!isAuthenticated) return;
    setPhase('playing');
    setIndex(0);
    setAnswers([]);
    setSelected(null);
    setResult(null);
    setSubmitError('');
    advanceLock.current = false;
    startedAt.current = Date.now();
    questionStartedAt.current = Date.now();
    setEndsAt(Date.now() + (quiz.questions[0]?.timeLimitSeconds || quiz.timeLimitSeconds || 20) * 1000);
  };

  const submit = useCallback(
    async (finalAnswers) => {
      setPhase('submitting');
      setSubmitting(true);
      setSubmitError('');
      try {
        const { data: response } = await quizApi.submitAttempt(id, {
          answers: finalAnswers,
          durationMs: Date.now() - (startedAt.current || Date.now()),
        });
        setResult(response.data);
        setPhase('result');
        if (response.data.attempt.percentage >= 80) {
          toast.success('Great score!', 'A notification was added to your dashboard.');
        }
      } catch (submitError_) {
        setSubmitError(submitError_.message);
        setPhase('result');
      } finally {
        setSubmitting(false);
      }
    },
    [id, toast],
  );

  const goNext = useCallback(() => {
    if (advanceLock.current || !question) return;
    advanceLock.current = true;

    const timeMs = Date.now() - (questionStartedAt.current || Date.now());
    const nextAnswers = [
      ...answers,
      { questionId: question.id, selectedIndex: selected, timeMs: Math.min(timeMs, totalSeconds * 1000) },
    ];

    setAnswers(nextAnswers);
    if (index + 1 >= quiz.questions.length) {
      submit(nextAnswers);
      return;
    }

    advanceLock.current = false;
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setSelected(null);
    questionStartedAt.current = Date.now();
    setEndsAt(Date.now() + (quiz.questions[nextIndex].timeLimitSeconds || quiz.timeLimitSeconds || 20) * 1000);
  }, [answers, index, question, quiz, selected, submit, totalSeconds]);

  // Auto-advance when the countdown reaches zero.
  useEffect(() => {
    if (phase === 'playing' && expired) goNext();
  }, [expired, phase, goNext]);

  const retake = () => start();

  const reviewMap = useMemo(() => {
    if (!result?.review) return new Map();
    return new Map(result.review.map((item) => [item.questionId, item]));
  }, [result]);

  if (loading) return <PageLoader label="Loading quiz…" />;

  if (error) {
    return (
      <div className="container-page py-16">
        <Alert>{error}</Alert>
        <Button variant="secondary" to="/quizzes" className="mt-4">
          <ArrowLeft className="h-4 w-4" /> Back to quizzes
        </Button>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container-page py-16">
        <EmptyState icon={HelpCircle} title="Quiz not found" description="It may have been unpublished or removed." action={<Button to="/quizzes">Browse quizzes</Button>} />
      </div>
    );
  }

  /* ---------------------------- intro ---------------------------- */
  if (phase === 'intro') {
    return (
      <div className="container-page py-10">
        <Link to="/quizzes" className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition hover:text-brand-600 dark:text-ink-300">
          <ArrowLeft className="h-4 w-4" /> All quizzes
        </Link>

        <div className="card mx-auto mt-6 max-w-3xl overflow-hidden">
          <div className="relative bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 px-6 py-10 text-brand-50 sm:px-10">
            <span className="text-5xl">{quiz.cover}</span>
            <h1 className="mt-4 font-display text-3xl font-extrabold !text-white sm:text-4xl">{quiz.title}</h1>
            <p className="mt-2 max-w-xl text-brand-200">{quiz.description || 'Test your knowledge.'}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-white/15 px-3 py-1 font-medium">{quiz.category}</span>
              <span className="rounded-full bg-white/15 px-3 py-1 font-medium capitalize">{quiz.difficulty}</span>
              <span className="rounded-full bg-white/15 px-3 py-1 font-medium">{quiz.questionCount} questions</span>
              <span className="rounded-full bg-white/15 px-3 py-1 font-medium">{quiz.timeLimitSeconds}s per question</span>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
            <div>
              <h2 className="font-display text-lg font-semibold">How it works</h2>
              <ul className="mt-3 space-y-2.5 text-sm text-ink-600 dark:text-ink-300">
                <li className="flex gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" /> Each question is timed. Answer before the bar empties.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> Answers are graded on the server, then explained.
                </li>
                <li className="flex gap-2">
                  <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> Your score is added to this quiz&apos;s leaderboard.
                </li>
              </ul>
            </div>

            <div className="rounded-xl bg-ink-50 p-5 dark:bg-white/5">
              <p className="text-sm font-medium text-ink-700 dark:text-ink-200">
                {quiz.plays} {quiz.plays === 1 ? 'player has' : 'players have'} attempted this quiz
              </p>
              <p className="mt-1 text-xs text-ink-500 dark:text-ink-300">
                {isAuthenticated
                  ? 'Ready when you are. Good luck!'
                  : 'Sign in so we can save your score and show you the answers.'}
              </p>
              <div className="mt-4">
                {isAuthenticated ? (
                  <Button onClick={start} className="w-full">
                    Start quiz <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <>
                    <Button to="/login" state={{ from: `/quizzes/${id}` }} className="w-full">
                      Sign in to play
                    </Button>
                    <Link to="/register" className="mt-2 block text-center text-xs text-ink-500 hover:text-brand-600 dark:text-ink-300">
                      or create a free account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------- playing ---------------------------- */
  if (phase === 'playing' && question) {
    return (
      <div className="container-page max-w-3xl py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{quiz.title}</p>
            <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-300">
              Question {index + 1} of {quiz.questions.length}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-ink-200 dark:bg-white/5 dark:ring-white/10">
            <Clock className={cn('h-4 w-4', secondsLeft <= 5 ? 'text-rose-500' : 'text-brand-500')} />
            <span className={cn(secondsLeft <= 5 && 'text-rose-500')}>{secondsLeft}s</span>
          </div>
        </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-200 dark:bg-white/10">
          <div
            className={cn('h-full rounded-full transition-[width] duration-300', secondsLeft <= 5 ? 'bg-rose-500' : 'bg-accent-400')}
            style={{ width: `${Math.max(0, progress * 100)}%` }}
          />
        </div>

        <div className="card mt-5 p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold leading-snug">{question.text}</h1>

          <div className="mt-6 grid gap-2.5">
            {question.options.map((option, optionIndex) => (
              <button
                key={optionIndex}
                type="button"
                onClick={() => setSelected(optionIndex)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition',
                  selected === optionIndex
                    ? 'border-brand-500 bg-brand-50 font-semibold text-brand-800 shadow-sm dark:border-brand-400 dark:bg-brand-500/15 dark:text-brand-100'
                    : 'border-ink-200 hover:border-brand-300 hover:bg-ink-50 dark:border-white/10 dark:hover:border-brand-500/50 dark:hover:bg-white/5',
                )}
                aria-pressed={selected === optionIndex}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    selected === optionIndex ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300',
                  )}
                >
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                {option}
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-xs text-ink-500 dark:text-ink-300">
              {selected === null ? 'Pick an answer to continue' : 'You can change your answer until time runs out'}
            </p>
            <Button onClick={goNext} className="min-w-32">
              {index + 1 >= quiz.questions.length ? 'Finish' : 'Next'} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------- submitting ---------------------------- */
  if (phase === 'submitting' || submitting) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Spinner className="h-8 w-8 text-brand-500" />
        <p className="text-sm text-ink-500 dark:text-ink-300">Grading your answers…</p>
      </div>
    );
  }

  /* ---------------------------- result ---------------------------- */
  return (
    <div className="container-page max-w-3xl py-10">
      <div className="card overflow-hidden">
        <div className="flex flex-col items-center gap-6 border-b border-ink-100 px-6 py-8 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{quiz.title}</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold">
              {result ? (result.attempt.percentage >= 80 ? 'Outstanding!' : result.attempt.percentage >= 50 ? 'Nice work!' : 'Keep practising') : 'Attempt saved?'}
            </h1>
            {result ? (
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
                You answered {result.attempt.correctCount} of {result.attempt.totalQuestions} correctly in{' '}
                {formatDuration(result.attempt.durationMs)}.
              </p>
            ) : null}
            {submitError ? <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{submitError}</p> : null}
          </div>
          {result ? (
            <div className="flex flex-col items-center gap-3">
              <ScoreRing percentage={result.attempt.percentage} />
              <span className={cn('text-sm font-semibold', scoreTone(result.attempt.percentage))}>
                {result.attempt.score} points
              </span>
            </div>
          ) : null}
        </div>

        <div className="p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold">Answer review</h2>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
            {result ? 'Correct answers are highlighted with their explanations.' : 'Grading was unavailable, so no review is shown.'}
          </p>

          {result ? (
            <ol className="mt-5 space-y-5">
              {result.review.map((item, questionIndex) => (
                <li key={item.questionId} className="rounded-xl border border-ink-200 p-4 dark:border-white/10">
                  <div className="flex items-start gap-2">
                    {item.isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                    )}
                    <p className="font-medium">
                      {questionIndex + 1}. {item.text}
                    </p>
                  </div>
                  <div className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
                    {item.options.map((option, optionIndex) => (
                      <span
                        key={optionIndex}
                        className={cn(
                          'rounded-lg border px-3 py-2',
                          optionIndex === item.correctIndex
                            ? 'border-emerald-300 bg-emerald-50 font-medium text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
                            : optionIndex === item.selectedIndex
                              ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200'
                              : 'border-ink-200 text-ink-600 dark:border-white/10 dark:text-ink-300',
                        )}
                      >
                        {option}
                        {optionIndex === item.selectedIndex ? <span className="ml-1 text-xs opacity-70">(your answer)</span> : null}
                      </span>
                    ))}
                  </div>
                  {item.explanation ? (
                    <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-600 dark:bg-white/5 dark:text-ink-300">
                      {item.explanation}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : null}

          <div className="mt-7 flex flex-wrap gap-2">
            <Button onClick={retake}>
              <RotateCcw className="h-4 w-4" /> Try again
            </Button>
            <Button variant="secondary" to={`/quizzes/${id}`}>
              Quiz details
            </Button>
            <Button variant="ghost" to="/leaderboard">
              <Trophy className="h-4 w-4" /> Leaderboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
