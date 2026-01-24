import { Car, BodyStyle } from '../models/Car';
import { detectTokenExpirationFromResponse, clearAuthTokens, handleApiError } from '../utils/tokenUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const OWNER_CARS_KEY = 'dailydrive.ownerCars';

const safeParseJSON = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const getOwnerCars = (): Car[] => safeParseJSON<Car[]>(localStorage.getItem(OWNER_CARS_KEY), []);

export const setOwnerCars = (next: Car[]) => {
  const compacted = next.map((car) => {
    const unsafe = car as unknown as Record<string, unknown>;
    const { imageUrls: _imageUrls, coverImageUrl: _coverImageUrl, ...rest } = unsafe;
    return rest as unknown as Car;
  });
  try {
    localStorage.setItem(OWNER_CARS_KEY, JSON.stringify(compacted));
  } catch (err) {
    console.error('Failed to persist owner cars', err);
    throw err;
  }
};

export const upsertOwnerCar = (car: Car) => {
  const current = getOwnerCars();
  const idx = current.findIndex((c) => c.id === car.id);
  const merged = idx === -1 ? [car, ...current] : current.map((c) => (c.id === car.id ? car : c));
  setOwnerCars(merged);
};

export const softDeleteOwnerCar = (id: string) => {
  const current = getOwnerCars();
  setOwnerCars(current.map((c) => (c.id === id ? { ...c, listingStatus: 'deleted' } : c)));
};

export const isCarVisibleInMarketplace = (car: Car) => {
  if (car.listingStatus === 'deleted') return false;
  if (car.listingStatus === 'inactive') return false;
  if (car.isForSale && car.listingStatus === 'sold') return false;
  return true;
};

const authHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const toApiBodyStyle = (bodyStyle?: BodyStyle | string | null) => {
  const map: Record<string, string> = {
    SUV: 'Suv',
    'Sport coupe': 'SportCoupe',
  };
  if (!bodyStyle) return undefined;
  return map[String(bodyStyle)] ?? String(bodyStyle);
};

const toApiListingStatus = (status?: Car['listingStatus']) => {
  if (!status) return undefined;
  if (status === 'active') return 'Active';
  if (status === 'inactive') return 'Inactive';
  if (status === 'sold') return 'Sold';
  if (status === 'deleted') return 'Deleted';
  return undefined;
};

const mapApiCarToModel = (apiCar: any): Car => {
  return {
    id: apiCar.id || apiCar.carId || String(Math.random()),
    ownerId: apiCar.ownerId ?? apiCar.ownerID ?? apiCar.owner?.id,
    ownerName:
      apiCar.ownerName ||
      apiCar.sellerName ||
      apiCar.companyName ||
      apiCar.owner?.sellerName ||
      apiCar.owner?.companyName ||
      apiCar.owner?.name,
    ownerProfileType: apiCar.ownerProfileType,
    ownerIsPrivate:
      typeof apiCar.ownerIsPrivate === 'boolean'
        ? apiCar.ownerIsPrivate
        : typeof apiCar.owner?.isPrivateOwner === 'boolean'
          ? apiCar.owner.isPrivateOwner
          : undefined,
    ownerPhone: apiCar.ownerPhone || apiCar.phone || apiCar.owner?.phoneNumber,
    ownerSlug:
      apiCar.ownerSlug ||
      apiCar.sellerSlug ||
      apiCar.owner?.sellerSlug,
    ownerInstagram:
      apiCar.ownerInstagram ||
      apiCar.instagramName ||
      apiCar.owner?.instagramName ||
      apiCar.owner?.instagram,
    ownerFacebook:
      apiCar.ownerFacebook ||
      apiCar.facebookName ||
      apiCar.owner?.facebookName ||
      apiCar.owner?.facebook,
    brand: apiCar.brand || '',
    model: apiCar.model || '',
    subtitle: apiCar.subtitle || apiCar.trim || '',
    year: apiCar.year || new Date().getFullYear(),
    bodyStyle: apiCar.bodyStyle || apiCar.bodyType || '',
    fuelType: apiCar.fuelType || '',
    transmission: apiCar.transmission || '',
    enginePowerHp: apiCar.enginePowerHp || apiCar.horsepower || 0,
    engineVolumeL: apiCar.engineVolumeL || apiCar.engineSize || 0,
    seats: apiCar.seats || apiCar.seatingCapacity || 5,
    doors: apiCar.doors || 4,
    color: apiCar.color || apiCar.exteriorColor || '',
    exteriorColor: apiCar.exteriorColor || apiCar.color || '',
    interiorColor: apiCar.interiorColor || '',
    mileageKm: apiCar.mileageKm || apiCar.mileage || 0,
    isForRent: apiCar.isForRent || false,
    isForSale: apiCar.isForSale || false,
    rentPricePerHour: apiCar.rentPricePerHour || apiCar.hourlyRate || 0,
    rentPricePerDay: apiCar.rentPricePerDay || apiCar.dailyRate || 0,
    salePrice: apiCar.salePrice || apiCar.price || 0,
    accidentsCount: typeof apiCar.accidentsCount === 'number' ? apiCar.accidentsCount : apiCar.accidents ?? 0,
    ownersCount: typeof apiCar.ownersCount === 'number' ? apiCar.ownersCount : apiCar.owners ?? 1,
    serviceHistory: apiCar.serviceHistory ?? apiCar.maintenanceHistory ?? '',
    description: apiCar.description ?? '',
    optionsGroups: toOptionGroupsFromApi(apiCar.optionsGroups ?? apiCar.options ?? apiCar.features),
    fees: typeof apiCar.fees === 'number' ? apiCar.fees : (typeof apiCar.insurance === 'number' ? apiCar.insurance : undefined),
    taxes: typeof apiCar.taxes === 'number' ? apiCar.taxes : (typeof apiCar.tax === 'number' ? apiCar.tax : undefined),
    rating: apiCar.rating || 0,
    reviewsCount: apiCar.reviewsCount || 0,
    distanceMeters: apiCar.distanceMeters || 0,
    distanceText: apiCar.distanceText || '',
    availableNow: apiCar.availableNow !== false,
    imageUrl: apiCar.imageUrl || apiCar.primaryImageUrl || apiCar.images?.[0] || '',
    // Image-related fields - properly map image IDs and cover image
    imageIds: Array.isArray(apiCar.imageIds) 
      ? apiCar.imageIds.map((id: any) => String(id)) 
      : [],
    coverImageId: apiCar.coverImageId ? String(apiCar.coverImageId) : undefined,
    location: {
      city: apiCar.location?.city || apiCar.city || '',
      fullAddress: apiCar.location?.fullAddress || apiCar.address || '',
      mapLabel: apiCar.location?.mapLabel || apiCar.pickupLocation || '',
      lat: apiCar.location?.lat ?? apiCar.lat ?? apiCar.latitude ?? undefined,
      lng: apiCar.location?.lng ?? apiCar.lng ?? apiCar.longitude ?? undefined,
    },
    listingStatus: apiCar.listingStatus || 'active',
    createdAt: apiCar.createdAt,
    updatedAt: apiCar.updatedAt,
    availableIn: apiCar.availableIn,
  };
};

