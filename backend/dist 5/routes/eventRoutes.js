"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const eventController_1 = require("../controllers/eventController");
const rateLimit_1 = require("../middleware/rateLimit");
const requirePermission_1 = require("../middleware/requirePermission");
const verifyUserToken_1 = require("../middleware/verifyUserToken");
const router = (0, express_1.Router)();
router.post("/events", verifyUserToken_1.verifyToken, rateLimit_1.contentWriteRateLimiter, (0, requirePermission_1.requirePermission)("event:create"), eventController_1.createEvent);
router.get("/events", eventController_1.getAllEvents);
router.get("/events/starting-soon", eventController_1.getEventsStartingSoon);
router.get("/events/:id", eventController_1.getEventById);
router.put("/events/:id", verifyUserToken_1.verifyToken, rateLimit_1.contentWriteRateLimiter, (0, requirePermission_1.requirePermission)("event:update"), eventController_1.updateEventById);
router.delete("/events/:id", verifyUserToken_1.verifyToken, rateLimit_1.contentWriteRateLimiter, (0, requirePermission_1.requirePermission)("event:delete"), eventController_1.deleteEventById);
exports.default = router;
//# sourceMappingURL=eventRoutes.js.map