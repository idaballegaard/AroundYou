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
exports.ensureDefaultAdminUser = ensureDefaultAdminUser;
const bcrypt_1 = __importDefault(require("bcrypt"));
const userModel_1 = require("../models/userModel");
const enums_1 = require("../constants/enums");
function ensureDefaultAdminUser() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;
        const userName = (_a = process.env.ADMIN_USERNAME) !== null && _a !== void 0 ? _a : "admin";
        if (!email || !password) {
            return;
        }
        // Startup bootstrap is idempotent: deployments can repair missing admin
        // privileges without recreating the account or changing its password.
        const existingAdmin = yield userModel_1.UserModel.findOne({ email });
        if (existingAdmin) {
            const needsUpdate = existingAdmin.role !== "admin" ||
                existingAdmin.permissions.length !== enums_1.USER_PERMISSIONS.length;
            if (!needsUpdate) {
                return;
            }
            existingAdmin.role = "admin";
            existingAdmin.permissions = [...enums_1.USER_PERMISSIONS];
            yield existingAdmin.save();
            return;
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        yield new userModel_1.UserModel({
            firstName: (_b = process.env.ADMIN_FIRST_NAME) !== null && _b !== void 0 ? _b : "Default",
            lastName: (_c = process.env.ADMIN_LAST_NAME) !== null && _c !== void 0 ? _c : "Admin",
            userName,
            email,
            password: hashedPassword,
            role: "admin",
            permissions: [...enums_1.USER_PERMISSIONS],
        }).save();
    });
}
//# sourceMappingURL=admin.service.js.map