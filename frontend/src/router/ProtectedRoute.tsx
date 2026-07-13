import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.ts';
import { SocketProvider } from '../hooks/useSocket';

/**
 * ProtectedRoute — guards any route that requires authentication.
 * Also mounts the SocketProvider so all authenticated pages share one socket.
 */
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <SocketProvider>
      <Outlet />
    </SocketProvider>
  );
};

export default ProtectedRoute;
