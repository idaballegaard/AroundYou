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
exports.createCity = createCity;
exports.getAllCities = getAllCities;
exports.getCityById = getCityById;
exports.getCityByName = getCityByName;
exports.updateCityById = updateCityById;
exports.deleteCityById = deleteCityById;
exports.restoreCityById = restoreCityById;
exports.getCityByQuery = getCityByQuery;
exports.getCityByGenericQuery = getCityByGenericQuery;
const controllerUtils_1 = require("./controllerUtils");
const city_service_1 = require("../services/city.service");
/**
 * CREATE CITY
 */
function createCity(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, city_service_1.createCityRecord)(req.body);
            res.status(201).json(result);
        }
        catch (err) {
            console.error("Error creating city:", err);
            (0, controllerUtils_1.sendCreateError)(res, err, "Error creating city");
        }
    });
}
/**
 * GET ALL CITIES
 */
function getAllCities(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, city_service_1.findCities)((0, controllerUtils_1.visibleFilter)(req));
            res.status(200).json(result);
        }
        catch (err) {
            console.error("Error fetching cities:", err);
            res.status(500).json({
                message: "Error retrieving cities",
            });
        }
    });
}
/**
 * GET CITY BY ID
 */
function getCityById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, city_service_1.findCityById)((0, controllerUtils_1.getRouteParam)(req.params.id), (0, controllerUtils_1.visibleFilter)(req));
            if (!result) {
                res.status(404).json({ message: "City not found" });
                return;
            }
            res.status(200).json(result);
        }
        catch (err) {
            console.error("Error fetching city:", err);
            res.status(500).json({
                message: "Error retrieving city",
            });
        }
    });
}
/**
 * GET CITY BY NAME
 */
function getCityByName(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const cityNameParam = (0, controllerUtils_1.getRouteParam)(req.params.cityName);
            if (!cityNameParam) {
                res.status(400).json({ message: "City name is required" });
                return;
            }
            const matchingCity = yield (0, city_service_1.findCityByName)(cityNameParam, (0, controllerUtils_1.visibleFilter)(req));
            if (!matchingCity) {
                res.status(404).json({ message: "City not found" });
                return;
            }
            res.status(200).json(matchingCity);
        }
        catch (err) {
            console.error("Error fetching city by name:", err);
            res.status(500).json({
                message: "Error retrieving city",
            });
        }
    });
}
/**
 * UPDATE CITY
 */
function updateCityById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, city_service_1.updateCityRecord)((0, controllerUtils_1.getRouteParam)(req.params.id), req.body);
            if (!result) {
                res.status(404).json({
                    message: "City not found",
                });
                return;
            }
            res.status(200).json({
                message: "City updated successfully",
                data: result,
            });
        }
        catch (err) {
            console.error("Error updating city:", err);
            if ((0, controllerUtils_1.isValidationError)(err)) {
                res.status(400).json({ message: err.message });
                return;
            }
            res.status(500).json({
                message: "Error updating city",
            });
        }
    });
}
/**
 * HIDE CITY
 */
function deleteCityById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const result = yield (0, city_service_1.hideCityRecord)((0, controllerUtils_1.getRouteParam)(req.params.id), (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID);
            if (!result) {
                res.status(404).json({ message: "City not found" });
                return;
            }
            res.status(200).json({ message: "City hidden successfully", data: result });
        }
        catch (err) {
            console.error("Error deleting city:", err);
            res.status(500).json({
                message: "Error deleting city",
            });
        }
    });
}
function restoreCityById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, city_service_1.restoreCityRecord)((0, controllerUtils_1.getRouteParam)(req.params.id));
            if (!result) {
                res.status(404).json({ message: "City not found" });
                return;
            }
            res.status(200).json({ message: "City restored successfully", data: result });
        }
        catch (err) {
            console.error("Error restoring city:", err);
            res.status(500).json({
                message: "Error restoring city",
            });
        }
    });
}
/**
 * QUERY CITY (KEY / VALUE)
 */
function getCityByQuery(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const key = req.params.key;
            const value = req.params.value;
            const result = yield (0, city_service_1.queryCitiesByField)(key, value, (0, controllerUtils_1.visibleFilter)(req));
            res.status(200).json(result);
        }
        catch (err) {
            console.error("Error querying cities:", err);
            res.status(500).json({
                message: "Error retrieving cities by query",
            });
        }
    });
}
/**
 * GENERIC QUERY
 */
function getCityByGenericQuery(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, city_service_1.queryCities)(req.body, (0, controllerUtils_1.visibleFilter)(req));
            res.status(200).json(result);
        }
        catch (err) {
            console.error("Error generic city query:", err);
            res.status(500).json({
                message: "Error retrieving cities",
            });
        }
    });
}
//# sourceMappingURL=cityController.js.map