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
exports.EsbjergLibraryEventCrawlerError = exports.ESBJERG_LIBRARY_EVENT_CALENDAR_URL = exports.ESBJERG_LIBRARY_EVENT_SOURCE = void 0;
exports.parseEsbjergLibraryEvents = parseEsbjergLibraryEvents;
exports.crawlEsbjergLibraryEvents = crawlEsbjergLibraryEvents;
exports.importEsbjergLibraryEventCandidates = importEsbjergLibraryEventCandidates;
const cheerio_1 = require("cheerio");
const crawlee_1 = require("crawlee");
const crawledEventCandidate_service_1 = require("./crawledEventCandidate.service");
exports.ESBJERG_LIBRARY_EVENT_SOURCE = "Esbjerg Kommunes Biblioteker arrangementer";
exports.ESBJERG_LIBRARY_EVENT_CALENDAR_URL = "https://www.esbjergbibliotek.dk/arrangementer";
const EVENTS_PER_PAGE = 25;
const MAX_EVENTS_PER_CRAWL = 100;
class EsbjergLibraryEventCrawlerError extends Error {
    constructor(message) {
        super(message);
        this.name = "EsbjergLibraryEventCrawlerError";
    }
}
exports.EsbjergLibraryEventCrawlerError = EsbjergLibraryEventCrawlerError;
function normalizeText(value) {
    return value.replace(/\s+/g, " ").trim();
}
function absoluteUrl(value) {
    return value ? new URL(value, exports.ESBJERG_LIBRARY_EVENT_CALENDAR_URL).toString() : "";
}
function parseDateRange(value) {
    const moments = [...value.matchAll(/(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/g)];
    const format = (match) => match ? `${match[1]}T${match[2]}:${match[3]}` : "";
    return { startDate: format(moments[0]), endDate: format(moments[1]) };
}
function getEventCount(html) {
    const $ = (0, cheerio_1.load)(html);
    const resultText = normalizeText($(".result-pager__title").text());
    const match = resultText.match(/ud af (\d+) resultater/i);
    return match ? Number(match[1]) : 0;
}
function getPageUrl(page) {
    return page === 0 ? exports.ESBJERG_LIBRARY_EVENT_CALENDAR_URL : `${exports.ESBJERG_LIBRARY_EVENT_CALENDAR_URL}?page=${page}`;
}
function crawlEventPages(urls) {
    return __awaiter(this, void 0, void 0, function* () {
        const htmlPages = [];
        let failureMessage = "Bibliotekets arrangementsside kunne ikke crawles.";
        const crawler = new crawlee_1.HttpCrawler({
            maxConcurrency: 1,
            maxRequestRetries: 0,
            maxRequestsPerCrawl: urls.length,
            requestHandlerTimeoutSecs: 20,
            useSessionPool: false,
            requestHandler(_a) {
                return __awaiter(this, arguments, void 0, function* ({ body }) {
                    htmlPages.push(body.toString());
                });
            },
            failedRequestHandler(_context, error) {
                failureMessage = error instanceof Error ? error.message : failureMessage;
            },
        }, new crawlee_1.Configuration({ persistStorage: false }));
        yield crawler.run(urls);
        if (!htmlPages.length) {
            throw new EsbjergLibraryEventCrawlerError(failureMessage);
        }
        return htmlPages;
    });
}
function parseEsbjergLibraryEvents(html) {
    const $ = (0, cheerio_1.load)(html);
    // The source currently emits duplicate class attributes on the link. Its
    // list item and event URL pattern are stable across those markup variants.
    return $("li.content-list__item > a[href*='/arrangementer/']")
        .map((_index, element) => {
        var _a;
        const card = $(element);
        const sourceUrl = absoluteUrl(card.attr("href"));
        const dateContainer = card.find(".content-list-item__date > time").first();
        const locationText = normalizeText(card.find(".content-list-item__content-bottom-container__item").first().text());
        const dateText = normalizeText(dateContainer.text());
        return Object.assign({ sourceId: sourceUrl, sourceUrl, title: normalizeText(card.find(".content-list-item__title").text()), description: normalizeText(card.find(".content-list-item__description").text()), dateText: [dateText, normalizeText(card.find(".content-list-item__time").text())]
                .filter(Boolean)
                .join(", "), locationText, addressText: locationText, category: normalizeText(card.find(".content-list-item__tag").first().text()), imageUrl: absoluteUrl(card.find("img").first().attr("src")) }, parseDateRange((_a = dateContainer.attr("datetime")) !== null && _a !== void 0 ? _a : ""));
    })
        .get()
        .filter((event) => Boolean(event.sourceId && event.title));
}
function crawlEsbjergLibraryEvents() {
    return __awaiter(this, arguments, void 0, function* (limit = MAX_EVENTS_PER_CRAWL) {
        const requestedLimit = Math.min(Math.max(limit, 1), MAX_EVENTS_PER_CRAWL);
        const firstPage = (yield crawlEventPages([getPageUrl(0)]))[0];
        const eventCount = getEventCount(firstPage);
        const pageCount = Math.max(1, Math.ceil(Math.min(eventCount || EVENTS_PER_PAGE, requestedLimit) / EVENTS_PER_PAGE));
        // The site's "Vis flere" pages are cumulative: page 2 includes the events
        // from pages 0 and 1. Fetching the final needed page avoids duplicates while
        // still collecting the complete upcoming result set.
        const resultPage = pageCount > 1
            ? (yield crawlEventPages([getPageUrl(pageCount - 1)]))[0]
            : firstPage;
        return {
            source: exports.ESBJERG_LIBRARY_EVENT_SOURCE,
            sourceUrl: exports.ESBJERG_LIBRARY_EVENT_CALENDAR_URL,
            crawledAt: new Date().toISOString(),
            events: parseEsbjergLibraryEvents(resultPage).slice(0, requestedLimit),
        };
    });
}
function importEsbjergLibraryEventCandidates(limit) {
    return __awaiter(this, void 0, void 0, function* () {
        const crawl = yield crawlEsbjergLibraryEvents(limit);
        const persistence = yield (0, crawledEventCandidate_service_1.saveCrawledEventCandidates)(crawl.source, crawl.events, crawl.crawledAt);
        return Object.assign(Object.assign({}, crawl), { persistence });
    });
}
//# sourceMappingURL=esbjergLibraryEventCrawler.service.js.map