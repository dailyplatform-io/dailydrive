import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  SubscriptionTier,
  annualPriceEur,
  maxCarsForTier,
  OwnerProfileType,
  useAuth,
} from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTrialManagement } from '../hooks/useTrialManagement';
import { TrialStatusBanner, SubscriptionStatus } from '../components/TrialStatus';
import { Car, BodyStyle, FuelType, Transmission } from '../models/Car';
import { CarMake, CarModel } from '../models/CarMakeModel';
import { fetchCarMakes, fetchCarModelsByMake } from '../service/carMakeModelService';
import { PasswordValidator } from '../utils/passwordValidator';
import { TokenErrorTypes, detectTokenExpirationFromResponse } from '../utils/tokenUtils';
import {
  createCarInAPI,
  fetchOwnerCarsFromAPI,
  getAllCars,
  getOwnerCars,
  setOwnerCars as persistOwnerCars,
  updateCarInAPI,
} from '../service/carService';
import { AddressPicker } from '../components/AddressPicker';
import { ImagesField } from './dashboard/ImagesField';
import {
  blobToObjectUrl,
  createImageThumbnailDataUrl,
  dataUrlToBlob,
  deleteImageBlob,
  getImageBlob,
  putImageBlob,
  revokeObjectUrl,
} from '../service/imageStore';
import { ReservationsCalendar } from '../components/ReservationsCalendar';
import './OwnerDashboard.css';

type DashboardTab = 'cars' | 'reservations' | 'profile' | 'logout';
type CarsSubtab = 'all' | 'active' | 'inactive' | 'deleted' | 'sold';

const bodyStyleOptions: BodyStyle[] = ['Hatchback', 'SUV', 'Sedan', 'Sport coupe'];
const fuelTypeOptions: FuelType[] = ['Gasoline', 'Diesel', 'Hybrid', 'Electric'];
const transmissionOptions: Transmission[] = ['Manual', 'Automatic', 'CVT'];

const defaultOptionGroups: { title: string; items: string[] }[] = [
  {
    title: 'Opsionet',
    items: [
      'Distronic Plus',
      'Ruajtja e Korsise',
      'Vetparkim',
      'Tavan Panoramik',
      'Ndezje me Buton',
      'Fenere Xenon',
      'Pasqyra me Ngrohje',
      'Pasqyra Elektrike',
      'Sedilje me Masazh',
      'Ngrohje & Ftohje Sediljesh',
      'Kroskot Dixhital',
      'TV Mbrapa',
      'Tavan Kamosh',
      'Bagazh me Buton',
      'Ndricim Ambienti',
      'Fenere Full LED',
      'Xhama te Zi',
      'Sensor Shiu',
      'Sensor Dritash',
      'Komanda ne Timon',
      'Distance Display',
      'Trekendesh ne pasqyre',
      'Navigator',
      'Sensor Parkimi',
      'Goma te Reja',
      'Cruise Control',
      'Eco Mode',
    ],
  },
];

const selectOptionGroups: { title: string; options: string[] }[] = [
  {
    title: 'Klima',
    options: ['2 zona', '4 zona'],
  },
  {
    title: 'Sallon',
    options: ['Sallon Lekure', 'Sallon Robe', 'Sallon Kamosh'],
  },
  {
    title: 'Traksioni',
    options: ['Traksioni 4x4 (4 matic)', 'Diferencial mbrapa (RWD)', 'Diferencial para'],
  },
  {
    title: 'Sedilje me ngrohje',
    options: ['Jo', 'Para', 'Mbrapa', 'Para dhe Mbrapa'],
  },
  {
    title: 'Leje/Targa',
    options: ['Me letra/Targa', 'Me targa', 'Me dogane', 'Pa dogane'],
  },
];

function emptyCarDraft(profileType: OwnerProfileType, ownerId: string, ownerAddress: { city: string; address: string }): Car {
  const isForRent = profileType === 'rent';
  const isForSale = profileType === 'buy';
  return {
    id: crypto.randomUUID(),
    ownerId,
    listingStatus: 'active',
    imageIds: [],
    coverImageId: undefined,
    brand: '',
    model: '',
    subtitle: '',
    year: new Date().getFullYear(),
    bodyStyle: 'Sedan',
    fuelType: 'Gasoline',
    transmission: 'Automatic',
    enginePowerHp: 120,
    engineVolumeL: 2.0,
    seats: 5,
    doors: 4,
    color: 'Black',
    exteriorColor: 'Black',
    interiorColor: 'Black',
    mileageKm: 0,
    isForRent,
    isForSale,
    rentPricePerDay: isForRent ? 50 : undefined,
    salePrice: isForSale ? 10000 : undefined,
    accidentsCount: 0,
    ownersCount: 1,
    serviceHistory: '',
    description: '',
    optionsGroups: [...defaultOptionGroups, ...selectOptionGroups.map((g) => ({ title: g.title, items: [] }))],
    fees: 0,
    taxes: 0,
    rating: 4.8,
    reviewsCount: 0,
    distanceMeters: 0,
    distanceText: '—',
    availableNow: true,
    imageUrl: '',
    location: {
      city: ownerAddress.city,
      fullAddress: ownerAddress.address,
      mapLabel: 'Owner location',
      lat: undefined,
      lng: undefined,
    },
  };
}

