import { useEffect, useState } from 'react';
import { CalendarReservation, getOwnerCalendarReservations } from '../service/reservationService';
import './ReservationsCalendar.css';

interface ReservationsCalendarProps {
  ownerId: string;
}

export const ReservationsCalendar: React.FC<ReservationsCalendarProps> = ({ ownerId }) => {
  const [reservations, setReservations] = useState<CalendarReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  useEffect(() => {
    loadReservations();
  }, [ownerId, currentDate, viewMode]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();
      const data = await getOwnerCalendarReservations(ownerId, startDate, endDate);
      setReservations(data);
    } catch (error) {
      console.error('Failed to load reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getViewStartDate = () => {
    if (viewMode === 'week') {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay());
      start.setHours(0, 0, 0, 0);
      return start;
    } else {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      return start;
    }
  };

  const getViewEndDate = () => {
    if (viewMode === 'week') {
      const end = new Date(currentDate);
      end.setDate(currentDate.getDate() + (6 - currentDate.getDay()));
      end.setHours(23, 59, 59, 999);
      return end;
    } else {
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return end;
    }
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the start of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getWeekDays = () => {
    const days: Date[] = [];
    const startDate = getViewStartDate();
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getReservationsForDate = (date: Date) => {
    return reservations.filter((res) => {
      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      return date >= resStart && date <= resEnd;
    });
  };

  const formatMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatWeekRange = () => {
    const start = getViewStartDate();
    const end = getViewEndDate();
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return '#10b981';
      case 'Pending':
        return '#f59e0b';
      case 'InProgress':
        return '#3b82f6';
      case 'Completed':
        return '#6b7280';
      case 'Cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const uniqueCars = Array.from(new Set(reservations.map(r => r.carId)))
    .map(carId => {
      const res = reservations.find(r => r.carId === carId);
      return res ? { id: carId, brand: res.carBrand, model: res.carModel, color: res.carColor } : null;
    })
    .filter(Boolean) as { id: string; brand: string; model: string; color: string }[];

  if (loading) {
    return (
      <div className="reservations-calendar">
        <div className="calendar-loading">Loading reservations...</div>
      </div>
    );
  }

  return (
    <div className="reservations-calendar">
      <div className="calendar-header">
        <div className="calendar-header-left">
          <h2 className="calendar-title">Reservations Calendar</h2>
          <p className="calendar-subtitle">{reservations.length} reservation{reservations.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="calendar-header-right">
          <div className="calendar-view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
          </div>
          <div className="calendar-navigation">
            <button className="nav-btn" onClick={goToPrevious}>
              ←
            </button>
            <button className="nav-btn today-btn" onClick={goToToday}>
              Today
            </button>
            <span className="calendar-current-period">
              {viewMode === 'month' ? formatMonthYear() : formatWeekRange()}
            </span>
            <button className="nav-btn" onClick={goToNext}>
              →
            </button>
          </div>
        </div>
      </div>

      {uniqueCars.length > 0 && (
        <div className="calendar-legend">
          <div className="legend-title">Your Cars:</div>
          <div className="legend-items">
            {uniqueCars.map((car) => (
              <div key={car.id} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: car.color || '#6b7280' }} />
                <span>{car.brand} {car.model}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'month' ? (
        <div className="calendar-month-view">
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="calendar-weekday">
                {day}
              </div>
            ))}
          </div>
          <div className="calendar-days">
            {getMonthDays().map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="calendar-day empty" />;
              }
              const dayReservations = getReservationsForDate(day);
              const isToday =
                day.toDateString() === new Date().toDateString();

              return (
                <div key={day.toISOString()} className={`calendar-day ${isToday ? 'today' : ''}`}>
                  <div className="day-number">{day.getDate()}</div>
                  <div className="day-reservations">
                    {dayReservations.slice(0, 3).map((res) => (
                      <div
                        key={res.id}
                        className="reservation-item"
                        style={{ backgroundColor: getStatusColor(res.status) }}
                        title={`${res.carBrand} ${res.carModel} - ${res.renterName}`}
                      >
                        <div className="reservation-item-text">
                          {res.carBrand} {res.carModel}
                        </div>
                      </div>
                    ))}
                    {dayReservations.length > 3 && (
                      <div className="reservation-more">
                        +{dayReservations.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="calendar-week-view">
          <div className="week-header">
            {getWeekDays().map((day) => (
              <div key={day.toISOString()} className="week-header-cell">
                <div className="week-day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className={`week-day-number ${day.toDateString() === new Date().toDateString() ? 'today' : ''}`}>
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>
          <div className="week-grid">
            {getWeekDays().map((day) => {
              const dayReservations = getReservationsForDate(day);
              return (
                <div key={day.toISOString()} className="week-day-column">
                  {dayReservations.map((res) => (
                    <div
                      key={res.id}
                      className="week-reservation-card"
                      style={{ borderLeftColor: getStatusColor(res.status) }}
                    >
                      <div className="week-res-car">{res.carBrand} {res.carModel}</div>
                      <div className="week-res-renter">{res.renterName}</div>
                      <div className="week-res-price">€{res.totalPrice.toFixed(2)}</div>
                      <div className="week-res-status" style={{ color: getStatusColor(res.status) }}>
                        {res.status}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
