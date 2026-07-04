import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth.context';
import { useToast } from '../context/toast.context';
import { api } from '../services/api';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Edit3,
  Save,
  X,
  Key,
  Building,
  IndianRupee,
  FileText,
  Lock,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type TabId = 'resume' | 'private' | 'salary';

interface SalaryBreakdown {
  monthly: number;
  basic: number;
  hra: number;
  stdAllowance: number;
  bonus: number;
  lta: number;
  mixed: number;
  gross: number;
  employeePF: number;
  employerPF: number;
  professionalTax: number;
  net: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const calcSalary = (profile: any): SalaryBreakdown => {
  const monthly = Number(profile?.baseSalary) || 0;
  const basic = monthly * 0.5;
  const hraPercent = Number(profile?.hraPercent) || 40;
  const hra = basic * (hraPercent / 100);
  const stdAllowance = Number(profile?.standardAllowance) || 4167;
  const bonusPercent = Number(profile?.bonusPercent) || 8.33;
  const ltaPercent = Number(profile?.ltaPercent) || 8.33;
  const bonus = monthly * (bonusPercent / 100);
  const lta = monthly * (ltaPercent / 100);
  const mixed = monthly - (basic + hra + stdAllowance + bonus + lta);
  const gross = basic + hra + stdAllowance + bonus + lta + mixed;
  const employeePF = basic * 0.12;
  const employerPF = basic * 0.12;
  const professionalTax = 200;
  const net = gross - employeePF - professionalTax;
  return { monthly, basic, hra, stdAllowance, bonus, lta, mixed, gross, employeePF, employerPF, professionalTax, net };
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const initials = (name: string) =>
  (name || 'NA')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

// ─── Sub-components ───────────────────────────────────────────────────────────

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col gap-0.5 py-2.5 border-b last:border-0">
    <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground">{value || <span className="text-muted-foreground italic">Not set</span>}</span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const Profile = () => {
  const { id: paramId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const isAdmin = user?.role === 'ADMIN';
  const isOwnProfile = !paramId || paramId === user?.id;
  const canEdit = isOwnProfile || isAdmin;
  const targetId = paramId || user?.id || '';

  // ── State ──
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('resume');

  // Resume edit
  const [editingResume, setEditingResume] = useState(false);
  const [resumeForm, setResumeForm] = useState({
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
  });
  const [savingResume, setSavingResume] = useState(false);

  // Password change
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPw, setSavingPw] = useState(false);

  // Salary
  const [wageInput, setWageInput] = useState('');
  const [savingWage, setSavingWage] = useState(false);

  // ── Load profile ──
  const loadProfile = async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const data = await api.employees.get(targetId);
      setProfile(data);
      setResumeForm({
        phone: data.phone || '',
        address: data.address || '',
        emergencyContactName: data.emergencyContactName || '',
        emergencyContactRelation: data.emergencyContactRelation || '',
        emergencyContactPhone: data.emergencyContactPhone || '',
      });
      setWageInput(String(data.baseSalary || ''));
    } catch {
      toast.error('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Guard: non-admin cannot view other profiles
    if (paramId && !isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

  // ── Save Resume ──
  const handleSaveResume = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingResume(true);
    try {
      await api.employees.update(targetId, { ...resumeForm });
      toast.success('Profile updated successfully!');
      if (isOwnProfile) await refreshUser();
      await loadProfile();
      setEditingResume(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSavingResume(false);
    }
  };

  // ── Change Password ──
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setSavingPw(true);
    try {
      await api.employees.update(targetId, {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPwForm(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setSavingPw(false);
    }
  };

  // ── Update Wage ──
  const handleUpdateWage = async () => {
    const val = parseFloat(wageInput);
    if (isNaN(val) || val < 0) {
      toast.error('Please enter a valid salary amount.');
      return;
    }
    setSavingWage(true);
    try {
      await api.employees.update(targetId, { baseSalary: val });
      toast.success('Monthly wage updated successfully!');
      await loadProfile();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update wage.');
    } finally {
      setSavingWage(false);
    }
  };

  // ── Loading ──
  if (loading || !profile) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-card border rounded-2xl" />
        <div className="h-10 w-72 bg-card border rounded-xl" />
        <div className="h-80 bg-card border rounded-2xl" />
      </div>
    );
  }

  const salary = calcSalary(profile);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'resume', label: 'Resume', icon: <User className="w-4 h-4" /> },
    { id: 'private', label: 'Private Info', icon: <Lock className="w-4 h-4" /> },
    ...(isAdmin ? [{ id: 'salary' as TabId, label: 'Salary Info', icon: <IndianRupee className="w-4 h-4" /> }] : []),
  ];

  // ── Gradient colors for avatar ──
  const avatarGradients = [
    'from-violet-500 to-indigo-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-teal-500 to-cyan-600',
    'from-emerald-500 to-green-600',
  ];
  const gradientIdx = (profile.fullName?.charCodeAt(0) || 0) % avatarGradients.length;
  const avatarGradient = avatarGradients[gradientIdx];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Header Card ── */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        {/* Cover stripe */}
        <div className="h-28 bg-gradient-to-r from-primary/20 via-violet-500/15 to-indigo-500/10 relative">
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, var(--primary) 0%, transparent 60%), radial-gradient(circle at 80% 50%, #7c3aed 0%, transparent 60%)' }} />
        </div>

        <div className="px-6 pb-6 -mt-10 flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-2xl border-4 border-card shadow-xl overflow-hidden shrink-0`}>
            {profile.profilePhoto ? (
              <img src={profile.profilePhoto} alt={profile.fullName} className="w-full h-full object-cover" />
            ) : (
              initials(profile.fullName)
            )}
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0 pt-2 sm:pt-6">
            <h1 className="text-2xl font-extrabold tracking-tight leading-none truncate">{profile.fullName}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="font-mono text-xs bg-secondary border px-2.5 py-1 rounded-lg text-muted-foreground font-bold">
                {profile.employeeId}
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Shield className="w-3 h-3" />
                {profile.role}
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                profile.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25'
                  : 'bg-rose-500/10 text-rose-600 border-rose-500/25'
              }`}>
                ● {profile.status}
              </span>
            </div>
          </div>

          {/* Edit button */}
          {canEdit && activeTab === 'resume' && !editingResume && (
            <button
              onClick={() => setEditingResume(true)}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl shadow hover:bg-primary/90 transition-all cursor-pointer shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              Edit Resume
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-secondary/50 border rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setEditingResume(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-card text-foreground shadow border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB: RESUME
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'resume' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-in fade-in duration-200">

          {/* Personal Info / Edit Form */}
          <div className="lg:col-span-3 space-y-5">
            {!editingResume ? (
              /* ── View Mode ── */
              <>
                <div className="bg-card border rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <User className="w-4 h-4 text-primary" />
                    Personal Information
                  </h3>
                  <InfoRow label="Full Name" value={profile.fullName} />
                  <InfoRow label="Email Address" value={profile.email} />
                  <InfoRow label="Phone Number" value={profile.phone} />
                  <InfoRow label="Residential Address" value={profile.address} />
                </div>

                <div className="bg-card border rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <Phone className="w-4 h-4 text-rose-500" />
                    Emergency Contact
                  </h3>
                  <InfoRow label="Contact Name" value={profile.emergencyContactName} />
                  <InfoRow label="Relation" value={profile.emergencyContactRelation} />
                  <InfoRow label="Contact Phone" value={profile.emergencyContactPhone} />
                </div>
              </>
            ) : (
              /* ── Edit Mode ── */
              <form onSubmit={handleSaveResume} className="space-y-5">
                <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-primary" />
                      Edit Personal Info
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingResume(false)}
                      className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Contact fields */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={resumeForm.phone}
                      onChange={(e) => setResumeForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2.5 text-sm rounded-xl border bg-background/60 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Residential Address
                    </label>
                    <input
                      type="text"
                      value={resumeForm.address}
                      onChange={(e) => setResumeForm((p) => ({ ...p, address: e.target.value }))}
                      placeholder="123, MG Road, Bangalore, KA 560001"
                      className="w-full px-3 py-2.5 text-sm rounded-xl border bg-background/60 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-3">
                    <Phone className="w-4 h-4 text-rose-500" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={resumeForm.emergencyContactName}
                        onChange={(e) => setResumeForm((p) => ({ ...p, emergencyContactName: e.target.value }))}
                        placeholder="Jane Doe"
                        className="w-full px-3 py-2.5 text-sm rounded-xl border bg-background/60 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Relation</label>
                      <input
                        type="text"
                        value={resumeForm.emergencyContactRelation}
                        onChange={(e) => setResumeForm((p) => ({ ...p, emergencyContactRelation: e.target.value }))}
                        placeholder="Spouse, Father…"
                        className="w-full px-3 py-2.5 text-sm rounded-xl border bg-background/60 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Phone</label>
                      <input
                        type="tel"
                        value={resumeForm.emergencyContactPhone}
                        onChange={(e) => setResumeForm((p) => ({ ...p, emergencyContactPhone: e.target.value }))}
                        placeholder="+91 91234 56789"
                        className="w-full px-3 py-2.5 text-sm rounded-xl border bg-background/60 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingResume(false)}
                    className="px-5 py-2.5 rounded-xl border text-sm font-semibold hover:bg-secondary transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingResume}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold shadow hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingResume ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* Password Change — only own profile */}
            {isOwnProfile && (
              <div className="bg-card border rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-500" />
                    Change Password
                  </h3>
                  {!showPwForm && (
                    <button
                      onClick={() => setShowPwForm(true)}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Change →
                    </button>
                  )}
                </div>

                {showPwForm && (
                  <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Current Password</label>
                      <input
                        type="password"
                        value={pwForm.currentPassword}
                        onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                        required
                        className="w-full px-3 py-2.5 text-sm rounded-xl border bg-background/60 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">New Password</label>
                      <input
                        type="password"
                        value={pwForm.newPassword}
                        onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                        required
                        className="w-full px-3 py-2.5 text-sm rounded-xl border bg-background/60 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Confirm New Password</label>
                      <input
                        type="password"
                        value={pwForm.confirmPassword}
                        onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                        required
                        className="w-full px-3 py-2.5 text-sm rounded-xl border bg-background/60 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => { setShowPwForm(false); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                        className="px-4 py-2 text-sm font-semibold rounded-xl border hover:bg-secondary transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingPw}
                        className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 text-sm font-semibold rounded-xl shadow hover:bg-amber-600 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {savingPw ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Key className="w-4 h-4" />
                        )}
                        Update Password
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Right side — quick stats */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-card border rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> Contact at a Glance
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40">
                  <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Email</p>
                    <p className="text-xs font-semibold truncate">{profile.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40">
                  <Phone className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Phone</p>
                    <p className="text-xs font-semibold">{profile.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40">
                  <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Address</p>
                    <p className="text-xs font-semibold leading-relaxed">{profile.address || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-500" /> Emergency
              </h3>
              <div className="space-y-1.5">
                <InfoRow label="Name" value={profile.emergencyContactName} />
                <InfoRow label="Relation" value={profile.emergencyContactRelation} />
                <InfoRow label="Phone" value={profile.emergencyContactPhone} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: PRIVATE INFO
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'private' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-in fade-in duration-200">
          {/* Employment Details */}
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-card border rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 border-b pb-3">
                <Building className="w-4 h-4 text-primary" />
                Employment Details
              </h3>
              <InfoRow label="Employee ID" value={profile.employeeId} />
              <InfoRow label="Full Name" value={profile.fullName} />
              <InfoRow label="Email" value={profile.email} />
              <InfoRow label="Role" value={profile.role} />
              <InfoRow
                label="Join Date"
                value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined}
              />
              <InfoRow label="Company" value={profile.companyName || 'HRMS Corp'} />
              <InfoRow label="Status" value={profile.status} />
            </div>
          </div>

          {/* Documents */}
          <div className="lg:col-span-2">
            <div className="bg-card border rounded-2xl p-5 shadow-sm h-full">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 border-b pb-3">
                <FileText className="w-4 h-4 text-indigo-500" />
                Documents
              </h3>
              {!profile.documents?.length ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                  <FileText className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No documents uploaded</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {profile.documents.map((doc: any) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border bg-secondary/30 hover:bg-secondary/60 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{doc.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: SALARY INFO  (Admin only)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'salary' && isAdmin && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Wage input */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 border-b pb-3">
              <IndianRupee className="w-4 h-4 text-primary" />
              Monthly Wage Configuration
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Monthly Wage (Rs.)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">Rs.</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={wageInput}
                    onChange={(e) => setWageInput(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-background/60 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Gross will auto-calculate from this value. HRA, Bonus, LTA percentages use employee config or defaults.
                </p>
              </div>
              <button
                onClick={handleUpdateWage}
                disabled={savingWage}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold shadow hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                {savingWage ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Update Wage
              </button>
            </div>
          </div>

          {/* Salary Breakdown Table */}
          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold">Salary Breakdown</h3>
              <span className="ml-auto text-xs text-muted-foreground font-medium">Monthly</span>
            </div>

            <div className="divide-y">
              {/* Earnings section */}
              <div className="px-5 py-2 bg-secondary/30">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Earnings</p>
              </div>

              {[
                { label: 'Monthly Wage', value: salary.monthly, sub: 'Base salary' },
                { label: 'Basic', value: salary.basic, sub: '50% of Monthly Wage' },
                { label: 'HRA', value: salary.hra, sub: `${profile.hraPercent || 40}% of Basic` },
                { label: 'Standard Allowance', value: salary.stdAllowance, sub: 'Fixed' },
                { label: 'Performance Bonus', value: salary.bonus, sub: `${profile.bonusPercent || 8.33}% of Monthly Wage` },
                { label: 'Leave Travel Allowance', value: salary.lta, sub: `${profile.ltaPercent || 8.33}% of Monthly Wage` },
                { label: 'Mixed / Fixed Allowance', value: salary.mixed, sub: 'Balancing component' },
              ].map((row) => (
                <div key={row.label} className="px-5 py-3 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{row.label}</p>
                    <p className="text-[11px] text-muted-foreground">{row.sub}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">Rs. {fmt(row.value)}</p>
                </div>
              ))}

              {/* Gross row */}
              <div className="px-5 py-3.5 flex items-center justify-between bg-emerald-500/10 border-y border-emerald-500/20">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Gross Salary</p>
                <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">Rs. {fmt(salary.gross)}</p>
              </div>

              {/* Deductions */}
              <div className="px-5 py-2 bg-secondary/30">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Deductions</p>
              </div>

              {[
                { label: 'Employee PF', value: salary.employeePF, sub: '12% of Basic' },
                { label: 'Employer PF', value: salary.employerPF, sub: '12% of Basic (employer contribution)' },
                { label: 'Professional Tax', value: salary.professionalTax, sub: 'Fixed' },
              ].map((row) => (
                <div key={row.label} className="px-5 py-3 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{row.label}</p>
                    <p className="text-[11px] text-muted-foreground">{row.sub}</p>
                  </div>
                  <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 tabular-nums">- Rs. {fmt(row.value)}</p>
                </div>
              ))}

              {/* Net Salary */}
              <div className="px-5 py-4 flex items-center justify-between bg-primary/10 border-t-2 border-primary/30">
                <div>
                  <p className="text-base font-bold text-primary">Net Salary</p>
                  <p className="text-[11px] text-muted-foreground">After Employee PF and Professional Tax</p>
                </div>
                <p className="text-xl font-extrabold text-primary tabular-nums">Rs. {fmt(salary.net)}</p>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Gross Salary', value: salary.gross, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { label: 'Total Deductions', value: salary.employeePF + salary.professionalTax, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
              { label: 'Net Take-Home', value: salary.net, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
            ].map((card) => (
              <div key={card.label} className={`${card.bg} border rounded-2xl p-5`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{card.label}</p>
                <p className={`text-2xl font-extrabold tabular-nums ${card.color}`}>Rs. {fmt(card.value)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Per month</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
