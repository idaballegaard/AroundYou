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
exports.getCurrentUser = getCurrentUser;
const userModel_1 = require("../models/userModel");
const accessControl_1 = require("../utils/accessControl");
function getCurrentUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userID = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID;
        if (!userID) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const user = yield userModel_1.UserModel.findById(userID).select("userName email firstName lastName userAvatar role permissions");
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({
            userName: user.userName,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            userAvatar: user.userAvatar,
            role: user.role,
            permissions: (0, accessControl_1.getEffectivePermissions)(user.role, user.permissions),
        });
    });
}
//# sourceMappingURL=userController.js.map