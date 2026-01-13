import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCurrentAuthToken, isAccessTokenExpired } from '../utils/tokenUtils';

export function RequireOwnerAuth({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Check both context user (local) and authToken (API)
  const authToken = getCurrentAuthToken();
  const tokenExpired = authToken ? isAccessTokenExpired(authToken) : false;
  const isAuthenticated = Boolean(user) && Boolean(authToken) && !tokenExpired;

  useEffect(() => {
    if (tokenExpired || (!authToken && user)) {
      void logout();
    }
  }, [authToken, tokenExpired, logout, user]);

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
