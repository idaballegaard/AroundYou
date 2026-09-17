import { Schema, model } from "mongoose";
import { CrawledEventCandidate } from "../interfaces/crawledEventCandidate";

const crawledEventCandidateSchema = new Schema<CrawledEventCandidate>(
  {
    source: { type: String, required: true, trim: true },
    sourceId: { type: String, required: true, trim: true },
    sourceUrl: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    dateText: { type: String, default: "", trim: true },
    locationText: { type: String, default: "", trim: true },
    addressText: { type: String, default: "", trim: true },
    category: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: "", trim: true },
    // Local date-time strings are kept as supplied by the source so the admin
    // form can show the correct Danish wall-clock time before publication.
    startDate: { type: String, default: "", trim: true },
    endDate: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["new", "approved", "rejected"],
      default: "new",
      required: true,
      index: true,
    },
    publishedEventId: { type: String, required: false },
    reviewedBy: { type: String, required: false },
    reviewedAt: { type: Date, required: false },
    rejectionReason: { type: String, required: false, trim: true },
    crawledAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// The source's own identifier is stable across crawls, so it is the natural
// key for avoiding duplicate candidates.
crawledEventCandidateSchema.index({ source: 1, sourceId: 1 }, { unique: true });

export const CrawledEventCandidateModel = model<CrawledEventCandidate>(
  "CrawledEventCandidate",
  crawledEventCandidateSchema,
);
