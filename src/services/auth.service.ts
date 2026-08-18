import crypto from "crypto";
import { Types } from "mongoose";
import { User, IUser } from "../models/user.model";
import { PendingRegistration } from "../models/pendingRegistration.model";
import { StudentProfile } from "../models/studentProfile.model";
import { TutorProfile } from "../models/tutorProfile.model";
import { hashPassword, comparePassword } from "../utils/password";
import { sha256 } from "../utils/hash";
import { ApiError } from "../utils/ApiError";
import { issueOtp, verifyOtp as verifyOtpCode } from "./otp.service";
import { generateOtpCode } from "../utils/generateOtp";
import { sendVerificationOtpEmail, sendPasswordResetOtpEmail } from "./email.service";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  expiresInToDate,
} from "./token.service";
import { env } from "../config/env";
import { RegisterInput, LoginInput, ResetPasswordInput } from "../validators/auth.validator";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// How long an unverified account is allowed to sit before it's auto-deleted
// (see the TTL index on User.unverifiedExpiresAt). Long enough that a person
// has a real chance to find the OTP email / ask for a resend, short enough
// that a typo'd or undeliverable email address doesn't permanently squat on
// a unique email/phone.
const UNVERIFIED_ACCOUNT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const createSession = async (
  user: IUser,
  meta: { userAgent?: string; ip?: string }
): Promise<TokenPair> => {
  const sessionId = crypto.randomUUID();

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ sub: user._id.toString(), sid: sessionId });

  // Defensive: refreshSessions is `select: false` on the schema, so any caller
  // that fetched this user without explicitly re-including it would otherwise
  // have `user.refreshSessions === undefined` here, crashing on .push().
  if (!user.refreshSessions) {
    user.refreshSessions = [];
  }

  user.refreshSessions.push({
    tokenHash: sha256(`${sessionId}:${refreshToken}`),
    userAgent: meta.userAgent,
    ip: meta.ip,
    expiresAt: expiresInToDate(env.JWT_REFRESH_EXPIRES_IN),
    createdAt: new Date(),
  });

  // Cap concurrent sessions per user to avoid unbounded growth.
  if (user.refreshSessions.length > 10) {
    user.refreshSessions = user.refreshSessions.slice(-10);
  }

  await user.save();

  return { accessToken, refreshToken };
};

const PENDING_REGISTRATION_TTL_MS = 24 * 60 * 60 * 1000;
const REGISTRATION_OTP_TTL_MS = 10 * 60 * 1000;
const MAX_REGISTRATION_OTP_ATTEMPTS = 5;

const issuePendingRegistrationOtp = async (pending: { otpHash: string; otpExpiresAt: Date; otpAttempts: number; save: () => Promise<unknown> }) => {
  const code = generateOtpCode();
  pending.otpHash = sha256(code);
  pending.otpAttempts = 0;
  pending.otpExpiresAt = new Date(Date.now() + REGISTRATION_OTP_TTL_MS);
  await pending.save();
  return code;
};

const verifyPendingRegistrationOtp = async (pending: { otpHash: string; otpExpiresAt: Date; otpAttempts: number; save: () => Promise<unknown> }, code: string) => {
  if (pending.otpExpiresAt < new Date()) {
    throw ApiError.badRequest("OTP has expired. Please request a new one.");
  }

  if (pending.otpAttempts >= MAX_REGISTRATION_OTP_ATTEMPTS) {
    throw ApiError.tooManyRequests("Too many incorrect attempts. Please request a new OTP.");
  }

  if (pending.otpHash !== sha256(code)) {
    pending.otpAttempts += 1;
    await pending.save();
    throw ApiError.badRequest("Incorrect OTP code.");
  }
};

