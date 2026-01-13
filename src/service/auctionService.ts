import { apiUrl } from '../config/api';
import { Auction } from '../models/Auction';
import { detectTokenExpirationFromResponse, clearAuthTokens } from '../utils/tokenUtils';

const headers = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const getToken = () => localStorage.getItem('authToken') || undefined;

const parseError = async (response: Response) => {
  try {
    const data = await response.json();
    return data?.message || response.statusText;
  } catch {
    return response.statusText || 'Request failed';
  }
};

const MOCK_AUCTIONS: Auction[] = [
  {
    id: 'mock-1',
    carId: 'car-mock-1',
    startPriceEur: 8500,
    buyNowPriceEur: 11000,
    currentPriceEur: 9200,
    startsAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    hasStarted: true,
    hasEnded: false,
    issues: ['front bumper', 'rear scratch', 'engine light'],
    imageUrls: [
      'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg',
      'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg',
    ],
    videoUrls: [],
    bids: [
      { id: 'b1', bidderName: 'Alex D.', amountEur: 8900, createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
      { id: 'b2', bidderName: 'Mira K.', amountEur: 9200, createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
    ],
    car: {
      id: 'car-mock-1',
      ownerName: 'Blue Motors',
      ownerProfileType: 'buy',
      brand: 'BMW',
      model: '3 Series',
      subtitle: '320d M Sport',
      year: 2019,
      bodyStyle: 'Sedan',
      fuelType: 'Diesel',
      transmission: 'Automatic',
      enginePowerHp: 190,
      engineVolumeL: 2.0,
      seats: 5,
      doors: 4,
      color: 'Black',
      exteriorColor: 'Black',
      interiorColor: 'Black',
      mileageKm: 72000,
      isForRent: false,
      isForSale: true,
      rentPricePerHour: 0,
      rentPricePerDay: 0,
      salePrice: 11200,
      accidentsCount: 0,
      ownersCount: 1,
      serviceHistory: 'Full service history',
      description: 'Well maintained, M Sport package, new brakes.',
      optionsGroups: [],
      fees: 0,
      taxes: 0,
      rating: 0,
      reviewsCount: 0,
      distanceMeters: 0,
      distanceText: '',
      availableNow: true,
      imageUrl: 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg',
      listingStatus: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      location: {
        city: 'Tirana',
        fullAddress: 'Rruga Kavajes',
        mapLabel: 'Tirana center',
        lat: 41.3275,
        lng: 19.8187,
      },
      ownerId: 'owner-1',
      ownerPhone: '+355 68 000 0000',
      ownerSlug: 'blue-motors',
      ownerInstagram: '',
      ownerFacebook: '',
      imageIds: [],
      coverImageId: '',
      availableIn: undefined,
    },
  },
  {
    id: 'mock-2',
    carId: 'car-mock-2',
    startPriceEur: 4500,
    buyNowPriceEur: null,
    currentPriceEur: 4500,
    startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    hasStarted: false,
    hasEnded: false,
    issues: ['front', 'rear'],
    imageUrls: ['https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg'],
    videoUrls: [],
    bids: [],
    car: {
      id: 'car-mock-2',
      ownerName: 'AutoTe Cunat',
      ownerProfileType: 'buy',
      brand: 'Audi',
      model: 'A3',
      subtitle: '1.6 TDI',
      year: 2015,
      bodyStyle: 'Hatchback',
      fuelType: 'Diesel',
      transmission: 'Manual',
      enginePowerHp: 110,
      engineVolumeL: 1.6,
      seats: 5,
      doors: 5,
      color: 'Grey',
      exteriorColor: 'Grey',
      interiorColor: 'Black',
      mileageKm: 138000,
      isForRent: false,
      isForSale: true,
      rentPricePerHour: 0,
      rentPricePerDay: 0,
      salePrice: 5200,
      accidentsCount: 1,
      ownersCount: 2,
      serviceHistory: 'Regular maintenance, timing belt replaced.',
      description: 'Solid commuter car, upcoming auction starts soon.',
      optionsGroups: [],
      fees: 0,
      taxes: 0,
      rating: 0,
      reviewsCount: 0,
      distanceMeters: 0,
      distanceText: '',
      availableNow: true,
      imageUrl: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg',
      listingStatus: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      location: {
        city: 'Durres',
        fullAddress: 'Port area',
        mapLabel: 'Durres',
        lat: 41.3231,
        lng: 19.4414,
      },
      ownerId: 'owner-2',
      ownerPhone: '+355 69 111 1111',
      ownerSlug: 'auto-te-cunat',
      ownerInstagram: '',
      ownerFacebook: '',
      imageIds: [],
      coverImageId: '',
      availableIn: undefined,
    },
  },
];

export const fetchAuctions = async (): Promise<Auction[]> => {
  try {
    const response = await fetch(apiUrl('/auctions'));
    if (!response.ok) {
      throw new Error(await parseError(response));
    }
    const data = (await response.json()) as Auction[];
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    console.warn('Auctions API returned empty, using mock data');
    return MOCK_AUCTIONS;
  } catch (err) {
    console.warn('Auctions API failed, showing mock data', err);
    return MOCK_AUCTIONS;
  }
};

export const placeBid = async (auctionId: string, amountEur: number, displayName?: string): Promise<Auction> => {
  const token = getToken();
  const response = await fetch(apiUrl(`/auctions/${auctionId}/bids`), {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ amountEur, displayName }),
  });

  const message = await parseError(response);
  if (!response.ok) {
    if (detectTokenExpirationFromResponse(message, response.status)) {
      clearAuthTokens();
    }
    throw new Error(message);
  }

  try {
    return (await response.json()) as Auction;
  } catch {
    throw new Error('Failed to read auction response.');
  }
};
