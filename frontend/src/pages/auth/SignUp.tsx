import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/toast.context';
import { api } from '../../services/api';
import {
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Upload,
  ImageIcon,
} from 'lucide-react';

export const SignUp = () => {
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string>(''); // base64
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // ─── Logo Handling ──────────────────────────────────────────────────────────

  const processLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setCompanyLogo(base64);
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processLogoFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processLogoFile(file);
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim() || !fullName.trim() || !email.trim() || !password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address.');
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
      const data = await api.auth.signup({
        companyName: companyName.trim(),
        companyLogo: companyLogo || undefined,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
      });

      toast.success(data.message || 'Company registered! Please verify your email.');
      navigate(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Shared styles ───────────────────────────────────────────────────────────
  const inputCls =
    'w-full pl-11 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/50 focus:outline-none transition-all text-sm text-foreground placeholder:text-muted-foreground/60';
  const inputWithToggleCls =
    'w-full pl-11 pr-11 py-2.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/50 focus:outline-none transition-all text-sm text-foreground placeholder:text-muted-foreground/60';
  const labelCls = 'text-xs font-semibold uppercase tracking-wider text-muted-foreground/80';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-background to-indigo-950/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* ── Ambient glow blobs ── */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* ── Card ── */}
      <div className="w-full max-w-2xl relative z-10">
        <div className="bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Gradient top-border accent */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

          <div className="p-8 sm:p-10">
            {/* ── Header ── */}
            <div className="flex flex-col items-center text-center mb-8">
              {/* Icon / logo preview */}
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-4 overflow-hidden ring-2 ring-white/10">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Company logo preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-9 h-9 text-white/90" />
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Register Your Company
              </h1>
              <p className="text-sm text-muted-foreground mt-2 font-medium">
                Set up your HR management system
              </p>
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleSignup} className="flex flex-col gap-5">

              {/* Company Name — full width */}
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>
                  Company Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-2.5 w-5 h-5 text-indigo-400/80" />
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Company Logo — full width */}
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>
                  Company Logo{' '}
                  <span className="text-muted-foreground/50 normal-case font-normal">(optional)</span>
                </label>

                {/* Drop zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative flex items-center gap-4 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all select-none ${
                    dragOver
                      ? 'border-indigo-500/70 bg-indigo-500/10'
                      : 'border-white/10 bg-white/5 hover:border-indigo-500/40 hover:bg-white/[0.08]'
                  }`}
                >
                  {/* Preview thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-7 h-7 text-muted-foreground/40" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground/80">
                      {logoPreview
                        ? 'Logo uploaded — click to change'
                        : 'Click or drag & drop to upload logo'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      PNG, JPG, SVG, WEBP · Max 5 MB
                    </p>
                  </div>

                  <div className="shrink-0 p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                    <Upload className="w-5 h-5 text-indigo-400" />
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>

              {/* Full Name + Email — 2-col grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-2.5 w-5 h-5 text-indigo-400/80" />
                    <input
                      type="text"
                      placeholder="Jane Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-2.5 w-5 h-5 text-indigo-400/80" />
                    <input
                      type="email"
                      placeholder="jane@acmecorp.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Phone — full width */}
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>
                  Phone{' '}
                  <span className="text-muted-foreground/50 normal-case font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-2.5 w-5 h-5 text-indigo-400/80" />
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Password + Confirm Password — 2-col grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-2.5 w-5 h-5 text-indigo-400/80" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputWithToggleCls}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-2.5 text-muted-foreground/60 hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-2.5 w-5 h-5 text-indigo-400/80" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputWithToggleCls} ${
                        confirmPassword && confirmPassword !== password
                          ? 'border-rose-500/50 focus:ring-rose-500/40'
                          : confirmPassword && confirmPassword === password
                          ? 'border-emerald-500/50 focus:ring-emerald-500/40'
                          : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-2.5 text-muted-foreground/60 hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-rose-400 mt-0.5">Passwords do not match</p>
                  )}
                  {confirmPassword && confirmPassword === password && (
                    <p className="text-xs text-emerald-400 mt-0.5">Passwords match ✓</p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Registering Company…</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    <span>Register Company</span>
                  </>
                )}
              </button>
            </form>

            {/* ── Bottom link ── */}
            <div className="text-center mt-6">
              <p className="text-xs text-muted-foreground">
                Already registered?{' '}
                <Link
                  to="/signin"
                  className="text-indigo-400 font-semibold hover:text-indigo-300 hover:underline transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>

          {/* Gradient bottom-border accent */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
        </div>
      </div>
    </div>
  );
};
