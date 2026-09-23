import { CrawlerImportTrigger } from "../interfaces/crawlerImportRun";
import { CrawlerImportRunModel } from "../models/crawlerImportRunModel";
import { importOplevEsbjergEventCandidates } from "./crawledEventCandidate.service";
import { OPLEV_ESBJERG_EVENT_SOURCE } from "./oplevEsbjergEventCrawler.service";

export async function runOplevEsbjergEventImport(
  trigger: CrawlerImportTrigger,
  limit?: number,
) {
  const run = await CrawlerImportRunModel.create({
    source: OPLEV_ESBJERG_EVENT_SOURCE,
    trigger,
    status: "running",
    startedAt: new Date(),
  });

  try {
    const result = await importOplevEsbjergEventCandidates(limit);
    run.status = "succeeded";
    run.finishedAt = new Date();
    run.eventCount = result.events.length;
    run.inserted = result.persistence.inserted;
    run.updated = result.persistence.updated;
    run.errorMessage = undefined;
    await run.save();

    return result;
  } catch (error) {
    run.status = "failed";
    run.finishedAt = new Date();
    run.errorMessage = error instanceof Error ? error.message : "Ukendt importfejl.";
    await run.save();
    throw error;
  }
}

export async function getLatestOplevEsbjergEventImportRun() {
  return CrawlerImportRunModel.findOne({ source: OPLEV_ESBJERG_EVENT_SOURCE })
    .sort({ startedAt: -1 })
    .lean();
}
