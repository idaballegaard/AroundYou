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
exports.createAttractionRecord = createAttractionRecord;
exports.findAttractions = findAttractions;
exports.findAttractionById = findAttractionById;
exports.updateAttractionRecord = updateAttractionRecord;
exports.hideAttractionRecord = hideAttractionRecord;
exports.restoreAttractionRecord = restoreAttractionRecord;
exports.queryAttractionsByField = queryAttractionsByField;
exports.queryAttractions = queryAttractions;
const attractionModel_1 = require("../models/attractionModel");
const dynamicQueryBuilder_1 = require("../utils/dynamicQueryBuilder");
const contentPayload_1 = require("../utils/contentPayload");
const resourceUtils_1 = require("../utils/resourceUtils");
function createAttractionRecord(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const attraction = new attractionModel_1.AttractionModel(yield (0, contentPayload_1.sanitizeContentPayload)("attraction", payload));
        return attraction.save();
    });
}
function findAttractions(visibilityFilter) {
    return attractionModel_1.AttractionModel.find(visibilityFilter).sort({
        updateAt: -1,
    });
}
function findAttractionById(id, visibilityFilter) {
    return attractionModel_1.AttractionModel.findOne(Object.assign({ _id: id }, visibilityFilter));
}
function updateAttractionRecord(id, payload) {
    return attractionModel_1.AttractionModel.findByIdAndUpdate(id, (0, contentPayload_1.sanitizeContentUpdatePayload)("attraction", payload), {
        new: true,
        runValidators: true,
    });
}
function hideAttractionRecord(id, hiddenBy) {
    return attractionModel_1.AttractionModel.findByIdAndUpdate(id, (0, resourceUtils_1.getHideUpdate)(hiddenBy), {
        new: true,
    });
}
function restoreAttractionRecord(id) {
    return attractionModel_1.AttractionModel.findByIdAndUpdate(id, (0, resourceUtils_1.getRestoreUpdate)(), {
        new: true,
    });
}
function queryAttractionsByField(key, value, visibilityFilter) {
    return attractionModel_1.AttractionModel.find(Object.assign(Object.assign({}, visibilityFilter), { [key]: { $regex: value, $options: "i" } }));
}
function queryAttractions(body, visibilityFilter) {
    const query = (0, dynamicQueryBuilder_1.buildDynamicQuery)(attractionModel_1.AttractionModel, body);
    return attractionModel_1.AttractionModel.find(Object.assign(Object.assign({}, query), visibilityFilter));
}
//# sourceMappingURL=attraction.service.js.map