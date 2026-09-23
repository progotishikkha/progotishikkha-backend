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
const express_1 = require("express");
const authController = __importStar(require("../controllers/auth.controller"));
const validate_1 = require("../middleware/validate");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const auth_validator_1 = require("../validators/auth.validator");
const router = (0, express_1.Router)();
// --- Public ---
router.post("/register", rateLimiter_1.authRateLimiter, (0, validate_1.validateBody)(auth_validator_1.registerSchema), authController.register);
router.post("/verify-otp", rateLimiter_1.authRateLimiter, (0, validate_1.validateBody)(auth_validator_1.verifyOtpSchema), authController.verifyOtp);
router.post("/resend-otp", rateLimiter_1.authRateLimiter, (0, validate_1.validateBody)(auth_validator_1.resendOtpSchema), authController.resendOtp);
router.post("/login", rateLimiter_1.authRateLimiter, (0, validate_1.validateBody)(auth_validator_1.loginSchema), authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/forgot-password", rateLimiter_1.authRateLimiter, (0, validate_1.validateBody)(auth_validator_1.forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", rateLimiter_1.authRateLimiter, (0, validate_1.validateBody)(auth_validator_1.resetPasswordSchema), authController.resetPassword);
// --- Protected ---
router.post("/logout", auth_middleware_1.protect, authController.logout);
router.get("/me", auth_middleware_1.protect, authController.getMe);
router.patch("/change-password", auth_middleware_1.protect, (0, validate_1.validateBody)(auth_validator_1.changePasswordSchema), authController.changePassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map