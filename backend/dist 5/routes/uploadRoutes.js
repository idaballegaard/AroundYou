"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uploadController_1 = require("../controllers/uploadController");
const rateLimit_1 = require("../middleware/rateLimit");
const verifyUserToken_1 = require("../middleware/verifyUserToken");
const router = (0, express_1.Router)();
router.post("/upload/image", verifyUserToken_1.verifyToken, rateLimit_1.uploadRateLimiter, uploadController_1.uploadSingleImage, uploadController_1.uploadImage);
router.get("/images/:id", uploadController_1.getUploadedImage);
exports.default = router;
//# sourceMappingURL=uploadRoutes.js.map