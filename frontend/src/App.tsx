import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Context Providers
import { AuthProvider } from './context/auth.context';
import { ThemeProvider } from './context/theme.context';
import { ToastProvider } from './context/toast.context';

// Layout & Protected Route Guards
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Public Pages
import { SignIn } from './pages/auth/SignIn';
import { SignUp } from './pages/auth/SignUp';
import { VerifyEmail } from './pages/auth/VerifyEmail';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';

// Protected Pages (Employee)
import { Dashboard } from './pages/Dashboard';
import { Attendance } from './pages/Attendance';
import { Leaves } from './pages/Leaves';
import { Payroll } from './pages/Payroll';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';

// Protected Pages (Admin)
import { EmployeeManagement } from './pages/admin/EmployeeManagement';
import { LeaveRequestsReview } from './pages/admin/LeaveRequestsReview';
import { PayrollManagement } from './pages/admin/PayrollManagement';
import { Reports } from './pages/admin/Reports';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Protected Portal Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* Employee Screens */}
                  <Route index element={<Dashboard />} />
                  <Route path="attendance" element={<Attendance />} />
                  <Route path="leaves" element={<Leaves />} />
                  <Route path="payroll" element={<Payroll />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />

                  {/* Admin-only Screens */}
                  <Route
                    path="admin/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/employees"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <EmployeeManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/leaves"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <LeaveRequestsReview />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/payroll"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <PayrollManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/reports"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <Reports />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Wildcard redirect to Dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
