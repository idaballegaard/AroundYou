"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactTicketModel = exports.CONTACT_TICKET_CATEGORIES = void 0;
const mongoose_1 = require("mongoose");
exports.CONTACT_TICKET_CATEGORIES = [
    "bug",
    "report",
    "account",
    "content",
    "other",
];
const contactTicketSchema = new mongoose_1.Schema({
    category: {
        type: String,
        enum: exports.CONTACT_TICKET_CATEGORIES,
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ["open", "in_progress", "completed", "rejected"],
        default: "open",
        required: true,
        index: true,
    },
    subject: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 140,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 3000,
        trim: true,
    },
    submittedBy: { type: String, required: true, index: true },
    submittedByName: { type: String, required: true },
    submittedByEmail: { type: String, required: true },
    seenBy: { type: String },
    seenAt: { type: Date },
    inProgressBy: { type: String },
    inProgressAt: { type: Date },
    completedBy: { type: String },
    completedAt: { type: Date },
    rejectedBy: { type: String },
    rejectedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true });
exports.ContactTicketModel = (0, mongoose_1.model)("ContactTicket", contactTicketSchema);
//# sourceMappingURL=contactTicketModel.js.map