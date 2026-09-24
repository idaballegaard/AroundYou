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
exports.attachAuthorAvatars = attachAuthorAvatars;
exports.attachAuthorAvatar = attachAuthorAvatar;
const userModel_1 = require("../models/userModel");
function isPlainObject(value) {
    return !!value && typeof value === "object";
}
function hasToObject(value) {
    return isPlainObject(value) && typeof value.toObject === "function";
}
function toPlainReview(review) {
    // Controllers may pass Mongoose documents or already-plain objects. Normalize
    // here so response shaping is independent of how the query was executed.
    if (hasToObject(review)) {
        const plainReview = review.toObject();
        return isPlainObject(plainReview) ? plainReview : {};
    }
    return isPlainObject(review) ? Object.assign({}, review) : {};
}
function getAuthorName(review) {
    return typeof review.author === "string" ? review.author : "";
}
function attachAuthorAvatars(reviews) {
    return __awaiter(this, void 0, void 0, function* () {
        // Reviews store author names, not user ids. Batch by unique username so list
        // endpoints enrich avatars with one user query instead of N queries.
        const plainReviews = reviews.map(toPlainReview);
        const authorNames = Array.from(new Set(plainReviews
            .map(getAuthorName)
            .filter((authorName) => authorName.length > 0)));
        if (authorNames.length === 0) {
            return plainReviews;
        }
        const users = yield userModel_1.UserModel.find({ userName: { $in: authorNames } })
            .select("userName userAvatar")
            .lean();
        const avatarByUserName = new Map(users.map((user) => { var _a; return [user.userName, (_a = user.userAvatar) !== null && _a !== void 0 ? _a : ""]; }));
        return plainReviews.map((review) => {
            var _a;
            return (Object.assign(Object.assign({}, review), { authorAvatar: (_a = avatarByUserName.get(getAuthorName(review))) !== null && _a !== void 0 ? _a : "" }));
        });
    });
}
function attachAuthorAvatar(review) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        return review ? (_a = (yield attachAuthorAvatars([review]))[0]) !== null && _a !== void 0 ? _a : null : null;
    });
}
//# sourceMappingURL=reviewAuthorAvatar.service.js.map