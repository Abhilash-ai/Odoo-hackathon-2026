import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/toast.context';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  MessageSquare,
  Paperclip,
  TrendingUp,
  X,
  AlertCircle,
  Users,
} from 'lucide-react';

export const LeaveRequestsReview = () => {
  const { toast } = useToast();

  const [requests, setRequests] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter
  const [statusFilter, setStatusFilter] = useState('PENDING');

  // Action Dialog Form State
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [actionComment, setActionComment] = useState('');
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqData, analyticsData] = await Promise.all([
        api.leaves.getRequests(statusFilter === 'ALL' ? '' : statusFilter),
        api.leaves.getAnalytics(),
      ]);
      setRequests(reqData);
      setAnalytics(analyticsData);
    } catch (err: any) {
      toast.error('Failed to load leave records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleOpenAction = (req: any, type: 'APPROVED' | 'REJECTED') => {
    setSelectedReq(req);
    setActionType(type);
    setActionComment('');
    setShowActionModal(true);
  };

  const handleProcessLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    setSubmittingAction(true);
    try {
      await api.leaves.handleAction(selectedReq.id, {
        status: actionType,
        comment: actionComment.trim() || null,
      });

      toast.success(`Leave request successfully ${actionType.toLowerCase()}!`);
      setShowActionModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const calculateDays = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diff = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Approved</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">Rejected</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">Pending</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Review Leave Applications</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Inspect employee leave balance reserves, approve or reject applications, and track active leaves.
        </p>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Pending Approvals</p>
          <h4 className="text-xl font-bold mt-1 text-amber-500">{analytics?.pending || 0} Requests</h4>
        </div>
        <div className="bg-card border p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Approved (Month)</p>
          <h4 className="text-xl font-bold mt-1 text-emerald-500">{analytics?.approved || 0} Requests</h4>
        </div>
        <div className="bg-card border p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Rejected</p>
          <h4 className="text-xl font-bold mt-1 text-rose-500">{analytics?.rejected || 0} Requests</h4>
        </div>
        <div className="bg-card border p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Employees Out Today</p>
          <h4 className="text-xl font-bold mt-1 text-primary">{analytics?.employeesOnLeaveToday?.length || 0} On Leave</h4>
        </div>
      </div>

      {/* Split Layout: Leaves requests list vs Active Leaves panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Applications List
              </h3>
              <div className="flex bg-secondary p-1 rounded-xl border">
                <button
                  onClick={() => setStatusFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    statusFilter === 'PENDING' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('APPROVED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    statusFilter === 'APPROVED' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setStatusFilter('REJECTED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    statusFilter === 'REJECTED' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Rejected
                </button>
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    statusFilter === 'ALL' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-28 bg-secondary/10 border rounded-xl animate-pulse" />
                ))
              ) : requests.length === 0 ? (
                <div className="py-16 text-center text-xs text-muted-foreground">
                  No leave requests found matching this status filter.
                </div>
              ) : (
                requests.map((r) => {
                  const days = calculateDays(r.startDate, r.endDate);
                  return (
                    <div key={r.id} className="p-4 bg-secondary/10 border rounded-xl flex flex-col justify-between gap-4">
                      {/* Top Info */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border overflow-hidden">
                            {r.user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm leading-tight">{r.user.fullName}</h4>
                            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">ID: {r.user.employeeId}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {getStatusBadge(r.status)}
                          <span className="text-[10px] text-muted-foreground font-semibold block mt-1.5">
                            {days} {days === 1 ? 'day' : 'days'} ({r.leaveType})
                          </span>
                        </div>
                      </div>

                      {/* Detail text */}
                      <div className="text-xs space-y-2 pl-1 bg-background/30 p-2.5 rounded-lg border border-dashed">
                        <p className="text-muted-foreground font-semibold">
                          Duration: <span className="text-foreground">{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</span>
                        </p>
                        <p className="text-foreground leading-normal whitespace-pre-wrap italic">
                          "{r.reason}"
                        </p>
                        {r.comment && (
                          <p className="text-[11px] text-primary flex items-start gap-1">
                            <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span><strong>Admin Comment:</strong> "{r.comment}"</span>
                          </p>
                        )}
                      </div>

                      {/* Action Triggers */}
                      <div className="flex justify-between items-center border-t pt-3 mt-1 text-xs">
                        <div>
                          {r.attachmentUrl && (
                            <a
                              href={r.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline font-bold flex items-center gap-1"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              View Attachment
                            </a>
                          )}
                        </div>
                        {r.status === 'PENDING' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenAction(r, 'REJECTED')}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleOpenAction(r, 'APPROVED')}
                              className="bg-primary text-primary-foreground font-semibold px-4 py-1.5 rounded-lg hover:bg-primary/95 transition-all text-xs cursor-pointer shadow-sm shadow-primary/10"
                            >
                              Approve
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Employees currently on leave panel */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              On Leave Today
            </h3>
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
              {!analytics || analytics.employeesOnLeaveToday?.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No employees are currently on leave today.
                </div>
              ) : (
                analytics.employeesOnLeaveToday.map((al: any) => (
                  <div key={al.id} className="p-3 bg-secondary/20 border rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs border overflow-hidden">
                        {al.profilePhoto ? (
                          <img src={al.profilePhoto} alt={al.fullName} className="w-full h-full object-cover" />
                        ) : (
                          al.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs truncate max-w-[120px]">{al.fullName}</h4>
                        <span className="text-[9px] text-muted-foreground block font-semibold mt-0.5">ID: {al.employeeId}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">{al.leaveType}</span>
                      <span className="text-[9px] text-muted-foreground block mt-1 leading-none">{al.dates}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* APPROVAL / REJECTION ACTION MODAL */}
      {showActionModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card border w-full max-w-md rounded-2xl shadow-xl p-6 relative flex flex-col justify-between">
            <button
              onClick={() => setShowActionModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-secondary"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base mb-2 flex items-center gap-2">
              {actionType === 'APPROVED' ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500" />
              )}
              {actionType === 'APPROVED' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </h3>
            <p className="text-xs text-muted-foreground mb-4 leading-normal">
              Processing leave for <strong className="text-foreground">{selectedReq.user.fullName}</strong>.
              Duration: {calculateDays(selectedReq.startDate, selectedReq.endDate)} days.
            </p>
            
            <form onSubmit={handleProcessLeave} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comment / Feedback (Optional)</label>
                <textarea
                  rows={3}
                  placeholder={actionType === 'APPROVED' ? 'Have a good rest!' : 'State reason for rejection...'}
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  className="w-full p-3 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2.5 border rounded-xl hover:bg-secondary text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className={`font-semibold px-4 py-2.5 rounded-xl text-xs hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 text-white ${
                    actionType === 'APPROVED' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/10' : 'bg-rose-500 shadow-sm shadow-rose-500/10'
                  }`}
                >
                  {submittingAction ? 'Processing...' : (actionType === 'APPROVED' ? 'Approve Leave' : 'Reject Leave')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
