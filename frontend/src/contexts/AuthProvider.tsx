import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { IUser } from '../types/user';
import { loginRequest, registerRequest, updateMeRequest } from '../api/auth.api';
import api from '../api/axiosInstance';
import { AuthContext } from './AuthContext';
import i18n from '../i18n';

/** Rehydrate session from localStorage */
const loadStoredAuth = (): { user: IUser | null } => {
  try {
    const raw = localStorage.getItem('auth_user');
    const user: IUser | null = raw ? (JSON.parse(raw) as IUser) : null;
    return { user };
  } catch {
    return { user: null };
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<{ user: IUser | null }>(loadStoredAuth);

  // Sync i18n language with stored user preference on mount
  useEffect(() => {
    if (auth.user?.lang) {
      void i18n.changeLanguage(auth.user.lang);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await loginRequest(email, password);
    localStorage.setItem('auth_user', JSON.stringify(user));
    setAuth({ user });
    void i18n.changeLanguage(user.lang ?? 'en');
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const { user } = await registerRequest(email, password, name);
    localStorage.setItem('auth_user', JSON.stringify(user));
    setAuth({ user });
    void i18n.changeLanguage(user.lang ?? 'en');
  }, []);

  const updateName = useCallback(async (name: string) => {
    const { user } = await updateMeRequest(name);
    localStorage.setItem('auth_user', JSON.stringify(user));
    setAuth({ user });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      localStorage.removeItem('auth_user');
      setAuth({ user: null });
    }
  }, []);

  const value = useMemo(() => ({
    user: auth.user,
    isAuthenticated: !!auth.user,
    isAdmin: auth.user?.role === 'ADMIN',
    login,
    register,
    updateName,
    logout,
  }), [auth.user, login, register, updateName, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};