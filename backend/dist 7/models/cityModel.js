"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CityModel = void 0;
const mongoose_1 = require("mongoose");
const citySchema = new mongoose_1.Schema({
    name: { type: String, required: true, min: 3, max: 255 },
    tagLine: { type: String, required: true, min: 20, max: 100 },
    description: { type: String, required: true, min: 3, max: 1024 },
    heroImage: { type: String, required: true },
    commune: { type: String, required: true },
    region: { type: String, required: true },
    country: { type: String, required: true },
    gpsPosition: { type: String, required: true },
    population: { type: Number, required: true, min: 0 },
    visitorCenter: { type: String, required: false },
    isHidden: { type: Boolean, default: false, index: true },
    hiddenAt: { type: Date },
    hiddenBy: { type: String },
});
exports.CityModel = (0, mongoose_1.model)("City", citySchema);
//# sourceMappingURL=cityModel.js.map