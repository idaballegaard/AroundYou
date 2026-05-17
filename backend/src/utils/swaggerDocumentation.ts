import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import { Application } from "express";

/**
 * Sets up Swagger documentation for the API.
 * @param app
 */
export function setupDocs(app: Application) {
  const swaggerDefinition = {
    openapi: "3.0.0",
    info: {
      title: "Around You API Documentation",
      version: "1.0.0",
      description: "API documentation for the Around You project",
    },
    servers: [
      {
        url: process.env.API_BASE_URL ?? "http://localhost:4000/api",
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
    apis: ["src/routes/*.ts", "src/controllers/*.ts"],
    failOnErrors: true,
  };

  const swaggerSpec = swaggerJSDoc(options);

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
