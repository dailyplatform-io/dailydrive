import { useMemo, useState } from 'react';
import { Car } from '../models/Car';
import { CarCard } from './CarCard';
import { ChevronDownIcon } from './Icons';
import { useLanguage } from '../context/LanguageContext';
import './CarList.css';

type SortOption = 'closest' | 'lowest' | 'highest' | 'newest';

interface CarListProps {
  cars: Car[];
  onSelect: (car: Car) => void;
  selectedId?: string;
  onToggleFavorite: (car: Car) => void;
  isFavorite: (id: string) => boolean;
  mode: 'rent' | 'buy';
}

export const CarList: React.FC<CarListProps> = ({ cars, onSelect, selectedId, onToggleFavorite, isFavorite, mode }) => {
  const [sort, setSort] = useState<SortOption>('closest');
  const { t } = useLanguage();

  const sortedCars = useMemo(() => {
    const copy = [...cars];
    const rentalOrSale = (car: Car) =>
      car.rentPricePerDay ?? car.rentPricePerHour ?? car.salePrice ?? Number.POSITIVE_INFINITY;
    switch (sort) {
      case 'lowest':
        return copy.sort((a, b) => rentalOrSale(a) - rentalOrSale(b));
      case 'highest':
        return copy.sort((a, b) => rentalOrSale(b) - rentalOrSale(a));
      case 'newest':
        return copy.sort((a, b) => b.year - a.year);
      default:
        return copy.sort((a, b) => a.distanceMeters - b.distanceMeters);
    }
  }, [cars, sort]);

  return (
    <section className="car-list">
      <div className="car-list__top">
        <div className="car-list__count">
          <h2>
            {mode === 'rent'
              ? t('cars.count.rent', { count: cars.length })
              : t('cars.count.buy', { count: cars.length })}
          </h2>
          <p className="muted">{t('cars.subtitle')}</p>
        </div>
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
    </section>
  );
};
