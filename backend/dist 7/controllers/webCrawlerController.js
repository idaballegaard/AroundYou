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
exports.getOplevEsbjergEventImportStatus = getOplevEsbjergEventImportStatus;
exports.getCrawlerEventSources = getCrawlerEventSources;
exports.crawlCrawlerEventCalendar = crawlCrawlerEventCalendar;
exports.getCrawlerEventCandidates = getCrawlerEventCandidates;
exports.getCrawlerEventImportStatus = getCrawlerEventImportStatus;
exports.approveCrawlerEventCandidate = approveCrawlerEventCandidate;
exports.rejectCrawlerEventCandidate = rejectCrawlerEventCandidate;
exports.getOplevEsbjergEventCandidates = getOplevEsbjergEventCandidates;
exports.approveOplevEsbjergEventCandidate = approveOplevEsbjergEventCandidate;
exports.rejectOplevEsbjergEventCandidate = rejectOplevEsbjergEventCandidate;
const webCrawler_service_1 = require("../services/webCrawler.service");
const oplevEsbjergEventCrawler_service_1 = require("../services/oplevEsbjergEventCrawler.service");
const esbjergLibraryEventCrawler_service_1 = require("../services/esbjergLibraryEventCrawler.service");
const esbjergCityEventCrawler_service_1 = require("../services/esbjergCityEventCrawler.service");
const businessEsbjergEventCrawler_service_1 = require("../services/businessEsbjergEventCrawler.service");
const crawledEventCandidate_service_1 = require("../services/crawledEventCandidate.service");
const crawlerImportRun_service_1 = require("../services/crawlerImportRun.service");
const crawlerSourceRegistry_service_1 = require("../services/crawlerSourceRegistry.service");
const oplevEsbjergImportScheduler_service_1 = require("../services/oplevEsbjergImportScheduler.service");
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
function getRequestedCrawlerSourceId(value) {
    return typeof value === "string" && value.trim() ? value.trim() : crawlerSourceRegistry_service_1.OPLEV_ESBJERG_SOURCE_ID;
}
function getRequestedCrawlerSource(value) {
    const source = (0, crawlerSourceRegistry_service_1.getCrawlerEventSource)(getRequestedCrawlerSourceId(value));
    if (!source) {
        throw new crawlerImportRun_service_1.CrawlerSourceNotFoundError();
    }
    return source;
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
            res.status(200).json(yield (0, crawlerImportRun_service_1.runOplevEsbjergEventImport)("manual", parseLimit(req.query.limit)));
        }
        catch (error) {
            if (error instanceof oplevEsbjergEventCrawler_service_1.OplevEsbjergEventCrawlerError ||
                error instanceof esbjergLibraryEventCrawler_service_1.EsbjergLibraryEventCrawlerError ||
                error instanceof esbjergCityEventCrawler_service_1.EsbjergCityEventCrawlerError ||
                error instanceof businessEsbjergEventCrawler_service_1.BusinessEsbjergEventCrawlerError) {
                res.status(502).json({ message: error.message });
                return;
            }
            console.error("Oplev Esbjerg event crawl failed:", error);
            res.status(502).json({ message: "Eventkalenderen kunne ikke crawles." });
        }
    });
}
function getOplevEsbjergEventImportStatus(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const nextImport = (0, oplevEsbjergImportScheduler_service_1.getNextOplevEsbjergImportTime)();
            res.status(200).json({
                dailyImportEnabled: (0, oplevEsbjergImportScheduler_service_1.isOplevEsbjergDailyImportEnabled)(),
                dailyImportHour: (0, oplevEsbjergImportScheduler_service_1.getOplevEsbjergDailyImportHour)(),
                nextImportAt: (_a = nextImport === null || nextImport === void 0 ? void 0 : nextImport.toISOString()) !== null && _a !== void 0 ? _a : null,
                lastRun: yield (0, crawlerImportRun_service_1.getLatestOplevEsbjergEventImportRun)(),
            });
        }
        catch (error) {
            console.error("Could not fetch Oplev Esbjerg import status:", error);
            res.status(500).json({ message: "Importstatus kunne ikke hentes." });
        }
    });
}
function getCrawlerEventSources(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        res.status(200).json((0, crawlerSourceRegistry_service_1.getCrawlerEventSources)());
    });
}
function crawlCrawlerEventCalendar(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sourceId = getRequestedCrawlerSourceId(req.query.source);
            res.status(200).json(yield (0, crawlerImportRun_service_1.runCrawlerEventImport)(sourceId, "manual", parseLimit(req.query.limit)));
        }
        catch (error) {
            if (error instanceof crawlerImportRun_service_1.CrawlerSourceNotFoundError) {
                res.status(404).json({ message: error.message });
                return;
            }
            if (error instanceof crawlerImportRun_service_1.CrawlerSourceNotReadyError) {
                res.status(409).json({ message: error.message });
                return;
            }
            if (error instanceof oplevEsbjergEventCrawler_service_1.OplevEsbjergEventCrawlerError ||
                error instanceof esbjergLibraryEventCrawler_service_1.EsbjergLibraryEventCrawlerError ||
                error instanceof esbjergCityEventCrawler_service_1.EsbjergCityEventCrawlerError ||
                error instanceof businessEsbjergEventCrawler_service_1.BusinessEsbjergEventCrawlerError) {
                res.status(502).json({ message: error.message });
                return;
            }
            console.error("Crawler event import failed:", error);
            res.status(502).json({ message: "Eventkilden kunne ikke crawles." });
        }
    });
}
function getCrawlerEventCandidates(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const source = getRequestedCrawlerSource(req.query.source);
            res.status(200).json(yield (0, crawledEventCandidate_service_1.getCrawledEventCandidates)(source.candidateSource, parseCandidateStatus(req.query.status)));
        }
        catch (error) {
            if (error instanceof crawlerImportRun_service_1.CrawlerSourceNotFoundError) {
                res.status(404).json({ message: error.message });
                return;
            }
            console.error("Could not fetch crawled event candidates:", error);
            res.status(500).json({ message: "Eventkandidaterne kunne ikke hentes." });
        }
    });
}
function getCrawlerEventImportStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const sourceId = getRequestedCrawlerSourceId(req.query.source);
            const source = getRequestedCrawlerSource(sourceId);
            const scheduled = source.supportsScheduledImport;
            const nextImport = scheduled ? (0, oplevEsbjergImportScheduler_service_1.getNextOplevEsbjergImportTime)() : null;
            res.status(200).json({
                source: {
                    id: source.id,
                    label: source.label,
                    supportsScheduledImport: source.supportsScheduledImport,
                },
                dailyImportEnabled: scheduled && (0, oplevEsbjergImportScheduler_service_1.isOplevEsbjergDailyImportEnabled)(),
                dailyImportHour: scheduled ? (0, oplevEsbjergImportScheduler_service_1.getOplevEsbjergDailyImportHour)() : null,
                nextImportAt: (_a = nextImport === null || nextImport === void 0 ? void 0 : nextImport.toISOString()) !== null && _a !== void 0 ? _a : null,
                lastRun: yield (0, crawlerImportRun_service_1.getLatestCrawlerEventImportRun)(sourceId),
            });
        }
        catch (error) {
            if (error instanceof crawlerImportRun_service_1.CrawlerSourceNotFoundError) {
                res.status(404).json({ message: error.message });
                return;
            }
            console.error("Could not fetch crawler import status:", error);
            res.status(500).json({ message: "Importstatus kunne ikke hentes." });
        }
    });
}
function approveCrawlerEventCandidate(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const source = getRequestedCrawlerSource(req.query.source);
            const event = yield (0, crawledEventCandidate_service_1.approveCrawledEventCandidate)((0, controllerUtils_1.getRouteParam)(req.params.id), req.body, (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID, source.candidateSource);
            if (!event) {
                res.status(404).json({ message: "Eventkandidaten blev ikke fundet." });
                return;
            }
            res.status(201).json(event);
        }
        catch (error) {
            if (error instanceof crawlerImportRun_service_1.CrawlerSourceNotFoundError) {
                res.status(404).json({ message: error.message });
                return;
            }
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
function rejectCrawlerEventCandidate(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const source = getRequestedCrawlerSource(req.query.source);
            const reason = typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.reason) === "string" ? req.body.reason : "";
            const candidate = yield (0, crawledEventCandidate_service_1.rejectCrawledEventCandidate)((0, controllerUtils_1.getRouteParam)(req.params.id), (_b = req.user) === null || _b === void 0 ? void 0 : _b.userID, reason, source.candidateSource);
            if (!candidate) {
                res.status(404).json({ message: "Eventkandidaten blev ikke fundet." });
                return;
            }
            res.status(200).json(candidate);
        }
        catch (error) {
            if (error instanceof crawlerImportRun_service_1.CrawlerSourceNotFoundError) {
                res.status(404).json({ message: error.message });
                return;
            }
            if (error instanceof crawledEventCandidate_service_1.CrawledEventCandidateReviewError) {
                res.status(409).json({ message: error.message });
                return;
            }
            console.error("Could not reject crawled event candidate:", error);
            res.status(500).json({ message: "Eventkandidaten kunne ikke afvises." });
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