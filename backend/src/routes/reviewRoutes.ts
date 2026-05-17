import { Router } from "express";
import {
  createReview,
  deleteReviewById,
  editReview,
  getAllReviews,
  getReviewById,
  getReviewsByTarget,
  likeReview,
  updateReviewById,
} from "../controllers/reviewController";
import { reportReview } from "../controllers/reviewReportController";
import { reviewRateLimiter } from "../middleware/rateLimit";
import { requirePermission } from "../middleware/requirePermission";
import { verifyToken } from "../middleware/verifyUserToken";

const router = Router();

router.post(
  "/reviews",
  verifyToken,
  reviewRateLimiter,
  requirePermission("review:create"),
  createReview,
);
router.get("/reviews/target/:targetId", getReviewsByTarget);
router.post("/reviews/:id/like", verifyToken, reviewRateLimiter, likeReview);
router.post("/reviews/:id/report", verifyToken, reviewRateLimiter, reportReview);
router.patch("/reviews/:id", verifyToken, reviewRateLimiter, editReview);
router.get("/reviews", getAllReviews);
router.get("/reviews/:id", getReviewById);
router.put(
  "/reviews/:id",
  verifyToken,
  reviewRateLimiter,
  requirePermission("review:update"),
  updateReviewById,
);
router.delete(
  "/reviews/:id",
  verifyToken,
  reviewRateLimiter,
  requirePermission("review:delete"),
  deleteReviewById,
);

export default router;
