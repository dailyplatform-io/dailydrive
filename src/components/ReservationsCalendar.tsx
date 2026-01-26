import { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { CalendarReservation, getOwnerCalendarReservations } from '../service/reservationService';
import { ReservationForm } from './ReservationCalendarFolder/ReservationForm';
import './ReservationsCalendar.css';

const FAKE_RESERVATIONS: CalendarReservation[] = [
  {
    id: '1',
    carId: 'car-1',
    carBrand: 'BMW',
    carModel: 'X5',
    carColor: '#2563eb',
    renterName: 'John Doe',
    startDate: '2026-01-20T08:00:00',
    endDate: '2026-01-25T18:00:00',
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
    startDate: '2026-01-20T10:00:00',
    endDate: '2026-01-25T12:00:00',
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
    startDate: '2026-01-21T09:00:00',
    endDate: '2026-01-25T20:00:00',
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
    startDate: '2026-01-20T14:00:00',
    endDate: '2026-01-25T19:00:00',
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
    startDate: '2026-01-20T08:00:00',
    endDate: '2026-01-25T08:00:00',
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
    startDate: '2026-01-22T11:00:00',
    endDate: '2026-01-22T17:00:00',
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
    startDate: '2026-01-23T09:00:00',
    endDate: '2026-01-24T18:00:00',
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
    startDate: '2026-01-24T07:00:00',
    endDate: '2026-01-24T12:00:00',
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
    startDate: '2026-01-24T13:00:00',
    endDate: '2026-01-25T16:00:00',
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
    startDate: '2026-01-25T09:00:00',
    endDate: '2026-01-25T20:00:00',
    status: 'Confirmed',
    totalPrice: 190,
  },
];



interface ReservationsCalendarProps {
  ownerId: string;
}

export const ReservationsCalendar: React.FC<ReservationsCalendarProps> = ({ ownerId }) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [reservations, setReservations] = useState<CalendarReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    loadReservations();
  }, [ownerId]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      // Load reservations for the next 6 months
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

  // Transform reservations to FullCalendar events
  const events = reservations.map((res) => ({
    id: res.id,
    title: `${res.carBrand} ${res.carModel} - ${res.renterName}`,
    start: res.startDate,
    end: res.endDate,
    backgroundColor: getStatusColor(res.status),
    borderColor: getStatusColor(res.status),
    extendedProps: {
      carBrand: res.carBrand,
      carModel: res.carModel,
      renterName: res.renterName,
      totalPrice: res.totalPrice,
      status: res.status,
      carId: res.carId,
      carColor: res.carColor,
    },
  }));

  const handleEventClick = (info: any) => {
    const event = info.event;
    const props = event.extendedProps;

    alert(`
Reservation Details:
Car: ${props.carBrand} ${props.carModel}
Renter: ${props.renterName}
Status: ${props.status}
Total Price: €${props.totalPrice.toFixed(2)}
Start: ${new Date(event.start).toLocaleString()}
End: ${new Date(event.end).toLocaleString()}
    `.trim());
  };

  const handleDateClick = (info: any) => {
    setSelectedDate(info.dateStr);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedDate('');
  };

  useEffect(() => {
  setLoading(true);

  setTimeout(() => {
    setReservations(FAKE_RESERVATIONS);
    setLoading(false);
  }, 500); // simulate network delay
}, []);


  const handleCreateReservation = async (data: any) => {
    try {
      // TODO: Call API to create reservation
      console.log('Creating reservation:', data);

      // For now, just show success message
      alert('Reservation created successfully!');

      // Reload reservations
      await loadReservations();
    } catch (error) {
      console.error('Failed to create reservation:', error);
      throw error;
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
      <div className="calendar-header-modern">
        <div className="calendar-header-left">
          <h2 className="calendar-title">Reservations Calendar</h2>
          <p className="calendar-subtitle">
            {reservations.length} reservation{reservations.length !== 1 ? 's' : ''}
          </p>
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

      <div className="fullcalendar-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          editable={false}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={3}
          moreLinkClick="popover"
          weekends={true}
          height="auto"
          eventDisplay="block"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
          }}
          views={{
            dayGridMonth: {
              titleFormat: { year: 'numeric', month: 'long' }
            },
            timeGridWeek: {
              titleFormat: { year: 'numeric', month: 'short', day: 'numeric' }
            },
            timeGridDay: {
              titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
            }
          }}
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day',
            list: 'List'
          }}
          eventContent={(eventInfo) => {
            return (
              <div className="fc-event-custom">
                <div className="fc-event-time">
                  {eventInfo.timeText}
                </div>
                <div className="fc-event-title-custom">
                  {eventInfo.event.extendedProps.carBrand} {eventInfo.event.extendedProps.carModel}
                </div>
                <div className="fc-event-subtitle">
                  {eventInfo.event.extendedProps.renterName}
                </div>
              </div>
            );
          }}
        />
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
