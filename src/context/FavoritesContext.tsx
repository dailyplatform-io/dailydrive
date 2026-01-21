import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Car } from '../models/Car';

interface FavoritesContextValue {
  favorites: Car[];
  toggleFavorite: (car: Car) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

const STORAGE_KEY = 'dailydrive.favorites';

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Car[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Car[];
      if (Array.isArray(parsed)) setFavorites(parsed);
    } catch {
      // Ignore malformed data to avoid blocking the UI.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

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
