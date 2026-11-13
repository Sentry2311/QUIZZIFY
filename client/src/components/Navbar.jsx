import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  CheckCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Radio,
  Shield,
  Sun,
  Trophy,
  X,
} from 'lucide-react';
import Avatar from './Avatar.jsx';
import Button from './Button.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../hooks/useTheme.js';
import { useToast } from '../hooks/useToast.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { cn, formatRelative } from '../lib/utils.js';

const LINKS = [
  { to: '/quizzes', label: 'Quizzes', icon: BookOpen },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/live', label: 'Live', icon: Radio },
];

function navClass({ isActive }) {
  return cn(
    'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
      : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white',
  );
}

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unread, markAllRead } = useNotifications();
  const toast = useToast();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menu, setMenu] = useState(null); // 'user' | 'bell' | null
  const headerRef = useRef(null);

  useEffect(() => {
    const onClick = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) setMenu(null);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setMenu(null);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setMenu(null);
    setMobileOpen(false);
    toast.success('Signed out', 'See you again soon!');
    navigate('/');
  };

  const links = [
    ...LINKS,
    ...(isAuthenticated ? [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-ink-950/80"
    >
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-lg font-bold text-white shadow-sm">
            Q
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">Quizzify</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass}>
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {isAuthenticated ? (
            <>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenu(menu === 'bell' ? null : 'bell')}
                  className="relative rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
                >
                  <Bell className="h-5 w-5" />
                  {unread > 0 ? (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  ) : null}
                </button>

                {menu === 'bell' ? (
                  <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-soft animate-pop-in dark:border-white/10 dark:bg-ink-900">
                    <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5 dark:border-white/10">
                      <p className="text-sm font-semibold">Notifications</p>
                      {unread > 0 ? (
                        <button
                          type="button"
                          onClick={markAllRead}
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                        >
                          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                        </button>
                      ) : null}
                    </div>
                    <div className="max-h-80 divide-y divide-ink-100 overflow-y-auto dark:divide-white/5">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-ink-400">Nothing here yet.</p>
                      ) : (
                        notifications.map((item) => (
                          <div
                            key={item.id}
                            className={cn('px-4 py-3 text-sm', !item.read && 'bg-brand-50/60 dark:bg-brand-500/5')}
                          >
                            <p className="font-medium">{item.title}</p>
                            <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{item.message}</p>
                            <p className="mt-1 text-[11px] text-ink-400">{formatRelative(item.createdAt)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setMenu(menu === 'user' ? null : 'user')}
                  className="flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-ink-100 dark:hover:bg-white/10"
                >
                  <Avatar name={user?.name} size="sm" />
                  <span className="max-w-24 truncate text-sm font-medium">{user?.name?.split(' ')[0]}</span>
                </button>

                {menu === 'user' ? (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-soft animate-pop-in dark:border-white/10 dark:bg-ink-900">
                    <div className="border-b border-ink-100 px-4 py-3 dark:border-white/10">
                      <p className="truncate text-sm font-semibold">{user?.name}</p>
                      <p className="truncate text-xs text-ink-500 dark:text-ink-400">{user?.email}</p>
                      <span className="badge mt-2 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                        {user?.role}
                      </span>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setMenu(null)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-ink-50 dark:hover:bg-white/5"
                    >
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" to="/login">
                Log in
              </Button>
              <Button to="/register">Sign up free</Button>
            </div>
          )}

          <button
            type="button"
            className="rounded-lg p-2 text-ink-600 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-white/10 lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-ink-200/70 bg-white px-4 pb-4 pt-2 dark:border-white/10 dark:bg-ink-950 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={navClass} onClick={() => setMobileOpen(false)}>
                <link.icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-3 border-t border-ink-100 pt-3 dark:border-white/10">
            {isAuthenticated ? (
              <Button variant="secondary" className="w-full" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" to="/login" onClick={() => setMobileOpen(false)}>
                  Log in
                </Button>
                <Button to="/register" onClick={() => setMobileOpen(false)}>
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
