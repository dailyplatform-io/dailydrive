import { useNavigate } from 'react-router-dom';
import { CarCard } from '../../components/CarCard';
import { useFavorites } from '../../context/FavoritesContext';
import { useLanguage } from '../../context/LanguageContext';
import './Favorites.css';

export const Favorites: React.FC = () => {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="favorites-page">
      <header>
        <h2>{t('favorites.title')}</h2>
        <p className="muted">{t('favorites.subtitle')}</p>
      </header>
      {favorites.length === 0 ? (
        <div className="empty-state">
          <p>{t('favorites.empty')}</p>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              selected={false}
              onSelect={() => navigate(`/cars/${car.id}`)}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite(car.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
