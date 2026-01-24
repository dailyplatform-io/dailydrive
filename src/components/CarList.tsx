import { useEffect, useMemo, useState } from 'react';
import { Car } from '../models/Car';
import { CarCard } from './CarCard';
import { ChevronDownIcon } from './Icons';
import { useLanguage } from '../context/LanguageContext';
import { fetchCarMakes, fetchCarModelsByMake } from '../service/carMakeModelService';
import { createCarInterest } from '../service/carInterestService';
import { CarMake, CarModel } from '../models/CarMakeModel';
import './CarList.css';

type SortOption = 'closest' | 'lowest' | 'highest' | 'newest';

interface CarListProps {
  cars: Car[];
  onSelect: (car: Car) => void;
  selectedId?: string;
  onToggleFavorite: (car: Car) => void;
  isFavorite: (id: string) => boolean;
  mode: 'rent' | 'buy';
  countLabel?: 'rent' | 'buy' | 'all';
}

export const CarList: React.FC<CarListProps> = ({
  cars,
  onSelect,
  selectedId,
  onToggleFavorite,
  isFavorite,
  mode,
  countLabel
}) => {
  const [sort, setSort] = useState<SortOption>('closest');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState<'idle' | 'loading' | 'submitting' | 'success' | 'error'>('idle');
  const [notifyError, setNotifyError] = useState('');
  const [makes, setMakes] = useState<CarMake[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [selectedMakeId, setSelectedMakeId] = useState<number | ''>('');
  const [selectedModelId, setSelectedModelId] = useState<number | ''>('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!navigator.geolocation || userCoords) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setUserCoords(null);
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 8000 }
    );
  }, [userCoords]);

  const sortedCars = useMemo(() => {
    const copy = [...cars];
    const rentalOrSale = (car: Car) => {
      const raw = mode === 'buy'
        ? car.salePrice
        : car.rentPricePerDay ?? car.rentPricePerHour;
      const price = typeof raw === 'number' ? raw : Number(raw);
      return Number.isFinite(price) && price > 0 ? price : Number.POSITIVE_INFINITY;
    };
    const distanceValue = (car: Car) => {
      const distance = typeof car.distanceMeters === 'number' ? car.distanceMeters : Number(car.distanceMeters);
      return Number.isFinite(distance) && distance > 0 ? distance : Number.POSITIVE_INFINITY;
    };
    const distanceFromUser = (car: Car) => {
      if (!userCoords) return distanceValue(car);
      const lat = car.location?.lat;
      const lng = car.location?.lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') return distanceValue(car);
      const toRad = (value: number) => (value * Math.PI) / 180;
      const r = 6371000;
      const dLat = toRad(lat - userCoords.lat);
      const dLng = toRad(lng - userCoords.lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(userCoords.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return r * c;
    };
    switch (sort) {
      case 'lowest':
        return copy.sort((a, b) => rentalOrSale(a) - rentalOrSale(b));
      case 'highest':
        return copy.sort((a, b) => rentalOrSale(b) - rentalOrSale(a));
      case 'newest':
        return copy.sort((a, b) => b.year - a.year);
      default:
        return copy.sort((a, b) => distanceFromUser(a) - distanceFromUser(b));
    }
  }, [cars, mode, sort, userCoords]);

  useEffect(() => {
    if (!notifyOpen) return;
    setNotifyStatus('idle');
    setNotifyError('');
    if (makes.length > 0) return;

    const loadMakes = async () => {
      setNotifyStatus('loading');
      try {
        const data = await fetchCarMakes();
        setMakes(data);
        setNotifyStatus('idle');
      } catch (error) {
        const message = error instanceof Error ? error.message : t('carList.notify.error');
        setNotifyError(message);
        setNotifyStatus('error');
      }
    };

    void loadMakes();
  }, [notifyOpen, makes.length, t]);

  useEffect(() => {
    if (!selectedMakeId) {
      setModels([]);
      setSelectedModelId('');
      return;
    }

    const loadModels = async () => {
      try {
        const data = await fetchCarModelsByMake(selectedMakeId);
        setModels(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : t('carList.notify.error');
        setNotifyError(message);
        setNotifyStatus('error');
      }
    };

    void loadModels();
  }, [selectedMakeId, t]);

  useEffect(() => {
    if (!notifyOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotifyOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notifyOpen]);

  const handleNotifySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setNotifyError(t('carList.notify.emailRequired'));
      setNotifyStatus('error');
      return;
    }

    const make = makes.find((item) => item.id === selectedMakeId);
    const model = models.find((item) => item.id === selectedModelId);
    if (!make || !model) {
      setNotifyError(t('carList.notify.makeModelRequired'));
      setNotifyStatus('error');
      return;
    }

    setNotifyStatus('submitting');
    setNotifyError('');
    try {
      const contactName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await createCarInterest({
        brand: make.name,
        model: model.name,
        contactName: contactName || undefined,
        contactEmail: trimmedEmail,
        contactPhone: phone.trim() || undefined,
      });
      setNotifyStatus('success');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('carList.notify.error');
      setNotifyStatus('error');
      setNotifyError(message);
    }
  };

  return (
    <section className="car-list">
      <div className="car-list__top">
        <div className="car-list__count">
          <h2>
            {(() => {
              const label = countLabel ?? mode;
              if (label === 'all') return t('cars.count.all', { count: cars.length });
              return label === 'rent'
                ? t('cars.count.rent', { count: cars.length })
                : t('cars.count.buy', { count: cars.length });
            })()}
          </h2>
          <p className="muted">{t('cars.subtitle')}</p>
        </div>
        <div className="car-list__actions">
          <button className="car-list__notify" type="button" onClick={() => setNotifyOpen(true)}>
            {t('carList.notify.cta')}
          </button>
          <div className="sort">
            <label htmlFor="sort">{t('cars.sort.label')}</label>
            <div className="sort__select">
              <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as SortOption)}>
                <option value="closest">{t('cars.sort.closest')}</option>
                <option value="lowest">{t('cars.sort.lowest')}</option>
                <option value="highest">{t('cars.sort.highest')}</option>
                <option value="newest">{t('cars.sort.newest')}</option>
              </select>
              <ChevronDownIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      <div className="car-list__grid">
        {sortedCars.map((car) => (
          <CarCard
            key={car.id}
            car={car}
            selected={selectedId === car.id}
            onSelect={onSelect}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite(car.id)}
          />
        ))}
      </div>
      {notifyOpen && (
        <div
          className="car-list__notify-overlay"
          onClick={() => setNotifyOpen(false)}
        >
          <div
            className="car-list__notify-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t('carList.notify.title')}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="car-list__notify-header">
              <h4>{t('carList.notify.title')}</h4>
              <p>{t('carList.notify.subtitle')}</p>
            </div>
            {notifyStatus === 'success' ? (
              <div className="car-list__notify-success">
                <p>{t('carList.notify.success')}</p>
                <button
                  type="button"
                  className="car-list__notify-close"
                  onClick={() => setNotifyOpen(false)}
                >
                  {t('carList.notify.close')}
                </button>
              </div>
            ) : (
              <form className="car-list__notify-form" onSubmit={handleNotifySubmit}>
                <label>
                  {t('carList.notify.make')}
                  <select
                    value={selectedMakeId}
                    onChange={(event) => {
                      const next = event.target.value ? Number(event.target.value) : '';
                      setSelectedMakeId(next);
                    }}
                  >
                    <option value="">{t('carList.notify.makePlaceholder')}</option>
                    {makes.map((make) => (
                      <option key={make.id} value={make.id}>
                        {make.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t('carList.notify.model')}
                  <select
                    value={selectedModelId}
                    onChange={(event) => {
                      const next = event.target.value ? Number(event.target.value) : '';
                      setSelectedModelId(next);
                    }}
                    disabled={!selectedMakeId}
                  >
                    <option value="">{t('carList.notify.modelPlaceholder')}</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="car-list__notify-row">
                  <label>
                    {t('carList.notify.firstName')}
                    <input
                      type="text"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder={t('carList.notify.firstNamePlaceholder')}
                    />
                  </label>
                  <label>
                    {t('carList.notify.lastName')}
                    <input
                      type="text"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder={t('carList.notify.lastNamePlaceholder')}
                    />
                  </label>
                </div>
                <label>
                  {t('carList.notify.email')}
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t('carList.notify.emailPlaceholder')}
                    required
                  />
                </label>
                <label>
                  {t('carList.notify.phone')}
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder={t('carList.notify.phonePlaceholder')}
                  />
                </label>
                {notifyStatus === 'error' && notifyError ? (
                  <p className="car-list__notify-error">{notifyError}</p>
                ) : null}
                <div className="car-list__notify-actions">
                  <button
                    type="button"
                    className="car-list__notify-cancel"
                    onClick={() => setNotifyOpen(false)}
                    disabled={notifyStatus === 'submitting'}
                  >
                    {t('carList.notify.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="car-list__notify-submit"
                    disabled={notifyStatus === 'submitting' || notifyStatus === 'loading'}
                  >
                    {notifyStatus === 'submitting' ? t('carList.notify.saving') : t('carList.notify.submit')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
