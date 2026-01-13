/**
 * Token Utility Functions
 * 
 * Centralized utilities for handling JWT token expiration detection,
 * storage cleanup, and authentication state management.
 */

export interface TokenExpirationInfo {
  isExpired: boolean;
  expiredAt?: string;
  error?: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  error?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

/**
 * Token expiration error types for consistent error handling
 */
export const TokenErrorTypes = {
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN'
} as const;

export type TokenErrorType = typeof TokenErrorTypes[keyof typeof TokenErrorTypes];

/**
 * Detects if an API error response indicates an expired token
 */
export function detectTokenExpiration(error: unknown): TokenExpirationInfo {
  // Handle string errors
  if (typeof error === 'string') {
    const lowerError = error.toLowerCase();
    
    // Check for common token expiration messages
    if (lowerError.includes('token expired') || 
        lowerError.includes('jwt expired') || 
        lowerError.includes('invalid_token') ||
        lowerError.includes('unauthorized') ||
        lowerError.includes('expired at')) {
      
      // Extract expiration date from message if present
      const expiredAtMatch = error.match(/expired at '([^']+)'/i);
      
      return {
        isExpired: true,
        expiredAt: expiredAtMatch ? expiredAtMatch[1] : undefined,
        error: error
      };
    }
  }
  
  // Handle error objects
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    
    // Check message property
    if (errorObj.message && typeof errorObj.message === 'string') {
      return detectTokenExpiration(errorObj.message);
    }
    
    // Check for 401 status code
    if (errorObj.status === 401 || errorObj.statusCode === 401) {
      return {
        isExpired: true,
        error: errorObj.message || 'Authentication required'
      };
    }
  }
  
  return { isExpired: false };
}

/**
 * Detects token expiration from HTTP response error messages
 * Looks for 401 status codes and token expiration keywords
 */
export function detectTokenExpirationFromResponse(errorMessage: string, statusCode?: number): boolean {
  // Check for 401 status code first
  if (statusCode === 401) {
    return true;
  }
  
  // Check if error message starts with "401:" indicating a 401 status
  if (errorMessage.startsWith('401:')) {
    return true;
  }
  
  const lowerMessage = errorMessage.toLowerCase();
  
  // Common token expiration indicators
  const expirationKeywords = [
    'token expired',
    'jwt expired', 
    'authentication failed',
    'unauthorized',
    'invalid token',
    'invalid_token',
    'token invalid',
    'expired at'
  ];
  
  return expirationKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Clears authentication tokens from all storage locations
 */
export function clearAuthTokens(): void {
  try {
    // Clear from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiresAt');
    
    // Clear from sessionStorage
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authUser');
    sessionStorage.removeItem('tokenExpiresAt');
    
    console.log('All authentication tokens cleared from storage');
  } catch (error) {
    console.warn('Error clearing auth tokens:', error);
  }
}

/**
 * Gets the current auth token from storage
 */
export function getCurrentAuthToken(): string | null {
  try {
    return localStorage.getItem('authToken') || 
           sessionStorage.getItem('authToken') || 
           null;
  } catch (error) {
    console.warn('Error retrieving auth token:', error);
    return null;
  }
}

const getStoredTokenExpiresAt = (): string | null => {
  try {
    return localStorage.getItem('tokenExpiresAt') || sessionStorage.getItem('tokenExpiresAt') || null;
  } catch (error) {
    console.warn('Error retrieving token expiration:', error);
    return null;
  }
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const payload = parts[1];
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch (error) {
    console.warn('Failed to decode JWT payload:', error);
    return null;
  }
};

export function isAccessTokenExpired(token?: string | null): boolean {
  const rawToken = token ?? getCurrentAuthToken();
  if (!rawToken) return false;

  const expiresAt = getStoredTokenExpiresAt();
  if (expiresAt) {
    const parsed = Date.parse(expiresAt);
    if (!Number.isNaN(parsed)) {
      return parsed <= Date.now() + 30_000;
    }
  }

  const payload = decodeJwtPayload(rawToken);
  const exp = typeof payload?.exp === 'number' ? payload.exp : null;
  if (exp) {
    return exp * 1000 <= Date.now() + 30_000;
  }

  return false;
}

/**
 * Gets the current refresh token from storage
 */
export function getCurrentRefreshToken(): string | null {
  try {
    return localStorage.getItem('refreshToken') || null;
  } catch (error) {
    console.warn('Error retrieving refresh token:', error);
    return null;
  }
}

/**
 * Stores token pair in appropriate storage locations
 */
export function storeTokenPair(tokens: TokenPair, rememberMe: boolean = false): void {
  try {
    if (rememberMe) {
      localStorage.setItem('authToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('tokenExpiresAt', tokens.expiresAt);
    } else {
      sessionStorage.setItem('authToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken); // Always store refresh token in localStorage for persistence
      sessionStorage.setItem('tokenExpiresAt', tokens.expiresAt);
    }
    console.log('Token pair stored successfully');
  } catch (error) {
    console.warn('Error storing token pair:', error);
  }
}

/**
 * Checks if a token exists in storage
 */
export function hasAuthToken(): boolean {
  return getCurrentAuthToken() !== null;
}

/**
 * Creates a standardized token expiration error
 */
export function createTokenExpirationError(
  type: TokenErrorType = TokenErrorTypes.EXPIRED_TOKEN,
  message?: string
): Error {
  const error = new Error(message || 'Token has expired');
  (error as any).type = type;
  return error;
}

/**
 * Checks if an error is a token expiration error
 */
export function isTokenExpirationError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    return errorObj.type === TokenErrorTypes.EXPIRED_TOKEN ||
           errorObj.type === TokenErrorTypes.AUTHENTICATION_REQUIRED;
  }
  return false;
}

/**
 * Handles token expiration by clearing storage and providing user feedback
 */
export function handleTokenExpiration(options: {
  clearStorage?: boolean;
  logMessage?: string;
} = {}): void {
  const { clearStorage = true, logMessage = 'Token expired - user will be redirected to login' } = options;
  
  if (clearStorage) {
    clearAuthTokens();
  }
  
  if (logMessage) {
    console.log(logMessage);
  }
}

/**
 * Parses www-authenticate header for token expiration details
 */
export function parseWwwAuthenticateHeader(headerValue: string): TokenExpirationInfo {
  if (!headerValue) {
    return { isExpired: false };
  }
  
  const lowerHeader = headerValue.toLowerCase();
  
  // Check for Bearer authentication errors
  if (lowerHeader.includes('bearer') && 
      (lowerHeader.includes('invalid_token') || lowerHeader.includes('token_expired'))) {
    
    // Extract error description
    const descriptionMatch = headerValue.match(/error_description="([^"]+)"/i);
    const expiredAtMatch = headerValue.match(/expired at '([^']+)'/i);
    
    return {
      isExpired: true,
      expiredAt: expiredAtMatch ? expiredAtMatch[1] : undefined,
      error: descriptionMatch ? descriptionMatch[1] : 'Token expired'
    };
  }
  
  return { isExpired: false };
}

