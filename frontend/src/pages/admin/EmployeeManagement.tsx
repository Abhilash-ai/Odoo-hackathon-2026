import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/toast.context';
import {
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  UserCheck,
  Shield,
  FileDown,
  Edit2,
  ChevronLeft,
  ChevronRight,
  UserMinus,
  X,
} from 'lucide-react';

export const EmployeeManagement = () => {
  const { toast } = useToast();

  const [employees, setEmployees] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Dialog States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Create Employee Form State
  const [newEmpId, setNewEmpId] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('EMPLOYEE');
  const [creating, setCreating] = useState(false);

  // Edit Employee Form State
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editEmpId, setEditEmpId] = useState('');
  const [editRole, setEditRole] = useState('EMPLOYEE');
  const [editBaseSalary, setEditBaseSalary] = useState('0');
  const [editAllowances, setEditAllowances] = useState('0');
  const [editDeductions, setEditDeductions] = useState('0');
  const [updating, setUpdating] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.employees.list(search, roleFilter, statusFilter, page, 8);
      setEmployees(res.employees);
      setMeta(res.meta);
    } catch (err: any) {
      toast.error('Failed to load employee directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, roleFilter, statusFilter, page]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpId || !newFullName || !newEmail || !newPassword || !newRole) {
      toast.error('All fields are required.');
      return;
    }

    setCreating(true);
    try {
      await api.employees.create({
        employeeId: newEmpId.trim(),
        fullName: newFullName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: newRole,
      });

      toast.success('New employee profile created successfully!');
      setShowCreateModal(false);
      
      // Reset Form
      setNewEmpId('');
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('EMPLOYEE');
      
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || 'Creation failed.');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (emp: any) => {
    setSelectedEmp(emp);
    setEditFullName(emp.fullName);
    setEditEmail(emp.email);
    setEditEmpId(emp.employeeId);
    setEditRole(emp.role);
    // Fetch full profile to get salary configuration
    api.employees.get(emp.id).then((fullProfile) => {
      setEditBaseSalary(String(fullProfile.baseSalary || 0));
      setEditAllowances(String(fullProfile.allowances || 0));
      setEditDeductions(String(fullProfile.deductions || 0));
    });
    setShowEditModal(true);
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName || !editEmail || !editEmpId || !editRole) {
      toast.error('Required fields cannot be empty.');
      return;
    }

    setUpdating(true);
    try {
      // 1. Update basic profile info
      await api.employees.update(selectedEmp.id, {
        fullName: editFullName.trim(),
        email: editEmail.trim(),
        employeeId: editEmpId.trim(),
        role: editRole,
      });

      // 2. Update salary configuration
      await api.payroll.updateConfig({
        userId: selectedEmp.id,
        baseSalary: parseFloat(editBaseSalary) || 0,
        allowances: parseFloat(editAllowances) || 0,
        deductions: parseFloat(editDeductions) || 0,
      });

      toast.success('Employee profile updated successfully!');
      setShowEditModal(false);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || 'Update failed.');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const actionText = nextStatus === 'ACTIVE' ? 'activate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${actionText} this employee account?`)) return;

    try {
      await api.employees.updateStatus(id, nextStatus);
      toast.success(`Account successfully ${nextStatus === 'ACTIVE' ? 'activated' : 'suspended'}.`);
      fetchEmployees();
    } catch (err: any) {
      toast.error('Failed to change status.');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('WARNING: Are you sure you want to permanently delete this employee? This action cannot be undone.')) return;
    try {
      await api.employees.delete(id);
      toast.success('Employee permanently deleted.');
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || 'Deletion failed.');
    }
  };

  const handleExportCSV = () => {
    // Open in window trigger download
    window.open(api.employees.exportCSVUrl(), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employee Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Browse corporate directories, add new profiles, configure salaries, and export CSV reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 border bg-background hover:bg-secondary text-foreground font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 px-4 rounded-xl text-sm hover:bg-primary/95 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Employee
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-card border p-4 rounded-2xl flex flex-col md:flex-row justify-between gap-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, employee ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs font-semibold"
          >
            <option value="">All Roles</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin / HR</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Employee List Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 bg-card border rounded-2xl" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-card border rounded-2xl p-16 text-center shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-4 mx-auto border">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold">No Employees Found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            No employee profiles match your search criteria. Try modifying your search keywords or active filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className={`bg-card border rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all hover:border-primary ${
                emp.status === 'SUSPENDED' ? 'opacity-70 bg-secondary/10' : ''
              }`}
            >
              <div>
                {/* Employee badge role / Status */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                    emp.role === 'ADMIN' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary border'
                  }`}>
                    {emp.role}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                    emp.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  }`}>
                    {emp.status}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border overflow-hidden shrink-0">
                    {emp.profilePhoto ? (
                      <img src={emp.profilePhoto} alt={emp.fullName} className="w-full h-full object-cover" />
                    ) : (
                      emp.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-extrabold text-sm text-foreground truncate">{emp.fullName}</h4>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">ID: {emp.employeeId}</p>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground mt-4 space-y-1.5 border-t pt-3">
                  <p className="truncate">Email: <span className="font-medium text-foreground">{emp.email}</span></p>
                  <p>Joined: <span className="font-medium text-foreground">{new Date(emp.createdAt).toLocaleDateString()}</span></p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t pt-3.5 mt-5">
                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="p-2 border rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  title="Edit details & Salary"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleStatus(emp.id, emp.status)}
                    className={`p-2 border rounded-xl transition-all cursor-pointer ${
                      emp.status === 'ACTIVE'
                        ? 'hover:bg-rose-500/15 text-rose-500/80 hover:text-rose-500 border-rose-500/10'
                        : 'hover:bg-emerald-500/15 text-emerald-500/80 hover:text-emerald-500 border-emerald-500/10'
                    }`}
                    title={emp.status === 'ACTIVE' ? 'Suspend Employee' : 'Activate Employee'}
                  >
                    {emp.status === 'ACTIVE' ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(emp.id)}
                    className="p-2 border rounded-xl hover:bg-rose-500 hover:text-white text-muted-foreground hover:border-rose-500 transition-all cursor-pointer"
                    title="Delete Employee"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t text-xs font-semibold text-muted-foreground">
          <span>Showing {employees.length} of {meta.total} employees</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border rounded-xl hover:bg-secondary disabled:opacity-50 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3">Page {page} of {meta.totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="p-2 border rounded-xl hover:bg-secondary disabled:opacity-50 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CREATE EMPLOYEE MODAL (Dialog) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card border w-full max-w-md rounded-2xl shadow-xl p-6 relative flex flex-col justify-between max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-secondary"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Create Employee Profile
            </h3>
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Employee ID</label>
                <input
                  type="text"
                  placeholder="EMP004"
                  value={newEmpId}
                  onChange={(e) => setNewEmpId(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  placeholder="David Miller"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                <input
                  type="email"
                  placeholder="david@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Initial Password</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs font-semibold"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin / HR</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border rounded-xl hover:bg-secondary text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl text-xs hover:bg-primary/95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE & SALARY CONFIG MODAL (Dialog) */}
      {showEditModal && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card border w-full max-w-lg rounded-2xl shadow-xl p-6 relative flex flex-col justify-between max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-secondary"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Edit Profile & Salary Setup
            </h3>
            <form onSubmit={handleEditEmployee} className="space-y-4">
              <p className="text-xs font-bold text-primary pb-1 border-b uppercase tracking-wider">Employee Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Employee ID</label>
                  <input
                    type="text"
                    value={editEmpId}
                    onChange={(e) => setEditEmpId(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">System Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs font-semibold"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Admin / HR</option>
                  </select>
                </div>
              </div>

              <p className="text-xs font-bold text-primary pt-3 pb-1 border-b uppercase tracking-wider">Salary Configuration</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Base Salary ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editBaseSalary}
                    onChange={(e) => setEditBaseSalary(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Allowances ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editAllowances}
                    onChange={(e) => setEditAllowances(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Deductions ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editDeductions}
                    onChange={(e) => setEditDeductions(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 border rounded-xl hover:bg-secondary text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl text-xs hover:bg-primary/95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
