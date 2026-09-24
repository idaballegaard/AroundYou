"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDocs = setupDocs;
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
/**
 * Sets up Swagger documentation for the API.
 * @param app
 */
function setupDocs(app) {
    var _a;
    const swaggerDefinition = {
        openapi: "3.0.0",
        info: {
            title: "Around You API Documentation",
            version: "1.0.0",
            description: "API documentation for the Around You project",
        },
        servers: [
            {
                url: (_a = process.env.API_BASE_URL) !== null && _a !== void 0 ? _a : "http://localhost:4000/api",
                description: "Development server",
            },
        ],
        security: [
            {
                bearerAuth: [],
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                User: {
                    type: "object",
                    properties: {
                        firstName: { type: "string" },
                        lastName: { type: "string" },
                        userName: { type: "string" },
                        email: { type: "string" },
                        password: { type: "string" },
                    },
                },
                Attraction: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        heroImage: { type: "string" },
                        imageArray: { type: "array", items: { type: "string" } },
                        price: { type: "number" },
                        link: { type: "string" },
                        gpsPosition: { type: "string" },
                        slugArray: { type: "array", items: { type: "string" } },
                        openingHours: { type: "array", items: { type: "string" } },
                    },
                },
                City: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        tagLine: { type: "string" },
                        description: { type: "string" },
                        heroImage: { type: "string" },
                        commune: { type: "string" },
                        region: { type: "string" },
                        country: { type: "string" },
                        gpsPosition: { type: "string" },
                        population: { type: "number" },
                        visitorCenter: { type: "string" },
                    },
                },
                Event: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        heroImage: { type: "string" },
                        imageArray: { type: "array", items: { type: "string" } },
                        price: { type: "number" },
                        link: { type: "string" },
                        gpsPosition: { type: "string" },
                        slugArray: { type: "array", items: { type: "string" } },
                        isAnnual: { type: "boolean" },
                        startDate: { type: "string", format: "date-time" },
                        endDate: { type: "string", format: "date-time" },
                        openingHours: { type: "array", items: { type: "string" } },
                    },
                },
                Review: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        rating: { type: "number" },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
            },
        },
    };
    const options = {
        swaggerDefinition,
        // Route annotations live in src/docs so route files stay focused on Express wiring.
        apis: ["src/docs/*.ts", "src/routes/*.ts", "src/controllers/*.ts"],
        failOnErrors: true,
    };
    const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
    app.use("/api/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
}
//# sourceMappingURL=swaggerDocumentation.js.map