/**
 * Attempts to refresh the access token using the stored refresh token
 */
export async function refreshAccessToken(): Promise<RefreshTokenResponse> {
  try {
    // Import authService dynamically to avoid circular dependencies
    const { authService } = await import('../services/authService');
    
    const result = await authService.refreshToken();
    
    if (result.success && result.token) {
      return {
        success: true,
        accessToken: result.token,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt
      };
    } else {
      return {
        success: false,
        error: result.error || 'Token refresh failed'
      };
    }
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed'
    };
  }
}
/**
 * Enhanced API error handler that detects token expiration and attempts refresh
 */
export async function handleApiErrorWithRefresh(
  error: unknown,
  response?: Response,
  retryRequest?: () => Promise<any>
): Promise<{ isTokenExpired: boolean; errorMessage: string; retryResult?: any }> {
  let tokenInfo = detectTokenExpiration(error);
  
  // Check www-authenticate header if response is available
  if (!tokenInfo.isExpired && response) {
    const wwwAuth = response.headers.get('www-authenticate');
    if (wwwAuth) {
      tokenInfo = parseWwwAuthenticateHeader(wwwAuth);
    }
  }
  
  if (tokenInfo.isExpired) {
    console.log('Token expired, attempting refresh...');
    
    // Attempt to refresh the token
    const refreshResult = await refreshAccessToken();
    
    if (refreshResult.success && retryRequest) {
      console.log('Token refreshed, retrying original request...');
      
      try {
        const retryResult = await retryRequest();
        return {
          isTokenExpired: false, // Successfully handled
          errorMessage: 'Token refreshed and request retried',
          retryResult
        };
      } catch (retryError) {
        console.error('Retry after token refresh failed:', retryError);
        return {
          isTokenExpired: true,
          errorMessage: 'Request failed even after token refresh'
        };
      }
    } else {
      // Refresh failed, handle as expired token
      handleTokenExpiration();
      
      return {
        isTokenExpired: true,
        errorMessage: refreshResult.error || 'Your session has expired. Please log in again.'
      };
    }
  }
  
  // Handle other errors
  let errorMessage = 'An unexpected error occurred';
  
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object') {
    const errorObj = error as any;
    errorMessage = errorObj.message || errorObj.error || errorMessage;
  }
  
  return {
    isTokenExpired: false,
    errorMessage
  };
}

/**
 * Enhanced API error handler that detects token expiration (backward compatibility)
 */
export function handleApiError(
  error: unknown,
  onTokenExpired?: () => void,
  response?: Response
): { isTokenExpired: boolean; errorMessage: string } {
  let tokenInfo = detectTokenExpiration(error);
  
  // Check www-authenticate header if response is available
  if (!tokenInfo.isExpired && response) {
    const wwwAuth = response.headers.get('www-authenticate');
    if (wwwAuth) {
      tokenInfo = parseWwwAuthenticateHeader(wwwAuth);
    }
  }
  
  if (tokenInfo.isExpired) {
    handleTokenExpiration();
    
    if (onTokenExpired) {
      onTokenExpired();
    }
    
    return {
      isTokenExpired: true,
      errorMessage: tokenInfo.error || 'Your session has expired. Please log in again.'
    };
  }
  
  // Handle other errors
  let errorMessage = 'An unexpected error occurred';
  
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object') {
    const errorObj = error as any;
    errorMessage = errorObj.message || errorObj.error || errorMessage;
  }
  
  return {
    isTokenExpired: false,
    errorMessage
  };
}