const getApiError = async (response: Response) => {
  try {
    const data = await response.json();
    const message = data?.message || 'Request failed';
    
    // Check for token expiration using enhanced detection with response
    const { isTokenExpired } = handleApiError(message, undefined, response);
    
    if (isTokenExpired) {
      return `401: ${message}`;
    }
    
    // Include status code in error for authentication handling
    if (response.status === 401) {
      return `401: ${message}`;
    }
    
    return message;
  } catch {
    const statusText = response.statusText || 'Request failed';
    
    // Check for token expiration in status text with response headers
    const { isTokenExpired } = handleApiError(statusText, undefined, response);
    
    if (isTokenExpired) {
      return `401: ${statusText}`;
    }
    
    // Include status code for non-JSON responses
    if (response.status === 401) {
      return `401: ${statusText}`;
    }
    
    return statusText;
  }
};

const toOptionGroups = (groups?: { title: string; items: string[] }[]) =>
  groups?.map((g) => ({ title: g.title, items: g.items })) ?? [];

const toOptionGroupsFromApi = (groups: any): { title: string; items: string[] }[] => {
  if (!Array.isArray(groups)) return [];
  return groups.map((g) => ({
    title: g?.title ?? '',
    items: Array.isArray(g?.items) ? g.items.filter((i: unknown): i is string => typeof i === 'string') : [],
  }));
};

const nullIfEmptyNumber = (value?: number | null) =>
  typeof value !== 'number' || Number.isNaN(value) || value <= 0 ? null : value;

const mapCarToCreateRequest = (car: Car) => ({
  ownerId: car.ownerId,
  brand: car.brand,
  model: car.model,
  subtitle: car.subtitle,
  year: car.year,
  bodyStyle: toApiBodyStyle(car.bodyStyle) ?? 'Sedan',
  fuelType: car.fuelType,
  transmission: car.transmission,
  enginePowerHp: nullIfEmptyNumber(car.enginePowerHp),
  engineVolumeL: car.engineVolumeL ?? 0,
  seats: nullIfEmptyNumber(car.seats),
  doors: nullIfEmptyNumber(car.doors),
  color: car.color,
  exteriorColor: car.exteriorColor,
  interiorColor: car.interiorColor,
  mileageKm: nullIfEmptyNumber(car.mileageKm),
  isForRent: car.isForRent,
  isForSale: car.isForSale,
  rentPricePerHour: car.rentPricePerHour ?? 0,
  rentPricePerDay: car.rentPricePerDay ?? 0,
  salePrice: car.salePrice ?? 0,
  accidentsCount: car.accidentsCount ?? 0,
  ownersCount: car.ownersCount ?? 1,
  serviceHistory: car.serviceHistory,
  description: car.description,
  optionsGroups: toOptionGroups(car.optionsGroups),
  fees: nullIfEmptyNumber(car.fees),
  taxes: nullIfEmptyNumber(car.taxes),
  rating: car.rating ?? 0,
  reviewsCount: car.reviewsCount ?? 0,
  distanceMeters: car.distanceMeters ?? 0,
  distanceText: car.distanceText ?? '',
  availableNow: car.availableNow,
  coverImageId: car.coverImageId ? car.coverImageId : null,
  imageIds: (car.imageIds ?? []).filter(Boolean),
  location: {
    city: car.location.city,
    fullAddress: car.location.fullAddress,
    mapLabel: car.location.mapLabel,
    lat: typeof car.location.lat === 'number' ? car.location.lat : null,
    lng: typeof car.location.lng === 'number' ? car.location.lng : null,
  },
  availableIn: car.availableIn ?? null,
});

