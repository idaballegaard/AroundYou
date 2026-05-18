type NominatimSearchResponse = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

export type GeocodedLocation = {
  latitude: number;
  longitude: number;
  displayName: string;
};

export class GeocodingServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "GeocodingServiceError";
    this.statusCode = statusCode;
  }
}

function parseCoordinate(value: unknown): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function isValidLatitude(latitude: number): boolean {
  return latitude >= -90 && latitude <= 90;
}

function isValidLongitude(longitude: number): boolean {
  return longitude >= -180 && longitude <= 180;
}

export async function geocodeLocation(
  address: string | null,
  city: string,
): Promise<GeocodedLocation> {
  // Nominatim supports structured street/city search. For city-only lookups,
  // use q so towns without a street address can still resolve.
  const query = address
    ? new URLSearchParams({
        format: "json",
        street: address,
        city,
        limit: "1",
      })
    : new URLSearchParams({
        format: "json",
        q: city,
        limit: "1",
      });

  let response: Response;

  try {
    response = await fetch(`https://nominatim.openstreetmap.org/search?${query}`, {
      headers: {
        "User-Agent": "AroundYou/1.0",
        Accept: "application/json",
      },
    });
  } catch {
    throw new GeocodingServiceError("OpenStreetMap kunne ikke kontaktes.", 502);
  }

  if (!response.ok) {
    throw new GeocodingServiceError("Geocoding fejlede.", response.status);
  }

  const data = (await response.json()) as NominatimSearchResponse[];
  const firstMatch = data[0];
  const latitude = parseCoordinate(firstMatch?.lat);
  const longitude = parseCoordinate(firstMatch?.lon);

  if (
    !firstMatch ||
    latitude === null ||
    longitude === null ||
    !isValidLatitude(latitude) ||
    !isValidLongitude(longitude)
  ) {
    throw new GeocodingServiceError("Lokationen kunne ikke findes via OpenStreetMap.", 404);
  }

  return {
    latitude,
    longitude,
    displayName: firstMatch.display_name ?? (address ? `${address}, ${city}` : city),
  };
}

export function formatGpsPosition(location: GeocodedLocation): string {
  return `${location.latitude},${location.longitude}`;
}
