import {
  CrawledEventCandidatePossibleDuplicate,
  CrawledEventCandidateStatus,
} from "../interfaces/crawledEventCandidate";
import { CrawledEventCandidateModel } from "../models/crawledEventCandidateModel";
import { createEventRecord } from "./event.service";
import {
  crawlOplevEsbjergEvents,
  OPLEV_ESBJERG_EVENT_SOURCE,
} from "./oplevEsbjergEventCrawler.service";

export type CrawledEventCandidateInput = {
  sourceId: string;
  sourceUrl: string;
  title: string;
  description: string;
  dateText: string;
  locationText: string;
  addressText: string;
  category: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
};

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
  return getCrawledEventCandidates(OPLEV_ESBJERG_EVENT_SOURCE, status);
}

export async function getCrawledEventCandidates(
  source: string,
  status: CrawledEventCandidateStatus = "new",
) {
  const candidates = await CrawledEventCandidateModel.find({
    source,
    status,
  })
    .sort({ crawledAt: -1, createdAt: -1 })
    .limit(50)
    .lean();

  const candidateDates = [...new Set(candidates.map((candidate) => candidate.startDate.slice(0, 10)).filter(Boolean))];
  if (!candidateDates.length) {
    return candidates.map((candidate) => ({ ...candidate, possibleDuplicates: [] }));
  }

  // A source-specific ID only prevents repeat imports from that same source.
  // Compare a normalised title and calendar date across the other sources so
  // moderators can spot likely duplicate events before publishing either one.
  const otherCandidates = await CrawledEventCandidateModel.find({
    source: { $ne: source },
    status: { $in: ["new", "approved"] },
    $or: candidateDates.map((date) => ({ startDate: new RegExp(`^${date}`) })),
  })
    .select("title source sourceUrl dateText startDate status")
    .lean();

  const duplicatesByFingerprint = new Map<string, CrawledEventCandidatePossibleDuplicate[]>();
  for (const candidate of otherCandidates) {
    const fingerprint = getDuplicateFingerprint(candidate.title, candidate.startDate);
    if (!fingerprint) continue;

    const duplicates = duplicatesByFingerprint.get(fingerprint) ?? [];
    duplicates.push({
      _id: candidate._id.toString(),
      title: candidate.title,
      source: candidate.source,
      sourceUrl: candidate.sourceUrl,
      dateText: candidate.dateText,
      status: candidate.status as "new" | "approved",
    });
    duplicatesByFingerprint.set(fingerprint, duplicates);
  }

  return candidates.map((candidate) => ({
    ...candidate,
    possibleDuplicates: duplicatesByFingerprint.get(
      getDuplicateFingerprint(candidate.title, candidate.startDate),
    ) ?? [],
  }));
}

function getDuplicateFingerprint(title: string, startDate: string): string {
  const date = startDate.slice(0, 10);
  const normalizedTitle = title
    .toLocaleLowerCase("da-DK")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  return date && normalizedTitle ? `${date}:${normalizedTitle}` : "";
}

export async function approveCrawledEventCandidate(
  id: string,
  payload: Record<string, unknown>,
  reviewedBy?: string,
  source = OPLEV_ESBJERG_EVENT_SOURCE,
) {
  const candidate = await CrawledEventCandidateModel.findOne({
    _id: id,
    source,
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
  source = OPLEV_ESBJERG_EVENT_SOURCE,
) {
  const candidate = await CrawledEventCandidateModel.findOne({
    _id: id,
    source,
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
  events: CrawledEventCandidateInput[],
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
