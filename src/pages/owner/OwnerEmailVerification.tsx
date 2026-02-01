import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { authService } from '../../service/authService';
import './OwnerAuth.css';

type LocationState = {
  email?: string;
  name?: string;
  surname?: string;
};

export const OwnerEmailVerification: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? null;

  const [email] = useState(state?.email ?? '');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [resendError, setResendError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const lastSubmittedCodeRef = useRef('');

  const fullName = `${state?.name ?? ''} ${state?.surname ?? ''}`.trim();
  const initials = useMemo(() => {
    const parts = fullName.split(' ').filter(Boolean);
    if (parts.length === 0 && email) return email.charAt(0).toUpperCase();
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }, [fullName, email]);

  const errors = useMemo(() => {
    if (!submitted) return {};
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = t('ownerVerify.error.required');
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = t('ownerAuth.error.emailInvalid');
    const code = otp.join('');
    if (!code) next.code = t('ownerVerify.error.codeRequired');
    else if (!/^\d{6}$/.test(code)) next.code = t('ownerVerify.error.codeRequired');
    return next;
  }, [submitted, email, otp, t]);

  const setOtpDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    const next = Array(6).fill('');
    pasted.split('').forEach((digit, idx) => {
      next[idx] = digit;
    });
    setOtp(next);
    const lastIndex = Math.min(pasted.length, 6) - 1;
    if (lastIndex >= 0) {
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const submitVerification = async () => {
    setSubmitted(true);
    setApiError('');
    setResendError('');
    setResendStatus('');
    if (Object.keys(errors).length) return;

    setLoading(true);
    try {
      const currentCode = otp.join('');
      lastSubmittedCodeRef.current = currentCode;
      const response = await authService.confirmEmail({
        email: email.trim(),
        code: currentCode,
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
      setAutoSubmitting(false);
    }
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    await submitVerification();
  };

  useEffect(() => {
    const code = otp.join('');
    if (!email.trim()) return;
    if (loading || autoSubmitting) return;
    if (/^\d{6}$/.test(code) && code !== lastSubmittedCodeRef.current) {
      setAutoSubmitting(true);
      submitVerification();
    }
  }, [otp, email, loading, autoSubmitting]);

  const onResend = async () => {
    if (!email.trim()) {
      setResendError(t('ownerVerify.error.required'));
      return;
    }

    setResendLoading(true);
    setResendError('');
    setResendStatus('');
    try {
      const response = await authService.resendConfirmation({ email: email.trim() });
      if (!response.success) {
        setResendError(response.message || t('ownerVerify.resendFailed'));
        return;
      }
      setResendStatus(response.message || t('ownerVerify.resent'));
    } catch (error: any) {
      setResendError(error?.message || t('ownerVerify.resendFailed'));
    } finally {
      setResendLoading(false);
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
          <div className="owner-auth-identity">
            <div className="owner-auth-avatar" aria-hidden="true">
              {initials || 'DD'}
            </div>
            <div>
              <p className="owner-auth-identity-name">{fullName || t('ownerVerify.nameFallback')}</p>
              <p className="owner-auth-identity-email">
                <span className="owner-auth-identity-label">{t('ownerAuth.email')}:</span>{' '}
                {email || t('ownerVerify.emailFallback')}
              </p>
            </div>
          </div>
          {errors.email && <p className="owner-auth-error">{errors.email}</p>}

          <div className="owner-auth-field">
            <span>{t('ownerVerify.code')}</span>
            <div className="owner-auth-otp" onPaste={handleOtpPaste}>
              {otp.map((value, index) => (
                <input
                  key={`otp-${index}`}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  value={value}
                  onChange={(event) => setOtpDigit(index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  aria-label={`${t('ownerVerify.code')} ${index + 1}`}
                />
              ))}
            </div>
            {errors.code && <p className="owner-auth-error">{errors.code}</p>}
          </div>

          {apiError && <p className="owner-auth-error">{apiError}</p>}
          {resendError && <p className="owner-auth-error">{resendError}</p>}
          {resendStatus && <p className="owner-auth-success">{resendStatus}</p>}

          <button className="owner-auth-submit" type="submit" disabled={loading}>
            {loading ? t('ownerVerify.submitting') : t('ownerVerify.submit')}
          </button>

          <div className="owner-auth-footer-row">
            <p className="owner-auth-foot">
              {t('ownerVerify.backToLogin')}{' '}
              <Link to="/login" className="owner-auth-link">
                {t('ownerRegister.goToLogin')}
              </Link>
            </p>
            <button
              className="owner-auth-link owner-auth-resend"
              type="button"
              onClick={onResend}
              disabled={resendLoading}
            >
              {resendLoading ? t('ownerVerify.resending') : t('ownerVerify.resend')}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};
