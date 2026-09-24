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
exports.createReview = createReview;
exports.getAllReviews = getAllReviews;
exports.getReviewById = getReviewById;
exports.updateReviewById = updateReviewById;
exports.deleteReviewById = deleteReviewById;
exports.restoreReviewById = restoreReviewById;
exports.getReviewByQuery = getReviewByQuery;
exports.getReviewByGenericQuery = getReviewByGenericQuery;
exports.getReviewsByTarget = getReviewsByTarget;
exports.editReview = editReview;
exports.likeReview = likeReview;
const reviewModel_1 = require("../models/reviewModel");
const reviewNotification_service_1 = require("../services/reviewNotification.service");
const reviewAuthorAvatar_service_1 = require("../services/reviewAuthorAvatar.service");
const dynamicQueryBuilder_1 = require("../utils/dynamicQueryBuilder");
const controllerUtils_1 = require("./controllerUtils");
const review_validators_1 = require("../validators/review.validators");
function canModifyReview(req, author) {
    var _a, _b;
    // Reviews are keyed by author username. Admins can moderate everything; users
    // can only edit/delete their own reviews.
    return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "admin" || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.userName) === author;
}
/**
 * CREATE REVIEW
 */
function createReview(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const author = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userName;
            if (!author) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }
            const reviewBody = (0, review_validators_1.validateReviewBody)(req.body);
            const review = new reviewModel_1.ReviewModel(Object.assign(Object.assign({}, reviewBody), { 
                // Always derive the author from the verified token, never from request
                // body, so users cannot impersonate another reviewer.
                author }));
            const result = yield review.save();
            res.status(201).json(yield (0, reviewAuthorAvatar_service_1.attachAuthorAvatar)(result));
        }
        catch (err) {
            console.error("Error creating review:", err);
            if ((0, controllerUtils_1.isValidationError)(err)) {
                res.status(400).json({ message: err.message });
                return;
            }
            res.status(500).json({
                message: "Error creating review",
            });
        }
    });
}
/**
 * GET ALL REVIEWS
 */
function getAllReviews(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield reviewModel_1.ReviewModel.find((0, controllerUtils_1.visibleFilter)(req));
            res.status(200).json(yield (0, reviewAuthorAvatar_service_1.attachAuthorAvatars)(result));
        }
        catch (err) {
            console.error("Error fetching reviews:", err);
            res.status(500).json({
                message: "Error retrieving reviews",
            });
        }
    });
}
/**
 * GET REVIEW BY ID
 */
function getReviewById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield reviewModel_1.ReviewModel.findOne(Object.assign({ _id: req.params.id }, (0, controllerUtils_1.visibleFilter)(req)));
            if (!result) {
                res.status(404).json({ message: "Review not found" });
                return;
            }
            res.status(200).json(yield (0, reviewAuthorAvatar_service_1.attachAuthorAvatar)(result));
        }
        catch (err) {
            console.error("Error fetching review:", err);
            res.status(500).json({
                message: "Error retrieving review",
            });
        }
    });
}
/**
 * UPDATE REVIEW
 */
function updateReviewById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const review = yield reviewModel_1.ReviewModel.findOne(Object.assign({ _id: req.params.id }, (0, controllerUtils_1.visibleFilter)(req)));
            if (!review) {
                res.status(404).json({ message: "Review not found" });
                return;
            }
            if (!canModifyReview(req, review.author)) {
                res.status(403).json({ message: "Cannot modify another user's review" });
                return;
            }
            const updates = Object.assign(Object.assign({}, (0, review_validators_1.validateReviewBody)(req.body, true)), (typeof req.body.likes === "number" && ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "admin"
                ? { likes: req.body.likes }
                : {}));
            const result = yield reviewModel_1.ReviewModel.findByIdAndUpdate(req.params.id, updates, {
                new: true,
                runValidators: true,
            });
            res.status(200).json({
                message: "Review updated successfully",
                data: yield (0, reviewAuthorAvatar_service_1.attachAuthorAvatar)(result),
            });
        }
        catch (err) {
            console.error("Error updating review:", err);
            if ((0, controllerUtils_1.isValidationError)(err)) {
                res.status(400).json({ message: err.message });
                return;
            }
            res.status(500).json({
                message: "Error updating review",
            });
        }
    });
}
/**
 * HIDE REVIEW
 */
function deleteReviewById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const review = yield reviewModel_1.ReviewModel.findOne(Object.assign({ _id: req.params.id }, (0, controllerUtils_1.visibleFilter)(req)));
            if (!review) {
                res.status(404).json({ message: "Review not found" });
                return;
            }
            if (!canModifyReview(req, review.author)) {
                res.status(403).json({ message: "Cannot delete another user's review" });
                return;
            }
            const ruleBroken = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "admin"
                ? (0, review_validators_1.validateReviewRemoval)(req.body)
                : "";
            const result = yield reviewModel_1.ReviewModel.findByIdAndUpdate(req.params.id, (0, controllerUtils_1.getHideUpdate)((_b = req.user) === null || _b === void 0 ? void 0 : _b.userID), { new: true });
            if (((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) === "admin") {
                // Admin removals notify the author and any users who reported the review.
                // User self-deletes skip moderation notifications.
                yield (0, reviewNotification_service_1.notifyReviewAuthorReviewRemoved)(review, ruleBroken);
                if (review.reports.length > 0) {
                    yield (0, reviewNotification_service_1.notifyReviewReporters)(review, true);
                }
            }
            res
                .status(200)
                .json({
                message: "Review hidden successfully",
                data: yield (0, reviewAuthorAvatar_service_1.attachAuthorAvatar)(result),
            });
        }
        catch (err) {
            console.error("Error deleting review:", err);
            if ((0, controllerUtils_1.isValidationError)(err)) {
                res.status(400).json({ message: err.message });
                return;
            }
            res.status(500).json({
                message: "Error deleting review",
            });
        }
    });
}
function restoreReviewById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const review = yield reviewModel_1.ReviewModel.findById(req.params.id);
            if (!review) {
                res.status(404).json({ message: "Review not found" });
                return;
            }
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
                res.status(403).json({ message: "Admin access required" });
                return;
            }
            const result = yield reviewModel_1.ReviewModel.findByIdAndUpdate(req.params.id, (0, controllerUtils_1.getRestoreUpdate)(), { new: true });
            res.status(200).json({
                message: "Review restored successfully",
                data: yield (0, reviewAuthorAvatar_service_1.attachAuthorAvatar)(result),
            });
        }
        catch (err) {
            console.error("Error restoring review:", err);
            res.status(500).json({
                message: "Error restoring review",
            });
        }
    });
}
/**
 * QUERY REVIEW (KEY / VALUE)
 */
