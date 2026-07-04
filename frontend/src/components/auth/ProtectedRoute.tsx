import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth.context';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: ('ADMIN' | 'EMPLOYEE')[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-background flex flex-col items-center justify-center gap-4">
        {/* Sleek loading animation */}
        <div className="w-12 h-12 rounded-2xl border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider animate-pulse">
          Loading HRMS Portal...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Redirect to verify email page if not verified
  if (!user.isEmailVerified && location.pathname !== '/verify-email') {
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email)}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center p-6 bg-card border rounded-2xl max-w-md mx-auto my-12">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4 border border-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-sm text-muted-foreground mb-6">
          You do not have administrative permissions to access this screen. If you believe this is an error, please contact HR.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return children;
};
