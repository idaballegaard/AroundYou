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
exports.createEventRecord = createEventRecord;
exports.findEvents = findEvents;
exports.findEventsStartingSoon = findEventsStartingSoon;
exports.findEventById = findEventById;
exports.updateEventRecord = updateEventRecord;
exports.hideEventRecord = hideEventRecord;
exports.restoreEventRecord = restoreEventRecord;
exports.queryEventsByField = queryEventsByField;
exports.queryEvents = queryEvents;
const eventModel_1 = require("../models/eventModel");
const dynamicQueryBuilder_1 = require("../utils/dynamicQueryBuilder");
const contentPayload_1 = require("../utils/contentPayload");
const resourceUtils_1 = require("../utils/resourceUtils");
function createEventRecord(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const event = new eventModel_1.EventModel(yield (0, contentPayload_1.sanitizeContentPayload)("event", payload));
        return event.save();
    });
}
function findEvents(visibilityFilter) {
    return eventModel_1.EventModel.find(visibilityFilter);
}
function findEventsStartingSoon(start, end, limit = 4) {
    return eventModel_1.EventModel.find({
        isHidden: { $ne: true },
        startDate: { $gte: start, $lte: end },
    })
        .sort({ startDate: 1 })
        .limit(limit);
}
function findEventById(id, visibilityFilter) {
    return eventModel_1.EventModel.findOne(Object.assign({ _id: id }, visibilityFilter));
}
function updateEventRecord(id, payload) {
    return eventModel_1.EventModel.findByIdAndUpdate(id, (0, contentPayload_1.sanitizeContentUpdatePayload)("event", payload), {
        new: true,
        runValidators: true,
    });
}
function hideEventRecord(id, hiddenBy) {
    return eventModel_1.EventModel.findByIdAndUpdate(id, (0, resourceUtils_1.getHideUpdate)(hiddenBy), {
        new: true,
    });
}
function restoreEventRecord(id) {
    return eventModel_1.EventModel.findByIdAndUpdate(id, (0, resourceUtils_1.getRestoreUpdate)(), {
        new: true,
    });
}
function queryEventsByField(key, value, visibilityFilter) {
    return eventModel_1.EventModel.find(Object.assign(Object.assign({}, visibilityFilter), { [key]: { $regex: value, $options: "i" } }));
}
function queryEvents(body, visibilityFilter) {
    const query = (0, dynamicQueryBuilder_1.buildDynamicQuery)(eventModel_1.EventModel, body);
    return eventModel_1.EventModel.find(Object.assign(Object.assign({}, query), visibilityFilter));
}
//# sourceMappingURL=event.service.js.map