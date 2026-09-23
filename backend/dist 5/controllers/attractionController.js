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
exports.createAttraction = createAttraction;
exports.getAllAttractions = getAllAttractions;
exports.getAttractionById = getAttractionById;
exports.updateAttractionById = updateAttractionById;
exports.deleteAttractionById = deleteAttractionById;
exports.restoreAttractionById = restoreAttractionById;
exports.getAttractionsByQuery = getAttractionsByQuery;
exports.getAttractionsByQueryGeneric = getAttractionsByQueryGeneric;
const controllerUtils_1 = require("./controllerUtils");
const attraction_service_1 = require("../services/attraction.service");
/**
 * Create new attraction
 */
function createAttraction(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, attraction_service_1.createAttractionRecord)(req.body);
            res.status(201).json(result);
        }
        catch (err) {
            console.error("Error creating attraction:", err);
            (0, controllerUtils_1.sendCreateError)(res, err, "An error occurred while creating the attraction");
        }
    });
}
/**
 * Get all attractions
 */
function getAllAttractions(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, attraction_service_1.findAttractions)((0, controllerUtils_1.visibleFilter)(req));
            res.status(200).json(result);
        }
        catch (err) {
            console.error("Error retrieving attractions:", err);
            res.status(500).json({
                message: "Error retrieving attractions",
            });
        }
    });
}
/**
 * Get attraction by ID
 */
function getAttractionById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const id = (0, controllerUtils_1.getRouteParam)(req.params.id);
            const result = yield (0, attraction_service_1.findAttractionById)(id, (0, controllerUtils_1.visibleFilter)(req));
            if (!result) {
                res.status(404).json({ message: "Attraction not found" });
                return;
            }
            res.status(200).json(result);
        }
        catch (err) {
            console.error("Error retrieving attraction by id:", err);
            res.status(500).json({
                message: "Error retrieving attraction by id",
            });
        }
    });
}
/**
 * Update attraction by ID
 */
function updateAttractionById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const id = (0, controllerUtils_1.getRouteParam)(req.params.id);
            const result = yield (0, attraction_service_1.updateAttractionRecord)(id, req.body);
            if (!result) {
                res.status(404).json({
                    message: `Cannot find attraction with id=${id}`,
                });
                return;
            }
            res.status(200).json({
                message: "Attraction updated successfully",
                data: result,
            });
        }
        catch (err) {
            console.error("Error updating attraction:", err);
            if ((0, controllerUtils_1.isValidationError)(err)) {
                res.status(400).json({ message: err.message });
                return;
            }
            res.status(500).json({
                message: "Error updating attraction",
            });
        }
    });
}
/**
 * Hide attraction by ID
 */
function deleteAttractionById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const id = (0, controllerUtils_1.getRouteParam)(req.params.id);
            const result = yield (0, attraction_service_1.hideAttractionRecord)(id, (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID);
            if (!result) {
                res.status(404).json({
                    message: `Cannot find attraction with id=${id}`,
                });
                return;
            }
            res.status(200).json({
                message: "Attraction hidden successfully",
                data: result,
            });
        }
        catch (err) {
            console.error("Error deleting attraction:", err);
            res.status(500).json({
                message: "Error deleting attraction",
            });
        }
    });
}
function restoreAttractionById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const id = (0, controllerUtils_1.getRouteParam)(req.params.id);
            const result = yield (0, attraction_service_1.restoreAttractionRecord)(id);
            if (!result) {
                res.status(404).json({
                    message: `Cannot find attraction with id=${id}`,
                });
                return;
            }
            res.status(200).json({
                message: "Attraction restored successfully",
                data: result,
            });
        }
        catch (err) {
            console.error("Error restoring attraction:", err);
            res.status(500).json({
                message: "Error restoring attraction",
            });
        }
    });
}
/**
 * Search attractions by simple query (key/value)
 */
function getAttractionsByQuery(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const key = req.params.key;
            const value = req.params.value;
            const result = yield (0, attraction_service_1.queryAttractionsByField)(key, value, (0, controllerUtils_1.visibleFilter)(req));
            res.status(200).json(result);
        }
        catch (err) {
            console.error("Error querying attractions:", err);
            res.status(500).json({
                message: "Error retrieving attractions by query",
            });
        }
    });
}
/**
 * Advanced dynamic query builder
 */
function getAttractionsByQueryGeneric(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, attraction_service_1.queryAttractions)(req.body, (0, controllerUtils_1.visibleFilter)(req));
            res.status(200).json(result);
        }
        catch (err) {
            console.error("Error retrieving attractions (generic query):", err);
            res.status(500).json({
                message: "Error retrieving attractions by generic query",
            });
        }
    });
}
//# sourceMappingURL=attractionController.js.map