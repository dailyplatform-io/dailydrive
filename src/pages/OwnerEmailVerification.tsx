import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { authService } from '../service/authService';
import './OwnerAuth.css';

type LocationState = {
  email?: string;
};

export const OwnerEmailVerification: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? null;

  const [email, setEmail] = useState(state?.email ?? '');
  const [code, setCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const errors = useMemo(() => {
    if (!submitted) return {};
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = t('ownerVerify.error.required');
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = t('ownerAuth.error.emailInvalid');
    if (!code.trim()) next.code = t('ownerVerify.error.codeRequired');
    return next;
  }, [submitted, email, code, t]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setApiError('');
    if (Object.keys(errors).length) return;

    setLoading(true);
    try {
      const response = await authService.confirmEmail({
        email: email.trim(),
        code: code.trim(),
      });

      if (!response.success) {
        setApiError(response.message || t('ownerVerify.error.failed'));
        return;
      }

      navigate('/login', {
        replace: true,
        state: { message: t('ownerVerify.success') },
      });
    } catch (error: any) {
      setApiError(error?.message || t('ownerVerify.error.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="owner-auth-page">
      <section className="owner-auth-card">
        <header className="owner-auth-head">
          <p className="owner-auth-kicker">{t('ownerAuth.kicker')}</p>
          <h2 className="owner-auth-title">{t('ownerVerify.title')}</h2>
          <p className="owner-auth-subtitle">{t('ownerVerify.subtitle')}</p>
        </header>

        <form className="owner-auth-form" onSubmit={onSubmit}>
          <label className="owner-auth-field">
            <span>{t('ownerAuth.email')}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              inputMode="email"
            />
            {errors.email && <p className="owner-auth-error">{errors.email}</p>}
          </label>

          <label className="owner-auth-field">
            <span>{t('ownerVerify.code')}</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="one-time-code"
              inputMode="text"
              placeholder={t('ownerVerify.code.placeholder')}
            />
            {errors.code && <p className="owner-auth-error">{errors.code}</p>}
          </label>

          {apiError && <p className="owner-auth-error">{apiError}</p>}

          <button className="owner-auth-submit" type="submit" disabled={loading}>
            {loading ? t('ownerVerify.submitting') : t('ownerVerify.submit')}
          </button>

          <p className="owner-auth-foot">
            {t('ownerVerify.backToLogin')}{' '}
            <Link to="/login" className="owner-auth-link">
              {t('ownerRegister.goToLogin')}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
};
