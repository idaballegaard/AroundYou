import { CityModel } from "../models/cityModel";
import { buildDynamicQuery, SearchBody } from "../utils/dynamicQueryBuilder";
import {
  sanitizeContentPayload,
  sanitizeContentUpdatePayload,
} from "../utils/contentPayload";
import {
  getHideUpdate,
  getRestoreUpdate,
  normalizeSlug,
} from "../utils/resourceUtils";

// Creates a new city after validating and sanitizing the payload.
export async function createCityRecord(payload: Record<string, unknown>) {
  const city = new CityModel(await sanitizeContentPayload("city", payload));
  return city.save();
}

// Finds all cities matching the active visibility filter.
export function findCities(visibilityFilter: Record<string, unknown>) {
  return CityModel.find(visibilityFilter);
}

// Finds a single city by id while respecting visibility rules.
export function findCityById(
  id: string,
  visibilityFilter: Record<string, unknown>,
) {
  return CityModel.findOne({
    _id: id,
    ...visibilityFilter,
  });
}

// Finds a city by normalized name so route slugs and stored names can match.
export async function findCityByName(
  cityName: string,
  visibilityFilter: Record<string, unknown>,
) {
  const normalizedTarget = normalizeSlug(cityName);
  const cities = await CityModel.find(visibilityFilter);

  return (
    cities.find((city) => {
      return normalizeSlug(city.name) === normalizedTarget;
    }) ?? null
  );
}

// Updates a city after sanitizing the incoming partial payload.
export function updateCityRecord(id: string, payload: Record<string, unknown>) {
  return CityModel.findByIdAndUpdate(
    id,
    sanitizeContentUpdatePayload("city", payload),
    {
      new: true,
      runValidators: true,
    },
  );
}

// Soft-hides a city instead of deleting it permanently.
export function hideCityRecord(id: string, hiddenBy?: string) {
  return CityModel.findByIdAndUpdate(id, getHideUpdate(hiddenBy), {
    new: true,
  });
}

// Restores a previously hidden city.
export function restoreCityRecord(id: string) {
  return CityModel.findByIdAndUpdate(id, getRestoreUpdate(), {
    new: true,
  });
}

// Searches cities by a specific field using case-insensitive matching.
export function queryCitiesByField(
  key: string,
  value: string,
  visibilityFilter: Record<string, unknown>,
) {
  return CityModel.find({
    ...visibilityFilter,
    [key]: { $regex: value, $options: "i" },
  });
}

// Runs dynamic city search while applying visibility filtering.
export function queryCities(
  body: SearchBody,
  visibilityFilter: Record<string, unknown>,
) {
  const query = buildDynamicQuery(CityModel, body);

  return CityModel.find({
    ...query,
    ...visibilityFilter,
  });
}
