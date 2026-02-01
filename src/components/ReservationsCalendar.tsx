import { useEffect, useState } from 'react';
import { CalendarReservation, getOwnerCalendarReservations } from '../service/reservationService';
import { ReservationForm } from './ReservationCalendarFolder/ReservationForm';
import { useLanguage } from '../context/LanguageContext';
import './ReservationsCalendar.css';

const FAKE_RESERVATIONS: CalendarReservation[] = [
  {
    id: '1',
    carId: 'car-1',
    carBrand: 'BMW',
    carModel: 'X5',
    carColor: '#2563eb',
    renterName: 'John Doe',
    startDate: '2026-02-01T08:00:00',
    endDate: '2026-02-05T18:00:00',
    status: 'Confirmed',
    totalPrice: 150,
  },
  {
    id: '2',
    carId: 'car-2',
    carBrand: 'Tesla',
    carModel: 'Model 3',
    carColor: '#10b981',
    renterName: 'Anna Smith',
    startDate: '2026-02-03T10:00:00',
    endDate: '2026-02-08T12:00:00',
    status: 'Pending',
    totalPrice: 240,
  },
  {
    id: '3',
    carId: 'car-1',
    carBrand: 'BMW',
    carModel: 'X5',
    carColor: '#2563eb',
    renterName: 'Mark Wilson',
    startDate: '2026-02-07T09:00:00',
    endDate: '2026-02-12T20:00:00',
    status: 'InProgress',
    totalPrice: 390,
  },
  {
    id: '4',
    carId: 'car-3',
    carBrand: 'Audi',
    carModel: 'A6',
    carColor: '#ef4444',
    renterName: 'Laura Green',
    startDate: '2026-02-02T14:00:00',
    endDate: '2026-02-06T19:00:00',
    status: 'Confirmed',
    totalPrice: 120,
  },
  {
    id: '5',
    carId: 'car-2',
    carBrand: 'Tesla',
    carModel: 'Model 3',
    carColor: '#10b981',
    renterName: 'Chris Brown',
    startDate: '2026-02-10T08:00:00',
    endDate: '2026-02-15T08:00:00',
    status: 'Completed',
    totalPrice: 300,
  },
  {
    id: '6',
    carId: 'car-4',
    carBrand: 'Mercedes',
    carModel: 'C-Class',
    carColor: '#6b7280',
    renterName: 'Emily Stone',
    startDate: '2026-02-04T11:00:00',
    endDate: '2026-02-04T17:00:00',
    status: 'Confirmed',
    totalPrice: 110,
  },
  {
    id: '7',
    carId: 'car-1',
    carBrand: 'BMW',
    carModel: 'X5',
    carColor: '#2563eb',
    renterName: 'Daniel White',
    startDate: '2026-02-14T09:00:00',
    endDate: '2026-02-18T18:00:00',
    status: 'Pending',
    totalPrice: 420,
  },
  {
    id: '8',
    carId: 'car-3',
    carBrand: 'Audi',
    carModel: 'A6',
    carColor: '#ef4444',
    renterName: 'Sophia Lee',
    startDate: '2026-02-09T07:00:00',
    endDate: '2026-02-11T12:00:00',
    status: 'Cancelled',
    totalPrice: 0,
  },
  {
    id: '9',
    carId: 'car-4',
    carBrand: 'Mercedes',
    carModel: 'C-Class',
    carColor: '#6b7280',
    renterName: 'Michael King',
    startDate: '2026-02-12T13:00:00',
    endDate: '2026-02-16T16:00:00',
    status: 'InProgress',
    totalPrice: 360,
  },
  {
    id: '10',
    carId: 'car-2',
    carBrand: 'Tesla',
    carModel: 'Model 3',
    carColor: '#10b981',
    renterName: 'Olivia Perez',
    startDate: '2026-02-17T09:00:00',
    endDate: '2026-02-21T20:00:00',
    status: 'Confirmed',
    totalPrice: 190,
  },
  {
    id: '11',
    carId: 'car-3',
    carBrand: 'Audi',
    carModel: 'A6',
    carColor: '#ef4444',
    renterName: 'James Miller',
    startDate: '2026-02-13T08:00:00',
    endDate: '2026-02-19T18:00:00',
    status: 'Confirmed',
    totalPrice: 280,
  },
  {
    id: '12',
    carId: 'car-4',
    carBrand: 'Mercedes',
    carModel: 'C-Class',
    carColor: '#6b7280',
    renterName: 'Sarah Davis',
    startDate: '2026-02-20T10:00:00',
    endDate: '2026-02-25T14:00:00',
    status: 'Pending',
    totalPrice: 220,
  },
  {
    id: '13',
    carId: 'car-1',
    carBrand: 'BMW',
    carModel: 'X5',
    carColor: '#2563eb',
    renterName: 'Robert Johnson',
    startDate: '2026-02-22T09:00:00',
    endDate: '2026-02-27T17:00:00',
    status: 'Confirmed',
    totalPrice: 310,
  },
  {
    id: '14',
    carId: 'car-2',
    carBrand: 'Tesla',
    carModel: 'Model 3',
    carColor: '#10b981',
    renterName: 'Emma Wilson',
    startDate: '2026-02-24T11:00:00',
    endDate: '2026-02-28T15:00:00',
    status: 'InProgress',
    totalPrice: 180,
  },
  {
    id: '15',
    carId: 'car-3',
    carBrand: 'Audi',
    carModel: 'A6',
    carColor: '#ef4444',
    renterName: 'William Brown',
    startDate: '2026-02-26T08:00:00',
    endDate: '2026-02-28T20:00:00',
    status: 'Confirmed',
    totalPrice: 140,
  },
];

