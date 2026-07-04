import { Router } from 'express';
import {
  getEmployeeDashboard,
  getAdminDashboard,
  createAnnouncement,
  globalSearch,
} from '../controllers/dashboard.controller';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/employee', getEmployeeDashboard);
router.get('/admin', requireRole(['ADMIN']), getAdminDashboard);
router.post('/announcements', requireRole(['ADMIN']), createAnnouncement);
router.get('/search', globalSearch);

export default router;
