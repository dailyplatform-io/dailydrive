import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OwnerProfileType, SubscriptionTier } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { Language } from '../i18n/translations';
import { features } from '../config/features';
import { authService } from '../service/authService';
import { validatePassword } from '../utils/passwordValidator';
import { MapEmbed } from '../components/MapEmbed';
import { PhoneInput } from '../components/PhoneInput';
import { isValidInstagramHandle, normalizeInstagramHandle } from '../utils/slug';
import './OwnerAuth.css';

const tierLabels: { tier: SubscriptionTier; label: string }[] = [
  { tier: 'free', label: 'Free (2 cars)' },
  { tier: 'basic5', label: 'Basic 5' },
  { tier: 'plus10', label: 'Plus 10' },
  { tier: 'standard20', label: 'Standard 20' },
  { tier: 'pro20plus', label: 'Pro 20+' },
];

function priceFor(profileType: OwnerProfileType, tier: SubscriptionTier) {
  if (tier === 'free') return 0;
  if (tier === 'basic5') return 180;
  if (tier === 'plus10') return 250;
  if (tier === 'standard20') return 350;
  return 450;
}

export const OwnerRegister: React.FC = () => {
  const { t, language, setLanguage, languageLabels } = useLanguage();
  const navigate = useNavigate();
  const capitalize = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);
  const privateSellerName = 'Private Cars';

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDialCode, setSelectedDialCode] = useState('355'); // Default to Albania (+355)
  const [profileType, setProfileType] = useState<OwnerProfileType>(
    features.rent ? 'rent' : features.buy ? 'buy' : 'rent'
  );
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [city, setCity] = useState('Tiranë');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [instagramName, setInstagramName] = useState('');
  const [facebookName, setFacebookName] = useState('');
  const [sellerType, setSellerType] = useState<'dealer' | 'private'>('dealer');
  const [confirmPasswordBlurred, setConfirmPasswordBlurred] = useState(false);
  const [useLocationInstead, setUseLocationInstead] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showTrialNotification, setShowTrialNotification] = useState(features.trial && features.subscriptions);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const emailSuggestions = ['@gmail.com', '@outlook.com', '@hotmail.com'];

  // Show trial notification on mount
  useEffect(() => {
    if (!showTrialNotification) return;
    const timer = setTimeout(() => setShowTrialNotification(false), 10000); // Hide after 10 seconds
    return () => clearTimeout(timer);
  }, [showTrialNotification]);

  useEffect(() => {
    if (!langOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!langRef.current || !(event.target instanceof Node)) return;
      if (!langRef.current.contains(event.target)) setLangOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLangOpen(false);
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [langOpen]);

  useEffect(() => {
    if (!features.rent && profileType === 'rent' && features.buy) {
      setProfileType('buy');
    } else if (!features.buy && profileType === 'buy' && features.rent) {
      setProfileType('rent');
    }
  }, [profileType, features.rent, features.buy]);

  useEffect(() => {
    if (!features.subscriptions) {
      setSubscriptionTier('free');
    }
  }, []);

  useEffect(() => {
    if (sellerType === 'private') {
      setSellerName(privateSellerName);
      setInstagramName('');
      setFacebookName('');
    } else if (sellerName === privateSellerName) {
      setSellerName('');
    }
  }, [sellerType, sellerName, privateSellerName]);

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

  const useMyLocation = async () => {
    if (!navigator.geolocation) {
      alert(t('ownerRegister.error.geolocationNotSupported'));
      return;
    }

    try {
      // First check if permission is already granted
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          alert(t('ownerRegister.error.locationPermissionDenied'));
          return;
        }
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(String(pos.coords.latitude));
          setLng(String(pos.coords.longitude));
          setUseLocationInstead(true);
          setAddress(''); // Clear manual address when using location
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = t('ownerRegister.error.locationFailed');
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = t('ownerRegister.error.locationPermissionDenied');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = t('ownerRegister.error.locationUnavailable');
              break;
            case error.TIMEOUT:
              errorMessage = t('ownerRegister.error.locationTimeout');
              break;
          }
          
          alert(errorMessage);
        },
        { 
          enableHighAccuracy: false, // Use false for better mobile compatibility
          timeout: 15000, // Increased timeout for mobile
          maximumAge: 300000 // 5 minutes cache
        }
      );
    } catch (error) {
      console.error('Location permission error:', error);
      alert(t('ownerRegister.error.locationFailed'));
    }
  };

  const useManualAddress = () => {
    setUseLocationInstead(false);
    setLat('');
    setLng('');
  };

  const errors = useMemo(() => {
    if (!submitted) return {};
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t('ownerRegister.error.required');
    if (!surname.trim()) next.surname = t('ownerRegister.error.required');
    if (sellerType === 'dealer' && !sellerName.trim()) next.sellerName = t('ownerRegister.error.required');
    if (!email.trim()) next.email = t('ownerRegister.error.required');
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = t('ownerAuth.error.emailInvalid');
    if (sellerType === 'dealer' && instagramName.trim() && !isValidInstagramHandle(instagramName)) {
      next.instagramName = t('ownerRegister.error.instagramInvalid');
    }
    if (!phone.trim()) next.phone = t('ownerRegister.error.required');
    // Address is only required if not using GPS location
    if (!useLocationInstead && !address.trim()) next.address = t('ownerRegister.error.required');
    // Coordinates are only required if using GPS location
    if (useLocationInstead && (!lat.trim() || Number.isNaN(Number(lat)))) next.lat = t('ownerRegister.error.coordinates');
    if (useLocationInstead && (!lng.trim() || Number.isNaN(Number(lng)))) next.lng = t('ownerRegister.error.coordinates');
    if (!password) next.password = t('ownerAuth.error.passwordRequired');
    else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        next.password = passwordValidation.message || 'Invalid password';
      }
    }
    if (!confirmPassword) next.confirmPassword = t('ownerRegister.error.confirmPasswordRequired');
    else if (password !== confirmPassword) next.confirmPassword = t('ownerRegister.error.passwordsDoNotMatch');
    return next;
  }, [submitted, name, surname, sellerName, sellerType, email, phone, instagramName, address, lat, lng, password, confirmPassword, useLocationInstead, t]);

  // Show password mismatch error immediately when user leaves confirm password field
  const confirmPasswordError = useMemo(() => {
    if (confirmPasswordBlurred && confirmPassword && password && password !== confirmPassword) {
      return t('ownerRegister.error.passwordsDoNotMatch');
    }
    return null;
  }, [confirmPasswordBlurred, confirmPassword, password, t]);

  const isFormValid = useMemo(() => {
    // Check if all required fields are filled
    // Address is only required if not using GPS location
    const addressRequired = !useLocationInstead && !address.trim();
    if (!name.trim() || !surname.trim() || (sellerType === 'dealer' && !sellerName.trim()) || !email.trim() || !phone.trim() || addressRequired || !password || !confirmPassword) {
      return false;
    }
    
    // Check email format
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      return false;
    }
    
    // Check coordinates - only required when using GPS location
    if (useLocationInstead && (!lat.trim() || !lng.trim() || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng)))) {
      return false;
    }
    
    // Check password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return false;
    }
    
    // Check passwords match
    if (password !== confirmPassword) {
      return false;
    }
    
    return true;
  }, [name, surname, sellerName, sellerType, email, phone, address, lat, lng, password, confirmPassword, useLocationInstead]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setEmailTaken(false);
    setApiError('');
    if (Object.keys(errors).length) return;

    setLoading(true);
    
    try {
      const response = await authService.register({
        firstName: name,
        lastName: surname,
        email,
        phone: `+${selectedDialCode}${phone}`,
        sellerName: sellerName.trim(),
        instagramName: sellerType === 'dealer' ? normalizeInstagramHandle(instagramName) || undefined : undefined,
        facebookName: sellerType === 'dealer' ? facebookName.trim() || undefined : undefined,
        isPrivateOwner: sellerType === 'private',
        profileType,
        subscriptionTier,
        city,
        address,
        latitude: lat ? Number(lat) : undefined,
        longitude: lng ? Number(lng) : undefined,
        password,
      });

      if (!response.success) {
        if (response.message?.toLowerCase().includes('email')) {
          setEmailTaken(true);
        } else {
          setApiError(response.message || 'Registration failed');
        }
        return;
      }

      navigate('/verify-email', {
        replace: true,
        state: { email, name, surname }
      });
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('email')) {
        setEmailTaken(true);
      } else {
        setApiError(error?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedPrice = priceFor(profileType, subscriptionTier);
  const mapsLink =
    lat.trim() && lng.trim() ? `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}` : 'https://www.google.com/maps?q=Tirana';
  
  const hasValidCoordinates = lat.trim() && lng.trim() && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));

  return (
    <main className="owner-auth-page">
      <section className="owner-auth-card">
        <header className="owner-auth-head">
          <div className="owner-auth-head-row">
            <p className="owner-auth-kicker">{t('ownerAuth.kicker')}</p>
            <div className="owner-auth-lang" ref={langRef}>
              <button
                className="owner-auth-lang-button"
                type="button"
                aria-label={t('language.label')}
                aria-haspopup="menu"
                aria-expanded={langOpen}
                onClick={() => setLangOpen((open) => !open)}
              >
                {languageLabels[language]}
              </button>
              {langOpen && (
                <div className="owner-auth-lang-popover" role="menu" aria-label={t('language.label')}>
                  {(Object.keys(languageLabels) as Language[]).map((code) => (
                    <button
                      key={code}
                      type="button"
                      role="menuitemradio"
                      aria-checked={code === language}
                      className={`owner-auth-lang-item ${code === language ? 'is-active' : ''}`}
                      onClick={() => {
                        setLanguage(code);
                        setLangOpen(false);
                      }}
                    >
                      {languageLabels[code]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <h2 className="owner-auth-title">{t('ownerRegister.title')}</h2>
          <p className="owner-auth-subtitle">
            {features.rent ? t('ownerRegister.subtitle.rent') : t('ownerRegister.subtitle.buy')}
          </p>
        </header>
        
        {showTrialNotification && (
          <div className="owner-auth-success" style={{ 
            marginBottom: '14px',
            position: 'relative',
            animation: 'slideDown 0.3s ease-out'
          }}>
            <button 
              onClick={() => setShowTrialNotification(false)}
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
            <strong>🎉 7-Day Free Trial Available!</strong>
            <p style={{ margin: '6px 0 0', fontSize: '13px', lineHeight: '1.5' }}>
              Start using DailyDrive today with a 7-day free trial. No payment required now!
            </p>
          </div>
        )}

        <form className="owner-auth-form" onSubmit={onSubmit}>
          <div className="owner-auth-grid">
            <label className="owner-auth-field">
              <span>{t('ownerRegister.name')}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
              {errors.name && <p className="owner-auth-error">{errors.name}</p>}
            </label>
            <label className="owner-auth-field">
              <span>{t('ownerRegister.surname')}</span>
              <input value={surname} onChange={(e) => setSurname(e.target.value)} autoComplete="family-name" />
              {errors.surname && <p className="owner-auth-error">{errors.surname}</p>}
            </label>
          </div>

          <div className="owner-auth-choice">
            <p className="owner-auth-choice__label">{t('ownerRegister.sellerType.title')}</p>
            <div className="owner-auth-choice__grid" role="radiogroup" aria-label={t('ownerRegister.sellerType.title')}>
              <label className={`owner-auth-choice__card ${sellerType === 'dealer' ? 'is-active' : ''}`}>
                <input
                  type="radio"
                  name="sellerType"
                  value="dealer"
                  checked={sellerType === 'dealer'}
                  onChange={() => setSellerType('dealer')}
                />
                <span className="owner-auth-choice__title">{t('ownerRegister.sellerType.dealer.title')}</span>
                <span className="owner-auth-choice__desc">{t('ownerRegister.sellerType.dealer.desc')}</span>
              </label>
              <label className={`owner-auth-choice__card ${sellerType === 'private' ? 'is-active' : ''}`}>
                <input
                  type="radio"
                  name="sellerType"
                  value="private"
                  checked={sellerType === 'private'}
                  onChange={() => setSellerType('private')}
                />
                <span className="owner-auth-choice__title">{t('ownerRegister.sellerType.private.title')}</span>
                <span className="owner-auth-choice__desc">{t('ownerRegister.sellerType.private.desc')}</span>
              </label>
            </div>
          </div>

          {sellerType === 'dealer' && (
            <label className="owner-auth-field">
              <span>{t('ownerRegister.sellerName')}</span>
              <input
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                autoComplete="organization"
                placeholder={t('ownerRegister.sellerName.placeholder')}
              />
              {errors.sellerName && <p className="owner-auth-error">{errors.sellerName}</p>}
            </label>
          )}

          {sellerType === 'dealer' && (
            <div className="owner-auth-grid">
              <label className="owner-auth-field">
                <span>{t('ownerRegister.instagram')}</span>
                <input
                  value={instagramName}
                  onChange={(e) => setInstagramName(e.target.value)}
                  placeholder={capitalize(t('ownerRegister.instagram.placeholder'))}
                  autoComplete="off"
                />
                <p style={{ marginTop: '4px', color: '#64748b', fontSize: '12px' }}>@example_name1</p>
                {errors.instagramName && <p className="owner-auth-error">{errors.instagramName}</p>}
              </label>
              <label className="owner-auth-field">
                <span>{t('ownerRegister.facebook')}</span>
                <input
                  value={facebookName}
                  onChange={(e) => setFacebookName(e.target.value)}
                  placeholder={capitalize(t('ownerRegister.facebook.placeholder'))}
                  autoComplete="off"
                />
              </label>
            </div>
          )}

          <label className="owner-auth-field">
            <span>{t('ownerAuth.email')}</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
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
            {errors.email && <p className="owner-auth-error">{errors.email}</p>}
            {emailTaken && <p className="owner-auth-error">{t('ownerRegister.error.emailTaken')}</p>}
          </label>

          <label className="owner-auth-field">
            <span>{t('ownerRegister.phone')}</span>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              selectedDialCode={selectedDialCode}
              onDialCodeChange={setSelectedDialCode}
              placeholder="123456789"
              required
            />
            {errors.phone && <p className="owner-auth-error">{errors.phone}</p>}
          </label>

          <div className="owner-auth-grid">
            {features.rent && features.buy && (
              <label className="owner-auth-field">
                <span>{t('ownerRegister.profileType')}</span>
                <select value={profileType} onChange={(e) => setProfileType(e.target.value as OwnerProfileType)}>
                  {features.rent && <option value="rent">{t('ownerRegister.profileType.rent')}</option>}
                  {features.buy && <option value="buy">{t('ownerRegister.profileType.buy')}</option>}
                </select>
              </label>
            )}
            {features.subscriptions && (
              <label className="owner-auth-field">
                <span>{t('ownerRegister.subscription')}</span>
                <select value={subscriptionTier} onChange={(e) => setSubscriptionTier(e.target.value as SubscriptionTier)}>
                  {tierLabels.map((row) => (
                    <option key={row.tier} value={row.tier}>
                      {row.label} — {priceFor(profileType, row.tier)}€ / year
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="owner-auth-divider">
            <span>{t('ownerRegister.location')}</span>
            <div className="owner-auth-divider__actions">
              {!useLocationInstead ? (
                <button className="owner-auth-mini" type="button" onClick={useMyLocation}>
                  {t('ownerRegister.useMyLocation')}
                </button>
              ) : (
                <button className="owner-auth-mini" type="button" onClick={useManualAddress}>
                  {t('ownerRegister.useManualAddress')}
                </button>
              )}
            </div>
          </div>

          {!useLocationInstead && (
            <div className="owner-auth-grid">
              <label className="owner-auth-field">
                <span>{t('ownerRegister.address')}</span>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, area…" />
                {errors.address && <p className="owner-auth-error">{errors.address}</p>}
              </label>
              <label className="owner-auth-field">
                <span>{t('ownerRegister.city')}</span>
                <input value={city} onChange={(e) => setCity(e.target.value)} />
              </label>
            </div>
          )}

          {useLocationInstead && hasValidCoordinates && (
            <div className="owner-auth-field">
              <span>{t('ownerRegister.locationStatus')}</span>
              <div className="owner-auth-location-info">
                <p>📍 Coordinates: {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}</p>
              </div>
            </div>
          )}

          <div className="owner-auth-grid">
            {useLocationInstead && (
              <label className="owner-auth-field">
                <span>{t('ownerRegister.city')}</span>
                <input value={city} onChange={(e) => setCity(e.target.value)} />
              </label>
            )}
            {useLocationInstead && (
              <label className="owner-auth-field">
                <span>{t('ownerRegister.coordinates')}</span>
                <div className="owner-auth-coords">
                  <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Lat" inputMode="decimal" />
                  <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Lng" inputMode="decimal" />
                </div>
                {(errors.lat || errors.lng) && <p className="owner-auth-error">{t('ownerRegister.error.coordinates')}</p>}
              </label>
            )}
          </div>

          {hasValidCoordinates && (
            <MapEmbed
              lat={Number(lat)}
              lng={Number(lng)}
              height={260}
              title="Registration location preview"
              showOpenLink={true}
              openLinkText={t('ownerRegister.openMap')}
              className="owner-auth-map"
            />
          )}

          <div className="owner-auth-grid">
            <label className="owner-auth-field">
              <span>{t('ownerAuth.password')}</span>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('ownerAuth.password.placeholder')}
                  autoComplete="new-password"
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
              {errors.password && <p className="owner-auth-error">{errors.password}</p>}
              
              {password ? (
                <div className="password-requirements">
                  <div className={`requirement ${password.length >= 8 ? 'requirement-met' : ''}`}>
                    ✓ At least 8 characters
                  </div>
                  <div className={`requirement ${/[A-Z]/.test(password) ? 'requirement-met' : ''}`}>
                    ✓ One uppercase letter
                  </div>
                  <div className={`requirement ${/[a-z]/.test(password) ? 'requirement-met' : ''}`}>
                    ✓ One lowercase letter
                  </div>
                  <div className={`requirement ${/[0-9]/.test(password) ? 'requirement-met' : ''}`}>
                    ✓ One number
                  </div>
                </div>
              ) : null}
            </label>
            <label className="owner-auth-field">
              <span>{t('ownerRegister.confirmPassword')}</span>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setConfirmPasswordBlurred(true)}
                  placeholder={t('ownerRegister.confirmPassword.placeholder')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
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
              {errors.confirmPassword && <p className="owner-auth-error">{errors.confirmPassword}</p>}
              {!errors.confirmPassword && confirmPasswordError && <p className="owner-auth-error">{confirmPasswordError}</p>}
            </label>
          </div>

          {apiError && <p className="owner-auth-error">{apiError}</p>}
          
          {submitted && !isFormValid && Object.keys(errors).length === 0 && (
            <p className="owner-auth-error">Please check all fields. Some information is missing or incorrect.</p>
          )}

          <button className="owner-auth-submit" type="submit" disabled={loading}>
            {loading ? 'Processing...' : (
              <>
                {t('ownerRegister.submit', { price: `${selectedPrice}€ / year` })}
                {features.subscriptions && features.trial ? (
                  <span style={{ display: 'block', fontSize: '11px', marginTop: '4px', opacity: 0.9 }}>
                    ✨ Start 7-day free trial
                  </span>
                ) : null}
              </>
            )}
          </button>

          <p className="owner-auth-foot">
            {t('ownerRegister.haveAccount')}{' '}
            <Link to="/login" className="owner-auth-link">
              {t('ownerRegister.goToLogin')}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
};
