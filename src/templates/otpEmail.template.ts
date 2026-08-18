export const otpEmailTemplate = (fullName: string, code: string): string => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#0B2559;padding:24px;text-align:center;">
                <span style="color:#ffffff;font-size:20px;font-weight:bold;">প্রগতি শিক্ষা · Progoti Shikkha</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="font-size:16px;color:#0B2559;">Hi ${fullName},</p>
                <p style="font-size:15px;color:#334155;line-height:1.6;">
                  Use the verification code below to confirm your email address.
                  This code expires in 10 minutes.
                </p>
                <div style="margin:24px 0;text-align:center;">
                  <span style="display:inline-block;font-size:32px;letter-spacing:8px;font-weight:bold;color:#2E86EB;background:#EFF6FF;padding:16px 24px;border-radius:8px;">
                    ${code}
                  </span>
                </div>
                <p style="font-size:13px;color:#94A3B8;">
                  If you didn't request this, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
