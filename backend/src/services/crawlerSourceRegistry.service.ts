import { importOplevEsbjergEventCandidates } from "./crawledEventCandidate.service";
import { OPLEV_ESBJERG_EVENT_SOURCE } from "./oplevEsbjergEventCrawler.service";

export type CrawlerEventSource = {
  id: string;
  label: string;
  candidateSource: string;
  supportsScheduledImport: boolean;
  importCandidates: (limit?: number) => ReturnType<typeof importOplevEsbjergEventCandidates>;
};

export const OPLEV_ESBJERG_SOURCE_ID = "oplev-esbjerg";

// Every new crawler is registered here. The rest of the import, moderation
// and status flow uses this shared source definition rather than source-
// specific routes or UI logic.
const crawlerEventSources: CrawlerEventSource[] = [
  {
    id: OPLEV_ESBJERG_SOURCE_ID,
    label: "Oplev Esbjerg",
    candidateSource: OPLEV_ESBJERG_EVENT_SOURCE,
    supportsScheduledImport: true,
    importCandidates: importOplevEsbjergEventCandidates,
  },
];

export function getCrawlerEventSource(sourceId: string): CrawlerEventSource | null {
  return crawlerEventSources.find((source) => source.id === sourceId) ?? null;
}

export function getCrawlerEventSources() {
  return crawlerEventSources.map(({ id, label, supportsScheduledImport }) => ({
    id,
    label,
    supportsScheduledImport,
  }));
}
