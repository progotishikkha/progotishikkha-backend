"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtpCode = void 0;
const crypto_1 = __importDefault(require("crypto"));
/** Generates a cryptographically random 6-digit numeric OTP as a string. */
const generateOtpCode = () => {
    const otp = crypto_1.default.randomInt(100000, 1000000);
    return otp.toString();
};
exports.generateOtpCode = generateOtpCode;
//# sourceMappingURL=generateOtp.js.map