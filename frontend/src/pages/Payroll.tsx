import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/auth.context';
import { useToast } from '../context/toast.context';
import { api } from '../services/api';
import {
  DollarSign,
  FileText,
  Printer,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  Info,
} from 'lucide-react';

export const Payroll = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.payroll.getMyPayroll();
      setPayrolls(data);
      if (data.length > 0) {
        setSelectedPayroll(data[0]); // select latest by default
      }
    } catch (err: any) {
      toast.error('Failed to load payroll statements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 inline-flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Paid</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Pending</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payroll & Payslips</h2>
        <p className="text-sm text-muted-foreground mt-1">
          View your salary history, download monthly payslips, and inspect earnings breakdowns.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="h-96 bg-card border rounded-2xl" />
          <div className="h-96 bg-card border rounded-2xl lg:col-span-2" />
        </div>
      ) : payrolls.length === 0 ? (
        <div className="bg-card border rounded-2xl p-16 text-center shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 mx-auto">
            <DollarSign className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold">No Payslips Generated</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Your payroll logs have not been processed by HR for this period. If you believe this is a mistake, please contact the administrative team.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payslips List */}
          <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between overflow-hidden">
            <div>
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Payslip Statements
              </h3>
              <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
                {payrolls.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPayroll(p)}
                    className={`p-4 border rounded-xl flex justify-between items-center cursor-pointer transition-all ${
                      selectedPayroll?.id === p.id
                        ? 'border-primary bg-primary/5'
                        : 'bg-secondary/10 hover:bg-secondary/30'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm">
                        {new Date(p.month + '-02').toLocaleDateString([], { month: 'long', year: 'numeric' })}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Net Pay: ${p.netSalary.toFixed(2)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right flex flex-col gap-1 items-end">
                      {getStatusBadge(p.status)}
                      <span className="text-[10px] font-semibold text-primary mt-1 inline-flex items-center gap-1">
                        View Details
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payslip Breakdown View (Printable) */}
          {selectedPayroll && (
            <div className="bg-card border rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between print:border-0 print:shadow-none print:p-0">
              <div id="printable-payslip">
                {/* Payslip Header */}
                <div className="flex justify-between items-start pb-6 border-b">
                  <div>
                    <h3 className="font-extrabold text-lg">PAYSLIP STATEMENT</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Month: {new Date(selectedPayroll.month + '-02').toLocaleDateString([], { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold text-sm">ANTIGRAVITY CORP</h4>
                    <p className="text-[10px] text-muted-foreground">123 Corporate Way, San Francisco, CA</p>
                  </div>
                </div>

                {/* Employee Details Info */}
                <div className="grid grid-cols-2 gap-4 py-6 border-b text-xs">
                  <div>
                    <p className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">Employee details</p>
                    <h5 className="font-bold text-sm mt-1">{user?.fullName}</h5>
                    <p className="text-muted-foreground mt-0.5">ID: {user?.employeeId}</p>
                    <p className="text-muted-foreground">Email: {user?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">Payment Details</p>
                    <p className="font-medium mt-1">Status: <span className={selectedPayroll.status === 'PAID' ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>{selectedPayroll.status}</span></p>
                    <p className="text-muted-foreground mt-0.5">Date Issued: {new Date(selectedPayroll.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Earnings & Deductions Breakdowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-b text-xs">
                  {/* Earnings */}
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b pb-2 mb-3">Earnings</h4>
                    <div className="flex justify-between py-1.5 border-b border-dashed">
                      <span>Base Salary</span>
                      <span className="font-semibold">${selectedPayroll.baseSalary.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-dashed">
                      <span>House Rent Allowance</span>
                      <span className="font-semibold">${(selectedPayroll.allowances * 0.5).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-dashed">
                      <span>Medical & Travel Perks</span>
                      <span className="font-semibold">${(selectedPayroll.allowances * 0.5).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold py-3 mt-1 bg-secondary/10 px-2 rounded">
                      <span>Total Earnings (A)</span>
                      <span>${(selectedPayroll.baseSalary + selectedPayroll.allowances).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b pb-2 mb-3">Deductions</h4>
                    <div className="flex justify-between py-1.5 border-b border-dashed">
                      <span>Professional Income Tax</span>
                      <span className="font-semibold">${(selectedPayroll.deductions * 0.4).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-dashed">
                      <span>Provident Fund Contributions</span>
                      <span className="font-semibold">${(selectedPayroll.deductions * 0.4).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-dashed">
                      <span>Medical Premium Co-pay</span>
                      <span className="font-semibold">${(selectedPayroll.deductions * 0.2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold py-3 mt-1 bg-rose-500/5 text-rose-500 px-2 rounded border border-rose-500/10">
                      <span>Total Deductions (B)</span>
                      <span>${selectedPayroll.deductions.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Salary Summary */}
                <div className="flex justify-between items-center bg-primary text-primary-foreground p-5 rounded-xl mt-6 shadow-sm">
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-wider opacity-85">Net Take-Home Pay (A - B)</h4>
                    <p className="text-[10px] opacity-75 mt-0.5">Calculated earnings after basic withholdings</p>
                  </div>
                  <h3 className="text-3xl font-black">${selectedPayroll.netSalary.toFixed(2)}</h3>
                </div>
              </div>

              {/* Action Print bar */}
              <div className="flex items-center justify-end gap-3 mt-8 print:hidden pt-4 border-t">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-auto">
                  <Info className="w-3.5 h-3.5" />
                  <span>Salary breakdown is read-only.</span>
                </div>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 border bg-background hover:bg-secondary text-foreground font-semibold py-2 px-4 rounded-xl text-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Statement
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
