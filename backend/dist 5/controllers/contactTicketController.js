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
exports.createContactTicket = createContactTicket;
exports.getMyContactTickets = getMyContactTickets;
exports.getAdminContactTickets = getAdminContactTickets;
exports.completeContactTicket = completeContactTicket;
exports.markContactTicketSeen = markContactTicketSeen;
exports.startContactTicketWork = startContactTicketWork;
exports.reopenContactTicket = reopenContactTicket;
exports.rejectContactTicket = rejectContactTicket;
const contactTicketModel_1 = require("../models/contactTicketModel");
const contactTicket_service_1 = require("../services/contactTicket.service");
function isTicketCategory(value) {
    return (typeof value === "string" &&
        contactTicketModel_1.CONTACT_TICKET_CATEGORIES.includes(value));
}
function getTrimmedString(value) {
    return typeof value === "string" ? value.trim() : "";
}
function getRouteParam(value) {
    var _a;
    return Array.isArray(value) ? ((_a = value[0]) !== null && _a !== void 0 ? _a : "") : (value !== null && value !== void 0 ? value : "");
}
function getRejectionReason(value) {
    const reason = getTrimmedString(value);
    if (reason.length < 3 || reason.length > 1000) {
        const error = new Error("Afvisningsårsagen skal være mellem 3 og 1000 tegn.");
        error.name = "ValidationError";
        throw error;
    }
    return reason;
}
function getStatusFilter(value) {
    if (value === "in_progress" ||
        value === "completed" ||
        value === "rejected" ||
        value === "all") {
        return value;
    }
    return "open";
}
function createContactTicket(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const category = req.body.category;
        const subject = getTrimmedString(req.body.subject);
        const message = getTrimmedString(req.body.message);
        if (!isTicketCategory(category)) {
            res.status(400).json({ message: "Vælg en gyldig kategori." });
            return;
        }
        if (subject.length < 3 || subject.length > 140) {
            res.status(400).json({ message: "Emnet skal være mellem 3 og 140 tegn." });
            return;
        }
        if (message.length < 10 || message.length > 3000) {
            res.status(400).json({
                message: "Beskeden skal være mellem 10 og 3000 tegn.",
            });
            return;
        }
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userID) || !req.user.userName || !req.user.email) {
            res.status(401).json({ message: "Du skal være logget ind." });
            return;
        }
        try {
            const ticket = new contactTicketModel_1.ContactTicketModel({
                category,
                subject,
                message,
                submittedBy: req.user.userID,
                submittedByName: req.user.userName,
                submittedByEmail: req.user.email,
            });
            res.status(201).json(yield ticket.save());
        }
        catch (err) {
            console.error("Error creating contact ticket:", err);
            res.status(500).json({ message: "Kunne ikke oprette henvendelsen." });
        }
    });
}
function getMyContactTickets(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userID)) {
            res.status(401).json({ message: "Du skal være logget ind." });
            return;
        }
        try {
            const tickets = yield contactTicketModel_1.ContactTicketModel.find({
                submittedBy: req.user.userID,
            }).sort({ createdAt: -1 });
            res.status(200).json(tickets);
        }
        catch (err) {
            console.error("Error fetching contact tickets:", err);
            res.status(500).json({ message: "Kunne ikke hente henvendelser." });
        }
    });
}
function getAdminContactTickets(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const status = getStatusFilter(req.query.status);
        const query = {};
        if (status !== "all") {
            query.status = status;
        }
        if (isTicketCategory(req.query.category)) {
            query.category = req.query.category;
        }
        try {
            const tickets = yield contactTicketModel_1.ContactTicketModel.find(query).sort({
                status: 1,
                createdAt: -1,
            });
            res.status(200).json(tickets);
        }
        catch (err) {
            console.error("Error fetching admin contact tickets:", err);
            res.status(500).json({ message: "Kunne ikke hente henvendelser." });
        }
    });
}
function completeContactTicket(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const ticket = yield (0, contactTicket_service_1.completeTicket)(getRouteParam(req.params.id), (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID);
            if (!ticket) {
                res.status(404).json({ message: "Henvendelsen blev ikke fundet." });
                return;
            }
            res.status(200).json(ticket);
        }
        catch (err) {
            console.error("Error completing contact ticket:", err);
            res.status(500).json({ message: "Kunne ikke afslutte henvendelsen." });
        }
    });
}
function markContactTicketSeen(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const ticket = yield (0, contactTicket_service_1.markTicketSeen)(getRouteParam(req.params.id), (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID);
            if (!ticket) {
                res.status(404).json({ message: "Henvendelsen blev ikke fundet." });
                return;
            }
            res.status(200).json(ticket);
        }
        catch (err) {
            console.error("Error marking contact ticket seen:", err);
            res
                .status(500)
                .json({ message: "Kunne ikke markere henvendelsen som set." });
        }
    });
}
function startContactTicketWork(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const ticket = yield (0, contactTicket_service_1.startTicketWork)(getRouteParam(req.params.id), (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID);
            if (!ticket) {
                res.status(404).json({ message: "Henvendelsen blev ikke fundet." });
                return;
            }
            res.status(200).json(ticket);
        }
        catch (err) {
            console.error("Error starting contact ticket work:", err);
            res
                .status(500)
                .json({ message: "Kunne ikke starte arbejdet på henvendelsen." });
        }
    });
}
function reopenContactTicket(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const ticket = yield (0, contactTicket_service_1.reopenTicket)(getRouteParam(req.params.id), (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID);
            if (!ticket) {
                res.status(404).json({ message: "Henvendelsen blev ikke fundet." });
                return;
            }
            res.status(200).json(ticket);
        }
        catch (err) {
            console.error("Error reopening contact ticket:", err);
            res.status(500).json({ message: "Kunne ikke genåbne henvendelsen." });
        }
    });
}
function rejectContactTicket(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const ticket = yield (0, contactTicket_service_1.rejectTicket)(getRouteParam(req.params.id), getRejectionReason(req.body.reason), (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID);
            if (!ticket) {
                res.status(404).json({ message: "Henvendelsen blev ikke fundet." });
                return;
            }
            res.status(200).json(ticket);
        }
        catch (err) {
            console.error("Error rejecting contact ticket:", err);
            if (err instanceof Error && err.name === "ValidationError") {
                res.status(400).json({ message: err.message });
                return;
            }
            res.status(500).json({ message: "Kunne ikke afvise henvendelsen." });
        }
    });
}
//# sourceMappingURL=contactTicketController.js.map