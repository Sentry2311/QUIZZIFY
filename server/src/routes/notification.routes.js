import { Router } from 'express';
import { listNotifications, markAllRead, markRead } from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', listNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

export default router;
