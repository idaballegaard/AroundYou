"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTH_COOKIE_NAME = void 0;
exports.createAuthToken = createAuthToken;
exports.setAuthCookie = setAuthCookie;
exports.clearAuthCookie = clearAuthCookie;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const accessControl_1 = require("../utils/accessControl");
exports.AUTH_COOKIE_NAME = "aroundyou_auth";
function shouldUseSecureCookie() {
    var _a;
    return (process.env.NODE_ENV === "production" ||
        process.env.RENDER === "true" ||
        ((_a = process.env.FRONTEND_ORIGIN) === null || _a === void 0 ? void 0 : _a.startsWith("https://")) === true);
}
const useSecureCookie = shouldUseSecureCookie();
const AUTH_COOKIE_OPTIONS = {
    // The frontend stores the bearer token in memory. This HttpOnly cookie lets
    // the backend restore a session after refresh without exposing the token to JS.
    httpOnly: true,
    secure: useSecureCookie,
    sameSite: useSecureCookie ? "none" : "lax",
    path: "/api",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
function createAuthToken(user) {
    // Keep this expiry aligned with AUTH_COOKIE_OPTIONS.maxAge so browser refreshes
    // do not preserve an already-expired token.
    return jsonwebtoken_1.default.sign({
        userID: user._id.toString(),
        userName: user.userName,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: (0, accessControl_1.getEffectivePermissions)(user.role, user.permissions),
    }, process.env.TOKEN_SECRET, { expiresIn: "7d" });
}
function setAuthCookie(res, token) {
    // Always set the cookie when issuing/refeshing a token so browser refresh and
    // direct API calls share the same session source.
    res.cookie(exports.AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
}
function clearAuthCookie(res) {
    res.clearCookie(exports.AUTH_COOKIE_NAME, Object.assign(Object.assign({}, AUTH_COOKIE_OPTIONS), { maxAge: undefined }));
}
//# sourceMappingURL=authToken.service.js.map