const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface RegisterUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  sellerName: string;
  instagramName?: string;
  facebookName?: string;
  profileType: 'rent' | 'buy';
  subscriptionTier: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  userId: string;
  email: string;
  ownerId?: string;
  isActive: boolean;
  paymentCompleted: boolean;
  isInTrial?: boolean;
  trialEndsAt?: string;
  subscriptionTier?: string;
  subscriptionPriceEur: number;
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
  success: boolean;
  message?: string;
}

export interface CompletePaymentRequest {
  userId: string;
  paymentMethod: string;
  payPalTransactionId?: string;
  subscriptionTier?: string;
}

export interface RegistrationResponse {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionTier: string;
  subscriptionPriceEur: number;
  isActive: boolean;
  paymentCompleted: boolean;
}

export interface ConfirmEmailRequest {
  email: string;
  code: string;
}

export interface ConfirmEmailResponse {
  success: boolean;
  message?: string;
}

class AuthService {
  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async register(request: RegisterUserRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async completePayment(request: CompletePaymentRequest): Promise<RegistrationResponse> {
    return this.request<RegistrationResponse>('/registration/complete-payment', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getWhatsAppMessage(userId: string): Promise<string> {
    return this.request<string>(`/registration/whatsapp-message/${userId}`);
  }

  async getPaymentStatus(userId: string): Promise<{
    success: boolean;
    userId: string;
    isActive: boolean;
    paymentCompleted: boolean;
    subscriptionTier: string;
    subscriptionPriceEur: number;
  }> {
    return this.request(`/registration/payment-status/${userId}`);
  }

  async confirmEmail(request: ConfirmEmailRequest): Promise<ConfirmEmailResponse> {
    return this.request<ConfirmEmailResponse>('/auth/confirm-email', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export const authService = new AuthService();
