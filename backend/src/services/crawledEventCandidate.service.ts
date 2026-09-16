import { CrawledEventCandidateModel } from "../models/crawledEventCandidateModel";
import {
  OPLEV_ESBJERG_EVENT_SOURCE,
  OplevEsbjergEventCandidate,
} from "./oplevEsbjergEventCrawler.service";

export type CrawledEventCandidatePersistence = {
  inserted: number;
  updated: number;
};

export async function getNewOplevEsbjergEventCandidates() {
  // Only expose the raw, unreviewed import queue for now. A moderation flow
  // will later handle the approved and rejected statuses.
  return CrawledEventCandidateModel.find({
    source: OPLEV_ESBJERG_EVENT_SOURCE,
    status: "new",
  })
    .sort({ crawledAt: -1, createdAt: -1 })
    .limit(50)
    .lean();
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
            category: event.category,
            imageUrl: event.imageUrl,
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
