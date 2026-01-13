import { 
  handleApiErrorWithRefresh, 
  TokenErrorTypes, 
  getCurrentAuthToken
} from '../utils/tokenUtils';

/**
 * API functions for payment completion
 */

interface CompletePaymentRequest {
  paymentMethod: string; // 'PayPal', 'Card', 'WhatsApp'
  transactionId?: string;
  subscriptionTier?: string;
  source?: string; // 'register', 'upgrade' - tracks where payment was initiated
}

interface CompletePaymentResponse {
  success: boolean;
  message: string;
  data?: any;
  requiresRefund?: boolean; // Indicates if PayPal refund may be needed
  source?: string; // Source from backend response
}

/**
 * Complete payment and activate subscription
 */
export const completePayment = async (
  paymentData: CompletePaymentRequest
): Promise<CompletePaymentResponse> => {
  const makePaymentRequest = async (): Promise<CompletePaymentResponse> => {
    // Get the JWT token from storage (try sessionStorage first, then localStorage)
    let token = getCurrentAuthToken();
    
    console.log('Payment service - checking token sources:', {
      tokenFound: !!token,
      tokenLength: token ? token.length : 0,
      tokenStart: token ? token.substring(0, 20) + '...' : 'none',
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL
    });

    if (!token) {
      throw new Error(TokenErrorTypes.AUTHENTICATION_REQUIRED);
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    
    console.log('Making payment completion request to:', `${apiBaseUrl}/auth/complete-payment`);
    
    const response = await fetch(`${apiBaseUrl}/auth/complete-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        paymentMethod: paymentData.paymentMethod,
        payPalTransactionId: paymentData.transactionId,
        subscriptionTier: paymentData.subscriptionTier,
        source: paymentData.source,
      }),
    });

    if (!response.ok) {
      console.error('Payment completion API error:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        wwwAuthenticate: response.headers.get('www-authenticate')
      });
      
      let errorMessage = 'Payment completion failed';
      
      try {
        const errorData = await response.text();
        console.error('Error response body:', errorData);
        
        if (errorData) {
          try {
            const parsedError = JSON.parse(errorData);
            errorMessage = parsedError.message || errorMessage;
            // Check if PayPal refund is needed
            if (parsedError.requiresRefund) {
              console.error('PayPal refund required for failed payment completion');
              errorMessage += ' (PayPal payment captured but backend processing failed - refund will be processed)';
            }
          } catch {
            errorMessage = errorData || errorMessage;
          }
        }
      } catch (e) {
        console.error('Could not read error response:', e);
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    // Update local storage with new auth data
    if (result.data) {
      localStorage.setItem('authUser', JSON.stringify(result.data));
      if (sessionStorage.getItem('authUser')) {
        sessionStorage.setItem('authUser', JSON.stringify(result.data));
      }
    }

    return {
      success: true,
      message: result.message || 'Payment completed successfully',
      data: result.data,
      source: result.source,
    };
  };

  try {
    // First attempt
    return await makePaymentRequest();
  } catch (error) {
    console.error('Payment completion error:', error);
    
    // Use enhanced error handling with automatic token refresh
    const { isTokenExpired, errorMessage, retryResult } = await handleApiErrorWithRefresh(
      error,
      undefined,
      makePaymentRequest
    );
    
    // If retry was successful, return the retry result
    if (retryResult) {
      return retryResult;
    }
    
    if (isTokenExpired) {
      throw new Error(TokenErrorTypes.EXPIRED_TOKEN);
    }
    
    return {
      success: false,
      message: errorMessage,
    };
  }
};