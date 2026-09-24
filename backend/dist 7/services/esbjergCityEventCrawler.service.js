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
exports.EsbjergCityEventCrawlerError = exports.ESBJERG_CITY_EVENT_CALENDAR_URL = exports.ESBJERG_CITY_EVENT_SOURCE = void 0;
exports.parseEsbjergCityEvents = parseEsbjergCityEvents;
exports.crawlEsbjergCityEvents = crawlEsbjergCityEvents;
exports.importEsbjergCityEventCandidates = importEsbjergCityEventCandidates;
const cheerio_1 = require("cheerio");
const crawlee_1 = require("crawlee");
const crawledEventCandidate_service_1 = require("./crawledEventCandidate.service");
exports.ESBJERG_CITY_EVENT_SOURCE = "Esbjerg City eventkalender";
exports.ESBJERG_CITY_EVENT_CALENDAR_URL = "https://www.esbjergcity.dk/det-sker/";
const MAX_EVENTS_PER_CRAWL = 50;
class EsbjergCityEventCrawlerError extends Error {
    constructor(message) {
        super(message);
        this.name = "EsbjergCityEventCrawlerError";
    }
}
exports.EsbjergCityEventCrawlerError = EsbjergCityEventCrawlerError;
function normalizeText(value) {
    return value.replace(/\s+/g, " ").trim();
}
function normalizeYear(value) {
    return value.length === 2 ? `20${value}` : value;
}
function formatDate(year, month, day) {
    return `${normalizeYear(year)}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00`;
}
function parseDateRange(value) {
    var _a;
    const range = value.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s*(?:-|–)\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*(.*)$/);
    const single = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*(.*)$/);
    if (range) {
        return {
            startDate: formatDate((_a = range[3]) !== null && _a !== void 0 ? _a : range[6], range[2], range[1]),
            endDate: formatDate(range[6], range[5], range[4]),
            title: normalizeText(range[7]),
        };
    }
    if (single) {
        const date = formatDate(single[3], single[2], single[1]);
        return { startDate: date, endDate: date, title: normalizeText(single[4]) };
    }
    return { startDate: "", endDate: "", title: normalizeText(value) };
}
function isUpcoming(startDate) {
    return Boolean(startDate) && startDate.slice(0, 10) >= new Date().toISOString().slice(0, 10);
}
function parseEsbjergCityEvents(html) {
    const $ = (0, cheerio_1.load)(html);
    return $("article.dt_portfolio_category-kalender")
        .map((_index, element) => {
        var _a, _b, _c;
        const card = $(element);
        const sourceUrl = (_a = card.find(".entry-title a").first().attr("href")) !== null && _a !== void 0 ? _a : "";
        const rawTitle = normalizeText(card.find(".entry-title").text());
        const parsed = parseDateRange(rawTitle);
        return {
            sourceId: (_b = card.attr("data-post-id")) !== null && _b !== void 0 ? _b : sourceUrl,
            sourceUrl,
            title: parsed.title,
            description: "",
            dateText: rawTitle,
            locationText: "Esbjerg City",
            addressText: "",
            category: "Byliv",
            imageUrl: (_c = card.find("img").first().attr("data-src")) !== null && _c !== void 0 ? _c : "",
            startDate: parsed.startDate,
            endDate: parsed.endDate,
        };
    })
        .get()
        .filter((event) => Boolean(event.sourceId && event.sourceUrl && event.title && isUpcoming(event.startDate)));
}
function crawlPage(url) {
    return __awaiter(this, void 0, void 0, function* () {
        let html = "";
        let failureMessage = "Esbjerg Citys eventside kunne ikke crawles.";
        const crawler = new crawlee_1.HttpCrawler({
            maxConcurrency: 1,
            maxRequestRetries: 0,
            maxRequestsPerCrawl: 1,
            requestHandlerTimeoutSecs: 20,
            useSessionPool: false,
            requestHandler(_a) {
                return __awaiter(this, arguments, void 0, function* ({ body }) {
                    html = body.toString();
                });
            },
            failedRequestHandler(_context, error) {
                failureMessage = error instanceof Error ? error.message : failureMessage;
            },
        }, new crawlee_1.Configuration({ persistStorage: false }));
        yield crawler.run([url]);
        if (!html) {
            throw new EsbjergCityEventCrawlerError(failureMessage);
        }
        return html;
    });
}
function addEventDescriptions(events) {
    return __awaiter(this, void 0, void 0, function* () {
        const descriptions = new Map();
        const crawler = new crawlee_1.HttpCrawler({
            maxConcurrency: 2,
            maxRequestRetries: 0,
            maxRequestsPerCrawl: events.length,
            requestHandlerTimeoutSecs: 20,
            useSessionPool: false,
            requestHandler(_a) {
                return __awaiter(this, arguments, void 0, function* ({ request, body }) {
                    const sourceId = request.userData.sourceId;
                    if (typeof sourceId !== "string")
                        return;
                    const $ = (0, cheerio_1.load)(body.toString());
                    descriptions.set(sourceId, normalizeText($(".project-content .wpb_text_column p").first().text()));
                });
            },
            // A protected or unavailable detail page must not block other events.
            failedRequestHandler() { },
        }, new crawlee_1.Configuration({ persistStorage: false }));
        yield crawler.run(events.map((event) => ({ url: event.sourceUrl, userData: { sourceId: event.sourceId } })));
        return events.map((event) => { var _a; return (Object.assign(Object.assign({}, event), { description: (_a = descriptions.get(event.sourceId)) !== null && _a !== void 0 ? _a : "" })); });
    });
}
function crawlEsbjergCityEvents() {
    return __awaiter(this, arguments, void 0, function* (limit = MAX_EVENTS_PER_CRAWL) {
        const requestedLimit = Math.min(Math.max(limit, 1), MAX_EVENTS_PER_CRAWL);
        const events = parseEsbjergCityEvents(yield crawlPage(exports.ESBJERG_CITY_EVENT_CALENDAR_URL))
            .slice(0, requestedLimit);
        return {
            source: exports.ESBJERG_CITY_EVENT_SOURCE,
            sourceUrl: exports.ESBJERG_CITY_EVENT_CALENDAR_URL,
            crawledAt: new Date().toISOString(),
            events: yield addEventDescriptions(events),
        };
    });
}
function importEsbjergCityEventCandidates(limit) {
    return __awaiter(this, void 0, void 0, function* () {
        const crawl = yield crawlEsbjergCityEvents(limit);
        const persistence = yield (0, crawledEventCandidate_service_1.saveCrawledEventCandidates)(crawl.source, crawl.events, crawl.crawledAt);
        return Object.assign(Object.assign({}, crawl), { persistence });
    });
}
//# sourceMappingURL=esbjergCityEventCrawler.service.js.map