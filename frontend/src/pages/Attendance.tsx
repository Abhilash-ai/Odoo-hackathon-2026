import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/auth.context';
import { useToast } from '../context/toast.context';
import { api } from '../services/api';
import {
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const Attendance = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Month navigation state
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const monthStr = `${year}-${month}`; // "YYYY-MM"

  const loadData = async () => {
    setLoading(true);
    try {
      const [todayRes, historyRes, statsRes] = await Promise.all([
        api.attendance.getToday(),
        api.attendance.getHistory('', monthStr),
        api.attendance.getStats('', monthStr),
      ]);
      setTodayStatus(todayRes);
      setHistory(historyRes);
      setStats(statsRes);
    } catch (err: any) {
      toast.error('Failed to load attendance logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [monthStr]);

  const handleCheckIn = async () => {
    try {
      const res = await api.attendance.checkIn();
      setTodayStatus(res.attendance);
      toast.success('Checked in successfully!');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Check-in failed.');
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await api.attendance.checkOut();
      setTodayStatus(res.attendance);
      toast.success('Checked out successfully!');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Check-out failed.');
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // ----------------------------------------------------
  // CALENDAR GENERATION HELPERS
  // ----------------------------------------------------
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay(); // 0 is Sunday

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const calendarDays = [];
  // Fill empty cells before the 1st of the month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  // Fill actual dates
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  // Map calendar date to check-in log
  const getAttendanceForDay = (day: number) => {
    const dayStr = String(day).padStart(2, '0');
    const fullDate = `${year}-${month}-${dayStr}`;
    return history.find((h) => h.date === fullDate);
  };

  const formatHours = (hours: number) => {
    const hrs = Math.floor(hours);
    const mins = Math.round((hours - hrs) * 60);
    return `${hrs}h ${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Present</span>;
      case 'LATE':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">Late Arrival</span>;
      case 'HALF_DAY':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Half Day</span>;
      case 'LEAVE':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">On Leave</span>;
      case 'ABSENT':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">Absent</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-full bg-secondary border">Unspecified</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Daily Attendance</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Clock in/out, view stats, and track presence history.
          </p>
        </div>

        {/* Action Widgets */}
        <div className="flex items-center gap-3">
          {!todayStatus?.checkIn ? (
            <button
              onClick={handleCheckIn}
              className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl shadow-md hover:bg-primary/95 transition-all text-sm flex items-center gap-2 cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              Clock In Today
            </button>
          ) : !todayStatus?.checkOut ? (
            <button
              onClick={handleCheckOut}
              className="bg-rose-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:bg-rose-600 transition-all text-sm flex items-center gap-2 cursor-pointer"
            >
              <Clock className="w-4 h-4 animate-pulse" />
              Clock Out Today
            </button>
          ) : (
            <div className="bg-secondary/40 border text-foreground px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Clock-out complete
            </div>
          )}
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <div className="bg-card border p-4 rounded-2xl text-center shadow-sm">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Days Logged</p>
          <h4 className="text-xl font-bold mt-1">{stats?.totalDays || 0}</h4>
        </div>
        <div className="bg-card border p-4 rounded-2xl text-center shadow-sm">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Present On-Time</p>
          <h4 className="text-xl font-bold mt-1 text-emerald-500">{stats?.present || 0}</h4>
        </div>
        <div className="bg-card border p-4 rounded-2xl text-center shadow-sm">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Late Arrivals</p>
          <h4 className="text-xl font-bold mt-1 text-amber-500">{stats?.late || 0}</h4>
        </div>
        <div className="bg-card border p-4 rounded-2xl text-center shadow-sm">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Approved Leaves</p>
          <h4 className="text-xl font-bold mt-1 text-blue-500">{stats?.leave || 0}</h4>
        </div>
        <div className="bg-card border p-4 rounded-2xl text-center shadow-sm col-span-2 md:col-span-1">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Monthly Hours Worked</p>
          <h4 className="text-xl font-bold mt-1 text-primary">{stats?.totalHours ? formatHours(stats.totalHours) : '0h'}</h4>
        </div>
      </div>

      {/* Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Attendance Calendar */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between lg:col-span-2">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Calendar View
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="p-2 border rounded-xl hover:bg-secondary transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold w-28 text-center">
                  {currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-2 border rounded-xl hover:bg-secondary transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="aspect-square bg-secondary/10 border border-transparent rounded-xl" />;
                }

                const log = getAttendanceForDay(day);
                let bgClass = 'bg-secondary/20 hover:bg-secondary/40 border';
                let textClass = 'text-foreground';

                if (log) {
                  if (log.status === 'PRESENT') {
                    bgClass = 'bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/20';
                    textClass = 'text-emerald-500 font-bold';
                  } else if (log.status === 'LATE') {
                    bgClass = 'bg-amber-500/10 hover:bg-amber-500/25 border-amber-500/20';
                    textClass = 'text-amber-500 font-bold';
                  } else if (log.status === 'HALF_DAY') {
                    bgClass = 'bg-yellow-500/10 hover:bg-yellow-500/25 border-yellow-500/20';
                    textClass = 'text-yellow-500 font-bold';
                  } else if (log.status === 'LEAVE') {
                    bgClass = 'bg-blue-500/10 hover:bg-blue-500/25 border-blue-500/20';
                    textClass = 'text-blue-500 font-bold';
                  } else if (log.status === 'ABSENT') {
                    bgClass = 'bg-rose-500/10 hover:bg-rose-500/25 border-rose-500/20';
                    textClass = 'text-rose-500 font-bold';
                  }
                }

                return (
                  <div
                    key={`day-${day}`}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all relative ${bgClass} ${textClass}`}
                    title={log ? `Status: ${log.status}\nHours: ${log.workingHours} hrs` : 'No log'}
                  >
                    <span className="text-xs">{day}</span>
                    {log?.checkIn && (
                      <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-6 pt-4 border-t">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/30" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/30" />
              <span>Late</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
              <span>Half Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500/20 border border-blue-500/30" />
              <span>Leave</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/30" />
              <span>Absent</span>
            </div>
          </div>
        </div>

        {/* Monthly Logs Table */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Presence Log
            </h3>
            <div className="flex flex-col gap-3.5 max-h-[380px] overflow-y-auto pr-1">
              {history.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No attendance logged for {currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}.
                </div>
              ) : (
                history.map((log) => (
                  <div key={log.id} className="p-3.5 bg-secondary/10 border rounded-xl flex justify-between items-center gap-3">
                    <div>
                      <h4 className="font-bold text-xs">
                        {new Date(log.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        In: {log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} |
                        Out: {log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex flex-col gap-1 items-end">
                      {getStatusBadge(log.status)}
                      {log.workingHours > 0 && (
                        <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                          {formatHours(log.workingHours)}
                        </span>
                      )}
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
