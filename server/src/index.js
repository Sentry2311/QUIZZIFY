import http from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { User } from './models/User.js';
import { verifyToken } from './utils/token.js';
import { registerLiveRooms } from './sockets/liveRooms.js';

async function start() {
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);

  const io = new SocketServer(server, {
    cors: { origin: env.isProd ? env.clientUrls : true, credentials: true },
    pingTimeout: 20000,
  });

  // Authenticate socket handshakes; guests may still join rooms with a name.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        const payload = verifyToken(token);
        const user = await User.findById(payload.sub).select('+tokenVersion');
        if (user && (payload.tv ?? 0) === user.tokenVersion) {
          socket.user = { id: user.id, name: user.name, role: user.role };
        }
      }
    } catch {
      socket.user = undefined;
    }
    next();
  });

  registerLiveRooms(io);
  app.set('io', io);

  server.listen(env.port, () => {
    console.log(`[api] Quizzify API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal) => {
    console.log(`[api] ${signal} received, shutting down`);
    io.close();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 8000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
  console.error('[api] failed to start', error);
  process.exit(1);
});
