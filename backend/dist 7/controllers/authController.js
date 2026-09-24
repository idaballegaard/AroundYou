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
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.logoutUser = logoutUser;
exports.getMe = getMe;
exports.updateMe = updateMe;
exports.restrictUser = restrictUser;
const authToken_service_1 = require("../services/authToken.service");
const auth_service_1 = require("../services/auth.service");
const auth_validators_1 = require("../validators/auth.validators");
function sendAuthServiceError(res, error) {
    res.status(error.statusCode).json({
        error: error.message,
        message: error.message,
    });
}
function sendValidationError(res, message) {
    res.status(400).json({
        error: message,
        message,
    });
}
function registerUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { error, value } = (0, auth_validators_1.validateUserRegistration)(req.body);
            if (error) {
                sendValidationError(res, error.details[0].message);
                return;
            }
            const savedUser = yield (0, auth_service_1.registerNewUser)(value);
            res.status(201).json({
                error: null,
                data: {
                    userName: savedUser.userName,
                },
            });
        }
        catch (err) {
            if (err instanceof auth_service_1.AuthServiceError) {
                sendAuthServiceError(res, err);
                return;
            }
            console.error("Register error:", err);
            res.status(500).json({
                error: "Internal server error",
                message: "Internal server error",
            });
        }
    });
}
function loginUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { error, value } = (0, auth_validators_1.validateUserLogin)(req.body);
            if (error) {
                sendValidationError(res, error.details[0].message);
                return;
            }
            const user = yield (0, auth_service_1.authenticateUser)(value);
            const token = (0, authToken_service_1.createAuthToken)(user);
            (0, authToken_service_1.setAuthCookie)(res, token);
            res.status(200).json({
                token,
                user: (0, auth_service_1.toAuthUser)(user),
            });
        }
        catch (err) {
            if (err instanceof auth_service_1.AuthServiceError) {
                sendAuthServiceError(res, err);
                return;
            }
            console.error("Login error:", err);
            res.status(500).json({
                error: "Internal server error",
                message: "Internal server error",
            });
        }
    });
}
function logoutUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, authToken_service_1.clearAuthCookie)(res);
        res.status(204).send();
    });
}
function getMe(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const userID = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID;
            if (!userID) {
                res.status(401).json({ error: "Unauthorized", message: "Unauthorized" });
                return;
            }
            const user = yield (0, auth_service_1.getUserProfile)(userID);
            const token = (0, authToken_service_1.createAuthToken)(user);
            (0, authToken_service_1.setAuthCookie)(res, token);
            res.status(200).json(Object.assign({ token }, (0, auth_service_1.toAuthUser)(user)));
        }
        catch (err) {
            if (err instanceof auth_service_1.AuthServiceError) {
                sendAuthServiceError(res, err);
                return;
            }
            console.error("GetMe error:", err);
            res.status(500).json({
                error: "Internal server error",
                message: "Internal server error",
            });
        }
    });
}
function updateMe(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const userID = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID;
            if (!userID) {
                res.status(401).json({ error: "Unauthorized", message: "Unauthorized" });
                return;
            }
            const updatedUser = yield (0, auth_service_1.updateUserProfile)(userID, req.body);
            res.status(200).json((0, auth_service_1.toAuthUser)(updatedUser));
        }
        catch (err) {
            if (err instanceof auth_service_1.AuthServiceError) {
                sendAuthServiceError(res, err);
                return;
            }
            console.error("UpdateMe error:", err);
            res.status(500).json({
                error: "Internal server error",
                message: "Internal server error",
            });
        }
    });
}
function restrictUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const userID = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID;
            if (!userID) {
                res.status(401).json({ error: "Unauthorized", message: "Unauthorized" });
                return;
            }
            const updatedUser = yield (0, auth_service_1.restrictUserProfile)(userID);
            res.status(200).json({
                message: "Account restricted",
                isRestricted: updatedUser.isRestricted,
            });
        }
        catch (err) {
            if (err instanceof auth_service_1.AuthServiceError) {
                sendAuthServiceError(res, err);
                return;
            }
            console.error("RestrictUser error:", err);
            res.status(500).json({
                error: "Internal server error",
                message: "Internal server error",
            });
        }
    });
}
//# sourceMappingURL=authController.js.map