import { importOplevEsbjergEventCandidates } from "./crawledEventCandidate.service";
import { importEsbjergLibraryEventCandidates } from "./esbjergLibraryEventCrawler.service";
import { importEsbjergCityEventCandidates } from "./esbjergCityEventCrawler.service";
import { OPLEV_ESBJERG_EVENT_SOURCE } from "./oplevEsbjergEventCrawler.service";

export type CrawlerEventSource = {
  id: string;
  label: string;
  sourceUrl: string;
  candidateSource: string;
  status: "active" | "planned";
  supportsScheduledImport: boolean;
  importCandidates?: (limit?: number) => ReturnType<typeof importOplevEsbjergEventCandidates>;
};

export const OPLEV_ESBJERG_SOURCE_ID = "oplev-esbjerg";

// Every new crawler is registered here. The rest of the import, moderation
// and status flow uses this shared source definition rather than source-
// specific routes or UI logic.
const crawlerEventSources: CrawlerEventSource[] = [
  {
    id: OPLEV_ESBJERG_SOURCE_ID,
    label: "Oplev Esbjerg",
    sourceUrl: "https://oplev.esbjerg.dk/eventkalender",
    candidateSource: OPLEV_ESBJERG_EVENT_SOURCE,
    status: "active",
    supportsScheduledImport: true,
    importCandidates: importOplevEsbjergEventCandidates,
  },
  {
    id: "esbjerg-bibliotek",
    label: "Esbjerg Kommunes Biblioteker",
    sourceUrl: "https://www.esbjergbibliotek.dk/arrangementer",
    candidateSource: "Esbjerg Kommunes Biblioteker arrangementer",
    status: "active",
    supportsScheduledImport: true,
    importCandidates: importEsbjergLibraryEventCandidates,
  },
  {
    id: "esbjerg-city",
    label: "Esbjerg City",
    sourceUrl: "https://www.esbjergcity.dk/det-sker/",
    candidateSource: "Esbjerg City eventkalender",
    status: "active",
    supportsScheduledImport: true,
    importCandidates: importEsbjergCityEventCandidates,
  },
  {
    id: "business-esbjerg",
    label: "Business Esbjerg",
    sourceUrl: "https://www.businessesbjerg.com/arrangementer",
    candidateSource: "Business Esbjerg arrangementer",
    status: "planned",
    supportsScheduledImport: false,
  },
];

export function getCrawlerEventSource(sourceId: string): CrawlerEventSource | null {
  return crawlerEventSources.find((source) => source.id === sourceId) ?? null;
}

export function getCrawlerEventSources() {
  return crawlerEventSources.map(({ id, label, sourceUrl, status, supportsScheduledImport }) => ({
    id,
    label,
    sourceUrl,
    status,
    supportsScheduledImport,
  }));
}

export function getScheduledCrawlerEventSources(): CrawlerEventSource[] {
  return crawlerEventSources.filter(
    (source) => source.status === "active" && source.supportsScheduledImport && source.importCandidates,
  );
}
