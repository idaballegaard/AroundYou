"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
function requirePermission(permission) {
    return (req, res, next) => {
        var _a, _b;
        // Permissions are normalized in verifyToken, so route checks can stay
        // declarative and avoid role-specific branching.
        const permissions = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.permissions) !== null && _b !== void 0 ? _b : [];
        if (!permissions.includes(permission)) {
            res.status(403).json({ message: "Insufficient permissions" });
            return;
        }
        next();
    };
}
//# sourceMappingURL=requirePermission.js.map