import { Router } from 'express';
import { getStats, listUsers, updateUserRole } from '../controllers/admin.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect, authorize('admin'));
router.get('/stats', getStats);
router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);

export default router;
