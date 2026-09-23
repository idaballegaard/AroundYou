import { model, Schema } from "mongoose";
import { CrawlerImportRun } from "../interfaces/crawlerImportRun";

const crawlerImportRunSchema = new Schema<CrawlerImportRun>(
  {
    source: { type: String, required: true, trim: true, index: true },
    trigger: { type: String, enum: ["manual", "scheduled"], required: true },
    status: {
      type: String,
      enum: ["running", "succeeded", "failed"],
      required: true,
      index: true,
    },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, required: false },
    eventCount: { type: Number, required: true, default: 0 },
    inserted: { type: Number, required: true, default: 0 },
    updated: { type: Number, required: true, default: 0 },
    errorMessage: { type: String, required: false, trim: true },
  },
  { timestamps: true },
);

crawlerImportRunSchema.index({ source: 1, startedAt: -1 });

export const CrawlerImportRunModel = model<CrawlerImportRun>(
  "CrawlerImportRun",
  crawlerImportRunSchema,
);
