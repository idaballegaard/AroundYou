"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cityController_1 = require("../controllers/cityController");
const rateLimit_1 = require("../middleware/rateLimit");
const requirePermission_1 = require("../middleware/requirePermission");
const verifyUserToken_1 = require("../middleware/verifyUserToken");
const router = (0, express_1.Router)();
router.post("/city", verifyUserToken_1.verifyToken, rateLimit_1.contentWriteRateLimiter, (0, requirePermission_1.requirePermission)("city:create"), cityController_1.createCity);
router.get("/city", cityController_1.getAllCities);
router.get("/city/name/:cityName", cityController_1.getCityByName);
router.get("/city/:id", cityController_1.getCityById);
router.put("/city/:id", verifyUserToken_1.verifyToken, rateLimit_1.contentWriteRateLimiter, (0, requirePermission_1.requirePermission)("city:update"), cityController_1.updateCityById);
router.delete("/city/:id", verifyUserToken_1.verifyToken, rateLimit_1.contentWriteRateLimiter, (0, requirePermission_1.requirePermission)("city:delete"), cityController_1.deleteCityById);
exports.default = router;
//# sourceMappingURL=cityRoutes.js.map