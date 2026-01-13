import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Car } from '../../models/Car';
import {
  fetchOwnerCarsFromAPI,
  getOwnerCars,
  setOwnerCars as persistOwnerCars,
} from '../../service/carService';
import {
  dataUrlToBlob,
  putImageBlob,
  createImageThumbnailDataUrl,
} from '../../service/imageStore';

export function useDashboardCars() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ownerCars, setOwnerCars] = useState<Car[]>([]);
  const [loadingCars, setLoadingCars] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const requireAuthToken = useCallback(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      navigate('/login', { replace: true });
      throw new Error('Missing auth token');
    }
    return token;
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

  // Migrate legacy image URLs to blob storage
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
      const fallback = getOwnerCars().filter((c) => c.ownerId === user.id);
      setOwnerCars(fallback);
    } finally {
      setLoadingCars(false);
    }
  }, [user?.id]);

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

  return {
    ownerCars,
    myCarsAllStatuses,
    loadingCars,
    requireAuthToken,
    replaceOwnerCarState,
    removeOwnerCarState,
    refreshCars: () => setRefreshKey((k) => k + 1),
  };
}
