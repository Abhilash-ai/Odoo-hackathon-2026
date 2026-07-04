import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

export interface User {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  isEmailVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
  phone?: string;
  address?: string;
  profilePhoto?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  companyName?: string;
  companyLogo?: string;
  baseSalary?: number;
  workingDaysPerWeek?: number;
  hraPercent?: number;
  standardAllowance?: number;
  bonusPercent?: number;
  ltaPercent?: number;
  professionalTax?: number;
  pfPercent?: number;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signin: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    const savedToken = localStorage.getItem('hrms_token');
    if (savedToken) {
      try {
        // We decode JWT locally or fetch user profile to verify token freshness
        // JWT decoding locally allows extracting the user ID
        const base64Url = savedToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        // Fetch fresh user profile
        const freshUser = await api.employees.get(payload.id);
        
        setToken(savedToken);
        setUser(freshUser);
      } catch (err) {
        console.error('Session restore failed:', err);
        localStorage.removeItem('hrms_token');
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    initAuth();
  }, []);

  const signin = (newToken: string, newUser: User) => {
    localStorage.setItem('hrms_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('hrms_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } as User : null));
  };

  const refreshUser = async () => {
    if (user?.id) {
      try {
        const freshUser = await api.employees.get(user.id);
        setUser(freshUser);
      } catch (err) {
        console.error('Failed to refresh user:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signin,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
