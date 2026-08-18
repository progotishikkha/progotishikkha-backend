import { CookieOptions } from "express";
import { isProd } from "../config/env";

const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/api/v1/auth",
  maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  signed: true,
};

export const clearRefreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/api/v1/auth",
  signed: true,
};

export const REFRESH_TOKEN_COOKIE_NAME = "rt";
