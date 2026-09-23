"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../constants/enums");
const userSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true, min: 2, max: 255 },
    lastName: { type: String, required: true, min: 2, max: 255 },
    userName: { type: String, required: true, min: 3, max: 255, unique: true },
    userAvatar: { type: String, default: "" },
    email: { type: String, required: true, min: 6, max: 255, unique: true },
    password: { type: String, required: true, min: 6, max: 255 },
    role: { type: String, enum: enums_1.USER_ROLES, default: "user", required: true },
    permissions: {
        type: [String],
        enum: enums_1.USER_PERMISSIONS,
        default: [],
        required: true,
    },
    country: { type: String, required: false },
    city: { type: String, required: false },
    street: { type: String, required: false },
    streetNumber: { type: String, required: false },
    postalCode: { type: String, required: false },
    isRestricted: { type: Boolean, default: false },
    createdAt: { type: Date, required: false, default: Date.now },
});
exports.UserModel = (0, mongoose_1.model)("User", userSchema);
//# sourceMappingURL=userModel.js.map