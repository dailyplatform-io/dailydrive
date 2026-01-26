import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { fetchOwnerAnalytics } from '../../service/ownerInsightsService';
import './DashboardAnalytics.css';
import { Analytics } from '../../components/Analytics';

export const DashboardAnalytics: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        // TODO: correct api call
        await fetchOwnerAnalytics();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return <p className="dashboard-analytics__status">{t('dashboard.analytics.loading')}</p>;
  }

  if (error) {
    return <p className="dashboard-analytics__status">{error}</p>;
  }

  return (
    <Analytics/>
  );
};
