"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentSuggestionModel = void 0;
const mongoose_1 = require("mongoose");
const contentSuggestionSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ["attraction", "event", "city"],
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
        required: true,
    },
    payload: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    submittedBy: {
        type: String,
        required: true,
    },
    submittedByName: {
        type: String,
        required: true,
    },
    reviewedBy: {
        type: String,
        required: false,
    },
    reviewedAt: {
        type: Date,
        required: false,
    },
    rejectionReason: {
        type: String,
        required: false,
    },
}, { timestamps: true });
exports.ContentSuggestionModel = (0, mongoose_1.model)("ContentSuggestion", contentSuggestionSchema);
//# sourceMappingURL=contentSuggestionModel.js.map