import { getCurrentAuthToken } from '../utils/tokenUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface CarMetric {
  brand: string;
  model: string;
  year: number;
  count: number;
}

export interface OwnerAnalyticsResponse {
  topInterest: CarMetric[];
  topActive: CarMetric[];
  topSold: CarMetric[];
}

export interface MonthlyRevenue {
  month: string;
  amount: number;
}

export interface OwnerRevenueResponse {
  totalRevenue: number;
  monthlyRevenue: MonthlyRevenue[];
  carStatus: { active: number; sold: number; inactive: number };
  totalReservations: number;
}

const authHeaders = () => {
  const token = getCurrentAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchOwnerAnalytics = async (): Promise<OwnerAnalyticsResponse> => {
  const response = await fetch(`${API_BASE_URL}/owner/analytics`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load analytics.');
  }

  return response.json();
};

export const fetchOwnerRevenue = async (): Promise<OwnerRevenueResponse> => {
  const response = await fetch(`${API_BASE_URL}/owner/revenue`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load revenue.');
  }

  return response.json();
};
