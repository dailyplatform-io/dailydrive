import { createContext, useContext, useMemo, useState } from 'react';
import { Car } from '../models/Car';

interface FavoritesContextValue {
  favorites: Car[];
  toggleFavorite: (car: Car) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Car[]>([]);

  const toggleFavorite = (car: Car) => {
    setFavorites((prev) => {
      if (prev.find((item) => item.id === car.id)) {
        return prev.filter((item) => item.id !== car.id);
      }
      return [...prev, car];
    });
  };

  const value = useMemo(
    () => ({
      favorites,
      toggleFavorite,
      isFavorite: (id: string) => favorites.some((f) => f.id === id),
    }),
    [favorites]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
};
