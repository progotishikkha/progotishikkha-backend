"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProd = exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]).default("development"),
    PORT: zod_1.z.coerce.number().default(5000),
    CLIENT_URL: zod_1.z.string().url(),
    MONGODB_URI: zod_1.z.string().min(1, "MONGODB_URI is required"),
    JWT_ACCESS_SECRET: zod_1.z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
    JWT_ACCESS_EXPIRES_IN: zod_1.z.string().default("15m"),
    JWT_REFRESH_SECRET: zod_1.z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default("7d"),
    COOKIE_SECRET: zod_1.z.string().min(16),
    BCRYPT_SALT_ROUNDS: zod_1.z.coerce.number().default(12),
    RESEND_API_KEY: zod_1.z.string().min(1, "RESEND_API_KEY is required"),
    EMAIL_FROM: zod_1.z.string().min(1).default("Progoti Shikkha <onboarding@resend.dev>"),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().min(1),
    CLOUDINARY_API_KEY: zod_1.z.string().min(1),
    CLOUDINARY_API_SECRET: zod_1.z.string().min(1),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(900_000),
    RATE_LIMIT_MAX: zod_1.z.coerce.number().default(100),
    // NOTE: kept for backwards compatibility with existing .env files, but the
    // actual donation calculation uses the hardcoded 10% constant in
    // services/donation.service.ts (DONATION_PERCENTAGE), not this variable.
    // The business rule is a fixed 10%, not something an env var should be
    // able to change without a code review. Do not wire this back into the
    // calculation path.
    DONATION_PERCENTAGE: zod_1.z.coerce.number().min(0).max(100).default(10),
    DONATION_BKASH_NUMBER: zod_1.z.string().min(1),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("❌ Invalid environment variables:\n", parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
exports.isProd = exports.env.NODE_ENV === "production";
//# sourceMappingURL=env.js.map