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
exports.getCrawledEventCandidates = getCrawledEventCandidates;
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
        return getCrawledEventCandidates(oplevEsbjergEventCrawler_service_1.OPLEV_ESBJERG_EVENT_SOURCE, status);
    });
}
function getCrawledEventCandidates(source_1) {
    return __awaiter(this, arguments, void 0, function* (source, status = "new") {
        var _a;
        const candidates = yield crawledEventCandidateModel_1.CrawledEventCandidateModel.find({
            source,
            status,
        })
            .sort({ crawledAt: -1, createdAt: -1 })
            .limit(50)
            .lean();
        const candidateDates = [...new Set(candidates.map((candidate) => candidate.startDate.slice(0, 10)).filter(Boolean))];
        if (!candidateDates.length) {
            return candidates.map((candidate) => (Object.assign(Object.assign({}, candidate), { possibleDuplicates: [] })));
        }
        // A source-specific ID only prevents repeat imports from that same source.
        // Candidates with the same normalised title and calendar date are scored
        // with their time and venue details, giving moderators an explainable
        // cross-source duplicate assessment before publication.
        const otherCandidates = yield crawledEventCandidateModel_1.CrawledEventCandidateModel.find({
            source: { $ne: source },
            status: { $in: ["new", "approved"] },
            $or: candidateDates.map((date) => ({ startDate: new RegExp(`^${date}`) })),
        })
            .select("title source sourceUrl dateText startDate locationText addressText status")
            .lean();
        const duplicatesByFingerprint = new Map();
        for (const candidate of otherCandidates) {
            const fingerprint = getDuplicateFingerprint(candidate.title, candidate.startDate);
            if (!fingerprint)
                continue;
            const currentCandidate = candidates.find((item) => getDuplicateFingerprint(item.title, item.startDate) === fingerprint);
            if (!currentCandidate)
                continue;
            const duplicateMatch = getDuplicateMatch(currentCandidate, candidate);
            const duplicates = (_a = duplicatesByFingerprint.get(fingerprint)) !== null && _a !== void 0 ? _a : [];
            duplicates.push({
                _id: candidate._id.toString(),
                title: candidate.title,
                source: candidate.source,
                sourceUrl: candidate.sourceUrl,
                dateText: candidate.dateText,
                status: candidate.status,
                matchScore: duplicateMatch.matchScore,
                matchConfidence: duplicateMatch.matchConfidence,
                matchReasons: duplicateMatch.matchReasons,
            });
            duplicatesByFingerprint.set(fingerprint, duplicates);
        }
        return candidates.map((candidate) => {
            var _a;
            return (Object.assign(Object.assign({}, candidate), { possibleDuplicates: ((_a = duplicatesByFingerprint.get(getDuplicateFingerprint(candidate.title, candidate.startDate))) !== null && _a !== void 0 ? _a : []).sort((first, second) => second.matchScore - first.matchScore) }));
        });
    });
}
function getDuplicateMatch(first, second) {
    const reasons = ["Samme titel", "Samme dato"];
    let score = 75;
    if (getKnownStartTime(first.startDate) && getKnownStartTime(first.startDate) === getKnownStartTime(second.startDate)) {
        score += 15;
        reasons.push("Samme starttidspunkt");
    }
    if (hasSameVenue(first, second)) {
        score += 10;
        reasons.push("Samme sted eller adresse");
    }
    return {
        matchScore: score,
        matchConfidence: score >= 90 ? "Høj" : score >= 75 ? "Middel" : "Lav",
        matchReasons: reasons,
    };
}
function getKnownStartTime(startDate) {
    var _a, _b;
    const time = (_b = (_a = startDate.match(/T(\d{2}:\d{2})$/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : "";
    return time === "00:00" ? "" : time;
}
function hasSameVenue(first, second) {
    const firstVenue = normalizeMatchText(first.addressText || first.locationText);
    const secondVenue = normalizeMatchText(second.addressText || second.locationText);
    return firstVenue.length >= 8 && secondVenue.length >= 8 && (firstVenue === secondVenue || firstVenue.includes(secondVenue) || secondVenue.includes(firstVenue));
}
function getDuplicateFingerprint(title, startDate) {
    const date = startDate.slice(0, 10);
    const normalizedTitle = normalizeMatchText(title);
    return date && normalizedTitle ? `${date}:${normalizedTitle}` : "";
}
function normalizeMatchText(value) {
    return value
        .toLocaleLowerCase("da-DK")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}
function approveCrawledEventCandidate(id_1, payload_1, reviewedBy_1) {
    return __awaiter(this, arguments, void 0, function* (id, payload, reviewedBy, source = oplevEsbjergEventCrawler_service_1.OPLEV_ESBJERG_EVENT_SOURCE) {
        const candidate = yield crawledEventCandidateModel_1.CrawledEventCandidateModel.findOne({
            _id: id,
            source,
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
function rejectCrawledEventCandidate(id_1, reviewedBy_1, rejectionReason_1) {
    return __awaiter(this, arguments, void 0, function* (id, reviewedBy, rejectionReason, source = oplevEsbjergEventCrawler_service_1.OPLEV_ESBJERG_EVENT_SOURCE) {
        var _a;
        const candidate = yield crawledEventCandidateModel_1.CrawledEventCandidateModel.findOne({
            _id: id,
            source,
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