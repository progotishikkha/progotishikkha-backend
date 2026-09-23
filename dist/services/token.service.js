"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expiresInToDate = exports.verifyRefreshToken = exports.verifyAccessToken = exports.signRefreshToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const signAccessToken = (payload) => jsonwebtoken_1.default.sign(payload, env_1.env.JWT_ACCESS_SECRET, {
    expiresIn: env_1.env.JWT_ACCESS_EXPIRES_IN,
});
exports.signAccessToken = signAccessToken;
const signRefreshToken = (payload) => jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, {
    expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN,
});
exports.signRefreshToken = signRefreshToken;
const verifyAccessToken = (token) => jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
exports.verifyRefreshToken = verifyRefreshToken;
/** Converts a JWT expiresIn string like "7d" / "15m" into a future Date. */
const expiresInToDate = (expiresIn) => {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match)
        return new Date(Date.now() + 15 * 60 * 1000); // fallback: 15m
    const value = Number(match[1]);
    const unit = match[2];
    const unitMs = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + value * unitMs[unit]);
};
exports.expiresInToDate = expiresInToDate;
//# sourceMappingURL=token.service.js.map