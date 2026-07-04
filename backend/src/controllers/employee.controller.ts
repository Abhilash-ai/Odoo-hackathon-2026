import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { getNextEmployeeId } from './auth.controller';

// Helper for CSV escaping
const escapeCSV = (str: string | null | undefined) => {
  if (str === null || str === undefined) return '';
  const stringVal = String(str);
  if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
    return `"${stringVal.replace(/"/g, '""')}"`;
  }
  return stringVal;
};

export const getEmployees = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string || '';
    const roleFilter = req.query.role as string || '';
    const statusFilter = req.query.status as string || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { employeeId: { contains: search } },
      ];
    }

    if (roleFilter) {
      whereClause.role = roleFilter;
    }

    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    const [employees, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          employeeId: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          phone: true,
          address: true,
          profilePhoto: true,
          emergencyContactName: true,
          emergencyContactRelation: true,
          emergencyContactPhone: true,
          isEmailVerified: true,
          createdAt: true,
        },
        orderBy: { employeeId: 'asc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    res.status(200).json({
      employees,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEmployeeById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    // A user can view their own profile, or an admin can view any
    if (req.user?.role !== 'ADMIN' && req.user?.id !== id) {
      res.status(403).json({ message: 'Access denied. You can only view your own profile.' });
      return;
    }

    const employee = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        address: true,
        profilePhoto: true,
        emergencyContactName: true,
        emergencyContactRelation: true,
        emergencyContactPhone: true,
        isEmailVerified: true,
        createdAt: true,
        documents: true,
        leaveBalance: true,
      },
    });

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error('Get employee by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createEmployee = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { fullName, email, role } = req.body;

    if (!fullName || !email || !role) {
      res.status(400).json({ message: 'Full Name, Email and Role are required' });
      return;
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      res.status(400).json({ message: 'Email address already exists' });
      return;
    }

    // Fetch admin user's company profile to set company prefix
    const admin = await prisma.user.findUnique({
      where: { id: req.user?.id! },
    });

    const companyName = admin?.companyName || 'Company';
    const companyLogo = admin?.companyLogo || null;

    // Auto-generate employee ID
    const employeeId = await getNextEmployeeId(companyName, fullName);

    // Auto-generate temporary password
    const tempPassword = crypto.randomBytes(4).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const employee = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          employeeId,
          fullName,
          email,
          passwordHash,
          role,
          companyName,
          companyLogo,
          isEmailVerified: true, // Direct created by admin, pre-verified
        },
      });

      await tx.leaveBalance.create({
        data: {
          userId: newUser.id,
          paid: 12,
          sick: 10,
          casual: 8,
          unpaid: 0,
        },
      });

      return newUser;
    });

    res.status(201).json({
      message: 'Employee created successfully',
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        email: employee.email,
        role: employee.role,
        status: employee.status,
      },
      credentials: {
        employeeId: employee.employeeId,
        password: tempPassword,
      },
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEmployee = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const isAdmin = req.user?.role === 'ADMIN';
    const isOwner = req.user?.id === id;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    const dataToUpdate: any = {};

    // Standard employee edits (both Owner and Admin can edit)
    const {
      phone,
      address,
      profilePhoto,
      emergencyContactName,
      emergencyContactRelation,
      emergencyContactPhone,
      password,
    } = req.body;

    if (phone !== undefined) dataToUpdate.phone = phone;
    if (address !== undefined) dataToUpdate.address = address;
    if (profilePhoto !== undefined) dataToUpdate.profilePhoto = profilePhoto;
    if (emergencyContactName !== undefined) dataToUpdate.emergencyContactName = emergencyContactName;
    if (emergencyContactRelation !== undefined) dataToUpdate.emergencyContactRelation = emergencyContactRelation;
    if (emergencyContactPhone !== undefined) dataToUpdate.emergencyContactPhone = emergencyContactPhone;

    if (password) {
      if (password.length < 6) {
        res.status(400).json({ message: 'Password must be at least 6 characters long' });
        return;
      }
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    // Admin-only updates
    if (isAdmin) {
      const {
        fullName,
        email,
        employeeId,
        role,
        status,
        baseSalary,
        workingDaysPerWeek,
        hraPercent,
        standardAllowance,
        bonusPercent,
        ltaPercent,
        professionalTax,
        pfPercent,
      } = req.body;

      if (fullName !== undefined) dataToUpdate.fullName = fullName;
      if (role !== undefined) dataToUpdate.role = role;
      if (status !== undefined) dataToUpdate.status = status;
      if (baseSalary !== undefined) dataToUpdate.baseSalary = Number(baseSalary);
      if (workingDaysPerWeek !== undefined) dataToUpdate.workingDaysPerWeek = Number(workingDaysPerWeek);
      if (hraPercent !== undefined) dataToUpdate.hraPercent = Number(hraPercent);
      if (standardAllowance !== undefined) dataToUpdate.standardAllowance = Number(standardAllowance);
      if (bonusPercent !== undefined) dataToUpdate.bonusPercent = Number(bonusPercent);
      if (ltaPercent !== undefined) dataToUpdate.ltaPercent = Number(ltaPercent);
      if (professionalTax !== undefined) dataToUpdate.professionalTax = Number(professionalTax);
      if (pfPercent !== undefined) dataToUpdate.pfPercent = Number(pfPercent);

      if (employeeId !== undefined && employeeId !== existingUser.employeeId) {
        const idCheck = await prisma.user.findUnique({ where: { employeeId } });
        if (idCheck) {
          res.status(400).json({ message: 'Employee ID is already in use by another account' });
          return;
        }
        dataToUpdate.employeeId = employeeId;
      }

      if (email !== undefined && email !== existingUser.email) {
        const emailCheck = await prisma.user.findUnique({ where: { email } });
        if (emailCheck) {
          res.status(400).json({ message: 'Email address is already in use by another account' });
          return;
        }
        dataToUpdate.email = email;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        employeeId: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        address: true,
        profilePhoto: true,
        emergencyContactName: true,
        emergencyContactRelation: true,
        emergencyContactPhone: true,
      },
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      employee: updatedUser,
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteEmployee = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (req.user?.id === id) {
      res.status(400).json({ message: 'You cannot delete your own admin account.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    await prisma.user.delete({ where: { id } });

    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const suspendEmployee = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body; // ACTIVE or SUSPENDED

    if (req.user?.id === id) {
      res.status(400).json({ message: 'You cannot change your own admin account status.' });
      return;
    }

    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      res.status(400).json({ message: 'Invalid status value. Must be ACTIVE or SUSPENDED.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    await prisma.user.update({
      where: { id },
      data: { status },
    });

    res.status(200).json({ message: `Employee status set to ${status} successfully` });
  } catch (error) {
    console.error('Suspend employee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const exportEmployeesCSV = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const employees = await prisma.user.findMany({
      select: {
        employeeId: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        address: true,
        emergencyContactName: true,
        emergencyContactRelation: true,
        emergencyContactPhone: true,
        createdAt: true,
      },
      orderBy: { employeeId: 'asc' },
    });

    let csvContent = 'Employee ID,Full Name,Email,Role,Status,Phone,Address,Emergency Contact,Relationship,Emergency Phone,Date Joined\n';

    employees.forEach((emp) => {
      csvContent += `${escapeCSV(emp.employeeId)},${escapeCSV(emp.fullName)},${escapeCSV(emp.email)},${escapeCSV(emp.role)},${escapeCSV(emp.status)},${escapeCSV(emp.phone)},${escapeCSV(emp.address)},${escapeCSV(emp.emergencyContactName)},${escapeCSV(emp.emergencyContactRelation)},${escapeCSV(emp.emergencyContactPhone)},${escapeCSV(emp.createdAt.toISOString().slice(0, 10))}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=employees_report.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Document actions
export const uploadDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    const { name, url } = req.body; // Mock file upload values

    if (req.user?.role !== 'ADMIN' && req.user?.id !== userId) {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    if (!name || !url) {
      res.status(400).json({ message: 'Document name and URL are required.' });
      return;
    }

    const document = await prisma.document.create({
      data: {
        userId,
        name,
        url,
      },
    });

    res.status(201).json({ message: 'Document uploaded successfully', document });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const docId = req.params.docId as string;

    const doc = await prisma.document.findUnique({ where: { id: docId } });
    if (!doc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    if (req.user?.role !== 'ADMIN' && req.user?.id !== doc.userId) {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    await prisma.document.delete({ where: { id: docId } });

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
