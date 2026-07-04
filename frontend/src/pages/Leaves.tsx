import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/auth.context';
import { useToast } from '../context/toast.context';
import { api } from '../services/api';
import {
  Calendar,
  FileText,
  Plus,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Paperclip,
} from 'lucide-react';

export const Leaves = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [leaves, setLeaves] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [leaveType, setLeaveType] = useState('PAID');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.leaves.getMyLeaves();
      setLeaves(data.leaves);
      setBalance(data.balance);
    } catch (err: any) {
      toast.error('Failed to load leaves logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leaveType || !startDate || !endDate || !reason) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      toast.error('End date cannot be earlier than start date.');
      return;
    }

    setSubmitting(true);
    try {
      await api.leaves.apply({
        leaveType,
        startDate,
        endDate,
        reason: reason.trim(),
        attachmentUrl: attachmentUrl.trim() || null,
      });

      toast.success('Leave request applied successfully!');
      
      // Reset form
      setStartDate('');
      setEndDate('');
      setReason('');
      setAttachmentUrl('');

      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 inline-flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 inline-flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>;
      case 'PENDING':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      default:
        return null;
    }
  };

  const calculateDays = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diff = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Leave Management</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Apply for leaves, track approvals, and view your remaining balance allowances.
        </p>
      </div>

      {/* Leave Balance Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-card border p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Paid Leaves Left</p>
          <h4 className="text-xl font-bold mt-1 text-primary">{balance?.paid || 0} Days</h4>
        </div>
        <div className="bg-card border p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Sick Leaves Left</p>
          <h4 className="text-xl font-bold mt-1 text-emerald-500">{balance?.sick || 0} Days</h4>
        </div>
        <div className="bg-card border p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Casual Leaves Left</p>
          <h4 className="text-xl font-bold mt-1 text-amber-500">{balance?.casual || 0} Days</h4>
        </div>
        <div className="bg-card border p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Unpaid Leaves Taken</p>
          <h4 className="text-xl font-bold mt-1 text-rose-500">{balance?.unpaid || 0} Days</h4>
        </div>
      </div>

      {/* Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Request Form */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Apply for Leave
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Leave Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm font-medium"
                >
                  <option value="PAID">Paid Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-xs font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Reason for Leave
                </label>
                <textarea
                  rows={3}
                  placeholder="State your reason for leave..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm resize-none"
                />
              </div>

              {/* Attachment URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                  Attachment Link (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/your-doc"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl shadow-md hover:bg-primary/95 transition-all text-sm mt-2 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  'Submit Request'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Leave Requests History */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Application History
            </h3>
            <div className="flex flex-col gap-4 max-h-[440px] overflow-y-auto pr-1">
              {leaves.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  You have not submitted any leave requests yet.
                </div>
              ) : (
                leaves.map((l) => {
                  const days = calculateDays(l.startDate, l.endDate);
                  return (
                    <div key={l.id} className="p-4 bg-secondary/15 border rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm leading-tight capitalize">
                            {l.leaveType.toLowerCase()} Leave
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                            • {days} {days === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-foreground/80 mt-2 font-medium italic">
                          "{l.reason}"
                        </p>
                        
                        {l.comment && (
                          <div className="mt-2.5 p-2 rounded bg-background border text-[11px] flex gap-1.5 items-start">
                            <Info className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                            <span>
                              <strong className="font-bold text-foreground">HR Feedback:</strong> "{l.comment}"
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0 flex flex-col gap-2 items-end">
                        {getStatusBadge(l.status)}
                        {l.attachmentUrl && (
                          <a
                            href={l.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-primary hover:underline"
                          >
                            View Attachment
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
