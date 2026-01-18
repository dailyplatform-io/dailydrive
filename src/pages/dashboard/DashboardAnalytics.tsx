import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { CarMetric, fetchOwnerAnalytics } from '../../service/ownerInsightsService';
import './DashboardAnalytics.css';

type MetricSection = {
  title: string;
  items: CarMetric[];
};

export const DashboardAnalytics: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [topInterest, setTopInterest] = useState<CarMetric[]>([]);
  const [topReserved, setTopReserved] = useState<CarMetric[]>([]);
  const [topSold, setTopSold] = useState<CarMetric[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchOwnerAnalytics();
        setTopInterest(data.topInterest ?? []);
        setTopReserved(data.topReserved ?? []);
        setTopSold(data.topSold ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const sections = useMemo<MetricSection[]>(
    () => [
      { title: t('dashboard.analytics.mostInterested'), items: topInterest },
      { title: t('dashboard.analytics.mostReserved'), items: topReserved },
      { title: t('dashboard.analytics.mostSold'), items: topSold },
    ],
    [t, topInterest, topReserved, topSold]
  );

  if (loading) {
    return <p className="dashboard-analytics__status">{t('dashboard.analytics.loading')}</p>;
  }

  if (error) {
    return <p className="dashboard-analytics__status">{error}</p>;
  }

  return (
    <section className="dashboard-analytics">
      <div className="dashboard-analytics__grid">
        {sections.map((section) => (
          <div key={section.title} className="dashboard-analytics__card">
            <h3>{section.title}</h3>
            {section.items.length === 0 ? (
              <p className="muted">{t('dashboard.analytics.empty')}</p>
            ) : (
              <ul>
                {section.items.map((item) => (
                  <li key={`${item.brand}-${item.model}-${item.year}`}>
                    <span className="label">
                      {item.brand} {item.model} {item.year}
                    </span>
                    <span className="value">{item.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
