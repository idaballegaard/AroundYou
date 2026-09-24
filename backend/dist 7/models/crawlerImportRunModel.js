"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerImportRunModel = void 0;
const mongoose_1 = require("mongoose");
const crawlerImportRunSchema = new mongoose_1.Schema({
    source: { type: String, required: true, trim: true, index: true },
    trigger: { type: String, enum: ["manual", "scheduled"], required: true },
    status: {
        type: String,
        enum: ["running", "succeeded", "failed"],
        required: true,
        index: true,
    },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, required: false },
    eventCount: { type: Number, required: true, default: 0 },
    inserted: { type: Number, required: true, default: 0 },
    updated: { type: Number, required: true, default: 0 },
    errorMessage: { type: String, required: false, trim: true },
}, { timestamps: true });
crawlerImportRunSchema.index({ source: 1, startedAt: -1 });
exports.CrawlerImportRunModel = (0, mongoose_1.model)("CrawlerImportRun", crawlerImportRunSchema);
//# sourceMappingURL=crawlerImportRunModel.js.map