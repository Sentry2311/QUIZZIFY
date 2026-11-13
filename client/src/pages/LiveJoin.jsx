import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Sparkles, Users, Zap } from 'lucide-react';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function LiveJoin() {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const cleaned = code.trim().toUpperCase();
    if (cleaned.length < 4) {
      setError('Enter the 5-character room code');
      return;
    }
    if (!isAuthenticated && name.trim().length < 2) {
      setError('Enter a display name so the host knows who you are');
      return;
    }
    setError('');
    navigate(`/live/${cleaned}`, { state: { name: name.trim() } });
  };

  return (
    <div className="container-page py-12">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="chip border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
            <Radio className="h-3.5 w-3.5" /> Live quiz rooms
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight">
            Everyone answers.
            <br />
            The scoreboard moves in real time.
          </h1>
          <p className="mt-4 max-w-md text-ink-600 dark:text-ink-300">
            Join with a code from your host, answer each question before the timer runs out and chat with the room
            between rounds.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Zap, title: 'Instant', text: 'Live scores' },
              { icon: Users, title: 'Up to', text: 'Unlimited players' },
              { icon: Sparkles, title: 'Zero', text: 'Setup for guests' },
            ].map((item) => (
              <div key={item.title}>
                <item.icon className="h-5 w-5 text-brand-500" />
                <p className="mt-2 text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold">Join a room</h2>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Ask the host for the 5-character code.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="live-code" className="label">
                Room code
              </label>
              <input
                id="live-code"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5));
                  setError('');
                }}
                placeholder="ABCDE"
                inputMode="text"
                autoComplete="off"
                className="input text-center font-display text-3xl font-extrabold uppercase tracking-[0.5em]"
                aria-invalid={Boolean(error)}
              />
            </div>

            {!isAuthenticated ? (
              <Input
                label="Display name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError('');
                }}
                placeholder="Guest player"
                maxLength={24}
              />
            ) : (
              <p className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-800 dark:bg-brand-500/10 dark:text-brand-200">
                Playing as <strong>{user?.name}</strong>
              </p>
            )}

            {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}

            <Button type="submit" className="w-full">
              <Radio className="h-4 w-4" /> Join room
            </Button>
          </form>

          {isAdmin ? (
            <div className="mt-6 border-t border-ink-100 pt-5 dark:border-white/10">
              <p className="text-sm font-medium">Hosting instead?</p>
              <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                Pick one of your quizzes and share the generated code.
              </p>
              <Button variant="secondary" to="/admin/quizzes" className="mt-3 w-full">
                Host a quiz
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
