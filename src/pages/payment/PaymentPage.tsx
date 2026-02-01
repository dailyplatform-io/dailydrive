import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import type { ReactPayPalScriptOptions } from '@paypal/react-paypal-js';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../service/authService';
// import { handleSuccessfulPayment } from '../utils/subscriptionUtils'; // Unused
import { completePayment } from '../../services/paymentService';
import { TokenErrorTypes } from '../../utils/tokenUtils';
import './PaymentPage.css';

const SUPPORT_PHONE = '+355685555104';
const REDIRECT_DELAY_MS = 5000;
const REDIRECT_COUNTDOWN_SECONDS = 5;

type LoadingState = 'paypal' | null;

interface PaymentPageState {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionTier: string;
  subscriptionPriceEur: number;
  isUpgrade?: boolean;
  originalTier?: string;
  trialExpired?: boolean;
}

interface PayPalButtonsSectionProps {
  amount: string;
  planDescription: string;
  onApprove: (data: any, actions: any) => Promise<void>;
  onError: (err: any) => void;
  onCancel: () => void;
}

function PayPalButtonsSection({
  amount,
  planDescription,
  onApprove,
  onError,
  onCancel
}: PayPalButtonsSectionProps) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  useEffect(() => {
    if (isRejected) {
      onError(new Error('Failed to load PayPal checkout.'));
    }
  }, [isRejected, onError]);

  if (isPending) {
    return (
      <div className="payment-loading-box">
        <div className="payment-spinner" />
        <span>Loading secure checkout…</span>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="payment-error-box">
        We couldn't load PayPal checkout. Please refresh the page and try again.
      </div>
    );
  }

  return (
    <PayPalButtons
      style={{ layout: 'vertical', shape: 'rect', label: 'pay', color: 'blue' }}
      forceReRender={[amount, planDescription]}
      createOrder={(_, actions) => {
        if (!actions.order) {
          onError(new Error('Unable to initiate PayPal order.'));
          return Promise.reject(new Error('PayPal order actions unavailable.'));
        }

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
          onError(new Error('Invalid payment amount.'));
          return Promise.reject(new Error('Invalid payment amount.'));
        }

        return actions.order.create({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: 'EUR',
                value: amount,
                breakdown: {
                  item_total: {
                    currency_code: 'EUR',
                    value: amount
                  }
                }
              },
              description: planDescription,
              items: [{
                name: planDescription,
                unit_amount: {
                  currency_code: 'EUR',
                  value: amount
                },
                quantity: '1',
                category: 'DIGITAL_GOODS' as const
              }]
            }
          ],
          application_context: {
            shipping_preference: 'NO_SHIPPING' as const,
            user_action: 'PAY_NOW',
            brand_name: 'DailyDrive',
            locale: 'en-US',
            landing_page: 'LOGIN'
          }
        });
      }}
      onApprove={onApprove}
      onError={onError}
      onCancel={onCancel}
    />
  );
}

