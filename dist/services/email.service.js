"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetOtpEmail = exports.sendVerificationOtpEmail = void 0;
const resend_1 = require("../config/resend");
const env_1 = require("../config/env");
const otpEmail_template_1 = require("../templates/otpEmail.template");
const resetPasswordEmail_template_1 = require("../templates/resetPasswordEmail.template");
// Resend's sandbox mode (unverified sending domain) only accepts deliveries
// to the email address that owns the Resend account — every other recipient
// gets this exact error back from the API. Recognizing it here turns a
// silent, confusing "OTP only reaches one address" report into a clear,
// actionable log line instead of a generic failure.
const explainResendError = (message) => {
    if (/only send testing emails to your own email|verify a domain/i.test(message)) {
        return (`${message} — this is Resend's sandbox restriction: with an unverified sending ` +
            "domain, emails can ONLY be delivered to the address that owns the Resend account. " +
            "Verify a domain at https://resend.com/domains and update EMAIL_FROM to fix this for all users.");
    }
    return message;
};
const sendViaResend = async (params) => {
    const { error } = await resend_1.resend.emails.send({
        from: env_1.env.EMAIL_FROM,
        to: params.to,
        subject: params.subject,
        html: params.html,
    });
    if (error) {
        throw new Error(explainResendError(`Resend API error: ${error.message}`));
    }
};
const sendVerificationOtpEmail = async (to, fullName, code) => {
    await sendViaResend({
        to,
        subject: "Verify your Progoti Shikkha account",
        html: (0, otpEmail_template_1.otpEmailTemplate)(fullName, code),
    });
};
exports.sendVerificationOtpEmail = sendVerificationOtpEmail;
const sendPasswordResetOtpEmail = async (to, fullName, code) => {
    await sendViaResend({
        to,
        subject: "Reset your Progoti Shikkha password",
        html: (0, resetPasswordEmail_template_1.resetPasswordEmailTemplate)(fullName, code),
    });
};
exports.sendPasswordResetOtpEmail = sendPasswordResetOtpEmail;
//# sourceMappingURL=email.service.js.map