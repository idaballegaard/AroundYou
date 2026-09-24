"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPLEV_ESBJERG_SOURCE_ID = void 0;
exports.getCrawlerEventSource = getCrawlerEventSource;
exports.getCrawlerEventSources = getCrawlerEventSources;
exports.getScheduledCrawlerEventSources = getScheduledCrawlerEventSources;
const crawledEventCandidate_service_1 = require("./crawledEventCandidate.service");
const esbjergLibraryEventCrawler_service_1 = require("./esbjergLibraryEventCrawler.service");
const esbjergCityEventCrawler_service_1 = require("./esbjergCityEventCrawler.service");
const businessEsbjergEventCrawler_service_1 = require("./businessEsbjergEventCrawler.service");
const oplevEsbjergEventCrawler_service_1 = require("./oplevEsbjergEventCrawler.service");
exports.OPLEV_ESBJERG_SOURCE_ID = "oplev-esbjerg";
// Every new crawler is registered here. The rest of the import, moderation
// and status flow uses this shared source definition rather than source-
// specific routes or UI logic.
const crawlerEventSources = [
    {
        id: exports.OPLEV_ESBJERG_SOURCE_ID,
        label: "Oplev Esbjerg",
        sourceUrl: "https://oplev.esbjerg.dk/eventkalender",
        candidateSource: oplevEsbjergEventCrawler_service_1.OPLEV_ESBJERG_EVENT_SOURCE,
        status: "active",
        supportsScheduledImport: true,
        importCandidates: crawledEventCandidate_service_1.importOplevEsbjergEventCandidates,
    },
    {
        id: "esbjerg-bibliotek",
        label: "Esbjerg Kommunes Biblioteker",
        sourceUrl: "https://www.esbjergbibliotek.dk/arrangementer",
        candidateSource: "Esbjerg Kommunes Biblioteker arrangementer",
        status: "active",
        supportsScheduledImport: true,
        importCandidates: esbjergLibraryEventCrawler_service_1.importEsbjergLibraryEventCandidates,
    },
    {
        id: "esbjerg-city",
        label: "Esbjerg City",
        sourceUrl: "https://www.esbjergcity.dk/det-sker/",
        candidateSource: "Esbjerg City eventkalender",
        status: "active",
        supportsScheduledImport: true,
        importCandidates: esbjergCityEventCrawler_service_1.importEsbjergCityEventCandidates,
    },
    {
        id: "business-esbjerg",
        label: "Business Esbjerg",
        sourceUrl: "https://www.businessesbjerg.com/arrangementer",
        candidateSource: "Business Esbjerg arrangementer",
        status: "active",
        supportsScheduledImport: true,
        importCandidates: businessEsbjergEventCrawler_service_1.importBusinessEsbjergEventCandidates,
    },
];
function getCrawlerEventSource(sourceId) {
    var _a;
    return (_a = crawlerEventSources.find((source) => source.id === sourceId)) !== null && _a !== void 0 ? _a : null;
}
function getCrawlerEventSources() {
    return crawlerEventSources.map(({ id, label, sourceUrl, status, supportsScheduledImport }) => ({
        id,
        label,
        sourceUrl,
        status,
        supportsScheduledImport,
    }));
}
function getScheduledCrawlerEventSources() {
    return crawlerEventSources.filter((source) => source.status === "active" && source.supportsScheduledImport && source.importCandidates);
}
//# sourceMappingURL=crawlerSourceRegistry.service.js.map