import Joi from "joi";
import { ContentSuggestionType } from "../interfaces/contentSuggestion";
import {
  formatGpsPosition,
  geocodeLocation,
  GeocodingServiceError,
} from "../services/geocoding.service";
import { assertAllowedLanguage } from "./textModeration";

type ContentPayload = Record<string, unknown>;

const text = (min: number, max: number) => Joi.string().trim().min(min).max(max);
const optionalText = (max: number) => Joi.string().trim().max(max).allow("");

const imageUrl = text(1, 2048);
const link = text(1, 2048);
const gpsPosition = Joi.string()
  .trim()
  .max(64)
  .pattern(/^-?\d{1,2}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?$/)
  // An empty value is resolved into coordinates below from the submitted
  // address/place. Validation must not reject it before that can happen.
  .allow("");
const stringArray = Joi.array()
  .items(Joi.string().trim().max(120))
  .max(30)
  .default([]);

// Attractions and events share most fields, while cities intentionally use a
// smaller place profile. Keep these schemas aligned with frontend create forms.
const sharedPlaceFields = {
  name: text(3, 255).required(),
  description: text(3, 1024).required(),
  heroImage: imageUrl.required(),
  price: Joi.number().min(0).max(1_000_000).required(),
  link: link.required(),
  gpsPosition,
  address: optionalText(255),
  city: optionalText(255),
  imageArray: stringArray,
  slugArray: stringArray,
  openingHours: stringArray,
};

const schemas: Record<ContentSuggestionType, Joi.ObjectSchema> = {
  attraction: Joi.object(sharedPlaceFields),
  event: Joi.object({
    ...sharedPlaceFields,
    isAnnual: Joi.boolean().default(false),
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref("startDate")).required(),
  }),
  city: Joi.object({
    name: text(3, 255).required(),
    tagLine: text(20, 100).required(),
    description: text(3, 1024).required(),
    heroImage: imageUrl.required(),
    commune: text(1, 255).required(),
    region: text(1, 255).required(),
    country: text(1, 255).required(),
    gpsPosition,
    population: Joi.number().integer().min(0).max(100_000_000).required(),
    visitorCenter: optionalText(255).default(""),
  }),
};

const moderatedTextFieldsByType: Record<ContentSuggestionType, string[]> = {
  attraction: ["name", "description", "slugArray", "openingHours"],
  event: ["name", "description", "slugArray", "openingHours"],
  city: ["name", "tagLine", "description", "commune", "region", "country", "visitorCenter"],
};

function formatValidationMessage(error: Joi.ValidationError): string {
  // Join all Joi failures so admin/content forms can show a complete correction
  // list instead of failing one field at a time.
  return error.details.map((detail) => detail.message).join(", ");
}

function throwValidationError(error: Joi.ValidationError): never {
  const validationError = new Error(formatValidationMessage(error));
  validationError.name = "ValidationError";
  throw validationError;
}

function throwPayloadError(message: string): never {
  const validationError = new Error(message);
  validationError.name = "ValidationError";
  throw validationError;
}

function assertPayloadAllowedLanguage(type: ContentSuggestionType, payload: ContentPayload): void {
  for (const field of moderatedTextFieldsByType[type]) {
    const value = payload[field];

    if (typeof value === "string") {
      assertAllowedLanguage(value);
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (typeof entry === "string") {
          assertAllowedLanguage(entry);
        }
      });
    }
  }
}

function normalizeGpsPosition(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim().replace(/\s*,\s*/, ",");
}

function getTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

async function geocodeEventOrAttractionLocation(
  address: string | null,
  city: string,
) {
  if (!address || !address.includes(",")) {
    return geocodeLocation(address, city);
  }

  try {
    return await geocodeLocation(null, address);
  } catch {
    // Kultunaut detail pages often prefix a usable street address with the
    // venue name. Retry without that venue label, e.g. turn
    // "Fulton af Marstal, Dokvej 3F, Esbjerg" into "Dokvej 3F, Esbjerg".
    const addressWithoutVenue = address.split(",").slice(1).join(",").trim();

    if (!addressWithoutVenue) {
      throw new GeocodingServiceError("Lokationen kunne ikke findes via OpenStreetMap.", 404);
    }

    return geocodeLocation(null, addressWithoutVenue);
  }
}

async function resolveMissingGpsPosition(
  type: ContentSuggestionType,
  payload: ContentPayload,
): Promise<void> {
  const existingGpsPosition = normalizeGpsPosition(payload.gpsPosition);

  if (existingGpsPosition) {
    payload.gpsPosition = existingGpsPosition;
    return;
  }

  if (type === "city") {
    const name = getTrimmedString(payload.name);

    if (!name) {
      throwPayloadError("Byens navn mangler.");
    }

    try {
      payload.gpsPosition = formatGpsPosition(await geocodeLocation(null, name));
    } catch (err) {
      if (err instanceof GeocodingServiceError) {
        throwPayloadError(err.message);
      }

      throw err;
    }

    return;
  }

  const address = getTrimmedString(payload.address);
  const city = getTrimmedString(payload.city);

  if (!city) {
    throwPayloadError("Indtast enten gpsPosition eller en by eller et sted.");
  }

  try {
    // Source imports often know a venue but not a street address. The
    // geocoding service supports a city/place-only lookup for that case.
    const location = await geocodeEventOrAttractionLocation(address, city);
    payload.gpsPosition = formatGpsPosition(location);
  } catch (err) {
    if (err instanceof GeocodingServiceError) {
      throwPayloadError(err.message);
    }

    throw err;
  }
}

function removeTransientLocationFields(
  type: ContentSuggestionType,
  payload: ContentPayload,
): void {
  // Events retain their human-readable venue/address alongside GPS for the
  // detail page. Other canonical models do not currently store these fields.
  if (type === "event") {
    return;
  }

  delete payload.address;
  delete payload.city;
}

export async function sanitizeContentPayload(
  type: ContentSuggestionType,
  payload: ContentPayload,
): Promise<ContentPayload> {
  // All create paths, including user suggestions and admin direct creates, pass
  // through the same schema to keep canonical content shape consistent.
  const { error, value } = schemas[type].validate(payload, {
    abortEarly: false,
    convert: true,
    stripUnknown: true,
  });

  if (error) {
    throwValidationError(error);
  }

  const sanitizedPayload = value as ContentPayload;

  await resolveMissingGpsPosition(type, sanitizedPayload);
  removeTransientLocationFields(type, sanitizedPayload);
  assertPayloadAllowedLanguage(type, sanitizedPayload);

  return sanitizedPayload;
}

export function sanitizeContentUpdatePayload(
  type: ContentSuggestionType,
  payload: ContentPayload,
): ContentPayload {
  // For PATCH/PUT-style admin updates, reuse the create schema but relax required
  // fields and avoid applying create-time defaults.
  const describedKeys = Object.keys(schemas[type].describe().keys ?? {});
  const optionalSchema = schemas[type].fork(describedKeys, (schema) =>
    schema.optional(),
  );
  const { error, value } = optionalSchema.validate(payload, {
    abortEarly: false,
    convert: true,
    noDefaults: true,
    stripUnknown: true,
  });

  if (error) {
    throwValidationError(error);
  }

  const sanitizedPayload = value as ContentPayload;

  removeTransientLocationFields(type, sanitizedPayload);
  assertPayloadAllowedLanguage(type, sanitizedPayload);

  return sanitizedPayload;
}
