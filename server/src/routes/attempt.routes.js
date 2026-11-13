import { Router } from 'express';
import { globalLeaderboard, myAttempts } from '../controllers/attempt.controller.js';
import { protect } from '../middleware/auth.js';

export const attemptRouter = Router();
attemptRouter.get('/mine', protect, myAttempts);

export const leaderboardRouter = Router();
leaderboardRouter.get('/', globalLeaderboard);
