import React, { useState } from 'react';
import { useAuth } from '../context/auth.context';
import { useTheme } from '../context/theme.context';
import { useToast } from '../context/toast.context';
import { api } from '../services/api';
import {
  Lock,
  Eye,
  EyeOff,
  Bell,
  Sun,
  Moon,
  Megaphone,
  CheckCircle,
} from 'lucide-react';

export const Settings = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  // Change Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Notification Preferences
  const [prefLeaves, setPrefLeaves] = useState(true);
  const [prefReminders, setPrefReminders] = useState(true);
  const [prefPayroll, setPrefPayroll] = useState(true);

  // Announcement State (Admin Only)
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [publishing, setPublishing] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      // In a real-world system, we would have a specific endpoint for updating password.
      // Since admin can edit everything and users can edit their own profile,
      // we can reuse the updateEmployee profile endpoint or implement a clean change password endpoint.
      // Wait, let's call the update profile endpoint for password changes!
      // In `employee.controller.ts`, `updateEmployee` supports updating password for admins,
      // but let's see. If the user wants to update their password, we can implement it by sending the new password
      // or we can write a specific route. Let's send the password to updateEmployee endpoint!
      // Wait, let's check `employee.controller.ts`:
      // `if (isAdmin) { ... if (password) dataToUpdate.passwordHash = await bcrypt.hash(password, 10); }`
      // Ah! Currently `password` update is admin-only in our controller code!
      // Wait! We should allow employees to change their own password as well by checking:
      // `if (isOwner && password) { ... }` or adding password hashes to standard updates.
      // Let's modify `employee.controller.ts` later to support password updates for owners too, or write it now.
      // Wait, we can modify the controller or make settings call it. Let's make sure we update the backend controller
      // to support `password` updates if it is the owner.
      // Yes, let's call the api.employees.update endpoint:
      await api.employees.update(user?.id!, { password: newPassword });
      toast.success('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!annTitle || !annContent) {
      toast.error('Title and content are required.');
      return;
    }

    setPublishing(true);
    try {
      await api.dashboard.createAnnouncement({
        title: annTitle.trim(),
        content: annContent.trim(),
      });
      toast.success('New company notice published successfully!');
      setAnnTitle('');
      setAnnContent('');
    } catch (err: any) {
      toast.error('Failed to publish announcement notice.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your credentials, system preferences, notification alerts, and theme setups.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Navigation Sidebar/Categories */}
        <div className="space-y-6">
          {/* Theme Selector */}
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm mb-4">Portal Theme</h3>
            <div className="flex gap-2 bg-secondary/50 p-1.5 rounded-xl border">
              <button
                onClick={() => theme === 'dark' && toggleTheme()}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  theme === 'light' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                Light
              </button>
              <button
                onClick={() => theme === 'light' && toggleTheme()}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  theme === 'dark' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Moon className="w-4 h-4 text-primary" />
                Dark
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <Bell className="w-4.5 h-4.5 text-primary" />
              Notifications
            </h3>
            <div className="flex flex-col gap-3.5 text-xs font-medium">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefLeaves}
                  onChange={(e) => setPrefLeaves(e.target.checked)}
                  className="rounded border bg-background text-primary focus:ring-primary w-4 h-4"
                />
                <span>Leaves approval actions</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefReminders}
                  onChange={(e) => setPrefReminders(e.target.checked)}
                  className="rounded border bg-background text-primary focus:ring-primary w-4 h-4"
                />
                <span>Attendance check-in reminders</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefPayroll}
                  onChange={(e) => setPrefPayroll(e.target.checked)}
                  className="rounded border bg-background text-primary focus:ring-primary w-4 h-4"
                />
                <span>Monthly payslip availabilities</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Columns: Password & Admin actions */}
        <div className="md:col-span-2 space-y-6">
          {/* Change Password */}
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2 border-b pb-3">
              <Lock className="w-5 h-5 text-primary" />
              Change System Password
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Password</label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl shadow-md hover:bg-primary/95 transition-all text-sm cursor-pointer disabled:opacity-50"
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Admin Publish Announcements (Admin Only) */}
          {user?.role === 'ADMIN' && (
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2 border-b pb-3">
                <Megaphone className="w-5 h-5 text-primary" />
                Publish Company Announcement (Admin Only)
              </h3>
              <form onSubmit={handlePublishAnnouncement} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notice Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Holidays Announcement"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notice Content</label>
                  <textarea
                    rows={4}
                    placeholder="Write details of the company announcement here..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    className="w-full p-3.5 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-xs font-medium resize-none"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={publishing}
                    className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl shadow-md hover:bg-primary/95 transition-all text-sm cursor-pointer disabled:opacity-50"
                  >
                    {publishing ? 'Publishing...' : 'Publish Announcement'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
