import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Drawer } from '../drawer/Drawer';
import { getOwnerCars } from '../../service/carService';
import { Car } from '../../models/Car';
import './ReservationForm.css';

interface ReservationFormData {
  clientFirstName: string;
  clientLastName: string;
  cardId: string;
  phoneNumber: string;
  carId: string;
  startDate: string;
  endDate: string;
}

interface ReservationFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  onSubmit: (data: ReservationFormData) => Promise<void>;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({
  isOpen,
  onClose,
  initialDate,
  onSubmit,
}) => {
  const { t } = useLanguage();
  const [ownerCars, setOwnerCars] = useState<Car[]>([]);
  const [formData, setFormData] = useState<ReservationFormData>({
    clientFirstName: '',
    clientLastName: '',
    cardId: '',
    phoneNumber: '',
    carId: '',
    startDate: '',
    endDate: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ReservationFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadOwnerCars();
  }, []);

  useEffect(() => {
    if (isOpen && initialDate) {
      const clickedDate = new Date(initialDate);
      const nextDay = new Date(clickedDate);
      nextDay.setDate(nextDay.getDate() + 1);

      setFormData({
        clientFirstName: '',
        clientLastName: '',
        cardId: '',
        phoneNumber: '',
        carId: '',
        startDate: initialDate,
        endDate: nextDay.toISOString().split('T')[0],
      });
      setFormErrors({});
    }
  }, [isOpen, initialDate]);

  const loadOwnerCars = () => {
    try {
      const cars = getOwnerCars();
      setOwnerCars(cars.filter(car => car.listingStatus !== 'deleted'));
    } catch (error) {
      console.error('Failed to load owner cars:', error);
    }
  };

  const handleInputChange = (field: keyof ReservationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ReservationFormData, string>> = {};

    if (!formData.clientFirstName.trim()) {
      errors.clientFirstName = t('reservation.form.errors.firstNameRequired');
    }
    if (!formData.clientLastName.trim()) {
      errors.clientLastName = t('reservation.form.errors.lastNameRequired');
    }
    if (!formData.cardId.trim()) {
      errors.cardId = t('reservation.form.errors.cardIdRequired');
    }
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = t('reservation.form.errors.phoneRequired');
    }
    if (!formData.carId) {
      errors.carId = t('reservation.form.errors.carRequired');
    }
    if (!formData.startDate) {
      errors.startDate = t('reservation.form.errors.startDateRequired');
    }
    if (!formData.endDate) {
      errors.endDate = t('reservation.form.errors.endDateRequired');
    }
    if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.endDate = t('reservation.form.errors.endDateAfterStart');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Failed to create reservation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      clientFirstName: '',
      clientLastName: '',
      cardId: '',
      phoneNumber: '',
      carId: '',
      startDate: '',
      endDate: '',
    });
    setFormErrors({});
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={t('reservation.form.title')}
      actions={
        <>
          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            {t('reservation.form.cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('reservation.form.creating') : t('reservation.form.create')}
          </button>
        </>
      }
    >
      <form className="reservation-form" onSubmit={handleSubmit}>
        {/* Client Information */}
        <div className="form-section">
          <h4 className="form-section-title">{t('reservation.form.clientInfo')}</h4>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clientFirstName" className="form-label">
                {t('reservation.form.firstName')} <span className="required">*</span>
              </label>
              <input
                type="text"
                id="clientFirstName"
                className={`form-input ${formErrors.clientFirstName ? 'error' : ''}`}
                value={formData.clientFirstName}
                onChange={(e) => handleInputChange('clientFirstName', e.target.value)}
                placeholder={t('reservation.form.firstNamePlaceholder')}
              />
              {formErrors.clientFirstName && (
                <span className="form-error">{formErrors.clientFirstName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="clientLastName" className="form-label">
                {t('reservation.form.lastName')} <span className="required">*</span>
              </label>
              <input
                type="text"
                id="clientLastName"
                className={`form-input ${formErrors.clientLastName ? 'error' : ''}`}
                value={formData.clientLastName}
                onChange={(e) => handleInputChange('clientLastName', e.target.value)}
                placeholder={t('reservation.form.lastNamePlaceholder')}
              />
              {formErrors.clientLastName && (
                <span className="form-error">{formErrors.clientLastName}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cardId" className="form-label">
                {t('reservation.form.cardId')} <span className="required">*</span>
              </label>
              <input
                type="text"
                id="cardId"
                className={`form-input ${formErrors.cardId ? 'error' : ''}`}
                value={formData.cardId}
                onChange={(e) => handleInputChange('cardId', e.target.value)}
                placeholder={t('reservation.form.cardIdPlaceholder')}
              />
              {formErrors.cardId && (
                <span className="form-error">{formErrors.cardId}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber" className="form-label">
                {t('reservation.form.phone')} <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="phoneNumber"
                className={`form-input ${formErrors.phoneNumber ? 'error' : ''}`}
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder={t('reservation.form.phonePlaceholder')}
              />
              {formErrors.phoneNumber && (
                <span className="form-error">{formErrors.phoneNumber}</span>
              )}
            </div>
          </div>
        </div>

        {/* Reservation Details */}
        <div className="form-section">
          <h4 className="form-section-title">{t('reservation.form.reservationDetails')}</h4>

          <div className="form-group">
            <label htmlFor="carId" className="form-label">
              {t('reservation.form.selectCar')} <span className="required">*</span>
            </label>
            <select
              id="carId"
              className={`form-input ${formErrors.carId ? 'error' : ''}`}
              value={formData.carId}
              onChange={(e) => handleInputChange('carId', e.target.value)}
            >
              <option value="">{t('reservation.form.chooseCar')}</option>
              {ownerCars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.brand} {car.model} - {car.color} ({car.year})
                </option>
              ))}
            </select>
            {formErrors.carId && (
              <span className="form-error">{formErrors.carId}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate" className="form-label">
                {t('reservation.form.startDate')} <span className="required">*</span>
              </label>
              <input
                type="date"
                id="startDate"
                className={`form-input ${formErrors.startDate ? 'error' : ''}`}
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
              />
              {formErrors.startDate && (
                <span className="form-error">{formErrors.startDate}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="endDate" className="form-label">
                {t('reservation.form.endDate')} <span className="required">*</span>
              </label>
              <input
                type="date"
                id="endDate"
                className={`form-input ${formErrors.endDate ? 'error' : ''}`}
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
              />
              {formErrors.endDate && (
                <span className="form-error">{formErrors.endDate}</span>
              )}
            </div>
          </div>
        </div>
      </form>
    </Drawer>
  );
};
