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
exports.CrawlerSourceNotReadyError = exports.CrawlerSourceNotFoundError = void 0;
exports.runCrawlerEventImport = runCrawlerEventImport;
exports.runOplevEsbjergEventImport = runOplevEsbjergEventImport;
exports.getLatestOplevEsbjergEventImportRun = getLatestOplevEsbjergEventImportRun;
exports.getLatestCrawlerEventImportRun = getLatestCrawlerEventImportRun;
const crawlerImportRunModel_1 = require("../models/crawlerImportRunModel");
const crawlerSourceRegistry_service_1 = require("./crawlerSourceRegistry.service");
class CrawlerSourceNotFoundError extends Error {
    constructor() {
        super("Den valgte crawlerkilde findes ikke.");
        this.name = "CrawlerSourceNotFoundError";
    }
}
exports.CrawlerSourceNotFoundError = CrawlerSourceNotFoundError;
class CrawlerSourceNotReadyError extends Error {
    constructor() {
        super("Denne crawlerkilde er registreret, men endnu ikke klar til import.");
        this.name = "CrawlerSourceNotReadyError";
    }
}
exports.CrawlerSourceNotReadyError = CrawlerSourceNotReadyError;
function runCrawlerEventImport(sourceId, trigger, limit) {
    return __awaiter(this, void 0, void 0, function* () {
        const source = (0, crawlerSourceRegistry_service_1.getCrawlerEventSource)(sourceId);
        if (!source) {
            throw new CrawlerSourceNotFoundError();
        }
        if (source.status !== "active" || !source.importCandidates) {
            throw new CrawlerSourceNotReadyError();
        }
        const run = yield crawlerImportRunModel_1.CrawlerImportRunModel.create({
            source: source.candidateSource,
            trigger,
            status: "running",
            startedAt: new Date(),
        });
        try {
            const result = yield source.importCandidates(limit);
            run.status = "succeeded";
            run.finishedAt = new Date();
            run.eventCount = result.events.length;
            run.inserted = result.persistence.inserted;
            run.updated = result.persistence.updated;
            run.errorMessage = undefined;
            yield run.save();
            return result;
        }
        catch (error) {
            run.status = "failed";
            run.finishedAt = new Date();
            run.errorMessage = error instanceof Error ? error.message : "Ukendt importfejl.";
            yield run.save();
            throw error;
        }
    });
}
function runOplevEsbjergEventImport(trigger, limit) {
    return __awaiter(this, void 0, void 0, function* () {
        return runCrawlerEventImport(crawlerSourceRegistry_service_1.OPLEV_ESBJERG_SOURCE_ID, trigger, limit);
    });
}
function getLatestOplevEsbjergEventImportRun() {
    return __awaiter(this, void 0, void 0, function* () {
        return getLatestCrawlerEventImportRun(crawlerSourceRegistry_service_1.OPLEV_ESBJERG_SOURCE_ID);
    });
}
function getLatestCrawlerEventImportRun(sourceId) {
    return __awaiter(this, void 0, void 0, function* () {
        const source = (0, crawlerSourceRegistry_service_1.getCrawlerEventSource)(sourceId);
        if (!source) {
            throw new CrawlerSourceNotFoundError();
        }
        return crawlerImportRunModel_1.CrawlerImportRunModel.findOne({ source: source.candidateSource })
            .sort({ startedAt: -1 })
            .lean();
    });
}
//# sourceMappingURL=crawlerImportRun.service.js.map