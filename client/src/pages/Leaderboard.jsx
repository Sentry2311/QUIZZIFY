import { useState } from 'react';
import { Crown, Medal, Trophy } from 'lucide-react';
import Avatar from '../components/Avatar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Alert from '../components/Alert.jsx';
import Select from '../components/Select.jsx';
import { PageLoader } from '../components/Spinner.jsx';
import { useApi } from '../hooks/useApi.js';
import { cn } from '../lib/utils.js';

const RANK_STYLES = {
  0: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  1: 'bg-ink-200 text-ink-700 dark:bg-white/15 dark:text-ink-100',
  2: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
};

export default function Leaderboard() {
  const [tab, setTab] = useState('global');
  const [quizId, setQuizId] = useState('');

  const { data: quizList } = useApi('/quizzes', { params: { limit: 50 } });
  const url = tab === 'global' ? '/leaderboard' : quizId ? `/quizzes/${quizId}/leaderboard` : null;
  const { data, loading, error } = useApi(url, { deps: [tab, quizId] });

  const rows = data?.leaderboard ?? [];

  return (
    <div className="container-page py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Leaderboard</h1>
          <p className="mt-2 text-ink-500 dark:text-ink-400">
            {tab === 'global'
              ? 'Ranked by average score across every attempt.'
              : 'Best attempt per player for the selected quiz.'}
          </p>
        </div>

        <div className="flex gap-2 rounded-xl border border-ink-200 bg-white p-1 dark:border-white/10 dark:bg-white/5">
          <button
            type="button"
            onClick={() => setTab('global')}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold transition',
              tab === 'global' ? 'bg-brand-600 text-white' : 'text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white',
            )}
          >
            Global
          </button>
          <button
            type="button"
            onClick={() => setTab('quiz')}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold transition',
              tab === 'quiz' ? 'bg-brand-600 text-white' : 'text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white',
            )}
          >
            By quiz
          </button>
        </div>
      </div>

      {tab === 'quiz' ? (
        <div className="mt-5 max-w-sm">
          <Select
            label="Choose a quiz"
            value={quizId}
            onChange={(event) => setQuizId(event.target.value)}
          >
            <option value="">Select a quiz…</option>
            {(quizList?.quizzes ?? []).map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <div className="mt-6">
        {error ? <Alert>{error}</Alert> : null}

        {loading ? (
          <PageLoader label="Crunching the numbers…" />
        ) : tab === 'quiz' && !quizId ? (
          <EmptyState icon={Trophy} title="Pick a quiz" description="Select a quiz above to see its top players." />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No scores yet"
            description="Be the first to set a score and claim the top spot."
          />
        ) : (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              {rows.slice(0, 3).map((row, index) => (
                <div
                  key={row.userId}
                  className={cn(
                    'card flex flex-col items-center p-6 text-center',
                    index === 0 && 'border-amber-300 ring-1 ring-amber-200 dark:border-amber-500/40 dark:ring-amber-500/20',
                  )}
                >
                  <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', RANK_STYLES[index])}>
                    {index === 0 ? <Crown className="h-5 w-5" /> : <Medal className="h-5 w-5" />}
                  </span>
                  <Avatar name={row.name} size="lg" className="mt-3" />
                  <p className="mt-2 font-display font-semibold">{row.name}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">
                    {tab === 'global' ? `${row.attempts} attempts` : `${row.score} points`}
                  </p>
                  <p className="mt-2 font-display text-2xl font-bold text-brand-600 dark:text-brand-400">
                    {tab === 'global' ? `${row.averageScore}%` : `${row.percentage}%`}
                  </p>
                </div>
              ))}
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-500 dark:border-white/10 dark:bg-white/5 dark:text-ink-400">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Rank</th>
                      <th className="px-5 py-3 font-semibold">Player</th>
                      {tab === 'global' ? (
                        <>
                          <th className="px-5 py-3 font-semibold">Attempts</th>
                          <th className="px-5 py-3 font-semibold">Avg score</th>
                          <th className="px-5 py-3 font-semibold">Best</th>
                        </>
                      ) : (
                        <>
                          <th className="px-5 py-3 font-semibold">Score</th>
                          <th className="px-5 py-3 font-semibold">Accuracy</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100 dark:divide-white/5">
                    {rows.map((row, index) => (
                      <tr key={row.userId} className="transition hover:bg-ink-50/70 dark:hover:bg-white/5">
                        <td className="px-5 py-3 font-semibold">#{index + 1}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={row.name} size="sm" />
                            <span className="font-medium">{row.name}</span>
                          </div>
                        </td>
                        {tab === 'global' ? (
                          <>
                            <td className="px-5 py-3 text-ink-500 dark:text-ink-400">{row.attempts}</td>
                            <td className="px-5 py-3 font-semibold">{row.averageScore}%</td>
                            <td className="px-5 py-3">{row.bestScore}%</td>
                          </>
                        ) : (
                          <>
                            <td className="px-5 py-3">{row.score} pts</td>
                            <td className="px-5 py-3 font-semibold">{row.percentage}%</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
