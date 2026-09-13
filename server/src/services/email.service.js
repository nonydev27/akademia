/**
 * services/email.service.js — abstracts the email provider (Resend or SMTP).
 *
 * All emails use a shared professional layout (header, body, footer)
 * with inline CSS for maximum compatibility across email clients.
 */

import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logCommunication } from './communication.service.js';

let smtpTransport;
function getSmtpTransport() {
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return smtpTransport;
}

async function sendViaResend({ to, subject, html, attachments }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject,
      html,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: a.content.toString('base64'),
      })),
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend error (${res.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

async function sendViaSmtp({ to, subject, html, attachments }) {
  return getSmtpTransport().sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    attachments: attachments?.map((a) => ({ filename: a.filename, content: a.content })),
  });
}

async function send({ tenantId, to, subject, html, attachments, templateKey, retryPayload }) {
  try {
    const providerResponse =
      env.EMAIL_PROVIDER === 'smtp'
        ? await sendViaSmtp({ to, subject, html, attachments })
        : await sendViaResend({ to, subject, html, attachments });

    await logCommunication({
      tenantId,
      channel: 'EMAIL',
      recipient: to,
      templateKey,
      status: 'SENT',
      providerResponse: JSON.stringify(providerResponse).slice(0, 2000),
      payload: retryPayload,
    });
  } catch (err) {
    await logCommunication({
      tenantId,
      channel: 'EMAIL',
      recipient: to,
      templateKey,
      status: 'FAILED',
      providerResponse: err.message?.slice(0, 2000),
      payload: retryPayload,
    });
    throw err;
  }
}

// ── Shared Email Layout ──────────────────────────────────────────────────────
// Professional email template with branded header, body area, and footer.
// Uses inline CSS for compatibility with all email clients.

