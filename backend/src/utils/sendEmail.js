const nodemailer = require('nodemailer');

/**
 * Send an email using Gmail + App Password
 *
 * CRITICAL CONFIG:
 *   port: 587  — STARTTLS (standard, works with Gmail App Passwords)
 *   secure: false — MUST be false for port 587. Use true only for port 465 (SSL).
 *   Setting secure: true on port 587 causes "connection timeout" errors.
 */
const createTransporter = () =>
  nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:   587,
    secure: false, // ← CRITICAL: false for port 587 (STARTTLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

/**
 * Generic email sender
 * @param {Object} opts - { to, subject, html, attachments? }
 */
const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  const transporter = createTransporter();

  const info = await transporter.sendMail({
    from:        `"FlatSell 🏢" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments,
  });

  console.log(`📧 Email sent → ${to} [${info.messageId}]`);
  return info;
};

/**
 * Send payment confirmation email with PDF invoice attachment
 * @param {Object} opts
 * @param {Object} opts.customer  - { name, email }
 * @param {Object} opts.property  - { title, category, city }
 * @param {Object} opts.company   - { name }
 * @param {Object} opts.booking   - { totalPrice, bookingAmount, bookingMoneyPercentage, paymentStatus }
 * @param {Buffer} opts.pdfBuffer - Invoice PDF buffer from generateInvoicePDF
 */
const sendPaymentConfirmationEmail = async ({ customer, property, company, booking, pdfBuffer }) => {
  const fmt = (n) => `৳${Number(n || 0).toLocaleString()}`;
  const isFullyPaid = booking.paymentStatus === 'fully_paid';
  const paidAmount  = isFullyPaid ? booking.totalPrice : booking.bookingAmount;
  const statusLabel = isFullyPaid ? 'Full Payment Received' : 'Booking Money Received';

  const html = paymentConfirmationEmailTemplate({
    customerName:  customer.name,
    propertyTitle: property.title,
    companyName:   company.name,
    category:      property.category,
    city:          property.city || property.address || '',
    paidAmount:    fmt(paidAmount),
    totalPrice:    fmt(booking.totalPrice),
    statusLabel,
    isFullyPaid,
  });

  return sendEmail({
    to:      customer.email,
    subject: `✅ ${statusLabel} — FlatSell`,
    html,
    attachments: pdfBuffer
      ? [{ filename: `FlatSell-Invoice-${booking._id.toString().slice(-8).toUpperCase()}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
      : [],
  });
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

