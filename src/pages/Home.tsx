import { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CarDetailsPanel } from '../components/CarDetailsPanel';
import { CarList } from '../components/CarList';
import { FilterSidebar } from '../components/FilterSidebar';
import { useLanguage } from '../context/LanguageContext';
import { features, getDefaultMode } from '../config/features';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useFilters } from '../hooks/useFilters';
import { useFavorites } from '../context/FavoritesContext';
import { fetchCarsFromAPI } from '../service/carService';
import { fetchCarMakes, fetchAllCarModels } from '../service/carMakeModelService';
import { Car } from '../models/Car';
import { CarMake, CarModel } from '../models/CarMakeModel';
import './Home.css';

interface HomeProps {
  variant?: 'home' | 'cars';
  defaultMode?: 'rent' | 'buy';
}

export const Home: React.FC<HomeProps> = ({ variant = 'home', defaultMode = 'rent' }) => {
  const [selectedCarId, setSelectedCarId] = useState<string | undefined>(undefined);
  const isMobile = useBreakpoint(1024);
  const isTablet = useBreakpoint(1200);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const rentEnabled = features.rent;
  const buyEnabled = features.buy;
  const { toggleFavorite, isFavorite } = useFavorites();
  const [showFilters, setShowFilters] = useState(!isTablet);
  const showDetails = !!selectedCarId && !isMobile;
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [carMakes, setCarMakes] = useState<CarMake[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'rent' | 'buy'>(() => {
    const searchMode = new URLSearchParams(window.location.search).get('mode');
    if (searchMode === 'buy' || searchMode === 'rent') return searchMode;
    if (window.location.pathname.includes('/buy')) return 'buy';
    if (window.location.pathname.includes('/rent')) return 'rent';
    if (defaultMode === 'rent' && !rentEnabled) return buyEnabled ? 'buy' : 'rent';
    if (defaultMode === 'buy' && !buyEnabled) return rentEnabled ? 'rent' : 'buy';
    return defaultMode;
  });
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);
  
  // Load car makes and models
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
  
  // Fetch cars from API
  useEffect(() => {
    const loadCars = async () => {
      setLoading(true);
      // On home page, fetch all cars. On rent/buy pages, fetch filtered cars
      const fetchMode = variant === 'home' ? undefined : mode;
      const cars = await fetchCarsFromAPI(fetchMode);
      setAllCars(cars);
      setLoading(false);
    };
    loadCars();
  }, [mode, variant]);
  
  const { filters, updateFilter, resetFilters, filtered, bounds } = useFilters(allCars, mode, carMakes, carModels);

  const bodyStyles = useMemo(() => Array.from(new Set(allCars.map((c) => c.bodyStyle))), [allCars]);
  const fuelTypes = useMemo(() => Array.from(new Set(allCars.map((c) => c.fuelType))), [allCars]);
  const transmissions = useMemo(() => Array.from(new Set(allCars.map((c) => c.transmission))), [allCars]);
  const exteriorColors = useMemo(
    () => Array.from(new Set(allCars.map((c) => c.exteriorColor ?? c.color))),
    [allCars]
  );
  const interiorColors = useMemo(
    () =>
      Array.from(
        new Set(
          allCars
            .map((c) => c.interiorColor)
            .filter((color): color is string => Boolean(color))
        )
      ),
    [allCars]
  );

  useEffect(() => {
    setShowFilters(!isTablet);
  }, [isTablet]);

  useEffect(() => {
    const searchMode = new URLSearchParams(location.search).get('mode');
    if (searchMode === 'buy' || searchMode === 'rent') {
      if (searchMode === 'rent' && !rentEnabled) return;
      if (searchMode === 'buy' && !buyEnabled) return;
      setMode(searchMode);
      return;
    }
    if (location.pathname.includes('/buy')) {
      if (!buyEnabled) return;
      setMode('buy');
      return;
    }
    if (location.pathname.includes('/rent')) {
      if (!rentEnabled) return;
      setMode('rent');
      return;
    }
    const fallback = getDefaultMode();
    if (fallback) setMode(fallback);
  }, [location.pathname, location.search, defaultMode, rentEnabled, buyEnabled]);

  useEffect(() => {
    if (mode === 'rent' && !rentEnabled && buyEnabled) setMode('buy');
    if (mode === 'buy' && !buyEnabled && rentEnabled) setMode('rent');
  }, [mode, rentEnabled, buyEnabled]);

  useEffect(() => {
    if (!selectedCarId) return;
    const exists = filtered.some((car) => car.id === selectedCarId);
    if (!exists) setSelectedCarId(undefined);
  }, [filtered, selectedCarId]);

  const filteredByMode = useMemo(
    () => filtered.filter((car) => (mode === 'rent' ? car.isForRent : car.isForSale)),
    [filtered, mode]
  );

  useEffect(() => {
    if (selectedCarId && !filteredByMode.some((c) => c.id === selectedCarId)) {
      setSelectedCarId(undefined);
    }
  }, [filteredByMode, selectedCarId]);

  const selectedCar = filteredByMode.find((c) => c.id === selectedCarId);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    // Handle double-click detection for desktop
    if (clickTimerRef.current) {
      // Double click detected
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      handleDoubleClick(carToSelect);
    } else {
      // Single click - set timer to wait for potential second click
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        handleSelect(carToSelect);
      }, 250); // 250ms delay to detect double click
    }
  };

  const handleModeChange = (nextMode: 'rent' | 'buy') => {
    if (nextMode === 'rent' && !rentEnabled) return;
    if (nextMode === 'buy' && !buyEnabled) return;
    setMode(nextMode);
    navigate(nextMode === 'rent' ? '/rent' : '/buy', { replace: true });
    setSelectedCarId(undefined);
  };

  const rentHighlights = useMemo(() => allCars.filter((c) => c.isForRent).slice(0, 3), [allCars]);
  const buyHighlights = useMemo(() => allCars.filter((c) => c.isForSale).slice(0, 8), [allCars]);
  const totals = useMemo(
    () => {
      const rentCars = allCars.filter((c) => c.isForRent).length;
      const buyCars = allCars.filter((c) => c.isForSale).length;
      
      // Calculate total based on enabled features
      let total = 0;
      if (rentEnabled && buyEnabled) {
        // Both enabled: count all cars
        total = allCars.length;
      } else if (rentEnabled && !buyEnabled) {
        // Only rent enabled: count only rental cars
        total = rentCars;
      } else if (!rentEnabled && buyEnabled) {
        // Only buy enabled: count only sale cars
        total = buyCars;
      } else {
        // Neither enabled: fallback to all cars
        total = allCars.length;
      }
      
      return {
        rent: rentCars,
        buy: buyCars,
        total: total
      };
    },
    [allCars, rentEnabled, buyEnabled]
  );

  if (variant === 'home') {
    return (
      <main className="layout layout--home">
        <section className="home-hero">
          <div className="hero-copy">
            <h1>{t(rentEnabled && buyEnabled ? 'home.hero.title' : 'home.hero.title.general')}</h1>
            <p className="hero-subtitle">
              {t(rentEnabled && buyEnabled ? 'home.hero.subtitle' : 'home.hero.subtitle.general')}
            </p>
            <div className="hero-actions">
              {rentEnabled && (
                <button className="hero-button hero-button--primary" onClick={() => handleModeChange('rent')}>
                  {t('home.hero.browseRentals')}
                </button>
              )}
              {buyEnabled && (
                <button className="hero-button hero-button--ghost" onClick={() => handleModeChange('buy')}>
                  {t('home.hero.shopToOwn')}
                </button>
              )}
            </div>

            <div className="hero-extras">
              <p className="hero-extras__title">{t('home.hero.popular')}</p>
              <div className="hero-chips">
                {['home.hero.chip.suv', 'home.hero.chip.sedan', 'home.hero.chip.electric', 'home.hero.chip.hybrid'].map(
                  (key) => (
                    <button
                      key={key}
                      type="button"
                      className="hero-chip"
                      onClick={() => navigate(buyEnabled ? '/buy' : rentEnabled ? '/rent' : '/')}
                    >
                      {t(key)}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="hero-stats">
              <Stat label={t('home.hero.statBuy')} value={t('home.hero.valueCars', { count: `${totals.total}+` })} />
            </div>
          </div>
          {buyEnabled && (
            <div className="hero-panel">
              <div className="panel-head">
                <div>
                  <p className="panel-kicker">{t('home.spotlight.kicker')}</p>
                  <p className="panel-title">{t('home.spotlight.title')}</p>
                </div>
                <span className="panel-tag">{t('home.spotlight.tag')}</span>
              </div>
              <div className={`panel-grid panel-grid--wide panel-grid--count-${buyHighlights.length}`}>
                {buyHighlights.map((car) => (
                  <div
                    key={car.id}
                    className="panel-card panel-card--accent"
                    onClick={() => navigate(`/cars/${car.id}`)}
                  >
                    <p className="panel-pill panel-pill--green">{t('home.spotlight.badgeBuy')}</p>
                    <div className="panel-card__content">
                      <img src={car.imageUrl} alt={car.model} />
                      <div>
                        <p className="panel-name">
                          {car.brand} {car.model}
                        </p>
                        {car.subtitle && <p className="panel-meta">{car.subtitle}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="home-collections">
          {rentEnabled && (
            <CollectionCard
              title={t('home.collection.rent.title')}
              badge={t('home.collection.rent.badge')}
              tone="blue"
              description={t('home.collection.rent.desc')}
              countLabel={t('home.collection.count', { count: totals.rent })}
              onClick={() => handleModeChange('rent')}
            />
          )}
          {buyEnabled && (
            <CollectionCard
              title={t('home.collection.buy.title')}
              badge={t('home.collection.buy.badge')}
              tone="green"
              description={t('home.collection.buy.desc')}
              countLabel={t('home.collection.count', { count: totals.buy })}
              onClick={() => handleModeChange('buy')}
            />
          )}
        </section>

        <section className="home-assurances">
          <div className="assurance-card">
            <p className="assurance-title">{t('home.assurance.title')}</p>
            <ul className="assurance-list">
              {features.rent && <li>{t('home.assurance.li1')}</li>}
              <li>{t('home.assurance.li2')}</li>
              <li>{t('home.assurance.li3')}</li>
              <li>{t('home.assurance.li4')}</li>
            </ul>
          </div>
          <div className="assurance-card assurance-card--outline">
            <p className="assurance-title">{t('home.assistance.title')}</p>
            <p className="assurance-body">{t('home.assistance.body')}</p>
            <div className="hero-actions">
              <button className="hero-button hero-button--primary" onClick={() => navigate('/about')}>
                {t('common.contact')}
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="layout">
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

const CollectionCard: React.FC<{
  title: string;
  badge: string;
  tone: 'blue' | 'green';
  description: string;
  onClick: () => void;
  countLabel?: string;
}> = ({ title, badge, tone, description, onClick, countLabel }) => {
  const { t } = useLanguage();
  return (
    <article className={`collection-card collection-card--${tone}`} onClick={onClick}>
      <div className="collection-head">
        <span className={`pill ${tone === 'blue' ? 'pill--blue' : 'pill--green'}`}>{badge}</span>
        <p className="collection-title">{title}</p>
        <p className="collection-description">{description}</p>
      </div>
      <div className="collection-footer">
        {countLabel && <span className="collection-count">{countLabel}</span>}
        <span className="collection-cta">{t('home.collection.cta')}</span>
      </div>
    </article>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="hero-stat">
    <p className="hero-stat__value">{value}</p>
    <p className="hero-stat__label">{label}</p>
  </div>
);
