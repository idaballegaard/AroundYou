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
exports.getEventsStartingSoon = getEventsStartingSoon;
exports.createEvent = createEvent;
exports.getAllEvents = getAllEvents;
exports.getEventById = getEventById;
exports.updateEventById = updateEventById;
exports.deleteEventById = deleteEventById;
exports.restoreEventById = restoreEventById;
exports.getEventByQuery = getEventByQuery;
exports.getEventByGenericQuery = getEventByGenericQuery;
const controllerUtils_1 = require("./controllerUtils");
const event_service_1 = require("../services/event.service");
function getCurrentTime(value) {
    if (typeof value !== "string") {
        return new Date();
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
function getMinutes(value, fallback) {
    if (typeof value !== "string") {
        return fallback;
    }
    const minutes = Number(value);
    return Number.isInteger(minutes) && minutes >= 0 && minutes <= 24 * 60 ? minutes : fallback;
}
function eventVisibilityFilter(req) {
    const visibility = (0, controllerUtils_1.visibleFilter)(req);
    // The scheduler archives old events, while this filter is a safety net so a
    // public request can never expose an event that has already ended.
    if (req.originalUrl.startsWith("/api/admin/")) {
        return visibility;
    }
    return Object.assign(Object.assign({}, visibility), { $or: [{ isAnnual: true }, { endDate: { $gte: new Date() } }] });
}
function getEventsStartingSoon(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // The browser supplies its current time so this stays accurate for the
            // user's timezone; invalid values safely fall back to the server clock.
            const now = getCurrentTime(req.query.from);
            const afterMinutes = getMinutes(req.query.afterMinutes, 0);
            const withinMinutes = getMinutes(req.query.withinMinutes, 60);
            const start = new Date(now.getTime() + afterMinutes * 60 * 1000);
            const end = new Date(now.getTime() + withinMinutes * 60 * 1000);
            if (end < start) {
                res.status(400).json({ message: "Invalid event time range" });
                return;
            }
            res.status(200).json(yield (0, event_service_1.findEventsStartingSoon)(start, end));
        }
        catch (err) {
            console.error("Error fetching events starting soon:", err);
            res.status(500).json({ message: "Error retrieving events starting soon" });
        }
    });
}
/**
 * CREATE EVENT
 */
function createEvent(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, event_service_1.createEventRecord)(req.body);
            res.status(201).json(result);
        }
        catch (err) {
            console.error("Error creating event:", err);
            (0, controllerUtils_1.sendCreateError)(res, err, "Error creating event");
        }
    });
}
/**
 * GET ALL EVENTS
 */
function getAllEvents(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, event_service_1.findEvents)(eventVisibilityFilter(req));
            res.status(200).json(result);
        }
        catch (err) {
            console.error("Error fetching events:", err);
            res.status(500).json({
                message: "Error retrieving events",
            });
        }
    });
}
/**
 * GET EVENT BY ID
 */
function getEventById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, event_service_1.findEventById)((0, controllerUtils_1.getRouteParam)(req.params.id), eventVisibilityFilter(req));
            if (!result) {
                res.status(404).json({ message: "Event not found" });
                return;
            }
            res.status(200).json(result);
        }
        catch (err) {
            console.error("Error fetching event:", err);
            res.status(500).json({
                message: "Error retrieving event",
            });
        }
    });
}
/**
 * UPDATE EVENT
 */
function updateEventById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, event_service_1.updateEventRecord)((0, controllerUtils_1.getRouteParam)(req.params.id), req.body);
            if (!result) {
                res.status(404).json({ message: "Event not found" });
                return;
            }
            res.status(200).json({
                message: "Event updated successfully",
                data: result,
            });
        }
        catch (err) {
            console.error("Error updating event:", err);
            if ((0, controllerUtils_1.isValidationError)(err)) {
                res.status(400).json({ message: err.message });
                return;
            }
            res.status(500).json({
                message: "Error updating event",
            });
        }
    });
}
/**
 * HIDE EVENT
 */
function deleteEventById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const result = yield (0, event_service_1.hideEventRecord)((0, controllerUtils_1.getRouteParam)(req.params.id), (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID);
            if (!result) {
                res.status(404).json({ message: "Event not found" });
                return;
            }
            res.status(200).json({ message: "Event hidden successfully", data: result });
        }
        catch (err) {
            console.error("Error deleting event:", err);
            res.status(500).json({
                message: "Error deleting event",
            });
        }
    });
}
function restoreEventById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, event_service_1.restoreEventRecord)((0, controllerUtils_1.getRouteParam)(req.params.id));
            if (!result) {
                res.status(404).json({ message: "Event not found" });
                return;
            }
            res.status(200).json({ message: "Event restored successfully", data: result });
        }
        catch (err) {
            console.error("Error restoring event:", err);
            res.status(500).json({
                message: "Error restoring event",
            });
        }
    });
}
/**
 * QUERY EVENT (KEY / VALUE)
 */
function getEventByQuery(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const key = req.params.key;
            const value = req.params.value;
            const result = yield (0, event_service_1.queryEventsByField)(key, value, eventVisibilityFilter(req));
            res.status(200).json(result);
        }
        catch (err) {
            console.error("Error querying events:", err);
            res.status(500).json({
                message: "Error retrieving events by query",
            });
        }
    });
}
/**
 * GENERIC QUERY
 */
function getEventByGenericQuery(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, event_service_1.queryEvents)(req.body, eventVisibilityFilter(req));
            res.status(200).json(result);
        }
        catch (err) {
            console.error("Error generic event query:", err);
            res.status(500).json({
                message: "Error retrieving events",
            });
        }
    });
}
//# sourceMappingURL=eventController.js.map