import { Types } from "mongoose";
import { Otp, OtpPurpose } from "../models/otp.model";
import { generateOtpCode } from "../utils/generateOtp";
import { sha256 } from "../utils/hash";
import { ApiError } from "../utils/ApiError";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

export const issueOtp = async (
  userId: Types.ObjectId,
  purpose: OtpPurpose
): Promise<string> => {
  // Invalidate any previous unused OTPs of the same purpose for this user.
  await Otp.deleteMany({ user: userId, purpose });

  const code = generateOtpCode();

  await Otp.create({
    user: userId,
    purpose,
    codeHash: sha256(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  return code; // caller emails this; it is never stored in plaintext
};

export const verifyOtp = async (
  userId: Types.ObjectId,
  purpose: OtpPurpose,
  code: string
): Promise<void> => {
  const otp = await Otp.findOne({ user: userId, purpose }).sort({ createdAt: -1 });

  if (!otp) {
    throw ApiError.badRequest("OTP not found or already used. Please request a new one.");
  }

  if (otp.expiresAt < new Date()) {
    await otp.deleteOne();
    throw ApiError.badRequest("OTP has expired. Please request a new one.");
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    await otp.deleteOne();
    throw ApiError.tooManyRequests("Too many incorrect attempts. Please request a new OTP.");
  }

  if (otp.codeHash !== sha256(code)) {
    otp.attempts += 1;
    await otp.save();
    throw ApiError.badRequest("Incorrect OTP code.");
  }

  await otp.deleteOne();
};
