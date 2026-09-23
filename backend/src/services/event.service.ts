import { EventModel } from "../models/eventModel";
import { buildDynamicQuery, SearchBody } from "../utils/dynamicQueryBuilder";
import { sanitizeContentPayload, sanitizeContentUpdatePayload } from "../utils/contentPayload";
import { getHideUpdate, getRestoreUpdate } from "../utils/resourceUtils";

export async function createEventRecord(payload: Record<string, unknown>) {
  const event = new EventModel(await sanitizeContentPayload("event", payload));
  return event.save();
}

export function findEvents(visibilityFilter: Record<string, unknown>) {
  return EventModel.find(visibilityFilter);
}

export function findEventsStartingSoon(
  start: Date,
  end: Date,
  limit = 4,
) {
  return EventModel.find({
    isHidden: { $ne: true },
    startDate: { $gte: start, $lte: end },
  })
    .sort({ startDate: 1 })
    .limit(limit);
}

export function findEventById(id: string, visibilityFilter: Record<string, unknown>) {
  return EventModel.findOne({
    _id: id,
    ...visibilityFilter,
  });
}

export function updateEventRecord(id: string, payload: Record<string, unknown>) {
  return EventModel.findByIdAndUpdate(id, sanitizeContentUpdatePayload("event", payload), {
    new: true,
    runValidators: true,
  });
}

export function hideEventRecord(id: string, hiddenBy?: string) {
  return EventModel.findByIdAndUpdate(id, getHideUpdate(hiddenBy), {
    new: true,
  });
}

export async function archiveExpiredEventRecords(referenceTime = new Date()): Promise<number> {
  const result = await EventModel.updateMany(
    {
      isHidden: { $ne: true },
      // Annual events are managed by admins and must not disappear merely
      // because last year's saved date has passed.
      isAnnual: { $ne: true },
      endDate: { $lt: referenceTime },
    },
    {
      $set: {
        isHidden: true,
        hiddenAt: referenceTime,
        hiddenBy: "system",
      },
    },
  );

  return result.modifiedCount;
}

export function restoreEventRecord(id: string) {
  return EventModel.findByIdAndUpdate(id, getRestoreUpdate(), {
    new: true,
  });
}

export function queryEventsByField(
  key: string,
  value: string,
  visibilityFilter: Record<string, unknown>,
) {
  return EventModel.find({
    ...visibilityFilter,
    [key]: { $regex: value, $options: "i" },
  });
}

export function queryEvents(
  body: SearchBody,
  visibilityFilter: Record<string, unknown>,
) {
  const query = buildDynamicQuery(EventModel, body);

  return EventModel.find({
    ...query,
    ...visibilityFilter,
  });
}
