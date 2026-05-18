import { Request, Response } from "express";
import { AttractionModel } from "../models/attractionModel";
import { CityModel } from "../models/cityModel";
import { ContentSuggestionModel } from "../models/contentSuggestionModel";
import { EventModel } from "../models/eventModel";
import { ContentSuggestionType } from "../interfaces/contentSuggestion";
import { sanitizeContentPayload } from "../utils/contentPayload";

const SUGGESTION_MODELS = {
  // Suggestions are stored separately until approval, then copied into the
  // canonical collection for their content type.
  attraction: AttractionModel,
  event: EventModel,
  city: CityModel,
};

type ContentSuggestionStatus = "pending" | "approved" | "rejected";

function isContentSuggestionType(
  value: unknown,
): value is ContentSuggestionType {
  return value === "attraction" || value === "event" || value === "city";
}

function isContentSuggestionStatus(
  value: unknown,
): value is ContentSuggestionStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function createContentSuggestion(
  req: Request,
  res: Response,
): Promise<void> {
  const { type, payload } = req.body as {
    type?: unknown;
    payload?: unknown;
  };

  if (!isContentSuggestionType(type) || !isRecord(payload)) {
    res.status(400).json({ message: "Invalid content suggestion" });
    return;
  }

  let sanitizedPayload: Record<string, unknown>;

  try {
    // Validate before saving the suggestion so admins only review payloads that
    // can later be promoted without schema surprises.
    sanitizedPayload = await sanitizeContentPayload(type, payload);
  } catch (err) {
    res.status(400).json({
      message:
        err instanceof Error ? err.message : "Invalid content suggestion",
    });
    return;
  }

  const submittedBy = req.user?.userID;
  const submittedByName = req.user?.userName;

  if (!submittedBy || !submittedByName) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const suggestion = new ContentSuggestionModel({
      type,
      payload: sanitizedPayload,
      submittedBy,
      submittedByName,
    });

    const result = await suggestion.save();
    res.status(201).json(result);
  } catch (err) {
    console.error("Error creating content suggestion:", err);
    res.status(500).json({ message: "Error creating content suggestion" });
  }
}

export async function getContentSuggestions(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const requestedStatus = req.query.status;

    // Invalid or missing status defaults to the moderation queue.
    const status: ContentSuggestionStatus = isContentSuggestionStatus(
      requestedStatus,
    )
      ? requestedStatus
      : "pending";

    const result = await ContentSuggestionModel.find({ status }).sort({
      createdAt: -1,
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching content suggestions:", err);
    res.status(500).json({ message: "Error fetching content suggestions" });
  }
}

export async function approveContentSuggestion(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const suggestion = await ContentSuggestionModel.findById(req.params.id);

    if (!suggestion) {
      res.status(404).json({ message: "Suggestion not found" });
      return;
    }

    if (suggestion.status !== "pending") {
      res.status(409).json({ message: "Suggestion has already been reviewed" });
      return;
    }

    const Model = SUGGESTION_MODELS[suggestion.type];

    // Re-sanitize stored suggestions at approval time. This protects old queued
    // suggestions if validation rules changed after submission.
    const createdContent = await new Model(
      await sanitizeContentPayload(suggestion.type, suggestion.payload),
    ).save();

    suggestion.status = "approved";
    suggestion.reviewedBy = req.user?.userID;
    suggestion.reviewedAt = new Date();

    await suggestion.save();

    res.status(200).json({
      suggestion,
      content: createdContent,
    });
  } catch (err) {
    console.error("Error approving content suggestion:", err);
    res.status(500).json({ message: "Error approving content suggestion" });
  }
}

export async function rejectContentSuggestion(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const suggestion = await ContentSuggestionModel.findById(req.params.id);

    if (!suggestion) {
      res.status(404).json({ message: "Suggestion not found" });
      return;
    }

    if (suggestion.status !== "pending") {
      res.status(409).json({ message: "Suggestion has already been reviewed" });
      return;
    }

    suggestion.status = "rejected";
    suggestion.reviewedBy = req.user?.userID;
    suggestion.reviewedAt = new Date();

    // Rejection reason is optional because admins may reject obvious spam or
    // duplicate suggestions without needing a long explanation.
    suggestion.rejectionReason =
      typeof req.body.reason === "string" ? req.body.reason.trim() : "";

    await suggestion.save();

    res.status(200).json(suggestion);
  } catch (err) {
    console.error("Error rejecting content suggestion:", err);
    res.status(500).json({ message: "Error rejecting content suggestion" });
  }
}
