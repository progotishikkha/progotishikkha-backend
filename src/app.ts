import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";

import { env, isProd } from "./config/env";
import { globalRateLimiter } from "./middleware/rateLimiter";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";

const app: Application = express();

if (isProd) {
  app.set("trust proxy", 1);
}

// --- Security ---
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(mongoSanitize()); // strips $/. operators from req.body/query/params

// --- Parsers ---
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser(env.COOKIE_SECRET));

// --- Performance ---
app.use(compression());

// --- Logging ---
app.use(morgan(isProd ? "combined" : "dev"));

// --- Rate limiting (all /api routes) ---
app.use("/api", globalRateLimiter);

// --- Routes ---
app.use("/api/v1", routes);

// --- 404 + centralized error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

export default app;