// ─── Payment Confirmation Email Template ─────────────────────────────────────
const paymentConfirmationEmailTemplate = ({
  customerName, propertyTitle, companyName, category, city,
  paidAmount, totalPrice, statusLabel, isFullyPaid,
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Payment Confirmation — FlatSell</title>
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
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Real Estate Marketplace</p>
            </td>
          </tr>

          <!-- Status Banner -->
          <tr>
            <td style="background:${isFullyPaid ? '#15803d' : '#1d4ed8'};padding:14px 36px;text-align:center;">
              <p style="margin:0;color:#fff;font-size:15px;font-weight:700;">
                ✅ ${statusLabel}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px;">
              <p style="margin:0 0 18px;color:#9ca3af;font-size:15px;line-height:1.6;">
                Hi <strong style="color:#e5e7eb;">${customerName}</strong>,<br/>
                Your payment for the following property has been successfully processed.
              </p>

              <!-- Property Card -->
              <div style="background:#0f0f1a;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin:0 0 24px;">
                <p style="margin:0 0 4px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Property</p>
                <p style="margin:0 0 12px;color:#fff;font-size:18px;font-weight:700;">${propertyTitle}</p>
                <p style="margin:0;color:#9ca3af;font-size:13px;">📍 ${city} &nbsp;|&nbsp; 🏷️ ${category.charAt(0).toUpperCase() + category.slice(1)}</p>
              </div>

              <!-- Vendor -->
              <div style="display:flex;justify-content:space-between;margin:0 0 20px;">
                <div style="background:#1e1e3a;border-radius:8px;padding:14px 18px;flex:1;margin-right:8px;">
                  <p style="margin:0 0 4px;color:#6b7280;font-size:11px;">VENDOR</p>
                  <p style="margin:0;color:#e5e7eb;font-size:14px;font-weight:600;">${companyName}</p>
                </div>
              </div>

              <!-- Payment Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:collapse;">
                <tr style="background:#0f0f1a;">
                  <td style="padding:10px 14px;color:#6b7280;font-size:12px;border:1px solid rgba(255,255,255,0.06);">Total Property Price</td>
                  <td style="padding:10px 14px;color:#e5e7eb;font-size:12px;font-weight:600;text-align:right;border:1px solid rgba(255,255,255,0.06);">${totalPrice}</td>
                </tr>
                <tr style="background:#1a1a2e;">
                  <td style="padding:10px 14px;color:#6b7280;font-size:12px;border:1px solid rgba(255,255,255,0.06);">Amount Paid Now</td>
                  <td style="padding:10px 14px;color:#4ade80;font-size:14px;font-weight:700;text-align:right;border:1px solid rgba(255,255,255,0.06);">${paidAmount}</td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.6;">
                📎 Your invoice PDF is attached to this email. You can also download it anytime from your customer dashboard.
              </p>

              <div style="border-top:1px solid rgba(255,255,255,0.08);margin:28px 0 0;padding-top:20px;">
                <p style="margin:0;color:#4b5563;font-size:12px;">
                  © ${new Date().getFullYear()} FlatSell. All rights reserved.<br/>
                  House No. 2, Road No. 11, Block F, Banani, Dhaka-1213 | 01611-652333
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

// ─── Vendor Approval Email ───────────────────────────────────────────────────

/**
 * Send approval confirmation email to a newly approved vendor
 * @param {Object} opts
 * @param {string} opts.vendorName  - Name of the company owner
 * @param {string} opts.companyName - Approved company name
 * @param {string} opts.vendorEmail - Vendor's registered email address
 */
const sendVendorApprovalEmail = async ({ vendorName, companyName, vendorEmail }) => {
  const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;

  const html = vendorApprovalEmailTemplate({ vendorName, companyName, loginUrl });

  return sendEmail({
    to:      vendorEmail,
    subject: 'Welcome to FlatSell - Your Vendor Account is Approved! 🎉',
    html,
  });
};

const vendorApprovalEmailTemplate = ({ vendorName, companyName, loginUrl }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Vendor Account Approved — FlatSell</title>
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
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Real Estate Marketplace</p>
            </td>
          </tr>

          <!-- Status Banner -->
          <tr>
            <td style="background:#15803d;padding:14px 36px;text-align:center;">
              <p style="margin:0;color:#fff;font-size:16px;font-weight:700;">🎉 Vendor Account Approved!</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px;">
              <p style="margin:0 0 18px;color:#e5e7eb;font-size:16px;line-height:1.7;">
                Hi <strong style="color:#fff;">${vendorName}</strong>,
              </p>
              <p style="margin:0 0 18px;color:#9ca3af;font-size:15px;line-height:1.7;">
                Congratulations! 🥳 We are thrilled to inform you that your vendor application for
                <strong style="color:#fb923c;">${companyName}</strong> has been reviewed and
                <strong style="color:#4ade80;">approved</strong> by our admin team.
              </p>
              <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.7;">
                You now have full access to your Vendor Dashboard where you can:
              </p>

              <!-- Features List -->
              <div style="background:#0f0f1a;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;margin:0 0 28px;">
                <p style="margin:0 0 10px;color:#e5e7eb;font-size:14px;">✅ &nbsp; List your Apartments, Villas & Land</p>
                <p style="margin:0 0 10px;color:#e5e7eb;font-size:14px;">✅ &nbsp; Manage bookings & customer inquiries</p>
                <p style="margin:0 0 10px;color:#e5e7eb;font-size:14px;">✅ &nbsp; Track your sales & commission reports</p>
                <p style="margin:0;color:#e5e7eb;font-size:14px;">✅ &nbsp; Access your company storefront</p>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin:0 0 28px;">
                <a href="${loginUrl}" target="_blank"
                   style="display:inline-block;background:linear-gradient(135deg,#4f52e6,#6370f1);color:#fff;font-size:16px;font-weight:700;padding:14px 40px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
                  🚀 &nbsp; Go to Your Dashboard
                </a>
              </div>

              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.6;">
                If you have any questions or need assistance getting started, feel free to reach out to our support team.
              </p>

              <div style="border-top:1px solid rgba(255,255,255,0.08);margin:28px 0 0;padding-top:20px;">
                <p style="margin:0;color:#4b5563;font-size:12px;">
                  © ${new Date().getFullYear()} FlatSell. All rights reserved.<br/>
                  House No. 2, Road No. 11, Block F, Banani, Dhaka-1213 | 01611-652333
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

module.exports = { sendEmail, otpEmailTemplate, sendPaymentConfirmationEmail, sendVendorApprovalEmail };
