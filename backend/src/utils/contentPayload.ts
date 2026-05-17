import Joi from "joi";
import { ContentSuggestionType } from "../interfaces/contentSuggestion";

type ContentPayload = Record<string, unknown>;

const text = (min: number, max: number) => Joi.string().trim().min(min).max(max);
const optionalText = (max: number) => Joi.string().trim().max(max).allow("");

const imageUrl = text(1, 2048);
const link = text(1, 2048);
const gpsPosition = Joi.string()
  .trim()
  .max(64)
  .pattern(/^-?\d{1,2}(\.\d+)?,-?\d{1,3}(\.\d+)?$/);
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
  gpsPosition: gpsPosition.required(),
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
    gpsPosition: gpsPosition.required(),
    population: Joi.number().integer().min(0).max(100_000_000).required(),
    visitorCenter: optionalText(255).default(""),
  }),
};

function formatValidationMessage(error: Joi.ValidationError): string {
  return error.details.map((detail) => detail.message).join(", ");
}

function throwValidationError(error: Joi.ValidationError): never {
  const validationError = new Error(formatValidationMessage(error));
  validationError.name = "ValidationError";
  throw validationError;
}

export function sanitizeContentPayload(
  type: ContentSuggestionType,
  payload: ContentPayload,
): ContentPayload {
  const { error, value } = schemas[type].validate(payload, {
    abortEarly: false,
    convert: true,
    stripUnknown: true,
  });

  if (error) {
    throwValidationError(error);
  }

  return value as ContentPayload;
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

  return value as ContentPayload;
}