export const registerUser = async (input: RegisterInput): Promise<{ otpEmailSent: boolean }> => {
  const email = input.email.trim().toLowerCase();

  // IMPORTANT: Do not create a User document before email verification.
  // Check both permanent accounts and any existing pending registration.
  const [existingUser, existingPending] = await Promise.all([
    User.findOne({ $or: [{ email }, { phone: input.phone }] }).select("+passwordHash"),
    PendingRegistration.findOne({ $or: [{ email }, { phone: input.phone }] }),
  ]);

  if (existingUser) {
    throw ApiError.conflict("An account with this email or phone already exists");
  }

  if (existingPending) {
    // A previous unfinished registration is replaceable. This lets a person
    // correct a typo or restart verification without a stale record blocking them.
    await existingPending.deleteOne();
  }

  const passwordHash = await hashPassword(input.password);
  const code = generateOtpCode();
  const pending = await PendingRegistration.create({
    fullName: input.fullName,
    email,
    phone: input.phone,
    passwordHash,
    role: input.role,
    otpHash: sha256(code),
    otpAttempts: 0,
    otpExpiresAt: new Date(Date.now() + REGISTRATION_OTP_TTL_MS),
    expiresAt: new Date(Date.now() + PENDING_REGISTRATION_TTL_MS),
  });
  let otpEmailSent = true;

  try {
    await sendVerificationOtpEmail(pending.email, pending.fullName, code);
  } catch (err) {
    otpEmailSent = false;
    console.error("Failed to send verification OTP email (register):", err);
  }

  return { otpEmailSent };
};

export const resendVerificationOtp = async (email: string): Promise<{ otpEmailSent: boolean }> => {
  const normalizedEmail = email.trim().toLowerCase();
  const pending = await PendingRegistration.findOne({ email: normalizedEmail });

  // Keep the response deliberately generic so registration state cannot be
  // used to enumerate existing accounts.
  if (!pending) return { otpEmailSent: true };

  const code = await issuePendingRegistrationOtp(pending);
  pending.expiresAt = new Date(Date.now() + PENDING_REGISTRATION_TTL_MS);
  await pending.save();

  try {
    await sendVerificationOtpEmail(pending.email, pending.fullName, code);
    return { otpEmailSent: true };
  } catch (err) {
    console.error("Failed to send verification OTP email (resend):", err);
    return { otpEmailSent: false };
  }
};

export const verifyEmailOtp = async (
  email: string,
  code: string,
  meta: { userAgent?: string; ip?: string }
): Promise<{ user: IUser; tokens: TokenPair }> => {
  const normalizedEmail = email.trim().toLowerCase();
  const pending = await PendingRegistration.findOne({ email: normalizedEmail });

  if (!pending) {
    // If a verified account already exists, make the error explicit; otherwise
    // the pending registration may simply have expired and needs a new signup.
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser?.isVerified) throw ApiError.badRequest("Account is already verified");
    throw ApiError.badRequest("Verification request not found or expired. Please register again.");
  }

  await verifyPendingRegistrationOtp(pending, code);

  // The first write to the User collection happens HERE, after OTP verification.
  // From this point onward the account is permanent and can receive sessions.
  const conflictingUser = await User.findOne({
    $or: [{ email: pending.email }, { phone: pending.phone }],
  });
  if (conflictingUser) {
    await pending.deleteOne();
    throw ApiError.conflict("An account with this email or phone already exists");
  }

  let user: IUser | undefined;
  try {
    user = await User.create({
      fullName: pending.fullName,
      email: pending.email,
      phone: pending.phone,
      passwordHash: pending.passwordHash,
      role: pending.role,
      isVerified: true,
      isActive: true,
      unverifiedExpiresAt: null,
    });

    if (user.role === "student") {
      await StudentProfile.create({ user: user._id });
    } else if (user.role === "tutor") {
      await TutorProfile.create({ user: user._id });
    }

    await pending.deleteOne();
  } catch (error) {
    // Do not leave a half-created account if profile creation fails. The
    // pending registration remains available for a retry.
    if (user) {
      await User.deleteOne({ _id: user._id });
    }
    throw error;
  }

  if (!user) throw ApiError.internal("Failed to create account");

  const tokens = await createSession(user, meta);
  return { user, tokens };
};

export const loginUser = async (
  input: LoginInput,
  meta: { userAgent?: string; ip?: string }
): Promise<{ user: IUser; tokens: TokenPair }> => {
  const user = await User.findOne({ email: input.email }).select("+passwordHash +refreshSessions");
  if (!user) throw ApiError.unauthorized("Invalid email or password");

  const isMatch = await comparePassword(input.password, user.passwordHash);
  if (!isMatch) throw ApiError.unauthorized("Invalid email or password");

  if (!user.isVerified || !user.isActive) {
    throw ApiError.forbidden("Please verify your email before logging in");
  }

  if (user.isSuspended) {
    throw ApiError.forbidden("This account has been suspended");
  }

  const tokens = await createSession(user, meta);
  return { user, tokens };
};

