"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = require("../models/userModel");
const accessControl_1 = require("../utils/accessControl");
const authToken_service_1 = require("../services/authToken.service");
function getCookieValue(cookieHeader, name) {
    // Avoid adding a cookie parser dependency for one known auth cookie.
    if (!cookieHeader) {
        return null;
    }
    const cookie = cookieHeader
        .split(";")
        .map((entry) => entry.trim())
        .find((entry) => entry.startsWith(`${name}=`));
    if (!cookie) {
        return null;
    }
    return decodeURIComponent(cookie.slice(name.length + 1));
}
function getRequestToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer ")) {
        return authHeader.split(" ")[1];
    }
    // The frontend keeps tokens in memory, so refresh recovery depends on this
    // HttpOnly cookie fallback.
    return getCookieValue(req.headers.cookie, authToken_service_1.AUTH_COOKIE_NAME);
}
function verifyToken(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = getRequestToken(req);
        if (!token) {
            res.status(401).json({ message: "No token provided" });
            return;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.TOKEN_SECRET);
            if (typeof decoded === "string") {
                res.status(401).json({ message: "Invalid token format" });
                return;
            }
            const payload = decoded;
            // Re-read the user on every authenticated request so role/permission changes
            // and account restrictions take effect before the JWT naturally expires.
            const user = yield userModel_1.UserModel.findById(payload.userID).select("userName email firstName lastName role permissions isRestricted");
            if (!user || user.isRestricted) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }
            const role = (0, accessControl_1.normalizeRole)(user.role);
            const permissions = (0, accessControl_1.getEffectivePermissions)(role, (0, accessControl_1.normalizePermissions)(user.permissions));
            req.user = {
                // Downstream controllers trust req.user as the normalized authorization
                // context, not as a full user profile.
                userID: payload.userID,
                userName: user.userName,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role,
                permissions,
            };
            next();
        }
        catch (err) {
            res.status(401).json({ message: "Invalid token" });
        }
    });
}
//# sourceMappingURL=verifyUserToken.js.map