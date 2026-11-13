import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { notificationApi } from '../lib/api.js';
import { useAuth } from '../hooks/useAuth.js';
import { useSocket } from '../hooks/useSocket.js';

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { token } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await notificationApi.list();
      setNotifications(data.data.notifications);
      setUnread(data.data.unread);
    } catch {
      // A failed notification fetch should never break the page.
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnread(0);
      return;
    }
    load();
  }, [token, load]);

  // Realtime push from the server (attempt results, achievements, admin broadcasts).
  useEffect(() => {
    if (!socket) return undefined;
    const onNotification = (notification) => {
      setNotifications((current) => [notification, ...current].slice(0, 30));
      setUnread((current) => current + 1);
    };
    socket.on('notification', onNotification);
    return () => socket.off('notification', onNotification);
  }, [socket]);

  const markAllRead = useCallback(async () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnread(0);
    await notificationApi.markAllRead().catch(() => {});
  }, []);

  const markRead = useCallback(async (id) => {
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    setUnread((current) => Math.max(0, current - 1));
    await notificationApi.markRead(id).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ notifications, unread, loading, reload: load, markAllRead, markRead }),
    [notifications, unread, loading, load, markAllRead, markRead],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
