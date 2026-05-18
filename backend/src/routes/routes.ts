import { Router, Request, Response } from "express";
import adminRoutes from "./adminRoutes";
import attractionRoutes from "./attractionRoutes";
import authRoutes from "./authRoutes";
import cityRoutes from "./cityRoutes";
import contactTicketRoutes from "./contactTicketRoutes";
import contentSuggestionRoutes from "./contentSuggestionRoutes";
import eventRoutes from "./eventRoutes";
import geocodingRoutes from "./geocodingRoutes";
import notificationRoutes from "./notificationRoutes";
import reviewRoutes from "./reviewRoutes";
import uploadRoutes from "./uploadRoutes";

const router: Router = Router();

router.get("/", (req: Request, res: Response) => {
  res.status(200).send("Welcome to the AroundYou API");
});

// Order matters for overlapping paths: admin/auth routes should be mounted
// before public resource routes that use broader parameterized paths.
router.use(uploadRoutes);
router.use(geocodingRoutes);
router.use(contentSuggestionRoutes);
router.use(contactTicketRoutes);
router.use(notificationRoutes);
router.use(adminRoutes);
router.use(authRoutes);
router.use(attractionRoutes);
router.use(eventRoutes);
router.use(cityRoutes);
router.use(reviewRoutes);

export default router;
