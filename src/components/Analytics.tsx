import { useState } from 'react';
import { TrendingUp, Car, KeyRound, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './Analytics.css';

interface Booking {
  id: string;
  customer: string;
  phone: string;
  type: 'Car' | 'Motorcycle';
  unit: string;
  plan: string;
  pickupDate: string;
  returnDate: string;
  payment: number;
  status: 'Confirmed' | 'Waiting' | 'Completed' | 'Canceled';
}

const FAKE_BOOKINGS: Booking[] = [
  {
    id: 'CR08781',
    customer: 'Fridolina Rodrigo',
    phone: '+62 833 6755 6767',
    type: 'Car',
    unit: 'Mazda RX 8',
    plan: '2 days',
    pickupDate: '5-10-2023',
    returnDate: '7-10-2023',
    payment: 425.00,
    status: 'Confirmed',
  },
  {
    id: 'MR04167',
    customer: 'Daffa Mars',
    phone: '+62 823 0911 0980',
    type: 'Motorcycle',
    unit: 'Honda CBR 1000R',
    plan: '1 days',
    pickupDate: '5-10-2023',
    returnDate: '6-10-2023',
    payment: 130.00,
    status: 'Confirmed',
  },
  {
    id: 'MR02303',
    customer: 'Andika Kempot',
    phone: '+62 831 9088 9712',
    type: 'Motorcycle',
    unit: 'Yamaha R1',
    plan: '3 days',
    pickupDate: '3-10-2023',
    returnDate: '6-10-2023',
    payment: 129.00,
    status: 'Waiting',
  },
  {
    id: 'CR09087',
    customer: 'Syaiful Besari',
    phone: '+62 836 8700 5666',
    type: 'Car',
    unit: 'Tesla Model 3',
    plan: '7 days',
    pickupDate: '2-10-2023',
    returnDate: '8-10-2023',
    payment: 873.00,
    status: 'Completed',
  },
  {
    id: 'CR06125',
    customer: 'Rafi Sagita',
    phone: '+62 812 8697 9871',
    type: 'Car',
    unit: 'Suzuki L3000',
    plan: '1 days',
    pickupDate: '2-10-2023',
    returnDate: '3-10-2023',
    payment: 80.00,
    status: 'Canceled',
  },
];

const WEEKLY_DATA = [
  { day: 'Sunday', revenue: 800, goals: 1000 },
  { day: 'Monday', revenue: 300, goals: 800 },
  { day: 'Tuesday', revenue: 2000, goals: 2100 },
  { day: 'Wednesday', revenue: 2000, goals: 2100 },
  { day: 'Thursday', revenue: 8200, goals: 8500 },
  { day: 'Friday', revenue: 8200, goals: 8500 },
  { day: 'Saturday', revenue: 8200, goals: 8500 },
];

const POPULAR_VEHICLES = [
  { name: 'Tesla Model X', pricePerDay: 120, type: 'Car', avgPerDay: '50 Unit' },
  { name: 'Saki Eliminator', pricePerDay: 85, type: 'Motorcycle', avgPerDay: '40 Unit' },
  { name: 'Yamaha R1', pricePerDay: 65, type: 'Motorcycle', avgPerDay: '38 Unit' },
];

export const Analytics: React.FC = () => {
  const { t } = useLanguage();
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'status-confirmed';
      case 'Waiting':
        return 'status-waiting';
      case 'Completed':
        return 'status-completed';
      case 'Canceled':
        return 'status-canceled';
      default:
        return '';
    }
  };

  return (
    <div className="analytics-page">
      {/* Stats Cards */}
      <div className="analytics-stats">
        <div className="stat-card stat-card--revenue">
          <div className="stat-card__icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__label">{t('analytics.stats.totalRevenue')}</div>
            <div className="stat-card__value">$29,672.23</div>
          </div>
        </div>

        <div className="stat-card stat-card--available">
          <div className="stat-card__icon">
            <Car size={24} />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__label">{t('analytics.stats.availableUnit')}</div>
            <div className="stat-card__value">666 {t('analytics.stats.unit')}</div>
          </div>
        </div>

        <div className="stat-card stat-card--rented">
          <div className="stat-card__icon">
            <KeyRound size={24} />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__label">{t('analytics.stats.currentlyRented')}</div>
            <div className="stat-card__value">230 {t('analytics.stats.unit')}</div>
          </div>
        </div>

        <div className="stat-card stat-card--tracking">
          <div className="stat-card__header">
            <div className="stat-card__icon">
              <MapPin size={24} />
            </div>
            <div className="stat-card__label">{t('analytics.stats.liveTracking')}</div>
          </div>
          <div className="tracking-map">
            <div className="tracking-map__placeholder">
              <MapPin size={48} />
              <p>{t('analytics.stats.mapView')}</p>
            </div>
          </div>
          <div className="tracking-info">
            <span className="tracking-today">{t('analytics.stats.today')}</span>
            <span className="tracking-stats">120 {t('analytics.stats.carRent')} • 90 {t('analytics.stats.motorcycleRent')}</span>
          </div>
        </div>
      </div>

      {/* Quick Analytics Chart */}
      <div className="analytics-chart-section">
        <div className="chart-header">
          <h2 className="chart-title">{t('analytics.chart.title')}</h2>
          <div className="chart-controls">
            <button
              className={`chart-control-btn ${timeframe === 'weekly' ? 'active' : ''}`}
              onClick={() => setTimeframe('weekly')}
            >
              {t('analytics.chart.weekly')}
            </button>
            <button
              className={`chart-control-btn ${timeframe === 'monthly' ? 'active' : ''}`}
              onClick={() => setTimeframe('monthly')}
            >
              {t('analytics.chart.monthly')}
            </button>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-y-axis">
            <span>24k</span>
            <span>16k</span>
            <span>8k</span>
            <span>4k</span>
            <span>2k</span>
            <span>1k</span>
            <span>500</span>
            <span>250</span>
            <span>0</span>
          </div>

          <div className="chart-content">
            <svg className="chart-svg" viewBox="0 0 700 300" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="37.5" x2="700" y2="37.5" stroke="#f0f0f0" strokeWidth="1" />
              <line x1="0" y1="75" x2="700" y2="75" stroke="#f0f0f0" strokeWidth="1" />
              <line x1="0" y1="112.5" x2="700" y2="112.5" stroke="#f0f0f0" strokeWidth="1" />
              <line x1="0" y1="150" x2="700" y2="150" stroke="#f0f0f0" strokeWidth="1" />
              <line x1="0" y1="187.5" x2="700" y2="187.5" stroke="#f0f0f0" strokeWidth="1" />
              <line x1="0" y1="225" x2="700" y2="225" stroke="#f0f0f0" strokeWidth="1" />
              <line x1="0" y1="262.5" x2="700" y2="262.5" stroke="#f0f0f0" strokeWidth="1" />

              {/* Revenue line (solid) */}
              <polyline
                points="0,275 100,290 200,200 300,198 400,15 500,15 600,15"
                fill="none"
                stroke="#2f80ed"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Goals line (dashed) */}
              <polyline
                points="0,270 100,285 200,195 300,193 400,10 500,10 600,10"
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="8,8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data point on Wednesday */}
              <circle cx="300" cy="198" r="6" fill="#2f80ed" stroke="white" strokeWidth="2" />
            </svg>

            <div className="chart-x-axis">
              {WEEKLY_DATA.map((data, index) => (
                <span key={index}>{data.day}</span>
              ))}
            </div>

            {/* Tooltip */}
            <div className="chart-tooltip" style={{ left: '42%', top: '50%' }}>
              <div className="chart-tooltip__day">{t('analytics.chart.wednesday')}</div>
              <div className="chart-tooltip__item">
                <span className="chart-tooltip__label">
                  <span className="chart-tooltip__dot chart-tooltip__dot--revenue"></span>
                  {t('analytics.chart.revenue')}
                </span>
                <span className="chart-tooltip__value">$2,000</span>
              </div>
              <div className="chart-tooltip__item">
                <span className="chart-tooltip__label">
                  <span className="chart-tooltip__dot chart-tooltip__dot--goals"></span>
                  {t('analytics.chart.goals')}
                </span>
                <span className="chart-tooltip__value">$2,100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Vehicle Section */}
      <div className="popular-vehicles-section">
        <h2 className="section-title">{t('analytics.popularVehicles.title')}</h2>
        <div className="popular-vehicles-table">
          <div className="popular-vehicles-header">
            <div className="pv-col pv-col--unit">{t('analytics.popularVehicles.unit')}</div>
            <div className="pv-col pv-col--type">{t('analytics.popularVehicles.type')}</div>
            <div className="pv-col pv-col--avg">{t('analytics.popularVehicles.avgDay')}</div>
          </div>
          <div className="popular-vehicles-body">
            {POPULAR_VEHICLES.map((vehicle, index) => (
              <div key={index} className="popular-vehicle-row">
                <div className="pv-col pv-col--unit">
                  <div className="pv-vehicle">
                    <div className="pv-vehicle-icon">
                      {vehicle.type === 'Car' ? <Car size={20} /> : <span>🏍️</span>}
                    </div>
                    <div className="pv-vehicle-info">
                      <div className="pv-vehicle-name">{vehicle.name}</div>
                      <div className="pv-vehicle-price">${vehicle.pricePerDay}/days</div>
                    </div>
                  </div>
                </div>
                <div className="pv-col pv-col--type">{vehicle.type}</div>
                <div className="pv-col pv-col--avg">
                  <span className="pv-avg-badge">{vehicle.avgPerDay}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking List Section */}
      <div className="booking-list-section">
        <div className="booking-list-header">
          <h2 className="section-title">{t('analytics.bookingList.title')}</h2>
          <button className="filter-btn">
            <span>≡</span> {t('analytics.bookingList.filter')}
          </button>
        </div>

        <div className="booking-table-wrapper">
          <table className="booking-table">
            <thead>
              <tr>
                <th>{t('analytics.bookingList.bookingId')}</th>
                <th>{t('analytics.bookingList.customer')}</th>
                <th>{t('analytics.bookingList.phoneNumber')}</th>
                <th>{t('analytics.bookingList.type')}</th>
                <th>{t('analytics.bookingList.unit')}</th>
                <th>{t('analytics.bookingList.plan')}</th>
                <th>{t('analytics.bookingList.pickupDate')}</th>
                <th>{t('analytics.bookingList.returnDate')}</th>
                <th>{t('analytics.bookingList.payment')}</th>
                <th>{t('analytics.bookingList.status')}</th>
              </tr>
            </thead>
            <tbody>
              {FAKE_BOOKINGS.map((booking) => (
                <tr key={booking.id}>
                  <td className="booking-id">{booking.id}</td>
                  <td>{booking.customer}</td>
                  <td className="phone-number">{booking.phone}</td>
                  <td>{booking.type}</td>
                  <td>{booking.unit}</td>
                  <td>{booking.plan}</td>
                  <td>{booking.pickupDate}</td>
                  <td>{booking.returnDate}</td>
                  <td className="payment">${booking.payment.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(booking.status)}`}>
                      {t(`analytics.bookingList.status${booking.status}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
