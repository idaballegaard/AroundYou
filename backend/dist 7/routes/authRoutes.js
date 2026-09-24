"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const rateLimit_1 = require("../middleware/rateLimit");
const verifyUserToken_1 = require("../middleware/verifyUserToken");
const router = (0, express_1.Router)();
router.post("/user/register", rateLimit_1.authRateLimiter, authController_1.registerUser);
router.post("/user/login", rateLimit_1.authRateLimiter, authController_1.loginUser);
router.post("/user/logout", authController_1.logoutUser);
router.get("/user/me", verifyUserToken_1.verifyToken, authController_1.getMe);
router.put("/user/me", verifyUserToken_1.verifyToken, rateLimit_1.contentWriteRateLimiter, authController_1.updateMe);
router.patch("/user/me/restrict", verifyUserToken_1.verifyToken, authController_1.restrictUser);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map