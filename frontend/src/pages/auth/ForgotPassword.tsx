import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/toast.context';
import { api } from '../../services/api';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.auth.forgotPassword(email.trim().toLowerCase());
      setSuccess(true);
      toast.success(res.message || 'Reset link sent! Please check your inbox.');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
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

          {success ? (
            <div className="flex flex-col items-center w-full">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
              <h2 className="text-xl font-bold">Reset Email Sent</h2>
              <p className="text-sm text-muted-foreground mt-2 mb-6">
                We've sent a password reset link to your email address. Please follow the instructions in the message to reset your credentials.
              </p>
              <Link
                to="/signin"
                className="w-full bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-xl hover:bg-primary/95 transition-all text-sm block text-center"
              >
                Return to Sign In
              </Link>
            </div>
          ) : (
            <div className="w-full">
              <h2 className="text-xl font-bold">Forgot your password?</h2>
              <p className="text-sm text-muted-foreground mt-2 mb-6">
                No worries! Just enter your registered email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl shadow-md hover:bg-primary/95 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="text-center mt-6">
                <Link
                  to="/signin"
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-2 font-semibold transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
