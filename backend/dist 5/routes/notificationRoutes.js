"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const verifyUserToken_1 = require("../middleware/verifyUserToken");
const router = (0, express_1.Router)();
router.get("/notifications", verifyUserToken_1.verifyToken, notificationController_1.getMyNotifications);
router.delete("/notifications", verifyUserToken_1.verifyToken, notificationController_1.deleteAllNotifications);
router.patch("/notifications/read-all", verifyUserToken_1.verifyToken, notificationController_1.markAllNotificationsRead);
router.patch("/notifications/:id/read", verifyUserToken_1.verifyToken, notificationController_1.markNotificationRead);
exports.default = router;
//# sourceMappingURL=notificationRoutes.js.map