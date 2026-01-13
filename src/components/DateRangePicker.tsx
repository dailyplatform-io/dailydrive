import { useEffect, useState } from 'react';
import './DateRangePicker.css';

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onDatesChange: (startDate: Date | null, endDate: Date | null) => void;
  unavailableDates?: { startDate: string; endDate: string }[];
  minDate?: Date;
  pricePerDay?: number;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDatesChange,
  unavailableDates = [],
  minDate = new Date(),
  pricePerDay,
}) => {
  const [localStartDate, setLocalStartDate] = useState<string>(
    startDate ? formatDateForInput(startDate) : ''
  );
  const [localEndDate, setLocalEndDate] = useState<string>(
    endDate ? formatDateForInput(endDate) : ''
  );

  useEffect(() => {
    if (startDate) setLocalStartDate(formatDateForInput(startDate));
    if (endDate) setLocalEndDate(formatDateForInput(endDate));
  }, [startDate, endDate]);

  const handleStartDateChange = (value: string) => {
    setLocalStartDate(value);
    if (value) {
      const date = new Date(value);
      onDatesChange(date, localEndDate ? new Date(localEndDate) : null);
    } else {
      onDatesChange(null, localEndDate ? new Date(localEndDate) : null);
    }
  };

  const handleEndDateChange = (value: string) => {
    setLocalEndDate(value);
    if (value) {
      const date = new Date(value);
      onDatesChange(localStartDate ? new Date(localStartDate) : null, date);
    } else {
      onDatesChange(localStartDate ? new Date(localStartDate) : null, null);
    }
  };

  const calculateDays = () => {
    if (!localStartDate || !localEndDate) return 0;
    const start = new Date(localStartDate);
    const end = new Date(localEndDate);
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (!pricePerDay) return 0;
    const days = calculateDays();
    return days * pricePerDay;
  };

  const days = calculateDays();
  const total = calculateTotal();
  const minDateStr = formatDateForInput(minDate);

  return (
    <div className="date-range-picker">
      <div className="date-input-group">
        <div className="date-input">
          <label htmlFor="start-date">Start Date</label>
          <input
            type="date"
            id="start-date"
            value={localStartDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            min={minDateStr}
            className="date-input-field"
          />
        </div>

        <div className="date-input">
          <label htmlFor="end-date">End Date</label>
          <input
            type="date"
            id="end-date"
            value={localEndDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            min={localStartDate || minDateStr}
            className="date-input-field"
            disabled={!localStartDate}
          />
        </div>
      </div>

      {days > 0 && (
        <div className="rental-summary">
          <div className="rental-summary-item">
            <span>Duration:</span>
            <strong>{days} {days === 1 ? 'day' : 'days'}</strong>
          </div>
          {pricePerDay && (
            <>
              <div className="rental-summary-item">
                <span>Price per day:</span>
                <strong>€{pricePerDay.toFixed(2)}</strong>
              </div>
              <div className="rental-summary-item total">
                <span>Total:</span>
                <strong>€{total.toFixed(2)}</strong>
              </div>
            </>
          )}
        </div>
      )}

      {unavailableDates.length > 0 && (
        <div className="unavailable-dates-notice">
          <p className="warning-text">⚠️ Some dates are unavailable for booking</p>
        </div>
      )}
    </div>
  );
};

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
