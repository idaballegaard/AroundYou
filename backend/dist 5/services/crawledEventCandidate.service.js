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
exports.CrawledEventCandidateReviewError = void 0;
exports.importOplevEsbjergEventCandidates = importOplevEsbjergEventCandidates;
exports.getOplevEsbjergEventCandidates = getOplevEsbjergEventCandidates;
exports.approveCrawledEventCandidate = approveCrawledEventCandidate;
exports.rejectCrawledEventCandidate = rejectCrawledEventCandidate;
exports.saveCrawledEventCandidates = saveCrawledEventCandidates;
const crawledEventCandidateModel_1 = require("../models/crawledEventCandidateModel");
const event_service_1 = require("./event.service");
const oplevEsbjergEventCrawler_service_1 = require("./oplevEsbjergEventCrawler.service");
function importOplevEsbjergEventCandidates(limit) {
    return __awaiter(this, void 0, void 0, function* () {
        const crawl = yield (0, oplevEsbjergEventCrawler_service_1.crawlOplevEsbjergEvents)(limit);
        const persistence = yield saveCrawledEventCandidates(crawl.source, crawl.events, crawl.crawledAt);
        return Object.assign(Object.assign({}, crawl), { persistence });
    });
}
function getOplevEsbjergEventCandidates() {
    return __awaiter(this, arguments, void 0, function* (status = "new") {
        return crawledEventCandidateModel_1.CrawledEventCandidateModel.find({
            source: oplevEsbjergEventCrawler_service_1.OPLEV_ESBJERG_EVENT_SOURCE,
            status,
        })
            .sort({ crawledAt: -1, createdAt: -1 })
            .limit(50)
            .lean();
    });
}
function approveCrawledEventCandidate(id, payload, reviewedBy) {
    return __awaiter(this, void 0, void 0, function* () {
        const candidate = yield crawledEventCandidateModel_1.CrawledEventCandidateModel.findOne({
            _id: id,
            source: oplevEsbjergEventCrawler_service_1.OPLEV_ESBJERG_EVENT_SOURCE,
        });
        if (!candidate) {
            return null;
        }
        if (candidate.status !== "new") {
            throw new CrawledEventCandidateReviewError("Denne kandidat er allerede behandlet.");
        }
        // The canonical event schema requires an end date. When the source has no
        // end time, use the verified start moment internally instead of forcing an
        // admin to invent one. Search already treats a missing/identical end as a
        // single-point event.
        const endDate = typeof payload.endDate === "string" ? payload.endDate.trim() : "";
        const event = yield (0, event_service_1.createEventRecord)(Object.assign(Object.assign({}, payload), { endDate: endDate || payload.startDate }));
        candidate.status = "approved";
        candidate.publishedEventId = event._id.toString();
        candidate.reviewedBy = reviewedBy;
        candidate.reviewedAt = new Date();
        yield candidate.save();
        return event;
    });
}
class CrawledEventCandidateReviewError extends Error {
    constructor(message) {
        super(message);
        this.name = "CrawledEventCandidateReviewError";
    }
}
exports.CrawledEventCandidateReviewError = CrawledEventCandidateReviewError;
function rejectCrawledEventCandidate(id, reviewedBy, rejectionReason) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const candidate = yield crawledEventCandidateModel_1.CrawledEventCandidateModel.findOne({
            _id: id,
            source: oplevEsbjergEventCrawler_service_1.OPLEV_ESBJERG_EVENT_SOURCE,
        });
        if (!candidate) {
            return null;
        }
        if (candidate.status !== "new") {
            throw new CrawledEventCandidateReviewError("Denne kandidat er allerede behandlet.");
        }
        candidate.status = "rejected";
        candidate.reviewedBy = reviewedBy;
        candidate.reviewedAt = new Date();
        candidate.rejectionReason = (_a = rejectionReason === null || rejectionReason === void 0 ? void 0 : rejectionReason.trim()) !== null && _a !== void 0 ? _a : "";
        yield candidate.save();
        return candidate;
    });
}
function saveCrawledEventCandidates(source, events, crawledAt) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!events.length) {
            return { inserted: 0, updated: 0 };
        }
        const crawlDate = new Date(crawledAt);
        const result = yield crawledEventCandidateModel_1.CrawledEventCandidateModel.bulkWrite(events.map((event) => ({
            updateOne: {
                filter: { source, sourceId: event.sourceId },
                update: {
                    $set: {
                        sourceUrl: event.sourceUrl,
                        title: event.title,
                        description: event.description,
                        dateText: event.dateText,
                        locationText: event.locationText,
                        addressText: event.addressText,
                        category: event.category,
                        imageUrl: event.imageUrl,
                        startDate: event.startDate,
                        endDate: event.endDate,
                        crawledAt: crawlDate,
                    },
                    // Do not reset a future moderation decision simply because the
                    // source was crawled again.
                    $setOnInsert: { source, sourceId: event.sourceId, status: "new" },
                },
                upsert: true,
            },
        })));
        return {
            inserted: result.upsertedCount,
            updated: result.matchedCount,
        };
    });
}
//# sourceMappingURL=crawledEventCandidate.service.js.map