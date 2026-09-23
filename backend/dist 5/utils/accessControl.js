"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeRole = normalizeRole;
exports.normalizePermissions = normalizePermissions;
exports.getEffectivePermissions = getEffectivePermissions;
const enums_1 = require("../constants/enums");
const ROLE_PERMISSION_MAP = {
    user: [
        "content:suggest",
        "review:read",
        "review:create",
        "review:update",
        "review:delete",
    ],
    admin: [...enums_1.USER_PERMISSIONS],
};
function normalizeRole(role) {
    // Unknown roles are intentionally downgraded to user instead of trusted.
    return role === "admin" ? "admin" : "user";
}
function normalizePermissions(permissions) {
    // JWT/database permission arrays are treated as untrusted input at the auth
    // boundary and filtered against the enum.
    if (!Array.isArray(permissions)) {
        return [];
    }
    const validPermissions = new Set(enums_1.USER_PERMISSIONS);
    return permissions.filter((permission) => typeof permission === "string" &&
        validPermissions.has(permission));
}
function getEffectivePermissions(role, permissions) {
    // Explicit permissions are additive; roles provide the baseline.
    return Array.from(new Set([...ROLE_PERMISSION_MAP[role], ...permissions]));
}
//# sourceMappingURL=accessControl.js.map