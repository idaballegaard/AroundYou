import express, { Application } from "express";
import dotenvFlow from "dotenv-flow";
import cors from "cors";

import routes from "./routes/routes";
import { setupDocs } from "./utils/swaggerDocumentation";
import { connectDB } from "./repository/database";
import { ensureDefaultAdminUser } from "./services/admin.service";

dotenvFlow.config();

const app: Application = express();

const DEFAULT_CORS_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function getAllowedCorsOrigins(): string[] {
  const configuredOrigins = [
    process.env.FRONTEND_ORIGIN,
    ...(process.env.CORS_ORIGINS ?? "").split(","),
  ]
    .map((origin) => origin?.trim())
    .filter((origin): origin is string => Boolean(origin));

  return configuredOrigins.length ? configuredOrigins : DEFAULT_CORS_ORIGINS;
}

function setupCors() {
  const allowedOrigins = new Set(getAllowedCorsOrigins());

  app.use(
    cors({
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
    }),
  );
}

function setupMiddleware() {
  app.use(express.json({ limit: "2mb" }));
}

function setupRoutes() {
  app.use("/api", routes);
}

export async function startServer() {
  setupCors();
  setupMiddleware();
  setupRoutes();

  setupDocs(app);

  // The server only starts after MongoDB and admin bootstrap complete so tests
  // and health checks do not hit a partially initialized API.
  await connectDB();
  await ensureDefaultAdminUser();

  const PORT: number = Number(process.env.PORT as string) || 4000;

  app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
  });
}
