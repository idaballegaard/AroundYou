import { Request, Response } from "express";
import { ReviewModel } from "../models/reviewModel";
import { notifyReviewReporters } from "../services/reviewNotification.service";
import { visibleFilter } from "./controllerUtils";

export async function reportReview(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const reportedBy = req.user?.userID;
    const reason =
      typeof req.body.reason === "string" ? req.body.reason.trim() : "";
    const safeReason = reason.slice(0, 500);

    if (!reportedBy) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const review = await ReviewModel.findOne({
      _id: id,
      ...visibleFilter(req),
    });

    if (!review) {
      res.status(404).json({ message: "Kunne ikke finde et review" });
      return;
    }

    const alreadyReported = review.reports.some(
      (report) => report.reportedBy === reportedBy,
    );

    if (alreadyReported) {
      res.status(409).json({ message: "Reviewet er allerede anmeldt" });
      return;
    }

    review.reports.push({
      reportedBy,
      reason: safeReason,
      createdAt: new Date(),
    });
    review.reportCount = review.reports.length;
    review.reportResolved = false;
    review.reportResolvedAt = undefined;
    review.reportResolvedBy = undefined;

    const result = await review.save();
    res.status(200).json(result);
  } catch (err) {
    console.error("Fejl igang med reviewet:", err);
    res.status(500).json({ message: "Fejl anmeldese af review" });
  }
}

export async function getReportedReviews(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const includeResolved = req.query.includeResolved === "true";

    const result = await ReviewModel.find({
      reportCount: { $gt: 0 },
      ...visibleFilter(req),
      ...(includeResolved ? {} : { reportResolved: false }),
    }).sort({ reportCount: -1, createdAt: -1 });

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching reported reviews:", err);
    res.status(500).json({ message: "Error retrieving reported reviews" });
  }
}

export async function resolveReviewReport(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const review = await ReviewModel.findById(req.params.id);

    if (!review) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    review.reportResolved = true;
    review.reportResolvedAt = new Date();
    review.reportResolvedBy = req.user?.userID;

    const result = await review.save();
    await notifyReviewReporters(review, false);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error resolving review report:", err);
    res.status(500).json({ message: "Error resolving review report" });
  }
}
