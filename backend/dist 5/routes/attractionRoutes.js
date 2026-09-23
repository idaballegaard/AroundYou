"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attractionController_1 = require("../controllers/attractionController");
const rateLimit_1 = require("../middleware/rateLimit");
const requirePermission_1 = require("../middleware/requirePermission");
const verifyUserToken_1 = require("../middleware/verifyUserToken");
const router = (0, express_1.Router)();
router.post("/attractions", verifyUserToken_1.verifyToken, rateLimit_1.contentWriteRateLimiter, (0, requirePermission_1.requirePermission)("attraction:create"), attractionController_1.createAttraction);
router.get("/attractions", attractionController_1.getAllAttractions);
router.get("/attractions/:id", attractionController_1.getAttractionById);
router.put("/attractions/:id", verifyUserToken_1.verifyToken, rateLimit_1.contentWriteRateLimiter, (0, requirePermission_1.requirePermission)("attraction:update"), attractionController_1.updateAttractionById);
router.delete("/attractions/:id", verifyUserToken_1.verifyToken, rateLimit_1.contentWriteRateLimiter, (0, requirePermission_1.requirePermission)("attraction:delete"), attractionController_1.deleteAttractionById);
exports.default = router;
//# sourceMappingURL=attractionRoutes.js.map