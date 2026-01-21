import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { OwnerAccount, OwnerProfileType, SubscriptionTier, annualPriceEur, useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { features } from '../config/features';
import { authService } from '../services/authService';
import { slugifySellerName } from '../utils/slug';
import { getCurrentAuthToken } from '../utils/tokenUtils';
import './OwnerAuth.css';

export const OwnerLogin: React.FC = () => {
  const { t } = useLanguage();
  const { setUserFromApi } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const successMessage = searchParams.get('message');
  const [registrationSuccess, setRegistrationSuccess] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const emailSuggestions = ['@gmail.com', '@outlook.com', '@hotmail.com', '@yahoo.com'];

  // Check for success message from registration
  useEffect(() => {
    const navState = location.state as { message?: string } | null;
    if (navState?.message) {
      setRegistrationSuccess(navState.message);
      // Clear the state
      window.history.replaceState({}, document.title);
      // Auto-clear after 10 seconds
      setTimeout(() => setRegistrationSuccess(''), 10000);
    }
  }, [location.state]);

  const applyEmailSuggestion = (domain: string) => {
    setEmail((current) => {
      const trimmed = current.trim();
      if (!trimmed) return current;
      const atIndex = trimmed.indexOf('@');
      const localPart = atIndex === -1 ? trimmed : trimmed.slice(0, atIndex);
      if (!localPart) return current;
      return `${localPart}${domain}`;
    });
  };

  const emailError = useMemo(() => {
    if (!submitted) return '';
    if (!email.trim()) return t('ownerAuth.error.emailRequired');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return t('ownerAuth.error.emailInvalid');
    return '';
  }, [email, submitted, t]);

  const passwordError = useMemo(() => {
    if (!submitted) return '';
    if (!password) return t('ownerAuth.error.passwordRequired');
    if (password.length < 6) return t('ownerAuth.error.passwordShort');
    return '';
  }, [password, submitted, t]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setInvalid(false);
    setApiError('');
    if (emailError || passwordError) return;

    setLoading(true);
    
    try {
      // Try API login first
      const response = await authService.login({ email, password, rememberMe });
      
      console.log('Login response:', response);
      
      if (!response.success) {
        setInvalid(true);
        return;
      }
      
      // Check if user can access (active subscription or valid trial)
      if (!response.isActive && !response.isInTrial) {
        console.log('Account inactive and trial expired, redirecting to payment page');
        // Redirect to payment page
        navigate('/payment', { 
          replace: true,
          state: {
            userId: response.userId || response.ownerId,
            email: response.email,
            firstName: response.firstName || '',
            lastName: response.lastName || '',
            subscriptionTier: response.subscriptionTier || 'free',
            subscriptionPriceEur: response.subscriptionPriceEur || 0,
            trialExpired: true,
          }
        });
        return;
      }
      
      console.log('Login successful, storing token and navigating to dashboard');
      const token = response.token ?? getCurrentAuthToken();
      if (!token) {
        setInvalid(true);
        setApiError('Login succeeded but token was not returned. Please try again.');
        return;
      }
      // Store the token based on remember me preference
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('authToken', token);
      storage.setItem('authUser', JSON.stringify({
        id: response.userId || response.ownerId,
        email: response.email,
        isActive: response.isActive,
        paymentCompleted: response.paymentCompleted,
        isInTrial: response.isInTrial,
        trialEndsAt: response.trialEndsAt,
        sellerName: response.sellerName,
        sellerSlug: response.sellerSlug ?? (response.sellerName ? slugifySellerName(response.sellerName) : undefined),
        instagramName: response.instagramName,
        facebookName: response.facebookName
      }));

      const normalizeNumber = (value: unknown) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : 0;
      };

      const profileType = (response.profileType as OwnerProfileType) || 'rent';
      const subscriptionTier = (response.subscriptionTier as SubscriptionTier) || 'free';
      const now = new Date();
      const nextYear = new Date(now);
      nextYear.setFullYear(now.getFullYear() + 1);

      const ownerAccount: OwnerAccount = {
        id: response.userId || response.ownerId || crypto.randomUUID(),
        name: response.firstName || '',
        surname: response.lastName || '',
        email: response.email,
        phone: response.phone || '',
        sellerName: response.sellerName,
        sellerSlug: response.sellerSlug ?? (response.sellerName ? slugifySellerName(response.sellerName) : undefined),
        instagramName: response.instagramName,
        facebookName: response.facebookName,
        profileType,
        subscriptionTier,
        subscriptionStartedAt: now.toISOString(),
        subscriptionEndsAt: nextYear.toISOString(),
        subscriptionPaidEur:
          typeof response.subscriptionPriceEur === 'number'
            ? response.subscriptionPriceEur
            : annualPriceEur(profileType, subscriptionTier),
        subscriptionPendingTier: undefined,
        subscriptionPendingStartsAt: undefined,
        password: '',
        // Preserve the complete API response for payment service
        token,
        isActive: response.isActive,
        paymentCompleted: response.paymentCompleted,
        isInTrial: response.isInTrial,
        trialEndsAt: response.trialEndsAt,
        subscriptionUntil: (response as any).subscriptionUntil,
        paymentMethod: (response as any).paymentMethod,
        subscriptionPriceEur: response.subscriptionPriceEur,
        SubscriptionTier: response.subscriptionTier, // Keep both formats
        IsActive: response.isActive,
        PaymentCompleted: response.paymentCompleted,
        IsInTrial: response.isInTrial,
        TrialEndsAt: response.trialEndsAt,
        PaymentMethod: (response as any).paymentMethod,
        SubscriptionPriceEur: response.subscriptionPriceEur,
        location: {
          city: response.city || '—',
          address: response.address || '—',
          lat: normalizeNumber(response.latitude),
          lng: normalizeNumber(response.longitude),
        },
        createdAt: now.toISOString(),
      } as any;

      setUserFromApi(ownerAccount);
      
      console.log('Navigating to dashboard...');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      setInvalid(true);
      setApiError(error?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="owner-auth-page">
      <section className="owner-auth-card">
        <header className="owner-auth-head">
          <p className="owner-auth-kicker">{t('ownerAuth.kicker')}</p>
          <h2 className="owner-auth-title">{t('ownerLogin.title')}</h2>
          <p className="owner-auth-subtitle">{t('ownerLogin.subtitle')}</p>
        </header>

        <form className="owner-auth-form" onSubmit={onSubmit} autoComplete="on">
          {successMessage && (
            <div className="owner-auth-success">
              {successMessage}
            </div>
          )}
          
          {registrationSuccess && (
            <div className="owner-auth-success" style={{ position: 'relative' }}>
              <button 
                onClick={() => setRegistrationSuccess('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '12px',
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#166534',
                  opacity: 0.7,
                  lineHeight: 1
                }}
              >
                ×
              </button>
              {registrationSuccess}
            </div>
          )}
          
          <label className="owner-auth-field">
            <span>{t('ownerAuth.email')}</span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="username"
              inputMode="email"
            />
            <div className="owner-auth-email-suggestions">
              {emailSuggestions.map((domain) => (
                <button
                  key={domain}
                  type="button"
                  className="owner-auth-email-suggestion"
                  onClick={() => applyEmailSuggestion(domain)}
                  aria-label={`Use ${domain} for email`}
                >
                  {domain}
                </button>
              ))}
            </div>
            {emailError && <p className="owner-auth-error">{emailError}</p>}
          </label>

          <label className="owner-auth-field">
            <span>{t('ownerAuth.password')}</span>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('ownerAuth.password.placeholder')}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            {passwordError && <p className="owner-auth-error">{passwordError}</p>}
          </label>

          {invalid && <p className="owner-auth-error">{t('ownerLogin.error.invalidCredentials')}</p>}
          {apiError && <p className="owner-auth-error">{apiError}</p>}

          <label className="remember-me-field">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>{t('ownerLogin.rememberMe') || 'Remember me'}</span>
          </label>

          <button className="owner-auth-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : t('ownerLogin.submit')}
          </button>

          <p className="owner-auth-foot">
            {t('ownerLogin.noAccount')}{' '}
            <Link to="/register" className="owner-auth-link">
              {t('ownerLogin.register')}
            </Link>
            {features.subscriptions && features.trial ? (
              <span style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>
                ✨ Start with 7-day free trial
              </span>
            ) : null}
          </p>
        </form>
      </section>
    </main>
  );
};
