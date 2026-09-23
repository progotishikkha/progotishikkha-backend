"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_TOKEN_COOKIE_NAME = exports.clearRefreshCookieOptions = exports.refreshCookieOptions = void 0;
const env_1 = require("../config/env");
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
exports.refreshCookieOptions = {
    httpOnly: true,
    secure: env_1.isProd,
    sameSite: env_1.isProd ? "none" : "lax",
    path: "/api/v1/auth",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    signed: true,
};
exports.clearRefreshCookieOptions = {
    httpOnly: true,
    secure: env_1.isProd,
    sameSite: env_1.isProd ? "none" : "lax",
    path: "/api/v1/auth",
    signed: true,
};
exports.REFRESH_TOKEN_COOKIE_NAME = "rt";
//# sourceMappingURL=cookieOptions.js.map