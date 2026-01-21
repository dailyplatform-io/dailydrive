import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCurrentAuthToken, getCurrentRefreshToken, isAccessTokenExpired } from '../utils/tokenUtils';
import { useTokenRefresh } from '../hooks/useTokenRefresh';

export function RequireOwnerAuth({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { refreshToken } = useTokenRefresh();
  const [isChecking, setIsChecking] = useState(true);
  
  // Check both context user (local) and authToken (API)
  const authToken = getCurrentAuthToken();
  const tokenExpired = authToken ? isAccessTokenExpired(authToken) : false;
  const isAuthenticated = Boolean(user) && Boolean(authToken) && !tokenExpired;

  useEffect(() => {
    let isActive = true;
    const verifySession = async () => {
      if (!authToken) {
        setIsChecking(false);
        return;
      }
      if (!tokenExpired) {
        setIsChecking(false);
        return;
      }
      if (!getCurrentRefreshToken()) {
        await logout();
        if (isActive) setIsChecking(false);
        return;
      }
      const refreshed = await refreshToken();
      const nextToken = getCurrentAuthToken();
      if (!refreshed || !nextToken || isAccessTokenExpired(nextToken)) {
        await logout();
      }
      if (isActive) setIsChecking(false);
    };

    void verifySession();
    return () => {
      isActive = false;
    };
  }, [authToken, tokenExpired, refreshToken, logout]);

  if (isChecking) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
