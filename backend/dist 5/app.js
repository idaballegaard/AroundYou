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
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const dotenv_flow_1 = __importDefault(require("dotenv-flow"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes/routes"));
const swaggerDocumentation_1 = require("./utils/swaggerDocumentation");
const database_1 = require("./repository/database");
const admin_service_1 = require("./services/admin.service");
const oplevEsbjergImportScheduler_service_1 = require("./services/oplevEsbjergImportScheduler.service");
dotenv_flow_1.default.config();
const app = (0, express_1.default)();
const DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];
function getAllowedCorsOrigins() {
    var _a;
    const configuredOrigins = [
        process.env.FRONTEND_ORIGIN,
        ...((_a = process.env.CORS_ORIGINS) !== null && _a !== void 0 ? _a : "").split(","),
    ]
        .map((origin) => origin === null || origin === void 0 ? void 0 : origin.trim())
        .filter((origin) => Boolean(origin));
    return configuredOrigins.length ? configuredOrigins : DEFAULT_CORS_ORIGINS;
}
function setupCors() {
    const allowedOrigins = new Set(getAllowedCorsOrigins());
    app.use((0, cors_1.default)({
        origin(origin, callback) {
            // Allow server-to-server/no-origin requests while still restricting browser CORS.
            if (!origin || allowedOrigins.has(origin)) {
                callback(null, true);
                return;
            }
            callback(null, false);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Authorization", "Content-Type"],
        optionsSuccessStatus: 204,
    }));
}
function setupMiddleware() {
    app.use(express_1.default.json({ limit: "2mb" }));
}
function setupJsonParseErrorHandler() {
    const jsonParseErrorHandler = (err, _req, res, next) => {
        const parseError = err;
        if (parseError instanceof SyntaxError &&
            parseError.status === 400 &&
            parseError.type === "entity.parse.failed") {
            res.status(400).json({
                message: "Ugyldig JSON. Tjek at request body er korrekt formateret.",
            });
            return;
        }
        next(err);
    };
    app.use(jsonParseErrorHandler);
}
function setupRoutes() {
    app.use("/api", routes_1.default);
}
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        setupCors();
        setupMiddleware();
        setupJsonParseErrorHandler();
        setupRoutes();
        (0, swaggerDocumentation_1.setupDocs)(app);
        // The server only starts after MongoDB and admin bootstrap complete so tests
        // and health checks do not hit a partially initialized API.
        yield (0, database_1.connectDB)();
        yield (0, admin_service_1.ensureDefaultAdminUser)();
        (0, oplevEsbjergImportScheduler_service_1.startOplevEsbjergImportScheduler)();
        const PORT = Number(process.env.PORT) || 4000;
        app.listen(PORT, () => {
            console.log(`Server is running on port: ${PORT}`);
        });
    });
}
//# sourceMappingURL=app.js.map