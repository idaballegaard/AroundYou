import { Router } from "express";
import { crawlWebsite } from "../controllers/webCrawlerController";
import { adminMutationRateLimiter } from "../middleware/rateLimit";
import { requireAdmin } from "../middleware/requireAdmin";
import { requirePermission } from "../middleware/requirePermission";
import { verifyToken } from "../middleware/verifyUserToken";

const router = Router();

// This is intentionally admin-only while the crawler is still a foundation
// feature. It does not store or publish crawled content.
router.post(
  "/admin/crawler/crawl",
  verifyToken,
  requireAdmin,
  requirePermission("admin:access"),
  adminMutationRateLimiter,
  crawlWebsite,
);

export default router;
