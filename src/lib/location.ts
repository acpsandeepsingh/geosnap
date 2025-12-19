
const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/reverse';

// Cache to store results and avoid redundant API calls
const geocodingCache = new Map<string, string>();

/**
 * Converts latitude and longitude to a human-readable address using Nominatim.
 * Uses a simple in-memory cache to avoid repeat API calls for the same location.
 * @param lat - The latitude.
 * @param lng - The longitude.
 * @returns A formatted address string or an error message.
 */
export async function getAddressFromCoordinates(
  lat: number,
  lng: number
): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey)!;
  }

  try {
    // Nominatim requires a user-agent header
    const headers = new Headers();
    headers.append('User-Agent', 'GeoSnap/1.0 (web-app)');

    const response = await fetch(
      `${NOMINATIM_API_URL}?format=json&lat=${lat}&lon=${lng}`,
      {
        method: 'GET',
        headers: headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data && data.display_name) {
      // The display_name is a full, nicely formatted address
      const finalAddress = data.display_name;
      geocodingCache.set(cacheKey, finalAddress);
      return finalAddress;
    } else if (data.error) {
       throw new Error(`Nominatim API error: ${data.error}`);
    } else {
      throw new Error('Address not found in Nominatim API response');
    }
  } catch (error) {
    console.error('Failed to fetch address from Nominatim:', error);
    if (error instanceof Error) {
        return `Address not available: ${error.message}`;
    }
    return 'Address not available';
  }
}
