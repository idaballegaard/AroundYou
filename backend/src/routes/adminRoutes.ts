import { Router } from "express";
import {
  deleteAttractionById,
  getAllAttractions,
  restoreAttractionById,
  updateAttractionById,
  createAttraction,
} from "../controllers/attractionController";
import {
  completeContactTicket,
  getAdminContactTickets,
  markContactTicketSeen,
  rejectContactTicket,
  reopenContactTicket,
  startContactTicketWork,
} from "../controllers/contactTicketController";
import {
  approveContentSuggestion,
  getContentSuggestions,
  rejectContentSuggestion,
} from "../controllers/contentSuggestionController";
import {
  createCity,
  deleteCityById,
  getAllCities,
  restoreCityById,
  updateCityById,
} from "../controllers/cityController";
import {
  createEvent,
  deleteEventById,
  getAllEvents,
  restoreEventById,
  updateEventById,
} from "../controllers/eventController";
import {
  deleteReviewById,
  restoreReviewById,
  updateReviewById,
} from "../controllers/reviewController";
import {
  getReportedReviews,
  resolveReviewReport,
} from "../controllers/reviewReportController";
import { adminMutationRateLimiter } from "../middleware/rateLimit";
import { requireAdmin } from "../middleware/requireAdmin";
import { requirePermission } from "../middleware/requirePermission";
import { verifyToken } from "../middleware/verifyUserToken";

const router = Router();

router.get(
  "/admin/suggestions",
  verifyToken,
  requireAdmin,
  requirePermission("admin:access"),
  getContentSuggestions,
);
router.post(
  "/admin/suggestions/:id/approve",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  requirePermission("admin:access"),
  approveContentSuggestion,
);
router.post(
  "/admin/suggestions/:id/reject",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  requirePermission("admin:access"),
  rejectContentSuggestion,
);

router.get(
  "/admin/contact/tickets",
  verifyToken,
  requireAdmin,
  getAdminContactTickets,
);
router.patch(
  "/admin/contact/tickets/:id/seen",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  markContactTicketSeen,
);
router.patch(
  "/admin/contact/tickets/:id/start",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  startContactTicketWork,
);
router.patch(
  "/admin/contact/tickets/:id/complete",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  completeContactTicket,
);
router.patch(
  "/admin/contact/tickets/:id/reject",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  rejectContactTicket,
);
router.patch(
  "/admin/contact/tickets/:id/reopen",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  reopenContactTicket,
);

router.get("/admin/city", verifyToken, requireAdmin, getAllCities);
router.post(
  "/admin/city",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  createCity,
);
router.put(
  "/admin/city/:id",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  updateCityById,
);
router.patch(
  "/admin/city/:id/restore",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  restoreCityById,
);
router.delete(
  "/admin/city/:id",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  deleteCityById,
);

router.get("/admin/attractions", verifyToken, requireAdmin, getAllAttractions);
router.post(
  "/admin/attractions",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  createAttraction,
);
router.put(
  "/admin/attractions/:id",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  updateAttractionById,
);
router.delete(
  "/admin/attractions/:id",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  deleteAttractionById,
);
router.patch(
  "/admin/attractions/:id/restore",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  restoreAttractionById,
);

router.get("/admin/events", verifyToken, requireAdmin, getAllEvents);
router.post(
  "/admin/events",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  createEvent,
);
router.put(
  "/admin/events/:id",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  updateEventById,
);
router.patch(
  "/admin/events/:id/restore",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  restoreEventById,
);
router.delete(
  "/admin/events/:id",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  deleteEventById,
);

router.get(
  "/admin/reviews/reports",
  verifyToken,
  requireAdmin,
  getReportedReviews,
);
router.put(
  "/admin/reviews/:id",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  updateReviewById,
);
router.patch(
  "/admin/reviews/:id/resolve-report",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  resolveReviewReport,
);
router.delete(
  "/admin/reviews/:id",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  deleteReviewById,
);
router.patch(
  "/admin/reviews/:id/restore",
  verifyToken,
  requireAdmin,
  adminMutationRateLimiter,
  restoreReviewById,
);

export default router;
