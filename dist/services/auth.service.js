"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateContactInfo = exports.getCurrentUserProfile = exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.logoutUser = exports.refreshSession = exports.loginUser = exports.verifyEmailOtp = exports.resendVerificationOtp = exports.registerUser = void 0;
const crypto_1 = __importDefault(require("crypto"));
const user_model_1 = require("../models/user.model");
const pendingRegistration_model_1 = require("../models/pendingRegistration.model");
const studentProfile_model_1 = require("../models/studentProfile.model");
const tutorProfile_model_1 = require("../models/tutorProfile.model");
const password_1 = require("../utils/password");
const hash_1 = require("../utils/hash");
const ApiError_1 = require("../utils/ApiError");
const otp_service_1 = require("./otp.service");
const generateOtp_1 = require("../utils/generateOtp");
const email_service_1 = require("./email.service");
const token_service_1 = require("./token.service");
const env_1 = require("../config/env");
// How long an unverified account is allowed to sit before it's auto-deleted
// (see the TTL index on User.unverifiedExpiresAt). Long enough that a person
// has a real chance to find the OTP email / ask for a resend, short enough
// that a typo'd or undeliverable email address doesn't permanently squat on
// a unique email/phone.
const UNVERIFIED_ACCOUNT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const createSession = async (user, meta) => {
    const sessionId = crypto_1.default.randomUUID();
    const accessToken = (0, token_service_1.signAccessToken)({ sub: user._id.toString(), role: user.role });
    const refreshToken = (0, token_service_1.signRefreshToken)({ sub: user._id.toString(), sid: sessionId });
    // Defensive: refreshSessions is `select: false` on the schema, so any caller
    // that fetched this user without explicitly re-including it would otherwise
    // have `user.refreshSessions === undefined` here, crashing on .push().
    if (!user.refreshSessions) {
        user.refreshSessions = [];
    }
    user.refreshSessions.push({
        tokenHash: (0, hash_1.sha256)(`${sessionId}:${refreshToken}`),
        userAgent: meta.userAgent,
        ip: meta.ip,
        expiresAt: (0, token_service_1.expiresInToDate)(env_1.env.JWT_REFRESH_EXPIRES_IN),
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
const issuePendingRegistrationOtp = async (pending) => {
    const code = (0, generateOtp_1.generateOtpCode)();
    pending.otpHash = (0, hash_1.sha256)(code);
    pending.otpAttempts = 0;
    pending.otpExpiresAt = new Date(Date.now() + REGISTRATION_OTP_TTL_MS);
    await pending.save();
    return code;
};
const verifyPendingRegistrationOtp = async (pending, code) => {
    if (pending.otpExpiresAt < new Date()) {
        throw ApiError_1.ApiError.badRequest("OTP has expired. Please request a new one.");
    }
    if (pending.otpAttempts >= MAX_REGISTRATION_OTP_ATTEMPTS) {
        throw ApiError_1.ApiError.tooManyRequests("Too many incorrect attempts. Please request a new OTP.");
    }
    if (pending.otpHash !== (0, hash_1.sha256)(code)) {
        pending.otpAttempts += 1;
        await pending.save();
        throw ApiError_1.ApiError.badRequest("Incorrect OTP code.");
    }
};
const registerUser = async (input) => {
    const email = input.email.trim().toLowerCase();
    // IMPORTANT: Do not create a User document before email verification.
    // Check both permanent accounts and any existing pending registration.
    const [existingUser, existingPending] = await Promise.all([
        user_model_1.User.findOne({ $or: [{ email }, { phone: input.phone }] }).select("+passwordHash"),
        pendingRegistration_model_1.PendingRegistration.findOne({ $or: [{ email }, { phone: input.phone }] }),
    ]);
    if (existingUser) {
        throw ApiError_1.ApiError.conflict("An account with this email or phone already exists");
    }
    if (existingPending) {
        // A previous unfinished registration is replaceable. This lets a person
        // correct a typo or restart verification without a stale record blocking them.
        await existingPending.deleteOne();
    }
    const passwordHash = await (0, password_1.hashPassword)(input.password);
    const code = (0, generateOtp_1.generateOtpCode)();
    const pending = await pendingRegistration_model_1.PendingRegistration.create({
        fullName: input.fullName,
        email,
        phone: input.phone,
        passwordHash,
        role: input.role,
        otpHash: (0, hash_1.sha256)(code),
        otpAttempts: 0,
        otpExpiresAt: new Date(Date.now() + REGISTRATION_OTP_TTL_MS),
        expiresAt: new Date(Date.now() + PENDING_REGISTRATION_TTL_MS),
    });
    let otpEmailSent = true;
    try {
        await (0, email_service_1.sendVerificationOtpEmail)(pending.email, pending.fullName, code);
    }
    catch (err) {
        otpEmailSent = false;
        console.error("Failed to send verification OTP email (register):", err);
    }
    return { otpEmailSent };
};
exports.registerUser = registerUser;
const resendVerificationOtp = async (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    const pending = await pendingRegistration_model_1.PendingRegistration.findOne({ email: normalizedEmail });
    // Keep the response deliberately generic so registration state cannot be
    // used to enumerate existing accounts.
    if (!pending)
        return { otpEmailSent: true };
    const code = await issuePendingRegistrationOtp(pending);
    pending.expiresAt = new Date(Date.now() + PENDING_REGISTRATION_TTL_MS);
    await pending.save();
    try {
        await (0, email_service_1.sendVerificationOtpEmail)(pending.email, pending.fullName, code);
        return { otpEmailSent: true };
    }
    catch (err) {
        console.error("Failed to send verification OTP email (resend):", err);
        return { otpEmailSent: false };
    }
};
exports.resendVerificationOtp = resendVerificationOtp;
const verifyEmailOtp = async (email, code, meta) => {
    const normalizedEmail = email.trim().toLowerCase();
    const pending = await pendingRegistration_model_1.PendingRegistration.findOne({ email: normalizedEmail });
    if (!pending) {
        // If a verified account already exists, make the error explicit; otherwise
        // the pending registration may simply have expired and needs a new signup.
        const existingUser = await user_model_1.User.findOne({ email: normalizedEmail });
        if (existingUser?.isVerified)
            throw ApiError_1.ApiError.badRequest("Account is already verified");
        throw ApiError_1.ApiError.badRequest("Verification request not found or expired. Please register again.");
    }
    await verifyPendingRegistrationOtp(pending, code);
    // The first write to the User collection happens HERE, after OTP verification.
    // From this point onward the account is permanent and can receive sessions.
    const conflictingUser = await user_model_1.User.findOne({
        $or: [{ email: pending.email }, { phone: pending.phone }],
    });
    if (conflictingUser) {
        await pending.deleteOne();
        throw ApiError_1.ApiError.conflict("An account with this email or phone already exists");
    }
    let user;
    try {
        user = await user_model_1.User.create({
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
            await studentProfile_model_1.StudentProfile.create({ user: user._id });
        }
        else if (user.role === "tutor") {
            await tutorProfile_model_1.TutorProfile.create({ user: user._id });
        }
        await pending.deleteOne();
    }
    catch (error) {
        // Do not leave a half-created account if profile creation fails. The
        // pending registration remains available for a retry.
        if (user) {
            await user_model_1.User.deleteOne({ _id: user._id });
        }
        throw error;
    }
    if (!user)
        throw ApiError_1.ApiError.internal("Failed to create account");
    const tokens = await createSession(user, meta);
    return { user, tokens };
};
exports.verifyEmailOtp = verifyEmailOtp;
const loginUser = async (input, meta) => {
    const user = await user_model_1.User.findOne({ email: input.email }).select("+passwordHash +refreshSessions");
    if (!user)
        throw ApiError_1.ApiError.unauthorized("Invalid email or password");
    const isMatch = await (0, password_1.comparePassword)(input.password, user.passwordHash);
    if (!isMatch)
        throw ApiError_1.ApiError.unauthorized("Invalid email or password");
    if (!user.isVerified || !user.isActive) {
        throw ApiError_1.ApiError.forbidden("Please verify your email before logging in");
    }
    if (user.isSuspended) {
        throw ApiError_1.ApiError.forbidden("This account has been suspended");
    }
    const tokens = await createSession(user, meta);
    return { user, tokens };
};
exports.loginUser = loginUser;
const refreshSession = async (refreshToken, meta) => {
    let payload;
    try {
        payload = (0, token_service_1.verifyRefreshToken)(refreshToken);
    }
    catch {
        throw ApiError_1.ApiError.unauthorized("Invalid or expired refresh token");
    }
    const user = await user_model_1.User.findById(payload.sub).select("+refreshSessions");
    if (!user)
        throw ApiError_1.ApiError.unauthorized("Invalid refresh token");
    const incomingHash = (0, hash_1.sha256)(`${payload.sid}:${refreshToken}`);
    const sessionIndex = user.refreshSessions.findIndex((s) => s.tokenHash === incomingHash);
    if (sessionIndex === -1) {
        // Token reuse or forgery — invalidate all sessions as a precaution.
        user.refreshSessions = [];
        await user.save();
        throw ApiError_1.ApiError.unauthorized("Session invalid. Please log in again.");
    }
    // Rotate: remove the used session, issue a brand new one.
    user.refreshSessions.splice(sessionIndex, 1);
    await user.save();
    return createSession(user, meta);
};
exports.refreshSession = refreshSession;
const logoutUser = async (userId, refreshToken) => {
    let payload;
    try {
        payload = (0, token_service_1.verifyRefreshToken)(refreshToken);
    }
    catch {
        return; // already invalid/expired — nothing to clean up
    }
    const incomingHash = (0, hash_1.sha256)(`${payload.sid}:${refreshToken}`);
    await user_model_1.User.updateOne({ _id: userId }, { $pull: { refreshSessions: { tokenHash: incomingHash } } });
};
exports.logoutUser = logoutUser;
const forgotPassword = async (email) => {
    const user = await user_model_1.User.findOne({ email });
    if (!user)
        return; // don't leak account existence
    const code = await (0, otp_service_1.issueOtp)(user._id, "reset_password");
    try {
        await (0, email_service_1.sendPasswordResetOtpEmail)(user.email, user.fullName, code);
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to send password reset OTP email:", err);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (input) => {
    const user = await user_model_1.User.findOne({ email: input.email });
    if (!user)
        throw ApiError_1.ApiError.badRequest("Invalid reset request");
    await (0, otp_service_1.verifyOtp)(user._id, "reset_password", input.code);
    user.passwordHash = await (0, password_1.hashPassword)(input.newPassword);
    user.refreshSessions = []; // force re-login on all devices after password reset
    await user.save();
};
exports.resetPassword = resetPassword;
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await user_model_1.User.findById(userId).select("+passwordHash");
    if (!user)
        throw ApiError_1.ApiError.notFound("User not found");
    const isMatch = await (0, password_1.comparePassword)(currentPassword, user.passwordHash);
    if (!isMatch)
        throw ApiError_1.ApiError.badRequest("Current password is incorrect");
    user.passwordHash = await (0, password_1.hashPassword)(newPassword);
    user.refreshSessions = []; // force re-login on all devices
    await user.save();
};
exports.changePassword = changePassword;
/**
 * Returns the full, up-to-date profile for the logged-in user: base account
 * fields (name/email/phone/role) plus whichever role-specific profile
 * document (student or tutor) belongs to them. This backs GET /auth/me,
 * which the frontend uses to hydrate the session on page load and to
 * populate the profile screens — previously that endpoint only echoed back
 * the raw `{ id, role }` JWT payload, so none of that data ever reached the UI.
 */
const getCurrentUserProfile = async (userId) => {
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw ApiError_1.ApiError.notFound("User not found");
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
        const profile = await studentProfile_model_1.StudentProfile.findOne({ user: user._id });
        return { ...base, profile };
    }
    if (user.role === "tutor") {
        const profile = await tutorProfile_model_1.TutorProfile.findOne({ user: user._id });
        return { ...base, profile };
    }
    return { ...base, profile: null };
};
exports.getCurrentUserProfile = getCurrentUserProfile;
/**
 * Updates the account-level contact fields (name / phone) that live on the
 * User document rather than on the role-specific profile document. Shared by
 * both the student and tutor "update my profile" endpoints so phone-number
 * changes actually persist instead of silently being dropped (the profile
 * documents don't have a `phone` field — only User does).
 */
const updateContactInfo = async (userId, updates) => {
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw ApiError_1.ApiError.notFound("User not found");
    if (updates.phone && updates.phone !== user.phone) {
        const phoneTaken = await user_model_1.User.findOne({ phone: updates.phone, _id: { $ne: user._id } });
        if (phoneTaken) {
            throw ApiError_1.ApiError.conflict("This phone number is already in use by another account");
        }
        user.phone = updates.phone;
    }
    if (updates.fullName) {
        user.fullName = updates.fullName;
    }
    await user.save();
    return user;
};
exports.updateContactInfo = updateContactInfo;
//# sourceMappingURL=auth.service.js.map