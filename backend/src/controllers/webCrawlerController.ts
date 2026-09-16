import { Request, Response } from "express";
import { crawlPage, WebCrawlerError } from "../services/webCrawler.service";
import {
  crawlOplevEsbjergEvents,
  OplevEsbjergEventCrawlerError,
} from "../services/oplevEsbjergEventCrawler.service";

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
    res.status(200).json(await crawlOplevEsbjergEvents(parseLimit(req.query.limit)));
  } catch (error) {
    if (error instanceof OplevEsbjergEventCrawlerError) {
      res.status(502).json({ message: error.message });
      return;
    }

    console.error("Oplev Esbjerg event crawl failed:", error);
    res.status(502).json({ message: "Eventkalenderen kunne ikke crawles." });
  }
}
