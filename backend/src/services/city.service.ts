import { CityModel } from "../models/cityModel";
import { buildDynamicQuery, SearchBody } from "../utils/dynamicQueryBuilder";
import { sanitizeContentPayload, sanitizeContentUpdatePayload } from "../utils/contentPayload";
import { getHideUpdate, getRestoreUpdate, normalizeSlug } from "../utils/resourceUtils";

export async function createCityRecord(payload: Record<string, unknown>) {
  const city = new CityModel(await sanitizeContentPayload("city", payload));
  return city.save();
}

export function findCities(visibilityFilter: Record<string, unknown>) {
  return CityModel.find(visibilityFilter);
}

export function findCityById(id: string, visibilityFilter: Record<string, unknown>) {
  return CityModel.findOne({
    _id: id,
    ...visibilityFilter,
  });
}

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

export function updateCityRecord(id: string, payload: Record<string, unknown>) {
  return CityModel.findByIdAndUpdate(id, sanitizeContentUpdatePayload("city", payload), {
    new: true,
    runValidators: true,
  });
}

export function hideCityRecord(id: string, hiddenBy?: string) {
  return CityModel.findByIdAndUpdate(id, getHideUpdate(hiddenBy), {
    new: true,
  });
}

export function restoreCityRecord(id: string) {
  return CityModel.findByIdAndUpdate(id, getRestoreUpdate(), {
    new: true,
  });
}

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
