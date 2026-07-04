import { Router } from 'express';
import {
  getEmployeePayroll,
  updateSalaryConfig,
  generatePayroll,
  updatePayrollStatus,
  getPayslip,
  getCompanyPayrollSummary,
} from '../controllers/payroll.controller';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/my-payroll', getEmployeePayroll);
router.get('/payslip/:id', getPayslip);

// Admin-only endpoints
router.put('/salary-config', requireRole(['ADMIN']), updateSalaryConfig);
router.post('/generate', requireRole(['ADMIN']), generatePayroll);
router.put('/status/:id', requireRole(['ADMIN']), updatePayrollStatus);
router.get('/summary', requireRole(['ADMIN']), getCompanyPayrollSummary);

export default router;
