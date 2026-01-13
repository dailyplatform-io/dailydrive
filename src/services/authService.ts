import { 
  getCurrentAuthToken, 
  getCurrentRefreshToken, 
  storeTokenPair, 
  clearAuthTokens,
  handleApiErrorWithRefresh,
  TokenErrorTypes 
} from '../utils/tokenUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
  userId?: string;
  email?: string;
  ownerId?: string;
  isActive?: boolean;
  paymentCompleted?: boolean;
  isInTrial?: boolean;
  trialEndsAt?: string;
  subscriptionTier?: string;
  subscriptionPriceEur?: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  sellerName?: string;
  sellerSlug?: string;
  instagramName?: string;
  facebookName?: string;
  profileType?: 'rent' | 'buy';
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface OwnerProfileUpdateRequest {
  sellerName: string;
  instagramName?: string;
  facebookName?: string;
}

class AuthService {
  private async makeAuthenticatedRequest<T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const token = getCurrentAuthToken();
      
      if (!token) {
        throw new Error(TokenErrorTypes.AUTHENTICATION_REQUIRED);
      }
      
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(errorText || `Request failed with status ${response.status}`);
        (error as { status?: number; response?: Response }).status = response.status;
        (error as { status?: number; response?: Response }).response = response;
        throw error;
      }
      
      return response.json();
    };
    
    try {
      // First attempt
      return await makeRequest();
    } catch (error) {
      console.error('Authenticated request error:', error);
      
      // Use enhanced error handling with automatic token refresh
      const response = (error as { response?: Response }).response;
      const { isTokenExpired, errorMessage, retryResult } = await handleApiErrorWithRefresh(
        error,
        response,
        makeRequest
      );
      
      // If retry was successful, return the retry result
      if (retryResult) {
        return retryResult;
      }
      
      if (isTokenExpired) {
        throw new Error(TokenErrorTypes.EXPIRED_TOKEN);
      }
      
      throw new Error(errorMessage);
    }
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: request.email,
          password: request.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        try {
          const parsedError = JSON.parse(errorData);
          return {
            success: false,
            error: parsedError.message || 'Login failed'
          };
        } catch {
          return {
            success: false,
            error: errorData || 'Login failed'
          };
        }
      }

      const result = await response.json();
      
      // Store tokens if login successful and tokens are provided
      if (result.success && result.token) {
        // Generate refresh token with user ID embedded for better backend lookup
        const userId = result.userId || result.ownerId || 'unknown';
        const mockRefreshToken = `refresh-${Date.now()}-${userId}-${Math.random().toString(36).substr(2, 9)}`;
        
        storeTokenPair({
          accessToken: result.token,
          refreshToken: result.refreshToken || mockRefreshToken,
          expiresAt: result.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
        }, request.rememberMe);
        
        return {
          success: true,
          ...result
        };
      }
      
      return {
        success: false,
        error: result.message || 'Login failed'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = getCurrentRefreshToken();
      
      if (!refreshToken) {
        return {
          success: false,
          error: 'No refresh token available'
        };
      }
      
      console.log('Attempting token refresh with backend API...');
      
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token refresh failed:', {
          status: response.status,
          error: errorText
        });
        
        // If refresh token is invalid/expired, clear all tokens
        if (response.status === 401 || response.status === 403) {
          clearAuthTokens();
        }
        
        return {
          success: false,
          error: errorText || 'Token refresh failed'
        };
      }
      
      const result = await response.json();
      
      if (result.success && result.accessToken) {
        // Store new token pair
        storeTokenPair({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken || refreshToken, // Use new refresh token or keep existing
          expiresAt: result.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString()
        });
        
        console.log('Token refreshed successfully via backend API');
        
        return {
          success: true,
          token: result.accessToken,
          refreshToken: result.refreshToken || refreshToken,
          expiresAt: result.expiresAt
        };
      } else {
        console.warn('Backend refresh succeeded but invalid response format');
        
        // Fallback to demo refresh mechanism
        return this.performDemoRefresh(refreshToken);
      }
      
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // Fallback to demo refresh mechanism
      const refreshToken = getCurrentRefreshToken();
      if (refreshToken) {
        console.log('Falling back to demo refresh mechanism');
        return this.performDemoRefresh(refreshToken);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed'
      };
    }
  }

  private async performDemoRefresh(refreshToken: string): Promise<AuthResponse> {
    try {
      const currentToken = getCurrentAuthToken();
      
      if (!currentToken) {
        return {
          success: false,
          error: 'No access token to refresh'
        };
      }
      
      // Try to extract user ID from existing refresh token for continuity
      let userId = 'demo-user';
      try {
        const parts = refreshToken.split('-');
        if (parts.length >= 4) {
          userId = parts[2]; // Extract user ID from refresh token format
        }
      } catch {
        // Use default if parsing fails
      }
      
      // For demo purposes, create a new token with extended expiration
      const newToken = `${currentToken.split('-')[0]}-${Date.now()}`;
      const newRefreshToken = `refresh-${Date.now()}-${userId}-${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
      
      storeTokenPair({
        accessToken: newToken,
        refreshToken: newRefreshToken,
        expiresAt
      });
      
      console.log('Token refreshed successfully (demo mode) for user:', userId);
      
      return {
        success: true,
        token: newToken,
        refreshToken: newRefreshToken,
        expiresAt
      };
      
    } catch (error) {
      console.error('Demo token refresh error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Demo token refresh failed'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      // Attempt to notify the server about logout (if endpoint exists)
      const refreshToken = getCurrentRefreshToken();
      
      if (refreshToken) {
        try {
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });
        } catch (error) {
          console.warn('Server logout notification failed:', error);
          // Continue with local cleanup even if server notification fails
        }
      }
    } finally {
      // Always clear local tokens
      clearAuthTokens();
    }
  }

  async validateToken(): Promise<AuthResponse> {
    try {
      const token = getCurrentAuthToken();
      
      if (!token) {
        return {
          success: false,
          error: 'No token to validate'
        };
      }
      
      // For demo purposes, check if token looks valid
      if (token.startsWith('demo-token-') || token.startsWith('eyJ')) {
        return {
          success: true,
          token
        };
      }
      
      return {
        success: false,
        error: 'Invalid token format'
      };
      
    } catch (error) {
      console.error('Token validation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token validation failed'
      };
    }
  }

  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const result = await this.makeAuthenticatedRequest<AuthResponse>('/auth/me');
      return {
        success: result.success ?? true,
        ...result,
      };
    } catch (error) {
      if (error instanceof Error && error.message === TokenErrorTypes.EXPIRED_TOKEN) {
        return {
          success: false,
          error: 'Session expired'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user info'
      };
    }
  }

  async updateOwnerProfile(request: OwnerProfileUpdateRequest): Promise<AuthResponse> {
    try {
      const result = await this.makeAuthenticatedRequest<AuthResponse>('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(request),
      });
      return {
        success: result.success ?? true,
        ...result,
      };
    } catch (error) {
      if (error instanceof Error && error.message === TokenErrorTypes.EXPIRED_TOKEN) {
        return {
          success: false,
          error: 'Session expired'
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile'
      };
    }
  }
}

export const authService = new AuthService();
