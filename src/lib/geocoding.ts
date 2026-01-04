export interface GeocodeResult {
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'KidSafetyApp/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`OSM API error: ${response.status}`);
    }

    const data = await response.json();
    return data as GeocodeResult;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
}

export function formatAddress(result: GeocodeResult): string {
  if (!result.address) return result.display_name;

  const { house_number, road, suburb, city, state, postcode, country } = result.address;
  const parts = [house_number, road, suburb, city, state, postcode, country].filter(Boolean);
  return parts.join(', ') || result.display_name;
}