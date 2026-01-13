import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ReservationsCalendar } from '../../components/ReservationsCalendar';
import '../OwnerDashboard.css';

export const DashboardReservations: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <section className="owner-dashboard__panel">
      <div className="owner-panel__head">
        <div>
          <p className="owner-panel__title">{t('dashboard.reservations.title')}</p>
          <p className="muted">{t('dashboard.reservations.subtitle')}</p>
        </div>
      </div>
      <ReservationsCalendar ownerId={user.id} />
    </section>
  );
};

export default DashboardReservations;
