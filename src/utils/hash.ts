import crypto from "crypto";

/**
 * Deterministic SHA-256 hash for OTPs and refresh tokens, where we need to
 * hash-then-compare a high-entropy random value quickly. Bcrypt (slow, salted)
 * is reserved for user passwords — see utils/password.ts.
 */
export const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");
