import { resend } from "../config/resend";
import { env } from "../config/env";
import { otpEmailTemplate } from "../templates/otpEmail.template";
import { resetPasswordEmailTemplate } from "../templates/resetPasswordEmail.template";

// Resend's sandbox mode (unverified sending domain) only accepts deliveries
// to the email address that owns the Resend account — every other recipient
// gets this exact error back from the API. Recognizing it here turns a
// silent, confusing "OTP only reaches one address" report into a clear,
// actionable log line instead of a generic failure.
const explainResendError = (message: string): string => {
  if (/only send testing emails to your own email|verify a domain/i.test(message)) {
    return (
      `${message} — this is Resend's sandbox restriction: with an unverified sending ` +
      "domain, emails can ONLY be delivered to the address that owns the Resend account. " +
      "Verify a domain at https://resend.com/domains and update EMAIL_FROM to fix this for all users."
    );
  }
  return message;
};

const sendViaResend = async (params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> => {
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    throw new Error(explainResendError(`Resend API error: ${error.message}`));
  }
};

export const sendVerificationOtpEmail = async (
  to: string,
  fullName: string,
  code: string
): Promise<void> => {
  await sendViaResend({
    to,
    subject: "Verify your Progoti Shikkha account",
    html: otpEmailTemplate(fullName, code),
  });
};

export const sendPasswordResetOtpEmail = async (
  to: string,
  fullName: string,
  code: string
): Promise<void> => {
  await sendViaResend({
    to,
    subject: "Reset your Progoti Shikkha password",
    html: resetPasswordEmailTemplate(fullName, code),
  });
};
