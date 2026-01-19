import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth, maxCarsForTier } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Car } from '../../models/Car';
import {
  createCarInAPI,
  fetchOwnerCarsFromAPI,
  getOwnerCars,
  setOwnerCars as persistOwnerCars,
  updateCarInAPI,
} from '../../service/carService';
import { CarEditorModal } from './CarEditorModal';
import { emptyCarDraft, getOwnerBillingCount } from './dashboardUtils';
import { slugifySellerName } from '../../utils/slug';
import { features } from '../../config/features';
import '../OwnerDashboard.css';

type CarsSubtab = 'all' | 'active' | 'inactive' | 'deleted' | 'sold';

export const DashboardCars: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [carsSubtab, setCarsSubtab] = useState<CarsSubtab>('all');
  const [editing, setEditing] = useState<Car | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [ownerCars, setOwnerCars] = useState<Car[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [shareMessage, setShareMessage] = useState('');
  const [sharing, setSharing] = useState(false);

  const requireAuthToken = useCallback(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('Missing auth token');
    }
    return token;
  }, []);

  const replaceOwnerCarState = useCallback((car: Car) => {
    setOwnerCars((prev) => {
      const next = [car, ...prev.filter((c) => c.id !== car.id)];
      persistOwnerCars(next);
      return next;
    });
  }, []);

  const loadOwnerCars = useCallback(async () => {
    if (!user?.id) return;
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
      const carsFromApi = await fetchOwnerCarsFromAPI(user.id, token);
      setOwnerCars(carsFromApi);
      persistOwnerCars(carsFromApi);
    } catch (err) {
      console.error('Failed to fetch owner cars from API', err);
      const fallback = getOwnerCars().filter((c) => c.ownerId === user.id);
      setOwnerCars(fallback);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadOwnerCars();
  }, [loadOwnerCars, refreshKey]);

  useEffect(() => {
    if (!shareMessage) return;
    const timer = window.setTimeout(() => setShareMessage(''), 4000);
    return () => window.clearTimeout(timer);
  }, [shareMessage]);

  const myCarsAllStatuses = useMemo(() => {
    if (!user) return [];
    return ownerCars
      .filter((c) => c.ownerId === user.id)
      .sort((a, b) => {
        const aTime = Date.parse((a as unknown as { createdAt?: string }).createdAt ?? '') || 0;
        const bTime = Date.parse((b as unknown as { createdAt?: string }).createdAt ?? '') || 0;
        return bTime - aTime;
      });
  }, [user, ownerCars]);

  const myCarsForList = useMemo(() => {
    const list = myCarsAllStatuses;
    switch (carsSubtab) {
      case 'active':
        return list.filter((c) => (c.listingStatus ?? 'active') === 'active');
      case 'inactive':
        return list.filter((c) => c.listingStatus === 'inactive');
      case 'deleted':
        return list.filter((c) => c.listingStatus === 'deleted');
      case 'sold':
        return list.filter((c) => c.listingStatus === 'sold');
      default:
        return list.filter((c) => c.listingStatus !== 'deleted');
    }
  }, [myCarsAllStatuses, carsSubtab]);

  const counts = useMemo(() => {
    const list = myCarsAllStatuses;
    return {
      all: list.filter((c) => c.listingStatus !== 'deleted').length,
      active: list.filter((c) => (c.listingStatus ?? 'active') === 'active').length,
      inactive: list.filter((c) => c.listingStatus === 'inactive').length,
      deleted: list.filter((c) => c.listingStatus === 'deleted').length,
      sold: list.filter((c) => c.listingStatus === 'sold').length,
    };
  }, [myCarsAllStatuses]);

  const billingCount = useMemo(
    () => (user ? getOwnerBillingCount(user.profileType, myCarsAllStatuses) : 0),
    [user, myCarsAllStatuses]
  );

  const maxAllowedCars = useMemo(() => {
    if (!user) return 0;
    return maxCarsForTier(user.subscriptionTier);
  }, [user]);

  const addDisabled = features.subscriptions ? billingCount >= maxAllowedCars : false;

  if (!user) return null;

  const sellerName = user.sellerName?.trim();
  const sellerSlug = user.sellerSlug?.trim() || (sellerName ? slugifySellerName(sellerName) : '');
  const shareUrl = sellerSlug ? `${window.location.origin}/dealer/${encodeURIComponent(sellerSlug)}` : '';

  const onToggleActive = async (car: Car) => {
    if (car.listingStatus === 'sold') return;
    if (features.subscriptions && car.listingStatus === 'inactive' && billingCount >= maxAllowedCars) {
      alert(t('dashboard.cars.limitReached'));
      return;
    }
    const nextStatus = car.listingStatus === 'inactive' ? 'active' : 'inactive';
    try {
      const token = requireAuthToken();
      const updated = await updateCarInAPI({ ...car, listingStatus: nextStatus }, token);
      replaceOwnerCarState(updated);
    } catch (err) {
      console.error('Failed to update car status', err);
      alert('Failed to update car status. Please try again.');
    }
  };

  const onMarkSold = async (car: Car) => {
    try {
      const token = requireAuthToken();
      const updated = await updateCarInAPI({ ...car, listingStatus: 'sold' }, token);
      replaceOwnerCarState(updated);
    } catch (err) {
      console.error('Failed to mark car sold', err);
      alert('Failed to mark as sold. Please try again.');
    }
  };

  const onUnmarkSold = async (car: Car) => {
    try {
      const token = requireAuthToken();
      const updated = await updateCarInAPI({ ...car, listingStatus: 'active' }, token);
      replaceOwnerCarState(updated);
    } catch (err) {
      console.error('Failed to unmark sold', err);
      alert('Failed to update car. Please try again.');
    }
  };

  const onDelete = async (car: Car) => {
    try {
      const token = requireAuthToken();
      const updated = await updateCarInAPI({ ...car, listingStatus: 'deleted' }, token);
      replaceOwnerCarState(updated);
    } catch (err) {
      console.error('Failed to delete car', err);
      alert('Failed to delete car. Please try again.');
    }
  };

  return (
    <>
      <section className="owner-dashboard__panel">
        <div className="owner-panel__head">
          <div>
            <p className="owner-panel__title">{t('dashboard.cars.title')}</p>
            <p className="muted">{t('dashboard.cars.subtitle')}</p>
          </div>
          <div className="owner-panel__actions">
            <button
              className="owner-mini"
              type="button"
              disabled={sharing}
              title={!sellerSlug ? t('dashboard.share.missingSeller') : undefined}
              onClick={async () => {
                if (!sellerSlug) {
                  setShareMessage(t('dashboard.share.missingSeller'));
                  return;
                }
                setSharing(true);
                try {
                  if (navigator.share) {
                    await navigator.share({ title: sellerName, url: shareUrl });
                    setShareMessage(t('dashboard.share.shared'));
                    return;
                  }
                  if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(shareUrl);
                    setShareMessage(t('dashboard.share.copied'));
                    return;
                  }
                  setShareMessage(t('dashboard.share.failed'));
                } catch (error) {
                  console.error('Share failed', error);
                  setShareMessage(t('dashboard.share.failed'));
                } finally {
                  setSharing(false);
                }
              }}
            >
              {t('dashboard.share.button')}
            </button>
            <button
              className="owner-primary"
              type="button"
              disabled={addDisabled}
              title={addDisabled ? t('dashboard.cars.limitReached') : undefined}
              onClick={() => {
                if (addDisabled) return;
                setEditing(emptyCarDraft(user.profileType, user.id, { city: user.location.city, address: user.location.address }));
                setOpenForm(true);
              }}
            >
              {t('dashboard.cars.add')}
            </button>
          </div>
        </div>
        {shareMessage && <p className="muted owner-share-message">{shareMessage}</p>}

        <div className="owner-subtabs">
          <button
            type="button"
            className={`owner-subtab ${carsSubtab === 'all' ? 'is-active' : ''}`}
            onClick={() => setCarsSubtab('all')}
          >
            {t('dashboard.cars.subtabs.all')} <span className="owner-subtab__count">{counts.all}</span>
          </button>
          <button
            type="button"
            className={`owner-subtab ${carsSubtab === 'active' ? 'is-active' : ''}`}
            onClick={() => setCarsSubtab('active')}
          >
            {t('dashboard.cars.subtabs.active')} <span className="owner-subtab__count">{counts.active}</span>
          </button>
          <button
            type="button"
            className={`owner-subtab ${carsSubtab === 'inactive' ? 'is-active' : ''}`}
            onClick={() => setCarsSubtab('inactive')}
          >
            {t('dashboard.cars.subtabs.inactive')} <span className="owner-subtab__count">{counts.inactive}</span>
          </button>
          <button
            type="button"
            className={`owner-subtab ${carsSubtab === 'deleted' ? 'is-active' : ''}`}
            onClick={() => setCarsSubtab('deleted')}
          >
            {t('dashboard.cars.subtabs.deleted')} <span className="owner-subtab__count">{counts.deleted}</span>
          </button>
          <button
            type="button"
            className={`owner-subtab ${carsSubtab === 'sold' ? 'is-active' : ''}`}
            onClick={() => setCarsSubtab('sold')}
          >
            {t('dashboard.cars.subtabs.sold')} <span className="owner-subtab__count">{counts.sold}</span>
          </button>
        </div>

        <div className="owner-cars-grid">
          {myCarsForList.map((car) => (
            <article key={car.id} className="owner-car-card">
              <div className="owner-car-card__main">
                <div className="owner-car-card__img">
                  {car.imageUrl ? (
                    <img 
                      src={car.imageUrl} 
                      alt={`${car.brand} ${car.model}`} 
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src.includes('/noimage.png')) {
                          // Already showing fallback, hide image and show placeholder
                          target.style.display = 'none';
                          const placeholder = document.createElement('div');
                          placeholder.className = 'owner-car-card__placeholder';
                          target.parentElement!.appendChild(placeholder);
                          return;
                        }
                        target.src = '/noimage.png';
                      }}
                    />
                  ) : (
                    <div className="owner-car-card__placeholder" />
                  )}
                </div>
                <div className="owner-car-card__body">
                  <div className="owner-car-card__row">
                    <p className="owner-car-card__title">
                      {car.brand || t('dashboard.car.untitled')} {car.model} <span className="muted">{car.year}</span>
                    </p>
                    <span className={`status-pill status-${car.listingStatus ?? 'active'}`}>{car.listingStatus ?? 'active'}</span>
                  </div>
                  <p className="muted">
                    {car.isForRent ? t('dashboard.car.type.rent') : t('dashboard.car.type.buy')} • {car.bodyStyle} • {car.fuelType}
                  </p>
                  <p className="owner-car-card__price">
                    {car.isForRent ? `${car.rentPricePerDay ?? '—'}€ / day` : `${car.salePrice ?? '—'}€`}
                  </p>
                </div>
              </div>

              <div className="owner-car-card__actions">
                {car.listingStatus === 'deleted' ? (
                  <span className="muted">{t('dashboard.cars.deletedHint')}</span>
                ) : (
                  <>
                    {car.listingStatus !== 'sold' && (
                      <button className="owner-mini" type="button" onClick={() => onToggleActive(car)}>
                        {car.listingStatus === 'inactive' ? t('dashboard.actions.activate') : t('dashboard.actions.deactivate')}
                      </button>
                    )}
                    {user.profileType === 'buy' && car.listingStatus !== 'sold' && (
                      <button className="owner-mini" type="button" onClick={() => onMarkSold(car)}>
                        {t('dashboard.actions.markSold')}
                      </button>
                    )}
                    {user.profileType === 'buy' && car.listingStatus === 'sold' && (
                      <button className="owner-mini" type="button" onClick={() => onUnmarkSold(car)}>
                        {t('dashboard.actions.unmarkSold')}
                      </button>
                    )}
                    <button
                      className="owner-mini"
                      type="button"
                      onClick={() => {
                        setEditing(car);
                        setOpenForm(true);
                      }}
                    >
                      {t('dashboard.actions.edit')}
                    </button>
                    <button className="owner-mini owner-mini--danger" type="button" onClick={() => onDelete(car)}>
                      {t('dashboard.actions.delete')}
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>

        {!myCarsForList.length && <p className="muted owner-empty">{t('dashboard.cars.empty')}</p>}
      </section>

      {openForm && editing && (
        <CarEditorModal
          profileType={user.profileType}
          ownerAddress={user.location}
          billingCount={billingCount}
          maxAllowedCars={maxAllowedCars}
          initial={editing}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
          onSave={async (next: Car) => {
            const token = requireAuthToken();
            const payload = { ...next, ownerId: next.ownerId ?? user.id };
            const exists = myCarsAllStatuses.some((c) => c.id === next.id);
            const saved = exists ? await updateCarInAPI(payload, token) : await createCarInAPI(payload, token);
            replaceOwnerCarState(saved);
            setRefreshKey((k) => k + 1);
            setOpenForm(false);
            setEditing(null);
          }}
        />
      )}
    </>
  );
};

export default DashboardCars;