function emailLayout({ title, children, schoolName, footerText }) {
  const school = schoolName || 'Akademia';
  const footer = footerText || `© ${new Date().getFullYear()} ${school}. All rights reserved.`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preview text -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${title}
  </div>
  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <!-- Email container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 50%,#3b82f6 100%);padding:32px 32px 28px 32px;text-align:center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">Akademia</div>
                    <div style="font-size:13px;color:#bfdbfe;margin-top:4px;letter-spacing:1px;text-transform:uppercase;font-weight:500;">${school}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Accent bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#f59e0b 0%,#fbbf24 50%,#f59e0b 100%);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <!-- Title area -->
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">${title}</h1>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px;background-color:#e2e8f0;"></div>
            </td>
          </tr>
          <!-- Body content -->
          <tr>
            <td style="padding:24px 32px 32px 32px;">
              ${children}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="font-size:12px;color:#94a3b8;line-height:1.6;">
                    ${footer}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:8px;font-size:12px;color:#cbd5e1;">
                    <span style="color:#64748b;">Need help?</span> <a href="mailto:support@akademia.app" style="color:#2563eb;text-decoration:none;">support@akademia.app</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Teacher Welcome Email ────────────────────────────────────────────────────

export async function sendTeacherWelcomeEmail({
  tenantId,
  to,
  teacherName,
  schoolName,
  email,
  password,
  loginUrl,
}) {
  const title = 'Welcome to Akademia';
  const children = `
    <p style="margin:0 0 16px 0;font-size:15px;color:#334155;line-height:1.7;">Hello <strong style="color:#0f172a;">${teacherName}</strong>,</p>
    <p style="margin:0 0 20px 0;font-size:15px;color:#475569;line-height:1.7;">
      You have been added as a teacher at <strong style="color:#0f172a;">${schoolName}</strong>.
      Here are your login details:
    </p>
    <!-- Credentials card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background-color:#eff6ff;border-radius:10px;padding:20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            <tr>
              <td style="padding:4px 0;color:#334155;"><strong style="color:#1e3a8a;">Name:</strong> ${teacherName}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#334155;"><strong style="color:#1e3a8a;">Email:</strong> ${email}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#334155;"><strong style="color:#1e3a8a;">Temporary Password:</strong> <span style="font-family:monospace;background:#e0e7ff;padding:2px 8px;border-radius:4px;color:#1e3a8a;font-weight:600;">${password}</span></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <!-- Login button -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px;">
      <tr>
        <td align="center">
          <a href="${loginUrl}" target="_blank" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 32px;border-radius:8px;letter-spacing:0.3px;">Log In to Akademia</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px 0;font-size:15px;color:#475569;line-height:1.7;">
      After logging in, we recommend changing your password from your profile settings for security.
    </p>
    <p style="margin:0;font-size:15px;color:#475569;line-height:1.7;">
      If you have any questions, don't hesitate to reach out to your school administrator.
    </p>
  `;
  const html = emailLayout({ title, children, schoolName });
  return send({
    tenantId,
    to,
    subject: `Welcome to ${schoolName} — Your Teacher Account`,
    html,
    templateKey: 'TEACHER_WELCOME',
    retryPayload: { teacherName, email },
  });
}

// ── Result Released Email ────────────────────────────────────────────────────

export async function sendResultEmail({ tenantId, to, studentName, pdfBuffer, termLabel, schoolName }) {
  const title = `${studentName}'s Report Card — ${termLabel}`;
  const children = `
    <p style="margin:0 0 16px 0;font-size:15px;color:#334155;line-height:1.7;">Dear Parent / Guardian,</p>
    <p style="margin:0 0 20px 0;font-size:15px;color:#475569;line-height:1.7;">
      Good news! <strong style="color:#0f172a;">${studentName}</strong>'s report card for
      <strong style="color:#1e3a8a;">${termLabel}</strong> has been released and is ready for your review.
    </p>
    <!-- Result card highlight -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border-radius:10px;padding:20px;border-left:4px solid #2563eb;">
          <div style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:4px;">Student</div>
          <div style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:12px;">${studentName}</div>
          <div style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:4px;">Term</div>
          <div style="font-size:16px;font-weight:600;color:#0f172a;">${termLabel}</div>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px 0;font-size:15px;color:#475569;line-height:1.7;">
      The report card is attached to this email as a PDF for your records.
    </p>
    <p style="margin:0;font-size:15px;color:#475569;line-height:1.7;">
      We encourage you to discuss these results with your child and their teachers.
    </p>
  `;
  const html = emailLayout({ title, children, schoolName });
  return send({
    tenantId,
    to,
    subject: `${studentName}'s Report Card for ${termLabel} is Ready`,
    html,
    attachments: [{ filename: `${studentName}-${termLabel}-report-card.pdf`, content: pdfBuffer }],
    templateKey: 'RESULT_RELEASED',
    retryPayload: { studentName, termLabel },
  });
}

// ── Fee Reminder Email ───────────────────────────────────────────────────────

export async function sendFeeReminderEmail({ tenantId, to, studentName, balance, termLabel, schoolName }) {
  const title = `Outstanding Fees — ${studentName}`;
  const children = `
    <p style="margin:0 0 16px 0;font-size:15px;color:#334155;line-height:1.7;">Dear Parent / Guardian,</p>
    <p style="margin:0 0 20px 0;font-size:15px;color:#475569;line-height:1.7;">
      We wanted to let you know that <strong style="color:#0f172a;">${studentName}</strong>'s report card for
      <strong style="color:#1e3a8a;">${termLabel}</strong> is being held due to an outstanding fee balance.
    </p>
    <!-- Balance card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background:linear-gradient(135deg,#fef2f2 0%,#fee2e2 100%);border-radius:10px;padding:20px;border-left:4px solid #ef4444;">
          <div style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:4px;">Outstanding Balance</div>
          <div style="font-size:28px;font-weight:800;color:#ef4444;margin-bottom:8px;">GHS ${balance.toFixed(2)}</div>
          <div style="font-size:13px;color:#475569;line-height:1.5;">
            Please settle this balance so the report card can be released to you.
          </div>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px 0;font-size:15px;color:#475569;line-height:1.7;">
      If you have already made a payment, please allow 24–48 hours for it to be reflected.
    </p>
    <p style="margin:0;font-size:15px;color:#475569;line-height:1.7;">
      Contact the school office for any payment inquiries.
    </p>
  `;
  const html = emailLayout({ title, children, schoolName });
  return send({
    tenantId,
    to,
    subject: `Outstanding Fees for ${studentName} — ${termLabel}`,
    html,
    templateKey: 'FEE_REMINDER',
    retryPayload: { studentName, balance, termLabel },
  });
}

const ADMIN_NOTIFICATION_EMAILS = ['karldjansi123@gmail.com', 'djansikarl@gmail.com'];

export async function sendAdminNotification({ tenantId, to, subject, templateKey, data }) {
  const recipients = to && to.length ? to : ADMIN_NOTIFICATION_EMAILS;
  const title = 'Akademia Admin Notification';
  const rows = Object.entries(data || {}).map(([key, value]) => `
    <tr>
      <td style="padding:6px 0;font-size:14px;color:#64748b;text-transform:capitalize;width:160px;">${key.replace(/([A-Z])/g, ' $1').trim()}</td>
      <td style="padding:6px 0;font-size:14px;color:#0f172a;font-weight:600;">${String(value ?? '-')}</td>
    </tr>
  `).join('');
  const children = `
    <p style="margin:0 0 16px 0;font-size:15px;color:#475569;line-height:1.7;">
      An admin-level event has occurred. Here are the details:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
      <tr>
        <td style="padding:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${rows}
          </table>
        </td>
      </tr>
    </table>
  `;
  const promises = recipients.map((email) =>
    send({ tenantId, to: email, subject, html: emailLayout({ title, children, schoolName: data?.schoolName || 'Akademia' }), templateKey, retryPayload: data }),
  );
  const results = await Promise.allSettled(promises);
  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length > 0) {
    throw new Error(`Admin notification: ${failures.length}/${results.length} emails failed`);
  }
}
