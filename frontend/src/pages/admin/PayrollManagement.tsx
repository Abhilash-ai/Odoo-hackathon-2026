import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/toast.context';
import {
  DollarSign,
  Briefcase,
  Play,
  CheckCircle,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  Plus,
  Calendar,
  X,
} from 'lucide-react';

export const PayrollManagement = () => {
  const { toast } = useToast();

  const [monthFilter, setMonthFilter] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Generate form state
  const [showGenModal, setShowGenModal] = useState(false);
  const [genMonth, setGenMonth] = useState('');
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.payroll.getSummary(monthFilter);
      setSummary(data);
    } catch (err: any) {
      toast.error('Failed to load company payroll overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Default to current month YYYY-MM
    const today = new Date();
    const currMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    setMonthFilter(currMonth);
    setGenMonth(currMonth);
  }, []);

  useEffect(() => {
    if (monthFilter) {
      loadData();
    }
  }, [monthFilter]);

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genMonth || !/^\d{4}-\d{2}$/.test(genMonth)) {
      toast.error('Please enter a valid month (YYYY-MM).');
      return;
    }

    setGenerating(true);
    try {
      const res = await api.payroll.generate({ month: genMonth });
      toast.success(res.message || 'Payroll generated successfully!');
      setMonthFilter(genMonth); // Switch review to generated month
      setShowGenModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate payroll.');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleStatus = async (payrollId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
    try {
      await api.payroll.updateStatus(payrollId, nextStatus);
      toast.success(`Payslip status set to ${nextStatus.toLowerCase()}`);
      loadData();
    } catch (err: any) {
      toast.error('Failed to update payslip status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manage Corporate Payroll</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure salary components, generate monthly payouts, and track payout logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGenModal(true)}
            className="bg-primary text-primary-foreground font-semibold py-2.5 px-4 rounded-xl text-sm hover:bg-primary/95 transition-all shadow-md cursor-pointer flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Process Monthly Payroll
          </button>
        </div>
      </div>

      {/* Selector & stats grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Month Selector Card */}
        <div className="bg-card border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">Selected Period</p>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-xs font-semibold"
              />
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground mt-6 border-t pt-3">
            Select a period to load the company payout breakdowns and update payment flags.
          </div>
        </div>

        {/* Total Cost */}
        <div className="bg-card border p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Payroll Expense</p>
            <h3 className="text-2xl font-black mt-2 text-primary">
              ${summary?.totalCost ? summary.totalCost.toFixed(2) : '0.00'}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/10">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Paid Count */}
        <div className="bg-card border p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Paid Slips</p>
            <h3 className="text-2xl font-black mt-2 text-emerald-500">{summary?.paidCount || 0} Slips</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/10">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Count */}
        <div className="bg-card border p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Pending Slips</p>
            <h3 className="text-2xl font-black mt-2 text-amber-500">{summary?.pendingCount || 0} Slips</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/10">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Payroll Statement List */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Payout Summary Table ({monthFilter})
          </h3>

          <div className="overflow-x-auto border rounded-xl bg-background/30">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-secondary/40 border-b text-muted-foreground font-bold uppercase tracking-wider">
                  <th className="p-3.5">Employee ID</th>
                  <th className="p-3.5">Full Name</th>
                  <th className="p-3.5">Base Salary</th>
                  <th className="p-3.5">Allowances</th>
                  <th className="p-3.5">Deductions</th>
                  <th className="p-3.5">Net Payout</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse h-12">
                      <td colSpan={8} className="p-3"><div className="h-4 bg-secondary/35 rounded w-full" /></td>
                    </tr>
                  ))
                ) : !summary || summary.payrolls?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-muted-foreground font-semibold">
                      No payroll records generated for {monthFilter}. Click "Process Monthly Payroll" to compute salaries.
                    </td>
                  </tr>
                ) : (
                  summary.payrolls.map((p: any) => (
                    <tr key={p.id} className="hover:bg-secondary/10">
                      <td className="p-3.5 font-semibold">{p.user.employeeId}</td>
                      <td className="p-3.5 font-bold">{p.user.fullName}</td>
                      <td className="p-3.5">${p.baseSalary.toFixed(2)}</td>
                      <td className="p-3.5 text-emerald-500">+${p.allowances.toFixed(2)}</td>
                      <td className="p-3.5 text-rose-500">-${p.deductions.toFixed(2)}</td>
                      <td className="p-3.5 font-extrabold text-foreground">${p.netSalary.toFixed(2)}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border ${
                          p.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleStatus(p.id, p.status)}
                          className={`text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-lg border transition-all cursor-pointer ${
                            p.status === 'PAID'
                              ? 'bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 border-rose-500/10'
                              : 'bg-emerald-500 text-white hover:bg-emerald-600 border-transparent shadow-sm'
                          }`}
                        >
                          Mark {p.status === 'PAID' ? 'Pending' : 'Paid'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PROCESS PAYROLL MODAL */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card border w-full max-w-sm rounded-2xl shadow-xl p-6 relative flex flex-col justify-between">
            <button
              onClick={() => setShowGenModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-secondary"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base mb-2 flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              Compute Monthly Payroll
            </h3>
            <p className="text-xs text-muted-foreground mb-4 leading-normal">
              This will automatically fetch default salary configurations (base, allowance, deductions) for all active employee profiles and generate their payslips.
            </p>
            <form onSubmit={handleGeneratePayroll} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Target Month</label>
                <input
                  type="month"
                  value={genMonth}
                  onChange={(e) => setGenMonth(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-4 py-2.5 border rounded-xl hover:bg-secondary text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl text-xs hover:bg-primary/95 transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {generating ? 'Computing...' : 'Generate Payroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
