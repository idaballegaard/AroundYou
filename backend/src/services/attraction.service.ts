import { AttractionModel } from "../models/attractionModel";
import { buildDynamicQuery, SearchBody } from "../utils/dynamicQueryBuilder";
import {
  sanitizeContentPayload,
  sanitizeContentUpdatePayload,
} from "../utils/contentPayload";
import { getHideUpdate, getRestoreUpdate } from "../utils/resourceUtils";

// Creates a new attraction after validating and sanitizing the payload.
export async function createAttractionRecord(payload: Record<string, unknown>) {
  const attraction = new AttractionModel(
    await sanitizeContentPayload("attraction", payload),
  );
  return attraction.save();
}

// Finds all attractions matching the active visibility filter.
export function findAttractions(visibilityFilter: Record<string, unknown>) {
  return AttractionModel.find(visibilityFilter).sort({
    updateAt: -1,
  });
}

// Finds a single attraction by id while respecting visibility rules.
export function findAttractionById(
  id: string,
  visibilityFilter: Record<string, unknown>,
) {
  return AttractionModel.findOne({
    _id: id,
    ...visibilityFilter,
  });
}

// Updates an attraction after sanitizing the incoming partial payload.
export function updateAttractionRecord(
  id: string,
  payload: Record<string, unknown>,
) {
  return AttractionModel.findByIdAndUpdate(
    id,
    sanitizeContentUpdatePayload("attraction", payload),
    {
      new: true,
      runValidators: true,
    },
  );
}

// Soft-hides an attraction instead of deleting it permanently.
export function hideAttractionRecord(id: string, hiddenBy?: string) {
  return AttractionModel.findByIdAndUpdate(id, getHideUpdate(hiddenBy), {
    new: true,
  });
}

// Restores a previously hidden attraction.
export function restoreAttractionRecord(id: string) {
  return AttractionModel.findByIdAndUpdate(id, getRestoreUpdate(), {
    new: true,
  });
}

// Searches attractions by a specific field using case-insensitive matching.
export function queryAttractionsByField(
  key: string,
  value: string,
  visibilityFilter: Record<string, unknown>,
) {
  return AttractionModel.find({
    ...visibilityFilter,
    [key]: { $regex: value, $options: "i" },
  });
}

// Runs dynamic attraction search while applying visibility filtering.
export function queryAttractions(
  body: SearchBody,
  visibilityFilter: Record<string, unknown>,
) {
  const query = buildDynamicQuery(AttractionModel, body);

  return AttractionModel.find({
    ...query,
    ...visibilityFilter,
  });
}
