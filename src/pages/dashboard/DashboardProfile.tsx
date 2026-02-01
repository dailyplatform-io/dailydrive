import { useEffect, useMemo, useState } from 'react';
import { useAuth, annualPriceEur, maxCarsForTier } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { authService } from '../../services/authService';
import { isValidInstagramHandle, normalizeInstagramHandle, slugifySellerName } from '../../utils/slug';
import { PasswordChanger } from './PasswordChanger';
import { SubscriptionManager } from './SubscriptionManager';
import { getOwnerBillingCount } from './dashboardUtils';
import { useDashboardCars } from './useDashboardCars';
import { features } from '../../config/features';
import '../owner/OwnerDashboard.css';

export const DashboardProfile: React.FC = () => {
  const { t } = useLanguage();
  const { user, setUserFromApi } = useAuth();
  const { myCarsAllStatuses } = useDashboardCars();
  const capitalize = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);
  const [sellerName, setSellerName] = useState('');
  const [instagramName, setInstagramName] = useState('');
  const [facebookName, setFacebookName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileTab, setProfileTab] = useState<'details' | 'security'>('details');
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const billingCount = useMemo(
    () => (user ? getOwnerBillingCount(user.profileType, myCarsAllStatuses) : 0),
    [user, myCarsAllStatuses]
  );

  const subscriptionPrice = useMemo(
    () => (user ? annualPriceEur(user.profileType, user.subscriptionTier) : 0),
    [user]
  );

  const maxAllowedCars = useMemo(() => (user ? maxCarsForTier(user.subscriptionTier) : 0), [user]);

  if (!user) return null;

  useEffect(() => {
    setSellerName(user.sellerName ?? '');
    setInstagramName(user.instagramName ?? '');
    setFacebookName(user.facebookName ?? '');
    setPhone(user.phone ?? '');
  }, [user.sellerName, user.instagramName, user.facebookName]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const response = await authService.getCurrentUser();
        if (!active || response.success === false) return;
        const updatedUser = {
          ...user,
          sellerName: response.sellerName ?? user.sellerName,
                  sellerSlug: response.sellerSlug ?? user.sellerSlug,
                  instagramName: response.instagramName ?? user.instagramName,
                  facebookName: response.facebookName ?? user.facebookName,
                  phone: response.phone ?? user.phone,
                };
        setUserFromApi(updatedUser);
      } catch (error) {
        console.warn('Failed to refresh profile fields', error);
      } finally {
        if (active) setLoadingProfile(false);
      }
    };
    void loadProfile();
    return () => {
      active = false;
    };
  }, [user?.id, setUserFromApi]);

  return (
    <section className={`owner-dashboard__panel ${savingProfile ? 'is-loading' : ''}`}>
      {savingProfile && (
        <div className="owner-panel__overlay" role="status" aria-live="polite">
          <div className="owner-panel__overlay-card">
            <span className="owner-panel__spinner" aria-hidden="true" />
            <p>{t('dashboard.profile.companySaving')}</p>
          </div>
        </div>
      )}
      <div className="owner-panel__head">
        <div>
          <p className="owner-panel__title">{t('dashboard.profile.title')}</p>
          <p className="muted">{t('dashboard.profile.subtitle')}</p>
        </div>
      </div>

      <div className="owner-profile-hero">
        <div>
          <p className="owner-profile-hero__kicker">{t('dashboard.profile.plan')}</p>
          <h3 className="owner-profile-hero__title">
            {user.name} {user.surname}
          </h3>
          <p className="owner-profile-hero__subtitle">
            {user.email} • {user.phone}
          </p>
        </div>
        <div className="owner-profile-hero__pills">
          <span className={`pill pill--mode ${user.profileType}`}>
            {user.profileType === 'rent' ? t('dashboard.profileType.rent') : t('dashboard.profileType.buy')}
          </span>
          {features.subscriptions && (
            <span className="pill pill--tier">{t('dashboard.profile.tierLabel', { tier: user.subscriptionTier })}</span>
          )}
        </div>
      </div>

      <div className="owner-profile-tabs">
        <button
          type="button"
          className={`owner-profile-tab ${profileTab === 'details' ? 'is-active' : ''}`}
          onClick={() => setProfileTab('details')}
        >
          {t('dashboard.profile.detailsTab')}
        </button>
        <button
          type="button"
          className={`owner-profile-tab ${profileTab === 'security' ? 'is-active' : ''}`}
          onClick={() => setProfileTab('security')}
        >
          {t('dashboard.profile.securityTab')}
        </button>
      </div>

      <div className="owner-profile-grid">
        {features.subscriptions && (
          <div className="owner-profile-card owner-profile-card--accent">
            <div className="owner-profile-card__head">
              <p className="owner-profile-card__title">{t('dashboard.profile.planDetails')}</p>
              <div className="owner-profile-card__meta">
                <span className="muted">{t('dashboard.subscription')}</span>
                <strong>{`${subscriptionPrice}€ / year`}</strong>
              </div>
            </div>
            <div className="owner-profile-kv">
              <span className="muted">{t('dashboard.profile.subscriptionTier')}</span>
                <strong>
                {user.subscriptionTier === 'free'
                  ? 'Free (2 cars)'
                  : user.subscriptionTier === 'basic5'
                    ? 'Basic 5'
                    : user.subscriptionTier === 'plus10'
                      ? 'Plus 10'
                      : user.subscriptionTier === 'standard20'
                        ? 'Standard 20'
                        : 'Pro 20+'}
                </strong>
              </div>
            <div className="owner-profile-kv">
              <span className="muted">{t('dashboard.profile.currentPlan')}</span>
              <strong>{user.subscriptionTier}</strong>
            </div>
            <div className="owner-profile-kv">
              <span className="muted">{t('dashboard.profile.renewal')}</span>
              <strong>{new Date(user.subscriptionEndsAt).toLocaleDateString()}</strong>
            </div>
            <div className="owner-profile-kv">
              <span className="muted">{t('dashboard.carsCount')}</span>
              <strong>
                {maxAllowedCars === Number.POSITIVE_INFINITY
                  ? t('dashboard.profile.carsUsedUnlimited', { used: billingCount })
                  : t('dashboard.profile.carsUsed', { used: billingCount, max: maxAllowedCars })}
              </strong>
            </div>
            <div className="owner-profile-progress" aria-hidden="true">
              <div
                className="owner-profile-progress__bar"
                style={{
                  width:
                    maxAllowedCars === Number.POSITIVE_INFINITY
                      ? '20%'
                      : `${Math.min(100, (billingCount / Math.max(1, maxAllowedCars)) * 100)}%`,
                }}
              />
            </div>
            {user.subscriptionPendingTier && (
              <div className="owner-profile-callout">
                <p className="muted">
                  {t('dashboard.profile.pendingChange', {
                    tier: user.subscriptionPendingTier,
                    date: user.subscriptionPendingStartsAt
                      ? new Date(user.subscriptionPendingStartsAt).toLocaleDateString()
                      : '',
                  })}
                </p>
              </div>
            )}
          </div>
        )}

        {profileTab === 'details' && (
          <>
            {features.subscriptions && (
              <div className="owner-profile-card">
                <p className="owner-profile-card__title">{t('dashboard.profile.subscriptionManage')}</p>
                <SubscriptionManager
                  billingCount={billingCount}
                  maxAllowed={maxAllowedCars}
                  annualPrice={subscriptionPrice}
                />
              </div>
            )}

            <div className="owner-profile-card">
              <p className="owner-profile-card__title">
                {user.isPrivateOwner ? t('dashboard.profile.phone') : t('dashboard.profile.company')}
              </p>
              <div className="owner-profile-form">
                {!user.isPrivateOwner && (
                  <label className="owner-field">
                    <span>{t('dashboard.profile.companyName')}</span>
                    <input
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      placeholder={t('dashboard.profile.companyName.placeholder')}
                      autoComplete="organization"
                    />
                  </label>
                )}
                {!user.isPrivateOwner && (
                  <div className="owner-form__grid">
                    <label className="owner-field">
                      <span>{t('dashboard.profile.instagram')}</span>
                      <input
                        value={instagramName}
                        onChange={(e) => setInstagramName(e.target.value)}
                        placeholder={capitalize(t('dashboard.profile.instagram.placeholder'))}
                        autoComplete="off"
                      />
                      <p style={{ marginTop: '4px', color: '#94a3b8', fontSize: '12px' }}>
                        Use letters, numbers, dots, underscores. Example: @juxhinxhihani3
                      </p>
                    </label>
                    <label className="owner-field">
                      <span>{t('dashboard.profile.facebook')}</span>
                      <input
                        value={facebookName}
                        onChange={(e) => setFacebookName(e.target.value)}
                        placeholder={capitalize(t('dashboard.profile.facebook.placeholder'))}
                        autoComplete="off"
                      />
                    </label>
                  </div>
                )}
                <label className="owner-field">
                  <span>{t('dashboard.profile.phone')}</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('dashboard.profile.phone.placeholder')}
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </label>
                {profileError && <p className="owner-field__error">{profileError}</p>}
                {profileSaved && <p className="owner-profile-success">{t('dashboard.profile.companySaved')}</p>}
                <button
              className="owner-mini"
              type="button"
              disabled={savingProfile || loadingProfile}
              onClick={async () => {
                setProfileError('');
                setProfileSaved(false);
                const trimmedSellerName = sellerName.trim() || user.sellerName || 'Private Cars';
                if (!user.isPrivateOwner && !trimmedSellerName) {
                  setProfileError(t('dashboard.profile.companyRequired'));
                  return;
                }
                if (!user.isPrivateOwner && instagramName.trim() && !isValidInstagramHandle(instagramName)) {
                  setProfileError(t('dashboard.profile.instagramInvalid'));
                  return;
                }
                const startedAt = Date.now();
                setSavingProfile(true);
                try {
                  const response = await authService.updateOwnerProfile({
                    sellerName: trimmedSellerName,
                    instagramName: user.isPrivateOwner ? undefined : normalizeInstagramHandle(instagramName) || undefined,
                    facebookName: user.isPrivateOwner ? undefined : facebookName.trim() || undefined,
                    phone: phone.trim() || undefined,
                      });
                      if (response.success === false) {
                        setProfileError(response.error || t('dashboard.profile.companySaveFailed'));
                        return;
                      }
                      const nextSlug =
                        response.sellerSlug ?? (trimmedSellerName ? slugifySellerName(trimmedSellerName) : undefined);
                      setUserFromApi({
                        ...user,
                        sellerName: trimmedSellerName,
                        sellerSlug: nextSlug,
                        instagramName: user.isPrivateOwner ? undefined : normalizeInstagramHandle(instagramName) || undefined,
                        facebookName: user.isPrivateOwner ? undefined : facebookName.trim() || undefined,
                        phone: phone.trim(),
                  });
                  setProfileSaved(true);
                } catch (error) {
                  setProfileError(error instanceof Error ? error.message : t('dashboard.profile.companySaveFailed'));
                } finally {
                  const elapsed = Date.now() - startedAt;
                  const remaining = Math.max(0, 1200 - elapsed);
                  await new Promise((resolve) => setTimeout(resolve, remaining));
                  setSavingProfile(false);
                }
              }}
            >
                  {savingProfile ? t('dashboard.profile.companySaving') : t('dashboard.profile.companySave')}
                </button>
              </div>
            </div>
          </>
        )}

        {profileTab === 'security' && (
          <div className="owner-profile-card owner-profile-card--wide">
            <p className="owner-profile-card__title">{t('dashboard.profile.security')}</p>
            <PasswordChanger onDone={() => {}} />
          </div>
        )}
      </div>
    </section>
  );
};

export default DashboardProfile;
