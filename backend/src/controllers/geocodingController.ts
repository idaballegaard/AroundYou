import { Request, Response } from "express";

type NominatimReverseResponse = {
  display_name?: string;
};

type NominatimSearchResponse = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

function parseCoordinate(value: unknown): number | null {
  // Query params arrive as strings. Return null instead of NaN so validation
  // branches stay explicit.
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

function parseText(value: unknown): string | null {
  // Empty query strings should behave like missing parameters.
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

export async function forwardGeocode(
  req: Request,
  res: Response,
): Promise<void> {
  const address = parseText(req.query.address);
  const city = parseText(req.query.city);

  if (!city) {
    res.status(400).json({ message: "City is required" });
    return;
  }

  try {
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

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${query}`, {
      headers: {
        "User-Agent": "AroundYou/1.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ message: "Geocoding failed" });
      return;
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
      res.status(404).json({ message: "Location could not be found" });
      return;
    }

    res.status(200).json({
      latitude,
      longitude,
      displayName: firstMatch.display_name ?? (address ? `${address}, ${city}` : city),
    });
  } catch (err) {
    console.error("Geocoding failed:", err);
    res.status(500).json({ message: "Geocoding failed" });
  }
}

export async function reverseGeocode(
  req: Request,
  res: Response,
): Promise<void> {
  const latitude = parseCoordinate(req.query.lat);
  const longitude = parseCoordinate(req.query.lon);

  if (
    latitude === null ||
    longitude === null ||
    !isValidLatitude(latitude) ||
    !isValidLongitude(longitude)
  ) {
    res.status(400).json({ message: "Invalid latitude or longitude" });
    return;
  }

  try {
    // Reverse geocoding is only used for display text; the validated coordinate
    // pair remains the source of truth for maps.
    const query = new URLSearchParams({
      format: "json",
      lat: String(latitude),
      lon: String(longitude),
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${query}`,
      {
        headers: {
          "User-Agent": "AroundYou/1.0",
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      res.status(response.status).json({ message: "Reverse geocoding failed" });
      return;
    }

    const data = (await response.json()) as NominatimReverseResponse;
    res
      .status(200)
      .json({ displayName: data.display_name ?? "Unknown location" });
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
    res.status(500).json({ message: "Reverse geocoding failed" });
  }
}
