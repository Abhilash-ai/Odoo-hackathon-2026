import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/auth.context';
import { useTheme } from '../../context/theme.context';
import { useToast } from '../../context/toast.context';
import { api } from '../../services/api';
import {
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  Search,
  LogIn,
  LogOut,
  Check,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TodayAttendance {
  checkIn: string | null;
  checkOut: string | null;
}

// ─── Nav Tab Definition ───────────────────────────────────────────────────────

interface NavTab {
  label: string;
  path: string;
}

const ADMIN_TABS: NavTab[] = [
  { label: 'Employees', path: '/admin/employees' },
  { label: 'Attendance', path: '/attendance' },
  { label: 'Time Off', path: '/admin/leaves' },
];

const EMPLOYEE_TABS: NavTab[] = [
  { label: 'Attendance', path: '/attendance' },
  { label: 'Time Off', path: '/leaves' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const Navbar = ({ onMobileMenuOpen }: { onMobileMenuOpen: () => void }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Notifications ──────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // ── Search ─────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    employees: any[];
    leaves: any[];
    attendance: any[];
  }>({ employees: [], leaves: [], attendance: [] });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searching, setSearching] = useState(false);

  // ── Attendance Check In/Out ─────────────────────────────────────────────────
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // ── Nav Tabs ───────────────────────────────────────────────────────────────
  const tabs = user?.role === 'ADMIN' ? ADMIN_TABS : EMPLOYEE_TABS;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isTabActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // ── Fetch Notifications ────────────────────────────────────────────────────
  const fetchNotifications = async () => {
    try {
      const data = await api.notifications.get();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // ── Fetch Today Attendance ─────────────────────────────────────────────────
  const fetchTodayAttendance = useCallback(async () => {
    try {
      const data = await api.attendance.getToday();
      setTodayAttendance(data ?? null);
    } catch (err) {
      // No attendance record yet for today — treat as null
      setTodayAttendance(null);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTodayAttendance();
    }
  }, [user, fetchTodayAttendance]);

  // ── Debounced Global Search ────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ employees: [], leaves: [], attendance: [] });
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await api.dashboard.search(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // ── Notification Actions ───────────────────────────────────────────────────
  const markAllAsRead = async () => {
    try {
      await api.notifications.readAll();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const handleNotificationClick = async (id: string) => {
    try {
      await api.notifications.read(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ── Check In / Check Out ───────────────────────────────────────────────────
  const handleCheckIn = async () => {
    setAttendanceLoading(true);
    try {
      await api.attendance.checkIn();
      await fetchTodayAttendance();
      toast.success('Checked in successfully! Have a great day 🎉');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to check in. Please try again.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setAttendanceLoading(true);
    try {
      await api.attendance.checkOut();
      await fetchTodayAttendance();
      toast.success('Checked out successfully! See you tomorrow 👋');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to check out. Please try again.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Derive attendance state
  const hasCheckedIn = !!todayAttendance?.checkIn;
  const hasCheckedOut = !!todayAttendance?.checkOut;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 gap-3">

      {/* ── Left: Hamburger + Breadcrumb + Nav Tabs ── */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Mobile hamburger */}
        <button
          onClick={onMobileMenuOpen}
          className="p-2 -ml-1 rounded-lg hover:bg-secondary md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb */}
        <div className="hidden sm:flex items-center gap-2 text-sm font-semibold">
          <span className="text-muted-foreground">Portal</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground capitalize">
            {user?.role === 'ADMIN' ? 'HR Management' : 'Employee Dashboard'}
          </span>
        </div>

        {/* Nav Tabs — md+ only */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {tabs.map((tab) => {
            const active = isTabActive(tab.path);
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`
                  relative px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                  ${active
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }
                `}
              >
                {tab.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Center: Global Search ── */}
      <div className="flex-1 max-w-sm mx-auto relative hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employees, leaves, attendance..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            className="w-full pl-9 pr-9 py-2 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchDropdown(false);
              }}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showSearchDropdown && searchQuery && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSearchDropdown(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 right-0 mt-2 bg-card border rounded-2xl shadow-xl z-20 max-h-96 overflow-y-auto p-4 flex flex-col gap-4 text-left"
              >
                {searching ? (
                  <div className="text-center text-xs py-4 text-muted-foreground flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    Searching...
                  </div>
                ) : (
                  <>
                    {/* Employees — Admin only */}
                    {user?.role === 'ADMIN' && (
                      <div>
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                          Employees
                        </h4>
                        {searchResults.employees.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground pl-2">No employees matched</p>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {searchResults.employees.map((emp: any) => (
                              <button
                                key={emp.id}
                                onClick={() => {
                                  setShowSearchDropdown(false);
                                  setSearchQuery('');
                                  navigate('/admin/employees');
                                }}
                                className="w-full text-left p-2 hover:bg-secondary/50 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer"
                              >
                                <span className="font-bold text-foreground">{emp.fullName}</span>
                                <span className="text-[10px] text-muted-foreground uppercase bg-secondary px-1.5 py-0.5 rounded border">
                                  {emp.employeeId}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Leave Requests */}
                    <div>
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Leave Requests
                      </h4>
                      {searchResults.leaves.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground pl-2">No leave requests matched</p>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {searchResults.leaves.map((l: any) => (
                            <button
                              key={l.id}
                              onClick={() => {
                                setShowSearchDropdown(false);
                                setSearchQuery('');
                                navigate(user?.role === 'ADMIN' ? '/admin/leaves' : '/leaves');
                              }}
                              className="w-full text-left p-2 hover:bg-secondary/50 rounded-xl flex flex-col text-xs transition-colors cursor-pointer"
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className="font-bold text-foreground capitalize">
                                  {l.leaveType.toLowerCase()} Leave
                                </span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                    l.status === 'APPROVED'
                                      ? 'bg-emerald-500/10 text-emerald-500'
                                      : l.status === 'REJECTED'
                                      ? 'bg-rose-500/10 text-rose-500'
                                      : 'bg-amber-500/10 text-amber-500'
                                  }`}
                                >
                                  {l.status}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground truncate mt-0.5 italic">
                                "{l.reason}" — {l.user.fullName}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Attendance Logs */}
                    <div>
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Attendance Logs
                      </h4>
                      {searchResults.attendance.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground pl-2">No attendance logs matched</p>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {searchResults.attendance.map((att: any) => (
                            <button
                              key={att.id}
                              onClick={() => {
                                setShowSearchDropdown(false);
                                setSearchQuery('');
                                navigate('/attendance');
                              }}
                              className="w-full text-left p-2 hover:bg-secondary/50 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground">
                                  {new Date(att.date).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                                <span className="text-[10px] text-muted-foreground">{att.user.fullName}</span>
                              </div>
                              <span
                                className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 border ${
                                  att.status === 'PRESENT'
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    : att.status === 'LATE'
                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                    : att.status === 'LEAVE'
                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                }`}
                              >
                                {att.status}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right: Systray ── */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Check In / Check Out / Done */}
        {hasCheckedIn && hasCheckedOut ? (
          /* Both done — show small emerald badge */
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
            <Check className="w-3.5 h-3.5" />
            Done
          </div>
        ) : hasCheckedIn ? (
          /* Checked in, not out — show red Check Out */
          <button
            onClick={handleCheckOut}
            disabled={attendanceLoading}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {attendanceLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            Check Out
          </button>
        ) : (
          /* No check-in yet — show green Check In */
          <button
            onClick={handleCheckIn}
            disabled={attendanceLoading}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {attendanceLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LogIn className="w-3.5 h-3.5" />
            )}
            Check In
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowProfileDropdown(false);
            }}
            className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground relative transition-all duration-200"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-card ring-1 ring-rose-500/30 animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {showNotifDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifDropdown(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-card border rounded-2xl shadow-xl z-20 flex flex-col overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-secondary/20">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y">
                    {notifications.length === 0 ? (
                      <div className="py-8 px-4 text-center text-xs text-muted-foreground">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n.id)}
                          className={`p-3 text-left hover:bg-secondary/40 transition-colors cursor-pointer flex gap-3 ${
                            !n.isRead ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {n.type === 'LEAVE_STATUS' ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            ) : n.type === 'PAYROLL' ? (
                              <Info className="w-4 h-4 text-blue-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-xs text-foreground leading-tight">
                              {n.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 leading-snug">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="h-6 w-px bg-border hidden sm:block" />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifDropdown(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-secondary transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs border overflow-hidden shrink-0">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user?.fullName} className="w-full h-full object-cover" />
              ) : (
                user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase()
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
          </button>

          <AnimatePresence>
            {showProfileDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProfileDropdown(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-card border rounded-2xl shadow-xl z-20 overflow-hidden flex flex-col p-1.5"
                >
                  {/* User info header */}
                  <div className="px-3 py-2 mb-1">
                    <p className="text-sm font-semibold text-foreground truncate">{user?.fullName}</p>
                    <p className="text-[11px] text-muted-foreground truncate capitalize">
                      {user?.role?.toLowerCase()}
                    </p>
                  </div>
                  <div className="h-px bg-border mb-1" />

                  <Link
                    to="/profile"
                    onClick={() => setShowProfileDropdown(false)}
                    className="px-3 py-2 rounded-xl text-left text-sm font-medium hover:bg-secondary text-foreground hover:text-foreground transition-colors"
                  >
                    My Profile
                  </Link>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={() => {
                      logout();
                      navigate('/signin');
                    }}
                    className="px-3 py-2 rounded-xl text-left text-sm font-medium hover:bg-rose-500/10 text-rose-500 transition-colors"
                  >
                    Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