export const refreshSession = async (
  refreshToken: string,
  meta: { userAgent?: string; ip?: string }
): Promise<TokenPair> => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const user = await User.findById(payload.sub).select("+refreshSessions");
  if (!user) throw ApiError.unauthorized("Invalid refresh token");

  const incomingHash = sha256(`${payload.sid}:${refreshToken}`);
  const sessionIndex = user.refreshSessions.findIndex((s) => s.tokenHash === incomingHash);

  if (sessionIndex === -1) {
    // Token reuse or forgery — invalidate all sessions as a precaution.
    user.refreshSessions = [];
    await user.save();
    throw ApiError.unauthorized("Session invalid. Please log in again.");
  }

  // Rotate: remove the used session, issue a brand new one.
  user.refreshSessions.splice(sessionIndex, 1);
  await user.save();

  return createSession(user, meta);
};

export const logoutUser = async (userId: string, refreshToken: string): Promise<void> => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return; // already invalid/expired — nothing to clean up
  }

  const incomingHash = sha256(`${payload.sid}:${refreshToken}`);

  await User.updateOne(
    { _id: userId },
    { $pull: { refreshSessions: { tokenHash: incomingHash } } }
  );
};

export const forgotPassword = async (email: string): Promise<void> => {
  const user = await User.findOne({ email });
  if (!user) return; // don't leak account existence

  const code = await issueOtp(user._id, "reset_password");

  try {
    await sendPasswordResetOtpEmail(user.email, user.fullName, code);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to send password reset OTP email:", err);
  }
};

export const resetPassword = async (input: ResetPasswordInput): Promise<void> => {
  const user = await User.findOne({ email: input.email });
  if (!user) throw ApiError.badRequest("Invalid reset request");

  await verifyOtpCode(user._id, "reset_password", input.code);

  user.passwordHash = await hashPassword(input.newPassword);
  user.refreshSessions = []; // force re-login on all devices after password reset
  await user.save();
};

export const changePassword = async (
  userId: Types.ObjectId | string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw ApiError.notFound("User not found");

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) throw ApiError.badRequest("Current password is incorrect");

  user.passwordHash = await hashPassword(newPassword);
  user.refreshSessions = []; // force re-login on all devices
  await user.save();
};

/**
 * Returns the full, up-to-date profile for the logged-in user: base account
 * fields (name/email/phone/role) plus whichever role-specific profile
 * document (student or tutor) belongs to them. This backs GET /auth/me,
 * which the frontend uses to hydrate the session on page load and to
 * populate the profile screens — previously that endpoint only echoed back
 * the raw `{ id, role }` JWT payload, so none of that data ever reached the UI.
 */
export const getCurrentUserProfile = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  const base = {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };

  if (user.role === "student") {
    const profile = await StudentProfile.findOne({ user: user._id });
    return { ...base, profile };
  }

  if (user.role === "tutor") {
    const profile = await TutorProfile.findOne({ user: user._id });
    return { ...base, profile };
  }

  return { ...base, profile: null };
};

/**
 * Updates the account-level contact fields (name / phone) that live on the
 * User document rather than on the role-specific profile document. Shared by
 * both the student and tutor "update my profile" endpoints so phone-number
 * changes actually persist instead of silently being dropped (the profile
 * documents don't have a `phone` field — only User does).
 */
export const updateContactInfo = async (
  userId: string,
  updates: { fullName?: string; phone?: string }
): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  if (updates.phone && updates.phone !== user.phone) {
    const phoneTaken = await User.findOne({ phone: updates.phone, _id: { $ne: user._id } });
    if (phoneTaken) {
      throw ApiError.conflict("This phone number is already in use by another account");
    }
    user.phone = updates.phone;
  }

  if (updates.fullName) {
    user.fullName = updates.fullName;
  }

  await user.save();
  return user;
};
