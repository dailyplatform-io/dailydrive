import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { fetchOwnerRevenue, OwnerRevenueResponse } from '../../service/ownerInsightsService';
import './DashboardRevenue.css';

export const DashboardRevenue: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<OwnerRevenueResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetchOwnerRevenue();
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load revenue.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const maxRevenue = useMemo(() => {
    if (!data?.monthlyRevenue?.length) return 0;
    return Math.max(...data.monthlyRevenue.map((item) => item.amount));
  }, [data]);

  const pieBackground = useMemo(() => {
    if (!data) return 'conic-gradient(#2f80ed 0deg, #e6eef8 0deg)';
    const total = data.carStatus.active + data.carStatus.sold + data.carStatus.inactive;
    if (total === 0) return 'conic-gradient(#2f80ed 0deg, #e6eef8 0deg)';
    const activePct = (data.carStatus.active / total) * 360;
    const soldPct = (data.carStatus.sold / total) * 360;
    return `conic-gradient(#2f80ed 0deg ${activePct}deg, #22c55e ${activePct}deg ${activePct + soldPct}deg, #f59e0b ${activePct + soldPct}deg 360deg)`;
  }, [data]);

  if (loading) {
    return <p className="dashboard-revenue__status">{t('dashboard.revenue.loading')}</p>;
  }

  if (error) {
    return <p className="dashboard-revenue__status">{error}</p>;
  }

  if (!data) return null;

  return (
    <section className="dashboard-revenue">
      <div className="dashboard-revenue__summary">
        <div className="dashboard-revenue__card">
          <h3>{t('dashboard.revenue.total')}</h3>
          <p className="dashboard-revenue__amount">€{data.totalRevenue.toFixed(2)}</p>
          <p className="muted">
            {t('dashboard.revenue.totalSold', { count: data.carStatus.sold })}
          </p>
        </div>
        <div className="dashboard-revenue__card">
          <h3>{t('dashboard.revenue.carStatus')}</h3>
          <div className="dashboard-revenue__pie" style={{ background: pieBackground }}>
            <div className="dashboard-revenue__pie-center">
              <span className="value">{data.carStatus.active + data.carStatus.sold + data.carStatus.inactive}</span>
              <span className="label">{t('dashboard.revenue.cars')}</span>
            </div>
          </div>
          <div className="dashboard-revenue__legend">
            <span>
              <i className="dot dot--active" />
              {t('dashboard.revenue.active')}: {data.carStatus.active}
            </span>
            <span>
              <i className="dot dot--sold" />
              {t('dashboard.revenue.sold')}: {data.carStatus.sold}
            </span>
            <span>
              <i className="dot dot--inactive" />
              {t('dashboard.revenue.inactive')}: {data.carStatus.inactive}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-revenue__card">
        <h3>{t('dashboard.revenue.monthly')}</h3>
        <div className="dashboard-revenue__bars">
          {data.monthlyRevenue.map((item) => {
            const width = maxRevenue === 0 ? 0 : Math.round((item.amount / maxRevenue) * 100);
            return (
              <div key={item.month} className="dashboard-revenue__bar">
                <span className="label">{item.month}</span>
                <div className="track">
                  <div className="fill" style={{ width: `${width}%` }} />
                </div>
                <span className="value">€{item.amount.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
