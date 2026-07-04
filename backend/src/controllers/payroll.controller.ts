import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getEmployeePayroll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = (req.user?.role === 'ADMIN' ? req.query.userId : null) as string || req.user?.id!;

    const payrolls = await prisma.payroll.findMany({
      where: { userId: targetUserId },
      orderBy: { month: 'desc' },
    });

    res.status(200).json(payrolls);
  } catch (error) {
    console.error('Get employee payroll error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateSalaryConfig = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, baseSalary, allowances, deductions } = req.body;

    if (!userId || baseSalary === undefined) {
      res.status(400).json({ message: 'User ID and base salary are required' });
      return;
    }

    const employee = await prisma.user.findUnique({ where: { id: userId } });
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        baseSalary: parseFloat(baseSalary),
        allowances: allowances !== undefined ? parseFloat(allowances) : employee.allowances,
        deductions: deductions !== undefined ? parseFloat(deductions) : employee.deductions,
      },
    });

    res.status(200).json({ message: 'Salary configuration updated successfully' });
  } catch (error) {
    console.error('Update salary config error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const generatePayroll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { month, userId } = req.body; // month is "YYYY-MM"

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({ message: 'Valid month is required (format: YYYY-MM)' });
      return;
    }

    const whereClause: any = { status: 'ACTIVE' };
    if (userId) {
      whereClause.id = userId;
    }

    const employees = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        baseSalary: true,
        allowances: true,
        deductions: true,
      },
    });

    if (employees.length === 0) {
      res.status(400).json({ message: 'No active employees found to generate payroll for.' });
      return;
    }

    const payrollRecords = [];

    for (const emp of employees) {
      const netSalary = emp.baseSalary + emp.allowances - emp.deductions;

      const record = await prisma.payroll.upsert({
        where: {
          userId_month: { userId: emp.id, month },
        },
        update: {
          baseSalary: emp.baseSalary,
          allowances: emp.allowances,
          deductions: emp.deductions,
          netSalary: netSalary >= 0 ? netSalary : 0,
        },
        create: {
          userId: emp.id,
          month,
          baseSalary: emp.baseSalary,
          allowances: emp.allowances,
          deductions: emp.deductions,
          netSalary: netSalary >= 0 ? netSalary : 0,
          status: 'PENDING',
        },
      });

      payrollRecords.push(record);

      // Create notification for payroll availability
      await prisma.notification.create({
        data: {
          userId: emp.id,
          title: 'Payslip Available',
          message: `Your payroll payslip for the month ${month} has been generated. Net Salary: $${netSalary.toFixed(2)}.`,
          type: 'PAYROLL',
        },
      });
    }

    res.status(200).json({
      message: `Payroll generated successfully for ${payrollRecords.length} employee(s) for ${month}`,
      payroll: payrollRecords,
    });
  } catch (error) {
    console.error('Generate payroll error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updatePayrollStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body; // PENDING or PAID

    if (!['PENDING', 'PAID'].includes(status)) {
      res.status(400).json({ message: 'Status must be PENDING or PAID' });
      return;
    }

    const payroll = await prisma.payroll.findUnique({ where: { id } });
    if (!payroll) {
      res.status(404).json({ message: 'Payroll record not found' });
      return;
    }

    const updated = await prisma.payroll.update({
      where: { id },
      data: { status },
    });

    res.status(200).json({ message: `Payroll status set to ${status} successfully`, payroll: updated });
  } catch (error) {
    console.error('Update payroll status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPayslip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            fullName: true,
            employeeId: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!payroll) {
      res.status(404).json({ message: 'Payroll record not found' });
      return;
    }

    // Check ownership
    if (req.user?.role !== 'ADMIN' && req.user?.id !== payroll.userId) {
      res.status(403).json({ message: 'Access denied. You can only view your own payslips.' });
      return;
    }

    res.status(200).json(payroll);
  } catch (error) {
    console.error('Get payslip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCompanyPayrollSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const month = req.query.month as string;

    const whereClause: any = {};
    if (month) {
      whereClause.month = month;
    }

    const payrolls = await prisma.payroll.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            fullName: true,
            employeeId: true,
          },
        },
      },
    });

    const totalCost = payrolls.reduce((acc, curr) => acc + curr.netSalary, 0);
    const paidCount = payrolls.filter(p => p.status === 'PAID').length;
    const pendingCount = payrolls.filter(p => p.status === 'PENDING').length;

    res.status(200).json({
      month: month || 'All Time',
      totalCost: parseFloat(totalCost.toFixed(2)),
      paidCount,
      pendingCount,
      payrolls,
    });
  } catch (error) {
    console.error('Get company payroll summary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
