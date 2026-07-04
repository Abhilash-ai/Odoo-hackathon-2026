const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('hrms_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

export const api = {
  // Authentication
  auth: {
    signup: (body: any) =>
      fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),

    signin: (body: any) =>
      fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),

    verifyEmail: (token: string) =>
      fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ token }),
      }).then(handleResponse),

    resendVerification: (email: string) =>
      fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email }),
      }).then(handleResponse),

    forgotPassword: (email: string) =>
      fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email }),
      }).then(handleResponse),

    resetPassword: (body: any) =>
      fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),
  },

  // Employees
  employees: {
    list: (search = '', role = '', status = '', page = 1, limit = 10) =>
      fetch(
        `${API_BASE_URL}/employees?search=${search}&role=${role}&status=${status}&page=${page}&limit=${limit}`,
        {
          headers: getHeaders(),
        }
      ).then(handleResponse),

    get: (id: string) =>
      fetch(`${API_BASE_URL}/employees/${id}`, {
        headers: getHeaders(),
      }).then(handleResponse),

    create: (body: any) =>
      fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),

    update: (id: string, body: any) =>
      fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),

    delete: (id: string) =>
      fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      }).then(handleResponse),

    updateStatus: (id: string, status: string) =>
      fetch(`${API_BASE_URL}/employees/${id}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      }).then(handleResponse),

    exportCSVUrl: () => `${API_BASE_URL}/employees/export`,

    directory: () =>
      fetch(`${API_BASE_URL}/employees?limit=200`, {
        headers: getHeaders(),
      }).then(handleResponse),

    uploadDocument: (body: any) =>
      fetch(`${API_BASE_URL}/employees/documents`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),

    deleteDocument: (docId: string) =>
      fetch(`${API_BASE_URL}/employees/documents/${docId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      }).then(handleResponse),
  },

  // Attendance
  attendance: {
    checkIn: () =>
      fetch(`${API_BASE_URL}/attendance/check-in`, {
        method: 'POST',
        headers: getHeaders(),
      }).then(handleResponse),

    checkOut: () =>
      fetch(`${API_BASE_URL}/attendance/check-out`, {
        method: 'POST',
        headers: getHeaders(),
      }).then(handleResponse),

    getToday: () =>
      fetch(`${API_BASE_URL}/attendance/today`, {
        headers: getHeaders(),
      }).then(handleResponse),

    getHistory: (userId = '', month = '') => {
      const qParams = new URLSearchParams();
      if (userId) qParams.append('userId', userId);
      if (month) qParams.append('month', month);
      return fetch(`${API_BASE_URL}/attendance/history?${qParams.toString()}`, {
        headers: getHeaders(),
      }).then(handleResponse);
    },

    getStats: (userId = '', month = '') => {
      const qParams = new URLSearchParams();
      if (userId) qParams.append('userId', userId);
      if (month) qParams.append('month', month);
      return fetch(`${API_BASE_URL}/attendance/stats?${qParams.toString()}`, {
        headers: getHeaders(),
      }).then(handleResponse);
    },

    updateRecord: (body: any) =>
      fetch(`${API_BASE_URL}/attendance/record`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),

    getCompanyReport: (date = '') =>
      fetch(`${API_BASE_URL}/attendance/report?date=${date}`, {
        headers: getHeaders(),
      }).then(handleResponse),
  },

  // Leaves
  leaves: {
    apply: (body: any) =>
      fetch(`${API_BASE_URL}/leaves/apply`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),

    getMyLeaves: (userId = '') =>
      fetch(`${API_BASE_URL}/leaves/my-leaves${userId ? `?userId=${userId}` : ''}`, {
        headers: getHeaders(),
      }).then(handleResponse),

    getRequests: (status = '') =>
      fetch(`${API_BASE_URL}/leaves/requests${status ? `?status=${status}` : ''}`, {
        headers: getHeaders(),
      }).then(handleResponse),

    handleAction: (id: string, body: any) =>
      fetch(`${API_BASE_URL}/leaves/${id}/action`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),

    getAnalytics: () =>
      fetch(`${API_BASE_URL}/leaves/analytics`, {
        headers: getHeaders(),
      }).then(handleResponse),
  },

  // Payroll
  payroll: {
    getMyPayroll: (userId = '') =>
      fetch(`${API_BASE_URL}/payroll/my-payroll${userId ? `?userId=${userId}` : ''}`, {
        headers: getHeaders(),
      }).then(handleResponse),

    getPayslip: (id: string) =>
      fetch(`${API_BASE_URL}/payroll/payslip/${id}`, {
        headers: getHeaders(),
      }).then(handleResponse),

    updateConfig: (body: any) =>
      fetch(`${API_BASE_URL}/payroll/salary-config`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),

    generate: (body: any) =>
      fetch(`${API_BASE_URL}/payroll/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),

    updateStatus: (id: string, status: string) =>
      fetch(`${API_BASE_URL}/payroll/status/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      }).then(handleResponse),

    getSummary: (month = '') =>
      fetch(`${API_BASE_URL}/payroll/summary${month ? `?month=${month}` : ''}`, {
        headers: getHeaders(),
      }).then(handleResponse),
  },

  // Notifications
  notifications: {
    get: () =>
      fetch(`${API_BASE_URL}/notifications`, {
        headers: getHeaders(),
      }).then(handleResponse),

    readAll: () =>
      fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: getHeaders(),
      }).then(handleResponse),

    read: (id: string) =>
      fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: getHeaders(),
      }).then(handleResponse),
  },

  // Dashboard & Announcements
  dashboard: {
    getEmployee: () =>
      fetch(`${API_BASE_URL}/dashboard/employee`, {
        headers: getHeaders(),
      }).then(handleResponse),

    getAdmin: () =>
      fetch(`${API_BASE_URL}/dashboard/admin`, {
        headers: getHeaders(),
      }).then(handleResponse),

    createAnnouncement: (body: any) =>
      fetch(`${API_BASE_URL}/dashboard/announcements`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),

    search: (query: string) =>
      fetch(`${API_BASE_URL}/dashboard/search?q=${encodeURIComponent(query)}`, {
        headers: getHeaders(),
      }).then(handleResponse),
  },
};
