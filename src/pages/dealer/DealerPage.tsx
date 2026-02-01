import { useParams } from 'react-router-dom';
import { SellerCarsPage } from '../seller/SellerCarsPage';

export const DealerPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return null;
  return <SellerCarsPage sellerName={slug} />;
};
