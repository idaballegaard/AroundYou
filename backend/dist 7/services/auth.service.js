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
exports.AuthServiceError = void 0;
exports.toAuthUser = toAuthUser;
exports.registerNewUser = registerNewUser;
exports.authenticateUser = authenticateUser;
exports.getUserProfile = getUserProfile;
exports.updateUserProfile = updateUserProfile;
exports.restrictUserProfile = restrictUserProfile;
const bcrypt_1 = __importDefault(require("bcrypt"));
const userModel_1 = require("../models/userModel");
const accessControl_1 = require("../utils/accessControl");
const stringFields_1 = require("../utils/stringFields");
class AuthServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AuthServiceError";
    }
}
exports.AuthServiceError = AuthServiceError;
function toAuthUser(user) {
    // Keep auth responses free of database-only fields and always expand the
    // effective permissions so the frontend does not need to understand role
    // inheritance rules.
    return {
        userName: user.userName,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userAvatar: user.userAvatar,
        role: user.role,
        permissions: (0, accessControl_1.getEffectivePermissions)(user.role, user.permissions),
    };
}
function registerNewUser(input) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check unique fields before hashing so validation errors stay specific and
        // cheap compared with bcrypt work.
        const emailExists = yield userModel_1.UserModel.findOne({ email: input.email });
        if (emailExists) {
            throw new AuthServiceError("Email already exists", 409);
        }
        const userNameExists = yield userModel_1.UserModel.findOne({
            userName: input.userName,
        });
        if (userNameExists) {
            throw new AuthServiceError("Username already exists", 409);
        }
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(input.password, salt);
        const user = new userModel_1.UserModel({
            firstName: input.firstName,
            lastName: input.lastName,
            userName: input.userName,
            email: input.email,
            password: hashedPassword,
        });
        return user.save();
    });
}
function authenticateUser(input) {
    return __awaiter(this, void 0, void 0, function* () {
        // Users can log in with either email or username. The failure message stays
        // generic so attackers cannot enumerate registered identifiers.
        const user = yield userModel_1.UserModel.findOne({
            $or: [{ email: input.identifier }, { userName: input.identifier }],
        });
        if (!user) {
            throw new AuthServiceError("Invalid credentials", 401);
        }
        const validPassword = yield bcrypt_1.default.compare(input.password, user.password);
        if (!validPassword) {
            throw new AuthServiceError("Invalid credentials", 401);
        }
        if (user.isRestricted) {
            throw new AuthServiceError("Brugeren kan ikke logge ind, fordi kontoen er begrænset.", 403);
        }
        return user;
    });
}
function getUserProfile(userID) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield userModel_1.UserModel.findById(userID).select("-password");
        if (!user) {
            throw new AuthServiceError("User not found", 404);
        }
        return user;
    });
}
function updateUserProfile(userID, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        // Only whitelisted string fields are accepted from the profile endpoint; role,
        // permissions, password, and restriction state cannot be changed here.
        const updates = (0, stringFields_1.pickTrimmedStringFields)(payload, [
            "userName",
            "email",
            "firstName",
            "lastName",
            "userAvatar",
            "country",
            "city",
            "street",
            "streetNumber",
            "postalCode",
        ]);
        const updatedUser = yield userModel_1.UserModel.findByIdAndUpdate(userID, updates, {
            new: true,
            runValidators: true,
        }).select("userName email firstName lastName userAvatar role permissions");
        if (!updatedUser) {
            throw new AuthServiceError("User not found", 404);
        }
        return updatedUser;
    });
}
function restrictUserProfile(userID) {
    return __awaiter(this, void 0, void 0, function* () {
        // "Delete account" is implemented as restriction so historical user-generated
        // content can remain while the account can no longer authenticate.
        const updatedUser = yield userModel_1.UserModel.findByIdAndUpdate(userID, { isRestricted: true }, { new: true, runValidators: true }).select("isRestricted");
        if (!updatedUser) {
            throw new AuthServiceError("User not found", 404);
        }
        return updatedUser;
    });
}
//# sourceMappingURL=auth.service.js.map