import { Request, Response } from "express";
import {
  getRouteParam,
  isValidationError,
  sendCreateError,
  visibleFilter,
} from "./controllerUtils";
import {
  createEventRecord,
  findEventById,
  findEvents,
  findEventsStartingSoon,
  hideEventRecord,
  queryEvents,
  queryEventsByField,
  restoreEventRecord,
  updateEventRecord,
} from "../services/event.service";

function getCurrentTime(value: unknown): Date {
  if (typeof value !== "string") {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function getEventsStartingSoon(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    // The browser supplies its current time so this stays accurate for the
    // user's timezone; invalid values safely fall back to the server clock.
    const start = getCurrentTime(req.query.from);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    res.status(200).json(await findEventsStartingSoon(start, end));
  } catch (err) {
    console.error("Error fetching events starting soon:", err);
    res.status(500).json({ message: "Error retrieving events starting soon" });
  }
}

/**
 * CREATE EVENT
 */
export async function createEvent(req: Request, res: Response): Promise<void> {
  try {
    const result = await createEventRecord(req.body as Record<string, unknown>);

    res.status(201).json(result);
  } catch (err) {
    console.error("Error creating event:", err);
    sendCreateError(res, err, "Error creating event");
  }
}

/**
 * GET ALL EVENTS
 */
export async function getAllEvents(req: Request, res: Response): Promise<void> {
  try {
    const result = await findEvents(visibleFilter(req));
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({
      message: "Error retrieving events",
    });
  }
}

/**
 * GET EVENT BY ID
 */
export async function getEventById(req: Request, res: Response): Promise<void> {
  try {
    const result = await findEventById(getRouteParam(req.params.id), visibleFilter(req));

    if (!result) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching event:", err);
    res.status(500).json({
      message: "Error retrieving event",
    });
  }
}

/**
 * UPDATE EVENT
 */
export async function updateEventById(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const result = await updateEventRecord(
      getRouteParam(req.params.id),
      req.body as Record<string, unknown>,
    );

    if (!result) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    res.status(200).json({
      message: "Event updated successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error updating event:", err);
    if (isValidationError(err)) {
      res.status(400).json({ message: err.message });
      return;
    }

    res.status(500).json({
      message: "Error updating event",
    });
  }
}

/**
 * HIDE EVENT
 */
export async function deleteEventById(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const result = await hideEventRecord(getRouteParam(req.params.id), req.user?.userID);

    if (!result) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    res.status(200).json({ message: "Event hidden successfully", data: result });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({
      message: "Error deleting event",
    });
  }
}

export async function restoreEventById(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const result = await restoreEventRecord(getRouteParam(req.params.id));

    if (!result) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    res.status(200).json({ message: "Event restored successfully", data: result });
  } catch (err) {
    console.error("Error restoring event:", err);
    res.status(500).json({
      message: "Error restoring event",
    });
  }
}

/**
 * QUERY EVENT (KEY / VALUE)
 */
export async function getEventByQuery(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const key = req.params.key as string;
    const value = req.params.value as string;

    const result = await queryEventsByField(key, value, visibleFilter(req));

    res.status(200).json(result);
  } catch (err) {
    console.error("Error querying events:", err);
    res.status(500).json({
      message: "Error retrieving events by query",
    });
  }
}

/**
 * GENERIC QUERY
 */
export async function getEventByGenericQuery(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const result = await queryEvents(req.body, visibleFilter(req));

    res.status(200).json(result);
  } catch (err) {
    console.error("Error generic event query:", err);
    res.status(500).json({
      message: "Error retrieving events",
    });
  }
}
