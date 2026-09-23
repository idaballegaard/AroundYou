import { CrawledEventCandidateStatus } from "../interfaces/crawledEventCandidate";
import { CrawledEventCandidateModel } from "../models/crawledEventCandidateModel";
import { createEventRecord } from "./event.service";
import {
  crawlOplevEsbjergEvents,
  OPLEV_ESBJERG_EVENT_SOURCE,
  OplevEsbjergEventCandidate,
} from "./oplevEsbjergEventCrawler.service";

export type CrawledEventCandidatePersistence = {
  inserted: number;
  updated: number;
};

export async function importOplevEsbjergEventCandidates(limit?: number) {
  const crawl = await crawlOplevEsbjergEvents(limit);
  const persistence = await saveCrawledEventCandidates(
    crawl.source,
    crawl.events,
    crawl.crawledAt,
  );

  return { ...crawl, persistence };
}

export async function getOplevEsbjergEventCandidates(
  status: CrawledEventCandidateStatus = "new",
) {
  return CrawledEventCandidateModel.find({
    source: OPLEV_ESBJERG_EVENT_SOURCE,
    status,
  })
    .sort({ crawledAt: -1, createdAt: -1 })
    .limit(50)
    .lean();
}

export async function approveCrawledEventCandidate(
  id: string,
  payload: Record<string, unknown>,
  reviewedBy?: string,
) {
  const candidate = await CrawledEventCandidateModel.findOne({
    _id: id,
    source: OPLEV_ESBJERG_EVENT_SOURCE,
  });

  if (!candidate) {
    return null;
  }

  if (candidate.status !== "new") {
    throw new CrawledEventCandidateReviewError("Denne kandidat er allerede behandlet.");
  }

  // The canonical event schema requires an end date. When the source has no
  // end time, use the verified start moment internally instead of forcing an
  // admin to invent one. Search already treats a missing/identical end as a
  // single-point event.
  const endDate = typeof payload.endDate === "string" ? payload.endDate.trim() : "";
  const event = await createEventRecord({
    ...payload,
    endDate: endDate || payload.startDate,
  });

  candidate.status = "approved";
  candidate.publishedEventId = event._id.toString();
  candidate.reviewedBy = reviewedBy;
  candidate.reviewedAt = new Date();
  await candidate.save();

  return event;
}

export class CrawledEventCandidateReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CrawledEventCandidateReviewError";
  }
}

export async function rejectCrawledEventCandidate(
  id: string,
  reviewedBy?: string,
  rejectionReason?: string,
) {
  const candidate = await CrawledEventCandidateModel.findOne({
    _id: id,
    source: OPLEV_ESBJERG_EVENT_SOURCE,
  });

  if (!candidate) {
    return null;
  }

  if (candidate.status !== "new") {
    throw new CrawledEventCandidateReviewError("Denne kandidat er allerede behandlet.");
  }

  candidate.status = "rejected";
  candidate.reviewedBy = reviewedBy;
  candidate.reviewedAt = new Date();
  candidate.rejectionReason = rejectionReason?.trim() ?? "";
  await candidate.save();

  return candidate;
}

export async function saveCrawledEventCandidates(
  source: string,
  events: OplevEsbjergEventCandidate[],
  crawledAt: string,
): Promise<CrawledEventCandidatePersistence> {
  if (!events.length) {
    return { inserted: 0, updated: 0 };
  }

  const crawlDate = new Date(crawledAt);

  const result = await CrawledEventCandidateModel.bulkWrite(
    events.map((event) => ({
      updateOne: {
        filter: { source, sourceId: event.sourceId },
        update: {
          $set: {
            sourceUrl: event.sourceUrl,
            title: event.title,
            description: event.description,
            dateText: event.dateText,
            locationText: event.locationText,
            addressText: event.addressText,
            category: event.category,
            imageUrl: event.imageUrl,
            startDate: event.startDate,
            endDate: event.endDate,
            crawledAt: crawlDate,
          },
          // Do not reset a future moderation decision simply because the
          // source was crawled again.
          $setOnInsert: { source, sourceId: event.sourceId, status: "new" },
        },
        upsert: true,
      },
    })),
  );

  return {
    inserted: result.upsertedCount,
    updated: result.matchedCount,
  };
}
