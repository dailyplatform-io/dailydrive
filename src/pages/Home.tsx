import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CarList } from '../components/CarList';
import { FilterSidebar } from '../components/FilterSidebar';
import { LandingPage } from '../components/LandingPage';
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
  const isTablet = useBreakpoint(1200);
  const navigate = useNavigate();
  const location = useLocation();
  const rentEnabled = features.rent;
  const buyEnabled = features.buy;
  const { toggleFavorite, isFavorite } = useFavorites();
  const [showFilters, setShowFilters] = useState(!isTablet);
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

  const filteredByMode = useMemo(
    () => filtered.filter((car) => (mode === 'rent' ? car.isForRent : car.isForSale)),
    [filtered, mode]
  );

  const handleCarClick = (carToSelect: Car) => {
    navigate(`/cars/${carToSelect.id}`);
  };

  const handleModeChange = (nextMode: 'rent' | 'buy') => {
    if (nextMode === 'rent' && !rentEnabled) return;
    if (nextMode === 'buy' && !buyEnabled) return;
    setMode(nextMode);
    navigate(nextMode === 'rent' ? '/rent' : '/buy', { replace: true });
  };

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
      <LandingPage
        totalCars={totals.total}
        rentCars={totals.rent}
        buyCars={totals.buy}
        onNavigateToRent={() => handleModeChange('rent')}
        onNavigateToBuy={() => handleModeChange('buy')}
      />
    );
  }

  return (
    <main className="layout">
      <div className="layout__grid no-details">
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
              onSelect={handleCarClick}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
              mode={mode}
            />
          )}
        </div>
      </div>
    </main>
  );
};
