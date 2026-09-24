"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeContentPayload = sanitizeContentPayload;
exports.sanitizeContentUpdatePayload = sanitizeContentUpdatePayload;
const joi_1 = __importDefault(require("joi"));
const geocoding_service_1 = require("../services/geocoding.service");
const textModeration_1 = require("./textModeration");
const text = (min, max) => joi_1.default.string().trim().min(min).max(max);
const optionalText = (max) => joi_1.default.string().trim().max(max).allow("");
const imageUrl = text(1, 2048);
const link = text(1, 2048);
const gpsPosition = joi_1.default.string()
    .trim()
    .max(64)
    .pattern(/^-?\d{1,2}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?$/)
    // An empty value is resolved into coordinates below from the submitted
    // address/place. Validation must not reject it before that can happen.
    .allow("");
const stringArray = joi_1.default.array()
    .items(joi_1.default.string().trim().max(120))
    .max(30)
    .default([]);
// Attractions and events share most fields, while cities intentionally use a
// smaller place profile. Keep these schemas aligned with frontend create forms.
const sharedPlaceFields = {
    name: text(3, 255).required(),
    description: text(3, 1024).required(),
    heroImage: imageUrl.required(),
    price: joi_1.default.number().min(0).max(1000000).required(),
    link: link.required(),
    gpsPosition,
    address: optionalText(255),
    city: optionalText(255),
    imageArray: stringArray,
    slugArray: stringArray,
    openingHours: stringArray,
};
const schemas = {
    attraction: joi_1.default.object(sharedPlaceFields),
    event: joi_1.default.object(Object.assign(Object.assign({}, sharedPlaceFields), { isAnnual: joi_1.default.boolean().default(false), startDate: joi_1.default.date().required(), endDate: joi_1.default.date().min(joi_1.default.ref("startDate")).required() })),
    city: joi_1.default.object({
        name: text(3, 255).required(),
        tagLine: text(20, 100).required(),
        description: text(3, 1024).required(),
        heroImage: imageUrl.required(),
        commune: text(1, 255).required(),
        region: text(1, 255).required(),
        country: text(1, 255).required(),
        gpsPosition,
        population: joi_1.default.number().integer().min(0).max(100000000).required(),
        visitorCenter: optionalText(255).default(""),
    }),
};
const moderatedTextFieldsByType = {
    attraction: ["name", "description", "slugArray", "openingHours"],
    event: ["name", "description", "slugArray", "openingHours"],
    city: ["name", "tagLine", "description", "commune", "region", "country", "visitorCenter"],
};
function formatValidationMessage(error) {
    // Join all Joi failures so admin/content forms can show a complete correction
    // list instead of failing one field at a time.
    return error.details.map((detail) => detail.message).join(", ");
}
function throwValidationError(error) {
    const validationError = new Error(formatValidationMessage(error));
    validationError.name = "ValidationError";
    throw validationError;
}
function throwPayloadError(message) {
    const validationError = new Error(message);
    validationError.name = "ValidationError";
    throw validationError;
}
function assertPayloadAllowedLanguage(type, payload) {
    for (const field of moderatedTextFieldsByType[type]) {
        const value = payload[field];
        if (typeof value === "string") {
            (0, textModeration_1.assertAllowedLanguage)(value);
            continue;
        }
        if (Array.isArray(value)) {
            value.forEach((entry) => {
                if (typeof entry === "string") {
                    (0, textModeration_1.assertAllowedLanguage)(entry);
                }
            });
        }
    }
}
function normalizeGpsPosition(value) {
    if (typeof value !== "string") {
        return null;
    }
    return value.trim().replace(/\s*,\s*/, ",");
}
function getTrimmedString(value) {
    if (typeof value !== "string") {
        return null;
    }
    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : null;
}
function geocodeEventOrAttractionLocation(address, city) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!address || !address.includes(",")) {
            return (0, geocoding_service_1.geocodeLocation)(address, city);
        }
        try {
            return yield (0, geocoding_service_1.geocodeLocation)(null, address);
        }
        catch (_a) {
            // Kultunaut detail pages often prefix a usable street address with the
            // venue name. Retry without that venue label, e.g. turn
            // "Fulton af Marstal, Dokvej 3F, Esbjerg" into "Dokvej 3F, Esbjerg".
            const addressWithoutVenue = address.split(",").slice(1).join(",").trim();
            if (!addressWithoutVenue) {
                throw new geocoding_service_1.GeocodingServiceError("Lokationen kunne ikke findes via OpenStreetMap.", 404);
            }
            return (0, geocoding_service_1.geocodeLocation)(null, addressWithoutVenue);
        }
    });
}
function resolveMissingGpsPosition(type, payload) {
    return __awaiter(this, void 0, void 0, function* () {
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
                payload.gpsPosition = (0, geocoding_service_1.formatGpsPosition)(yield (0, geocoding_service_1.geocodeLocation)(null, name));
            }
            catch (err) {
                if (err instanceof geocoding_service_1.GeocodingServiceError) {
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
            const location = yield geocodeEventOrAttractionLocation(address, city);
            payload.gpsPosition = (0, geocoding_service_1.formatGpsPosition)(location);
        }
        catch (err) {
            if (err instanceof geocoding_service_1.GeocodingServiceError) {
                throwPayloadError(err.message);
            }
            throw err;
        }
    });
}
function removeTransientLocationFields(type, payload) {
    // Events retain their human-readable venue/address alongside GPS for the
    // detail page. Other canonical models do not currently store these fields.
    if (type === "event") {
        return;
    }
    delete payload.address;
    delete payload.city;
}
function sanitizeContentPayload(type, payload) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const sanitizedPayload = value;
        yield resolveMissingGpsPosition(type, sanitizedPayload);
        removeTransientLocationFields(type, sanitizedPayload);
        assertPayloadAllowedLanguage(type, sanitizedPayload);
        return sanitizedPayload;
    });
}
function sanitizeContentUpdatePayload(type, payload) {
    var _a;
    // For PATCH/PUT-style admin updates, reuse the create schema but relax required
    // fields and avoid applying create-time defaults.
    const describedKeys = Object.keys((_a = schemas[type].describe().keys) !== null && _a !== void 0 ? _a : {});
    const optionalSchema = schemas[type].fork(describedKeys, (schema) => schema.optional());
    const { error, value } = optionalSchema.validate(payload, {
        abortEarly: false,
        convert: true,
        noDefaults: true,
        stripUnknown: true,
    });
    if (error) {
        throwValidationError(error);
    }
    const sanitizedPayload = value;
    removeTransientLocationFields(type, sanitizedPayload);
    assertPayloadAllowedLanguage(type, sanitizedPayload);
    return sanitizedPayload;
}
//# sourceMappingURL=contentPayload.js.map