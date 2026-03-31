import React, { createContext, useContext, useState, useCallback } from 'react';
import type { IUser } from '../types/user';
import { loginRequest, registerRequest, updateMeRequest } from '../api/auth.api';

interface AuthState {
  token: string | null;
  user: IUser | null;
}

interface AuthContextType extends AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Rehydrate session from localStorage on page refresh */
const loadStoredAuth = (): AuthState => {
  try {
    const token = localStorage.getItem('auth_token');
    const raw = localStorage.getItem('auth_user');
    const user: IUser | null = raw ? (JSON.parse(raw) as IUser) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(loadStoredAuth);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await loginRequest(email, password);
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    setAuth({ token, user });
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const { token, user } = await registerRequest(email, password, name);
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    setAuth({ token, user });
  }, []);

  const updateName = useCallback(async (name: string) => {
    const { user } = await updateMeRequest(name);
    localStorage.setItem('auth_user', JSON.stringify(user));
    setAuth(prev => ({ ...prev, user }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setAuth({ token: null, user: null });
  }, []);

  return (
    <AuthContext.Provider value={{
      token: auth.token,
      user: auth.user,
      isAuthenticated: !!auth.token,
      isAdmin: auth.user?.role === 'ADMIN',
      login,
      register,
      updateName,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth — shorthand hook to consume AuthContext.
 * Usage: const { user, isAdmin, login, logout } = useAuth();
 */
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};
