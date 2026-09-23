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
exports.createContentSuggestion = createContentSuggestion;
exports.getContentSuggestions = getContentSuggestions;
exports.approveContentSuggestion = approveContentSuggestion;
exports.rejectContentSuggestion = rejectContentSuggestion;
const attractionModel_1 = require("../models/attractionModel");
const cityModel_1 = require("../models/cityModel");
const contentSuggestionModel_1 = require("../models/contentSuggestionModel");
const eventModel_1 = require("../models/eventModel");
const contentPayload_1 = require("../utils/contentPayload");
const SUGGESTION_MODELS = {
    // Suggestions are stored separately until approval, then copied into the
    // canonical collection for their content type.
    attraction: attractionModel_1.AttractionModel,
    event: eventModel_1.EventModel,
    city: cityModel_1.CityModel,
};
function isContentSuggestionType(value) {
    return value === "attraction" || value === "event" || value === "city";
}
function isContentSuggestionStatus(value) {
    return value === "pending" || value === "approved" || value === "rejected";
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function createContentSuggestion(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { type, payload } = req.body;
        if (!isContentSuggestionType(type) || !isRecord(payload)) {
            res.status(400).json({ message: "Invalid content suggestion" });
            return;
        }
        let sanitizedPayload;
        try {
            // Validate before saving the suggestion so admins only review payloads that
            // can later be promoted without schema surprises.
            sanitizedPayload = yield (0, contentPayload_1.sanitizeContentPayload)(type, payload);
        }
        catch (err) {
            res.status(400).json({
                message: err instanceof Error ? err.message : "Invalid content suggestion",
            });
            return;
        }
        const submittedBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID;
        const submittedByName = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userName;
        if (!submittedBy || !submittedByName) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        try {
            const suggestion = new contentSuggestionModel_1.ContentSuggestionModel({
                type,
                payload: sanitizedPayload,
                submittedBy,
                submittedByName,
            });
            const result = yield suggestion.save();
            res.status(201).json(result);
        }
        catch (err) {
            console.error("Error creating content suggestion:", err);
            res.status(500).json({ message: "Error creating content suggestion" });
        }
    });
}
function getContentSuggestions(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const requestedStatus = req.query.status;
            // Invalid or missing status defaults to the moderation queue.
            const status = isContentSuggestionStatus(requestedStatus)
                ? requestedStatus
                : "pending";
            const result = yield contentSuggestionModel_1.ContentSuggestionModel.find({ status }).sort({
                createdAt: -1,
            });
            res.status(200).json(result);
        }
        catch (err) {
            console.error("Error fetching content suggestions:", err);
            res.status(500).json({ message: "Error fetching content suggestions" });
        }
    });
}
function approveContentSuggestion(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const suggestion = yield contentSuggestionModel_1.ContentSuggestionModel.findById(req.params.id);
            if (!suggestion) {
                res.status(404).json({ message: "Suggestion not found" });
                return;
            }
            if (suggestion.status !== "pending") {
                res.status(409).json({ message: "Suggestion has already been reviewed" });
                return;
            }
            const Model = SUGGESTION_MODELS[suggestion.type];
            // Re-sanitize stored suggestions at approval time. This protects old queued
            // suggestions if validation rules changed after submission.
            const createdContent = yield new Model(yield (0, contentPayload_1.sanitizeContentPayload)(suggestion.type, suggestion.payload)).save();
            suggestion.status = "approved";
            suggestion.reviewedBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID;
            suggestion.reviewedAt = new Date();
            yield suggestion.save();
            res.status(200).json({
                suggestion,
                content: createdContent,
            });
        }
        catch (err) {
            console.error("Error approving content suggestion:", err);
            res.status(500).json({ message: "Error approving content suggestion" });
        }
    });
}
function rejectContentSuggestion(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const suggestion = yield contentSuggestionModel_1.ContentSuggestionModel.findById(req.params.id);
            if (!suggestion) {
                res.status(404).json({ message: "Suggestion not found" });
                return;
            }
            if (suggestion.status !== "pending") {
                res.status(409).json({ message: "Suggestion has already been reviewed" });
                return;
            }
            suggestion.status = "rejected";
            suggestion.reviewedBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID;
            suggestion.reviewedAt = new Date();
            // Rejection reason is optional because admins may reject obvious spam or
            // duplicate suggestions without needing a long explanation.
            suggestion.rejectionReason =
                typeof req.body.reason === "string" ? req.body.reason.trim() : "";
            yield suggestion.save();
            res.status(200).json(suggestion);
        }
        catch (err) {
            console.error("Error rejecting content suggestion:", err);
            res.status(500).json({ message: "Error rejecting content suggestion" });
        }
    });
}
//# sourceMappingURL=contentSuggestionController.js.map