import Joi from "joi";
import { assertAllowedLanguage } from "../utils/textModeration";

const reviewBodySchema = Joi.object({
  targetId: Joi.string().trim().min(1).max(255).required(),
  targetType: Joi.string().valid("city", "event", "attraction").required(),
  title: Joi.string().trim().min(3).max(255).required(),
  description: Joi.string().trim().min(6).max(1024).required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  image: Joi.string().trim().max(2048).allow("").default(""),
});

const reviewUpdateSchema = Joi.object({
  // Ownership fields are immutable after creation; updates only affect the
  // review content itself.
  targetId: Joi.any().forbidden(),
  targetType: Joi.any().forbidden(),
  title: Joi.string().trim().min(3).max(255),
  description: Joi.string().trim().min(6).max(1024),
  rating: Joi.number().integer().min(1).max(5),
  image: Joi.string().trim().max(2048).allow(""),
}).min(1);

const reviewRemovalSchema = Joi.object({
  ruleBroken: Joi.string().trim().min(3).max(500).required(),
});

function toValidationError(error: Joi.ValidationError): Error {
  // Controllers already branch on ValidationError, so wrap Joi failures in the
  // shared error shape instead of leaking Joi objects.
  const validationError = new Error(
    error.details.map((detail) => detail.message).join(", "),
  );
  validationError.name = "ValidationError";
  return validationError;
}

export function validateReviewBody(
  payload: Record<string, unknown>,
  isUpdate = false,
): Record<string, unknown> {
  // Update validation disables defaults so partial edits do not accidentally
  // erase optional fields.
  const { error, value } = (
    isUpdate ? reviewUpdateSchema : reviewBodySchema
  ).validate(payload, {
    abortEarly: false,
    convert: true,
    noDefaults: isUpdate,
    stripUnknown: true,
  });

  if (error) {
    throw toValidationError(error);
  }

  const review = value as Record<string, unknown>;
  for (const field of ["title", "description"]) {
    const text = review[field];
    if (typeof text === "string") {
      assertAllowedLanguage(text);
    }
  }

  return value as Record<string, unknown>;
}

export function validateReviewRemoval(payload: Record<string, unknown>): string {
  const { error, value } = reviewRemovalSchema.validate(payload, {
    abortEarly: false,
    convert: true,
    stripUnknown: true,
  });

  if (error) {
    throw toValidationError(error);
  }

  return (value as { ruleBroken: string }).ruleBroken;
}
