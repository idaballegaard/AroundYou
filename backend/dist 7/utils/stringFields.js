"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickTrimmedStringFields = pickTrimmedStringFields;
function pickTrimmedStringFields(payload, keys) {
    const result = {};
    keys.forEach((key) => {
        const value = payload[key];
        if (typeof value === "string") {
            result[key] = value.trim();
        }
    });
    return result;
}
//# sourceMappingURL=stringFields.js.map