"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDynamicQuery = buildDynamicQuery;
const ALLOWED_NUMBER_OPERATORS = new Set(["$eq", "$gte", "$gt", "$lte", "$lt"]);
function buildNumberQueryValue(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return Number(value);
    }
    const queryValue = {};
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
function buildDynamicQuery(model, body) {
    const field = body.key;
    const value = body.value;
    // Only allow querying fields that exist on the model schema. This keeps
    // generic search endpoints from becoming unrestricted Mongo query surfaces.
    const schemaPath = model.schema.path(field);
    if (!schemaPath) {
        throw new Error(`Unknown field: ${field}`);
    }
    let query;
    switch (schemaPath.instance) {
        case "String":
            query = {
                [field]: { $regex: String(value), $options: "i" },
            };
            break;
        case "Number":
            query = { [field]: buildNumberQueryValue(value) };
            break;
        case "Date":
            query = { [field]: new Date(value) };
            break;
        case "Boolean":
            query = {
                [field]: value === true || value === "true" || value === 1 || value === "1",
            };
            break;
        default:
            query = { [field]: value };
    }
    return query;
}
//# sourceMappingURL=dynamicQueryBuilder.js.map