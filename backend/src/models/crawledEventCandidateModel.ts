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
    category: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["new", "approved", "rejected"],
      default: "new",
      required: true,
      index: true,
    },
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
