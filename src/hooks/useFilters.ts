import { useEffect, useMemo, useState } from 'react';
import { BodyStyle, Car, FuelType, Transmission } from '../models/Car';
import { CarMake, CarModel } from '../models/CarMakeModel';
import { optionGroupTitleLookup, optionLabelLookup } from '../constants/optionCatalog';

export interface FilterState {
  search: string;
  availableNow: boolean;
  priceFrom: number;
  priceTo: number;
  selectedBrands: string[]; // Keep for backward compatibility
  selectedMakeIds: number[]; // New field for make IDs
  selectedModelIds: number[]; // New field for model IDs
  selectedBodyStyles: BodyStyle[];
  yearFrom: number;
  yearTo: number;
  mileageFrom: number;
  mileageTo: number;
  selectedFuelTypes: FuelType[];
  selectedTransmissions: Transmission[];
  minSeats: number;
  selectedExteriorColors: string[];
  selectedInteriorColors: string[];
  selectedRegistration: string[];
}

export interface FilterBounds {
  priceMaxBuy: number;
  priceMaxRent: number;
  minYear: number;
  maxYear: number;
  minMileage: number;
  maxMileage: number;
}

const getFilterBounds = (allCars: Car[]): FilterBounds => {
  const years = allCars.map((c) => c.year);
  const mileages = allCars.map((c) => c.mileageKm);
  const rentPrices = allCars
    .filter((c) => c.isForRent)
    .map((c) => c.rentPricePerDay ?? c.rentPricePerHour ?? 0)
    .filter((p) => typeof p === 'number' && Number.isFinite(p) && p > 0);

  return {
    priceMaxBuy: 200000,
    priceMaxRent: rentPrices.length ? Math.max(...rentPrices) : 150,
    minYear: Math.min(...years),
    maxYear: Math.max(...years),
    minMileage: 0,
    maxMileage: Math.max(...mileages, 100000),
  };
};

const initialFilterState = (mode: 'rent' | 'buy', bounds: FilterBounds): FilterState => ({
  search: '',
  availableNow: false,
  priceFrom: 0,
  priceTo: mode === 'buy' ? bounds.priceMaxBuy : bounds.priceMaxRent,
  selectedBrands: [],
  selectedMakeIds: [],
  selectedModelIds: [],
  selectedBodyStyles: [],
  yearFrom: bounds.minYear,
  yearTo: bounds.maxYear,
  mileageFrom: bounds.minMileage,
  mileageTo: bounds.maxMileage,
  selectedFuelTypes: [],
  selectedTransmissions: [],
  minSeats: 0,
  selectedExteriorColors: [],
  selectedInteriorColors: [],
  selectedRegistration: [],
});

