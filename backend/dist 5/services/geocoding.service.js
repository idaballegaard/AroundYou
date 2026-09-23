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
exports.GeocodingServiceError = void 0;
exports.geocodeLocation = geocodeLocation;
exports.formatGpsPosition = formatGpsPosition;
class GeocodingServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = "GeocodingServiceError";
        this.statusCode = statusCode;
    }
}
exports.GeocodingServiceError = GeocodingServiceError;
function parseCoordinate(value) {
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
function geocodeLocation(address, city) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
        let response;
        try {
            response = yield fetch(`https://nominatim.openstreetmap.org/search?${query}`, {
                headers: {
                    "User-Agent": "AroundYou/1.0",
                    Accept: "application/json",
                },
            });
        }
        catch (_b) {
            throw new GeocodingServiceError("OpenStreetMap kunne ikke kontaktes.", 502);
        }
        if (!response.ok) {
            throw new GeocodingServiceError("Geocoding fejlede.", response.status);
        }
        const data = (yield response.json());
        const firstMatch = data[0];
        const latitude = parseCoordinate(firstMatch === null || firstMatch === void 0 ? void 0 : firstMatch.lat);
        const longitude = parseCoordinate(firstMatch === null || firstMatch === void 0 ? void 0 : firstMatch.lon);
        if (!firstMatch ||
            latitude === null ||
            longitude === null ||
            !isValidLatitude(latitude) ||
            !isValidLongitude(longitude)) {
            throw new GeocodingServiceError("Lokationen kunne ikke findes via OpenStreetMap.", 404);
        }
        return {
            latitude,
            longitude,
            displayName: (_a = firstMatch.display_name) !== null && _a !== void 0 ? _a : (address ? `${address}, ${city}` : city),
        };
    });
}
function formatGpsPosition(location) {
    return `${location.latitude},${location.longitude}`;
}
//# sourceMappingURL=geocoding.service.js.map