import { Car, BodyStyle, FuelType, Transmission } from '../../models/Car';
import { OwnerProfileType } from '../../context/AuthContext';

export type CarsSubtab = 'all' | 'active' | 'inactive' | 'deleted' | 'sold';

export const bodyStyleOptions: BodyStyle[] = ['Hatchback', 'SUV', 'Sedan', 'Sport coupe'];
export const fuelTypeOptions: FuelType[] = ['Gasoline', 'Diesel', 'Hybrid', 'Electric'];
export const transmissionOptions: Transmission[] = ['Manual', 'Automatic', 'CVT'];

export const featureOptionGroups: { title: string; items: string[] }[] = [
  {
    title: 'Opsionet',
    items: [
      'Distronic Plus',
      'Ruajtja e Korsise',
      'Vetparkim',
      'Tavan Panoramik',
      'Ndezje me Buton',
      'Fenere Xenon',
      'Pasqyra me Ngrohje',
      'Pasqyra Elektrike',
      'Sedilje me Masazh',
      'Ngrohje & Ftohje Sediljesh',
      'Kroskot Dixhital',
      'TV Mbrapa',
      'Tavan Kamosh',
      'Bagazh me Buton',
      'Ndricim Ambienti',
      'Fenere Full LED',
      'Xhama te Zi',
      'Sensor Shiu',
      'Sensor Dritash',
      'Komanda ne Timon',
      'Distance Display',
      'Trekendesh ne pasqyre',
      'Navigator',
      'Sensor Parkimi',
      'Goma te Reja',
      'Cruise Control',
      'Eco Mode',
    ],
  },
];

export const selectOptionGroups: { title: string; options: string[] }[] = [
  {
    title: 'Klima',
    options: ['2 zona', '4 zona'],
  },
  {
    title: 'Sallon',
    options: ['Sallon Lekure', 'Sallon Robe', 'Sallon Kamosh'],
  },
  {
    title: 'Traksioni',
    options: ['Traksioni 4x4 (4 matic)', 'Diferencial mbrapa (RWD)', 'Diferencial para'],
  },
  {
    title: 'Sedilje me ngrohje',
    options: ['Jo', 'Para', 'Mbrapa', 'Para dhe Mbrapa'],
  },
  {
    title: 'Leje/Targa',
    options: ['Me letra/Targa', 'Me targa', 'Me dogane', 'Pa dogane'],
  },
];

export const defaultOptionGroups: { title: string; items: string[] }[] = [
  ...featureOptionGroups,
  ...selectOptionGroups.map((group) => ({ title: group.title, items: [] })),
];

export function emptyCarDraft(profileType: OwnerProfileType, ownerId: string, ownerAddress: { city: string; address: string }): Car {
  const isForRent = profileType === 'rent';
  const isForSale = profileType === 'buy';
  return {
    id: crypto.randomUUID(),
    ownerId,
    listingStatus: 'active',
    imageIds: [],
    coverImageId: undefined,
    brand: '',
    model: '',
    subtitle: '',
    year: new Date().getFullYear(),
    bodyStyle: 'Sedan',
    fuelType: 'Gasoline',
    transmission: 'Automatic',
  enginePowerHp: 120,
  engineVolumeL: 2.0,
  seats: 5,
  doors: 4,
  color: 'Black',
  exteriorColor: 'Black',
  interiorColor: 'Black',
  mileageKm: undefined as unknown as number,
  isForRent,
  isForSale,
  rentPricePerDay: isForRent ? 50 : undefined,
  salePrice: isForSale ? 10000 : undefined,
  accidentsCount: undefined,
  ownersCount: undefined,
  serviceHistory: '',
  description: '',
  optionsGroups: defaultOptionGroups.map((g) => ({ title: g.title, items: [] })),
  fees: undefined,
  taxes: undefined,
    rating: 4.8,
    reviewsCount: 0,
    distanceMeters: 0,
    distanceText: '—',
    availableNow: true,
    imageUrl: '',
    location: {
      city: ownerAddress.city,
      fullAddress: ownerAddress.address,
      mapLabel: 'Owner location',
      lat: undefined,
      lng: undefined,
    },
  };
}

export function getOwnerBillingCount(profileType: OwnerProfileType, cars: Car[]) {
  const active = cars.filter((c) => c.listingStatus !== 'deleted');
  if (profileType === 'rent') return active.length;
  return active.filter((c) => c.isForSale && c.listingStatus === 'active').length;
}
