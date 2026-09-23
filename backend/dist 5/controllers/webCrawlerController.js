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
exports.crawlWebsite = crawlWebsite;
exports.crawlOplevEsbjergEventCalendar = crawlOplevEsbjergEventCalendar;
exports.getOplevEsbjergEventCandidates = getOplevEsbjergEventCandidates;
exports.approveOplevEsbjergEventCandidate = approveOplevEsbjergEventCandidate;
exports.rejectOplevEsbjergEventCandidate = rejectOplevEsbjergEventCandidate;
const webCrawler_service_1 = require("../services/webCrawler.service");
const oplevEsbjergEventCrawler_service_1 = require("../services/oplevEsbjergEventCrawler.service");
const crawledEventCandidate_service_1 = require("../services/crawledEventCandidate.service");
const controllerUtils_1 = require("./controllerUtils");
function parseLimit(value) {
    if (typeof value !== "string" || !value.trim()) {
        return undefined;
    }
    const limit = Number(value);
    return Number.isInteger(limit) ? limit : undefined;
}
function parseCandidateStatus(value) {
    return value === "approved" || value === "rejected" ? value : "new";
}
function crawlWebsite(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const page = yield (0, webCrawler_service_1.crawlPage)((_a = req.body) === null || _a === void 0 ? void 0 : _a.url);
            res.status(200).json(page);
        }
        catch (error) {
            if (error instanceof webCrawler_service_1.WebCrawlerError) {
                res.status(400).json({ message: error.message });
                return;
            }
            console.error("Web crawl failed:", error);
            res.status(502).json({ message: "Siden kunne ikke crawles." });
        }
    });
}
function crawlOplevEsbjergEventCalendar(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            res.status(200).json(yield (0, crawledEventCandidate_service_1.importOplevEsbjergEventCandidates)(parseLimit(req.query.limit)));
        }
        catch (error) {
            if (error instanceof oplevEsbjergEventCrawler_service_1.OplevEsbjergEventCrawlerError) {
                res.status(502).json({ message: error.message });
                return;
            }
            console.error("Oplev Esbjerg event crawl failed:", error);
            res.status(502).json({ message: "Eventkalenderen kunne ikke crawles." });
        }
    });
}
function getOplevEsbjergEventCandidates(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            res
                .status(200)
                .json(yield (0, crawledEventCandidate_service_1.getOplevEsbjergEventCandidates)(parseCandidateStatus(req.query.status)));
        }
        catch (error) {
            console.error("Could not fetch crawled event candidates:", error);
            res.status(500).json({ message: "Eventkandidaterne kunne ikke hentes." });
        }
    });
}
function approveOplevEsbjergEventCandidate(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const event = yield (0, crawledEventCandidate_service_1.approveCrawledEventCandidate)((0, controllerUtils_1.getRouteParam)(req.params.id), req.body, (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID);
            if (!event) {
                res.status(404).json({ message: "Eventkandidaten blev ikke fundet." });
                return;
            }
            res.status(201).json(event);
        }
        catch (error) {
            if ((0, controllerUtils_1.isValidationError)(error)) {
                res.status(400).json({ message: error.message });
                return;
            }
            if (error instanceof crawledEventCandidate_service_1.CrawledEventCandidateReviewError) {
                res.status(409).json({ message: error.message });
                return;
            }
            console.error("Could not approve crawled event candidate:", error);
            res.status(500).json({ message: "Eventkandidaten kunne ikke godkendes." });
        }
    });
}
function rejectOplevEsbjergEventCandidate(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const reason = typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.reason) === "string" ? req.body.reason : "";
            const candidate = yield (0, crawledEventCandidate_service_1.rejectCrawledEventCandidate)((0, controllerUtils_1.getRouteParam)(req.params.id), (_b = req.user) === null || _b === void 0 ? void 0 : _b.userID, reason);
            if (!candidate) {
                res.status(404).json({ message: "Eventkandidaten blev ikke fundet." });
                return;
            }
            res.status(200).json(candidate);
        }
        catch (error) {
            if (error instanceof crawledEventCandidate_service_1.CrawledEventCandidateReviewError) {
                res.status(409).json({ message: error.message });
                return;
            }
            console.error("Could not reject crawled event candidate:", error);
            res.status(500).json({ message: "Eventkandidaten kunne ikke afvises." });
        }
    });
}
//# sourceMappingURL=webCrawlerController.js.map