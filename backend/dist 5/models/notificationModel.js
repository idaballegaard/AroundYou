"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    recipientUserId: { type: String, required: true, index: true },
    type: {
        type: String,
        enum: [
            "review_removed",
            "review_report_action_taken",
            "review_report_no_action",
            "contact_ticket_seen",
            "contact_ticket_in_progress",
            "contact_ticket_completed",
            "contact_ticket_reopened",
            "contact_ticket_rejected",
        ],
        required: true,
    },
    title: { type: String, required: true, maxlength: 140 },
    message: { type: String, required: true, maxlength: 1000 },
    link: { type: String, default: "" },
    reviewId: { type: String, default: "" },
    readAt: { type: Date },
    createdAt: { type: Date, default: Date.now, index: true },
});
notificationSchema.index({ recipientUserId: 1, readAt: 1, createdAt: -1 });
exports.NotificationModel = (0, mongoose_1.model)("Notification", notificationSchema);
//# sourceMappingURL=notificationModel.js.map