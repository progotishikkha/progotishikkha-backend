import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import * as authService from "../services/auth.service";
import {
  refreshCookieOptions,
  clearRefreshCookieOptions,
  REFRESH_TOKEN_COOKIE_NAME,
} from "../utils/cookieOptions";

const requestMeta = (req: Request) => ({
  userAgent: req.headers["user-agent"],
  ip: req.ip,
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { otpEmailSent } = await authService.registerUser(req.body);

  const message = otpEmailSent
    ? "Verification code sent. Your account will be created after verification."
    : "Registration started, but we couldn't send the OTP email right now. Use \"Resend OTP\" on the verification page to try again.";

  res.status(201).json(new ApiResponse(201, { otpEmailSent }, message));
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { otpEmailSent } = await authService.resendVerificationOtp(req.body.email);

  const message = otpEmailSent
    ? "If the account exists, an OTP has been sent."
    : "We found your account but couldn't deliver the email right now. Please try again shortly.";

  res.status(200).json(new ApiResponse(200, { otpEmailSent }, message));
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, code } = req.body;
  const { user, tokens } = await authService.verifyEmailOtp(email, code, requestMeta(req));

  // Return the full profile (not just id/name/email/role) so the frontend
  // has everything it needs — including the freshly created student/tutor
  // profile document — right after verification, with no extra round trip.
  const fullUser = await authService.getCurrentUserProfile(String(user._id));

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions);
  res
    .status(200)
    .json(new ApiResponse(200, { user: fullUser, accessToken: tokens.accessToken }, "Email verified successfully"));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, tokens } = await authService.loginUser(req.body, requestMeta(req));
  const fullUser = await authService.getCurrentUserProfile(String(user._id));

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions);
  res
    .status(200)
    .json(new ApiResponse(200, { user: fullUser, accessToken: tokens.accessToken }, "Login successful"));
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const incoming = req.signedCookies?.[REFRESH_TOKEN_COOKIE_NAME];
  if (!incoming) throw ApiError.unauthorized("Refresh token missing");

  const tokens = await authService.refreshSession(incoming, requestMeta(req));

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions);
  res.status(200).json(new ApiResponse(200, { accessToken: tokens.accessToken }, "Token refreshed"));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const incoming = req.signedCookies?.[REFRESH_TOKEN_COOKIE_NAME];

  if (incoming && req.user) {
    await authService.logoutUser(req.user.id, incoming);
  }

  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, clearRefreshCookieOptions);
  res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  res
    .status(200)
    .json(new ApiResponse(200, null, "If the account exists, a reset code has been sent."));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body);
  res.status(200).json(new ApiResponse(200, null, "Password reset successfully. Please log in."));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");

  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully. Please log in again."));
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  // Previously this just echoed back the decoded JWT payload ({ id, role }),
  // so the frontend never actually received the user's name/email/phone or
  // their student/tutor profile document — that's why the profile screens
  // couldn't show or prefill any real data. Now it fetches the live record.
  const me = await authService.getCurrentUserProfile(req.user.id);
  res.status(200).json(new ApiResponse(200, me, "Current session"));
});
