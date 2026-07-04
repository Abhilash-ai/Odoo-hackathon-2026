import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/toast.context';
import { api } from '../../services/api';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invalid token. Please request a new password reset link.');
      return;
    }

    if (!password || !confirmPassword) {
      toast.error('All fields are required.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.auth.resetPassword({ token, password });
      setSuccess(true);
      toast.success(res.message || 'Password updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password. Link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-background to-violet-50/50 dark:from-slate-950 dark:via-background dark:to-indigo-950/20 flex items-center justify-center p-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-card border rounded-2xl shadow-xl overflow-hidden relative z-10 p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center text-primary-foreground font-black text-2xl shadow-lg shadow-primary/20 mb-6">
            A
          </div>

          {!token ? (
            <div className="flex flex-col items-center">
              <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
              <h2 className="text-xl font-bold">Invalid Reset Token</h2>
              <p className="text-sm text-muted-foreground mt-2 mb-6">
                No password reset token was found in the URL. Please verify your email link or request a new password reset link.
              </p>
              <Link
                to="/forgot-password"
                className="w-full bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-xl hover:bg-primary/95 transition-all text-sm block text-center"
              >
                Request New Link
              </Link>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center w-full">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
              <h2 className="text-xl font-bold">Password Reset Successful</h2>
              <p className="text-sm text-muted-foreground mt-2 mb-6">
                Your password has been changed successfully. You can now use your new password to sign in.
              </p>
              <Link
                to="/signin"
                className="w-full bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-xl hover:bg-primary/95 transition-all text-sm block text-center"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <div className="w-full">
              <h2 className="text-xl font-bold">Set a new password</h2>
              <p className="text-sm text-muted-foreground mt-2 mb-6">
                Please enter your new password below. Ensure it is at least 6 characters long.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Password */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-2.5 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-2.5 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl shadow-md hover:bg-primary/95 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
