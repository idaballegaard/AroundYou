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
exports.createCityRecord = createCityRecord;
exports.findCities = findCities;
exports.findCityById = findCityById;
exports.findCityByName = findCityByName;
exports.updateCityRecord = updateCityRecord;
exports.hideCityRecord = hideCityRecord;
exports.restoreCityRecord = restoreCityRecord;
exports.queryCitiesByField = queryCitiesByField;
exports.queryCities = queryCities;
const cityModel_1 = require("../models/cityModel");
const dynamicQueryBuilder_1 = require("../utils/dynamicQueryBuilder");
const contentPayload_1 = require("../utils/contentPayload");
const resourceUtils_1 = require("../utils/resourceUtils");
function createCityRecord(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const city = new cityModel_1.CityModel(yield (0, contentPayload_1.sanitizeContentPayload)("city", payload));
        return city.save();
    });
}
function findCities(visibilityFilter) {
    return cityModel_1.CityModel.find(visibilityFilter);
}
function findCityById(id, visibilityFilter) {
    return cityModel_1.CityModel.findOne(Object.assign({ _id: id }, visibilityFilter));
}
function findCityByName(cityName, visibilityFilter) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const normalizedTarget = (0, resourceUtils_1.normalizeSlug)(cityName);
        const cities = yield cityModel_1.CityModel.find(visibilityFilter);
        return ((_a = cities.find((city) => {
            return (0, resourceUtils_1.normalizeSlug)(city.name) === normalizedTarget;
        })) !== null && _a !== void 0 ? _a : null);
    });
}
function updateCityRecord(id, payload) {
    return cityModel_1.CityModel.findByIdAndUpdate(id, (0, contentPayload_1.sanitizeContentUpdatePayload)("city", payload), {
        new: true,
        runValidators: true,
    });
}
function hideCityRecord(id, hiddenBy) {
    return cityModel_1.CityModel.findByIdAndUpdate(id, (0, resourceUtils_1.getHideUpdate)(hiddenBy), {
        new: true,
    });
}
function restoreCityRecord(id) {
    return cityModel_1.CityModel.findByIdAndUpdate(id, (0, resourceUtils_1.getRestoreUpdate)(), {
        new: true,
    });
}
function queryCitiesByField(key, value, visibilityFilter) {
    return cityModel_1.CityModel.find(Object.assign(Object.assign({}, visibilityFilter), { [key]: { $regex: value, $options: "i" } }));
}
function queryCities(body, visibilityFilter) {
    const query = (0, dynamicQueryBuilder_1.buildDynamicQuery)(cityModel_1.CityModel, body);
    return cityModel_1.CityModel.find(Object.assign(Object.assign({}, query), visibilityFilter));
}
//# sourceMappingURL=city.service.js.map