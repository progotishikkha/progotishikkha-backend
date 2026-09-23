"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.resendOtpSchema = exports.verifyOtpSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const shared_validator_1 = require("./shared.validator");
const passwordSchema = zod_1.z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number");
exports.registerSchema = zod_1.z
    .object({
    fullName: zod_1.z.string().trim().min(2).max(100),
    email: zod_1.z.string().trim().toLowerCase().email(),
    phone: shared_validator_1.phoneSchema,
    password: passwordSchema,
    confirmPassword: zod_1.z.string(),
    role: zod_1.z.enum(["student", "tutor"]),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
exports.verifyOtpSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email(),
    code: zod_1.z.string().length(6, "OTP must be 6 digits"),
});
exports.resendOtpSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email(),
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email(),
});
exports.resetPasswordSchema = zod_1.z
    .object({
    email: zod_1.z.string().trim().toLowerCase().email(),
    code: zod_1.z.string().length(6, "OTP must be 6 digits"),
    newPassword: passwordSchema,
    confirmNewPassword: zod_1.z.string(),
})
    .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
});
exports.changePasswordSchema = zod_1.z
    .object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: passwordSchema,
    confirmNewPassword: zod_1.z.string(),
})
    .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
});
//# sourceMappingURL=auth.validator.js.map