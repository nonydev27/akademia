/**
 * services/email.service.js — abstracts the email provider (Resend or SMTP).
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

export async function sendResultEmail({ tenantId, to, studentName, pdfBuffer, termLabel }) {
  const subject = `${studentName}'s report card for ${termLabel} is ready`;
  const html = `<p>Dear parent/guardian,</p>
    <p>${studentName}'s report card for <strong>${termLabel}</strong> has been released. It is attached to this email as a PDF.</p>
    <p>— Akademia</p>`;
  return send({
    tenantId,
    to,
    subject,
    html,
    attachments: [{ filename: `${studentName}-${termLabel}-report-card.pdf`, content: pdfBuffer }],
    templateKey: 'RESULT_RELEASED',
    retryPayload: { studentName, termLabel },
  });
}

export async function sendFeeReminderEmail({ tenantId, to, studentName, balance, termLabel }) {
  const subject = `Outstanding fees for ${studentName} — ${termLabel}`;
  const html = `<p>Dear parent/guardian,</p>
    <p>${studentName}'s report card for <strong>${termLabel}</strong> is being withheld due to an outstanding balance of <strong>GHS ${balance.toFixed(2)}</strong>.</p>
    <p>Please settle the balance so the report card can be released.</p>
    <p>— Akademia</p>`;
  return send({
    tenantId,
    to,
    subject,
    html,
    templateKey: 'FEE_REMINDER',
    retryPayload: { studentName, balance, termLabel },
  });
}
