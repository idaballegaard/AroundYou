"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const geocodingController_1 = require("../controllers/geocodingController");
const router = (0, express_1.Router)();
router.get("/geocode", geocodingController_1.forwardGeocode);
router.get("/geocode/reverse", geocodingController_1.reverseGeocode);
exports.default = router;
//# sourceMappingURL=geocodingRoutes.js.map