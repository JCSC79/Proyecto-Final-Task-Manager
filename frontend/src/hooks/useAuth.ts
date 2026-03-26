import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosInstance';

interface UserProfile {
  id?: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: string;
}

export const useAuth = () => {
  const queryClient = useQueryClient();
  
  // SECURITY FIX: Store token in sessionStorage (not localStorage) to prevent persistent XSS
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('token'));
  
  const [user, setUser] = useState<UserProfile | null>(null);

  /**
   * CRITICAL: Fetch the user's REAL role from the server, not localStorage.
   * This prevents privilege escalation where a user changes their role in localStorage.
   * The role in the JWT payload is the SOURCE OF TRUTH.
   */
  useEffect(() => {
    const verifyAndFetchUser = async () => {
      const storedToken = sessionStorage.getItem('token');
      const email = localStorage.getItem('userEmail');
      
      if (!storedToken || !email) {
        setUser(null);
        return;
      }

      try {
        // Call /auth/me to get the VERIFIED user data from JWT
        const response = await api.get('/auth/me');
        const serverUser = response.data;

        // Set the user with the role from the JWT (verified by server)
        setUser({
          id: serverUser.id,
          email: serverUser.email,
          name: localStorage.getItem('userName'),
          avatar_url: localStorage.getItem('userAvatar'),
          role: serverUser.role  // This comes from JWT, not localStorage
        });

        setToken(storedToken);
      } catch (err: any) {
        // If /auth/me fails (401), user session is invalid
        if (err.response?.status === 401) {
          logout();
        }
      }
    };

    verifyAndFetchUser();
  }, []);

  // Update axios default header when token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = (newToken: string, profile: UserProfile) => {
    // SECURITY: Store token in sessionStorage (cleared on browser close)
    sessionStorage.setItem('token', newToken);
    
    // Store only non-sensitive data in localStorage
    localStorage.setItem('userEmail', profile.email);
    localStorage.setItem('userName', profile.name || '');
    localStorage.setItem('userAvatar', profile.avatar_url || '');
    // DO NOT store role in localStorage - fetch it from /auth/me instead
    
    setToken(newToken);
    // Set initial user data, but it will be verified by /auth/me call
    setUser(profile);
  };

  const logout = useCallback(() => {
    sessionStorage.clear();
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userAvatar');
    setToken(null);
    setUser(null);
    queryClient.clear();
    window.location.href = '/'; 
  }, [queryClient]);

  const verifyUserFromServer = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      const serverUser = response.data;
      setUser(prev => prev ? { ...prev, role: serverUser.role } : null);
    } catch {
      // If verification fails, logout immediately
      logout();
    }
  }, [logout]);

  const updateProfile = useCallback((newName: string) => {
    if (!user) return;
    localStorage.setItem('userName', newName);
    setUser({ ...user, name: newName });
    // After updating profile, verify role again with server
    verifyUserFromServer();
  }, [user, verifyUserFromServer]);

  return {
    token,
    user,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'ADMIN',
    login,
    logout,
    updateProfile,
    verifyUserFromServer  // Expose this to verify role before sensitive operations
  };
};