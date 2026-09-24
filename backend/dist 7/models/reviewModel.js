"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewModel = void 0;
const mongoose_1 = require("mongoose");
const reviewSchema = new mongoose_1.Schema({
    targetId: { type: String, required: true, index: true },
    targetType: { type: String, enum: ['city', 'event', 'attraction'], required: true },
    author: { type: String, required: true },
    title: { type: String, required: true, minlength: 3, maxlength: 255 },
    description: { type: String, required: true, minlength: 6, maxlength: 1024 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    edited: { type: Boolean, default: false },
    image: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    reportCount: { type: Number, default: 0, min: 0 },
    reports: {
        type: [
            {
                reportedBy: { type: String, required: true },
                reason: { type: String, default: "" },
                createdAt: { type: Date, default: Date.now },
            },
        ],
        default: [],
    },
    reportResolved: { type: Boolean, default: false },
    reportResolvedAt: { type: Date },
    reportResolvedBy: { type: String },
    isHidden: { type: Boolean, default: false, index: true },
    hiddenAt: { type: Date },
    hiddenBy: { type: String },
});
exports.ReviewModel = (0, mongoose_1.model)("Review", reviewSchema);
//# sourceMappingURL=reviewModel.js.map