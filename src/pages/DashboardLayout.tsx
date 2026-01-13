import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTrialManagement } from '../hooks/useTrialManagement';
import { TrialStatusBanner, SubscriptionStatus } from '../components/TrialStatus';
import './OwnerDashboard.css';

export const DashboardLayout: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  const { 
    trial, 
    subscription, 
    isLoading, 
    navigateToPayment 
  } = useTrialManagement();

  // Check for messages from navigation state (e.g., from payment page)
  useEffect(() => {
    const navState = location.state as { message?: string } | null;
    if (navState?.message) {
      setSuccessMessage(navState.message);
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
      // Auto-clear message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [location.state]);

  if (!user || isLoading) return null;

  return (
    <main className="owner-dashboard">
      <header className="owner-dashboard__top">
        <div>
          <h2 className="owner-dashboard__title">{t('dashboard.title')}</h2>
          <p className="owner-dashboard__subtitle">
            {t('dashboard.welcome', { name: `${user.name} ${user.surname}` })}
          </p>
        </div>
      </header>
      
      {successMessage && (
        <div className="owner-auth-success" style={{ marginBottom: '20px' }}>
          {successMessage}
        </div>
      )}
      
      {subscription.hasActiveSubscription && (
        <SubscriptionStatus
          subscriptionTier={subscription.subscriptionTier}
          paymentMethod={subscription.paymentMethod}
        />
      )}
      
      {trial.isInTrial && trial.daysLeft > 0 && (
        <TrialStatusBanner
          daysLeft={trial.daysLeft}
          onUpgradeClick={() => navigateToPayment(false)}
        />
      )}

      <Outlet />
    </main>
  );
};
