"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtp = exports.issueOtp = void 0;
const otp_model_1 = require("../models/otp.model");
const generateOtp_1 = require("../utils/generateOtp");
const hash_1 = require("../utils/hash");
const ApiError_1 = require("../utils/ApiError");
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const issueOtp = async (userId, purpose) => {
    // Invalidate any previous unused OTPs of the same purpose for this user.
    await otp_model_1.Otp.deleteMany({ user: userId, purpose });
    const code = (0, generateOtp_1.generateOtpCode)();
    await otp_model_1.Otp.create({
        user: userId,
        purpose,
        codeHash: (0, hash_1.sha256)(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });
    return code; // caller emails this; it is never stored in plaintext
};
exports.issueOtp = issueOtp;
const verifyOtp = async (userId, purpose, code) => {
    const otp = await otp_model_1.Otp.findOne({ user: userId, purpose }).sort({ createdAt: -1 });
    if (!otp) {
        throw ApiError_1.ApiError.badRequest("OTP not found or already used. Please request a new one.");
    }
    if (otp.expiresAt < new Date()) {
        await otp.deleteOne();
        throw ApiError_1.ApiError.badRequest("OTP has expired. Please request a new one.");
    }
    if (otp.attempts >= MAX_ATTEMPTS) {
        await otp.deleteOne();
        throw ApiError_1.ApiError.tooManyRequests("Too many incorrect attempts. Please request a new OTP.");
    }
    if (otp.codeHash !== (0, hash_1.sha256)(code)) {
        otp.attempts += 1;
        await otp.save();
        throw ApiError_1.ApiError.badRequest("Incorrect OTP code.");
    }
    await otp.deleteOne();
};
exports.verifyOtp = verifyOtp;
//# sourceMappingURL=otp.service.js.map