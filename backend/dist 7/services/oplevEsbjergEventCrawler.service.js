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
exports.OplevEsbjergEventCrawlerError = exports.OPLEV_ESBJERG_EVENT_SOURCE = void 0;
exports.parseKultunautDateRange = parseKultunautDateRange;
exports.extractKultunautHtml = extractKultunautHtml;
exports.parseOplevEsbjergEvents = parseOplevEsbjergEvents;
exports.crawlOplevEsbjergEvents = crawlOplevEsbjergEvents;
const cheerio_1 = require("cheerio");
const crawlee_1 = require("crawlee");
const OPLEV_ESBJERG_EVENT_CALENDAR_URL = "https://oplev.esbjerg.dk/eventkalender";
exports.OPLEV_ESBJERG_EVENT_SOURCE = "Oplev Esbjerg eventkalender";
const KULTUNAUT_EVENT_FEED_URL = "https://www.kultunaut.dk/perl/nautjs/type-esbjerglive4?mm=1&tmplid=arrlist&callback=aroundYouCallback";
const KULTUNAUT_EVENT_DETAIL_URL = "https://www.kultunaut.dk/perl/arrmore/type-esbjerglive4?ArrNr=";
const EVENTS_PER_PAGE = 12;
const MAX_EVENTS_PER_CRAWL = 48;
class OplevEsbjergEventCrawlerError extends Error {
    constructor(message) {
        super(message);
        this.name = "OplevEsbjergEventCrawlerError";
    }
}
exports.OplevEsbjergEventCrawlerError = OplevEsbjergEventCrawlerError;
function normalizeText(value) {
    return value.replace(/\s+/g, " ").trim();
}
function getAbsoluteUrl(value) {
    if (!value) {
        return "";
    }
    return new URL(value, OPLEV_ESBJERG_EVENT_CALENDAR_URL).toString();
}
function getKultunautEventFeedUrl(startNumber) {
    if (startNumber <= 1) {
        return KULTUNAUT_EVENT_FEED_URL;
    }
    return `${KULTUNAUT_EVENT_FEED_URL}&startnr=${startNumber}`;
}
const DANISH_MONTHS = {
    januar: "01",
    februar: "02",
    marts: "03",
    april: "04",
    maj: "05",
    juni: "06",
    juli: "07",
    august: "08",
    september: "09",
    oktober: "10",
    november: "11",
    december: "12",
};
function formatLocalDateTime(year, month, day, hour, minute) {
    return `${year}-${month}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${(minute !== null && minute !== void 0 ? minute : "00").padStart(2, "0")}`;
}
// Kultunaut commonly uses strings such as "Ons. d. 16. september 2026, kl.
// 10-15.". Preserve the local time (rather than converting to UTC) because it
// is immediately shown in a datetime-local input for admin review.
function parseKultunautDateRange(dateText) {
    var _a, _b;
    const dateMatch = dateText.match(/(?:d\.\s*)?(\d{1,2})\.\s*(januar|februar|marts|april|maj|juni|juli|august|september|oktober|november|december)\s+(\d{4})/i);
    const timeMatch = dateText.match(/kl\.\s*(\d{1,2})(?:[.:](\d{2}))?\s*(?:-|–|til)\s*(\d{1,2})(?:[.:](\d{2}))?/i);
    const startTimeMatch = dateText.match(/kl\.\s*(\d{1,2})(?:[.:](\d{2}))?/i);
    if (!dateMatch || !startTimeMatch) {
        return { startDate: "", endDate: "" };
    }
    const [, day, monthName, year] = dateMatch;
    const month = DANISH_MONTHS[monthName.toLowerCase()];
    if (!month) {
        return { startDate: "", endDate: "" };
    }
    const startHour = (_a = timeMatch === null || timeMatch === void 0 ? void 0 : timeMatch[1]) !== null && _a !== void 0 ? _a : startTimeMatch[1];
    const startMinute = (_b = timeMatch === null || timeMatch === void 0 ? void 0 : timeMatch[2]) !== null && _b !== void 0 ? _b : startTimeMatch[2];
    return {
        startDate: formatLocalDateTime(year, month, day, startHour, startMinute),
        // Some Kultunaut cards state only when the event starts. Do not invent an
        // end time; the admin form explicitly asks for it in that case.
        endDate: timeMatch
            ? formatLocalDateTime(year, month, day, timeMatch[3], timeMatch[4])
            : "",
    };
}
function extractKultunautHtml(responseBody) {
    const payloadStart = responseBody.indexOf("({");
    const payloadEnd = responseBody.lastIndexOf(");}");
    if (payloadStart < 0 || payloadEnd < 0) {
        throw new OplevEsbjergEventCrawlerError("Eventfeedet havde et ukendt format.");
    }
    try {
        const payload = JSON.parse(responseBody.slice(payloadStart + 1, payloadEnd));
        if (typeof payload.html !== "string") {
            throw new OplevEsbjergEventCrawlerError("Eventfeedet indeholdt ingen eventliste.");
        }
        return payload.html;
    }
    catch (error) {
        if (error instanceof OplevEsbjergEventCrawlerError) {
            throw error;
        }
        throw new OplevEsbjergEventCrawlerError("Eventfeedet kunne ikke læses.");
    }
}
function parseOplevEsbjergEvents(html) {
    const $ = (0, cheerio_1.load)(html);
    return $(".card-events [data-arrnr]")
        .map((_index, element) => {
        var _a, _b, _c, _d;
        const card = $(element);
        const detailUrl = getAbsoluteUrl(card.find("a.card__event").first().attr("href"));
        const details = card
            .find(".card__event__content > ul > li span")
            .map((_detailIndex, detail) => normalizeText($(detail).text()))
            .get();
        const dateText = (_a = details[0]) !== null && _a !== void 0 ? _a : "";
        const dateRange = parseKultunautDateRange(dateText);
        return Object.assign({ sourceId: (_b = card.attr("data-arrnr")) !== null && _b !== void 0 ? _b : "", sourceUrl: detailUrl, title: normalizeText(card.find(".card__event__content h2").first().text()), description: normalizeText(card.find(".card__event__content__text > p").first().text()), dateText, locationText: (_c = details[1]) !== null && _c !== void 0 ? _c : "", addressText: "", category: normalizeText(card.find(".tag").first().text()), imageUrl: getAbsoluteUrl((_d = card.find(".card__event__image-content img").first().attr("src")) !== null && _d !== void 0 ? _d : card.find(".card__event__image-content img").first().attr("data-src")) }, dateRange);
    })
        .get()
        .filter((event) => Boolean(event.sourceId && event.title && event.sourceUrl));
}
function parseKultunautEventAddress(html) {
    const $ = (0, cheerio_1.load)(html);
    // The detail card's location row contains both its venue name and the
    // visitor-friendly street address, e.g. "Blue Water Dokken, Gl. Vardevej
    // 82, Esbjerg". The listing feed only provides the venue name.
    return normalizeText($(".hero__event__content__info li")
        .filter((_index, element) => $(element).find(".svg-location").length > 0)
        .find("span")
        .first()
        .text());
}
function addEventDetailAddresses(events) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!events.length) {
            return events;
        }
        const addresses = new Map();
        const crawler = new crawlee_1.HttpCrawler({
            maxConcurrency: 2,
            maxRequestRetries: 0,
            maxRequestsPerCrawl: events.length,
            requestHandlerTimeoutSecs: 20,
            useSessionPool: false,
            requestHandler(_a) {
                return __awaiter(this, arguments, void 0, function* ({ request, body }) {
                    const sourceId = request.userData.sourceId;
                    if (typeof sourceId === "string") {
                        addresses.set(sourceId, parseKultunautEventAddress(body.toString()));
                    }
                });
            },
            // A single unavailable detail page must not prevent the rest of the
            // import. Such a candidate simply remains without an address.
            failedRequestHandler() { },
        }, new crawlee_1.Configuration({ persistStorage: false }));
        yield crawler.run(events.map((event) => ({
            url: `${KULTUNAUT_EVENT_DETAIL_URL}${encodeURIComponent(event.sourceId)}`,
            userData: { sourceId: event.sourceId },
        })));
        return events.map((event) => {
            var _a;
            return (Object.assign(Object.assign({}, event), { addressText: (_a = addresses.get(event.sourceId)) !== null && _a !== void 0 ? _a : "" }));
        });
    });
}
function crawlOplevEsbjergEvents() {
    return __awaiter(this, arguments, void 0, function* (limit = MAX_EVENTS_PER_CRAWL) {
        const requestedLimit = Math.min(Math.max(limit, 1), MAX_EVENTS_PER_CRAWL);
        const eventHtmlPages = [];
        let failureMessage = "Oplev Esbjergs eventkalender kunne ikke crawles.";
        const pageCount = Math.ceil(requestedLimit / EVENTS_PER_PAGE);
        const crawler = new crawlee_1.HttpCrawler({
            maxConcurrency: 1,
            maxRequestRetries: 0,
            maxRequestsPerCrawl: pageCount,
            requestHandlerTimeoutSecs: 20,
            useSessionPool: false,
            additionalMimeTypes: ["application/javascript"],
            requestHandler(_a) {
                return __awaiter(this, arguments, void 0, function* ({ body }) {
                    eventHtmlPages.push(extractKultunautHtml(body.toString()));
                });
            },
            failedRequestHandler(_context, error) {
                failureMessage = error instanceof Error ? error.message : failureMessage;
            },
        }, new crawlee_1.Configuration({ persistStorage: false }));
        yield crawler.run(Array.from({ length: pageCount }, (_value, index) => getKultunautEventFeedUrl(index * EVENTS_PER_PAGE + 1)));
        if (!eventHtmlPages.length) {
            throw new OplevEsbjergEventCrawlerError(failureMessage);
        }
        // The first page is today's events. Subsequent pages continue chronologically
        // into coming days, so one import gives admins a useful forward-looking queue.
        const events = eventHtmlPages
            .flatMap((html) => parseOplevEsbjergEvents(html))
            .slice(0, requestedLimit);
        return {
            source: exports.OPLEV_ESBJERG_EVENT_SOURCE,
            sourceUrl: OPLEV_ESBJERG_EVENT_CALENDAR_URL,
            crawledAt: new Date().toISOString(),
            events: yield addEventDetailAddresses(events),
        };
    });
}
//# sourceMappingURL=oplevEsbjergEventCrawler.service.js.map