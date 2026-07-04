import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/auth.context';
import { useToast } from '../context/toast.context';
import { api } from '../services/api';
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  Plus,
  X,
  Search,
  Briefcase,
  Mail,
  Hash,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  Megaphone,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  status: 'ACTIVE' | 'SUSPENDED';
  profilePhoto?: string;
}

interface AttendanceRecord {
  userId: string;
  date: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
}

interface LeaveRequest {
  userId: string;
  startDate: string;
  endDate: string;
  status: string;
}

type EmployeeStatus = 'PRESENT' | 'ON_LEAVE' | 'ABSENT';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTodayString = () => new Date().toISOString().split('T')[0];

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

const AVATAR_GRADIENTS = [
  'from-violet-500 to-purple-700',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-700',
  'from-rose-500 to-pink-700',
  'from-amber-500 to-orange-600',
  'from-indigo-500 to-blue-700',
  'from-fuchsia-500 to-pink-600',
  'from-teal-500 to-green-700',
];

const getGradient = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

const deriveStatus = (
  employee: Employee,
  attendanceMap: Map<string, AttendanceRecord>,
  approvedLeaves: LeaveRequest[]
): EmployeeStatus => {
  const today = getTodayString();
  const record = attendanceMap.get(employee.id);
  if (record && (record.status === 'PRESENT' || record.status === 'LATE')) return 'PRESENT';
  const onLeave = approvedLeaves.some(
    (l) => l.userId === employee.id && l.startDate <= today && today <= l.endDate
  );
  if (onLeave) return 'ON_LEAVE';
  return 'ABSENT';
};

