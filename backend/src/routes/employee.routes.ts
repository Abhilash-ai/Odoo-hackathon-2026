import { Router } from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  suspendEmployee,
  exportEmployeesCSV,
  uploadDocument,
  deleteDocument,
} from '../controllers/employee.controller';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', requireRole(['ADMIN']), getEmployees);
router.get('/export', requireRole(['ADMIN']), exportEmployeesCSV);
router.get('/:id', getEmployeeById);
router.post('/', requireRole(['ADMIN']), createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', requireRole(['ADMIN']), deleteEmployee);
router.put('/:id/status', requireRole(['ADMIN']), suspendEmployee);

// Documents
router.post('/documents', uploadDocument);
router.delete('/documents/:docId', deleteDocument);

export default router;
