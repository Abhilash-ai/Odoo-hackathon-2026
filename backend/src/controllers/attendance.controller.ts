import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (d: Date = new Date()) => {
  // Respect user's timezone if sent, otherwise standard server date in YYYY-MM-DD
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const checkIn = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const todayStr = getLocalDateString();
    const now = new Date();

    // Check if user is suspended
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status === 'SUSPENDED') {
      res.status(403).json({ message: 'Account is suspended or does not exist.' });
      return;
    }

    // Check if already checked in today
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: { userId, date: todayStr },
      },
    });

    if (existing) {
      res.status(400).json({ message: 'You have already checked in today.' });
      return;
    }

    // Late Arrival Detection: e.g., after 9:15 AM
    const lateThreshold = new Date(now);
    lateThreshold.setHours(9, 15, 0, 0);
    
    let status = 'PRESENT';
    if (now > lateThreshold) {
      status = 'LATE';
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        date: todayStr,
        checkIn: now,
        status,
        workingHours: 0.0,
      },
    });

    // Create Check-In Notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Checked In Successfully',
        message: `You checked in at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Status: ${status}.`,
        type: 'ATTENDANCE_REMINDER',
      },
    });

    res.status(201).json({ message: 'Clocked in successfully', attendance });
  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const checkOut = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const todayStr = getLocalDateString();
    const now = new Date();

    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: { userId, date: todayStr },
      },
    });

    if (!attendance) {
      res.status(400).json({ message: 'You have not checked in today. Please check in first.' });
      return;
    }

    if (attendance.checkOut) {
      res.status(400).json({ message: 'You have already checked out today.' });
      return;
    }

    const checkInTime = new Date(attendance.checkIn!);
    const diffMs = now.getTime() - checkInTime.getTime();
    const hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    // Update status based on total working hours
    // e.g. < 4 hours is HALF_DAY, otherwise keep original status (PRESENT or LATE)
    let finalStatus = attendance.status;
    if (hours < 4.0) {
      finalStatus = 'HALF_DAY';
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        workingHours: hours,
        status: finalStatus,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Checked Out Successfully',
        message: `You checked out at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Total hours: ${hours} hrs.`,
        type: 'ATTENDANCE_REMINDER',
      },
    });

    res.status(200).json({ message: 'Clocked out successfully', attendance: updated });
  } catch (error) {
    console.error('Check out error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTodayStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const todayStr = getLocalDateString();

    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: { userId, date: todayStr },
      },
    });

    if (!attendance) {
      res.status(200).json({ status: 'ABSENT', checkIn: null, checkOut: null, workingHours: 0 });
      return;
    }

    res.status(200).json(attendance);
  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAttendanceHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = (req.user?.role === 'ADMIN' ? req.query.userId : null) as string || req.user?.id!;
    const month = req.query.month as string; // Expects "YYYY-MM"

    const whereClause: any = { userId: targetUserId };
    if (month) {
      whereClause.date = { contains: month };
    }

    const history = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
    });

    res.status(200).json(history);
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAttendanceStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = (req.user?.role === 'ADMIN' ? req.query.userId : null) as string || req.user?.id!;
    const month = req.query.month as string || getLocalDateString().slice(0, 7); // Default to current month

    const records = await prisma.attendance.findMany({
      where: {
        userId: targetUserId,
        date: { contains: month },
      },
    });

    const totalDays = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const halfDay = records.filter(r => r.status === 'HALF_DAY').length;
    const leave = records.filter(r => r.status === 'LEAVE').length;
    const totalHours = records.reduce((acc, curr) => acc + curr.workingHours, 0);

    res.status(200).json({
      totalDays,
      present,
      late,
      halfDay,
      leave,
      totalHours: parseFloat(totalHours.toFixed(2)),
      averageHours: totalDays > 0 ? parseFloat((totalHours / totalDays).toFixed(2)) : 0,
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAttendanceRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, date, checkIn, checkOut, status, workingHours } = req.body;

    if (!userId || !date || !status) {
      res.status(400).json({ message: 'User ID, date, and status are required' });
      return;
    }

    const record = await prisma.attendance.upsert({
      where: {
        userId_date: { userId, date },
      },
      update: {
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        status,
        workingHours: workingHours ? parseFloat(workingHours) : 0.0,
      },
      create: {
        userId,
        date,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        status,
        workingHours: workingHours ? parseFloat(workingHours) : 0.0,
      },
    });

    res.status(200).json({ message: 'Attendance record updated successfully', record });
  } catch (error) {
    console.error('Update attendance record error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCompanyAttendanceReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const date = req.query.date as string || getLocalDateString();

    const attendanceRecords = await prisma.attendance.findMany({
      where: { date },
      include: {
        user: {
          select: {
            employeeId: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json(attendanceRecords);
  } catch (error) {
    console.error('Get company report error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
