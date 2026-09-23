"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const env_1 = require("./config/env");
const rateLimiter_1 = require("./middleware/rateLimiter");
const notFound_1 = require("./middleware/notFound");
const errorHandler_1 = require("./middleware/errorHandler");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
if (env_1.isProd) {
    app.set("trust proxy", 1);
}
// --- Security ---
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.env.CLIENT_URL,
    credentials: true,
}));
app.use((0, express_mongo_sanitize_1.default)()); // strips $/. operators from req.body/query/params
// --- Parsers ---
app.use(express_1.default.json({ limit: "10kb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10kb" }));
app.use((0, cookie_parser_1.default)(env_1.env.COOKIE_SECRET));
// --- Performance ---
app.use((0, compression_1.default)());
// --- Logging ---
app.use((0, morgan_1.default)(env_1.isProd ? "combined" : "dev"));
// --- Rate limiting (all /api routes) ---
app.use("/api", rateLimiter_1.globalRateLimiter);
// --- Routes ---
app.use("/api/v1", routes_1.default);
// --- 404 + centralized error handling (must be last) ---
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map