const mapCarToUpdateRequest = (car: Car) => ({
  brand: car.brand,
  model: car.model,
  subtitle: car.subtitle,
  year: car.year,
  bodyStyle: toApiBodyStyle(car.bodyStyle),
  fuelType: car.fuelType,
  transmission: car.transmission,
  enginePowerHp: nullIfEmptyNumber(car.enginePowerHp),
  engineVolumeL: car.engineVolumeL,
  seats: nullIfEmptyNumber(car.seats),
  doors: nullIfEmptyNumber(car.doors),
  color: car.color,
  exteriorColor: car.exteriorColor,
  interiorColor: car.interiorColor,
  mileageKm: nullIfEmptyNumber(car.mileageKm),
  isForRent: car.isForRent,
  isForSale: car.isForSale,
  rentPricePerHour: car.rentPricePerHour,
  rentPricePerDay: car.rentPricePerDay,
  salePrice: car.salePrice,
  accidentsCount: car.accidentsCount,
  ownersCount: car.ownersCount,
  serviceHistory: car.serviceHistory,
  description: car.description,
  optionsGroups: toOptionGroups(car.optionsGroups),
  fees: nullIfEmptyNumber(car.fees),
  taxes: nullIfEmptyNumber(car.taxes),
  rating: car.rating,
  reviewsCount: car.reviewsCount,
  distanceMeters: car.distanceMeters,
  distanceText: car.distanceText,
  availableNow: car.availableNow,
  coverImageId: car.coverImageId,
  imageIds: (car.imageIds ?? []).filter(Boolean),
  location: {
    city: car.location.city,
    fullAddress: car.location.fullAddress,
    mapLabel: car.location.mapLabel,
    lat: car.location.lat,
    lng: car.location.lng,
  },
  listingStatus: toApiListingStatus(car.listingStatus),
  availableIn: car.availableIn,
});

export const fetchOwnerCarsFromAPI = async (ownerId: string, token?: string): Promise<Car[]> => {
  const url = `${API_BASE_URL}/cars?ownerId=${encodeURIComponent(ownerId)}`;
  const response = await fetch(url, { headers: authHeaders(token) });
  if (!response.ok) {
    throw new Error(await getApiError(response));
  }
  const data = await response.json();
  const list = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  return list.map(mapApiCarToModel);
};

export const createCarInAPI = async (car: Car, token: string): Promise<Car> => {
  const payload = mapCarToCreateRequest(car);
  const response = await fetch(`${API_BASE_URL}/cars`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await getApiError(response));
  }
  const data = await response.json();
  const dto = data?.car ?? data?.data ?? data;
  return mapApiCarToModel(dto);
};

export const updateCarInAPI = async (car: Car, token: string): Promise<Car> => {
  const payload = mapCarToUpdateRequest(car);
  const response = await fetch(`${API_BASE_URL}/cars/${car.id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await getApiError(response));
  }
  const data = await response.json();
  const dto = data?.car ?? data?.data ?? data;
  return mapApiCarToModel(dto);
};

// API fetch functions
export const fetchCarsFromAPI = async (mode?: 'rent' | 'buy'): Promise<Car[]> => {
  try {
    const params = new URLSearchParams();
    if (mode === 'rent') {
      params.append('isForRent', 'true');
    } else if (mode === 'buy') {
      params.append('isForSale', 'true');
    }
    
    const url = `${API_BASE_URL}/cars${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch cars from API');
    }
    
    const data = await response.json();
    
    // Handle paginated response
    if (data.items && Array.isArray(data.items)) {
      return data.items.map(mapApiCarToModel);
    }
    
    // Handle direct array response
    if (Array.isArray(data)) {
      return data.map(mapApiCarToModel);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching cars from API:', error);
    throw error;
  }
};

export const fetchCarByIdFromAPI = async (id: string): Promise<Car | undefined> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cars/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch car from API');
    }
    const data = await response.json();
    const dto = data?.car ?? data?.data ?? data;
    return dto ? mapApiCarToModel(dto) : undefined;
  } catch (err) {
    console.error('Error fetching car by id from API', err);
    return undefined;
  }
};

export const getAllCars = async (): Promise<Car[]> => {
  return fetchCarsFromAPI();
};

export const getCarById = async (id: string): Promise<Car | undefined> => {
  return fetchCarByIdFromAPI(id);
};
