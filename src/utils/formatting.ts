import { Car } from '../models/Car';

export const formatPrice = (value?: number) => {
  if (value === undefined || value === null) return '—';
  const fractionDigits = value < 100 ? 2 : 0;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatDistance = (meters: number) => {
  if (meters < 1000) return `${meters}m`;
  const km = meters / 1000;
  return `${km.toFixed(1)}km`;
};

export const getPriceLabel = (car: Car) => {
  if (car.isForRent && car.rentPricePerDay) {
    return `${formatPrice(car.rentPricePerDay)} / day`;
  }
  if (car.isForRent && car.rentPricePerHour) {
    return `${formatPrice(car.rentPricePerHour)} / day`;
  }
  if (car.isForSale && car.salePrice) {
    return formatPrice(car.salePrice);
  }
  return 'Contact';
};
