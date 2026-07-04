import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth.context';
import {
  LayoutDashboard,
  Clock,
  Calendar,
  DollarSign,
  User,
  Settings,
  Users,
  ClipboardCheck,
  Briefcase,
  FileBarChart,
  LogOut,
  Shield,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const employeeLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Attendance', path: '/attendance', icon: Clock },
    { name: 'Leaves', path: '/leaves', icon: Calendar },
    { name: 'Payroll', path: '/payroll', icon: DollarSign },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const adminLinks = [
    { name: 'HR Dashboard', path: '/admin/dashboard', icon: Shield },
    { name: 'Employees', path: '/admin/employees', icon: Users },
    { name: 'Leave Actions', path: '/admin/leaves', icon: ClipboardCheck },
    { name: 'Manage Payroll', path: '/admin/payroll', icon: Briefcase },
    { name: 'Reports', path: '/admin/reports', icon: FileBarChart },
  ];

  return (
    <div className="w-64 h-screen border-r bg-card flex flex-col justify-between shrink-0 sticky top-0 hidden md:flex">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center text-primary-foreground font-black text-lg shadow-md shadow-primary/20">
            A
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Antigravity</h1>
            <p className="text-xs text-muted-foreground font-medium">HR Portal</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-4 py-6 flex flex-col gap-6">
          {/* Employee Menu */}
          <div>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Employee Portal
            </p>
            <nav className="flex flex-col gap-1">
              {employeeLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`
                  }
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Admin Menu */}
          {user?.role === 'ADMIN' && (
            <div>
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                HR Management
              </p>
              <nav className="flex flex-col gap-1">
                {adminLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/15 text-primary border-l-2 border-primary'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`
                    }
                  >
                    <link.icon className="w-5 h-5" />
                    {link.name}
                  </NavLink>
                ))}
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t bg-secondary/30 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm border overflow-hidden shrink-0">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              user?.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
            )}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-semibold text-sm truncate">{user?.fullName}</h4>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 transition-colors border border-rose-500/10"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};