const STATUS_CONFIG: Record<EmployeeStatus, { color: string; label: string }> = {
  PRESENT: { color: '#22c55e', label: 'Present' },
  ON_LEAVE: { color: '#a855f7', label: 'On Leave' },
  ABSENT: { color: '#eab308', label: 'Absent' },
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-card border rounded-2xl p-5 animate-pulse flex flex-col gap-3">
    <div className="flex justify-between">
      <div className="w-14 h-14 rounded-full bg-secondary/60" />
      <div className="w-2.5 h-2.5 rounded-full bg-secondary/60" />
    </div>
    <div className="h-4 bg-secondary/60 rounded w-3/4" />
    <div className="h-3 bg-secondary/60 rounded w-1/2" />
    <div className="h-3 bg-secondary/60 rounded w-2/3" />
    <div className="h-5 bg-secondary/60 rounded-full w-16 mt-1" />
  </div>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
  icon: Icon,
  label,
  value,
  iconClass,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  iconClass: string;
}) => (
  <div className="bg-card border rounded-2xl p-5 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{label}</p>
      <h3 className="text-3xl font-black mt-2">{value}</h3>
    </div>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${iconClass}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

// ─── Employee Card ────────────────────────────────────────────────────────────

const EmployeeCard = ({
  employee,
  status,
  onClick,
}: {
  employee: Employee;
  status: EmployeeStatus;
  onClick: () => void;
}) => {
  const cfg = STATUS_CONFIG[status];
  const gradient = getGradient(employee.id);

  return (
    <div
      onClick={onClick}
      className="relative bg-card border rounded-2xl p-5 cursor-pointer group
        transition-all duration-200 ease-out
        hover:scale-[1.025] hover:shadow-xl hover:shadow-black/20 hover:border-primary/30
        active:scale-[1.01]"
    >
      {/* Status dot */}
      <span
        className="absolute top-4 right-4 w-3 h-3 rounded-full ring-4 ring-card shadow-md"
        style={{ backgroundColor: cfg.color }}
        title={cfg.label}
      />

      {/* Avatar */}
      <div className="mb-4">
        {employee.profilePhoto ? (
          <img
            src={employee.profilePhoto}
            alt={employee.fullName}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <div
            className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient}
              flex items-center justify-center text-white font-bold text-lg
              ring-2 ring-white/10 shadow-md`}
          >
            {getInitials(employee.fullName)}
          </div>
        )}
      </div>

      {/* Info */}
      <h3 className="font-bold text-sm leading-tight mb-1 group-hover:text-primary transition-colors truncate pr-4">
        {employee.fullName}
      </h3>

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono mb-1">
        <Hash className="w-3 h-3 shrink-0" />
        {employee.employeeId}
      </p>

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-3 truncate">
        <Mail className="w-3 h-3 shrink-0" />
        {employee.email}
      </p>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
            employee.role === 'ADMIN'
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
              : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
          }`}
        >
          <Briefcase className="w-2.5 h-2.5" />
          {employee.role}
        </span>
        <span
          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border"
          style={{
            backgroundColor: cfg.color + '18',
            color: cfg.color,
            borderColor: cfg.color + '40',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
          {cfg.label}
        </span>
      </div>
    </div>
  );
};

// ─── Add Employee Modal ───────────────────────────────────────────────────────

interface AddEmployeeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddEmployeeModal = ({ onClose, onSuccess }: AddEmployeeModalProps) => {
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<{ employeeId: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.employees.create({ fullName: fullName.trim(), email: email.trim(), role });
      setCredentials(res.credentials);
      toast.success(`Employee "${fullName.trim()}" added successfully!`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create employee.');
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    const text = `Employee ID: ${credentials?.employeeId}\nPassword: ${credentials?.password}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={credentials ? undefined : onClose}
      />
      <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="font-bold text-lg">Add New Employee</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Credentials will be auto-generated</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {credentials ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Employee created successfully!
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Share these credentials with the employee. They should change their password on first login.
              </p>
              <div className="relative bg-secondary/40 border rounded-xl p-4 font-mono text-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Employee ID</span>
                  <span className="font-bold text-primary">{credentials.employeeId}</span>
                </div>
                <div className="border-t" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Password</span>
                  <span className="font-bold tracking-wider">{credentials.password}</span>
                </div>
                <button
                  onClick={copyCredentials}
                  className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center bg-secondary border hover:bg-secondary/80 transition-colors cursor-pointer"
                  title="Copy credentials"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-secondary/40 border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. jane@company.com"
                  className="w-full bg-secondary/40 border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'EMPLOYEE' | 'ADMIN')}
                  className="w-full bg-secondary/40 border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-semibold hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Employee
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Map<string, AttendanceRecord>>(new Map());
  const [approvedLeaves, setApprovedLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, attRes, leaveRes] = await Promise.allSettled([
        api.employees.list('', '', '', 1, 500),
        api.attendance.getCompanyReport(),
        api.leaves.getRequests('APPROVED'),
      ]);

      if (empRes.status === 'fulfilled') {
        const raw = empRes.value;
        const list: Employee[] = raw?.employees || raw?.data || (Array.isArray(raw) ? raw : []);
        setEmployees(list);
      } else {
        toast.error('Failed to load employees.');
      }

      if (attRes.status === 'fulfilled') {
        const raw = attRes.value;
        const records: AttendanceRecord[] = raw?.attendance || raw?.data || (Array.isArray(raw) ? raw : []);
        const today = getTodayString();
        const map = new Map<string, AttendanceRecord>();
        records.forEach((r) => {
          const recDate = r.date ? r.date.split('T')[0] : '';
          if (recDate === today) map.set(r.userId, r);
        });
        setAttendanceMap(map);
      }

      if (leaveRes.status === 'fulfilled') {
        const raw = leaveRes.value;
        const leaves: LeaveRequest[] = raw?.leaves || raw?.data || (Array.isArray(raw) ? raw : []);
        setApprovedLeaves(leaves);
      }
    } catch {
      toast.error('Unexpected error loading dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived stats
  const presentCount = employees.filter(
    (e) => deriveStatus(e, attendanceMap, approvedLeaves) === 'PRESENT'
  ).length;
  const onLeaveCount = employees.filter(
    (e) => deriveStatus(e, attendanceMap, approvedLeaves) === 'ON_LEAVE'
  ).length;
  const absentCount = employees.filter(
    (e) => deriveStatus(e, attendanceMap, approvedLeaves) === 'ABSENT'
  ).length;

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.fullName.toLowerCase().includes(q) ||
      e.employeeId.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-card border rounded-2xl animate-pulse" />
          ))
        ) : (
          <>
            <StatCard
              icon={Users}
              label="Total Employees"
              value={employees.length}
              iconClass="bg-primary/10 text-primary border-primary/15"
            />
            <StatCard
              icon={UserCheck}
              label="Present Today"
              value={presentCount}
              iconClass="bg-emerald-500/10 text-emerald-500 border-emerald-500/15"
            />
            <StatCard
              icon={Calendar}
              label="On Leave"
              value={onLeaveCount}
              iconClass="bg-purple-500/10 text-purple-500 border-purple-500/15"
            />
            <StatCard
              icon={Clock}
              label="Absent"
              value={absentCount}
              iconClass="bg-yellow-500/10 text-yellow-500 border-yellow-500/15"
            />
          </>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">Team Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading ? 'Loading…' : `${filtered.length} of ${employees.length} employees`}
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID or email…"
              className="w-full bg-secondary/40 border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-muted-foreground/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-primary/20 hover:bg-primary/90 transition-all whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Employee</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Status legend */}
      <div className="flex items-center gap-5 flex-wrap">
        {(Object.entries(STATUS_CONFIG) as [EmployeeStatus, { color: string; label: string }][]).map(([, cfg]) => (
          <div key={cfg.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
            {cfg.label}
          </div>
        ))}
      </div>

      {/* Employee Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary border flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-base mb-1">No employees found</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {search
              ? `No results for "${search}". Try a different name or ID.`
              : 'No employees in the system yet. Add one to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              status={deriveStatus(emp, attendanceMap, approvedLeaves)}
              onClick={() => navigate(`/admin/employees?highlight=${emp.id}`)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddEmployeeModal onClose={() => setShowModal(false)} onSuccess={loadData} />
      )}
    </div>
  );
};

// ─── Employee Dashboard ───────────────────────────────────────────────────────

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [empData, setEmpData] = useState<any>(null);
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.dashboard.getEmployee();
      setEmpData(data);
      setTodayStatus(data?.todayStatus);
    } catch {
      toast.error('Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const handleCheckIn = async () => {
    try {
      const res = await api.attendance.checkIn();
      setTodayStatus(res.attendance);
      toast.success('Successfully checked in!');
      loadDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Check-in failed.');
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await api.attendance.checkOut();
      setTodayStatus(res.attendance);
      toast.success('Successfully checked out!');
      loadDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Check-out failed.');
    }
  };

  const formatHours = (h: number) => {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return `${hrs}h ${mins}m`;
  };

  const leavesLeft = empData?.leaveBalance
    ? (empData.leaveBalance.paid || 0) + (empData.leaveBalance.sick || 0) + (empData.leaveBalance.casual || 0)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-card border rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-card border rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-72 bg-card border rounded-2xl lg:col-span-2" />
          <div className="h-72 bg-card border rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Hello, {user?.fullName}! 👋</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Local Time</p>
            <p className="font-bold text-lg text-primary">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          <div className="h-10 w-px bg-border hidden sm:block" />
          {!todayStatus?.checkIn ? (
            <button
              onClick={handleCheckIn}
              className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all text-sm flex items-center gap-2 cursor-pointer"
            >
              <Clock className="w-4 h-4" /> Clock In
            </button>
          ) : !todayStatus?.checkOut ? (
            <button
              onClick={handleCheckOut}
              className="bg-rose-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-rose-500/20 hover:bg-rose-600 transition-all text-sm flex items-center gap-2 cursor-pointer"
            >
              <Clock className="w-4 h-4 animate-pulse" /> Clock Out
            </button>
          ) : (
            <span className="bg-secondary border font-semibold px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 select-none">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Completed
            </span>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Leave Balance */}
        <div className="bg-card border p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Leave Balance</p>
              <h3 className="text-2xl font-black mt-2">{leavesLeft} Days</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/15">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-4 border-t pt-3 flex justify-between">
            <span>Paid: {empData?.leaveBalance?.paid || 0}</span>
            <span>Sick: {empData?.leaveBalance?.sick || 0}</span>
            <span>Casual: {empData?.leaveBalance?.casual || 0}</span>
          </div>
        </div>

        {/* Clock Status */}
        <div className="bg-card border p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Today's Status</p>
              <h3 className="text-xl font-bold mt-2.5">
                {todayStatus?.checkIn ? (todayStatus?.checkOut ? 'Checked Out' : 'Active') : 'Not Checked In'}
              </h3>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                todayStatus?.checkIn
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/15'
                  : 'bg-rose-500/10 text-rose-500 border-rose-500/15'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-4 border-t pt-3 flex justify-between">
            <span>
              In:{' '}
              {todayStatus?.checkIn
                ? new Date(todayStatus.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '--:--'}
            </span>
            <span>
              Out:{' '}
              {todayStatus?.checkOut
                ? new Date(todayStatus.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '--:--'}
            </span>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-card border p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Working Hours</p>
              <h3 className="text-2xl font-black mt-2">
                {todayStatus?.workingHours ? formatHours(todayStatus.workingHours) : '0h 0m'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/15">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-4 border-t pt-3 flex justify-between">
            <span>Goal: 8 hrs / day</span>
            {todayStatus?.workingHours >= 8 && (
              <span className="text-emerald-500 font-semibold">Goal met ✓</span>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/leaves"
              className="flex flex-col items-center justify-center py-3 px-2 bg-secondary/40 hover:bg-secondary border rounded-xl text-center transition-colors group"
            >
              <Plus className="w-4 h-4 text-primary group-hover:scale-110 transition-transform mb-1" />
              <span className="text-[10px] font-bold">Apply Leave</span>
            </Link>
            <Link
              to="/payroll"
              className="flex flex-col items-center justify-center py-3 px-2 bg-secondary/40 hover:bg-secondary border rounded-xl text-center transition-colors group"
            >
              <FileText className="w-4 h-4 text-primary group-hover:scale-110 transition-transform mb-1" />
              <span className="text-[10px] font-bold">Payslip</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Lower Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Announcements */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-base">Announcements</h3>
          </div>
          <div className="flex flex-col gap-3">
            {!empData?.announcements?.length ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No announcements at this time</div>
            ) : (
              empData.announcements.map((a: any) => (
                <div key={a.id} className="p-4 bg-secondary/20 border rounded-xl hover:bg-secondary/40 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm">{a.title}</h4>
                    <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{a.content}</p>
                  <span className="text-[10px] text-primary/70 font-semibold mt-2 block">By {a.authorName}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="flex flex-col gap-4">
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-base mb-4">Upcoming Holidays</h3>
            <div className="flex flex-col gap-3">
              {!empData?.upcomingHolidays?.length ? (
                <p className="text-xs text-muted-foreground text-center py-4">No upcoming holidays</p>
              ) : (
                empData.upcomingHolidays.map((h: any) => (
                  <div key={h.name} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <h4 className="font-semibold text-xs">{h.name}</h4>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(h.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase py-1 px-2.5 rounded-full bg-secondary border">Holiday</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-base mb-4">Recent Activity</h3>
            <div className="flex flex-col gap-3">
              {!empData?.recentActivity?.length ? (
                <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
              ) : (
                empData.recentActivity.slice(0, 4).map((act: any) => (
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

      {/* Attendance History Table */}
      {empData?.attendanceHistory?.length > 0 && (
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base">Attendance History</h3>
            <Link
              to="/attendance"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group"
            >
              View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left text-muted-foreground font-semibold py-2 pr-4 uppercase tracking-wider">Date</th>
                  <th className="text-left text-muted-foreground font-semibold py-2 pr-4 uppercase tracking-wider">Status</th>
                  <th className="text-left text-muted-foreground font-semibold py-2 pr-4 uppercase tracking-wider">Check In</th>
                  <th className="text-left text-muted-foreground font-semibold py-2 uppercase tracking-wider">Check Out</th>
                </tr>
              </thead>
              <tbody>
                {empData.attendanceHistory.slice(0, 7).map((rec: any) => (
                  <tr key={rec.id || rec.date} className="border-b last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="py-2.5 pr-4 font-medium">
                      {new Date(rec.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          rec.status === 'PRESENT' || rec.status === 'LATE'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : rec.status === 'ABSENT'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            : 'bg-secondary text-muted-foreground border-border'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {rec.checkIn
                        ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {rec.checkOut
                        ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export const Dashboard = () => {
  const { user } = useAuth();
  const [isAdminView, setIsAdminView] = useState(user?.role === 'ADMIN');

  return (
    <div className="space-y-6">
      {user?.role === 'ADMIN' && (
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-primary/10 text-primary rounded-full border border-primary/20">
              Admin Mode
            </span>
            <p className="text-xs text-muted-foreground font-medium hidden sm:block">
              Toggle between HR admin view and your personal portal
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

      {isAdminView ? <AdminDashboard /> : <EmployeeDashboard />}
    </div>
  );
};
