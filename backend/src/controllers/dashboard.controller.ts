import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Mock Holidays List
const UPCOMING_HOLIDAYS = [
  { name: 'Independence Day', date: '2026-07-04' },
  { name: 'Labor Day', date: '2026-09-07' },
  { name: 'Thanksgiving Day', date: '2026-11-26' },
  { name: 'Christmas Day', date: '2026-12-25' },
  { name: 'New Year\'s Day', date: '2027-01-01' },
];

export const getEmployeeDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const todayStr = getLocalDateString();

    const [attendanceToday, leaveBalance, recentNotifications, announcements] = await prisma.$transaction([
      prisma.attendance.findUnique({
        where: { userId_date: { userId, date: todayStr } },
      }),
      prisma.leaveBalance.findUnique({
        where: { userId },
      }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          author: {
            select: { fullName: true },
          },
        },
      }),
    ]);

    res.status(200).json({
      todayStatus: attendanceToday || { status: 'ABSENT', checkIn: null, checkOut: null, workingHours: 0 },
      leaveBalance,
      upcomingHolidays: UPCOMING_HOLIDAYS,
      recentActivity: recentNotifications,
      announcements: announcements.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        createdAt: a.createdAt,
        authorName: a.author.fullName,
      })),
    });
  } catch (error) {
    console.error('Employee dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAdminDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const todayStr = getLocalDateString();
    const currentMonthStr = todayStr.slice(0, 7); // "YYYY-MM"

    const [totalEmployees, attendanceToday, pendingLeaves, payrollSummary, recentActivities, announcements] = await prisma.$transaction([
      // Total Employees
      prisma.user.count({ where: { role: 'EMPLOYEE' } }),
      // Today's attendance
      prisma.attendance.findMany({
        where: { date: todayStr },
      }),
      // Pending Leaves
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      // Payroll Summary for the current month
      prisma.payroll.findMany({
        where: { month: currentMonthStr },
        select: { netSalary: true },
      }),
      // Recent general activities (just fetch latest attendance & leave actions)
      prisma.attendance.findMany({
        where: { date: todayStr },
        include: {
          user: {
            select: { fullName: true, employeeId: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      // Announcements
      prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          author: { select: { fullName: true } },
        },
      }),
    ]);

    const presentToday = attendanceToday.filter(a => ['PRESENT', 'LATE', 'HALF_DAY'].includes(a.status)).length;
    const onLeaveToday = attendanceToday.filter(a => a.status === 'LEAVE').length;

    const attendanceRate = totalEmployees > 0 
      ? Math.round(((presentToday + onLeaveToday) / totalEmployees) * 100) 
      : 0;

    const totalPayrollCost = payrollSummary.reduce((acc, curr) => acc + curr.netSalary, 0);

    const formattedRecentActivity = recentActivities.map(a => ({
      id: a.id,
      fullName: a.user.fullName,
      employeeId: a.user.employeeId,
      time: a.checkIn ? new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      status: a.status,
      type: 'ATTENDANCE',
    }));

    res.status(200).json({
      stats: {
        totalEmployees,
        presentToday,
        onLeaveToday,
        attendanceRate,
        pendingLeaves,
        totalPayrollCost: parseFloat(totalPayrollCost.toFixed(2)),
      },
      recentActivity: formattedRecentActivity,
      announcements: announcements.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        createdAt: a.createdAt,
        authorName: a.author.fullName,
      })),
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createAnnouncement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, content } = req.body;
    const authorId = req.user?.id!;

    if (!title || !content) {
      res.status(400).json({ message: 'Title and content are required' });
      return;
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        authorId,
      },
    });

    // Create notifications for all active employees
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE', status: 'ACTIVE' },
      select: { id: true },
    });

    const notificationsData = employees.map(emp => ({
      userId: emp.id,
      title: 'New Announcement',
      message: `Announcement: "${title}" has been published by HR.`,
      type: 'ANNOUNCEMENT',
    }));

    if (notificationsData.length > 0) {
      await prisma.notification.createMany({
        data: notificationsData,
      });
    }

    res.status(201).json({ message: 'Announcement published successfully', announcement });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const globalSearch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string || '';
    const userId = req.user?.id!;
    const isAdmin = req.user?.role === 'ADMIN';

    if (!query) {
      res.status(200).json({ employees: [], leaves: [], attendance: [] });
      return;
    }

    if (isAdmin) {
      const [employees, leaves, attendance] = await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              { fullName: { contains: query } },
              { email: { contains: query } },
              { employeeId: { contains: query } },
            ],
          },
          select: { id: true, fullName: true, employeeId: true, email: true, role: true },
          take: 5,
        }),
        prisma.leaveRequest.findMany({
          where: {
            OR: [
              { reason: { contains: query } },
              { leaveType: { contains: query } },
              { user: { fullName: { contains: query } } },
            ],
          },
          include: { user: { select: { fullName: true, employeeId: true } } },
          take: 5,
        }),
        prisma.attendance.findMany({
          where: {
            OR: [
              { date: { contains: query } },
              { status: { contains: query } },
              { user: { fullName: { contains: query } } },
            ],
          },
          include: { user: { select: { fullName: true, employeeId: true } } },
          take: 5,
        }),
      ]);

      res.status(200).json({ employees, leaves, attendance });
    } else {
      const [leaves, attendance] = await Promise.all([
        prisma.leaveRequest.findMany({
          where: {
            userId,
            OR: [
              { reason: { contains: query } },
              { leaveType: { contains: query } },
            ],
          },
          include: { user: { select: { fullName: true, employeeId: true } } },
          take: 5,
        }),
        prisma.attendance.findMany({
          where: {
            userId,
            OR: [
              { date: { contains: query } },
              { status: { contains: query } },
            ],
          },
          include: { user: { select: { fullName: true, employeeId: true } } },
          take: 5,
        }),
      ]);

      res.status(200).json({ employees: [], leaves, attendance });
    }
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

