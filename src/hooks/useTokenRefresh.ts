import { useCallback, useState } from 'react';
import { authService } from '../services/authService';
import { getCurrentAuthToken } from '../utils/tokenUtils';

interface UseTokenRefreshResult {
  isRefreshing: boolean;
  refreshToken: () => Promise<boolean>;
  hasValidToken: () => boolean;
}

/**
 * Hook for managing token refresh state and operations
 */
export function useTokenRefresh(): UseTokenRefreshResult {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (isRefreshing) {
      return false; // Already refreshing
    }

    setIsRefreshing(true);

    try {
      const result = await authService.refreshToken();

      if (result.success) {
        console.log('Token refresh successful');
        return true;
      }

      console.error('Token refresh failed:', result.error);
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const hasValidToken = useCallback((): boolean => {
    const token = getCurrentAuthToken();
    return !!token;
  }, []);

  return {
    isRefreshing,
    refreshToken,
    hasValidToken,
  };
}
