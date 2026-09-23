"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventModel = void 0;
const mongoose_1 = require("mongoose");
const eventSchema = new mongoose_1.Schema({
    name: { type: String, required: true, min: 6, max: 255 },
    description: { type: String, required: true, min: 3, max: 1024 },
    heroImage: { type: String, required: true },
    imageArray: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    link: { type: String, required: true },
    gpsPosition: { type: String, required: true },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    slugArray: { type: [String], default: [] },
    updateAt: { type: Date, default: Date.now },
    isAnnual: { type: Boolean, required: true, default: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    openingHours: { type: [String], default: [] },
    isHidden: { type: Boolean, default: false, index: true },
    hiddenAt: { type: Date },
    hiddenBy: { type: String },
});
exports.EventModel = (0, mongoose_1.model)("Event", eventSchema);
//# sourceMappingURL=eventModel.js.map