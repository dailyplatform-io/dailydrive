import { Car } from './Car';

export interface AuctionBid {
  id: string;
  bidderName: string;
  amountEur: number;
  createdAt: string;
}

export interface Auction {
  id: string;
  carId: string;
  car: Car;
  startPriceEur: number;
  buyNowPriceEur?: number | null;
  currentPriceEur: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  hasStarted: boolean;
  hasEnded: boolean;
  issues: string[];
  imageUrls: string[];
  videoUrls: string[];
  bids: AuctionBid[];
}
