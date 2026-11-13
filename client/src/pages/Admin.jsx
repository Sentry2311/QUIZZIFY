import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Search,
  Shield,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import Avatar from '../components/Avatar.jsx';
import Pagination from '../components/Pagination.jsx';
import Select from '../components/Select.jsx';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { PageLoader } from '../components/Spinner.jsx';
import { adminApi } from '../lib/api.js';
import { useApi } from '../hooks/useApi.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { cn, formatRelative } from '../lib/utils.js';

export default function Admin() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState(null);
  const [usersKey, setUsersKey] = useState(0);
  const debouncedSearch = useDebounce(search, 350);

  const { data: statsData, loading: statsLoading, error: statsError } = useApi('/admin/stats');
  const { data: usersData, loading: usersLoading } = useApi('/admin/users', {
    params: { search: debouncedSearch, page, limit: 8 },
    deps: [usersKey],
  });

  const stats = statsData?.stats;
  const users = usersData?.users ?? [];

  const changeRole = async (target, role) => {
    setUpdating(target.id);
    try {
      await adminApi.updateRole(target.id, role);
      toast.success('Role updated', `${target.name} is now ${role === 'admin' ? 'an admin' : 'a player'}.`);
      setUsersKey((key) => key + 1);
    } catch (error) {
      toast.error('Could not update role', error.message);
    } finally {
      setUpdating(null);
    }
  };

  if (statsLoading && !statsData) return <PageLoader label="Loading admin dashboard…" />;

  return (
    <div className="container-page py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="chip border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold">Platform overview</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
            Manage quizzes, watch activity and promote moderators.
          </p>
        </div>
        <Button to="/admin/quizzes">
          <BookOpen className="h-4 w-4" /> Manage quizzes
        </Button>
      </div>

      {statsError ? <Alert className="mt-4">{statsError}</Alert> : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Users" value={stats?.users ?? 0} hint="Registered accounts" />
        <StatCard icon={BookOpen} label="Quizzes" value={stats?.quizzes ?? 0} hint="Created on the platform" tone="emerald" />
        <StatCard icon={Target} label="Attempts" value={stats?.attempts ?? 0} hint="Total submissions" tone="amber" />
        <StatCard icon={BarChart3} label="Average score" value={`${stats?.averageScore ?? 0}%`} hint="Across all attempts" tone="rose" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <h2 className="font-display text-lg font-bold">Top quizzes</h2>
          <ul className="mt-4 space-y-3">
            {(statsData?.topQuizzes ?? []).length === 0 ? (
              <li className="text-sm text-ink-400 dark:text-ink-300">No quizzes yet.</li>
            ) : (
              statsData.topQuizzes.map((quiz, index) => (
                <li key={quiz.id} className="flex items-center gap-3">
                  <span className="w-4 text-xs font-bold text-ink-400 dark:text-ink-300">{index + 1}</span>
                  <span className="text-xl">{quiz.cover}</span>
                  <div className="min-w-0 flex-1">
                    <Link to={`/quizzes/${quiz.id}`} className="block truncate text-sm font-medium hover:text-brand-600 dark:hover:text-brand-300">
                      {quiz.title}
                    </Link>
                    <p className="text-xs text-ink-400 dark:text-ink-300">{quiz.category}</p>
                  </div>
                  <span className="text-xs font-semibold text-ink-500 dark:text-ink-300">{quiz.plays} plays</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-bold">Recent activity</h2>
          <ul className="mt-4 space-y-3">
            {(statsData?.recentAttempts ?? []).length === 0 ? (
              <li className="text-sm text-ink-400 dark:text-ink-300">No attempts recorded yet.</li>
            ) : (
              statsData.recentAttempts.map((attempt) => (
                <li key={attempt.id} className="flex items-center gap-3 border-b border-ink-100 pb-3 last:border-0 last:pb-0 dark:border-white/5">
                  <Avatar name={attempt.user} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="font-medium">{attempt.user}</span>{' '}
                      <span className="text-ink-500 dark:text-ink-300">scored {attempt.percentage}% on</span>{' '}
                      <span className="font-medium">{attempt.quiz}</span>
                    </p>
                    <p className="text-xs text-ink-400 dark:text-ink-300">{formatRelative(attempt.createdAt)}</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <section className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Users</h2>
            <p className="text-sm text-ink-500 dark:text-ink-300">Promote players to admin or back again.</p>
          </div>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 dark:text-ink-300" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name or email…"
              className="input pl-9"
              aria-label="Search users"
            />
          </div>
        </div>

        <div className="mt-4">
          {usersLoading ? (
            <PageLoader label="Loading users…" />
          ) : users.length === 0 ? (
            <EmptyState icon={Users} title="No users found" description="Try a different search term." />
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-500 dark:border-white/10 dark:bg-white/5 dark:text-ink-300">
                    <tr>
                      <th className="px-5 py-3 font-semibold">User</th>
                      <th className="px-5 py-3 font-semibold">Role</th>
                      <th className="px-5 py-3 font-semibold">Joined</th>
                      <th className="px-5 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100 dark:divide-white/5">
                    {users.map((row) => {
                      const isSelf = row.id === currentUser?.id;
                      return (
                        <tr key={row.id} className="transition hover:bg-ink-50/70 dark:hover:bg-white/5">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={row.name} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {row.name} {isSelf ? <span className="text-xs text-ink-400 dark:text-ink-300">(you)</span> : null}
                                </p>
                                <p className="truncate text-xs text-ink-400 dark:text-ink-300">{row.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={cn(
                                'badge',
                                row.role === 'admin'
                                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                                  : 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300',
                              )}
                            >
                              {row.role === 'admin' ? <Shield className="h-3 w-3" /> : null}
                              {row.role}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-ink-500 dark:text-ink-300">{formatRelative(row.createdAt)}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => changeRole(row, row.role === 'admin' ? 'user' : 'admin')}
                              disabled={isSelf || updating === row.id}
                              className="btn-secondary px-3 py-1.5 text-xs"
                              title={isSelf ? 'You cannot change your own role' : undefined}
                            >
                              {updating === row.id
                                ? 'Saving…'
                                : row.role === 'admin'
                                  ? 'Make player'
                                  : 'Make admin'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Pagination page={usersData?.page ?? page} pages={usersData?.pages ?? 1} onChange={setPage} />
        </div>
      </section>
    </div>
  );
}
