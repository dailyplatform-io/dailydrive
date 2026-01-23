import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CarDetailsPanel } from '../components/CarDetailsPanel';
import { CarList } from '../components/CarList';
import { FilterSidebar } from '../components/FilterSidebar';
import { FacebookIcon, InstagramIcon, PhoneIcon } from '../components/Icons';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
import { useBrand } from '../context/BrandContext';
import { useAuth } from '../context/AuthContext';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useFilters } from '../hooks/useFilters';
import { fetchCarsFromAPI } from '../service/carService';
import { fetchCarMakes, fetchAllCarModels } from '../service/carMakeModelService';
import { Car } from '../models/Car';
import { CarMake, CarModel } from '../models/CarMakeModel';
import { slugifySellerName } from '../utils/slug';
import './SellerCarsPage.css';

interface SellerCarsPageProps {
  sellerName: string;
}

const normalizeSellerSlug = (value: string) => slugifySellerName(value);

const normalizeSellerDisplayName = (value: string) => {
  const cleaned = value.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  return cleaned
    .split(' ')
    .map((word) => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

const buildSocialUrl = (platform: 'instagram' | 'facebook', value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const handle = trimmed.replace(/^@/, '');
  const base = platform === 'instagram' ? 'https://instagram.com/' : 'https://facebook.com/';
  return `${base}${encodeURIComponent(handle)}`;
};

const formatSocialLabel = (platform: 'instagram' | 'facebook', value: string) => {
  const handle = value.trim().replace(/^@/, '');
  if (!handle) return '';
  return platform === 'instagram' ? `@${handle}` : handle;
};

export const SellerCarsPage: React.FC<SellerCarsPageProps> = ({ sellerName }) => {
  const { t } = useLanguage();
  const { setBrandName } = useBrand();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const isMobile = useBreakpoint(1024);
  const isTablet = useBreakpoint(1200);
  const [showFilters, setShowFilters] = useState(!isTablet);
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [carMakes, setCarMakes] = useState<CarMake[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCarId, setSelectedCarId] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<'rent' | 'buy'>(() => {
    const searchMode = new URLSearchParams(window.location.search).get('mode');
    return searchMode === 'buy' || searchMode === 'rent' ? searchMode : 'rent';
  });
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const normalizedSellerName = useMemo(() => normalizeSellerSlug(sellerName), [sellerName]);
  const sellerCars = useMemo(
    () =>
      allCars.filter((car) => {
        const ownerSlug = car.ownerSlug?.trim() || slugifySellerName(car.ownerName ?? '');
        return ownerSlug === normalizedSellerName;
      }),
    [allCars, normalizedSellerName]
  );

  const sellerProfile = useMemo(() => {
    const rawName = sellerCars.find((car) => car.ownerName)?.ownerName || sellerName;
    const displayName = normalizeSellerDisplayName(rawName);
    const phone = sellerCars.find((car) => car.ownerPhone)?.ownerPhone;
    const instagram = sellerCars.find((car) => car.ownerInstagram)?.ownerInstagram;
    const facebook = sellerCars.find((car) => car.ownerFacebook)?.ownerFacebook;
    const fallbackPhone =
      !phone &&
      user?.sellerSlug &&
      normalizeSellerSlug(user.sellerSlug) === normalizedSellerName
        ? user.phone
        : undefined;
    return { displayName: displayName || rawName, phone: phone || fallbackPhone, instagram, facebook };
  }, [sellerCars, sellerName, user?.phone, user?.sellerSlug, normalizedSellerName]);

  const { filters, updateFilter, resetFilters, filtered, bounds } = useFilters(sellerCars, mode, carMakes, carModels);

  const bodyStyles = useMemo(() => Array.from(new Set(sellerCars.map((c) => c.bodyStyle))), [sellerCars]);
  const fuelTypes = useMemo(() => Array.from(new Set(sellerCars.map((c) => c.fuelType))), [sellerCars]);
  const transmissions = useMemo(() => Array.from(new Set(sellerCars.map((c) => c.transmission))), [sellerCars]);
  const exteriorColors = useMemo(
    () => Array.from(new Set(sellerCars.map((c) => c.exteriorColor ?? c.color))),
    [sellerCars]
  );
  const interiorColors = useMemo(
    () =>
      Array.from(
        new Set(
          sellerCars
            .map((c) => c.interiorColor)
            .filter((color): color is string => Boolean(color))
        )
      ),
    [sellerCars]
  );

  const hasRentCars = useMemo(() => sellerCars.some((car) => car.isForRent), [sellerCars]);
  const hasBuyCars = useMemo(() => sellerCars.some((car) => car.isForSale), [sellerCars]);

  useEffect(() => {
    const displayName = sellerProfile.displayName.trim();
    setBrandName(displayName ? displayName : null);
    return () => {
      setBrandName(null);
    };
  }, [sellerProfile.displayName, setBrandName]);

  useEffect(() => {
    setShowFilters(!isTablet);
  }, [isTablet]);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadMakesAndModels = async () => {
      try {
        const [makes, models] = await Promise.all([
          fetchCarMakes(),
          fetchAllCarModels()
        ]);
        setCarMakes(makes);
        setCarModels(models);
      } catch (error) {
        console.error('Failed to load car makes and models:', error);
      }
    };
    loadMakesAndModels();
  }, []);

  useEffect(() => {
    const loadCars = async () => {
      setLoading(true);
      const cars = await fetchCarsFromAPI();
      setAllCars(cars);
      setLoading(false);
    };
    loadCars();
  }, []);

  useEffect(() => {
    const searchMode = new URLSearchParams(location.search).get('mode');
    if (searchMode === 'buy' || searchMode === 'rent') {
      setMode(searchMode);
    }
  }, [location.search]);

  useEffect(() => {
    if (mode === 'rent' && !hasRentCars && hasBuyCars) setMode('buy');
    if (mode === 'buy' && !hasBuyCars && hasRentCars) setMode('rent');
  }, [mode, hasRentCars, hasBuyCars]);

  const filteredByMode = useMemo(
    () => filtered.filter((car) => (mode === 'rent' ? car.isForRent : car.isForSale)),
    [filtered, mode]
  );

  useEffect(() => {
    if (!selectedCarId) return;
    const exists = filteredByMode.some((car) => car.id === selectedCarId);
    if (!exists) setSelectedCarId(undefined);
  }, [filteredByMode, selectedCarId]);

  const selectedCar = filteredByMode.find((c) => c.id === selectedCarId);
  const showDetails = !!selectedCarId && !isMobile;

  const handleSelect = (carToSelect: Car) => {
    if (isMobile) {
      navigate(`/cars/${carToSelect.id}`);
    } else {
      setSelectedCarId(carToSelect.id);
    }
  };

  const handleDoubleClick = (carToSelect: Car) => {
    if (!isMobile) {
      navigate(`/cars/${carToSelect.id}`);
    }
  };

  const handleCarClick = (carToSelect: Car) => {
    if (isMobile) {
      navigate(`/cars/${carToSelect.id}`);
      return;
    }

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      handleDoubleClick(carToSelect);
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        handleSelect(carToSelect);
      }, 250);
    }
  };

  const handleModeChange = (nextMode: 'rent' | 'buy') => {
    if (nextMode === mode) return;
    setMode(nextMode);
    navigate(`/dealer/${encodeURIComponent(sellerName)}?mode=${nextMode}`, { replace: true });
    setSelectedCarId(undefined);
  };

  const contactItems = useMemo(() => {
    const items: Array<{
      key: string;
      label: string;
      href: string;
      external?: boolean;
      icon: JSX.Element;
    }> = [];

    if (sellerProfile.instagram) {
      const url = buildSocialUrl('instagram', sellerProfile.instagram);
      const label = formatSocialLabel('instagram', sellerProfile.instagram);
      if (url && label) {
        items.push({ key: 'instagram', label, href: url, external: true, icon: <InstagramIcon size={16} /> });
      }
    }

    if (sellerProfile.facebook) {
      const url = buildSocialUrl('facebook', sellerProfile.facebook);
      const label = formatSocialLabel('facebook', sellerProfile.facebook);
      if (url && label) {
        items.push({ key: 'facebook', label, href: url, external: true, icon: <FacebookIcon size={16} /> });
      }
    }

    if (sellerProfile.phone) {
      const digits = sellerProfile.phone.replace(/\s+/g, '');
      items.push({ key: 'phone', label: sellerProfile.phone, href: `tel:${digits}`, icon: <PhoneIcon size={16} /> });
    }

    return items;
  }, [sellerProfile]);

  return (
    <main className="layout layout--seller">
      <section className="seller-hero">
        <div className="seller-hero__main">
          <p className="seller-hero__kicker">{t('seller.cars.kicker')}</p>
          <h1 className="seller-hero__title">{sellerProfile.displayName}</h1>
          <p className="seller-hero__subtitle">{t('seller.cars.subtitle')}</p>
          {hasRentCars && hasBuyCars && (
            <div className="seller-mode-toggle">
              <button
                type="button"
                className={`seller-mode-toggle__button ${mode === 'rent' ? 'is-active' : ''}`}
                onClick={() => handleModeChange('rent')}
              >
                {t('seller.cars.mode.rent')}
              </button>
              <button
                type="button"
                className={`seller-mode-toggle__button ${mode === 'buy' ? 'is-active' : ''}`}
                onClick={() => handleModeChange('buy')}
              >
                {t('seller.cars.mode.buy')}
              </button>
            </div>
          )}
        </div>
        <div className="seller-hero__contact">
          {contactItems.length ? (
            contactItems.map((item) => (
              <a
                key={item.key}
                className="seller-contact"
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noreferrer' : undefined}
              >
                <span className="seller-contact__icon">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))
          ) : (
            <p className="seller-contact seller-contact--empty">{t('seller.cars.contactEmpty')}</p>
          )}
        </div>
      </section>

      <div className={`layout__grid ${showDetails ? '' : 'no-details'}`}>
        <div className={`layout__col filters ${isTablet && !showFilters ? 'is-collapsed' : ''}`}>
          <FilterSidebar
            filters={filters}
            onUpdate={updateFilter}
            onReset={resetFilters}
            bodyStyles={bodyStyles}
            fuelTypes={fuelTypes}
            transmissions={transmissions}
            exteriorColors={exteriorColors}
            interiorColors={interiorColors}
            bounds={bounds}
            collapsed={isTablet && !showFilters}
            onToggleCollapse={isTablet ? () => setShowFilters((s) => !s) : undefined}
            mode={mode}
          />
        </div>
        <div className="layout__col list">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p>Loading cars...</p>
            </div>
          ) : (
            <CarList
              cars={filteredByMode}
              selectedId={selectedCarId}
              onSelect={handleCarClick}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
              mode={mode}
              countLabel={!hasRentCars && !hasBuyCars ? 'all' : undefined}
            />
          )}
        </div>
        {showDetails && selectedCar && (
          <div className="layout__col details">
            <CarDetailsPanel
              car={selectedCar}
              onOpenFull={(id) => navigate(`/cars/${id}`)}
              showTabs={false}
              onClose={() => setSelectedCarId(undefined)}
            />
          </div>
        )}
      </div>
    </main>
  );
};
