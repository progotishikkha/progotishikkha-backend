import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate";
import { protect } from "../middleware/auth.middleware";
import { authRateLimiter } from "../middleware/rateLimiter";
import {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../validators/auth.validator";

const router = Router();

// --- Public ---
router.post("/register", authRateLimiter, validateBody(registerSchema), authController.register);
router.post("/verify-otp", authRateLimiter, validateBody(verifyOtpSchema), authController.verifyOtp);
router.post("/resend-otp", authRateLimiter, validateBody(resendOtpSchema), authController.resendOtp);
router.post("/login", authRateLimiter, validateBody(loginSchema), authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post(
  "/forgot-password",
  authRateLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  authRateLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

// --- Protected ---
router.post("/logout", protect, authController.logout);
router.get("/me", protect, authController.getMe);
router.patch(
  "/change-password",
  protect,
  validateBody(changePasswordSchema),
  authController.changePassword
);

export default router;
