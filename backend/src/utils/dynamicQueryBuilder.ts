import { QueryFilter, Model } from "mongoose";

export interface SearchBody {
  key: string;
  value: unknown;
}

const ALLOWED_NUMBER_OPERATORS = new Set(["$eq", "$gte", "$gt", "$lte", "$lt"]);

function buildNumberQueryValue(
  value: unknown,
): number | Record<string, number> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return Number(value);
  }

  const queryValue: Record<string, number> = {};

  for (const [operator, operatorValue] of Object.entries(value)) {
    if (!ALLOWED_NUMBER_OPERATORS.has(operator)) {
      throw new Error(`Unsupported number query operator: ${operator}`);
    }

    const numericValue = Number(operatorValue);

    if (!Number.isFinite(numericValue)) {
      throw new Error(`Invalid number query value for ${operator}`);
    }

    queryValue[operator] = numericValue;
  }

  return queryValue;
}

export function buildDynamicQuery<T>(
  model: Model<T>,
  body: SearchBody,
): QueryFilter<T> {
  const field = body.key;
  const value = body.value;

  // Only allow querying fields that exist on the model schema. This keeps
  // generic search endpoints from becoming unrestricted Mongo query surfaces.
  const schemaPath = model.schema.path(field);

  if (!schemaPath) {
    throw new Error(`Unknown field: ${field}`);
  }

  let query: QueryFilter<T>;

  switch (schemaPath.instance) {
    case "String":
      query = {
        [field]: { $regex: String(value), $options: "i" },
      } as QueryFilter<T>;
      break;

    case "Number":
      query = { [field]: buildNumberQueryValue(value) } as QueryFilter<T>;
      break;

    case "Date":
      query = { [field]: new Date(value as string | number) } as QueryFilter<T>;
      break;

    case "Boolean":
      query = {
        [field]:
          value === true || value === "true" || value === 1 || value === "1",
      } as QueryFilter<T>;
      break;

    default:
      query = { [field]: value } as QueryFilter<T>;
  }

  return query;
}
