const nodemailer = require('nodemailer');

/**
 * Send an email using Gmail + App Password
 *
 * CRITICAL CONFIG:
 *   port: 587  — STARTTLS (standard, works with Gmail App Passwords)
 *   secure: false — MUST be false for port 587. Use true only for port 465 (SSL).
 *   Setting secure: true on port 587 causes "connection timeout" errors.
 */
const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:   587,
    secure: false, // ← CRITICAL: false for port 587 (STARTTLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // 16-char Gmail App Password
    },
  });

  const info = await transporter.sendMail({
    from:    `"FlatSell 🏢" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log(`📧 Email sent → ${to} [${info.messageId}]`);
  return info;
};

// ─── Email Templates ──────────────────────────────────────────────────────────

/**
 * OTP Verification Email template
 */
const otpEmailTemplate = (name, otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your FlatSell Account</title>
</head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#1a1a2e;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f52e6,#6370f1);padding:32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                Flat<span style="color:#fb923c;">Sell</span>
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
                Real Estate Marketplace
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 36px;">
              <h2 style="margin:0 0 12px;color:#fff;font-size:22px;font-weight:700;">
                Verify your email 👋
              </h2>
              <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.6;">
                Hi <strong style="color:#e5e7eb;">${name}</strong>, welcome to FlatSell!<br/>
                Use the code below to verify your account. It expires in <strong style="color:#fb923c;">10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <div style="background:#0f0f1a;border:2px solid #4f52e6;border-radius:12px;padding:28px;text-align:center;margin:0 0 28px;">
                <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:2px;">
                  Your Verification Code
                </p>
                <p style="margin:0;color:#fff;font-size:42px;font-weight:800;letter-spacing:12px;font-family:monospace;">
                  ${otp}
                </p>
              </div>

              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.6;">
                If you didn't create a FlatSell account, you can safely ignore this email.
              </p>

              <div style="border-top:1px solid rgba(255,255,255,0.08);margin:28px 0 0;padding-top:20px;">
                <p style="margin:0;color:#4b5563;font-size:12px;">
                  © ${new Date().getFullYear()} FlatSell. All rights reserved.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

module.exports = { sendEmail, otpEmailTemplate };
