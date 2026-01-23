import type { FuelType, Transmission } from '../models/Car';

type Translator = (key: string) => string;

const fuelKeyMap: Record<FuelType, string> = {
  Gasoline: 'vehicle.fuel.gasoline',
  Diesel: 'vehicle.fuel.diesel',
  Hybrid: 'vehicle.fuel.hybrid',
  Electric: 'vehicle.fuel.electric',
  Gas: 'vehicle.fuel.gas',
  'Gasoline/Gas': 'vehicle.fuel.gasolineGas',
};

const transmissionKeyMap: Record<Transmission, string> = {
  Manual: 'vehicle.transmission.manual',
  Automatic: 'vehicle.transmission.automatic',
  CVT: 'vehicle.transmission.cvt',
};

const colorKeyMap: Record<string, string> = {
  black: 'vehicle.color.black',
  white: 'vehicle.color.white',
  gray: 'vehicle.color.gray',
  grey: 'vehicle.color.gray',
  silver: 'vehicle.color.silver',
  blue: 'vehicle.color.blue',
  red: 'vehicle.color.red',
  green: 'vehicle.color.green',
  brown: 'vehicle.color.brown',
  beige: 'vehicle.color.beige',
  yellow: 'vehicle.color.yellow',
  orange: 'vehicle.color.orange',
};

const translateOrFallback = (t: Translator, key: string, fallback: string) => {
  const value = t(key);
  return value === key ? fallback : value;
};

export const getFuelLabel = (t: Translator, fuel?: FuelType) => {
  if (!fuel) return '';
  const key = fuelKeyMap[fuel];
  return key ? translateOrFallback(t, key, fuel) : fuel;
};

export const getTransmissionLabel = (t: Translator, transmission?: Transmission) => {
  if (!transmission) return '';
  const key = transmissionKeyMap[transmission];
  return key ? translateOrFallback(t, key, transmission) : transmission;
};

export const getColorLabel = (t: Translator, color?: string) => {
  if (!color) return '';
  const key = colorKeyMap[color.trim().toLowerCase()];
  return key ? translateOrFallback(t, key, color) : color;
};
