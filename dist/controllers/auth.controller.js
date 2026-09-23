"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.logout = exports.refreshToken = exports.login = exports.verifyOtp = exports.resendOtp = exports.register = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const authService = __importStar(require("../services/auth.service"));
const cookieOptions_1 = require("../utils/cookieOptions");
const requestMeta = (req) => ({
    userAgent: req.headers["user-agent"],
    ip: req.ip,
});
exports.register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { otpEmailSent } = await authService.registerUser(req.body);
    const message = otpEmailSent
        ? "Verification code sent. Your account will be created after verification."
        : "Registration started, but we couldn't send the OTP email right now. Use \"Resend OTP\" on the verification page to try again.";
    res.status(201).json(new ApiResponse_1.ApiResponse(201, { otpEmailSent }, message));
});
exports.resendOtp = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { otpEmailSent } = await authService.resendVerificationOtp(req.body.email);
    const message = otpEmailSent
        ? "If the account exists, an OTP has been sent."
        : "We found your account but couldn't deliver the email right now. Please try again shortly.";
    res.status(200).json(new ApiResponse_1.ApiResponse(200, { otpEmailSent }, message));
});
exports.verifyOtp = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, code } = req.body;
    const { user, tokens } = await authService.verifyEmailOtp(email, code, requestMeta(req));
    // Return the full profile (not just id/name/email/role) so the frontend
    // has everything it needs — including the freshly created student/tutor
    // profile document — right after verification, with no extra round trip.
    const fullUser = await authService.getCurrentUserProfile(String(user._id));
    res.cookie(cookieOptions_1.REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, cookieOptions_1.refreshCookieOptions);
    res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, { user: fullUser, accessToken: tokens.accessToken }, "Email verified successfully"));
});
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { user, tokens } = await authService.loginUser(req.body, requestMeta(req));
    const fullUser = await authService.getCurrentUserProfile(String(user._id));
    res.cookie(cookieOptions_1.REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, cookieOptions_1.refreshCookieOptions);
    res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, { user: fullUser, accessToken: tokens.accessToken }, "Login successful"));
});
exports.refreshToken = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const incoming = req.signedCookies?.[cookieOptions_1.REFRESH_TOKEN_COOKIE_NAME];
    if (!incoming)
        throw ApiError_1.ApiError.unauthorized("Refresh token missing");
    const tokens = await authService.refreshSession(incoming, requestMeta(req));
    res.cookie(cookieOptions_1.REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, cookieOptions_1.refreshCookieOptions);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, { accessToken: tokens.accessToken }, "Token refreshed"));
});
exports.logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const incoming = req.signedCookies?.[cookieOptions_1.REFRESH_TOKEN_COOKIE_NAME];
    if (incoming && req.user) {
        await authService.logoutUser(req.user.id, incoming);
    }
    res.clearCookie(cookieOptions_1.REFRESH_TOKEN_COOKIE_NAME, cookieOptions_1.clearRefreshCookieOptions);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, null, "Logged out successfully"));
});
exports.forgotPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, null, "If the account exists, a reset code has been sent."));
});
exports.resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await authService.resetPassword(req.body);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, null, "Password reset successfully. Please log in."));
});
exports.changePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized("Authentication required");
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, null, "Password changed successfully. Please log in again."));
});
exports.getMe = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized("Authentication required");
    // Previously this just echoed back the decoded JWT payload ({ id, role }),
    // so the frontend never actually received the user's name/email/phone or
    // their student/tutor profile document — that's why the profile screens
    // couldn't show or prefill any real data. Now it fetches the live record.
    const me = await authService.getCurrentUserProfile(req.user.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, me, "Current session"));
});
//# sourceMappingURL=auth.controller.js.map