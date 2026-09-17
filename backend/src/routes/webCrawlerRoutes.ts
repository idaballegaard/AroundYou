import { Router } from "express";
import {
  approveOplevEsbjergEventCandidate,
  crawlOplevEsbjergEventCalendar,
  getOplevEsbjergEventCandidates,
  rejectOplevEsbjergEventCandidate,
  crawlWebsite,
} from "../controllers/webCrawlerController";
import { adminMutationRateLimiter } from "../middleware/rateLimit";
import { requireAdmin } from "../middleware/requireAdmin";
import { requirePermission } from "../middleware/requirePermission";
import { verifyToken } from "../middleware/verifyUserToken";

const router = Router();

// These endpoints are intentionally admin-only while the crawler is still a
// foundation feature. The source-specific endpoint stores raw candidates only;
// it never publishes crawled content as an AroundYou event.
router.post(
  "/admin/crawler/oplev-esbjerg/events",
  verifyToken,
  requireAdmin,
  requirePermission("admin:access"),
  adminMutationRateLimiter,
  crawlOplevEsbjergEventCalendar,
);

router.get(
  "/admin/crawler/oplev-esbjerg/events",
  verifyToken,
  requireAdmin,
  requirePermission("admin:access"),
  getOplevEsbjergEventCandidates,
);

router.post(
  "/admin/crawler/oplev-esbjerg/events/:id/approve",
  verifyToken,
  requireAdmin,
  requirePermission("admin:access"),
  adminMutationRateLimiter,
  approveOplevEsbjergEventCandidate,
);

router.post(
  "/admin/crawler/oplev-esbjerg/events/:id/reject",
  verifyToken,
  requireAdmin,
  requirePermission("admin:access"),
  adminMutationRateLimiter,
  rejectOplevEsbjergEventCandidate,
);

router.post(
  "/admin/crawler/crawl",
  verifyToken,
  requireAdmin,
  requirePermission("admin:access"),
  adminMutationRateLimiter,
  crawlWebsite,
);

export default router;
