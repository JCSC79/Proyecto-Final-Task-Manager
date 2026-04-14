import React, { useState, useCallback } from 'react';
import type { IUser } from '../types/user';
import { loginRequest, registerRequest, updateMeRequest } from '../api/auth.api';
import api from '../api/axiosInstance';
import { AuthContext } from './AuthContext';

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

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await loginRequest(email, password);
    localStorage.setItem('auth_user', JSON.stringify(user));
    setAuth({ user });
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const { user } = await registerRequest(email, password, name);
    localStorage.setItem('auth_user', JSON.stringify(user));
    setAuth({ user });
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
      localStorage.removeItem('auth_token');
      setAuth({ user: null });
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user: auth.user,
      isAuthenticated: !!auth.user,
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