import { Request, Response } from "express";
import { crawlPage, WebCrawlerError } from "../services/webCrawler.service";
import {
  OplevEsbjergEventCrawlerError,
} from "../services/oplevEsbjergEventCrawler.service";
import {
  approveCrawledEventCandidate,
  CrawledEventCandidateReviewError,
  getOplevEsbjergEventCandidates as findOplevEsbjergEventCandidates,
  rejectCrawledEventCandidate,
} from "../services/crawledEventCandidate.service";
import {
  getLatestOplevEsbjergEventImportRun,
  runOplevEsbjergEventImport,
} from "../services/crawlerImportRun.service";
import {
  getNextOplevEsbjergImportTime,
  getOplevEsbjergDailyImportHour,
  isOplevEsbjergDailyImportEnabled,
} from "../services/oplevEsbjergImportScheduler.service";
import { getRouteParam, isValidationError } from "./controllerUtils";
import { CrawledEventCandidateStatus } from "../interfaces/crawledEventCandidate";

function parseLimit(value: unknown): number | undefined {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const limit = Number(value);
  return Number.isInteger(limit) ? limit : undefined;
}

function parseCandidateStatus(value: unknown): CrawledEventCandidateStatus {
  return value === "approved" || value === "rejected" ? value : "new";
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
    res.status(200).json(await runOplevEsbjergEventImport("manual", parseLimit(req.query.limit)));
  } catch (error) {
    if (error instanceof OplevEsbjergEventCrawlerError) {
      res.status(502).json({ message: error.message });
      return;
    }

    console.error("Oplev Esbjerg event crawl failed:", error);
    res.status(502).json({ message: "Eventkalenderen kunne ikke crawles." });
  }
}

export async function getOplevEsbjergEventImportStatus(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const nextImport = getNextOplevEsbjergImportTime();
    res.status(200).json({
      dailyImportEnabled: isOplevEsbjergDailyImportEnabled(),
      dailyImportHour: getOplevEsbjergDailyImportHour(),
      nextImportAt: nextImport?.toISOString() ?? null,
      lastRun: await getLatestOplevEsbjergEventImportRun(),
    });
  } catch (error) {
    console.error("Could not fetch Oplev Esbjerg import status:", error);
    res.status(500).json({ message: "Importstatus kunne ikke hentes." });
  }
}

export async function getOplevEsbjergEventCandidates(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    res
      .status(200)
      .json(await findOplevEsbjergEventCandidates(parseCandidateStatus(req.query.status)));
  } catch (error) {
    console.error("Could not fetch crawled event candidates:", error);
    res.status(500).json({ message: "Eventkandidaterne kunne ikke hentes." });
  }
}

export async function approveOplevEsbjergEventCandidate(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const event = await approveCrawledEventCandidate(
      getRouteParam(req.params.id),
      req.body as Record<string, unknown>,
      req.user?.userID,
    );

    if (!event) {
      res.status(404).json({ message: "Eventkandidaten blev ikke fundet." });
      return;
    }

    res.status(201).json(event);
  } catch (error) {
    if (isValidationError(error)) {
      res.status(400).json({ message: error.message });
      return;
    }

    if (error instanceof CrawledEventCandidateReviewError) {
      res.status(409).json({ message: error.message });
      return;
    }

    console.error("Could not approve crawled event candidate:", error);
    res.status(500).json({ message: "Eventkandidaten kunne ikke godkendes." });
  }
}

export async function rejectOplevEsbjergEventCandidate(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const reason = typeof req.body?.reason === "string" ? req.body.reason : "";
    const candidate = await rejectCrawledEventCandidate(
      getRouteParam(req.params.id),
      req.user?.userID,
      reason,
    );

    if (!candidate) {
      res.status(404).json({ message: "Eventkandidaten blev ikke fundet." });
      return;
    }

    res.status(200).json(candidate);
  } catch (error) {
    if (error instanceof CrawledEventCandidateReviewError) {
      res.status(409).json({ message: error.message });
      return;
    }

    console.error("Could not reject crawled event candidate:", error);
    res.status(500).json({ message: "Eventkandidaten kunne ikke afvises." });
  }
}