export const useFilters = (allCars: Car[], mode: 'rent' | 'buy', carMakes: CarMake[] = [], carModels: CarModel[] = []) => {
  const bounds = useMemo(() => getFilterBounds(allCars), [allCars]);
  const [filters, setFilters] = useState<FilterState>(() => initialFilterState(mode, bounds));

  useEffect(() => {
    setFilters(initialFilterState(mode, bounds));
  }, [mode, bounds]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(initialFilterState(mode, bounds));

  const filtered = useMemo(() => {
    return allCars.filter((car) => {
      const matchesSearch =
        car.brand.toLowerCase().includes(filters.search.toLowerCase()) ||
        car.model.toLowerCase().includes(filters.search.toLowerCase()) ||
        (car.subtitle ?? '').toLowerCase().includes(filters.search.toLowerCase());

      const matchesRentalType = mode === 'buy' || car.isForRent;

      const matchesAvailable = filters.availableNow ? car.availableNow : true;

      const priceValue =
        mode === 'buy'
          ? car.salePrice ?? Number.POSITIVE_INFINITY
          : car.rentPricePerDay ?? car.rentPricePerHour ?? Number.POSITIVE_INFINITY;
      const matchesPrice = priceValue >= filters.priceFrom && priceValue <= filters.priceTo;

      const matchesBrand =
        filters.selectedBrands.length === 0 || filters.selectedBrands.includes(car.brand);

      // Enhanced make filtering - check both ID-based and string-based matching
      let matchesMake = filters.selectedMakeIds.length === 0;
      if (!matchesMake) {
        // First try ID-based matching
        if (car.carMakeId !== undefined && filters.selectedMakeIds.includes(car.carMakeId)) {
          matchesMake = true;
        } else {
          // Fallback to string-based matching using available makes data
          const selectedMakeNames = filters.selectedMakeIds
            .map(id => carMakes.find(make => make.id === id)?.name)
            .filter(Boolean);
          matchesMake = selectedMakeNames.some(name => 
            name?.toLowerCase() === car.brand.toLowerCase()
          );
        }
      }

      // Enhanced model filtering - check both ID-based and string-based matching
      let matchesModel = filters.selectedModelIds.length === 0;
      if (!matchesModel) {
        // First try ID-based matching
        if (car.carModelId !== undefined && filters.selectedModelIds.includes(car.carModelId)) {
          matchesModel = true;
        } else {
          // Fallback to string-based matching using available models data
          const selectedModelNames = filters.selectedModelIds
            .map(id => carModels.find(model => model.id === id)?.name)
            .filter(Boolean);
          matchesModel = selectedModelNames.some(name => 
            name?.toLowerCase() === car.model.toLowerCase()
          );
        }
      }

      // Use either legacy brand filtering or new make filtering
      const matchesBrandOrMake = matchesBrand || matchesMake;

      const matchesBody =
        filters.selectedBodyStyles.length === 0 || filters.selectedBodyStyles.includes(car.bodyStyle);

      const matchesYear = car.year >= filters.yearFrom && car.year <= filters.yearTo;
      const matchesMileage = car.mileageKm >= filters.mileageFrom && car.mileageKm <= filters.mileageTo;

      const matchesFuel =
        filters.selectedFuelTypes.length === 0 || filters.selectedFuelTypes.includes(car.fuelType);

      const matchesTransmission =
        filters.selectedTransmissions.length === 0 || filters.selectedTransmissions.includes(car.transmission);

      const matchesSeats = filters.minSeats === 0 || car.seats >= filters.minSeats;

      const exteriorColor = car.exteriorColor ?? car.color;
      const interiorColor = car.interiorColor ?? '';

      const matchesExterior =
        filters.selectedExteriorColors.length === 0 || filters.selectedExteriorColors.includes(exteriorColor);

      const matchesInterior =
        filters.selectedInteriorColors.length === 0 || (interiorColor && filters.selectedInteriorColors.includes(interiorColor));

      const matchesRegistration = (() => {
        if (filters.selectedRegistration.length === 0) return true;
        const registrationGroup = car.optionsGroups?.find((group) => {
          const normalized = optionGroupTitleLookup.get(group.title) ?? group.title;
          return normalized === 'options.group.registration';
        });
        if (!registrationGroup) return false;
        const selectedKeys = filters.selectedRegistration.map((value) => optionLabelLookup.get(value) ?? value);
        return registrationGroup.items.some((item) => {
          const itemKey = optionLabelLookup.get(item) ?? item;
          return selectedKeys.includes(itemKey);
        });
      })();

      return (
        matchesSearch &&
        matchesRentalType &&
        matchesAvailable &&
        matchesPrice &&
        matchesBrandOrMake &&
        matchesModel &&
        matchesBody &&
        matchesYear &&
        matchesMileage &&
        matchesFuel &&
        matchesTransmission &&
        matchesSeats &&
        matchesExterior &&
        matchesInterior &&
        matchesRegistration
      );
    });
  }, [allCars, filters, mode, carMakes, carModels]);

  return {
    filters,
    updateFilter,
    resetFilters,
    filtered,
    bounds,
  };
};
