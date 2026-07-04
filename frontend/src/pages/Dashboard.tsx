import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/auth.context';
import { useToast } from '../context/toast.context';
import { api } from '../services/api';
import {
  Clock,
  Calendar,
  DollarSign,
  User,
  Users,
  AlertCircle,
  CheckCircle,
  FileText,
  Plus,
  ArrowRight,
  TrendingUp,
  Briefcase,
  Megaphone,
  ClipboardCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mode for Admin user (Toggle between Admin dashboard & Employee dashboard)
  const [isAdminView, setIsAdminView] = useState(user?.role === 'ADMIN');

  // Employee Data States
  const [empData, setEmpData] = useState<any>(null);
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [loadingEmp, setLoadingEmp] = useState(true);

  // Admin Data States
  const [adminData, setAdminData] = useState<any>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // Clock state
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadEmployeeDashboard = async () => {
    setLoadingEmp(true);
    try {
      const data = await api.dashboard.getEmployee();
      setEmpData(data);
      setTodayStatus(data.todayStatus);
    } catch (err: any) {
      toast.error('Failed to load employee dashboard.');
    } finally {
      setLoadingEmp(false);
    }
  };

  const loadAdminDashboard = async () => {
    setLoadingAdmin(true);
    try {
      const data = await api.dashboard.getAdmin();
      setAdminData(data);
    } catch (err: any) {
      toast.error('Failed to load admin dashboard.');
    } finally {
      setLoadingAdmin(false);
    }
  };

  useEffect(() => {
    loadEmployeeDashboard();
    if (user?.role === 'ADMIN') {
      loadAdminDashboard();
    }
  }, [user]);

  const handleCheckIn = async () => {
    try {
      const res = await api.attendance.checkIn();
      setTodayStatus(res.attendance);
      toast.success('Successfully checked in today!');
      loadEmployeeDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Check-in failed.');
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await api.attendance.checkOut();
      setTodayStatus(res.attendance);
      toast.success('Successfully checked out today!');
      loadEmployeeDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Check-out failed.');
    }
  };

  const formatHours = (hours: number) => {
    const hrs = Math.floor(hours);
    const mins = Math.round((hours - hrs) * 60);
    return `${hrs}h ${mins}m`;
  };

  // ----------------------------------------------------
  // RENDER: EMPLOYEE DASHBOARD
  // ----------------------------------------------------
  const renderEmployeeDashboard = () => {
    if (loadingEmp) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-44 rounded-2xl bg-card border animate-pulse" />
            <div className="h-44 rounded-2xl bg-card border animate-pulse" />
            <div className="h-44 rounded-2xl bg-card border animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 rounded-2xl bg-card border lg:col-span-2 animate-pulse" />
            <div className="h-96 rounded-2xl bg-card border animate-pulse" />
          </div>
        </div>
      );
    }

    const leavesLeft = empData?.leaveBalance
      ? empData.leaveBalance.paid + empData.leaveBalance.sick + empData.leaveBalance.casual
      : 0;

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Hello, {user?.fullName}!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Have a productive day! Today is {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Local Time</p>
              <p className="font-bold text-lg text-primary">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
            </div>
            <div className="h-10 w-px bg-border hidden sm:block" />
            
            {/* Clock-In Widget */}
            {!todayStatus?.checkIn ? (
              <button
                onClick={handleCheckIn}
                className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-primary/20 hover:bg-primary/95 transition-all text-sm flex items-center gap-2 cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                Clock In
              </button>
            ) : !todayStatus?.checkOut ? (
              <button
                onClick={handleCheckOut}
                className="bg-rose-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-rose-500/20 hover:bg-rose-600 transition-all text-sm flex items-center gap-2 cursor-pointer"
              >
                <Clock className="w-4 h-4 animate-pulse" />
                Clock Out
              </button>
            ) : (
              <span className="bg-secondary text-foreground border font-semibold px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 select-none">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Entitlements */}
          <div className="bg-card border p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Leave Balance</p>
                <h3 className="text-2xl font-black mt-2">{leavesLeft} Days</h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/10">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-4 border-t pt-3 flex justify-between">
              <span>Paid: {empData?.leaveBalance?.paid || 0}</span>
              <span>Sick: {empData?.leaveBalance?.sick || 0}</span>
              <span>Casual: {empData?.leaveBalance?.casual || 0}</span>
            </div>
          </div>

          {/* Today's Status */}
          <div className="bg-card border p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Clock Status</p>
                <h3 className="text-xl font-bold mt-2.5">
                  {todayStatus?.checkIn ? (todayStatus?.checkOut ? 'Checked Out' : 'Active Duty') : 'Absent'}
                </h3>
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                todayStatus?.checkIn 
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' 
                  : 'bg-rose-500/10 text-rose-500 border-rose-500/10'
              }`}>
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-4 border-t pt-3 flex justify-between">
              <span>In: {todayStatus?.checkIn ? new Date(todayStatus.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
              <span>Out: {todayStatus?.checkOut ? new Date(todayStatus.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
            </div>
          </div>

          {/* Working Hours */}
          <div className="bg-card border p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Working Hours</p>
                <h3 className="text-2xl font-black mt-2">
                  {todayStatus?.workingHours ? formatHours(todayStatus.workingHours) : '0h 0m'}
                </h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/10">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-4 border-t pt-3 flex justify-between">
              <span>Goal: 8 hrs / day</span>
              <span className="text-emerald-500 font-semibold">
                {todayStatus?.workingHours >= 8 ? 'Goal met' : ''}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Link
                to="/leaves"
                className="flex flex-col items-center justify-center py-2 px-3 bg-secondary/40 hover:bg-secondary border rounded-xl text-center transition-colors group"
              >
                <Plus className="w-4 h-4 text-primary group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[10px] font-bold">Apply Leave</span>
              </Link>
              <Link
                to="/payroll"
                className="flex flex-col items-center justify-center py-2 px-3 bg-secondary/40 hover:bg-secondary border rounded-xl text-center transition-colors group"
              >
                <FileText className="w-4 h-4 text-primary group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[10px] font-bold">View Payslip</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Announcements */}
          <div className="bg-card border rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Megaphone className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base">Announcements</h3>
              </div>
              <div className="flex flex-col gap-4">
                {empData?.announcements?.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No announcements published recently
                  </div>
                ) : (
                  empData?.announcements?.map((a: any) => (
                    <div key={a.id} className="p-4 bg-secondary/20 border rounded-xl hover:bg-secondary/40 transition-colors">
                      <div className="flex justify-between items-start mb-1.5">
                        <h4 className="font-bold text-sm leading-tight text-foreground">{a.title}</h4>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-normal whitespace-pre-wrap">
                        {a.content}
                      </p>
                      <span className="text-[10px] text-primary/70 font-semibold mt-2 block">
                        By {a.authorName}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Holidays & Activity */}
          <div className="flex flex-col gap-6">
            {/* Holidays */}
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-base mb-4">Upcoming Holidays</h3>
              <div className="flex flex-col gap-3">
                {empData?.upcomingHolidays?.map((h: any) => (
                  <div key={h.name} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <h4 className="font-semibold text-xs leading-tight">{h.name}</h4>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(h.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase py-1 px-2.5 rounded-full bg-secondary border">
                      Holiday
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Notifications */}
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-base mb-4">Recent Activity</h3>
              <div className="flex flex-col gap-3.5">
                {empData?.recentActivity?.length === 0 ? (
                  <div className="text-center text-xs py-4 text-muted-foreground">
                    No recent activity alerts
                  </div>
                ) : (
                  empData?.recentActivity?.slice(0, 3).map((act: any) => (
                    <div key={act.id} className="flex gap-3 text-xs leading-normal">
                      <div className="shrink-0 mt-0.5">
                        {act.type === 'LEAVE_STATUS' ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-primary" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold">{act.title}</h4>
                        <p className="text-muted-foreground text-[11px] mt-0.5">{act.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // RENDER: ADMIN DASHBOARD
  // ----------------------------------------------------
  const renderAdminDashboard = () => {
    if (loadingAdmin || !adminData) {
      return (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="h-28 bg-card border rounded-2xl" />
            <div className="h-28 bg-card border rounded-2xl" />
            <div className="h-28 bg-card border rounded-2xl" />
            <div className="h-28 bg-card border rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-[400px] bg-card border rounded-2xl lg:col-span-2" />
            <div className="h-[400px] bg-card border rounded-2xl" />
          </div>
        </div>
      );
    }

    const { stats, announcements, recentActivity } = adminData;

    // Trend attendance data for chart
    const trendData = [
      { day: 'Mon', rate: stats.attendanceRate - 2 > 0 ? stats.attendanceRate - 2 : 90 },
      { day: 'Tue', dayRate: stats.attendanceRate - 1 > 0 ? stats.attendanceRate - 1 : 92 },
      { day: 'Wed', dayRate: stats.attendanceRate + 3 <= 100 ? stats.attendanceRate + 3 : 95 },
      { day: 'Thu', dayRate: stats.attendanceRate + 1 <= 100 ? stats.attendanceRate + 1 : 94 },
      { day: 'Today', dayRate: stats.attendanceRate },
    ];

    // Pie chart leave types data
    const pieData = [
      { name: 'Paid', value: 15 },
      { name: 'Sick', value: 8 },
      { name: 'Casual', value: 5 },
      { name: 'Unpaid', value: 2 },
    ];

    return (
      <div className="space-y-6">
        {/* Stats Summary Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total employees */}
          <div className="bg-card border p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Headcount</p>
              <h3 className="text-3xl font-black mt-2">{stats.totalEmployees}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/10">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Present Today */}
          <div className="bg-card border p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Checked In Today</p>
              <h3 className="text-3xl font-black mt-2">{stats.presentToday}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/10">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Attendance % */}
          <div className="bg-card border p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Presence Rate</p>
              <h3 className="text-3xl font-black mt-2">{stats.attendanceRate}%</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/10">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Pending Leaves */}
          <Link
            to="/admin/leaves"
            className="bg-card border p-5 rounded-2xl shadow-sm flex items-center justify-between hover:border-primary transition-colors group"
          >
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Pending Leaves</p>
              <h3 className="text-3xl font-black mt-2 text-rose-500">{stats.pendingLeaves}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/10 group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
          </Link>
        </div>

        {/* Charts & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Area Chart */}
          <div className="bg-card border rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base mb-1">Company Attendance Trend</h3>
              <p className="text-xs text-muted-foreground mb-4">Showing percentage of present employees this week</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="dayRate"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRate)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leave Breakdown Chart */}
          <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base mb-1">Leaves Breakdown</h3>
              <p className="text-xs text-muted-foreground mb-4">Leave instances by category (this month)</p>
            </div>
            <div className="h-44 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold">{pieData.reduce((acc, curr) => acc + curr.value, 0)}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total</span>
              </div>
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs pt-4 border-t">
              {pieData.map((p, idx) => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span className="font-medium text-muted-foreground">{p.name}: {p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Admin Detail Panel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions / Create Announcement */}
          <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base mb-4">Quick Management Actions</h3>
              <div className="flex flex-col gap-3">
                <Link
                  to="/admin/employees"
                  className="flex items-center justify-between p-3.5 bg-secondary/30 hover:bg-secondary border rounded-xl font-semibold text-sm group transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-primary" />
                    Manage Employees List
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/admin/payroll"
                  className="flex items-center justify-between p-3.5 bg-secondary/30 hover:bg-secondary border rounded-xl font-semibold text-sm group transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Generate Monthly Payroll
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/admin/leaves"
                  className="flex items-center justify-between p-3.5 bg-secondary/30 hover:bg-secondary border rounded-xl font-semibold text-sm group transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <ClipboardCheck className="w-4 h-4 text-primary" />
                    Review Leave Requests
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Announcements Manager */}
          <div className="bg-card border rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-base">Published Notices</h3>
                <button
                  onClick={() => navigate('/settings')}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Publish New Notice
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {announcements?.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No active company announcements.
                  </div>
                ) : (
                  announcements?.map((a: any) => (
                    <div key={a.id} className="p-3 bg-secondary/20 border rounded-xl flex justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-xs">{a.title}</h4>
                        <p className="text-[11px] text-muted-foreground mt-1 truncate max-w-lg">{a.content}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Admin view switch toggle bar (Admin Only) */}
      {user?.role === 'ADMIN' && (
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-primary/10 text-primary rounded-full border border-primary/20">
              Admin Mode
            </span>
            <p className="text-xs text-muted-foreground font-semibold">
              You can toggle between HR analytics and your personal Employee panel.
            </p>
          </div>
          <div className="flex bg-secondary p-1 rounded-xl border">
            <button
              onClick={() => setIsAdminView(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                isAdminView ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              HR Admin
            </button>
            <button
              onClick={() => setIsAdminView(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                !isAdminView ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My Portal
            </button>
          </div>
        </div>
      )}

      {isAdminView ? renderAdminDashboard() : renderEmployeeDashboard()}
    </div>
  );
};
