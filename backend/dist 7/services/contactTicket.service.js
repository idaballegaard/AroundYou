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
exports.markTicketSeen = markTicketSeen;
exports.startTicketWork = startTicketWork;
exports.completeTicket = completeTicket;
exports.reopenTicket = reopenTicket;
exports.rejectTicket = rejectTicket;
const contactTicketModel_1 = require("../models/contactTicketModel");
const notificationModel_1 = require("../models/notificationModel");
const CONTACT_TICKET_NOTIFICATION_COPY = {
    contact_ticket_seen: {
        title: "Din henvendelse er set",
        getMessage: (subject) => `Admin har set din henvendelse "${subject}".`,
    },
    contact_ticket_in_progress: {
        title: "Din henvendelse behandles",
        getMessage: (subject) => `Admin arbejder nu på din henvendelse "${subject}".`,
    },
    contact_ticket_completed: {
        title: "Din henvendelse er afsluttet",
        getMessage: (subject) => `Admin har markeret din henvendelse "${subject}" som afsluttet.`,
    },
    contact_ticket_reopened: {
        title: "Din henvendelse er genåbnet",
        getMessage: (subject) => `Admin har genåbnet din henvendelse "${subject}".`,
    },
    contact_ticket_rejected: {
        title: "Din henvendelse er afvist",
        getMessage: (subject) => `Admin har afvist din henvendelse "${subject}".`,
    },
};
function notifyContactTicketSubmitter(ticket_1, type_1) {
    return __awaiter(this, arguments, void 0, function* (ticket, type, messageSuffix = "") {
        const copy = CONTACT_TICKET_NOTIFICATION_COPY[type];
        const message = `${copy.getMessage(ticket.subject)}${messageSuffix}`;
        yield notificationModel_1.NotificationModel.create({
            recipientUserId: ticket.submittedBy,
            type,
            title: copy.title,
            message,
            link: "/contact",
        });
    });
}
function markTicketSeen(id, adminUserId) {
    return __awaiter(this, void 0, void 0, function* () {
        const ticket = yield contactTicketModel_1.ContactTicketModel.findById(id);
        if (!ticket)
            return null;
        const shouldNotify = !ticket.seenAt;
        if (!ticket.seenAt) {
            ticket.seenAt = new Date();
            ticket.seenBy = adminUserId;
            yield ticket.save();
        }
        if (shouldNotify) {
            yield notifyContactTicketSubmitter(ticket, "contact_ticket_seen");
        }
        return ticket;
    });
}
function startTicketWork(id, adminUserId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const ticket = yield contactTicketModel_1.ContactTicketModel.findById(id);
        if (!ticket)
            return null;
        const shouldNotify = ticket.status !== "in_progress";
        ticket.status = "in_progress";
        ticket.inProgressAt = new Date();
        ticket.inProgressBy = adminUserId;
        ticket.seenAt = (_a = ticket.seenAt) !== null && _a !== void 0 ? _a : new Date();
        ticket.seenBy = (_b = ticket.seenBy) !== null && _b !== void 0 ? _b : adminUserId;
        ticket.completedAt = undefined;
        ticket.completedBy = undefined;
        ticket.rejectedAt = undefined;
        ticket.rejectedBy = undefined;
        ticket.rejectionReason = undefined;
        yield ticket.save();
        if (shouldNotify) {
            yield notifyContactTicketSubmitter(ticket, "contact_ticket_in_progress");
        }
        return ticket;
    });
}
function completeTicket(id, adminUserId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const ticket = yield contactTicketModel_1.ContactTicketModel.findById(id);
        if (!ticket)
            return null;
        const shouldNotify = ticket.status !== "completed";
        ticket.status = "completed";
        ticket.completedAt = new Date();
        ticket.completedBy = adminUserId;
        ticket.seenAt = (_a = ticket.seenAt) !== null && _a !== void 0 ? _a : new Date();
        ticket.seenBy = (_b = ticket.seenBy) !== null && _b !== void 0 ? _b : adminUserId;
        ticket.rejectedAt = undefined;
        ticket.rejectedBy = undefined;
        ticket.rejectionReason = undefined;
        yield ticket.save();
        if (shouldNotify) {
            yield notifyContactTicketSubmitter(ticket, "contact_ticket_completed");
        }
        return ticket;
    });
}
function reopenTicket(id, adminUserId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const ticket = yield contactTicketModel_1.ContactTicketModel.findById(id);
        if (!ticket)
            return null;
        const shouldNotify = ticket.status === "completed" || ticket.status === "rejected";
        ticket.status = "open";
        ticket.completedAt = undefined;
        ticket.completedBy = undefined;
        ticket.rejectedAt = undefined;
        ticket.rejectedBy = undefined;
        ticket.rejectionReason = undefined;
        ticket.inProgressAt = undefined;
        ticket.inProgressBy = undefined;
        ticket.seenAt = (_a = ticket.seenAt) !== null && _a !== void 0 ? _a : new Date();
        ticket.seenBy = (_b = ticket.seenBy) !== null && _b !== void 0 ? _b : adminUserId;
        yield ticket.save();
        if (shouldNotify) {
            yield notifyContactTicketSubmitter(ticket, "contact_ticket_reopened");
        }
        return ticket;
    });
}
function rejectTicket(id, reason, adminUserId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const ticket = yield contactTicketModel_1.ContactTicketModel.findById(id);
        if (!ticket)
            return null;
        const shouldNotify = ticket.status !== "rejected" || ticket.rejectionReason !== reason;
        ticket.status = "rejected";
        ticket.rejectedAt = new Date();
        ticket.rejectedBy = adminUserId;
        ticket.rejectionReason = reason;
        ticket.completedAt = undefined;
        ticket.completedBy = undefined;
        ticket.inProgressAt = undefined;
        ticket.inProgressBy = undefined;
        ticket.seenAt = (_a = ticket.seenAt) !== null && _a !== void 0 ? _a : new Date();
        ticket.seenBy = (_b = ticket.seenBy) !== null && _b !== void 0 ? _b : adminUserId;
        yield ticket.save();
        if (shouldNotify) {
            yield notifyContactTicketSubmitter(ticket, "contact_ticket_rejected", ` Begrundelse: ${reason}`);
        }
        return ticket;
    });
}
//# sourceMappingURL=contactTicket.service.js.map