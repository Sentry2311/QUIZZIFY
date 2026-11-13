import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext.jsx';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // One shared socket for live rooms, chat and notifications.
    const instance = io({
      auth: { token: token || undefined },
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 8,
      reconnectionDelay: 800,
    });

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    instance.on('connect', onConnect);
    instance.on('disconnect', onDisconnect);
    setSocket(instance);

    return () => {
      instance.off('connect', onConnect);
      instance.off('disconnect', onDisconnect);
      instance.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [token]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
