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
exports.BusinessEsbjergEventCrawlerError = exports.BUSINESS_ESBJERG_EVENT_CALENDAR_URL = exports.BUSINESS_ESBJERG_EVENT_SOURCE = void 0;
exports.crawlBusinessEsbjergEvents = crawlBusinessEsbjergEvents;
exports.importBusinessEsbjergEventCandidates = importBusinessEsbjergEventCandidates;
const cheerio_1 = require("cheerio");
const crawlee_1 = require("crawlee");
const crawledEventCandidate_service_1 = require("./crawledEventCandidate.service");
exports.BUSINESS_ESBJERG_EVENT_SOURCE = "Business Esbjerg arrangementer";
exports.BUSINESS_ESBJERG_EVENT_CALENDAR_URL = "https://www.businessesbjerg.com/arrangementer";
const BUSINESS_ESBJERG_EVENTS_API_URL = "https://www.businessesbjerg.com/actions/quantity-site/site/get-events?siteId=1";
const MAX_EVENTS_PER_CRAWL = 100;
class BusinessEsbjergEventCrawlerError extends Error {
    constructor(message) {
        super(message);
        this.name = "BusinessEsbjergEventCrawlerError";
    }
}
exports.BusinessEsbjergEventCrawlerError = BusinessEsbjergEventCrawlerError;
function normalizeText(value) {
    return value.replace(/\s+/g, " ").trim();
}
function getApiUrl(page) {
    return page > 1 ? `${BUSINESS_ESBJERG_EVENTS_API_URL}&page=${page}` : BUSINESS_ESBJERG_EVENTS_API_URL;
}
function crawlApiPages(urls) {
    return __awaiter(this, void 0, void 0, function* () {
        const pages = [];
        let failureMessage = "Business Esbjergs arrangementsside kunne ikke crawles.";
        const crawler = new crawlee_1.HttpCrawler({
            maxConcurrency: 2,
            maxRequestRetries: 0,
            maxRequestsPerCrawl: urls.length,
            requestHandlerTimeoutSecs: 20,
            useSessionPool: false,
            requestHandler(_a) {
                return __awaiter(this, arguments, void 0, function* ({ body }) {
                    pages.push(JSON.parse(body.toString()));
                });
            },
            failedRequestHandler(_context, error) {
                failureMessage = error instanceof Error ? error.message : failureMessage;
            },
        }, new crawlee_1.Configuration({ persistStorage: false }));
        yield crawler.run(urls);
        if (!pages.length) {
            throw new BusinessEsbjergEventCrawlerError(failureMessage);
        }
        return pages;
    });
}
function getYearForEvent(month, day) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const eventDate = new Date(currentYear, month - 1, day);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // The calendar only exposes day and month. Events that have already passed
    // this year therefore belong to the following calendar year.
    return eventDate < today ? currentYear + 1 : currentYear;
}
function parseDate(dayText, monthText) {
    const months = {
        jan: 1,
        feb: 2,
        mar: 3,
        apr: 4,
        maj: 5,
        jun: 6,
        jul: 7,
        aug: 8,
        sep: 9,
        okt: 10,
        nov: 11,
        dec: 12,
    };
    const day = Number(dayText);
    const month = months[monthText.toLowerCase().slice(0, 3)];
    if (!Number.isInteger(day) || !month)
        return "";
    return `${getYearForEvent(month, day)}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function parseTimeRange(value) {
    var _a, _b;
    const times = [...value.matchAll(/(\d{1,2})[.:](\d{2})/g)].map((match) => `${match[1].padStart(2, "0")}:${match[2]}`);
    return { startTime: (_a = times[0]) !== null && _a !== void 0 ? _a : "", endTime: (_b = times[1]) !== null && _b !== void 0 ? _b : "" };
}
function addEventDetails(events) {
    return __awaiter(this, void 0, void 0, function* () {
        const details = new Map();
        const crawler = new crawlee_1.HttpCrawler({
            maxConcurrency: 2,
            maxRequestRetries: 0,
            maxRequestsPerCrawl: events.length,
            requestHandlerTimeoutSecs: 20,
            useSessionPool: false,
            requestHandler(_a) {
                return __awaiter(this, arguments, void 0, function* ({ request, body }) {
                    var _b;
                    const sourceId = request.userData.sourceId;
                    if (typeof sourceId !== "string")
                        return;
                    const $ = (0, cheerio_1.load)(body.toString());
                    const timeText = normalizeText($(".time-location__time").text());
                    const locationText = normalizeText($(".time-location__location").text());
                    const { startTime, endTime } = parseTimeRange(timeText);
                    const startDate = String((_b = request.userData.startDate) !== null && _b !== void 0 ? _b : "").slice(0, 10);
                    details.set(sourceId, {
                        description: normalizeText($(".eventpage__description").text()),
                        locationText,
                        addressText: locationText,
                        dateText: [startDate, timeText].filter(Boolean).join(", "),
                        startDate: startDate && startTime ? `${startDate}T${startTime}` : startDate,
                        endDate: startDate && endTime ? `${startDate}T${endTime}` : "",
                    });
                });
            },
            // One inaccessible detail page must not prevent importing the rest.
            failedRequestHandler() { },
        }, new crawlee_1.Configuration({ persistStorage: false }));
        yield crawler.run(events.map((event) => ({
            url: event.sourceUrl,
            userData: { sourceId: event.sourceId, startDate: event.startDate },
        })));
        return events.map((event) => (Object.assign(Object.assign({}, event), details.get(event.sourceId))));
    });
}
function crawlBusinessEsbjergEvents() {
    return __awaiter(this, arguments, void 0, function* (limit = MAX_EVENTS_PER_CRAWL) {
        var _a, _b, _c;
        const requestedLimit = Math.min(Math.max(limit, 1), MAX_EVENTS_PER_CRAWL);
        const [firstPage] = yield crawlApiPages([getApiUrl(1)]);
        const pageCount = Math.max(1, (_c = (_b = (_a = firstPage.data) === null || _a === void 0 ? void 0 : _a.grid) === null || _b === void 0 ? void 0 : _b.pages) !== null && _c !== void 0 ? _c : 1);
        const remainingPages = pageCount > 1
            ? yield crawlApiPages(Array.from({ length: pageCount - 1 }, (_value, index) => getApiUrl(index + 2)))
            : [];
        const apiEvents = [firstPage, ...remainingPages].flatMap((page) => { var _a, _b, _c; return (_c = (_b = (_a = page.data) === null || _a === void 0 ? void 0 : _a.grid) === null || _b === void 0 ? void 0 : _b.items) !== null && _c !== void 0 ? _c : []; });
        const events = apiEvents
            .filter((event) => !event.isExpired)
            .map((event) => {
            var _a, _b;
            const date = parseDate(event.date, event.month);
            return {
                sourceId: String(event.id),
                sourceUrl: event.url,
                title: normalizeText(event.heading),
                description: "",
                dateText: [event.date, event.month, date.slice(0, 4)].filter(Boolean).join(" "),
                locationText: "",
                addressText: "",
                category: "Erhverv",
                imageUrl: (_b = (_a = event.image) === null || _a === void 0 ? void 0 : _a.src) !== null && _b !== void 0 ? _b : "",
                startDate: date ? `${date}T00:00` : "",
                endDate: "",
            };
        })
            .filter((event) => Boolean(event.sourceId && event.sourceUrl && event.title && event.startDate))
            .slice(0, requestedLimit);
        return {
            source: exports.BUSINESS_ESBJERG_EVENT_SOURCE,
            sourceUrl: exports.BUSINESS_ESBJERG_EVENT_CALENDAR_URL,
            crawledAt: new Date().toISOString(),
            events: yield addEventDetails(events),
        };
    });
}
function importBusinessEsbjergEventCandidates(limit) {
    return __awaiter(this, void 0, void 0, function* () {
        const crawl = yield crawlBusinessEsbjergEvents(limit);
        const persistence = yield (0, crawledEventCandidate_service_1.saveCrawledEventCandidates)(crawl.source, crawl.events, crawl.crawledAt);
        return Object.assign(Object.assign({}, crawl), { persistence });
    });
}
//# sourceMappingURL=businessEsbjergEventCrawler.service.js.map