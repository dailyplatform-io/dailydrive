import { Car, BodyStyle, FuelType, Transmission } from '../../models/Car';
import { OwnerProfileType } from '../../context/AuthContext';
import { featureGroupTitleKey, featureOptions, selectOptionGroups as selectCatalog } from '../../constants/optionCatalog';

export type CarsSubtab = 'all' | 'active' | 'inactive' | 'deleted' | 'sold';

export const bodyStyleOptions: BodyStyle[] = ['Hatchback', 'SUV', 'Sedan', 'Sport coupe'];
export const fuelTypeOptions: FuelType[] = ['Gasoline', 'Diesel', 'Hybrid', 'Electric'];
export const transmissionOptions: Transmission[] = ['Manual', 'Automatic', 'CVT'];

export const featureOptionGroups: { titleKey: string; items: { value: string; labelKey: string }[] }[] = [
  {
    titleKey: featureGroupTitleKey,
    items: [...featureOptions],
  },
];

export const selectOptionGroups = [...selectCatalog];

export const defaultOptionGroups: { title: string; items: string[] }[] = [
  ...featureOptionGroups.map((group) => ({ title: group.titleKey, items: [] })),
  ...selectOptionGroups.map((group) => ({ title: group.titleKey, items: [] })),
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
