import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi, TOKEN_KEY } from '../lib/api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStats(null);
  }, []);

  // Validate the stored token once on boot and whenever it changes.
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    authApi
      .me()
      .then(({ data }) => {
        if (!active) return;
        setUser(data.data.user);
        setStats(data.data.stats);
      })
      .catch(() => {
        if (active) clearSession();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, clearSession]);

  // The API client emits this when any request comes back 401.
  useEffect(() => {
    const handler = () => clearSession();
    window.addEventListener('quizzify:unauthorized', handler);
    return () => window.removeEventListener('quizzify:unauthorized', handler);
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    localStorage.setItem(TOKEN_KEY, data.data.token);
    setToken(data.data.token);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload);
    localStorage.setItem(TOKEN_KEY, data.data.token);
    setToken(data.data.token);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Logging out locally still succeeds if the API is unreachable.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const refresh = useCallback(async () => {
    const { data } = await authApi.me();
    setUser(data.data.user);
    setStats(data.data.stats);
    return data.data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      stats,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refresh,
      setUser,
    }),
    [user, token, stats, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
