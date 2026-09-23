import { CrawlerImportTrigger } from "../interfaces/crawlerImportRun";
import { CrawlerImportRunModel } from "../models/crawlerImportRunModel";
import {
  getCrawlerEventSource,
  OPLEV_ESBJERG_SOURCE_ID,
} from "./crawlerSourceRegistry.service";

export class CrawlerSourceNotFoundError extends Error {
  constructor() {
    super("Den valgte crawlerkilde findes ikke.");
    this.name = "CrawlerSourceNotFoundError";
  }
}

export class CrawlerSourceNotReadyError extends Error {
  constructor() {
    super("Denne crawlerkilde er registreret, men endnu ikke klar til import.");
    this.name = "CrawlerSourceNotReadyError";
  }
}

export async function runCrawlerEventImport(
  sourceId: string,
  trigger: CrawlerImportTrigger,
  limit?: number,
) {
  const source = getCrawlerEventSource(sourceId);

  if (!source) {
    throw new CrawlerSourceNotFoundError();
  }

  if (source.status !== "active" || !source.importCandidates) {
    throw new CrawlerSourceNotReadyError();
  }

  const run = await CrawlerImportRunModel.create({
    source: source.candidateSource,
    trigger,
    status: "running",
    startedAt: new Date(),
  });

  try {
    const result = await source.importCandidates(limit);
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

export async function runOplevEsbjergEventImport(
  trigger: CrawlerImportTrigger,
  limit?: number,
) {
  return runCrawlerEventImport(OPLEV_ESBJERG_SOURCE_ID, trigger, limit);
}

export async function getLatestOplevEsbjergEventImportRun() {
  return getLatestCrawlerEventImportRun(OPLEV_ESBJERG_SOURCE_ID);
}

export async function getLatestCrawlerEventImportRun(sourceId: string) {
  const source = getCrawlerEventSource(sourceId);

  if (!source) {
    throw new CrawlerSourceNotFoundError();
  }

  return CrawlerImportRunModel.findOne({ source: source.candidateSource })
    .sort({ startedAt: -1 })
    .lean();
}
