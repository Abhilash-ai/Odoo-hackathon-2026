import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '../../context/auth.context';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
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

export const AppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer (AnimatePresence) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-card border-r z-50 flex flex-col p-6 justify-between md:hidden"
            >
              <div className="flex flex-col flex-1 overflow-y-auto">
                <div className="flex items-center justify-between pb-6 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-md">
                      A
                    </div>
                    <span className="font-bold text-sm">Antigravity HR</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-secondary"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-6 flex flex-col gap-6">
                  <div>
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Employee Portal
                    </p>
                    <nav className="flex flex-col gap-1">
                      {employeeLinks.map((link) => (
                        <NavLink
                          key={link.path}
                          to={link.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                              isActive
                                ? 'bg-primary text-primary-foreground'
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

                  {user?.role === 'ADMIN' && (
                    <div>
                      <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        HR Management
                      </p>
                      <nav className="flex flex-col gap-1">
                        {adminLinks.map((link) => (
                          <NavLink
                            key={link.path}
                            to={link.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                isActive
                                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
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

              <div className="pt-4 border-t flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm border overflow-hidden">
                    {user?.profilePhoto ? (
                      <img src={user.profilePhoto} alt={user.fullName} className="w-full h-full object-cover" />
                    ) : (
                      user?.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{user?.fullName}</h4>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 text-sm font-semibold rounded-xl border border-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMobileMenuOpen={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
