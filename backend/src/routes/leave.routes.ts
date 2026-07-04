import { Router } from 'express';
import {
  applyLeave,
  getEmployeeLeaves,
  getAllLeaveRequests,
  handleLeaveAction,
  getLeaveAnalytics,
} from '../controllers/leave.controller';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.post('/apply', applyLeave);
router.get('/my-leaves', getEmployeeLeaves);

// Admin-only endpoints
router.get('/requests', requireRole(['ADMIN']), getAllLeaveRequests);
router.put('/:id/action', requireRole(['ADMIN']), handleLeaveAction);
router.get('/analytics', requireRole(['ADMIN']), getLeaveAnalytics);

export default router;