function getOwnerBillingCount(profileType: OwnerProfileType, cars: Car[]) {
  const active = cars.filter((c) => c.listingStatus !== 'deleted');
  if (profileType === 'rent') return active.length;
  return active.filter((c) => c.isForSale && c.listingStatus === 'active').length;
}

export const OwnerDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [carsSubtab, setCarsSubtab] = useState<CarsSubtab>('all');
  const [editing, setEditing] = useState<Car | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [ownerCars, setOwnerCars] = useState<Car[]>([]);
  const [loadingCars, setLoadingCars] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  const { 
    trial, 
    subscription, 
    isLoading: trialLoading, 
    navigateToPayment 
  } = useTrialManagement();

  // Trial management is now handled by the useTrialManagement hook

  // Check for messages from navigation state (e.g., from payment page)
  useEffect(() => {
    const navState = location.state as { message?: string } | null;
    if (navState?.message) {
      setSuccessMessage(navState.message);
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
      // Auto-clear message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [location.state]);

  const requireAuthToken = useCallback(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      navigate('/login', { replace: true });
      throw new Error('Missing auth token');
    }
    return token;
  }, [navigate]);

  const handleApiError = useCallback((error: any, context: string = 'API call') => {
    console.error(`${context} failed:`, error);
    
    if (error instanceof Error) {
      // Use the token utility to check for expiration
      const isExpired = error.message === TokenErrorTypes.EXPIRED_TOKEN ||
                       error.message === TokenErrorTypes.AUTHENTICATION_REQUIRED ||
                       detectTokenExpirationFromResponse(error.message);
      
      if (isExpired) {
        console.log('Authentication token expired, redirecting to login');
        navigate('/login', { 
          replace: true,
          state: { message: 'Your session has expired. Please log in again.' }
        });
        return;
      }
    }
    
    // Default error handling
    alert(`${context} failed. Please try again.`);
  }, [navigate]);

  const replaceOwnerCarState = useCallback((car: Car) => {
    setOwnerCars((prev) => {
      const next = [car, ...prev.filter((c) => c.id !== car.id)];
      persistOwnerCars(next);
      return next;
    });
  }, []);

  const removeOwnerCarState = useCallback((id: string) => {
    setOwnerCars((prev) => {
      const next = prev.filter((c) => c.id !== id);
      persistOwnerCars(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const current = getOwnerCars();
    const legacyForOwner = current.filter((car) => {
      if (car.ownerId !== user.id) return false;
      const unsafe = car as unknown as { imageUrls?: unknown; coverImageUrl?: unknown };
      const legacyUrls = Array.isArray(unsafe.imageUrls) ? (unsafe.imageUrls as unknown[]) : [];
      return !car.imageIds?.length && legacyUrls.length > 0;
    });
    if (!legacyForOwner.length) return;

    void (async () => {
      const updated = await Promise.all(
        current.map(async (car) => {
          if (car.ownerId !== user.id) return car;
          if (car.imageIds?.length) return car;

          const unsafe = car as unknown as { imageUrls?: string[]; coverImageUrl?: string };
          const legacyUrls = Array.isArray(unsafe.imageUrls) ? unsafe.imageUrls : [];
          if (!legacyUrls.length) return car;
          const coverUrl = unsafe.coverImageUrl || legacyUrls[0];
          const coverIndex = Math.max(0, legacyUrls.indexOf(coverUrl));

          const ids: string[] = [];
          for (const url of legacyUrls) {
            ids.push(await putImageBlob(dataUrlToBlob(url)));
          }
          const coverId = ids[coverIndex] || ids[0];
          const coverBlob = dataUrlToBlob(legacyUrls[coverIndex] || legacyUrls[0]);
          const thumbnail = await createImageThumbnailDataUrl(coverBlob);

          return {
            ...car,
            imageIds: ids,
            coverImageId: coverId,
            imageUrl: thumbnail || car.imageUrl || '',
          } as Car;
        })
      );

      if (cancelled) return;
      setOwnerCars(updated);
      setRefreshKey((k) => k + 1);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const loadOwnerCars = useCallback(async () => {
    if (!user?.id) return;
    setLoadingCars(true);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
      const carsFromApi = await fetchOwnerCarsFromAPI(user.id, token);
      setOwnerCars(carsFromApi);
      persistOwnerCars(carsFromApi);
    } catch (err) {
      console.error('Failed to fetch owner cars from API', err);
      
      // Check for auth errors
      if (err instanceof Error && (
        err.message.includes('401') || 
        err.message.includes('Unauthorized') || 
        err.message.includes('expired')
      )) {
        handleApiError(err, 'Load owner cars');
        return;
      }
      
      // For other errors, use fallback data
      const fallback = getOwnerCars().filter((c) => c.ownerId === user.id);
      setOwnerCars(fallback);
    } finally {
      setLoadingCars(false);
    }
  }, [user?.id, handleApiError]);

  useEffect(() => {
    void loadOwnerCars();
  }, [loadOwnerCars, refreshKey]);

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
  const subscriptionPrice = useMemo(
    () => (user ? annualPriceEur(user.profileType, user.subscriptionTier) : 0),
    [user]
  );
  const maxAllowedCars = useMemo(() => (user ? maxCarsForTier(user.subscriptionTier) : 0), [user]);
  const addDisabled = billingCount >= maxAllowedCars;

  if (!user) return null;

  const showReservations = user.profileType === 'rent';
  const tabParam = (searchParams.get('tab') ?? 'cars') as DashboardTab | 'reservations';
  const activeTab: DashboardTab | 'reservations' =
    tabParam === 'cars' || tabParam === 'profile' || tabParam === 'logout'
      ? tabParam
      : tabParam === 'reservations' && showReservations
        ? 'reservations'
        : 'cars';

  const setActiveTab = (next: DashboardTab | 'reservations') => {
    setSearchParams({ tab: next });
  };

  useEffect(() => {
    if (activeTab !== 'logout') return;
    logout();
    navigate('/login', { replace: true });
  }, [activeTab, logout, navigate]);

  const onToggleActive = async (car: Car) => {
    if (car.listingStatus === 'sold') return;
    if (car.listingStatus === 'inactive' && billingCount >= maxAllowedCars) {
      alert(t('dashboard.cars.limitReached'));
      return;
    }
    const nextStatus = car.listingStatus === 'inactive' ? 'active' : 'inactive';
    try {
      const token = requireAuthToken();
      const updated = await updateCarInAPI({ ...car, listingStatus: nextStatus }, token);
      replaceOwnerCarState(updated);
    } catch (err) {
      handleApiError(err, 'Update car status');
    }
  };

  const onMarkSold = async (car: Car) => {
    try {
      const token = requireAuthToken();
      const updated = await updateCarInAPI({ ...car, listingStatus: 'sold' }, token);
      replaceOwnerCarState(updated);
    } catch (err) {
      handleApiError(err, 'Mark car as sold');
    }
  };

  const onUnmarkSold = async (car: Car) => {
    try {
      const token = requireAuthToken();
      const updated = await updateCarInAPI({ ...car, listingStatus: 'active' }, token);
      replaceOwnerCarState(updated);
    } catch (err) {
      handleApiError(err, 'Update car status');
    }
  };

  const onDelete = async (car: Car) => {
    try {
      const token = requireAuthToken();
      const updated = await updateCarInAPI({ ...car, listingStatus: 'deleted' }, token);
      replaceOwnerCarState(updated);
    } catch (err) {
      handleApiError(err, 'Delete car');
    }
  };

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <main className="owner-dashboard">
      <header className="owner-dashboard__top">
        <div>
          <h2 className="owner-dashboard__title">{t('dashboard.title')}</h2>
          <p className="owner-dashboard__subtitle">
            {t('dashboard.welcome', { name: `${user.name} ${user.surname}` })}
          </p>
        </div>
      </header>
      
      {successMessage && (
        <div className="owner-auth-success" style={{ marginBottom: '20px' }}>
          {successMessage}
        </div>
      )}
      
      {subscription.hasActiveSubscription && (
        <SubscriptionStatus
          subscriptionTier={subscription.subscriptionTier}
          paymentMethod={subscription.paymentMethod}
        />
      )}
      
      {trial.isInTrial && trial.daysLeft > 0 && (
        <TrialStatusBanner
          daysLeft={trial.daysLeft}
          onUpgradeClick={() => navigateToPayment(false)}
        />
      )}
      
      {activeTab === 'cars' && (
        <section className="owner-dashboard__panel">
          <div className="owner-panel__head">
            <div>
              <p className="owner-panel__title">{t('dashboard.cars.title')}</p>
              <p className="muted">{t('dashboard.cars.subtitle')}</p>
            </div>
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
                            // Already tried fallback, hide image and show placeholder
                            target.style.display = 'none';
                            const placeholder = document.createElement('div');
                            placeholder.className = 'owner-car-card__placeholder';
                            target.parentElement!.appendChild(placeholder);
                            return;
                          }
                          target.src = '/noimage.png';
                        }}
                      />
                    ) : <div className="owner-car-card__placeholder" />}
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
      )}

      {activeTab === 'reservations' && (
        <section className="owner-dashboard__panel">
          <div className="owner-panel__head">
            <div>
              <p className="owner-panel__title">{t('dashboard.reservations.title')}</p>
              <p className="muted">{t('dashboard.reservations.subtitle')}</p>
            </div>
          </div>
          <p className="muted owner-empty">{t('dashboard.reservations.empty')}</p>
        </section>
      )}

      {activeTab === 'profile' && (
        <section className="owner-dashboard__panel">
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
              <span className="pill pill--tier">{t('dashboard.profile.tierLabel', { tier: user.subscriptionTier })}</span>
            </div>
          </div>

          <div className="owner-profile-grid">
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

            <div className="owner-profile-card">
              <p className="owner-profile-card__title">{t('dashboard.profile.subscriptionManage')}</p>
              <SubscriptionManager
                billingCount={billingCount}
                maxAllowed={maxAllowedCars}
                annualPrice={subscriptionPrice}
              />
            </div>

            <div className="owner-profile-card owner-profile-card--wide">
              <p className="owner-profile-card__title">{t('dashboard.profile.security')}</p>
              <PasswordChanger onDone={() => setActiveTab('profile')} />
            </div>
          </div>
        </section>
      )}

      {activeTab === 'reservations' && user.profileType === 'rent' && (
        <section className="owner-dashboard__panel">
          <div className="owner-panel__head">
            <div>
              <p className="owner-panel__title">{t('dashboard.reservations.title')}</p>
              <p className="muted">{t('dashboard.reservations.subtitle')}</p>
            </div>
          </div>
          <ReservationsCalendar ownerId={user.id} />
        </section>
      )}

      {activeTab === 'logout' && (
        <section className="owner-dashboard__panel">
          <div className="owner-panel__head">
            <div>
              <p className="owner-panel__title">{t('dashboard.logout.title')}</p>
              <p className="muted">{t('dashboard.logout.subtitle')}</p>
            </div>
            <button className="owner-primary owner-primary--danger" type="button" onClick={onLogout}>
              {t('dashboard.logout.submit')}
            </button>
          </div>
        </section>
      )}

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
          onSave={async (next) => {
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
    </main>
  );
};

function CarEditorModal({
  initial,
  onClose,
  onSave,
  profileType,
  ownerAddress,
  billingCount,
  maxAllowedCars,
}: {
  initial: Car;
  onClose: () => void;
  onSave: (car: Car) => Promise<void>;
  profileType: OwnerProfileType;
  ownerAddress: { address: string; city: string; lat: number; lng: number };
  billingCount: number;
  maxAllowedCars: number;
}) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<Car>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [useCustomAddress, setUseCustomAddress] = useState(() => {
    return (
      initial.location.fullAddress.trim() !== ownerAddress.address.trim() ||
      initial.location.city.trim() !== ownerAddress.city.trim()
    );
  });

  // Car makes and models from API
  const [carMakes, setCarMakes] = useState<CarMake[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [makesError, setMakesError] = useState<string>('');
  const [modelsError, setModelsError] = useState<string>('');

  // Load car makes on component mount
  useEffect(() => {
    const loadMakes = async () => {
      setLoadingMakes(true);
      setMakesError('');
      try {
        const makes = await fetchCarMakes();
        setCarMakes(makes);
      } catch (error) {
        console.error('Failed to load car makes:', error);
        setMakesError('Failed to load car makes');
      } finally {
        setLoadingMakes(false);
      }
    };
    void loadMakes();
  }, []);

  // Load car models when selected make changes
  useEffect(() => {
    if (!draft.carMakeId) {
      setCarModels([]);
      return;
    }

    const loadModels = async () => {
      setLoadingModels(true);
      setModelsError('');
      try {
        const models = await fetchCarModelsByMake(draft.carMakeId!);
        setCarModels(models);
      } catch (error) {
        console.error('Failed to load car models:', error);
        setModelsError('Failed to load car models');
      } finally {
        setLoadingModels(false);
      }
    };
    void loadModels();
  }, [draft.carMakeId]);

  useEffect(() => {
    if (useCustomAddress) return;
    setDraft((current) => {
      const nextAddress = ownerAddress.address?.trim() || current.location.fullAddress;
      const nextCity = ownerAddress.city?.trim() || current.location.city;
      return {
        ...current,
        location: {
          ...current.location,
          fullAddress: nextAddress,
          city: nextCity,
          mapLabel: 'Owner location',
          lat: ownerAddress.lat ?? current.location.lat,
          lng: ownerAddress.lng ?? current.location.lng,
        },
      };
    });
  }, [useCustomAddress, ownerAddress.address, ownerAddress.city, ownerAddress.lat, ownerAddress.lng]);

  const yearOptions = useMemo(() => {
    const max = new Date().getFullYear() + 1;
    const min = 1990;
    const years: number[] = [];
    for (let y = max; y >= min; y -= 1) years.push(y);
    return years;
  }, []);

  const colorOptions = useMemo(
    () => [
      'Black',
      'White',
      'Gray',
      'Silver',
      'Blue',
      'Red',
      'Green',
      'Brown',
      'Beige',
      'Yellow',
      'Orange',
    ],
    []
  );
  const accidentsOptions = useMemo(() => ['0', '1', '2', '3', '4', '5+'], []);
  const ownersOptions = useMemo(() => ['1', '2', '3', '4', '5+'], []);

  const setField = <K extends keyof Car>(key: K, value: Car[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const optionGroups = draft.optionsGroups ?? [];

  const validateDraft = (nextDraft: Car) => {
    const next: Record<string, string> = {};

    const requiredText = (value: string | undefined, key: string) => {
      if (!value?.trim()) next[key] = t('dashboard.form.required');
    };
    const requiredNumber = (value: number | undefined, key: string, { min }: { min: number }) => {
      if (typeof value !== 'number' || Number.isNaN(value) || value < min) next[key] = t('dashboard.form.required');
    };

    requiredText(nextDraft.brand, 'brand');
    requiredText(nextDraft.model, 'model');
    if (!nextDraft.carMakeId) next.brand = t('dashboard.form.required');
    if (!nextDraft.carModelId) next.model = t('dashboard.form.required');

    if (!nextDraft.bodyStyle) next.bodyStyle = t('dashboard.form.required');
    if (!nextDraft.fuelType) next.fuelType = t('dashboard.form.required');
    if (!nextDraft.transmission) next.transmission = t('dashboard.form.required');

    requiredNumber(nextDraft.year, 'year', { min: 1990 });
    requiredNumber(nextDraft.enginePowerHp, 'enginePowerHp', { min: 1 });
    requiredNumber(nextDraft.engineVolumeL, 'engineVolumeL', { min: 0 });
    requiredNumber(nextDraft.seats, 'seats', { min: 1 });
    requiredNumber(nextDraft.doors, 'doors', { min: 2 });
    requiredNumber(nextDraft.mileageKm, 'mileageKm', { min: 0 });

    requiredText(nextDraft.exteriorColor, 'exteriorColor');
    requiredText(nextDraft.interiorColor, 'interiorColor');

    requiredNumber(nextDraft.accidentsCount ?? 0, 'accidentsCount', { min: 0 });
    requiredNumber(nextDraft.ownersCount ?? 0, 'ownersCount', { min: 0 });

    // Optional fields:
    // - serviceHistory
    // - description
    // - fees (yearly insurance)
    // - taxes (yearly taxes)

    const imageIds = nextDraft.imageIds ?? [];
    if (imageIds.length < 3) next.images = t('dashboard.form.images.min', { count: 3 });
    if (imageIds.length > 15) next.images = t('dashboard.form.images.max', { count: 15 });
    if (nextDraft.coverImageId && !imageIds.includes(nextDraft.coverImageId)) next.coverImageId = t('dashboard.form.required');

    requiredText(nextDraft.location.fullAddress, 'address');
    requiredText(nextDraft.location.city, 'city');

    if (useCustomAddress) {
      if (typeof nextDraft.location.lat !== 'number' || typeof nextDraft.location.lng !== 'number') {
        next.coordinates = t('dashboard.form.required');
      }
    }

    if (!nextDraft.availableNow) {
      if (!nextDraft.availableIn) next.availableIn = t('dashboard.form.required');
    }

    if (profileType === 'rent') {
      if (!nextDraft.rentPricePerDay || nextDraft.rentPricePerDay <= 0) next.price = t('dashboard.form.required');
    } else {
      if (!nextDraft.salePrice || nextDraft.salePrice <= 0) next.price = t('dashboard.form.required');
    }

    if (
      profileType === 'buy' &&
      (nextDraft.listingStatus ?? 'active') === 'active' &&
      (initial.listingStatus ?? 'active') !== 'active' &&
      billingCount >= maxAllowedCars
    ) {
      next.limit = t('dashboard.cars.limitReached');
    }

    return next;
  };

  const computedErrors = useMemo(() => validateDraft(draft), [draft, profileType, t, useCustomAddress]);
  const errors = submitted ? computedErrors : {};

  const save = async () => {
    const nextErrors = validateDraft(draft);
    setSubmitted(true);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    setSaveError('');
    const imageIds = draft.imageIds ?? [];
    const coverId = draft.coverImageId || imageIds[0] || '';
    try {
      await onSave({
        ...draft,
        isForRent: profileType === 'rent',
        isForSale: profileType === 'buy',
        color: draft.exteriorColor || draft.color,
        imageIds,
        coverImageId: coverId || undefined,
        imageUrl: draft.imageUrl || '',
        listingStatus: draft.availableNow ? draft.listingStatus ?? 'active' : 'inactive',
        carMakeId: draft.carMakeId,
        carModelId: draft.carModelId,
      });
    } catch (err) {
      console.error('Failed to save car', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save car');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="owner-modal" role="dialog" aria-modal="true">
      <div className="owner-modal__card">
        <div className="owner-modal__head">
          <div>
            <p className="owner-modal__title">{t('dashboard.form.title')}</p>
            <p className="muted">{t('dashboard.form.subtitle')}</p>
          </div>
          <button className="owner-mini" type="button" onClick={onClose}>
            {t('dashboard.form.close')}
          </button>
        </div>

        <div className="owner-form">
          <div className="owner-form__grid">
            <Field label={t('dashboard.form.brand')} error={errors.brand || makesError}>
              <select
                value={draft.carMakeId || ''}
                onChange={(e) => {
                  const makeId = e.target.value ? Number(e.target.value) : undefined;
                  const selectedMake = carMakes.find(make => make.id === makeId);
                  setField('carMakeId', makeId);
                  setField('brand', selectedMake?.name || '');
                  setField('carModelId', undefined);
                  setField('model', '');
                }}
                disabled={loadingMakes}
              >
                <option value="">
                  {loadingMakes ? 'Loading makes...' : t('dashboard.form.select')}
                </option>
                {carMakes.map((make) => (
                  <option key={make.id} value={make.id}>
                    {make.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('dashboard.form.model')} error={errors.model || modelsError}>
              <select 
                value={draft.carModelId || ''} 
                onChange={(e) => {
                  const modelId = e.target.value ? Number(e.target.value) : undefined;
                  const selectedModel = carModels.find(model => model.id === modelId);
                  setField('carModelId', modelId);
                  setField('model', selectedModel?.name || '');
                }} 
                disabled={!draft.carMakeId || loadingModels}
              >
                <option value="">
                  {!draft.carMakeId 
                    ? 'Select a make first' 
                    : loadingModels 
                    ? 'Loading models...' 
                    : t('dashboard.form.select')
                  }
                </option>
                {carModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="owner-form__grid">
            <Field label={t('dashboard.form.year')} error={errors.year}>
              <select value={draft.year} onChange={(e) => setField('year', Number(e.target.value))}>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('dashboard.form.bodyStyle')} error={errors.bodyStyle}>
              <select value={draft.bodyStyle} onChange={(e) => setField('bodyStyle', e.target.value as BodyStyle)}>
                {bodyStyleOptions.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="owner-form__grid">
            <Field label={t('dashboard.form.fuelType')} error={errors.fuelType}>
              <select value={draft.fuelType} onChange={(e) => setField('fuelType', e.target.value as FuelType)}>
                {fuelTypeOptions.map((fuel) => (
                  <option key={fuel} value={fuel}>
                    {fuel}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('dashboard.form.transmission')} error={errors.transmission}>
              <select value={draft.transmission} onChange={(e) => setField('transmission', e.target.value as Transmission)}>
                {transmissionOptions.map((gear) => (
                  <option key={gear} value={gear}>
                    {gear}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="owner-form__grid">
            <Field label={t('dashboard.form.enginePower')} error={errors.enginePowerHp}>
              <input
                type="number"
                value={draft.enginePowerHp ?? 0}
                onChange={(e) => setField('enginePowerHp', Number(e.target.value))}
                min={0}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              />
            </Field>
            <Field label={t('dashboard.form.engineVolume')} error={errors.engineVolumeL}>
              <input
                type="number"
                value={draft.engineVolumeL ?? 0}
                onChange={(e) => setField('engineVolumeL', Number(e.target.value))}
                min={0}
                step={0.1}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              />
            </Field>
          </div>

          <div className="owner-form__grid">
            <Field label={t('dashboard.form.seats')} error={errors.seats}>
              <input
                type="number"
                value={draft.seats}
                onChange={(e) => setField('seats', Number(e.target.value))}
                min={1}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              />
            </Field>
            <Field label={t('dashboard.form.doors')} error={errors.doors}>
              <input
                type="number"
                value={draft.doors}
                onChange={(e) => setField('doors', Number(e.target.value))}
                min={2}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              />
            </Field>
          </div>

          <div className="owner-form__grid">
            <Field label={t('dashboard.form.exteriorColor')} error={errors.exteriorColor}>
              <select value={draft.exteriorColor} onChange={(e) => setField('exteriorColor', e.target.value)}>
                <option value="">{t('dashboard.form.select')}</option>
                {colorOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('dashboard.form.interiorColor')} error={errors.interiorColor}>
              <select value={draft.interiorColor} onChange={(e) => setField('interiorColor', e.target.value)}>
                <option value="">{t('dashboard.form.select')}</option>
                {colorOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t('dashboard.form.mileage')} error={errors.mileageKm}>
            <input
              type="number"
              value={draft.mileageKm}
              onChange={(e) => setField('mileageKm', Number(e.target.value))}
              min={0}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
            />
          </Field>

          <Field label={profileType === 'rent' ? t('dashboard.form.pricePerDay') : t('dashboard.form.salePrice')} error={errors.price}>
            <input
              type="number"
              value={profileType === 'rent' ? draft.rentPricePerDay ?? '' : draft.salePrice ?? ''}
              onChange={(e) => {
                const next = e.target.value === '' ? undefined : Number(e.target.value);
                if (profileType === 'rent') setField('rentPricePerDay', next);
                else setField('salePrice', next);
              }}
              min={0}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
            />
          </Field>

          <div className="owner-form__grid">
            <Field label={t('dashboard.form.accidents')} error={errors.accidentsCount}>
              <select
                value={(draft.accidentsCount ?? 0) >= 5 ? '5+' : String(draft.accidentsCount ?? 0)}
                onChange={(e) => setField('accidentsCount', e.target.value === '5+' ? 5 : Number(e.target.value))}
              >
                {accidentsOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('dashboard.form.owners')} error={errors.ownersCount}>
              <select
                value={(draft.ownersCount ?? 1) >= 5 ? '5+' : String(draft.ownersCount ?? 1)}
                onChange={(e) => setField('ownersCount', e.target.value === '5+' ? 5 : Number(e.target.value))}
              >
                {ownersOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t('dashboard.form.serviceHistory')} error={errors.serviceHistory}>
            <input value={draft.serviceHistory ?? ''} onChange={(e) => setField('serviceHistory', e.target.value)} />
          </Field>

          <Field label={t('dashboard.form.description')} error={errors.description}>
            <textarea value={draft.description ?? ''} onChange={(e) => setField('description', e.target.value)} rows={4} />
          </Field>

          <div className="owner-form__grid">
            <Field label={t('dashboard.form.yearlyInsurance')} error={errors.fees}>
              <input
                type="number"
                value={draft.fees ?? 0}
                onChange={(e) => setField('fees', Number(e.target.value))}
                min={0}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              />
            </Field>
            <Field label={t('dashboard.form.yearlyTaxes')} error={errors.taxes}>
              <input
                type="number"
                value={draft.taxes ?? 0}
                onChange={(e) => setField('taxes', Number(e.target.value))}
                min={0}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              />
            </Field>
          </div>

          <div className="owner-address">
            <div className="owner-address__top">
              <div>
                <p className="owner-options__title">{t('dashboard.form.addressTitle')}</p>
                {!useCustomAddress && (
                  <p className="muted">{t('dashboard.form.addressHint', { address: ownerAddress.address })}</p>
                )}
              </div>
              <label className="owner-check">
                <input
                  type="checkbox"
                  checked={useCustomAddress}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUseCustomAddress(checked);
                    setField('location', {
                      ...draft.location,
                      fullAddress: checked ? (draft.location.fullAddress || ownerAddress.address) : ownerAddress.address,
                      city: checked ? (draft.location.city || ownerAddress.city) : ownerAddress.city,
                      mapLabel: checked ? 'Selected location' : 'Owner location',
                      lat: checked ? (draft.location.lat ?? ownerAddress.lat) : ownerAddress.lat,
                      lng: checked ? (draft.location.lng ?? ownerAddress.lng) : ownerAddress.lng,
                    });
                  }}
                />
                <span>{t('dashboard.form.useDifferentAddress')}</span>
              </label>
            </div>

            {useCustomAddress && (
              <div className="owner-address__picker">
                <AddressPicker
                  defaultCenter={{
                    lat: (ownerAddress.lat && ownerAddress.lat !== 0) ? ownerAddress.lat : 41.3275, // Tirana, Albania
                    lng: (ownerAddress.lng && ownerAddress.lng !== 0) ? ownerAddress.lng : 19.8187,
                  }}
                  value={{
                    fullAddress: draft.location.fullAddress,
                    city: draft.location.city,
                    lat: draft.location.lat,
                    lng: draft.location.lng,
                  }}
                  searchLabel={t('dashboard.form.mapSearch')}
                  searchPlaceholder={t('dashboard.form.mapSearch.placeholder')}
                  addressLabel={t('dashboard.form.address')}
                  addressPlaceholder={t('dashboard.form.address')}
                  mapHint={t('dashboard.form.mapHint')}
                  onChange={(next) => {
                    setField('location', {
                      ...draft.location,
                      fullAddress: next.fullAddress,
                      city: next.city,
                      lat: next.lat,
                      lng: next.lng,
                      mapLabel: 'Selected location',
                    });
                  }}
                />
              </div>
            )}

            {!useCustomAddress && (
              <Field label={t('dashboard.form.address')} error={errors.address}>
                <input value={draft.location.fullAddress || ownerAddress.address} readOnly />
              </Field>
            )}
          </div>

          <ImagesField
            imageIds={draft.imageIds ?? []}
            coverImageId={draft.coverImageId}
            error={errors.images}
            onChange={({ imageIds, coverImageId, coverThumbnailDataUrl }) => {
              setDraft((d) => ({
                ...d,
                imageIds,
                coverImageId,
                imageUrl: coverThumbnailDataUrl || d.imageUrl,
              }));
            }}
          />

          <div className="owner-form__grid">
            <label className="owner-check">
              <input
                type="checkbox"
                checked={draft.availableNow}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setDraft((d) => ({
                    ...d,
                    availableNow: checked,
                    listingStatus: checked ? d.listingStatus ?? 'active' : 'inactive',
                  }));
                }}
              />
              <span>{t('dashboard.form.availableNow')}</span>
            </label>
            <label className="owner-check">
              <input
                type="checkbox"
                checked={draft.availableNow && (draft.listingStatus ?? 'active') !== 'inactive'}
                disabled={!draft.availableNow}
                onChange={(e) => setField('listingStatus', e.target.checked ? 'active' : 'inactive')}
              />
              <span>{t('dashboard.form.active')}</span>
            </label>
          </div>

          {!draft.availableNow && (
            <Field label={t('dashboard.form.availableIn')} error={errors.availableIn}>
              <select value={draft.availableIn ?? ''} onChange={(e) => setField('availableIn', (e.target.value || undefined) as Car['availableIn'])}>
                <option value="">{t('dashboard.form.select')}</option>
                <option value="1w">{t('dashboard.form.availableIn.1w')}</option>
                <option value="2w">{t('dashboard.form.availableIn.2w')}</option>
                <option value="3w">{t('dashboard.form.availableIn.3w')}</option>
                <option value="1m">{t('dashboard.form.availableIn.1m')}</option>
                <option value="2m">{t('dashboard.form.availableIn.2m')}</option>
              </select>
            </Field>
          )}

          <div className="owner-options">
            <p className="owner-options__title">{t('dashboard.form.options')}</p>
            {selectOptionGroups.map((group) => {
              const selected = optionGroups.find((g) => g.title === group.title)?.items?.[0] ?? '';
              return (
                <div key={group.title} className="owner-options__group">
                  <p className="owner-options__groupTitle">{group.title}</p>
                  <div className="owner-options__grid">
                    <label className="owner-field">
                      <select
                        value={selected}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDraft((d) => {
                            const groups = d.optionsGroups ?? [];
                            const rest = groups.filter((g) => g.title !== group.title);
                            const nextItems = value ? [value] : [];
                            return { ...d, optionsGroups: [...rest, { title: group.title, items: nextItems }] };
                          });
                        }}
                      >
                        <option value="">{t('dashboard.form.select')}</option>
                        {group.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              );
            })}
            {defaultOptionGroups.map((group) => {
              const current = optionGroups.find((g) => g.title === group.title)?.items ?? [];
              return (
                <div key={group.title} className="owner-options__group">
                  <p className="owner-options__groupTitle">{group.title}</p>
                  <div className="owner-options__grid">
                    {group.items.map((item) => {
                      const checked = current.includes(item);
                      return (
                        <label key={item} className="owner-check owner-check--box">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setDraft((d) => {
                                const groups = d.optionsGroups ?? [];
                                const existing = groups.find((g) => g.title === group.title) ?? { title: group.title, items: [] as string[] };
                                const rest = groups.filter((g) => g.title !== group.title);
                                const nextItems = e.target.checked
                                  ? Array.from(new Set([...existing.items, item]))
                                  : existing.items.filter((i) => i !== item);
                                return { ...d, optionsGroups: [...rest, { title: group.title, items: nextItems }] };
                              });
                            }}
                          />
                          <span>{item}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

      <div className="owner-form__actions">
        {errors.limit && <p className="owner-field__error">{errors.limit}</p>}
        {saveError && <p className="owner-field__error">{saveError}</p>}
        <button className="owner-mini" type="button" onClick={onClose}>
          {t('dashboard.form.cancel')}
        </button>
        <button className="owner-primary" type="button" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : t('dashboard.form.save')}
        </button>
      </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="owner-field">
      <span>{label}</span>
      {children}
      {error && <p className="owner-field__error">{error}</p>}
    </label>
  );
}

function PasswordChanger({ onDone }: { onDone: () => void }) {
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
}

function SubscriptionChanger() {
  return null;
}

function SubscriptionManager({
  billingCount,
  maxAllowed,
  annualPrice,
}: {
  billingCount: number;
  maxAllowed: number;
  annualPrice: number;
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, upgradeSubscriptionTier, scheduleDowngradeTier, cancelScheduledTierChange } = useAuth();
  const [targetTier, setTargetTier] = useState<SubscriptionTier>(user?.subscriptionTier ?? 'free');
  const [message, setMessage] = useState<string>('');
  if (!user) return null;

  const tierOrder: SubscriptionTier[] = ['free', 'basic5', 'plus10', 'standard20', 'pro20plus'];
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
            <option value="free">{t('dashboard.profile.tier.free')}</option>
            <option value="basic5">Basic 5</option>
            <option value="plus10">Plus 10</option>
            <option value="standard20">Standard 20</option>
            <option value="pro20plus">Pro 20+</option>
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
            {targetTier === 'free'
              ? t('dashboard.profile.tier.free')
              : targetTier === 'basic5'
                ? 'Basic 5'
                : targetTier === 'plus10'
                  ? 'Plus 10'
                  : targetTier === 'standard20'
                    ? 'Standard 20'
                    : 'Pro 20+'}
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
}
