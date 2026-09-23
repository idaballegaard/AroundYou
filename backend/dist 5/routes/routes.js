"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminRoutes_1 = __importDefault(require("./adminRoutes"));
const attractionRoutes_1 = __importDefault(require("./attractionRoutes"));
const authRoutes_1 = __importDefault(require("./authRoutes"));
const cityRoutes_1 = __importDefault(require("./cityRoutes"));
const contactTicketRoutes_1 = __importDefault(require("./contactTicketRoutes"));
const contentSuggestionRoutes_1 = __importDefault(require("./contentSuggestionRoutes"));
const eventRoutes_1 = __importDefault(require("./eventRoutes"));
const geocodingRoutes_1 = __importDefault(require("./geocodingRoutes"));
const notificationRoutes_1 = __importDefault(require("./notificationRoutes"));
const reviewRoutes_1 = __importDefault(require("./reviewRoutes"));
const uploadRoutes_1 = __importDefault(require("./uploadRoutes"));
const webCrawlerRoutes_1 = __importDefault(require("./webCrawlerRoutes"));
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    res.status(200).send("Welcome to the AroundYou API");
});
// Order matters for overlapping paths: admin/auth routes should be mounted
// before public resource routes that use broader parameterized paths.
router.use(uploadRoutes_1.default);
router.use(geocodingRoutes_1.default);
router.use(contentSuggestionRoutes_1.default);
router.use(contactTicketRoutes_1.default);
router.use(notificationRoutes_1.default);
router.use(adminRoutes_1.default);
router.use(webCrawlerRoutes_1.default);
router.use(authRoutes_1.default);
router.use(attractionRoutes_1.default);
router.use(eventRoutes_1.default);
router.use(cityRoutes_1.default);
router.use(reviewRoutes_1.default);
exports.default = router;
//# sourceMappingURL=routes.js.map