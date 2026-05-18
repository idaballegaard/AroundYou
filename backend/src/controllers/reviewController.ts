import { Request, Response } from "express";
import { ReviewModel } from "../models/reviewModel";
import {
  notifyReviewAuthorReviewRemoved,
  notifyReviewReporters,
} from "../services/reviewNotification.service";
import {
  attachAuthorAvatar,
  attachAuthorAvatars,
} from "../services/reviewAuthorAvatar.service";
import { buildDynamicQuery } from "../utils/dynamicQueryBuilder";
import {
  getHideUpdate,
  getRestoreUpdate,
  isValidationError,
  visibleFilter,
} from "./controllerUtils";
import {
  validateReviewBody,
  validateReviewRemoval,
} from "../validators/review.validators";

function canModifyReview(req: Request, author: string): boolean {
  return req.user?.role === "admin" || req.user?.userName === author;
}

/**
 * CREATE REVIEW
 */
export async function createReview(req: Request, res: Response): Promise<void> {
  try {
    const author = req.user?.userName;

    if (!author) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const reviewBody = validateReviewBody(req.body as Record<string, unknown>);

    const review = new ReviewModel({
      ...reviewBody,
      author,
    });
    const result = await review.save();

    res.status(201).json(await attachAuthorAvatar(result));
  } catch (err) {
    console.error("Error creating review:", err);
    if (isValidationError(err)) {
      res.status(400).json({ message: err.message });
      return;
    }

    res.status(500).json({
      message: "Error creating review",
    });
  }
}

/**
 * GET ALL REVIEWS
 */
export async function getAllReviews(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const result = await ReviewModel.find(visibleFilter(req));
    res.status(200).json(await attachAuthorAvatars(result));
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({
      message: "Error retrieving reviews",
    });
  }
}

/**
 * GET REVIEW BY ID
 */
export async function getReviewById(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const result = await ReviewModel.findOne({
      _id: req.params.id,
      ...visibleFilter(req),
    });

    if (!result) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    res.status(200).json(await attachAuthorAvatar(result));
  } catch (err) {
    console.error("Error fetching review:", err);
    res.status(500).json({
      message: "Error retrieving review",
    });
  }
}

/**
 * UPDATE REVIEW
 */
export async function updateReviewById(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const review = await ReviewModel.findOne({
      _id: req.params.id,
      ...visibleFilter(req),
    });

    if (!review) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    if (!canModifyReview(req, review.author)) {
      res.status(403).json({ message: "Cannot modify another user's review" });
      return;
    }

    const updates = {
      ...validateReviewBody(req.body as Record<string, unknown>, true),
      ...(typeof req.body.likes === "number" && req.user?.role === "admin"
        ? { likes: req.body.likes }
        : {}),
    };

    const result = await ReviewModel.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      message: "Review updated successfully",
      data: await attachAuthorAvatar(result),
    });
  } catch (err) {
    console.error("Error updating review:", err);
    if (isValidationError(err)) {
      res.status(400).json({ message: err.message });
      return;
    }

    res.status(500).json({
      message: "Error updating review",
    });
  }
}

/**
 * HIDE REVIEW
 */
export async function deleteReviewById(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const review = await ReviewModel.findOne({
      _id: req.params.id,
      ...visibleFilter(req),
    });

    if (!review) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    if (!canModifyReview(req, review.author)) {
      res.status(403).json({ message: "Cannot delete another user's review" });
      return;
    }

    const ruleBroken =
      req.user?.role === "admin"
        ? validateReviewRemoval(req.body as Record<string, unknown>)
        : "";

    const result = await ReviewModel.findByIdAndUpdate(
      req.params.id,
      getHideUpdate(req.user?.userID),
      { new: true },
    );

    if (req.user?.role === "admin") {
      await notifyReviewAuthorReviewRemoved(review, ruleBroken);
      if (review.reports.length > 0) {
        await notifyReviewReporters(review, true);
      }
    }

    res
      .status(200)
      .json({
        message: "Review hidden successfully",
        data: await attachAuthorAvatar(result),
      });
  } catch (err) {
    console.error("Error deleting review:", err);
    if (isValidationError(err)) {
      res.status(400).json({ message: err.message });
      return;
    }

    res.status(500).json({
      message: "Error deleting review",
    });
  }
}

