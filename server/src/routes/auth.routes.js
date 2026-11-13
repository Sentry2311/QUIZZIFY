import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, me, register, updateProfile } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, profileSchema, registerSchema } from '../validators/auth.validators.js';

const router = Router();

// Brute-force protection on credential endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', protect, me);
router.patch('/profile', protect, validate(profileSchema), updateProfile);
router.post('/logout', protect, logout);

export default router;
