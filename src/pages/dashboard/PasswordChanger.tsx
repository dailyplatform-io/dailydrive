import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { PasswordValidator } from '../../utils/passwordValidator';

interface PasswordChangerProps {
  onDone: () => void;
}

export const PasswordChanger: React.FC<PasswordChangerProps> = ({ onDone }) => {
  const { t } = useLanguage();
  const { updatePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isValidPassword = (value: string) => PasswordValidator.validatePassword(value).isValid;

  return (
    <div className="owner-profile-form">
      <label className="owner-field">
        <span>{t('dashboard.profile.currentPassword')}</span>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </label>
      <div className="owner-form__grid">
        <label className="owner-field">
          <span>{t('dashboard.profile.newPassword')}</span>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
        </label>
        <label className="owner-field">
          <span>{t('dashboard.profile.confirmPassword')}</span>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
      </div>
      {error && <p className="owner-field__error">{error}</p>}
      {success && <p className="owner-profile-success">{t('dashboard.profile.passwordUpdated')}</p>}
      <button
        className="owner-mini"
        type="button"
        onClick={() => {
          setError('');
          setSuccess(false);
          if (!current || !next || !confirm) {
            setError(t('dashboard.form.required'));
            return;
          }
          if (!isValidPassword(current)) {
            setError(t('dashboard.profile.passwordRules'));
            return;
          }
          if (!isValidPassword(next)) {
            setError(t('dashboard.profile.passwordRules'));
            return;
          }
          if (next !== confirm) {
            setError(t('dashboard.profile.passwordMismatch'));
            return;
          }
          const res = updatePassword(current, next);
          if (!res.ok) {
            setError(t('dashboard.profile.passwordInvalid'));
            return;
          }
          setSuccess(true);
          setCurrent('');
          setNext('');
          setConfirm('');
          onDone();
        }}
      >
        {t('dashboard.profile.changePassword')}
      </button>
    </div>
  );
};
