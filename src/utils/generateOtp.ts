import crypto from "crypto";

/** Generates a cryptographically random 6-digit numeric OTP as a string. */
export const generateOtpCode = (): string => {
  const otp = crypto.randomInt(100000, 1000000);
  return otp.toString();
};
