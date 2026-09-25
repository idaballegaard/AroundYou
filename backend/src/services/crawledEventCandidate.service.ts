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
  // Candidates with the same normalised title and calendar date are scored
  // with their time and venue details, giving moderators an explainable
  // cross-source duplicate assessment before publication.
  const otherCandidates = await CrawledEventCandidateModel.find({
    source: { $ne: source },
    status: { $in: ["new", "approved"] },
    $or: candidateDates.map((date) => ({ startDate: new RegExp(`^${date}`) })),
  })
    .select("title source sourceUrl dateText description startDate endDate locationText addressText imageUrl status")
    .lean();

  const duplicatesByFingerprint = new Map<string, CrawledEventCandidatePossibleDuplicate[]>();
  for (const candidate of otherCandidates) {
    const fingerprint = getDuplicateFingerprint(candidate.title, candidate.startDate);
    if (!fingerprint) continue;

    const currentCandidate = candidates.find(
      (item) => getDuplicateFingerprint(item.title, item.startDate) === fingerprint,
    );
    if (!currentCandidate) continue;

    const duplicateMatch = getDuplicateMatch(currentCandidate, candidate);
    const duplicates = duplicatesByFingerprint.get(fingerprint) ?? [];
    duplicates.push({
      _id: candidate._id.toString(),
      title: candidate.title,
      source: candidate.source,
      sourceUrl: candidate.sourceUrl,
      dateText: candidate.dateText,
      description: candidate.description,
      locationText: candidate.locationText,
      addressText: candidate.addressText,
      imageUrl: candidate.imageUrl,
      startDate: candidate.startDate,
      endDate: candidate.endDate,
      status: candidate.status as "new" | "approved",
      matchScore: duplicateMatch.matchScore,
      matchConfidence: duplicateMatch.matchConfidence,
      matchReasons: duplicateMatch.matchReasons,
    });
    duplicatesByFingerprint.set(fingerprint, duplicates);
  }

  return candidates.map((candidate) => ({
    ...candidate,
    possibleDuplicates: (duplicatesByFingerprint.get(
      getDuplicateFingerprint(candidate.title, candidate.startDate),
    ) ?? []).sort((first, second) => second.matchScore - first.matchScore),
  }));
}

type DuplicateComparableCandidate = {
  title: string;
  startDate: string;
  locationText: string;
  addressText: string;
};

function getDuplicateMatch(
  first: DuplicateComparableCandidate,
  second: DuplicateComparableCandidate,
): Pick<CrawledEventCandidatePossibleDuplicate, "matchScore" | "matchConfidence" | "matchReasons"> {
  const reasons = ["Samme titel", "Samme dato"];
  let score = 75;

  if (getKnownStartTime(first.startDate) && getKnownStartTime(first.startDate) === getKnownStartTime(second.startDate)) {
    score += 15;
    reasons.push("Samme starttidspunkt");
  }

  if (hasSameVenue(first, second)) {
    score += 10;
    reasons.push("Samme sted eller adresse");
  }

  return {
    matchScore: score,
    matchConfidence: score >= 90 ? "Høj" : score >= 75 ? "Middel" : "Lav",
    matchReasons: reasons,
  };
}

function getKnownStartTime(startDate: string): string {
  const time = startDate.match(/T(\d{2}:\d{2})$/)?.[1] ?? "";
  return time === "00:00" ? "" : time;
}

function hasSameVenue(first: DuplicateComparableCandidate, second: DuplicateComparableCandidate): boolean {
  const firstVenue = normalizeMatchText(first.addressText || first.locationText);
  const secondVenue = normalizeMatchText(second.addressText || second.locationText);

  return firstVenue.length >= 8 && secondVenue.length >= 8 && (
    firstVenue === secondVenue || firstVenue.includes(secondVenue) || secondVenue.includes(firstVenue)
  );
}

function getDuplicateFingerprint(title: string, startDate: string): string {
  const date = startDate.slice(0, 10);
  const normalizedTitle = normalizeMatchText(title);

  return date && normalizedTitle ? `${date}:${normalizedTitle}` : "";
}

function normalizeMatchText(value: string): string {
  return value
    .toLocaleLowerCase("da-DK")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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
