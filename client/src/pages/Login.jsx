import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, LogIn, Mail, Sparkles } from 'lucide-react';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import Alert from '../components/Alert.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { validateAuthForm } from '../lib/utils.js';

const DEMO_ACCOUNTS = [
  { label: 'Player', email: 'player@quizzify.dev', password: 'player123' },
  { label: 'Admin', email: 'admin@quizzify.dev', password: 'admin123' },
];

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
    setErrors((current) => ({ ...current, ...Object.fromEntries(Object.keys(patch).map((key) => [key, undefined])) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');
    const validation = validateAuthForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setForm({ email: account.email, password: account.password });
    setErrors({});
  };

  return (
    <div className="container-page flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-2">
        <div className="hidden flex-col justify-center lg:flex">
          <span className="chip w-fit border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
            <Sparkles className="h-3.5 w-3.5" /> Welcome back
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight">
            Pick up where you left off.
          </h1>
          <p className="mt-3 max-w-md text-ink-600 dark:text-ink-300">
            Your attempts, best scores and leaderboard position are waiting. Sign in to keep your history in sync.
          </p>

          <div className="mt-8 rounded-2xl border border-dashed border-ink-300 p-5 dark:border-white/15">
            <p className="text-sm font-semibold">Sample accounts from the seed data</p>
            <div className="mt-3 grid gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-left text-sm transition hover:bg-brand-50 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <span className="font-medium">{account.label}</span>
                  <span className="text-xs text-ink-500 dark:text-ink-300">{account.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card mx-auto w-full max-w-md p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold">Sign in</h2>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">Enter your details to access your dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {serverError ? <Alert>{serverError}</Alert> : null}

            <Input
              label="Email"
              type="email"
              icon={Mail}
              autoComplete="email"
              value={form.email}
              onChange={(event) => set({ email: event.target.value })}
              placeholder="you@example.com"
              error={errors.email}
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => set({ password: event.target.value })}
              placeholder="••••••••"
              error={errors.password}
            />

            <Button type="submit" className="w-full" loading={loading}>
              <LogIn className="h-4 w-4" /> Sign in
            </Button>
          </form>

          <div className="mt-5 space-y-3 text-sm">
            <p className="text-ink-500 dark:text-ink-300">
              New to Quizzify?{' '}
              <Link to="/register" className="link">
                Create an account
              </Link>
            </p>
            <div className="grid grid-cols-2 gap-2 lg:hidden">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="rounded-lg border border-ink-200 px-3 py-2 text-xs font-medium transition hover:border-brand-300 dark:border-white/10"
                >
                  Use {account.label.toLowerCase()} demo
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
