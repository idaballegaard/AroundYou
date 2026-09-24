import { Document } from "mongoose";

export type CrawledEventCandidateStatus = "new" | "approved" | "rejected";

export type CrawledEventCandidatePossibleDuplicate = {
  _id: string;
  title: string;
  source: string;
  sourceUrl: string;
  dateText: string;
  status: "new" | "approved";
  matchScore: number;
  matchConfidence: "Høj" | "Middel" | "Lav";
  matchReasons: string[];
};

// This is deliberately a raw import record, not an Event. A later moderation
// flow can decide which candidates are complete and trustworthy enough to
// publish as real AroundYou events.
export interface CrawledEventCandidate extends Document {
  source: string;
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
  status: CrawledEventCandidateStatus;
  publishedEventId?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  crawledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
