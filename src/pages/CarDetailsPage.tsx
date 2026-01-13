import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { CarDetailsPanel } from '../components/CarDetailsPanel';
import { fetchCarByIdFromAPI } from '../service/carService';
import './CarDetailsPage.css';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Car } from '../models/Car';
import { SellerCarsPage } from './SellerCarsPage';

export const CarDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [car, setCar] = useState<Car | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [showSellerPage, setShowSellerPage] = useState<boolean>(false);
  const isAuctionRoute = useMemo(() => location.pathname.startsWith('/auction/'), [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setLoading(false);
      setCar(undefined);
      setShowSellerPage(false);
      return;
    }

    void (async () => {
      setLoading(true);
      setShowSellerPage(false);
      try {
        const fromApi = await fetchCarByIdFromAPI(id);
        if (cancelled) return;
        if (fromApi) {
          setCar(fromApi);
          setShowSellerPage(false);
        } else {
          setCar(undefined);
          setShowSellerPage(!isAuctionRoute);
        }
      } catch (error) {
        console.error('Failed to load car:', error);
        if (!cancelled) {
          setCar(undefined);
          setShowSellerPage(!isAuctionRoute);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (showSellerPage && id) {
    return <SellerCarsPage sellerName={id} />;
  }

  return (
    <div className="details-page">
      <div className="details-page__bar">
        <button className="back-button" type="button" onClick={() => navigate(-1)}>
          ← {t('common.back')}
        </button>
      </div>
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
      ) : (
        <CarDetailsPanel car={car} showTabs />
      )}
    </div>
  );
};
