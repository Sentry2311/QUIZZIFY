import { Router } from 'express';
import {
  createQuiz,
  deleteQuiz,
  getQuiz,
  listCategories,
  listMyQuizzes,
  listQuizzes,
  quizLeaderboard,
  updateQuiz,
} from '../controllers/quiz.controller.js';
import { submitAttempt } from '../controllers/attempt.controller.js';
import { authorize, optionalAuth, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createQuizSchema, listQuizzesSchema, updateQuizSchema } from '../validators/quiz.validators.js';
import { submitAttemptSchema } from '../validators/attempt.validators.js';

const router = Router();

router.get('/', validate(listQuizzesSchema, 'query'), listQuizzes);
router.get('/categories', listCategories);
router.get('/mine', protect, listMyQuizzes);
router.get('/:id/leaderboard', quizLeaderboard);
router.get('/:id', optionalAuth, getQuiz);

router.post('/', protect, authorize('admin'), validate(createQuizSchema), createQuiz);
router.put('/:id', protect, validate(updateQuizSchema), updateQuiz);
router.delete('/:id', protect, deleteQuiz);

router.post('/:id/attempts', protect, validate(submitAttemptSchema), submitAttempt);

export default router;