function getReviewByQuery(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const key = req.params.key;
            const value = req.params.value;
            const result = yield reviewModel_1.ReviewModel.find(Object.assign(Object.assign({}, (0, controllerUtils_1.visibleFilter)(req)), { [key]: { $regex: value, $options: "i" } }));
            res.status(200).json(yield (0, reviewAuthorAvatar_service_1.attachAuthorAvatars)(result));
        }
        catch (err) {
            console.error("Error querying reviews:", err);
            res.status(500).json({
                message: "Error retrieving reviews by query",
            });
        }
    });
}
/**
 * GENERIC QUERY
 */
function getReviewByGenericQuery(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Generic query is kept for internal/admin-style tooling, but
            // buildDynamicQuery restricts fields/operators to schema-backed values.
            const query = (0, dynamicQueryBuilder_1.buildDynamicQuery)(reviewModel_1.ReviewModel, req.body);
            const result = yield reviewModel_1.ReviewModel.find(Object.assign(Object.assign({}, query), (0, controllerUtils_1.visibleFilter)(req)));
            res.status(200).json(yield (0, reviewAuthorAvatar_service_1.attachAuthorAvatars)(result));
        }
        catch (err) {
            console.error("Error generic review query:", err);
            res.status(500).json({
                message: "Error retrieving reviews",
            });
        }
    });
}
/**
 * GET REVIEWS BY TARGET (city / event / attraction)
 */
function getReviewsByTarget(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { targetId } = req.params;
            const result = yield reviewModel_1.ReviewModel.find(Object.assign({ targetId }, (0, controllerUtils_1.visibleFilter)(req))).sort({ createdAt: -1 });
            res.status(200).json(yield (0, reviewAuthorAvatar_service_1.attachAuthorAvatars)(result));
        }
        catch (err) {
            console.error("Error fetching reviews by target:", err);
            res.status(500).json({ message: "Error retrieving reviews" });
        }
    });
}
/**
 * EDIT OWN REVIEW (sets edited: true)
 */
function editReview(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const updates = (0, review_validators_1.validateReviewBody)(req.body, true);
            const review = yield reviewModel_1.ReviewModel.findOne(Object.assign({ _id: id }, (0, controllerUtils_1.visibleFilter)(req)));
            if (!review) {
                res.status(404).json({ message: "Review not found" });
                return;
            }
            if (!canModifyReview(req, review.author)) {
                res.status(403).json({ message: "Cannot modify another user's review" });
                return;
            }
            const updated = yield reviewModel_1.ReviewModel.findByIdAndUpdate(id, Object.assign(Object.assign({}, updates), { edited: true }), { new: true, runValidators: true });
            res.status(200).json(yield (0, reviewAuthorAvatar_service_1.attachAuthorAvatar)(updated));
        }
        catch (err) {
            console.error("Error editing review:", err);
            if ((0, controllerUtils_1.isValidationError)(err)) {
                res.status(400).json({ message: err.message });
                return;
            }
            res.status(500).json({ message: "Error updating review" });
        }
    });
}
/**
 * LIKE / UNLIKE REVIEW (toggle)
 */
function likeReview(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const { id } = req.params;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID;
            if (!userId) {
                res.status(400).json({ message: "userId is required" });
                return;
            }
            const review = yield reviewModel_1.ReviewModel.findOne(Object.assign({ _id: id }, (0, controllerUtils_1.visibleFilter)(req)));
            if (!review) {
                res.status(404).json({ message: "Review not found" });
                return;
            }
            const likedBy = (_b = review.likedBy) !== null && _b !== void 0 ? _b : [];
            const alreadyLiked = likedBy.includes(userId);
            // Toggle like atomically so concurrent requests cannot desync likes and
            // likedBy more than Mongo's update operation allows.
            const updated = yield reviewModel_1.ReviewModel.findByIdAndUpdate(id, alreadyLiked
                ? { $pull: { likedBy: userId }, $inc: { likes: -1 } }
                : { $addToSet: { likedBy: userId }, $inc: { likes: 1 } }, { new: true });
            res.status(200).json(yield (0, reviewAuthorAvatar_service_1.attachAuthorAvatar)(updated));
        }
        catch (err) {
            console.error("Error liking review:", err);
            res.status(500).json({ message: "Error updating like" });
        }
    });
}
//# sourceMappingURL=reviewController.js.map