import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * AdminRoute — nested inside ProtectedRoute.
 * Redirects non-admin users to / instead of showing the admin panel.
 */
const AdminRoute: React.FC = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute;
