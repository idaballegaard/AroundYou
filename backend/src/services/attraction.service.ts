import { AttractionModel } from "../models/attractionModel";
import { buildDynamicQuery, SearchBody } from "../utils/dynamicQueryBuilder";
import { sanitizeContentPayload, sanitizeContentUpdatePayload } from "../utils/contentPayload";
import { getHideUpdate, getRestoreUpdate } from "../utils/resourceUtils";

export async function createAttractionRecord(payload: Record<string, unknown>) {
  const attraction = new AttractionModel(await sanitizeContentPayload("attraction", payload));
  return attraction.save();
}

export function findAttractions(visibilityFilter: Record<string, unknown>) {
  return AttractionModel.find(visibilityFilter).sort({
    updateAt: -1,
  });
}

export function findAttractionById(id: string, visibilityFilter: Record<string, unknown>) {
  return AttractionModel.findOne({
    _id: id,
    ...visibilityFilter,
  });
}

export function updateAttractionRecord(id: string, payload: Record<string, unknown>) {
  return AttractionModel.findByIdAndUpdate(id, sanitizeContentUpdatePayload("attraction", payload), {
    new: true,
    runValidators: true,
  });
}

export function hideAttractionRecord(id: string, hiddenBy?: string) {
  return AttractionModel.findByIdAndUpdate(id, getHideUpdate(hiddenBy), {
    new: true,
  });
}

export function restoreAttractionRecord(id: string) {
  return AttractionModel.findByIdAndUpdate(id, getRestoreUpdate(), {
    new: true,
  });
}

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
