export type RentalType = 'any' | 'per_day' | 'per_hour';

export type FuelType = 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid';

export type Transmission = 'Manual' | 'Automatic' | 'CVT';

export type BodyStyle =
  | 'Sedan'
  | 'Hatchback'
  | 'SUV'
  | 'Coupe'
  | 'Sport coupe'
  | 'Pickup'
  | 'Crossover'
  | 'Van'
  | 'Wagon';

export interface Car {
  id: string;
  ownerId?: string;
  ownerName?: string;
  ownerProfileType?: string;
  ownerIsPrivate?: boolean;
  ownerPhone?: string;
  ownerSlug?: string;
  ownerInstagram?: string;
  ownerFacebook?: string;
  listingStatus?: 'active' | 'inactive' | 'sold' | 'deleted';
  imageIds?: string[];
  coverImageId?: string;
  availableIn?: '1w' | '2w' | '3w' | '1m' | '2m';
  carMakeId?: number;
  carModelId?: number;
  brand: string;
  model: string;
  subtitle?: string;
  year: number;
  bodyStyle: BodyStyle;
  fuelType: FuelType;
  transmission: Transmission;
  enginePowerHp?: number;
  engineVolumeL?: number;
  seats: number;
  doors: number;
  color: string;
  exteriorColor: string;
  interiorColor: string;
  mileageKm: number;
  isForRent: boolean;
  isForSale: boolean;
  rentPricePerHour?: number;
  rentPricePerDay?: number;
  salePrice?: number;
  accidentsCount?: number;
  ownersCount?: number;
  serviceHistory?: string;
  description?: string;
  optionsGroups?: { title: string; items: string[] }[];
  fees?: number;
  taxes?: number;
  rating: number;
  reviewsCount: number;
  distanceMeters: number;
  distanceText: string;
  availableNow: boolean;
  imageUrl: string;
  createdAt?: string;
  updatedAt?: string;
  location: {
    city: string;
    fullAddress: string;
    mapLabel: string;
    lat?: number;
    lng?: number;
  };
}
