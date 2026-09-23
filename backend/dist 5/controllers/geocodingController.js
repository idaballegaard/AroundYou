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
Object.defineProperty(exports, "__esModule", { value: true });
exports.forwardGeocode = forwardGeocode;
exports.reverseGeocode = reverseGeocode;
const geocoding_service_1 = require("../services/geocoding.service");
function parseCoordinate(value) {
    // Query params arrive as strings. Return null instead of NaN so validation
    // branches stay explicit.
    if (typeof value !== "string") {
        return null;
    }
    const coordinate = Number(value);
    return Number.isFinite(coordinate) ? coordinate : null;
}
function isValidLatitude(latitude) {
    return latitude >= -90 && latitude <= 90;
}
function isValidLongitude(longitude) {
    return longitude >= -180 && longitude <= 180;
}
function parseText(value) {
    // Empty query strings should behave like missing parameters.
    if (typeof value !== "string") {
        return null;
    }
    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : null;
}
function forwardGeocode(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const address = parseText(req.query.address);
        const city = parseText(req.query.city);
        if (!city) {
            res.status(400).json({ message: "City is required" });
            return;
        }
        try {
            res.status(200).json(yield (0, geocoding_service_1.geocodeLocation)(address, city));
        }
        catch (err) {
            console.error("Geocoding failed:", err);
            if (err instanceof geocoding_service_1.GeocodingServiceError) {
                res.status(err.statusCode).json({ message: err.message });
                return;
            }
            res.status(500).json({ message: "Geocoding failed" });
        }
    });
}
function reverseGeocode(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const latitude = parseCoordinate(req.query.lat);
        const longitude = parseCoordinate(req.query.lon);
        if (latitude === null ||
            longitude === null ||
            !isValidLatitude(latitude) ||
            !isValidLongitude(longitude)) {
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
            const response = yield fetch(`https://nominatim.openstreetmap.org/reverse?${query}`, {
                headers: {
                    "User-Agent": "AroundYou/1.0",
                    Accept: "application/json",
                },
            });
            if (!response.ok) {
                res.status(response.status).json({ message: "Reverse geocoding failed" });
                return;
            }
            const data = (yield response.json());
            res
                .status(200)
                .json({ displayName: (_a = data.display_name) !== null && _a !== void 0 ? _a : "Unknown location" });
        }
        catch (err) {
            console.error("Reverse geocoding failed:", err);
            res.status(500).json({ message: "Reverse geocoding failed" });
        }
    });
}
//# sourceMappingURL=geocodingController.js.map