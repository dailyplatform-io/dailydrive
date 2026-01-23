import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { authService } from '../services/authService';
import { validatePassword } from '../utils/passwordValidator';
import './OwnerAuth.css';

type ResetLocationState = {
  email?: string;
  code?: string;
};

export const OwnerResetPassword: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as ResetLocationState | null) ?? null;
  const [email] = useState(state?.email ?? '');
  const [code] = useState(state?.code ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const passwordError = useMemo(() => {
    if (!submitted) return '';
    if (!password) return t('ownerAuth.error.passwordRequired');
    const validation = validatePassword(password);
    if (!validation.isValid) return validation.message || t('ownerAuth.error.passwordWeak');
    return '';
  }, [submitted, password, t]);

  const confirmError = useMemo(() => {
    if (!submitted) return '';
    if (!confirmPassword) return t('ownerReset.error.confirmRequired');
    if (password !== confirmPassword) return t('ownerReset.error.passwordsDoNotMatch');
    return '';
  }, [submitted, password, confirmPassword, t]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setApiError('');
    const passwordValidation = validatePassword(password);
    const nextPasswordError = !password
      ? t('ownerAuth.error.passwordRequired')
      : !passwordValidation.isValid
        ? passwordValidation.message || t('ownerAuth.error.passwordWeak')
        : '';
    const nextConfirmError = !confirmPassword
      ? t('ownerReset.error.confirmRequired')
      : password !== confirmPassword
        ? t('ownerReset.error.passwordsDoNotMatch')
        : '';
    if (nextPasswordError || nextConfirmError) return;
    if (!email || !code) {
      setApiError(t('ownerReset.error.missingContext'));
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword({
        email,
        code,
        newPassword: password,
        confirmNewPassword: confirmPassword,
      });

      if (!response.success) {
        setApiError(response.message || t('ownerReset.error.failed'));
        return;
      }

      navigate('/login', {
        replace: true,
        state: { message: t('ownerReset.success') },
      });
    } catch (error: any) {
      setApiError(error?.message || t('ownerReset.error.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="owner-auth-page">
      <section className="owner-auth-card">
        <header className="owner-auth-head">
          <p className="owner-auth-kicker">{t('ownerAuth.kicker')}</p>
          <h2 className="owner-auth-title">{t('ownerReset.title')}</h2>
          <p className="owner-auth-subtitle">{t('ownerReset.subtitle')}</p>
        </header>

        <form className="owner-auth-form" onSubmit={submit}>
          <label className="owner-auth-field">
            <span>{t('ownerReset.newPassword')}</span>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
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

          <label className="owner-auth-field">
            <span>{t('ownerReset.confirmPassword')}</span>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
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
            {confirmError && <p className="owner-auth-error">{confirmError}</p>}
          </label>

          {apiError && <p className="owner-auth-error">{apiError}</p>}

          <button className="owner-auth-submit" type="submit" disabled={loading}>
            {loading ? t('ownerReset.submitting') : t('ownerReset.submit')}
          </button>

          <p className="owner-auth-foot">
            {t('ownerReset.backToLogin')}{' '}
            <Link to="/login" className="owner-auth-link">
              {t('ownerRegister.goToLogin')}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
};
