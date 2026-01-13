import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth, SubscriptionTier, annualPriceEur, maxCarsForTier } from '../../context/AuthContext';

interface SubscriptionManagerProps {
  billingCount: number;
  maxAllowed: number;
  annualPrice: number;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  billingCount,
  annualPrice,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, upgradeSubscriptionTier, scheduleDowngradeTier, cancelScheduledTierChange } = useAuth();
  const [targetTier, setTargetTier] = useState<SubscriptionTier>(user?.subscriptionTier ?? 'free');
  const [message, setMessage] = useState<string>('');

  if (!user) return null;

  const tierOrder: SubscriptionTier[] = ['free', 'basic5', 'plus10', 'standard20', 'pro20plus'];
  const formatTier = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free':
        return 'Free (3 cars)';
      case 'basic5':
        return 'Basic 5';
      case 'plus10':
        return 'Plus 10';
      case 'standard20':
        return 'Standard 20';
      case 'pro20plus':
        return 'Pro 20+';
      default:
        return tier;
    }
  };
  const currentIndex = tierOrder.indexOf(user.subscriptionTier);
  const targetIndex = tierOrder.indexOf(targetTier);
  const isUpgrade = targetIndex > currentIndex;
  const isDowngrade = targetIndex < currentIndex;

  const maxForTarget = maxCarsForTier(targetTier);
  const canDowngrade = billingCount <= maxForTarget;
  const targetAnnual = annualPriceEur(user.profileType, targetTier);
  const paid = user.subscriptionPaidEur ?? annualPrice;
  const duePreview = Math.max(0, targetAnnual - targetAnnual * 0.15 - paid);
  const renewalLabel = (() => {
    const ends = new Date(user.subscriptionEndsAt);
    if (Number.isNaN(ends.valueOf())) return '—';
    return ends.toLocaleDateString();
  })();

  return (
    <div className="owner-profile-form">
      <div className="owner-subscription-top">
        <label className="owner-field">
          <span className="sr-only">{t('dashboard.profile.subscriptionTier')}</span>
          <select value={targetTier} onChange={(e) => setTargetTier(e.target.value as SubscriptionTier)}>
            {tierOrder.map((tier) => (
              <option key={tier} value={tier}>
                {formatTier(tier)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="owner-subscription-summary">
        <div className="owner-profile-kvBlock">
          <span className="muted">{t('dashboard.profile.currentPlan')}</span>
          <strong>{user.subscriptionTier}</strong>
        </div>
        <div className="owner-profile-kvBlock">
          <span className="muted">{t('dashboard.profile.selectedPlan')}</span>
          <strong>
            {formatTier(targetTier)}
          </strong>
        </div>
        <div className="owner-profile-kvBlock">
          <span className="muted">{t('dashboard.profile.renewal')}</span>
          <strong>{renewalLabel}</strong>
        </div>
      </div>

      {user.subscriptionPendingTier && (
        <div className="owner-profile-callout owner-profile-callout--warning">
          <div>
            <p className="muted">
              {t('dashboard.profile.pendingChange', {
                tier: user.subscriptionPendingTier,
                date: user.subscriptionPendingStartsAt ? new Date(user.subscriptionPendingStartsAt).toLocaleDateString() : '',
              })}
            </p>
          </div>
          <button
            className="owner-mini"
            type="button"
            onClick={() => {
              cancelScheduledTierChange();
              setMessage(t('dashboard.profile.pendingCanceled'));
            }}
          >
            {t('dashboard.profile.cancelPending')}
          </button>
        </div>
      )}

      {message && <p className="muted">{message}</p>}

      <div className="owner-subscription-actions">
        {isUpgrade && (
          <button
            className="owner-primary"
            type="button"
            onClick={() => {
              // If upgrading from free tier, navigate to payment page
              if (user.subscriptionTier === 'free') {
                navigate('/payment', {
                  state: {
                    userId: user.id,
                    email: user.email,
                    firstName: user.name,
                    lastName: user.surname,
                    subscriptionTier: targetTier,
                    subscriptionPriceEur: annualPriceEur(user.profileType, targetTier),
                    isUpgrade: true,
                    originalTier: user.subscriptionTier,
                  }
                });
                return;
              }
              
              const confirmed = window.confirm(t('dashboard.profile.confirmUpgrade', { price: duePreview.toFixed(2) }));
              if (!confirmed) return;
              const res = upgradeSubscriptionTier(targetTier);
              if (!res.ok) return;
              setMessage(t('dashboard.profile.upgradePaid', { price: res.dueNowEur.toFixed(2) }));
            }}
          >
            {t('dashboard.profile.upgradeNow')}
          </button>
        )}

        {isDowngrade && (
          <button
            className="owner-mini"
            type="button"
            disabled={!canDowngrade}
            title={!canDowngrade ? t('dashboard.profile.downgradeBlocked') : undefined}
            onClick={() => {
              const res = scheduleDowngradeTier(targetTier);
              if (!res.ok) {
                if (res.error === 'too_many_cars') setMessage(t('dashboard.profile.downgradeBlocked'));
                return;
              }
              setMessage(t('dashboard.profile.downgradeScheduled', { date: new Date(res.startsAt).toLocaleDateString() }));
            }}
          >
            {t('dashboard.profile.scheduleDowngrade')}
          </button>
        )}

        {!isUpgrade && !isDowngrade && null}
      </div>
    </div>
  );
};
