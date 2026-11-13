import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, UserPlus, UserRound } from 'lucide-react';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import Alert from '../components/Alert.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { validateAuthForm } from '../lib/utils.js';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
    const validation = validateAuthForm(form, { requireName: true });
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`You're in, ${user.name.split(' ')[0]}!`, 'Your account is ready.');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="card mx-auto w-full max-w-md p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
          Free forever. Track your scores and climb the leaderboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {serverError ? <Alert>{serverError}</Alert> : null}

          <Input
            label="Full name"
            icon={UserRound}
            autoComplete="name"
            value={form.name}
            onChange={(event) => set({ name: event.target.value })}
            placeholder="Alex Johnson"
            error={errors.name}
          />

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
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => set({ password: event.target.value })}
            placeholder="At least 6 characters"
            hint="Use 6+ characters. Passwords are hashed with bcrypt."
            error={errors.password}
          />

          <Button type="submit" className="w-full" loading={loading}>
            <UserPlus className="h-4 w-4" /> Create account
          </Button>
        </form>

        <p className="mt-5 text-sm text-ink-500 dark:text-ink-300">
          Already have an account?{' '}
          <Link to="/login" className="link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
