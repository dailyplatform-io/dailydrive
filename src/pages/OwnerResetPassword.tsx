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
    if (passwordError || confirmError) return;
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
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
            {passwordError && <p className="owner-auth-error">{passwordError}</p>}
          </label>

          <label className="owner-auth-field">
            <span>{t('ownerReset.confirmPassword')}</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />
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
