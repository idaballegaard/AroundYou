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
exports.reportReview = reportReview;
exports.getReportedReviews = getReportedReviews;
exports.resolveReviewReport = resolveReviewReport;
const reviewModel_1 = require("../models/reviewModel");
const reviewAuthorAvatar_service_1 = require("../services/reviewAuthorAvatar.service");
const reviewNotification_service_1 = require("../services/reviewNotification.service");
const controllerUtils_1 = require("./controllerUtils");
function reportReview(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const { id } = req.params;
            const reportedBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID;
            const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";
            const safeReason = reason.slice(0, 500);
            if (!reportedBy) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }
            const review = yield reviewModel_1.ReviewModel.findOne(Object.assign({ _id: id }, (0, controllerUtils_1.visibleFilter)(req)));
            if (!review) {
                res.status(404).json({ message: "Kunne ikke finde et review" });
                return;
            }
            const alreadyReported = review.reports.some((report) => report.reportedBy === reportedBy);
            if (alreadyReported) {
                res.status(409).json({ message: "Reviewet er allerede anmeldt" });
                return;
            }
            review.reports.push({
                reportedBy,
                reason: safeReason,
                createdAt: new Date(),
            });
            // Keep reportCount denormalized for efficient admin sorting/filtering.
            review.reportCount = review.reports.length;
            review.reportResolved = false;
            review.reportResolvedAt = undefined;
            review.reportResolvedBy = undefined;
            const result = yield review.save();
            res.status(200).json(yield (0, reviewAuthorAvatar_service_1.attachAuthorAvatar)(result));
        }
        catch (err) {
            console.error("Fejl igang med reviewet:", err);
            res.status(500).json({ message: "Fejl anmeldese af review" });
        }
    });
}
function getReportedReviews(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const includeResolved = req.query.includeResolved === "true";
            // Admin review report screens default to unresolved reports. Historical
            // resolved reports can still be requested explicitly.
            const result = yield reviewModel_1.ReviewModel.find(Object.assign(Object.assign({ reportCount: { $gt: 0 } }, (0, controllerUtils_1.visibleFilter)(req)), (includeResolved ? {} : { reportResolved: false }))).sort({ reportCount: -1, createdAt: -1 });
            res.status(200).json(yield (0, reviewAuthorAvatar_service_1.attachAuthorAvatars)(result));
        }
        catch (err) {
            console.error("Error fetching reported reviews:", err);
            res.status(500).json({ message: "Error retrieving reported reviews" });
        }
    });
}
function resolveReviewReport(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const review = yield reviewModel_1.ReviewModel.findById(req.params.id);
            if (!review) {
                res.status(404).json({ message: "Review not found" });
                return;
            }
            review.reportResolved = true;
            review.reportResolvedAt = new Date();
            review.reportResolvedBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID;
            const result = yield review.save();
            // Resolving without removal tells reporters the review was checked but left
            // visible.
            yield (0, reviewNotification_service_1.notifyReviewReporters)(review, false);
            res.status(200).json(yield (0, reviewAuthorAvatar_service_1.attachAuthorAvatar)(result));
        }
        catch (err) {
            console.error("Error resolving review report:", err);
            res.status(500).json({ message: "Error resolving review report" });
        }
    });
}
//# sourceMappingURL=reviewReportController.js.map