"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateReviewBody = validateReviewBody;
exports.validateReviewRemoval = validateReviewRemoval;
const joi_1 = __importDefault(require("joi"));
const textModeration_1 = require("../utils/textModeration");
const reviewBodySchema = joi_1.default.object({
    targetId: joi_1.default.string().trim().min(1).max(255).required(),
    targetType: joi_1.default.string().valid("city", "event", "attraction").required(),
    title: joi_1.default.string().trim().min(3).max(255).required(),
    description: joi_1.default.string().trim().min(6).max(1024).required(),
    rating: joi_1.default.number().integer().min(1).max(5).required(),
    image: joi_1.default.string().trim().max(2048).allow("").default(""),
});
const reviewUpdateSchema = joi_1.default.object({
    // Ownership fields are immutable after creation; updates only affect the
    // review content itself.
    targetId: joi_1.default.any().forbidden(),
    targetType: joi_1.default.any().forbidden(),
    title: joi_1.default.string().trim().min(3).max(255),
    description: joi_1.default.string().trim().min(6).max(1024),
    rating: joi_1.default.number().integer().min(1).max(5),
    image: joi_1.default.string().trim().max(2048).allow(""),
}).min(1);
const reviewRemovalSchema = joi_1.default.object({
    ruleBroken: joi_1.default.string().trim().min(3).max(500).required(),
});
function toValidationError(error) {
    // Controllers already branch on ValidationError, so wrap Joi failures in the
    // shared error shape instead of leaking Joi objects.
    const validationError = new Error(error.details.map((detail) => detail.message).join(", "));
    validationError.name = "ValidationError";
    return validationError;
}
function validateReviewBody(payload, isUpdate = false) {
    // Update validation disables defaults so partial edits do not accidentally
    // erase optional fields.
    const { error, value } = (isUpdate ? reviewUpdateSchema : reviewBodySchema).validate(payload, {
        abortEarly: false,
        convert: true,
        noDefaults: isUpdate,
        stripUnknown: true,
    });
    if (error) {
        throw toValidationError(error);
    }
    const review = value;
    for (const field of ["title", "description"]) {
        const text = review[field];
        if (typeof text === "string") {
            (0, textModeration_1.assertAllowedLanguage)(text);
        }
    }
    return value;
}
function validateReviewRemoval(payload) {
    const { error, value } = reviewRemovalSchema.validate(payload, {
        abortEarly: false,
        convert: true,
        stripUnknown: true,
    });
    if (error) {
        throw toValidationError(error);
    }
    return value.ruleBroken;
}
//# sourceMappingURL=review.validators.js.map