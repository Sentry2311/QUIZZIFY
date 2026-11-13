import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import { attemptRouter, leaderboardRouter } from './routes/attempt.routes.js';
import { errorHandler, notFound } from './middleware/error.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(
    cors({
      origin(origin, callback) {
        // Allow same-origin/no-origin tools (curl, server-to-server) and configured clients.
        if (!origin || env.clientUrls.includes(origin) || !env.isProd) return callback(null, true);
        return callback(new Error('Origin not allowed by CORS'));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.isProd ? 'combined' : 'dev'));
  }

  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests, slow down a little' },
    }),
  );

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, status: 'ok', uptime: Math.round(process.uptime()), env: env.nodeEnv });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/quizzes', quizRoutes);
  app.use('/api/attempts', attemptRouter);
  app.use('/api/leaderboard', leaderboardRouter);
  app.use('/api/admin', adminRoutes);
  app.use('/api/notifications', notificationRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
