import { useEffect, useMemo, useRef, useState } from 'react';
import { BodyStyle, FuelType, Transmission } from '../models/Car';
import { CarMake, CarModel } from '../models/CarMakeModel';
import { fetchCarMakes, fetchCarModelsByMake } from '../service/carMakeModelService';
import { FilterBounds, FilterState } from '../hooks/useFilters';
import { ChevronDownIcon, CloseIcon } from './Icons';
import { useLanguage } from '../context/LanguageContext';
import { selectOptionGroups } from '../constants/optionCatalog';
import { getColorLabel, getFuelLabel, getTransmissionLabel } from '../utils/vehicleLabels';
import './FilterSidebar.css';

interface FilterSidebarProps {
  filters: FilterState;
  onUpdate: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onReset: () => void;
  bodyStyles: BodyStyle[];
  fuelTypes: FuelType[];
  transmissions: Transmission[];
  exteriorColors: string[];
  interiorColors: string[];
  bounds: FilterBounds;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mode: 'rent' | 'buy';
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onUpdate,
  onReset,
  bodyStyles,
  fuelTypes,
  transmissions,
  exteriorColors,
  interiorColors,
  bounds,
  collapsed,
  onToggleCollapse,
  mode,
}) => {
  const { t } = useLanguage();
  const bodyStyleOptions: BodyStyle[] = ['Hatchback', 'SUV', 'Sedan', 'Sport coupe'];
  const fuelTypeOptions: FuelType[] = ['Gasoline', 'Diesel', 'Hybrid', 'Electric', 'Gas', 'Gasoline/Gas'];
  const transmissionOptions: Transmission[] = ['Manual', 'Automatic', 'CVT'];
  const fuelsToRender = (() => {
    const filtered = fuelTypeOptions.filter((fuel) => fuelTypes.includes(fuel));
    return filtered.length ? filtered : fuelTypeOptions;
  })();
  const bodyStylesToRender = (() => {
    const filtered = bodyStyleOptions.filter((style) => bodyStyles.includes(style));
    return filtered.length ? filtered : bodyStyleOptions;
  })();

  const toggleArrayValue = <T extends string | number | BodyStyle | FuelType | Transmission>(list: T[], value: T): T[] => {
    if (list.includes(value)) {
      return list.filter((item) => item !== value);
    }
    return [...list, value];
  };

  const [priceFromInput, setPriceFromInput] = useState<string>('');
  const [priceToInput, setPriceToInput] = useState<string>('');
  const [yearFromInput, setYearFromInput] = useState<string>('');
  const [yearToInput, setYearToInput] = useState<string>('');
  const [mileageFromInput, setMileageFromInput] = useState<string>('');
  const [mileageToInput, setMileageToInput] = useState<string>('');
  const [brandOpen, setBrandOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [brandQuery, setBrandQuery] = useState('');
  const [modelQuery, setModelQuery] = useState('');
  const [carMakes, setCarMakes] = useState<CarMake[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const brandPickerRef = useRef<HTMLDivElement | null>(null);
  const modelPickerRef = useRef<HTMLDivElement | null>(null);
  const selectedMakeId = filters.selectedMakeIds?.[0];
  const selectedModelId = filters.selectedModelIds?.[0];
  const selectedMake = carMakes.find(make => make.id === selectedMakeId);
  const selectedModel = carModels.find(model => model.id === selectedModelId);
  const priceMax = mode === 'buy' ? bounds.priceMaxBuy : bounds.priceMaxRent;
  const registrationGroup = selectOptionGroups.find((group) => group.key === 'registration');

  // Load car makes on component mount
  useEffect(() => {
    const loadMakes = async () => {
      setLoadingMakes(true);
      try {
        const makes = await fetchCarMakes();
        setCarMakes(makes);
      } catch (error) {
        console.error('Failed to load car makes:', error);
      } finally {
        setLoadingMakes(false);
      }
    };
    void loadMakes();
  }, []);

  // Load car models when selected make changes
  useEffect(() => {
    if (!selectedMakeId) {
      setCarModels([]);
      // Clear selected model if no make is selected
      if (selectedModelId) {
        onUpdate('selectedModelIds', []);
      }
      return;
    }

    const loadModels = async () => {
      setLoadingModels(true);
      try {
        const models = await fetchCarModelsByMake(selectedMakeId);
        setCarModels(models);
      } catch (error) {
        console.error('Failed to load car models:', error);
        setCarModels([]);
      } finally {
        setLoadingModels(false);
      }
    };
    void loadModels();
  }, [selectedMakeId, selectedModelId, onUpdate]);

  useEffect(() => {
    setPriceFromInput(filters.priceFrom === 0 ? '' : filters.priceFrom.toString());
    setPriceToInput(filters.priceTo === priceMax ? '' : filters.priceTo.toString());
    setYearFromInput(filters.yearFrom === bounds.minYear ? '' : filters.yearFrom.toString());
    setYearToInput(filters.yearTo === bounds.maxYear ? '' : filters.yearTo.toString());
    setMileageFromInput(filters.mileageFrom === bounds.minMileage ? '' : filters.mileageFrom.toString());
    setMileageToInput(filters.mileageTo === bounds.maxMileage ? '' : filters.mileageTo.toString());
  }, [
    filters.priceFrom,
    filters.priceTo,
    filters.yearFrom,
    filters.yearTo,
    filters.mileageFrom,
    filters.mileageTo,
    mode,
    priceMax,
    bounds.minYear,
    bounds.maxYear,
    bounds.minMileage,
    bounds.maxMileage,
  ]);

  const handleRangeChange = (key: 'priceFrom' | 'priceTo', value: number) => {
    if (key === 'priceFrom') {
      const next = Math.min(value, filters.priceTo);
      onUpdate('priceFrom', next);
      setPriceFromInput(next === 0 ? '' : String(next));
    } else {
      const next = Math.max(value, filters.priceFrom);
      onUpdate('priceTo', next);
      setPriceToInput(next === priceMax ? '' : String(next));
    }
  };

  const handlePriceInputChange = (key: 'priceFrom' | 'priceTo', raw: string) => {
    if (key === 'priceFrom') {
      setPriceFromInput(raw);
    } else {
      setPriceToInput(raw);
    }
  };

  const handlePriceBlur = (key: 'priceFrom' | 'priceTo', raw: string) => {
    if (raw === '') {
      if (key === 'priceFrom') {
        setPriceFromInput('');
        handleRangeChange('priceFrom', 0);
      } else {
        setPriceToInput('');
        handleRangeChange('priceTo', priceMax);
      }
      return;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    handleRangeChange(key, parsed);
  };

  const handleYearInputChange = (key: 'yearFrom' | 'yearTo', raw: string) => {
    if (key === 'yearFrom') setYearFromInput(raw);
    else setYearToInput(raw);
  };

  const handleYearBlur = (key: 'yearFrom' | 'yearTo', raw: string) => {
    if (raw === '') {
      if (key === 'yearFrom') {
        setYearFromInput('');
        onUpdate('yearFrom', bounds.minYear);
      } else {
        setYearToInput('');
        onUpdate('yearTo', bounds.maxYear);
      }
      return;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    if (key === 'yearFrom') {
      const next = Math.min(parsed, filters.yearTo);
      onUpdate('yearFrom', next);
      setYearFromInput(String(next));
    } else {
      const next = Math.max(parsed, filters.yearFrom);
      onUpdate('yearTo', next);
      setYearToInput(String(next));
    }
  };

  const handleMileageInputChange = (key: 'mileageFrom' | 'mileageTo', raw: string) => {
    if (key === 'mileageFrom') setMileageFromInput(raw);
    else setMileageToInput(raw);
  };

  const handleMileageBlur = (key: 'mileageFrom' | 'mileageTo', raw: string) => {
    if (raw === '') {
      if (key === 'mileageFrom') {
        setMileageFromInput('');
        onUpdate('mileageFrom', bounds.minMileage);
      } else {
        setMileageToInput('');
        onUpdate('mileageTo', bounds.maxMileage);
      }
      return;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    if (key === 'mileageFrom') {
      const next = Math.min(parsed, filters.mileageTo);
      onUpdate('mileageFrom', next);
      setMileageFromInput(String(next));
    } else {
      const next = Math.max(parsed, filters.mileageFrom);
      onUpdate('mileageTo', next);
      setMileageToInput(String(next));
    }
  };

  const normalizedBrandQuery = brandQuery.trim().toLowerCase();
  const filteredMakes = useMemo(() => {
    if (!normalizedBrandQuery) return carMakes;
    return carMakes.filter((make) => make.name.toLowerCase().includes(normalizedBrandQuery));
  }, [carMakes, normalizedBrandQuery]);

  const normalizedModelQuery = modelQuery.trim().toLowerCase();
  const filteredModels = useMemo(() => {
    if (!normalizedModelQuery) return carModels;
    return carModels.filter((model) => model.name.toLowerCase().includes(normalizedModelQuery));
  }, [carModels, normalizedModelQuery]);

  useEffect(() => {
    if (!brandOpen && !modelOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (brandOpen && brandPickerRef.current && event.target instanceof Node && brandPickerRef.current.contains(event.target)) return;
      if (modelOpen && modelPickerRef.current && event.target instanceof Node && modelPickerRef.current.contains(event.target)) return;
      setBrandOpen(false);
      setModelOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setBrandOpen(false);
        setModelOpen(false);
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [brandOpen, modelOpen]);

  const selectMake = (makeId: number | null) => {
    if (!makeId) {
      onUpdate('selectedMakeIds', []);
      onUpdate('selectedBrands', []);
    } else {
      onUpdate('selectedMakeIds', [makeId]);
      const makeName = carMakes.find((make) => make.id === makeId)?.name;
      onUpdate('selectedBrands', makeName ? [makeName] : []);
    }
    // Clear selected model when make changes
    onUpdate('selectedModelIds', []);
    setBrandOpen(false);
  };

  const selectModel = (modelId: number | null) => {
    if (!modelId) {
      onUpdate('selectedModelIds', []);
    } else {
      onUpdate('selectedModelIds', [modelId]);
    }
    setModelOpen(false);
  };

  return (
    <aside className={`filter-panel ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="filter-panel__header">
        <div>
          <p className="filter-panel__title">{t('filters.title')}</p>
          <button className="link-button" onClick={onReset} type="button">
            {t('common.resetAll')}
          </button>
        </div>
        {onToggleCollapse && (
          <button className="icon-button" aria-label="Close filters" onClick={onToggleCollapse} type="button">
            <CloseIcon size={18} />
          </button>
        )}
      </div>

      {onToggleCollapse && (
        <button className="filter-panel__collapse" onClick={onToggleCollapse} type="button">
          {t('filters.collapse')} <ChevronDownIcon size={16} />
        </button>
      )}

      <div className="filter-panel__group">
        <label className="filter-panel__label" htmlFor="search">
          {t('common.search')}
        </label>
        <input
          id="search"
          type="text"
          value={filters.search}
          placeholder={t('filters.search.placeholder')}
          onChange={(e) => onUpdate('search', e.target.value)}
        />
      </div>

      <div className="filter-panel__group filter-panel__toggle">
        <span className="filter-panel__label">{t('filters.availableOnly')}</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={filters.availableNow}
            onChange={(e) => onUpdate('availableNow', e.target.checked)}
          />
          <span className="slider" />
        </label>
      </div>

      <div className="filter-panel__group">
        <div className="filter-panel__label-row">
          <span className="filter-panel__label">{t('filters.sellerType')}</span>
        </div>
        <div className="chip-grid">
          {(['dealer', 'private'] as const).map((type) => (
            <button
              key={type}
              className={`chip ${filters.selectedSellerTypes.includes(type) ? 'is-active' : ''}`}
              onClick={() => onUpdate('selectedSellerTypes', toggleArrayValue(filters.selectedSellerTypes, type))}
              type="button"
            >
              {t(`filters.sellerType.${type}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-panel__group">
        <div className="filter-panel__label-row">
          <span className="filter-panel__label">{t('filters.brand')}</span>
        </div>
        <div className="search-select" ref={brandPickerRef}>
          <button
            className="search-select__button"
            type="button"
            onClick={() => {
              setBrandOpen((open) => !open);
              setBrandQuery('');
            }}
            aria-haspopup="listbox"
            aria-expanded={brandOpen}
          >
            <span className={selectedMake ? '' : 'search-select__placeholder'}>
              {selectedMake?.name || t('filters.brand.placeholder')}
            </span>
            <ChevronDownIcon size={16} />
          </button>
          {brandOpen && (
            <div className="search-select__popover" role="listbox" aria-label={t('filters.brand')}>
              <div className="search-select__search">
                <input
                  type="text"
                  value={brandQuery}
                  onChange={(e) => setBrandQuery(e.target.value)}
                  placeholder={t('common.search')}
                  autoFocus
                />
              </div>
              <div className="search-select__options">
                {loadingMakes ? (
                  <div className="search-select__loading">Loading...</div>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`search-select__option ${!selectedMake ? 'is-selected' : ''}`}
                      onClick={() => selectMake(null)}
                    >
                      {t('filters.brand.placeholder')}
                    </button>
                    {filteredMakes.map((make) => (
                      <button
                        key={make.id}
                        type="button"
                        className={`search-select__option ${selectedMake?.id === make.id ? 'is-selected' : ''}`}
                        onClick={() => selectMake(make.id)}
                      >
                        {make.name}
                      </button>
                    ))}
                    {!filteredMakes.length && !loadingMakes && (
                      <div className="search-select__empty" aria-live="polite">
                        {t('common.noResults')}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="filter-panel__group">
        <div className="filter-panel__label-row">
          <span className="filter-panel__label">{t('filters.model')}</span>
        </div>
        <div className="search-select" ref={modelPickerRef}>
          <button
            className="search-select__button"
            type="button"
            onClick={() => {
              if (!selectedMake) return;
              setModelOpen((open) => !open);
              setModelQuery('');
            }}
            disabled={!selectedMake}
            aria-haspopup="listbox"
            aria-expanded={modelOpen}
          >
            <span className={selectedModel ? '' : 'search-select__placeholder'}>
              {!selectedMake
                ? t('filters.model.selectMakeFirst')
                : selectedModel?.name || t('filters.model.placeholder')}
            </span>
            <ChevronDownIcon size={16} />
          </button>
          {modelOpen && selectedMake && (
            <div className="search-select__popover" role="listbox" aria-label={t('filters.model')}>
              <div className="search-select__search">
                <input
                  type="text"
                  value={modelQuery}
                  onChange={(e) => setModelQuery(e.target.value)}
                  placeholder={t('common.search')}
                  autoFocus
                />
              </div>
              <div className="search-select__options">
                {loadingModels ? (
                  <div className="search-select__loading">Loading...</div>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`search-select__option ${!selectedModel ? 'is-selected' : ''}`}
                      onClick={() => selectModel(null)}
                    >
                      {t('filters.model.placeholder')}
                    </button>
                    {filteredModels.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        className={`search-select__option ${selectedModel?.id === model.id ? 'is-selected' : ''}`}
                        onClick={() => selectModel(model.id)}
                      >
                        {model.name}
                      </button>
                    ))}
                    {!filteredModels.length && !loadingModels && (
                      <div className="search-select__empty" aria-live="polite">
                        {t('common.noResults')}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="filter-panel__group">
        <div className="filter-panel__label-row">
          <span className="filter-panel__label">{mode === 'buy' ? t('filters.price.buy') : t('filters.price.rent')}</span>
        </div>
        <div className="range-row">
          <div className="range-input">
            <label htmlFor="priceFrom">{t('common.from')}</label>
            <input
              id="priceFrom"
              type="number"
              min={0}
              max={priceMax}
              value={priceFromInput}
              placeholder={t('common.from')}
              onChange={(e) => handlePriceInputChange('priceFrom', e.target.value)}
              onBlur={(e) => handlePriceBlur('priceFrom', e.target.value)}
            />
          </div>
          <div className="range-input">
            <label htmlFor="priceTo">{t('common.to')}</label>
            <input
              id="priceTo"
              type="number"
              min={filters.priceFrom}
              max={priceMax}
              value={priceToInput}
              placeholder={t('common.to')}
              onChange={(e) => handlePriceInputChange('priceTo', e.target.value)}
              onBlur={(e) => handlePriceBlur('priceTo', e.target.value)}
            />
          </div>
        </div>
        <div className="slider-track">
          <input
            type="range"
            min={0}
            max={priceMax}
            step={1}
            value={filters.priceFrom}
            onChange={(e) => handleRangeChange('priceFrom', Number(e.target.value))}
            className="slider-range"
            aria-label="Price from"
          />
          <input
            type="range"
            min={0}
            max={priceMax}
            step={1}
            value={filters.priceTo}
            onChange={(e) => handleRangeChange('priceTo', Number(e.target.value))}
            className="slider-range"
            aria-label="Price to"
          />
          <div
            className="slider-highlight"
            style={{
              left: `${(filters.priceFrom / priceMax) * 100}%`,
              right: `${100 - (filters.priceTo / priceMax) * 100}%`,
            }}
          />
          <div
            className="slider-handle"
            style={{ left: `${(filters.priceFrom / priceMax) * 100}%` }}
            aria-hidden="true"
          >
            <span className="slider-dot" />
          </div>
          <div
            className="slider-handle"
            style={{ left: `${(filters.priceTo / priceMax) * 100}%` }}
            aria-hidden="true"
          >
            <span className="slider-dot" />
          </div>
        </div>
      </div>

      <div className="filter-panel__group">
        <div className="filter-panel__label-row">
          <span className="filter-panel__label">{t('filters.year')}</span>
        </div>
        <div className="range-row">
          <div className="range-input">
            <label htmlFor="yearFrom">{t('common.from')}</label>
            <input
              id="yearFrom"
              type="number"
              min={1995}
              max={filters.yearTo}
              value={yearFromInput}
              placeholder={t('common.from')}
              onChange={(e) => handleYearInputChange('yearFrom', e.target.value)}
              onBlur={(e) => handleYearBlur('yearFrom', e.target.value)}
            />
          </div>
          <div className="range-input">
            <label htmlFor="yearTo">{t('common.to')}</label>
            <input
              id="yearTo"
              type="number"
              min={filters.yearFrom}
              max={new Date().getFullYear() + 1}
              value={yearToInput}
              placeholder={t('common.to')}
              onChange={(e) => handleYearInputChange('yearTo', e.target.value)}
              onBlur={(e) => handleYearBlur('yearTo', e.target.value)}
            />
          </div>
        </div>
      </div>

      {mode === 'buy' && (
        <div className="filter-panel__group">
          <div className="filter-panel__label-row">
            <span className="filter-panel__label">{t('filters.mileage')}</span>
          </div>
          <div className="range-row">
            <div className="range-input">
              <label htmlFor="mileageFrom">{t('common.from')}</label>
              <input
                id="mileageFrom"
                type="number"
                min={0}
                max={filters.mileageTo}
                value={mileageFromInput}
                placeholder={t('common.from')}
                onChange={(e) => handleMileageInputChange('mileageFrom', e.target.value)}
                onBlur={(e) => handleMileageBlur('mileageFrom', e.target.value)}
              />
            </div>
            <div className="range-input">
              <label htmlFor="mileageTo">{t('common.to')}</label>
              <input
                id="mileageTo"
                type="number"
                min={filters.mileageFrom}
                max={250000}
                value={mileageToInput}
                placeholder={t('common.to')}
                onChange={(e) => handleMileageInputChange('mileageTo', e.target.value)}
                onBlur={(e) => handleMileageBlur('mileageTo', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="filter-panel__group">
        <div className="filter-panel__label-row">
          <span className="filter-panel__label">{t('filters.fuel')}</span>
        </div>
        <div className="chip-grid">
          {fuelsToRender.map((fuel) => (
            <button
              key={fuel}
              className={`chip ${filters.selectedFuelTypes.includes(fuel) ? 'is-active' : ''}`}
              onClick={() => onUpdate('selectedFuelTypes', toggleArrayValue(filters.selectedFuelTypes, fuel))}
              type="button"
            >
              {getFuelLabel(t, fuel)}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-panel__group">
        <div className="filter-panel__label-row">
          <span className="filter-panel__label">{t('filters.transmission')}</span>
        </div>
        <div className="chip-grid">
          {transmissionOptions.map((gear) => (
            <button
              key={gear}
              className={`chip ${filters.selectedTransmissions.includes(gear) ? 'is-active' : ''}`}
              onClick={() => onUpdate('selectedTransmissions', toggleArrayValue(filters.selectedTransmissions, gear))}
              type="button"
            >
              {getTransmissionLabel(t, gear)}
            </button>
          ))}
        </div>
      </div>

      {mode === 'buy' && (
        <>
          <div className="filter-panel__group">
            <div className="filter-panel__label-row">
              <span className="filter-panel__label">{t('filters.exterior')}</span>
            </div>
            <div className="chip-grid">
              {exteriorColors.map((color) => (
                <button
                  key={color}
                  className={`chip ${filters.selectedExteriorColors.includes(color) ? 'is-active' : ''}`}
                  onClick={() =>
                    onUpdate('selectedExteriorColors', toggleArrayValue(filters.selectedExteriorColors, color))
                  }
                  type="button"
                >
                  {getColorLabel(t, color)}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-panel__group">
            <div className="filter-panel__label-row">
              <span className="filter-panel__label">{t('filters.interior')}</span>
            </div>
            <div className="chip-grid">
              {interiorColors.map((color) => (
                <button
                  key={color}
                  className={`chip ${filters.selectedInteriorColors.includes(color) ? 'is-active' : ''}`}
                  onClick={() =>
                    onUpdate('selectedInteriorColors', toggleArrayValue(filters.selectedInteriorColors, color))
                  }
                  type="button"
                >
                  {getColorLabel(t, color)}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {mode === 'buy' && registrationGroup && (
        <div className="filter-panel__group">
          <div className="filter-panel__label-row">
            <span className="filter-panel__label">{t(registrationGroup.titleKey)}</span>
          </div>
          <div className="chip-grid">
            {registrationGroup.options.map((option) => (
              <button
                key={option.value}
                className={`chip ${filters.selectedRegistration.includes(option.value) ? 'is-active' : ''}`}
                onClick={() =>
                  onUpdate('selectedRegistration', toggleArrayValue(filters.selectedRegistration, option.value))
                }
                type="button"
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="filter-panel__group">
        <div className="filter-panel__label-row">
          <span className="filter-panel__label">{t('filters.minSeats')}</span>
        </div>
        <div className="select-row">
          <select
            value={filters.minSeats}
            onChange={(e) => onUpdate('minSeats', Number(e.target.value))}
            aria-label="Minimum seats"
          >
            {[0, 2, 4, 5, 6, 7].map((seat) => (
              <option key={seat} value={seat}>
                {seat === 0 ? t('common.any') : `${seat}+`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="filter-panel__group">
        <div className="filter-panel__label-row">
          <span className="filter-panel__label">{t('filters.bodyStyle')}</span>
        </div>
        <div className="chip-grid">
          {bodyStylesToRender.map((style) => (
            <button
              key={style}
              className={`chip ${filters.selectedBodyStyles.includes(style) ? 'is-active' : ''}`}
              onClick={() => onUpdate('selectedBodyStyles', toggleArrayValue(filters.selectedBodyStyles, style))}
              type="button"
            >
              {style}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
