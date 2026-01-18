const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface CarInterestPayload {
  brand: string;
  model: string;
  bodyStyle?: string;
  contactName?: string;
  contactEmail: string;
  contactPhone?: string;
}

export const createCarInterest = async (payload: CarInterestPayload) => {
  const response = await fetch(`${API_BASE_URL}/carinterests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = 'Failed to save notification request.';
    try {
      const data = await response.json();
      message = data?.message || data?.title || message;
    } catch {
      // Ignore JSON parsing errors and keep fallback message.
    }
    throw new Error(message);
  }

  return response.json();
};