export async function restoreReviewById(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const review = await ReviewModel.findById(req.params.id);

    if (!review) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    if (req.user?.role !== "admin") {
      res.status(403).json({ message: "Admin access required" });
      return;
    }

    const result = await ReviewModel.findByIdAndUpdate(
      req.params.id,
      getRestoreUpdate(),
      { new: true },
    );

    res.status(200).json({
      message: "Review restored successfully",
      data: await attachAuthorAvatar(result),
    });
  } catch (err) {
    console.error("Error restoring review:", err);
    res.status(500).json({
      message: "Error restoring review",
    });
  }
}

/**
 * QUERY REVIEW (KEY / VALUE)
 */
export async function getReviewByQuery(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const key = req.params.key as string;
    const value = req.params.value as string;

    const result = await ReviewModel.find({
      ...visibleFilter(req),
      [key]: { $regex: value, $options: "i" },
    });

    res.status(200).json(await attachAuthorAvatars(result));
  } catch (err) {
    console.error("Error querying reviews:", err);
    res.status(500).json({
      message: "Error retrieving reviews by query",
    });
  }
}

/**
 * GENERIC QUERY
 */
export async function getReviewByGenericQuery(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const query = buildDynamicQuery(ReviewModel, req.body);

    const result = await ReviewModel.find({
      ...query,
      ...visibleFilter(req),
    });

    res.status(200).json(await attachAuthorAvatars(result));
  } catch (err) {
    console.error("Error generic review query:", err);
    res.status(500).json({
      message: "Error retrieving reviews",
    });
  }
}

/**
 * GET REVIEWS BY TARGET (city / event / attraction)
 */
export async function getReviewsByTarget(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { targetId } = req.params;
    const result = await ReviewModel.find({
      targetId,
      ...visibleFilter(req),
    }).sort({ createdAt: -1 });
    res.status(200).json(await attachAuthorAvatars(result));
  } catch (err) {
    console.error("Error fetching reviews by target:", err);
    res.status(500).json({ message: "Error retrieving reviews" });
  }
}

/**
 * EDIT OWN REVIEW (sets edited: true)
 */
export async function editReview(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updates = validateReviewBody(
      req.body as Record<string, unknown>,
      true,
    );

    const review = await ReviewModel.findOne({
      _id: id,
      ...visibleFilter(req),
    });

    if (!review) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    if (!canModifyReview(req, review.author)) {
      res.status(403).json({ message: "Cannot modify another user's review" });
      return;
    }

    const updated = await ReviewModel.findByIdAndUpdate(
      id,
      {
        ...updates,
        edited: true,
      },
      { new: true, runValidators: true },
    );

    res.status(200).json(await attachAuthorAvatar(updated));
  } catch (err) {
    console.error("Error editing review:", err);
    if (isValidationError(err)) {
      res.status(400).json({ message: err.message });
      return;
    }

    res.status(500).json({ message: "Error updating review" });
  }
}

/**
 * LIKE / UNLIKE REVIEW (toggle)
 */
export async function likeReview(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.userID;

    if (!userId) {
      res.status(400).json({ message: "userId is required" });
      return;
    }

    const review = await ReviewModel.findOne({
      _id: id,
      ...visibleFilter(req),
    });

    if (!review) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    const likedBy = review.likedBy ?? [];
    const alreadyLiked = likedBy.includes(userId);

    const updated = await ReviewModel.findByIdAndUpdate(
      id,
      alreadyLiked
        ? { $pull: { likedBy: userId }, $inc: { likes: -1 } }
        : { $addToSet: { likedBy: userId }, $inc: { likes: 1 } },
      { new: true },
    );

    res.status(200).json(await attachAuthorAvatar(updated));
  } catch (err) {
    console.error("Error liking review:", err);
    res.status(500).json({ message: "Error updating like" });
  }
}