export const PaymentPage: React.FC = () => {
  useLanguage(); // Keep language context for future i18n
  const { setUserFromApi } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState<LoadingState>(null);
  const [error, setError] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(REDIRECT_COUNTDOWN_SECONDS);
  const redirectTimeoutRef = useRef<number | null>(null);
  const redirectIntervalRef = useRef<number | null>(null);

  // Get state from navigation
  const state = location.state as PaymentPageState | null;
  
  console.log('PaymentPage - received state:', state);
  console.log('PaymentPage - subscriptionPriceEur:', state?.subscriptionPriceEur);
  console.log('PaymentPage - subscriptionTier:', state?.subscriptionTier);
  console.log('PaymentPage - isUpgrade:', state?.isUpgrade);
  
  const hasContext = Boolean(state?.userId && state?.email);

  // PayPal Client ID - Use environment variable or fallback to sandbox
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AS-HkuhsEDi5lU6-BvUhbwRmDKed5gBXni-c6q8ZTwTPqNX28Q_4UzMY-JHfBBNp6Tkk5mDV1mt8YPLB';

  const clearRedirectTimers = useCallback(() => {
    if (redirectIntervalRef.current) {
      window.clearInterval(redirectIntervalRef.current);
      redirectIntervalRef.current = null;
    }
    if (redirectTimeoutRef.current) {
      window.clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearRedirectTimers();
    };
  }, [clearRedirectTimers]);

  // Generate WhatsApp message
  useEffect(() => {
    if (!hasContext || !state) return;
    
    const message = `Hi! I'm ${state.firstName} ${state.lastName} and I'd like to complete my DailyDrive registration.\n\n` +
      `User ID: ${state.userId}\n` +
      `Email: ${state.email}\n` +
      `Plan: ${state.subscriptionTier}\n` +
      `Amount: €${state.subscriptionPriceEur.toFixed(2)}/year\n\n` +
      'Please help me complete the payment process.';
    
    setWhatsappMessage(message);
  }, [hasContext, state]);

  // Handle payment success redirect
  useEffect(() => {
    if (!paymentSuccess) return;

    setRedirectCountdown(REDIRECT_COUNTDOWN_SECONDS);
    clearRedirectTimers();

    const intervalId = window.setInterval(() => {
      setRedirectCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      clearRedirectTimers();
      console.log('PaymentPage - redirect logic: isUpgrade =', state?.isUpgrade);
      if (state?.isUpgrade) {
        console.log('PaymentPage - navigating to dashboard (upgrade)');
        navigate('/dashboard', { 
          replace: true,
          state: { message: '🎉 Subscription upgraded successfully!' }
        });
      } else {
        console.log('PaymentPage - navigating to login (new registration)');
        navigate('/login?message=🎉 Account activated successfully! You can now log in.');
      }
    }, REDIRECT_DELAY_MS);

    redirectIntervalRef.current = intervalId;
    redirectTimeoutRef.current = timeoutId;

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [paymentSuccess, clearRedirectTimers, navigate]);

  const planLabel = useMemo(() => {
    if (!state?.subscriptionTier) return '—';
    if (state.subscriptionTier === 'free') return '1 Car (Free)';
    return `${state.subscriptionTier} Cars`;
  }, [state?.subscriptionTier]);

  const planDescription = useMemo(
    () => `DailyDrive annual subscription (${planLabel})`,
    [planLabel]
  );

  const formattedPrice = useMemo(() => {
    if (!state?.subscriptionPriceEur) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: state.subscriptionPriceEur % 1 === 0 ? 0 : 2,
      maximumFractionDigits: state.subscriptionPriceEur % 1 === 0 ? 0 : 2
    }).format(state.subscriptionPriceEur);
  }, [state?.subscriptionPriceEur]);

  const paypalAmount = useMemo(() => {
    if (!state?.subscriptionPriceEur) return '0.00';
    return state.subscriptionPriceEur.toFixed(2);
  }, [state?.subscriptionPriceEur]);

  // Stabilize PayPal options - only depends on clientId which shouldn't change
  const paypalOptions = useMemo<ReactPayPalScriptOptions>(
    () => ({
      clientId: paypalClientId,
      currency: 'EUR',
      intent: 'capture',
      components: 'buttons',
      vault: false,
      locale: 'en_US'
    }),
    [paypalClientId]
  );

  const openWhatsApp = () => {
    const encodedMessage = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/${SUPPORT_PHONE}?text=${encodedMessage}`, '_blank');
  };

  const handlePaymentCompletion = useCallback(async (paymentMethod: string, transactionId?: string) => {
    setError('');
    setLoading(paymentMethod.toLowerCase() as LoadingState);
    
    try {
      const result = await completePayment({
        paymentMethod,
        transactionId,
        subscriptionTier: state?.subscriptionTier,
        source: state?.isUpgrade ? 'upgrade' : 'register',
      });

      if (result.success && result.data) {
        // Update the auth context with the new user data
        setUserFromApi(result.data);
        setPaymentSuccess(true);
        console.log('Payment completed and user transitioned to active subscription');
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Payment completion error:', error);
      
      if (error instanceof Error) {
        if (error.message === TokenErrorTypes.EXPIRED_TOKEN) {
          setError('Your session has expired. Please log in again to complete payment.');
          // Redirect to login after a short delay
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 2000);
          return;
        } else if (error.message === TokenErrorTypes.AUTHENTICATION_REQUIRED) {
          setError('Authentication required. Please log in again.');
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 2000);
          return;
        }
        
        setError(error.message);
      } else {
        setError('Payment completion failed. Please try again.');
      }
    } finally {
      setLoading(null);
    }
  }, [state?.subscriptionTier, setUserFromApi]);

  const handlePayPalApprove = useCallback(async (data: any, actions: any) => {
    if (!actions?.order) {
      setError('Unable to finalize PayPal order. Please try again.');
      return;
    }

    setLoading('paypal');
    setError('');

    try {
      const capture = await actions.order.capture();
      const transactionId =
        capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id ??
        capture?.id ??
        data?.orderID;

      if (!transactionId) {
        throw new Error('PayPal did not return a transaction reference.');
      }

      await handlePaymentCompletion('PayPal', transactionId);
    } catch (approvalError: any) {
      console.error('PayPal approval failure:', approvalError);
      
      let errorMessage = 'We could not confirm the PayPal payment. Please try again.';
      
      if (approvalError?.message?.includes('COMPLIANCE_VIOLATION')) {
        errorMessage = 'Payment blocked due to compliance restrictions. Please try a different payment method or contact support.';
      } else if (approvalError?.message?.includes('UNPROCESSABLE_ENTITY')) {
        errorMessage = 'Payment could not be processed. Please verify your PayPal account or try again later.';
      } else if (approvalError?.message) {
        errorMessage = approvalError.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(null);
    }
  }, [state?.userId, handlePaymentCompletion]);

  const handlePayPalError = useCallback((err: any) => {
    console.error('PayPal button error:', err);
    setLoading(null);
    const message = err?.message || err?.toString?.() || 'PayPal payment failed. Please try again.';
    setError(message);
    
    // For upgrades, show option to go back after error
    if (state?.isUpgrade && err?.message?.includes('UNPROCESSABLE_ENTITY')) {
      setTimeout(() => {
        if (window.confirm('Payment failed. Would you like to return to the dashboard?')) {
          navigate('/dashboard', { 
            replace: true,
            state: { message: 'Payment failed. Your subscription remains unchanged.' }
          });
        }
      }, 1000);
    }
  }, [state?.isUpgrade, navigate]);

  const handlePayPalCancel = useCallback(() => {
    setLoading(null);
    setError('PayPal payment was cancelled.');
    
    // If this is an upgrade, redirect back to dashboard after a short delay
    if (state?.isUpgrade) {
      setTimeout(() => {
        navigate('/dashboard', { 
          replace: true,
          state: { message: 'Payment cancelled. Your subscription remains unchanged.' }
        });
      }, 2000);
    }
  }, [state?.isUpgrade, navigate]);

  // Missing context screen
  if (!hasContext) {
    return (
      <main className="payment-page">
        <div className="payment-container">
          <div className="payment-card payment-card--error">
            <div className="payment-icon payment-icon--warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="payment-title">Registration Not Found</h1>
            <p className="payment-subtitle">
              We couldn't detect your registration details. Please start a new registration.
            </p>
            <div className="payment-actions">
              <button className="payment-btn payment-btn--primary" onClick={() => navigate('/register')}>
                Go to Registration
              </button>
              <button className="payment-btn payment-btn--secondary" onClick={() => navigate('/login')}>
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Success screen
  if (paymentSuccess) {
    return (
      <main className="payment-page">
        <div className="payment-container">
          <div className="payment-card payment-card--success">
            <div className="payment-icon payment-icon--success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 className="payment-title">Payment Confirmed!</h1>
            <p className="payment-subtitle">
              {state?.isUpgrade 
                ? `Subscription upgraded successfully! Redirecting to dashboard in ${redirectCountdown} second${redirectCountdown === 1 ? '' : 's'}.`
                : `Your subscription is now active. Redirecting to login in ${redirectCountdown} second${redirectCountdown === 1 ? '' : 's'}.`
              }
            </p>
            
            <div className="payment-summary-grid">
              <div className="payment-summary-item">
                <span className="payment-summary-label">Account</span>
                <span className="payment-summary-value">{state?.email}</span>
              </div>
              <div className="payment-summary-item">
                <span className="payment-summary-label">Plan</span>
                <span className="payment-summary-value">{planLabel} · {formattedPrice}/year</span>
              </div>
            </div>
            
            <button 
              className="payment-btn payment-btn--primary"
              onClick={() => {
                clearRedirectTimers();
                console.log('PaymentPage - manual button click: isUpgrade =', state?.isUpgrade);
                if (state?.isUpgrade) {
                  console.log('PaymentPage - manually navigating to dashboard (upgrade)');
                  navigate('/dashboard', { 
                    replace: true,
                    state: { message: '🎉 Subscription upgraded successfully!' }
                  });
                } else {
                  console.log('PaymentPage - manually navigating to login (new registration)');
                  navigate('/login?message=🎉 Account activated successfully!');
                }
              }}
            >
              {state?.isUpgrade ? 'Go to Dashboard Now' : 'Go to Login Now'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Main payment screen
  return (
    <main className="payment-page">
      <div className="payment-container">
        {/* Header */}
        <header className="payment-header">
          <div className="payment-logo">
            <div className="payment-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l2 2 4-4" />
              </svg>
            </div>
            <div className="payment-logo-text">
              <span className="payment-logo-name">DailyDrive</span>
              <span className="payment-logo-tagline">Complete Registration</span>
            </div>
          </div>
          <button className="payment-back-btn" onClick={() => {
            // Navigate back to previous page
            window.history.back();
          }}>
            ← Back
          </button>
        </header>

        {/* Main Card */}
        <div className="payment-card">
          <div className="payment-card-header">
            <div className="payment-icon payment-icon--shield">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="payment-title">Complete Your Registration</h1>
              <p className="payment-subtitle">Choose a payment option to activate your account</p>
            </div>
          </div>

          {/* Status Cards */}
          <div className="payment-status-grid">
            <div className="payment-status-card payment-status-card--pending">
              <span className="payment-status-label">Status</span>
              <span className="payment-status-value">
                {state?.trialExpired ? 'Trial Expired' : 'Pending Activation'}
              </span>
              <span className="payment-status-hint">
                {state?.trialExpired ? 'Complete payment to continue' : 'Account activates after payment'}
              </span>
            </div>
            <div className="payment-status-card">
              <span className="payment-status-label">Email</span>
              <span className="payment-status-value">{state?.email}</span>
            </div>
            <div className="payment-status-card">
              <span className="payment-status-label">Plan</span>
              <span className="payment-status-value">{planLabel}</span>
              <span className="payment-status-hint">{formattedPrice}/year</span>
            </div>
          </div>
          
          {state?.trialExpired && (
            <div className="payment-error-banner" style={{ background: '#fff3cd', border: '1px solid #ffc107', color: '#856404' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Your 7-day free trial has ended. Please complete payment to continue using DailyDrive.
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="payment-error-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          {/* Payment Options */}
          <div className="payment-options">
            {/* PayPal Section */}
            <section className="payment-option">
              <div className="payment-option-header">
                <div className="payment-option-icon payment-option-icon--paypal">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="payment-option-title">Pay with PayPal</h3>
                  <p className="payment-option-desc">Secure instant payment with PayPal or credit card</p>
                </div>
              </div>
              
              <div className="payment-option-content">
                {state?.subscriptionPriceEur && state.subscriptionPriceEur > 0 ? (
                  <>
                    <p className="payment-amount">
                      Total: <strong>{formattedPrice}/year</strong>
                    </p>
                    <PayPalScriptProvider options={paypalOptions}>
                      <PayPalButtonsSection
                        amount={paypalAmount}
                        planDescription={planDescription}
                        onApprove={handlePayPalApprove}
                        onError={handlePayPalError}
                        onCancel={handlePayPalCancel}
                      />
                    </PayPalScriptProvider>
                    {loading === 'paypal' && (
                      <p className="payment-processing">Finalizing your payment…</p>
                    )}
                  </>
                ) : (
                  <div className="payment-free-notice">
                    <p>Your plan is <strong>free</strong>! Click below to activate your account.</p>
                    <button 
                      className="payment-btn payment-btn--primary"
                      onClick={async () => {
                        setLoading('paypal');
                        try {
                          const result = await authService.completePayment({
                            userId: state?.userId || '',
                            paymentMethod: 'Free',
                            payPalTransactionId: undefined,
                            subscriptionTier: state?.isUpgrade ? state?.subscriptionTier : undefined
                          });
                          if (result.paymentCompleted) {
                            handlePaymentCompletion('WhatsApp');
                          } else {
                            setError('Activation failed. Please try again.');
                          }
                        } catch {
                          setError('Activation failed. Please try again.');
                        } finally {
                          setLoading(null);
                        }
                      }}
                    >
                      {loading === 'paypal' ? 'Activating...' : 'Activate Free Account'}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* WhatsApp Section */}
            {state?.subscriptionPriceEur && state.subscriptionPriceEur > 0 && (
              <section className="payment-option payment-option--alt">
                <div className="payment-option-header">
                  <div className="payment-option-icon payment-option-icon--whatsapp">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="payment-option-title">Contact via WhatsApp</h3>
                    <p className="payment-option-desc">Get help from our team to complete your payment</p>
                  </div>
                </div>
                
                <div className="payment-option-content">
                  <button className="payment-btn payment-btn--whatsapp" onClick={openWhatsApp}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Open WhatsApp Chat
                  </button>
                  <p className="payment-option-hint">
                    Include your User ID: <strong>{state?.userId?.substring(0, 8)}...</strong>
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* Account Summary */}
          <div className="payment-summary">
            <h3 className="payment-summary-title">Account Summary</h3>
            <div className="payment-summary-list">
              <div className="payment-summary-row">
                <span>Name</span>
                <span>{state?.firstName} {state?.lastName}</span>
              </div>
              <div className="payment-summary-row">
                <span>Email</span>
                <span>{state?.email}</span>
              </div>
              <div className="payment-summary-row">
                <span>Plan</span>
                <span>{planLabel}</span>
              </div>
              <div className="payment-summary-row payment-summary-row--total">
                <span>Annual Fee</span>
                <span>{formattedPrice}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="payment-footer">
          <p>By completing payment, you agree to our Terms of Service and Privacy Policy.</p>
        </footer>
      </div>
    </main>
  );
};
