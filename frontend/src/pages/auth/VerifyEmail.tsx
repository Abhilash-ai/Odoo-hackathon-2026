import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/toast.context';
import { api } from '../../services/api';
import { Mail, CheckCircle2, AlertTriangle, Send } from 'lucide-react';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const queryEmail = searchParams.get('email') || '';

  const [verifying, setVerifying] = useState(!!token);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState(queryEmail);
  const [submittingResend, setSubmittingResend] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      const verifyToken = async () => {
        try {
          const res = await api.auth.verifyEmail(token);
          setSuccess(true);
          toast.success(res.message || 'Email verified successfully!');
        } catch (err: any) {
          setSuccess(false);
          toast.error(err.message || 'Verification failed. Token may be invalid or expired.');
        } finally {
          setVerifying(false);
        }
      };
      verifyToken();
    }
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setSubmittingResend(true);
    try {
      const res = await api.auth.resendVerification(email);
      toast.success(res.message || 'Verification email sent! Please check your inbox.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend. Please try again.');
    } finally {
      setSubmittingResend(false);
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

          {verifying ? (
            <div className="flex flex-col items-center py-6">
              <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
              <h2 className="text-xl font-bold">Verifying your email</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Please wait while we validate your credentials...
              </p>
            </div>
          ) : token ? (
            success ? (
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
                <h2 className="text-xl font-bold">Email Verified!</h2>
                <p className="text-sm text-muted-foreground mt-2 mb-6">
                  Thank you. Your email address has been verified. You can now access all portal functions.
                </p>
                <Link
                  to="/signin"
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-xl hover:bg-primary/95 transition-all text-sm block text-center"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <AlertTriangle className="w-16 h-16 text-rose-500 mb-4" />
                <h2 className="text-xl font-bold">Verification Failed</h2>
                <p className="text-sm text-muted-foreground mt-2 mb-6">
                  The link is invalid or has expired. Please request a new verification email below.
                </p>
                <Link
                  to="/verify-email"
                  className="text-primary font-semibold hover:underline text-sm"
                  onClick={() => navigate('/verify-email', { replace: true })}
                >
                  Resend Verification Email
                </Link>
              </div>
            )
          ) : (
            <div className="w-full">
              <h2 className="text-xl font-bold">Verify your email</h2>
              <p className="text-sm text-muted-foreground mt-2 mb-6">
                An activation link was sent to your registered address. Enter your email below to resend the code if you didn't receive it.
              </p>

              <form onSubmit={handleResend} className="flex flex-col gap-4">
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
                  disabled={submittingResend}
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl shadow-md hover:bg-primary/95 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingResend ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Resend Link
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-6">
                <Link to="/signin" className="text-xs text-primary font-semibold hover:underline">
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
