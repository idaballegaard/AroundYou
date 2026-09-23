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
exports.WebCrawlerError = void 0;
exports.validateCrawlUrl = validateCrawlUrl;
exports.crawlPage = crawlPage;
const crawlee_1 = require("crawlee");
const MAX_TEXT_LENGTH = 20000;
class WebCrawlerError extends Error {
    constructor(message) {
        super(message);
        this.name = "WebCrawlerError";
    }
}
exports.WebCrawlerError = WebCrawlerError;
function normalizeText(value) {
    return value.replace(/\s+/g, " ").trim();
}
function isPrivateIpAddress(hostname) {
    return (/^127\./.test(hostname) ||
        /^10\./.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
        /^192\.168\./.test(hostname) ||
        /^169\.254\./.test(hostname) ||
        /^0\.0\.0\.0$/.test(hostname) ||
        /^::1$/.test(hostname) ||
        /^fc/i.test(hostname) ||
        /^fd/i.test(hostname) ||
        /^fe80:/i.test(hostname));
}
function validateCrawlUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
        throw new WebCrawlerError("Indtast en gyldig URL.");
    }
    let url;
    try {
        url = new URL(value.trim());
    }
    catch (_a) {
        throw new WebCrawlerError("Indtast en gyldig URL.");
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new WebCrawlerError("Kun http- og https-URL'er kan crawles.");
    }
    const hostname = url.hostname.toLowerCase();
    // The endpoint accepts externally reachable public sites only. This prevents
    // the crawler from being used to read local services or cloud metadata URLs.
    if (hostname === "localhost" || hostname.endsWith(".localhost") || isPrivateIpAddress(hostname)) {
        throw new WebCrawlerError("Lokale og private adresser kan ikke crawles.");
    }
    return url.toString();
}
function crawlPage(inputUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = validateCrawlUrl(inputUrl);
        let page = null;
        let failureMessage = "Siden kunne ikke crawles.";
        const crawler = new crawlee_1.CheerioCrawler({
            maxConcurrency: 1,
            maxRequestRetries: 0,
            maxRequestsPerCrawl: 1,
            requestHandlerTimeoutSecs: 20,
            useSessionPool: false,
            requestHandler(_a) {
                return __awaiter(this, arguments, void 0, function* ({ $, request }) {
                    var _b, _c, _d, _e;
                    $("script, style, noscript, svg, nav, footer, header, aside").remove();
                    const contentRoot = $("main, article, [role='main']").first();
                    const content = normalizeText((contentRoot.length ? contentRoot : $("body")).text()).slice(0, MAX_TEXT_LENGTH);
                    page = {
                        url: (_b = request.loadedUrl) !== null && _b !== void 0 ? _b : request.url,
                        title: normalizeText($("title").first().text()),
                        description: normalizeText((_c = $("meta[name='description']").attr("content")) !== null && _c !== void 0 ? _c : ""),
                        canonicalUrl: (_e = (_d = $("link[rel='canonical']").attr("href")) !== null && _d !== void 0 ? _d : request.loadedUrl) !== null && _e !== void 0 ? _e : request.url,
                        content,
                    };
                });
            },
            failedRequestHandler({ error }) {
                failureMessage = error instanceof Error ? error.message : failureMessage;
            },
        }, new crawlee_1.Configuration({ persistStorage: false }));
        yield crawler.run([url]);
        if (!page) {
            throw new WebCrawlerError(failureMessage);
        }
        return page;
    });
}
//# sourceMappingURL=webCrawler.service.js.map