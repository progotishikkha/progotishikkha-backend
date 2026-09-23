"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.phoneSchema = exports.normalizeBdPhone = void 0;
const zod_1 = require("zod");
/**
 * Bangladeshi mobile numbers: optional +880/880/0 prefix, then an operator
 * digit 3-9, then 8 more digits (11 digits total in local format,
 * e.g. 01712345678 or +8801712345678).
 */
const BD_PHONE_REGEX = /^(?:\+?880|0)1[3-9]\d{8}$/;
/**
 * Normalizes any accepted variant (spaces/dashes, +880/880/0 prefix) down to
 * a single canonical local format: 01XXXXXXXXX. Stored values and API
 * responses are therefore always consistent, regardless of how the user
 * typed their number in.
 */
const normalizeBdPhone = (raw) => {
    const stripped = raw.replace(/[\s-()]/g, "");
    const withoutCountryCode = stripped.replace(/^\+?880/, "0");
    return withoutCountryCode;
};
exports.normalizeBdPhone = normalizeBdPhone;
exports.phoneSchema = zod_1.z
    .string()
    .trim()
    .transform((val) => (0, exports.normalizeBdPhone)(val))
    .refine((val) => BD_PHONE_REGEX.test(val), {
    message: "Enter a valid Bangladeshi phone number (e.g. 01712345678)",
});
//# sourceMappingURL=shared.validator.js.map