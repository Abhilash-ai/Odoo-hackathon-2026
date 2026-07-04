import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getTodayStatus,
  getAttendanceHistory,
  getAttendanceStats,
  updateAttendanceRecord,
  getCompanyAttendanceReport,
} from '../controllers/attendance.controller';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', getTodayStatus);
router.get('/history', getAttendanceHistory);
router.get('/stats', getAttendanceStats);

// Admin-only endpoints
router.put('/record', requireRole(['ADMIN']), updateAttendanceRecord);
router.get('/report', requireRole(['ADMIN']), getCompanyAttendanceReport);

export default router;
