"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserRegistration = validateUserRegistration;
exports.validateUserLogin = validateUserLogin;
const joi_1 = __importDefault(require("joi"));
const userRegistrationSchema = joi_1.default.object({
    // These limits mirror the user model enough to fail fast before database
    // validation, while database uniqueness still remains authoritative.
    firstName: joi_1.default.string().min(2).max(255).required(),
    lastName: joi_1.default.string().min(2).max(255).required(),
    userName: joi_1.default.string().min(2).max(255).required(),
    email: joi_1.default.string().email().min(5).max(255).required(),
    password: joi_1.default.string().min(6).max(30).required(),
});
const userLoginSchema = joi_1.default.object({
    identifier: joi_1.default.string().required(),
    password: joi_1.default.string().min(6).max(30).required(),
});
function validateUserRegistration(data) {
    return userRegistrationSchema.validate(data);
}
function validateUserLogin(data) {
    return userLoginSchema.validate(data);
}
//# sourceMappingURL=auth.validators.js.map