"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contentSuggestionController_1 = require("../controllers/contentSuggestionController");
const rateLimit_1 = require("../middleware/rateLimit");
const requirePermission_1 = require("../middleware/requirePermission");
const verifyUserToken_1 = require("../middleware/verifyUserToken");
const router = (0, express_1.Router)();
router.post("/suggestions", verifyUserToken_1.verifyToken, rateLimit_1.contentWriteRateLimiter, (0, requirePermission_1.requirePermission)("content:suggest"), contentSuggestionController_1.createContentSuggestion);
exports.default = router;
//# sourceMappingURL=contentSuggestionRoutes.js.map