interface ReservationsCalendarProps {
  ownerId: string;
}

interface Car {
  id: string;
  brand: string;
  model: string;
  color: string;
}

export const ReservationsCalendar: React.FC<ReservationsCalendarProps> = ({ ownerId }) => {
  const { t } = useLanguage();
  const [reservations, setReservations] = useState<CalendarReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedReservation, setDraggedReservation] = useState<CalendarReservation | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ carId: string; date: string } | null>(null);

  useEffect(() => {
    loadReservations();
  }, [ownerId]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);

      const data = await getOwnerCalendarReservations(ownerId, startDate, endDate);
      setReservations(data);
    } catch (error) {
      console.error('Failed to load reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setReservations(FAKE_RESERVATIONS);
      setLoading(false);
    }, 500);
  }, []);

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

  const uniqueCars: Car[] = Array.from(new Set(reservations.map(r => r.carId)))
    .map(carId => {
      const res = reservations.find(r => r.carId === carId);
      return res ? { id: carId, brand: res.carBrand, model: res.carModel, color: res.carColor || '#6b7280' } : null;
    })
    .filter(Boolean) as Car[];

  // Get number of days in the current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  // Generate dates for the entire month
  const getMonthDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(date);
    const dates: Date[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(year, month, day));
    }

    return dates;
  };

  const timelineDates = getMonthDates(currentDate);

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleReservationClick = (reservation: CalendarReservation) => {
    const startDate = new Date(reservation.startDate).toLocaleString();
    const endDate = new Date(reservation.endDate).toLocaleString();

    alert(`
${t('calendar.reservationDetails')}
${t('calendar.car')}: ${reservation.carBrand} ${reservation.carModel}
${t('calendar.renter')}: ${reservation.renterName}
${t('calendar.status')}: ${t(`calendar.status.${reservation.status.toLowerCase()}`)}
${t('calendar.totalPrice')}: €${reservation.totalPrice.toFixed(2)}
${t('calendar.start')}: ${startDate}
${t('calendar.end')}: ${endDate}
    `.trim());
  };

  const handleCellClick = (date: Date) => {
    setSelectedDate(date.toISOString().split('T')[0]);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedDate('');
  };

  const handleCreateReservation = async (data: any) => {
    try {
      console.log('Creating reservation:', data);
      alert(t('calendar.reservationCreated'));
      await loadReservations();
    } catch (error) {
      console.error('Failed to create reservation:', error);
      throw error;
    }
  };

  // Calculate position and width for reservations
  const getReservationStyle = (reservation: CalendarReservation) => {
    const startDate = new Date(reservation.startDate);
    const endDate = new Date(reservation.endDate);
    const timelineStart = timelineDates[0];
    const timelineEnd = timelineDates[timelineDates.length - 1];

    // Normalize dates to start of day for accurate day calculation
    const normalizeDate = (date: Date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);
    const normalizedTimelineStart = normalizeDate(timelineStart);
    const normalizedTimelineEnd = normalizeDate(timelineEnd);

    // Calculate start position (in days from timeline start)
    const startDiff = Math.floor((normalizedStart.getTime() - normalizedTimelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((normalizedEnd.getTime() - normalizedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check if reservation is outside visible range
    if (normalizedEnd < normalizedTimelineStart || normalizedStart > normalizedTimelineEnd) {
      return null;
    }

    // Adjust for partial visibility
    const visibleStart = Math.max(0, startDiff);
    const visibleEnd = Math.min(timelineDates.length, startDiff + duration);
    const visibleDuration = visibleEnd - visibleStart;

    if (visibleDuration <= 0) {
      return null;
    }

    const cellWidth = 100 / timelineDates.length;
    const left = visibleStart * cellWidth;
    const width = visibleDuration * cellWidth;

    return {
      left: `${left}%`,
      width: `${width}%`,
      backgroundColor: getStatusColor(reservation.status),
    };
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, reservation: CalendarReservation) => {
    setDraggedReservation(reservation);
    e.dataTransfer.effectAllowed = 'move';
    // Add dragging class to the element
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDragOverCell(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (carId: string, date: Date) => {
    setDragOverCell({ carId, date: date.toISOString() });
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, carId: string, date: Date) => {
    e.preventDefault();
    if (!draggedReservation) return;

    // Calculate the duration of the original reservation
    const originalStart = new Date(draggedReservation.startDate);
    const originalEnd = new Date(draggedReservation.endDate);
    const durationMs = originalEnd.getTime() - originalStart.getTime();

    // Set new start date to the dropped date
    const newStartDate = new Date(date);
    newStartDate.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);

    // Calculate new end date maintaining the same duration
    const newEndDate = new Date(newStartDate.getTime() + durationMs);

    // Update the reservation
    setReservations(prevReservations =>
      prevReservations.map(res =>
        res.id === draggedReservation.id
          ? {
              ...res,
              carId: carId,
              carBrand: carId === res.carId ? res.carBrand : uniqueCars.find(c => c.id === carId)?.brand || res.carBrand,
              carModel: carId === res.carId ? res.carModel : uniqueCars.find(c => c.id === carId)?.model || res.carModel,
              carColor: carId === res.carId ? res.carColor : uniqueCars.find(c => c.id === carId)?.color || res.carColor,
              startDate: newStartDate.toISOString(),
              endDate: newEndDate.toISOString(),
            }
          : res
      )
    );

    // Show success message
    const message = carId === draggedReservation.carId
      ? `Moved ${draggedReservation.renterName}'s reservation to ${newStartDate.toLocaleDateString()}`
      : `Moved ${draggedReservation.renterName}'s reservation to different car on ${newStartDate.toLocaleDateString()}`;

    alert(message);
    setDraggedReservation(null);

    // TODO: Here you would typically make an API call to update the reservation on the server
    // updateReservation(draggedReservation.id, { carId, startDate: newStartDate, endDate: newEndDate });
  };

  if (loading) {
    return (
      <div className="reservations-calendar">
        <div className="calendar-loading">{t('calendar.loading')}</div>
      </div>
    );
  }

  return (
    <div className="reservations-calendar">
      <div className="calendar-header-modern">
        <div className="calendar-header-left">
          <h2 className="calendar-title">{t('calendar.title')}</h2>
          <p className="calendar-subtitle">
            {reservations.length} {reservations.length !== 1 ? t('calendar.reservations') : t('calendar.reservation')}
          </p>
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="timeline-controls">
        <button className="timeline-btn" onClick={goToPreviousMonth}>
          {t('calendar.previous')}
        </button>
        <button className="timeline-btn" onClick={goToToday}>
          {t('calendar.today')}
        </button>
        <button className="timeline-btn" onClick={goToNextMonth}>
          {t('calendar.next')}
        </button>
        <span className="timeline-current-month">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Timeline Grid */}
       <div className="timeline-container">
        <div className="timeline-grid">
          {/* Header Row - Dates */}
          <div className="timeline-header">
            <div className="timeline-car-header">{t('calendar.cars')}</div>
            <div className="timeline-dates-header">
              {timelineDates.map((date, idx) => {
                const isToday = new Date().toDateString() === date.toDateString();
                return (
                  <div key={idx} className={`timeline-date-cell ${isToday ? 'timeline-date-today' : ''}`}>
                    <div className="timeline-date-day">{date.getDate()}</div>
                    <div className="timeline-date-weekday">
                      {date.toLocaleString('default', { weekday: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Car Rows */}
          {uniqueCars.map((car) => {
            const carReservations = reservations.filter(r => r.carId === car.id);

            return (
              <div key={car.id} className="timeline-row">
                {/* Car Info */}
                <div className="timeline-car-cell">
                  <div className="timeline-car-indicator" style={{ backgroundColor: car.color }} />
                  <div className="timeline-car-info">
                    <div className="timeline-car-brand">{car.brand}</div>
                    <div className="timeline-car-model">{car.model}</div>
                  </div>
                </div>

                {/* Timeline Cells */}
                <div className="timeline-cells-container">
                  <div className="timeline-cells">
                    {timelineDates.map((date, idx) => {
                      const isToday = new Date().toDateString() === date.toDateString();
                      const isDragOver = dragOverCell?.carId === car.id &&
                                        new Date(dragOverCell.date).toDateString() === date.toDateString();
                      return (
                        <div
                          key={idx}
                          className={`timeline-cell ${isToday ? 'timeline-cell-today' : ''} ${isDragOver ? 'timeline-cell-drag-over' : ''}`}
                          onDragOver={handleDragOver}
                          onDragEnter={() => handleDragEnter(car.id, date)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, car.id, date)}
                          onClick={() => handleCellClick(date)}
                        />
                      );
                    })}
                  </div>

                  {/* Reservation Blocks */}
                  <div className="timeline-reservations">
                    {carReservations.map((reservation) => {
                      const style = getReservationStyle(reservation);
                      if (!style) return null;

                      return (
                        <div
                          key={reservation.id}
                          className="timeline-reservation"
                          style={style}
                          draggable
                          onDragStart={(e) => handleDragStart(e, reservation)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReservationClick(reservation);
                          }}
                        >
                          <div className="timeline-reservation-content">
                            <div className="timeline-reservation-name">{reservation.renterName}</div>
                            <div className="timeline-reservation-dates">
                              {new Date(reservation.startDate).toLocaleDateString()} - {new Date(reservation.endDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Legend */}
      <div className="timeline-legend">
        <div className="legend-title">{t('calendar.status')}:</div>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#10b981' }} />
            <span>{t('calendar.status.confirmed')}</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#f59e0b' }} />
            <span>{t('calendar.status.pending')}</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#3b82f6' }} />
            <span>{t('calendar.status.inprogress')}</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#6b7280' }} />
            <span>{t('calendar.status.completed')}</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ef4444' }} />
            <span>{t('calendar.status.cancelled')}</span>
          </div>
        </div>
      </div>

      {/* Reservation Form */}
      <ReservationForm
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        initialDate={selectedDate}
        onSubmit={handleCreateReservation}
      />
    </div>
  );
};
