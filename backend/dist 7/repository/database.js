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
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
function connectDB() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!process.env.DBHOST) {
                throw new Error("DBHOST is not defined");
            }
            yield mongoose_1.default.connect(process.env.DBHOST);
            console.log("Connected to MongoDB database successfully");
        }
        catch (error) {
            console.error("MongoDB connection error:", error);
            // A backend without MongoDB cannot serve meaningful API traffic, so fail
            // startup loudly instead of running in a degraded state.
            process.exit(1);
        }
    });
}
//# sourceMappingURL=database.js.map