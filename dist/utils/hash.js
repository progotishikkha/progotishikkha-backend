"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256 = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Deterministic SHA-256 hash for OTPs and refresh tokens, where we need to
 * hash-then-compare a high-entropy random value quickly. Bcrypt (slow, salted)
 * is reserved for user passwords — see utils/password.ts.
 */
const sha256 = (value) => crypto_1.default.createHash("sha256").update(value).digest("hex");
exports.sha256 = sha256;
//# sourceMappingURL=hash.js.map