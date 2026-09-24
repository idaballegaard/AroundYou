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
exports.notifyReviewReporters = notifyReviewReporters;
exports.notifyReviewAuthorReviewRemoved = notifyReviewAuthorReviewRemoved;
const notificationModel_1 = require("../models/notificationModel");
const userModel_1 = require("../models/userModel");
function getReviewAuthorUserId(author) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const user = yield userModel_1.UserModel.findOne({ userName: author }).select("_id");
        return (_a = user === null || user === void 0 ? void 0 : user._id.toString()) !== null && _a !== void 0 ? _a : null;
    });
}
function uniqueUserIds(userIds) {
    return [...new Set(userIds.filter((userId) => !!userId))];
}
function notifyReviewReporters(review, actionTaken) {
    return __awaiter(this, void 0, void 0, function* () {
        // A review can collect multiple reports from users; notify each reporter once
        // when admin resolves the report queue.
        const recipients = uniqueUserIds(review.reports.map((report) => report.reportedBy));
        if (recipients.length === 0)
            return;
        yield notificationModel_1.NotificationModel.insertMany(recipients.map((recipientUserId) => ({
            recipientUserId,
            type: actionTaken
                ? "review_report_action_taken"
                : "review_report_no_action",
            title: actionTaken ? "Din rapport er behandlet" : "Din rapport er lukket",
            message: actionTaken
                ? `Din rapport af anmeldelsen "${review.title}" var succesfuld. Anmeldelsen er blevet fjernet efter gennemgang.`
                : `Din rapport af anmeldelsen "${review.title}" blev gennemgået, men der blev ikke fundet brud på reglerne.`,
            reviewId: review._id.toString(),
        })));
    });
}
function notifyReviewAuthorReviewRemoved(review, ruleBroken) {
    return __awaiter(this, void 0, void 0, function* () {
        const authorUserId = yield getReviewAuthorUserId(review.author);
        if (!authorUserId)
            return;
        yield notificationModel_1.NotificationModel.create({
            recipientUserId: authorUserId,
            type: "review_removed",
            title: "Din anmeldelse er fjernet",
            message: `Din anmeldelse "${review.title}" er blevet fjernet, fordi den brød reglen: ${ruleBroken}.`,
            reviewId: review._id.toString(),
        });
    });
}
//# sourceMappingURL=reviewNotification.service.js.map