"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webCrawlerController_1 = require("../controllers/webCrawlerController");
const rateLimit_1 = require("../middleware/rateLimit");
const requireAdmin_1 = require("../middleware/requireAdmin");
const requirePermission_1 = require("../middleware/requirePermission");
const verifyUserToken_1 = require("../middleware/verifyUserToken");
const router = (0, express_1.Router)();
// These endpoints are intentionally admin-only while the crawler is still a
// foundation feature. The source-specific endpoint stores raw candidates only;
// it never publishes crawled content as an AroundYou event.
router.post("/admin/crawler/oplev-esbjerg/events", verifyUserToken_1.verifyToken, requireAdmin_1.requireAdmin, (0, requirePermission_1.requirePermission)("admin:access"), rateLimit_1.adminMutationRateLimiter, webCrawlerController_1.crawlOplevEsbjergEventCalendar);
router.get("/admin/crawler/oplev-esbjerg/events", verifyUserToken_1.verifyToken, requireAdmin_1.requireAdmin, (0, requirePermission_1.requirePermission)("admin:access"), webCrawlerController_1.getOplevEsbjergEventCandidates);
router.get("/admin/crawler/oplev-esbjerg/status", verifyUserToken_1.verifyToken, requireAdmin_1.requireAdmin, (0, requirePermission_1.requirePermission)("admin:access"), webCrawlerController_1.getOplevEsbjergEventImportStatus);
router.get("/admin/crawler/sources", verifyUserToken_1.verifyToken, requireAdmin_1.requireAdmin, (0, requirePermission_1.requirePermission)("admin:access"), webCrawlerController_1.getCrawlerEventSources);
router.post("/admin/crawler/events", verifyUserToken_1.verifyToken, requireAdmin_1.requireAdmin, (0, requirePermission_1.requirePermission)("admin:access"), rateLimit_1.adminMutationRateLimiter, webCrawlerController_1.crawlCrawlerEventCalendar);
router.get("/admin/crawler/events", verifyUserToken_1.verifyToken, requireAdmin_1.requireAdmin, (0, requirePermission_1.requirePermission)("admin:access"), webCrawlerController_1.getCrawlerEventCandidates);
router.get("/admin/crawler/status", verifyUserToken_1.verifyToken, requireAdmin_1.requireAdmin, (0, requirePermission_1.requirePermission)("admin:access"), webCrawlerController_1.getCrawlerEventImportStatus);
router.post("/admin/crawler/events/:id/approve", verifyUserToken_1.verifyToken, requireAdmin_1.requireAdmin, (0, requirePermission_1.requirePermission)("admin:access"), rateLimit_1.adminMutationRateLimiter, webCrawlerController_1.approveCrawlerEventCandidate);
router.post("/admin/crawler/events/:id/reject", verifyUserToken_1.verifyToken, requireAdmin_1.requireAdmin, (0, requirePermission_1.requirePermission)("admin:access"), rateLimit_1.adminMutationRateLimiter, webCrawlerController_1.rejectCrawlerEventCandidate);
router.post("/admin/crawler/oplev-esbjerg/events/:id/approve", verifyUserToken_1.verifyToken, requireAdmin_1.requireAdmin, (0, requirePermission_1.requirePermission)("admin:access"), rateLimit_1.adminMutationRateLimiter, webCrawlerController_1.approveOplevEsbjergEventCandidate);
router.post("/admin/crawler/oplev-esbjerg/events/:id/reject", verifyUserToken_1.verifyToken, requireAdmin_1.requireAdmin, (0, requirePermission_1.requirePermission)("admin:access"), rateLimit_1.adminMutationRateLimiter, webCrawlerController_1.rejectOplevEsbjergEventCandidate);
router.post("/admin/crawler/crawl", verifyUserToken_1.verifyToken, requireAdmin_1.requireAdmin, (0, requirePermission_1.requirePermission)("admin:access"), rateLimit_1.adminMutationRateLimiter, webCrawlerController_1.crawlWebsite);
exports.default = router;
//# sourceMappingURL=webCrawlerRoutes.js.map