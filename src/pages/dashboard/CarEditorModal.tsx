import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { OwnerProfileType } from '../../context/AuthContext';
import { Car, BodyStyle, FuelType, Transmission } from '../../models/Car';
import { CarMake, CarModel } from '../../models/CarMakeModel';
import { fetchCarMakes, fetchCarModelsByMake } from '../../service/carMakeModelService';
import { AddressPicker } from '../../components/AddressPicker';
import { Field } from './Field';
import { ImagesField } from './ImagesField';
import { bodyStyleOptions, fuelTypeOptions, transmissionOptions, featureOptionGroups, selectOptionGroups } from './dashboardUtils';
import { optionGroupTitleLookup } from '../../constants/optionCatalog';
import { getColorLabel, getFuelLabel, getTransmissionLabel } from '../../utils/vehicleLabels';
import '../OwnerDashboard.css';

interface CarEditorModalProps {
  initial: Car;
  onClose: () => void;
  onSave: (car: Car) => Promise<void>;
  profileType: OwnerProfileType;
  ownerAddress: { address: string; city: string; lat: number; lng: number };
  billingCount: number;
  maxAllowedCars: number;
}

export const CarEditorModal: React.FC<CarEditorModalProps> = ({
  initial,
  onClose,
  onSave,
  profileType,
  ownerAddress,
  billingCount,
  maxAllowedCars,
}) => {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<Car>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [useCustomAddress, setUseCustomAddress] = useState(() => {
    return (
      initial.location.fullAddress.trim() !== ownerAddress.address.trim() ||
      initial.location.city.trim() !== ownerAddress.city.trim()
    );
  });

  // Car makes and models from API
  const [carMakes, setCarMakes] = useState<CarMake[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [makesError, setMakesError] = useState<string>('');
  const [modelsError, setModelsError] = useState<string>('');

  // Load car makes on component mount
  useEffect(() => {
    const loadMakes = async () => {
      setLoadingMakes(true);
      setMakesError('');
      try {
        const makes = await fetchCarMakes();
        setCarMakes(makes);
      } catch (error) {
        console.error('Failed to load car makes:', error);
        setMakesError('Failed to load car makes');
      } finally {
        setLoadingMakes(false);
      }
    };
    void loadMakes();
  }, []);

  // Initialize carMakeId from brand when makes are loaded (for editing existing cars)
  useEffect(() => {
    if (!carMakes.length || draft.carMakeId) return;
    
    // Find matching make by brand name
    const matchingMake = carMakes.find(make => 
      make.name.toLowerCase() === draft.brand.toLowerCase()
    );
    
    if (matchingMake) {
      setDraft(current => ({ 
        ...current, 
        carMakeId: matchingMake.id,
        brand: matchingMake.name // Ensure consistent casing
      }));
    }
  }, [carMakes, draft.brand, draft.carMakeId]);

  // Load car models when selected make changes
  useEffect(() => {
    if (!draft.carMakeId) {
      setCarModels([]);
      return;
    }

    const loadModels = async () => {
      setLoadingModels(true);
      setModelsError('');
      try {
        const models = await fetchCarModelsByMake(draft.carMakeId!);
        setCarModels(models);
      } catch (error) {
        console.error('Failed to load car models:', error);
        setModelsError('Failed to load car models');
      } finally {
        setLoadingModels(false);
      }
    };
    void loadModels();
  }, [draft.carMakeId]);

  // Initialize carModelId from model when models are loaded (for editing existing cars)
  useEffect(() => {
    if (!carModels.length || draft.carModelId) return;
    
    // Find matching model by model name
    const matchingModel = carModels.find(model => 
      model.name.toLowerCase() === draft.model.toLowerCase()
    );
    
    if (matchingModel) {
      setDraft(current => ({ 
        ...current, 
        carModelId: matchingModel.id,
        model: matchingModel.name // Ensure consistent casing
      }));
    }
  }, [carModels, draft.model, draft.carModelId]);

  useEffect(() => {
    if (useCustomAddress) return;
    setDraft((current) => {
      const nextAddress = ownerAddress.address?.trim() || current.location.fullAddress;
      const nextCity = ownerAddress.city?.trim() || current.location.city;
      return {
        ...current,
        location: {
          ...current.location,
          fullAddress: nextAddress,
          city: nextCity,
          mapLabel: 'Owner location',
          lat: ownerAddress.lat ?? current.location.lat,
          lng: ownerAddress.lng ?? current.location.lng,
        },
      };
    });
  }, [useCustomAddress, ownerAddress.address, ownerAddress.city, ownerAddress.lat, ownerAddress.lng]);

  const yearOptions = useMemo(() => {
    const max = new Date().getFullYear() + 1;
    const min = 1990;
    const years: number[] = [];
    for (let y = max; y >= min; y -= 1) years.push(y);
    return years;
  }, []);

  const colorOptions = useMemo(
    () => [
      'Black',
      'White',
      'Gray',
      'Silver',
      'Blue',
      'Red',
      'Green',
      'Brown',
      'Beige',
      'Yellow',
      'Orange',
    ],
    []
  );
  const accidentsOptions = useMemo(() => ['0', '1', '2', '3', '4', '5+'], []);
  const ownersOptions = useMemo(() => ['1', '2', '3', '4', '5+'], []);

  const setField = <K extends keyof Car>(key: K, value: Car[K] | undefined) =>
    setDraft((d) => ({ ...d, [key]: value as Car[K] }));

  const optionGroups = draft.optionsGroups ?? [];
  const resolveGroupItems = (titleKey: string) => {
    const match = optionGroups.find(
      (group) => group.title === titleKey || optionGroupTitleLookup.get(group.title) === titleKey
    );
    return match?.items ?? [];
  };

  const validateDraft = (nextDraft: Car) => {
    const next: Record<string, string> = {};

    const requiredText = (value: string | undefined, key: string) => {
      if (!value?.trim()) next[key] = t('dashboard.form.required');
    };
    const requiredNumber = (value: number | undefined, key: string, { min }: { min: number }) => {
      if (typeof value !== 'number' || Number.isNaN(value) || value < min) next[key] = t('dashboard.form.required');
    };

    requiredText(nextDraft.brand, 'brand');
    requiredText(nextDraft.model, 'model');
    if (!nextDraft.carMakeId) next.brand = t('dashboard.form.required');
    if (!nextDraft.carModelId) next.model = t('dashboard.form.required');

    if (!nextDraft.bodyStyle) next.bodyStyle = t('dashboard.form.required');
    if (!nextDraft.fuelType) next.fuelType = t('dashboard.form.required');
    if (!nextDraft.transmission) next.transmission = t('dashboard.form.required');

    requiredNumber(nextDraft.year, 'year', { min: 1990 });
    requiredNumber(nextDraft.enginePowerHp, 'enginePowerHp', { min: 1 });
    requiredNumber(nextDraft.engineVolumeL, 'engineVolumeL', { min: 0 });
    requiredNumber(nextDraft.seats, 'seats', { min: 1 });
    requiredNumber(nextDraft.doors, 'doors', { min: 2 });
    requiredNumber(nextDraft.mileageKm, 'mileageKm', { min: 0 });

    requiredText(nextDraft.exteriorColor, 'exteriorColor');
    requiredText(nextDraft.interiorColor, 'interiorColor');

    requiredNumber(nextDraft.accidentsCount ?? 0, 'accidentsCount', { min: 0 });
    requiredNumber(nextDraft.ownersCount ?? 0, 'ownersCount', { min: 0 });

    const imageIds = nextDraft.imageIds ?? [];
    if (imageIds.length < 3) next.images = t('dashboard.form.images.min', { count: 3 });
    if (imageIds.length > 15) next.images = t('dashboard.form.images.max', { count: 15 });
    if (nextDraft.coverImageId && !imageIds.includes(nextDraft.coverImageId)) next.coverImageId = t('dashboard.form.required');

    requiredText(nextDraft.location.fullAddress, 'address');
    requiredText(nextDraft.location.city, 'city');

    if (useCustomAddress) {
      if (typeof nextDraft.location.lat !== 'number' || typeof nextDraft.location.lng !== 'number') {
        next.coordinates = t('dashboard.form.required');
      }
    }

    if (!nextDraft.availableNow) {
      if (!nextDraft.availableIn) next.availableIn = t('dashboard.form.required');
    }

    if (profileType === 'rent') {
      if (!nextDraft.rentPricePerDay || nextDraft.rentPricePerDay <= 0) next.price = t('dashboard.form.required');
    } else {
      if (!nextDraft.salePrice || nextDraft.salePrice <= 0) next.price = t('dashboard.form.required');
    }

    if (
      profileType === 'buy' &&
      (nextDraft.listingStatus ?? 'active') === 'active' &&
      (initial.listingStatus ?? 'active') !== 'active' &&
      billingCount >= maxAllowedCars
    ) {
      next.limit = t('dashboard.cars.limitReached');
    }

    return next;
  };

  const computedErrors = useMemo(() => validateDraft(draft), [draft, profileType, t, useCustomAddress, billingCount, maxAllowedCars, initial.listingStatus]);
  const errors = submitted ? computedErrors : {};

  const save = async () => {
    const nextErrors = validateDraft(draft);
    setSubmitted(true);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    setSaveError('');
    const imageIds = draft.imageIds ?? [];
    const coverId = draft.coverImageId || imageIds[0] || '';
    try {
      await onSave({
        ...draft,
        isForRent: profileType === 'rent',
        isForSale: profileType === 'buy',
        color: draft.exteriorColor || draft.color,
        imageIds,
        coverImageId: coverId || undefined,
        imageUrl: draft.imageUrl || '',
        listingStatus: draft.availableNow ? draft.listingStatus ?? 'active' : 'inactive',
        carMakeId: draft.carMakeId,
        carModelId: draft.carModelId,
      });
    } catch (err) {
      console.error('Failed to save car', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save car');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="owner-modal" role="dialog" aria-modal="true">
      <div className="owner-modal__card">
        <div className="owner-modal__head">
          <div>
            <p className="owner-modal__title">{t('dashboard.form.title')}</p>
            <p className="muted">{t('dashboard.form.subtitle')}</p>
          </div>
          <button className="owner-mini" type="button" onClick={onClose}>
            {t('dashboard.form.close')}
          </button>
        </div>

        <div className="owner-form">
          <div className="owner-form__grid">
            <Field label={t('dashboard.form.brand')} error={errors.brand || makesError}>
              <select
                value={draft.carMakeId || ''}
                onChange={(e) => {
                  const makeId = e.target.value ? Number(e.target.value) : undefined;
                  const selectedMake = carMakes.find(make => make.id === makeId);
                  setField('carMakeId', makeId);
                  setField('brand', selectedMake?.name || '');
                  setField('carModelId', undefined);
                  setField('model', '');
                }}
                disabled={loadingMakes}
              >
                <option value="">
                  {loadingMakes ? 'Loading makes...' : t('dashboard.form.select')}
                </option>
                {carMakes.map((make) => (
                  <option key={make.id} value={make.id}>
                    {make.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('dashboard.form.model')} error={errors.model || modelsError}>
              <select 
                value={draft.carModelId || ''} 
                onChange={(e) => {
                  const modelId = e.target.value ? Number(e.target.value) : undefined;
                  const selectedModel = carModels.find(model => model.id === modelId);
                  setField('carModelId', modelId);
                  setField('model', selectedModel?.name || '');
                }} 
                disabled={!draft.carMakeId || loadingModels}
              >
                <option value="">
                  {!draft.carMakeId 
                    ? 'Select a make first' 
                    : loadingModels 
                    ? 'Loading models...' 
                    : t('dashboard.form.select')
                  }
                </option>
                {carModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="owner-form__grid">
            <Field label={t('dashboard.form.year')} error={errors.year}>
              <select value={draft.year} onChange={(e) => setField('year', Number(e.target.value))}>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('dashboard.form.bodyStyle')} error={errors.bodyStyle}>
              <select value={draft.bodyStyle} onChange={(e) => setField('bodyStyle', e.target.value as BodyStyle)}>
                {bodyStyleOptions.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="owner-form__grid">
            <Field label={t('dashboard.form.fuelType')} error={errors.fuelType}>
              <select value={draft.fuelType} onChange={(e) => setField('fuelType', e.target.value as FuelType)}>
                {fuelTypeOptions.map((fuel) => (
                  <option key={fuel} value={fuel}>
                    {getFuelLabel(t, fuel)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('dashboard.form.transmission')} error={errors.transmission}>
              <select value={draft.transmission} onChange={(e) => setField('transmission', e.target.value as Transmission)}>
                {transmissionOptions.map((gear) => (
                  <option key={gear} value={gear}>
                    {getTransmissionLabel(t, gear)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="owner-form__grid">
            <Field label={t('dashboard.form.enginePower')} error={errors.enginePowerHp}>
              <input
                type="number"
                value={draft.enginePowerHp ?? ''}
                onChange={(e) => setField('enginePowerHp', e.target.value === '' ? undefined : Number(e.target.value))}
                min={0}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              />
            </Field>
            <Field label={t('dashboard.form.engineVolume')} error={errors.engineVolumeL}>
              <input
                type="number"
                value={draft.engineVolumeL ?? ''}
                onChange={(e) => setField('engineVolumeL', e.target.value === '' ? undefined : Number(e.target.value))}
                min={0}
                step={0.1}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              />
            </Field>
          </div>

          <div className="owner-form__grid">
            <Field label={t('dashboard.form.seats')} error={errors.seats}>
              <input
                type="number"
                value={draft.seats ?? ''}
                onChange={(e) => setField('seats', e.target.value === '' ? undefined : Number(e.target.value))}
                min={1}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              />
            </Field>
            <Field label={t('dashboard.form.doors')} error={errors.doors}>
              <input
                type="number"
                value={draft.doors ?? ''}
                onChange={(e) => setField('doors', e.target.value === '' ? undefined : Number(e.target.value))}
                min={2}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              />
            </Field>
          </div>

          <div className="owner-form__grid">
            <Field label={t('dashboard.form.exteriorColor')} error={errors.exteriorColor}>
              <select value={draft.exteriorColor} onChange={(e) => setField('exteriorColor', e.target.value)}>
                <option value="">{t('dashboard.form.select')}</option>
                {colorOptions.map((c) => (
                  <option key={c} value={c}>
                    {getColorLabel(t, c)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('dashboard.form.interiorColor')} error={errors.interiorColor}>
              <select value={draft.interiorColor} onChange={(e) => setField('interiorColor', e.target.value)}>
                <option value="">{t('dashboard.form.select')}</option>
                {colorOptions.map((c) => (
                  <option key={c} value={c}>
                    {getColorLabel(t, c)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t('dashboard.form.mileage')} error={errors.mileageKm}>
            <input
              type="number"
              value={draft.mileageKm ?? ''}
              onChange={(e) => setField('mileageKm', e.target.value === '' ? undefined : Number(e.target.value))}
              min={0}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
            />
          </Field>

          <Field label={profileType === 'rent' ? t('dashboard.form.pricePerDay') : t('dashboard.form.salePrice')} error={errors.price}>
            <input
              type="number"
              value={profileType === 'rent' ? draft.rentPricePerDay ?? '' : draft.salePrice ?? ''}
              onChange={(e) => {
                const next = e.target.value === '' ? undefined : Number(e.target.value);
                if (profileType === 'rent') setField('rentPricePerDay', next);
                else setField('salePrice', next);
              }}
              min={0}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
            />
          </Field>

          <div className="owner-form__grid">
            <Field label={t('dashboard.form.accidents')} error={errors.accidentsCount}>
              <select
                value={
                  draft.accidentsCount === undefined || draft.accidentsCount === null
                    ? ''
                    : (draft.accidentsCount ?? 0) >= 5
                      ? '5+'
                      : String(draft.accidentsCount ?? 0)
                }
                onChange={(e) =>
                  setField(
                    'accidentsCount',
                    e.target.value === ''
                      ? undefined
                      : e.target.value === '5+'
                        ? 5
                        : Number(e.target.value)
                  )
                }
              >
                <option value="">{t('dashboard.form.select')}</option>
                {accidentsOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('dashboard.form.owners')} error={errors.ownersCount}>
              <select
                value={
                  draft.ownersCount === undefined || draft.ownersCount === null
                    ? ''
                    : (draft.ownersCount ?? 1) >= 5
                      ? '5+'
                      : String(draft.ownersCount ?? 1)
                }
                onChange={(e) =>
                  setField(
                    'ownersCount',
                    e.target.value === ''
                      ? undefined
                      : e.target.value === '5+'
                        ? 5
                        : Number(e.target.value)
                  )
                }
              >
                <option value="">{t('dashboard.form.select')}</option>
                {ownersOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t('dashboard.form.serviceHistory')} error={errors.serviceHistory}>
            <input value={draft.serviceHistory ?? ''} onChange={(e) => setField('serviceHistory', e.target.value)} />
          </Field>

          <Field label={t('dashboard.form.description')} error={errors.description}>
            <textarea value={draft.description ?? ''} onChange={(e) => setField('description', e.target.value)} rows={4} />
          </Field>

          <div className="owner-form__grid">
            <Field label={t('dashboard.form.yearlyInsurance')} error={errors.fees}>
              <input
                type="number"
                value={draft.fees ?? ''}
                onChange={(e) => setField('fees', e.target.value === '' ? undefined : Number(e.target.value))}
                min={0}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              />
            </Field>
            <Field label={t('dashboard.form.yearlyTaxes')} error={errors.taxes}>
              <input
                type="number"
                value={draft.taxes ?? ''}
                onChange={(e) => setField('taxes', e.target.value === '' ? undefined : Number(e.target.value))}
                min={0}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              />
            </Field>
          </div>

          <div className="owner-address">
            <div className="owner-address__top">
              <div>
                <p className="owner-options__title">{t('dashboard.form.addressTitle')}</p>
                {!useCustomAddress && (
                  <p className="muted">{t('dashboard.form.addressHint', { address: ownerAddress.address })}</p>
                )}
              </div>
              <label className="owner-check">
                <input
                  type="checkbox"
                  checked={useCustomAddress}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUseCustomAddress(checked);
                    setField('location', {
                      ...draft.location,
                      fullAddress: checked ? (draft.location.fullAddress || ownerAddress.address) : ownerAddress.address,
                      city: checked ? (draft.location.city || ownerAddress.city) : ownerAddress.city,
                      mapLabel: checked ? 'Selected location' : 'Owner location',
                      lat: checked ? (draft.location.lat ?? ownerAddress.lat) : ownerAddress.lat,
                      lng: checked ? (draft.location.lng ?? ownerAddress.lng) : ownerAddress.lng,
                    });
                  }}
                />
                <span>{t('dashboard.form.useDifferentAddress')}</span>
              </label>
            </div>

            {useCustomAddress && (
              <div className="owner-address__picker">
                <AddressPicker
                  defaultCenter={{
                    lat: (ownerAddress.lat && ownerAddress.lat !== 0) ? ownerAddress.lat : 41.3275, // Tirana, Albania
                    lng: (ownerAddress.lng && ownerAddress.lng !== 0) ? ownerAddress.lng : 19.8187,
                  }}
                  value={{
                    fullAddress: draft.location.fullAddress,
                    city: draft.location.city,
                    lat: draft.location.lat,
                    lng: draft.location.lng,
                  }}
                  searchLabel={t('dashboard.form.mapSearch')}
                  searchPlaceholder={t('dashboard.form.mapSearch.placeholder')}
                  addressLabel={t('dashboard.form.address')}
                  addressPlaceholder={t('dashboard.form.address')}
                  mapHint={t('dashboard.form.mapHint')}
                  onChange={(next) => {
                    setField('location', {
                      ...draft.location,
                      fullAddress: next.fullAddress,
                      city: next.city,
                      lat: next.lat,
                      lng: next.lng,
                      mapLabel: 'Selected location',
                    });
                  }}
                />
              </div>
            )}

            {!useCustomAddress && (
              <Field label={t('dashboard.form.address')} error={errors.address}>
                <input value={draft.location.fullAddress || ownerAddress.address} readOnly />
              </Field>
            )}
          </div>

          <ImagesField
            imageIds={draft.imageIds ?? []}
            coverImageId={draft.coverImageId}
            error={errors.images}
            onChange={({ imageIds, coverImageId, coverThumbnailDataUrl }) => {
              setDraft((d) => ({
                ...d,
                imageIds,
                coverImageId,
                imageUrl: coverThumbnailDataUrl || d.imageUrl,
              }));
            }}
          />

          <div className="owner-form__grid">
            <label className="owner-check">
              <input
                type="checkbox"
                checked={draft.availableNow}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setDraft((d) => ({
                    ...d,
                    availableNow: checked,
                    listingStatus: checked ? d.listingStatus ?? 'active' : 'inactive',
                  }));
                }}
              />
              <span>{t('dashboard.form.availableNow')}</span>
            </label>
            <label className="owner-check">
              <input
                type="checkbox"
                checked={draft.availableNow && (draft.listingStatus ?? 'active') !== 'inactive'}
                disabled={!draft.availableNow}
                onChange={(e) => setField('listingStatus', e.target.checked ? 'active' : 'inactive')}
              />
              <span>{t('dashboard.form.active')}</span>
            </label>
          </div>

          {!draft.availableNow && (
            <Field label={t('dashboard.form.availableIn')} error={errors.availableIn}>
              <select value={draft.availableIn ?? ''} onChange={(e) => setField('availableIn', (e.target.value || undefined) as Car['availableIn'])}>
                <option value="">{t('dashboard.form.select')}</option>
                <option value="1w">{t('dashboard.form.availableIn.1w')}</option>
                <option value="2w">{t('dashboard.form.availableIn.2w')}</option>
                <option value="3w">{t('dashboard.form.availableIn.3w')}</option>
                <option value="1m">{t('dashboard.form.availableIn.1m')}</option>
                <option value="2m">{t('dashboard.form.availableIn.2m')}</option>
              </select>
            </Field>
          )}

          <div className="owner-options">
            <p className="owner-options__title">{t('dashboard.form.options')}</p>
            <div className="owner-options__grid owner-options__grid--select">
              {selectOptionGroups.map((group) => {
                const selected = resolveGroupItems(group.titleKey)?.[0] ?? '';
                return (
                  <label key={group.titleKey} className="owner-field">
                    <span>{t(group.titleKey)}</span>
                    <select
                      value={selected}
                      onChange={(e) => {
                        const value = e.target.value;
                        setDraft((d) => {
                          const groups = d.optionsGroups ?? [];
                          const rest = groups.filter(
                            (g) => g.title !== group.titleKey && optionGroupTitleLookup.get(g.title) !== group.titleKey
                          );
                          const nextItems = value ? [value] : [];
                          return { ...d, optionsGroups: [...rest, { title: group.titleKey, items: nextItems }] };
                        });
                      }}
                    >
                      <option value="">{t('dashboard.form.select')}</option>
                      {group.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {t(opt.labelKey)}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>
            {featureOptionGroups.map((group) => {
              const current = resolveGroupItems(group.titleKey);
              return (
                <div key={group.titleKey} className="owner-options__group">
                  <p className="owner-options__groupTitle">{t(group.titleKey)}</p>
                  <div className="owner-options__grid">
                    {group.items.map((item) => {
                      const checked = current.includes(item.value);
                      return (
                        <label key={item.value} className="owner-check owner-check--box">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setDraft((d) => {
                                const groups = d.optionsGroups ?? [];
                                const existing = groups.find(
                                  (g) => g.title === group.titleKey || optionGroupTitleLookup.get(g.title) === group.titleKey
                                ) ?? { title: group.titleKey, items: [] as string[] };
                                const rest = groups.filter(
                                  (g) => g.title !== group.titleKey && optionGroupTitleLookup.get(g.title) !== group.titleKey
                                );
                                const nextItems = e.target.checked
                                  ? Array.from(new Set([...existing.items, item.value]))
                                  : existing.items.filter((i) => i !== item.value);
                                return { ...d, optionsGroups: [...rest, { title: group.titleKey, items: nextItems }] };
                              });
                            }}
                          />
                          <span>{t(item.labelKey)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="owner-form__actions">
            {errors.limit && <p className="owner-field__error">{errors.limit}</p>}
            {saveError && <p className="owner-field__error">{saveError}</p>}
            <button className="owner-mini" type="button" onClick={onClose}>
              {t('dashboard.form.cancel')}
            </button>
            <button className="owner-primary" type="button" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : t('dashboard.form.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
