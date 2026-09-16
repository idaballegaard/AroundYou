import { Request, Response } from "express";
import { crawlPage, WebCrawlerError } from "../services/webCrawler.service";
import {
  crawlOplevEsbjergEvents,
  OplevEsbjergEventCrawlerError,
} from "../services/oplevEsbjergEventCrawler.service";
import {
  getNewOplevEsbjergEventCandidates,
  saveCrawledEventCandidates,
} from "../services/crawledEventCandidate.service";

function parseLimit(value: unknown): number | undefined {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const limit = Number(value);
  return Number.isInteger(limit) ? limit : undefined;
}

export async function crawlWebsite(req: Request, res: Response): Promise<void> {
  try {
    const page = await crawlPage(req.body?.url);
    res.status(200).json(page);
  } catch (error) {
    if (error instanceof WebCrawlerError) {
      res.status(400).json({ message: error.message });
      return;
    }

    console.error("Web crawl failed:", error);
    res.status(502).json({ message: "Siden kunne ikke crawles." });
  }
}

export async function crawlOplevEsbjergEventCalendar(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const crawl = await crawlOplevEsbjergEvents(parseLimit(req.query.limit));
    const persistence = await saveCrawledEventCandidates(
      crawl.source,
      crawl.events,
      crawl.crawledAt,
    );

    res.status(200).json({ ...crawl, persistence });
  } catch (error) {
    if (error instanceof OplevEsbjergEventCrawlerError) {
      res.status(502).json({ message: error.message });
      return;
    }

    console.error("Oplev Esbjerg event crawl failed:", error);
    res.status(502).json({ message: "Eventkalenderen kunne ikke crawles." });
  }
}

export async function getOplevEsbjergEventCandidates(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    res.status(200).json(await getNewOplevEsbjergEventCandidates());
  } catch (error) {
    console.error("Could not fetch crawled event candidates:", error);
    res.status(500).json({ message: "Eventkandidaterne kunne ikke hentes." });
  }
}
