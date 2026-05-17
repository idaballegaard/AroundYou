import Joi from "joi";

const reviewBodySchema = Joi.object({
  targetId: Joi.string().trim().min(1).max(255).required(),
  targetType: Joi.string().valid("city", "event", "attraction").required(),
  title: Joi.string().trim().min(3).max(255).required(),
  description: Joi.string().trim().min(6).max(1024).required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  image: Joi.string().trim().max(2048).allow("").default(""),
});

const reviewUpdateSchema = Joi.object({
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
