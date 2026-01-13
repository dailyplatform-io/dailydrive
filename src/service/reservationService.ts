import { API_BASE_URL } from '../config/api';

export interface Reservation {
  id: string;
  carId: string;
  carBrand: string;
  carModel: string;
  carImageUrl?: string;
  renterId: string;
  renterName: string;
  renterEmail?: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'InProgress';
  notes?: string;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface CalendarReservation {
  id: string;
  carId: string;
  carBrand: string;
  carModel: string;
  carColor: string;
  carImageUrl?: string;
  renterName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
}

export interface CreateReservationRequest {
  carId: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface AvailabilityResponse {
  isAvailable: boolean;
  unavailableDates: { startDate: string; endDate: string }[];
}

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('ownerToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

export const checkCarAvailability = async (
  carId: string,
  startDate: Date,
  endDate: Date
): Promise<AvailabilityResponse> => {
  const response = await fetch(`${API_BASE_URL}/reservations/check-availability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      carId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to check availability');
  }

  return response.json();
};

export const createReservation = async (
  request: CreateReservationRequest
): Promise<Reservation> => {
  const response = await fetch(`${API_BASE_URL}/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create reservation');
  }

  return response.json();
};

export const getMyReservations = async (): Promise<Reservation[]> => {
  const response = await fetch(`${API_BASE_URL}/reservations/my-reservations`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch reservations');
  }

  return response.json();
};

export const getOwnerCalendarReservations = async (
  ownerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CalendarReservation[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate.toISOString());
  if (endDate) params.append('endDate', endDate.toISOString());

  const response = await fetch(
    `${API_BASE_URL}/reservations/owner/${ownerId}/calendar?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch calendar reservations');
  }

  return response.json();
};

export const confirmReservation = async (id: string): Promise<Reservation> => {
  const response = await fetch(`${API_BASE_URL}/reservations/${id}/confirm`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to confirm reservation');
  }

  return response.json();
};

export const cancelReservation = async (
  id: string,
  reason?: string
): Promise<Reservation> => {
  const response = await fetch(`${API_BASE_URL}/reservations/${id}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(reason),
  });

  if (!response.ok) {
    throw new Error('Failed to cancel reservation');
  }

  return response.json();
};
