"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSlug = exports.getRestoreUpdate = exports.getHideUpdate = void 0;
exports.getRouteParam = getRouteParam;
exports.visibleFilter = visibleFilter;
exports.isValidationError = isValidationError;
exports.sendCreateError = sendCreateError;
var resourceUtils_1 = require("../utils/resourceUtils");
Object.defineProperty(exports, "getHideUpdate", { enumerable: true, get: function () { return resourceUtils_1.getHideUpdate; } });
Object.defineProperty(exports, "getRestoreUpdate", { enumerable: true, get: function () { return resourceUtils_1.getRestoreUpdate; } });
Object.defineProperty(exports, "normalizeSlug", { enumerable: true, get: function () { return resourceUtils_1.normalizeSlug; } });
function getRouteParam(value) {
    var _a;
    if (Array.isArray(value)) {
        return (_a = value[0]) !== null && _a !== void 0 ? _a : "";
    }
    return value !== null && value !== void 0 ? value : "";
}
function visibleFilter(req) {
    // Public endpoints never expose soft-deleted records. Admin endpoints can
    // explicitly request hidden/all records for moderation screens.
    if (!req.originalUrl.startsWith("/api/admin/")) {
        return { isHidden: { $ne: true } };
    }
    if (req.query.visibility === "hidden") {
        return { isHidden: true };
    }
    if (req.query.visibility === "all") {
        return {};
    }
    return { isHidden: { $ne: true } };
}
function isValidationError(error) {
    return error instanceof Error && error.name === "ValidationError";
}
function sendCreateError(res, error, fallbackMessage) {
    if (isValidationError(error)) {
        res.status(400).json({ message: error.message });
        return;
    }
    res.status(500).json({ message: fallbackMessage });
}
//# sourceMappingURL=controllerUtils.js.map