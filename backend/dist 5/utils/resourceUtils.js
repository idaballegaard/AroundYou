"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHideUpdate = getHideUpdate;
exports.getRestoreUpdate = getRestoreUpdate;
exports.normalizeSlug = normalizeSlug;
function getHideUpdate(hiddenBy) {
    return {
        isHidden: true,
        hiddenAt: new Date(),
        hiddenBy,
    };
}
function getRestoreUpdate() {
    return {
        isHidden: false,
        $unset: { hiddenAt: "", hiddenBy: "" },
    };
}
function normalizeSlug(value) {
    // Danish characters are normalized to route-safe ASCII slugs so old URLs and
    // frontend-generated slugs resolve consistently.
    return value
        .toLowerCase()
        .replace(/æ/g, "a")
        .replace(/ø/g, "o")
        .replace(/å/g, "a")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}
//# sourceMappingURL=resourceUtils.js.map