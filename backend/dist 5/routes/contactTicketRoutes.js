"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contactTicketController_1 = require("../controllers/contactTicketController");
const rateLimit_1 = require("../middleware/rateLimit");
const verifyUserToken_1 = require("../middleware/verifyUserToken");
const router = (0, express_1.Router)();
router.post("/contact/tickets", verifyUserToken_1.verifyToken, rateLimit_1.contactRateLimiter, contactTicketController_1.createContactTicket);
exports.default = router;
//# sourceMappingURL=contactTicketRoutes.js.map