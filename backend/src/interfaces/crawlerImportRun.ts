import { Document } from "mongoose";

export type CrawlerImportTrigger = "manual" | "scheduled";
export type CrawlerImportRunStatus = "running" | "succeeded" | "failed";

export interface CrawlerImportRun extends Document {
  source: string;
  trigger: CrawlerImportTrigger;
  status: CrawlerImportRunStatus;
  startedAt: Date;
  finishedAt?: Date;
  eventCount: number;
  inserted: number;
  updated: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}
