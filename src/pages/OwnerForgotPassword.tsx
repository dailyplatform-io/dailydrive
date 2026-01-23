import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { authService } from '../services/authService';
import './OwnerAuth.css';

export const OwnerForgotPassword: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [resendError, setResendError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const lastSubmittedCodeRef = useRef('');
  const emailSuggestions = ['@gmail.com', '@outlook.com', '@hotmail.com', '@yahoo.com'];

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
    if (!email.trim()) return t('ownerForgot.error.required');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return t('ownerAuth.error.emailInvalid');
    return '';
  }, [submitted, email, t]);

  const codeError = useMemo(() => {
    if (!submitted || step !== 'code') return '';
    const code = otp.join('');
    if (!code) return t('ownerForgot.error.codeRequired');
    if (!/^\d{6}$/.test(code)) return t('ownerForgot.error.codeRequired');
    return '';
  }, [submitted, otp, step, t]);

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

  const submitEmail = async () => {
    setSubmitted(true);
    setApiError('');
    setResendError('');
    setResendStatus('');
    if (emailError) return;

    setLoading(true);
    try {
      const response = await authService.forgotPassword({ email: email.trim() });
      if (!response.success) {
        setApiError(response.message || t('ownerForgot.error.failed'));
        return;
      }
      setStep('code');
      setSubmitted(false);
      setOtp(Array(6).fill(''));
    } catch (error: any) {
      setApiError(error?.message || t('ownerForgot.error.failed'));
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async () => {
    setSubmitted(true);
    setApiError('');
    setResendError('');
    setResendStatus('');
    if (codeError) return;

    setLoading(true);
    try {
      const currentCode = otp.join('');
      lastSubmittedCodeRef.current = currentCode;
      const response = await authService.verifyResetCode({
        email: email.trim(),
        code: currentCode,
      });
      if (!response.success) {
        setApiError(response.message || t('ownerForgot.error.codeInvalid'));
        return;
      }
      navigate('/reset-password', {
        replace: true,
        state: { email: email.trim(), code: currentCode }
      });
    } catch (error: any) {
      setApiError(error?.message || t('ownerForgot.error.codeInvalid'));
    } finally {
      setLoading(false);
      setAutoSubmitting(false);
    }
  };

  const resendCode = async () => {
    if (!email.trim()) {
      setResendError(t('ownerForgot.error.required'));
      return;
    }
    setResendLoading(true);
    setResendError('');
    setResendStatus('');
    try {
      const response = await authService.forgotPassword({ email: email.trim() });
      if (!response.success) {
        setResendError(response.message || t('ownerForgot.error.failed'));
        return;
      }
      setResendStatus(t('ownerForgot.resendSuccess'));
    } catch (error: any) {
      setResendError(error?.message || t('ownerForgot.error.failed'));
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    if (step !== 'code') return;
    const code = otp.join('');
    if (loading || autoSubmitting) return;
    if (/^\d{6}$/.test(code) && code !== lastSubmittedCodeRef.current) {
      setAutoSubmitting(true);
      submitCode();
    }
  }, [otp, step, loading, autoSubmitting]);

  return (
    <main className="owner-auth-page">
      <section className="owner-auth-card">
        <header className="owner-auth-head">
          <p className="owner-auth-kicker">{t('ownerAuth.kicker')}</p>
          <h2 className="owner-auth-title">{t('ownerForgot.title')}</h2>
          <p className="owner-auth-subtitle">
            {step === 'email' ? t('ownerForgot.subtitle') : t('ownerForgot.subtitleCode')}
          </p>
        </header>

        <form
          className="owner-auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (loading) return;
            if (step === 'email') {
              submitEmail();
            } else {
              submitCode();
            }
          }}
        >
          {step === 'email' ? (
            <label className="owner-auth-field">
              <span>{t('ownerAuth.email')}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
              {emailError && <p className="owner-auth-error">{emailError}</p>}
            </label>
          ) : (
            <div className="owner-auth-field">
              <span>{t('ownerForgot.code')}</span>
              <div className="owner-auth-otp" onPaste={handleOtpPaste}>
                {otp.map((value, index) => (
                  <input
                    key={`reset-otp-${index}`}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    value={value}
                    onChange={(event) => setOtpDigit(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    aria-label={`${t('ownerForgot.code')} ${index + 1}`}
                  />
                ))}
              </div>
              {codeError && <p className="owner-auth-error">{codeError}</p>}
            </div>
          )}

          {apiError && <p className="owner-auth-error">{apiError}</p>}
          {resendError && <p className="owner-auth-error">{resendError}</p>}
          {resendStatus && <p className="owner-auth-success">{resendStatus}</p>}

          <button className="owner-auth-submit" type="submit" disabled={loading}>
            {loading
              ? t('ownerForgot.submitting')
              : step === 'email'
                ? t('ownerForgot.submitEmail')
                : t('ownerForgot.submitCode')}
          </button>

          {step === 'code' && (
            <div className="owner-auth-footer-row">
              <p className="owner-auth-foot">
                {t('ownerForgot.backToLogin')}{' '}
                <Link to="/login" className="owner-auth-link">
                  {t('ownerRegister.goToLogin')}
                </Link>
              </p>
              <button
                className="owner-auth-resend"
                type="button"
                onClick={resendCode}
                disabled={resendLoading}
              >
                {resendLoading ? t('ownerForgot.resending') : t('ownerForgot.resend')}
              </button>
            </div>
          )}

          {step === 'email' && (
            <p className="owner-auth-foot">
              {t('ownerForgot.backToLogin')}{' '}
              <Link to="/login" className="owner-auth-link">
                {t('ownerRegister.goToLogin')}
              </Link>
            </p>
          )}
        </form>
      </section>
    </main>
  );
};
