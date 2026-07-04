import React, { useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/toast.context';
import {
  FileSpreadsheet,
  Users,
  Clock,
  Calendar,
  DollarSign,
  Download,
  Info,
} from 'lucide-react';

export const Reports = () => {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);

  // Month selectors for filters
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [leaveFilter, setLeaveFilter] = useState('ALL');
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7));

  // CSV Exporter Helper
  const triggerCSVDownload = (data: any[], fileName: string, headers: string[], keys: string[]) => {
    let csvContent = headers.join(',') + '\n';
    data.forEach((row) => {
      const line = keys.map((key) => {
        // Handle nested keys like "user.fullName"
        let val = row;
        const keyParts = key.split('.');
        for (const part of keyParts) {
          val = val ? val[part] : '';
        }
        
        if (val === null || val === undefined) return '';
        const stringVal = String(val);
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      }).join(',');
      csvContent += line + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportEmployees = async () => {
    setDownloading('employees');
    try {
      const res = await api.employees.list('', '', '', 1, 1000); // fetch all
      const headers = ['Employee ID', 'Full Name', 'Email', 'Role', 'Status', 'Phone', 'Address', 'Joined Date'];
      const keys = ['employeeId', 'fullName', 'email', 'role', 'status', 'phone', 'address', 'createdAt'];
      triggerCSVDownload(res.employees, 'employees_directory_report', headers, keys);
      toast.success('Employee directory report exported!');
    } catch (err: any) {
      toast.error('Failed to export employee directory.');
    } finally {
      setDownloading(null);
    }
  };

  const handleExportAttendance = async () => {
    setDownloading('attendance');
    try {
      const res = await api.attendance.getCompanyReport(attendanceDate);
      const headers = ['Employee ID', 'Full Name', 'Email', 'Date', 'Check In', 'Check Out', 'Working Hours', 'Status'];
      const keys = ['user.employeeId', 'user.fullName', 'user.email', 'date', 'checkIn', 'checkOut', 'workingHours', 'status'];
      triggerCSVDownload(res, `attendance_report_${attendanceDate}`, headers, keys);
      toast.success(`Attendance report for ${attendanceDate} exported!`);
    } catch (err: any) {
      toast.error('Failed to export daily attendance.');
    } finally {
      setDownloading(null);
    }
  };

  const handleExportLeaves = async () => {
    setDownloading('leaves');
    try {
      const res = await api.leaves.getRequests(leaveFilter === 'ALL' ? '' : leaveFilter);
      const headers = ['Employee ID', 'Full Name', 'Leave Type', 'Start Date', 'End Date', 'Reason', 'Status', 'HR Comment'];
      const keys = ['user.employeeId', 'user.fullName', 'leaveType', 'startDate', 'endDate', 'reason', 'status', 'comment'];
      triggerCSVDownload(res, `leave_applications_report_${leaveFilter.toLowerCase()}`, headers, keys);
      toast.success('Leave applications report exported!');
    } catch (err: any) {
      toast.error('Failed to export leave requests.');
    } finally {
      setDownloading(null);
    }
  };

  const handleExportPayroll = async () => {
    setDownloading('payroll');
    try {
      const res = await api.payroll.getSummary(payrollMonth);
      const headers = ['Employee ID', 'Full Name', 'Base Salary', 'Allowances', 'Deductions', 'Net Payout', 'Payout Status'];
      const keys = ['user.employeeId', 'user.fullName', 'baseSalary', 'allowances', 'deductions', 'netSalary', 'status'];
      triggerCSVDownload(res.payrolls, `payroll_statement_report_${payrollMonth}`, headers, keys);
      toast.success(`Payroll statement report for ${payrollMonth} exported!`);
    } catch (err: any) {
      toast.error('Failed to export payroll statement.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Generate, filter, and extract operational CSV spreadsheets for auditing and analytics.
        </p>
      </div>

      {/* Grid of Report modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employee Directory */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between h-56">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Employee Directory
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-normal">
                Export the complete list of corporate profiles including employee IDs, contact phone/resident addresses, system roles, and status flags.
              </p>
            </div>
          </div>
          <button
            onClick={handleExportEmployees}
            disabled={downloading !== null}
            className="w-full bg-secondary hover:bg-secondary/80 border text-foreground font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading === 'employees' ? 'Exporting...' : 'Export Directory CSV'}
          </button>
        </div>

        {/* Daily Attendance */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between h-56">
          <div className="space-y-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Daily Attendance Logs
            </h3>
            <p className="text-xs text-muted-foreground leading-normal">
              Extract check-in stamps, check-out stamps, and calculated working hours for all checked-in employees on a specific date.
            </p>
            <div className="flex flex-col gap-1">
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border bg-background text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none w-full"
              />
            </div>
          </div>
          <button
            onClick={handleExportAttendance}
            disabled={downloading !== null}
            className="w-full bg-secondary hover:bg-secondary/80 border text-foreground font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
          >
            <Download className="w-4 h-4" />
            {downloading === 'attendance' ? 'Exporting...' : 'Export Attendance CSV'}
          </button>
        </div>

        {/* Leave Applications */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between h-56">
          <div className="space-y-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Leave Applications Summary
            </h3>
            <p className="text-xs text-muted-foreground leading-normal">
              Export leave requests filtered by status, showing requested durations, reasoning, and administrative comments.
            </p>
            <select
              value={leaveFilter}
              onChange={(e) => setLeaveFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border bg-background text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none w-full"
            >
              <option value="ALL">All Requests</option>
              <option value="PENDING">Pending Requests Only</option>
              <option value="APPROVED">Approved Requests Only</option>
              <option value="REJECTED">Rejected Requests Only</option>
            </select>
          </div>
          <button
            onClick={handleExportLeaves}
            disabled={downloading !== null}
            className="w-full bg-secondary hover:bg-secondary/80 border text-foreground font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
          >
            <Download className="w-4 h-4" />
            {downloading === 'leaves' ? 'Exporting...' : 'Export Leaves CSV'}
          </button>
        </div>

        {/* Payroll statement */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between h-56">
          <div className="space-y-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Payroll Payout Reports
            </h3>
            <p className="text-xs text-muted-foreground leading-normal">
              Generate detailed salary statements for a selected month, auditing base numbers, allowances, tax deductions, and net payouts.
            </p>
            <input
              type="month"
              value={payrollMonth}
              onChange={(e) => setPayrollMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border bg-background text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none w-full"
            />
          </div>
          <button
            onClick={handleExportPayroll}
            disabled={downloading !== null}
            className="w-full bg-secondary hover:bg-secondary/80 border text-foreground font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
          >
            <Download className="w-4 h-4" />
            {downloading === 'payroll' ? 'Exporting...' : 'Export Payroll CSV'}
          </button>
        </div>
      </div>
      
      <div className="p-4 bg-primary/5 rounded-2xl border flex gap-3 text-xs leading-normal max-w-lg mx-auto">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-muted-foreground">
          <strong>Tip:</strong> All exported spreadsheets use UTF-8 CSV formatting, making them fully compatible with Microsoft Excel, Google Sheets, and Odoo CRM data models.
        </p>
      </div>
    </div>
  );
};
