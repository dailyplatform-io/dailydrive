import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { features } from '../config/features';
import {
  Car,
  Calendar,
  BarChart3,
  DollarSign,
  Gavel,
  LogOut,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const DashboardSidebar: React.FC = () => {
  const { t } = useLanguage();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard/cars',
      icon: Car,
      label: t('dashboard.tabs.cars'),
      show: true,
    },
    {
      to: '/dashboard/auctions',
      icon: Gavel,
      label: t('dashboard.tabs.auctions'),
      show: features.auctions,
    },
    {
      to: '/dashboard/reservations',
      icon: Calendar,
      label: t('dashboard.tabs.reservations'),
      show: true,
    },
    {
      to: '/dashboard/analytics',
      icon: BarChart3,
      label: t('dashboard.tabs.analytics'),
      show: true,
    },
    {
      to: '/dashboard/revenue',
      icon: DollarSign,
      label: t('dashboard.tabs.revenue'),
      show: true,
    },
  ];

  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.name?.[0] || '';
    const lastInitial = user.surname?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase() || 'U';
  };

  const displayName = user ? `${user.name} ${user.surname}` : 'User';

  return (
    <aside className="dashboard-sidebar">
      <nav className="dashboard-sidebar__nav">
        {navItems.map((item) => {
          if (!item.show) return null;

          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `dashboard-sidebar__link ${isActive ? 'is-active' : ''}`
              }
            >
              <Icon size={20} className="dashboard-sidebar__icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="dashboard-sidebar__profile">
        <button
          className="dashboard-sidebar__profile-trigger"
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
        >
          <div className="dashboard-sidebar__profile-info">
            <div className="dashboard-sidebar__avatar">
              {getInitials()}
            </div>
            <div className="dashboard-sidebar__profile-text">
              <div className="dashboard-sidebar__profile-name">{displayName}</div>
              <div className="dashboard-sidebar__profile-email">{user?.email}</div>
            </div>
          </div>
          {isProfileMenuOpen ? (
            <ChevronUp size={18} className="dashboard-sidebar__profile-chevron" />
          ) : (
            <ChevronDown size={18} className="dashboard-sidebar__profile-chevron" />
          )}
        </button>

        {isProfileMenuOpen && (
          <div className="dashboard-sidebar__profile-menu">
            <NavLink
              to="/dashboard/profile"
              className="dashboard-sidebar__profile-menu-item"
              onClick={() => setIsProfileMenuOpen(false)}
            >
              <Settings size={18} />
              <span>{t('dashboard.tabs.profile')}</span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="dashboard-sidebar__profile-menu-item dashboard-sidebar__profile-menu-item--danger"
            >
              <LogOut size={18} />
              <span>{t('dashboard.tabs.logout')}</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
