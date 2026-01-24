/**
 * Geocoding service for converting addresses to coordinates using Nominatim API
 */

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
};

type NominatimReverseResult = {
  display_name?: string;
  address?: Record<string, string>;
};

/**
 * Default coordinates for Albania (Tirana)
 */
export const ALBANIA_DEFAULT_COORDS = {
  lat: 41.3275,
  lng: 19.8187,
};

/**
 * Map of common Albanian diacritic characters to their ASCII equivalents
 */
const ALBANIAN_DIACRITIC_MAP: Record<string, string> = {
  'ë': 'e',
  'Ë': 'E',
  'ç': 'c',
  'Ç': 'C',
};

/**
 * Normalize an address by handling variations in spelling and non-ASCII characters
 * This helps ensure consistency when geocoding addresses with diacritics
 * @param address The address to normalize
 * @returns Normalized address string
 */
export function normalizeAddress(address: string): string {
  if (!address) return '';
  
  // Trim and remove extra whitespace
  let normalized = address.trim().replace(/\s+/g, ' ');
  
  // Replace diacritics with their base characters
  normalized = normalized.split('').map(char => ALBANIAN_DIACRITIC_MAP[char] || char).join('');
  
  return normalized;
}

/**
 * Geocoding request delay in milliseconds to respect API rate limits
 */
const GEOCODING_REQUEST_DELAY_MS = 1000;

/**
 * Get multiple variations of an address for geocoding attempts
 * @param address The original address
 * @param city The city name (optional)
 * @returns Array of address variations to try
 */
function getAddressVariations(address: string, city?: string): string[] {
  const variations: string[] = [];
  
  // Original address
  variations.push(address);
  
  // Normalized address (without diacritics)
  const normalized = normalizeAddress(address);
  if (normalized !== address) {
    variations.push(normalized);
  }
  
  // If city is provided, try with explicit country suffix to help geocoding
  if (city && city.trim()) {
    const cityNormalized = normalizeAddress(city);
    
    // Add Albania suffix only if not already present
    if (!address.toLowerCase().includes('albania')) {
      // Try with both city and country
      variations.push(`${address}, ${city}, Albania`);
      variations.push(`${normalized}, ${cityNormalized}, Albania`);
      
      // Try with just country (useful when address already contains city)
      variations.push(`${address}, Albania`);
      variations.push(`${normalized}, Albania`);
    }
  }
  
  // Remove duplicates while preserving order
  return Array.from(new Set(variations));
}

function getCityFromAddress(address?: Record<string, string>) {
  if (!address) return '';
  return address.city || address.town || address.village || address.county || address.state || '';
}

function formatCompactAddress(address?: Record<string, string>, displayName?: string) {
  if (address) {
    const road =
      address.road ||
      address.pedestrian ||
      address.footway ||
      address.cycleway ||
      address.path ||
      address.residential ||
      '';
    const locality =
      address.village ||
      address.hamlet ||
      address.suburb ||
      address.neighbourhood ||
      address.quarter ||
      '';
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      address.state ||
      address.region ||
      '';
    const country = address.country || '';
    const parts = [road, locality, city, country].filter(Boolean);
    if (parts.length >= 2) return parts.join(', ');
  }

  if (displayName) {
    const trimmed = displayName.split(',').slice(0, 2).map((part) => part.trim()).filter(Boolean);
    if (trimmed.length) return trimmed.join(', ');
  }

  return '';
}

/**
 * Attempt to geocode a single address query
 * @param query The address query to geocode
 * @returns Promise with lat/lng coordinates or null if geocoding fails
 */
async function geocodeSingleQuery(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '1');
    url.searchParams.set('q', query);

    const response = await fetch(url.toString(), {
      headers: { 
        Accept: 'application/json',
        'User-Agent': 'DailyRide/1.0 (https://github.com/juxhinxhihani/dailyride)'
      },
    });

    if (!response.ok) {
      console.warn(`[Geocoding] HTTP ${response.status} for query: "${query}"`);
      return null;
    }

    const results = (await response.json()) as NominatimResult[];
    
    if (results.length === 0) {
      console.info(`[Geocoding] No results for query: "${query}"`);
      return null;
    }

    const result = results[0];
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (isNaN(lat) || isNaN(lng)) {
      console.warn(`[Geocoding] Invalid coordinates in result for query: "${query}"`, result);
      return null;
    }

    console.info(`[Geocoding] Success for query: "${query}" -> (${lat}, ${lng})`);
    return { lat, lng };
  } catch (error) {
    console.error(`[Geocoding] Exception for query: "${query}"`, error);
    return null;
  }
}

/**
 * Geocode an address to get coordinates with normalization and fallback
 * @param address The address to geocode
 * @param city Optional city name to help with geocoding
 * @returns Promise with lat/lng coordinates or null if all attempts fail
 */
export async function geocodeAddress(
  address: string, 
  city?: string
): Promise<{ lat: number; lng: number } | null> {
  if (!address || address.trim().length === 0) {
    console.warn('[Geocoding] Empty address provided');
    return null;
  }

  console.info(`[Geocoding] Starting geocoding for address: "${address}"${city ? `, city: "${city}"` : ''}`);

  // Get address variations to try
  const variations = getAddressVariations(address, city);
  console.info(`[Geocoding] Trying ${variations.length} address variations`);

  // Try each variation with a small delay between requests to respect API rate limits
  for (let i = 0; i < variations.length; i++) {
    const variation = variations[i];
    
    // Add delay between requests (except for first request)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, GEOCODING_REQUEST_DELAY_MS));
    }

    const result = await geocodeSingleQuery(variation);
    if (result) {
      console.info(`[Geocoding] Successfully geocoded using variation ${i + 1}/${variations.length}: "${variation}"`);
      return result;
    }
  }

  console.error(`[Geocoding] Failed to geocode address after trying ${variations.length} variations. Address: "${address}", City: "${city || 'N/A'}".`);
  return null;
}

/**
 * Reverse geocode coordinates to a compact address and city.
 */
export async function reverseGeocodeAddress(
  lat: number,
  lng: number
): Promise<{ fullAddress: string; city: string } | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DailyRide/1.0 (https://github.com/juxhinxhihani/dailyride)',
      },
    });

    if (!response.ok) return null;

    const result = (await response.json()) as NominatimReverseResult;
    const fullAddress = formatCompactAddress(result.address, result.display_name);
    const city = getCityFromAddress(result.address);

    if (!fullAddress && !city) return null;
    return { fullAddress, city };
  } catch (error) {
    console.error('[Geocoding] Reverse geocode failed', error);
    return null;
  }
}

/**
 * Validates if coordinates are valid numbers (not null, undefined, NaN, or Infinity)
 * @param lat Latitude
 * @param lng Longitude
 * @returns true if coordinates are valid numbers
 */
export function areValidCoordinates(lat?: number | null, lng?: number | null): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
