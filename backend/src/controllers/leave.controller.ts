import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const applyLeave = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const { leaveType, startDate, endDate, reason, attachmentUrl } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      res.status(400).json({ message: 'Leave type, start date, end date, and reason are required' });
      return;
    }

    if (!['PAID', 'SICK', 'CASUAL', 'UNPAID'].includes(leaveType)) {
      res.status(400).json({ message: 'Invalid leave type. Must be PAID, SICK, CASUAL, or UNPAID.' });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      res.status(400).json({ message: 'End date cannot be earlier than start date.' });
      return;
    }

    // Calculate days: difference in milliseconds converted to days (+ 1 day inclusive)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysRequested = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check balance
    const balance = await prisma.leaveBalance.findUnique({ where: { userId } });
    if (!balance) {
      res.status(404).json({ message: 'Leave balance record not found.' });
      return;
    }

    if (leaveType !== 'UNPAID') {
      const typeKey = leaveType.toLowerCase() as 'paid' | 'sick' | 'casual';
      const available = balance[typeKey];
      if (available < daysRequested) {
        res.status(400).json({
          message: `Insufficient leave balance. You requested ${daysRequested} days, but you only have ${available} days of ${leaveType} leave left.`,
        });
        return;
      }
    }

    const request = await prisma.leaveRequest.create({
      data: {
        userId,
        leaveType,
        startDate: start,
        endDate: end,
        reason,
        attachmentUrl,
        status: 'PENDING',
      },
    });

    res.status(201).json({ message: 'Leave request submitted successfully', request });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEmployeeLeaves = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = (req.user?.role === 'ADMIN' ? req.query.userId : null) as string || req.user?.id!;

    const leaves = await prisma.leaveRequest.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
    });

    const balance = await prisma.leaveBalance.findUnique({
      where: { userId: targetUserId },
    });

    res.status(200).json({ leaves, balance });
  } catch (error) {
    console.error('Get employee leaves error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllLeaveRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const requests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            fullName: true,
            employeeId: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const handleLeaveAction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status, comment } = req.body; // APPROVED or REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ message: 'Status must be APPROVED or REJECTED' });
      return;
    }

    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!request) {
      res.status(404).json({ message: 'Leave request not found' });
      return;
    }

    if (request.status !== 'PENDING') {
      res.status(400).json({ message: `Leave request has already been ${request.status.toLowerCase()}.` });
      return;
    }

    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (status === 'APPROVED') {
      // 1. Deduct leave balance
      if (request.leaveType !== 'UNPAID') {
        const balance = await prisma.leaveBalance.findUnique({
          where: { userId: request.userId },
        });

        if (!balance) {
          res.status(404).json({ message: 'Leave balance record not found.' });
          return;
        }

        const typeKey = request.leaveType.toLowerCase() as 'paid' | 'sick' | 'casual';
        const newBalance = Math.max(0, balance[typeKey] - days);

        await prisma.leaveBalance.update({
          where: { userId: request.userId },
          data: { [typeKey]: newBalance },
        });
      }

      // 2. Automatically record leave status in Attendance history for each day of the leave duration
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().slice(0, 10);
        
        await prisma.attendance.upsert({
          where: {
            userId_date: { userId: request.userId, date: dateStr },
          },
          update: {
            status: 'LEAVE',
            workingHours: 0.0,
            checkIn: null,
            checkOut: null,
          },
          create: {
            userId: request.userId,
            date: dateStr,
            status: 'LEAVE',
            workingHours: 0.0,
          },
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // 3. Update status of request
    const updatedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        comment: comment || null,
      },
    });

    // 4. Send Notification
    await prisma.notification.create({
      data: {
        userId: request.userId,
        title: `Leave Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
        message: `Your leave request for ${days} days (${request.leaveType}) starting ${start.toLocaleDateString()} has been ${status.toLowerCase()}.${comment ? ` Comment: "${comment}"` : ''}`,
        type: 'LEAVE_STATUS',
      },
    });

    res.status(200).json({ message: `Leave request ${status.toLowerCase()} successfully`, request: updatedRequest });
  } catch (error) {
    console.error('Handle leave action error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getLeaveAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const [allRequests, activeLeaves] = await prisma.$transaction([
      prisma.leaveRequest.findMany({
        include: {
          user: {
            select: {
              fullName: true,
              employeeId: true,
            },
          },
        },
      }),
      // Find users whose leaves cover the current date
      prisma.leaveRequest.findMany({
        where: {
          status: 'APPROVED',
          startDate: { lte: today },
          endDate: { gte: today },
        },
        include: {
          user: {
            select: {
              fullName: true,
              employeeId: true,
              profilePhoto: true,
            },
          },
        },
      }),
    ]);

    const totalRequests = allRequests.length;
    const pending = allRequests.filter(r => r.status === 'PENDING').length;
    const approved = allRequests.filter(r => r.status === 'APPROVED').length;
    const rejected = allRequests.filter(r => r.status === 'REJECTED').length;

    // Leave counts by type
    const types = {
      PAID: allRequests.filter(r => r.leaveType === 'PAID').length,
      SICK: allRequests.filter(r => r.leaveType === 'SICK').length,
      CASUAL: allRequests.filter(r => r.leaveType === 'CASUAL').length,
      UNPAID: allRequests.filter(r => r.leaveType === 'UNPAID').length,
    };

    res.status(200).json({
      totalRequests,
      pending,
      approved,
      rejected,
      types,
      employeesOnLeaveToday: activeLeaves.map(al => ({
        id: al.userId,
        fullName: al.user.fullName,
        employeeId: al.user.employeeId,
        profilePhoto: al.user.profilePhoto,
        leaveType: al.leaveType,
        dates: `${new Date(al.startDate).toLocaleDateString()} - ${new Date(al.endDate).toLocaleDateString()}`,
      })),
    });
  } catch (error) {
    console.error('Leave analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
