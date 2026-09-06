/**
 * services/sms.service.js — abstracts the SMS provider (Arkesel or Hubtel).
 */

import { env } from '../config/env.js';
import { normalizeGhanaPhone } from '../utils/phone.js';
import { logCommunication } from './communication.service.js';

async function sendViaArkesel({ to, message }) {
  const res = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
    method: 'POST',
    headers: {
      'api-key': env.ARKESEL_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sender: env.SMS_SENDER_ID, message, recipients: [to] }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.status === 'error') {
    throw new Error(`Arkesel error (${res.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

async function sendViaHubtel({ to, message }) {
  const auth = Buffer.from(`${env.HUBTEL_CLIENT_ID}:${env.HUBTEL_CLIENT_SECRET}`).toString('base64');
  const params = new URLSearchParams({
    From: env.SMS_SENDER_ID,
    To: to,
    Content: message,
  });
  const res = await fetch(`https://smsc.hubtel.com/v1/messages/send?${params.toString()}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Hubtel error (${res.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

async function send({ tenantId, to, message, templateKey, retryPayload }) {
  const normalized = normalizeGhanaPhone(to);
  if (!normalized) {
    await logCommunication({
      tenantId,
      channel: 'SMS',
      recipient: to,
      templateKey,
      status: 'FAILED',
      providerResponse: 'Invalid phone number format',
      payload: retryPayload,
    });
    throw new Error(`Invalid phone number: ${to}`);
  }

  try {
    const providerResponse =
      env.SMS_PROVIDER === 'hubtel'
        ? await sendViaHubtel({ to: normalized, message })
        : await sendViaArkesel({ to: normalized, message });

    await logCommunication({
      tenantId,
      channel: 'SMS',
      recipient: normalized,
      templateKey,
      status: 'SENT',
      providerResponse: JSON.stringify(providerResponse).slice(0, 2000),
      payload: retryPayload,
    });
  } catch (err) {
    await logCommunication({
      tenantId,
      channel: 'SMS',
      recipient: normalized,
      templateKey,
      status: 'FAILED',
      providerResponse: err.message?.slice(0, 2000),
      payload: retryPayload,
    });
    throw err;
  }
}

export async function sendResultConfirmationSms({ tenantId, to, studentName }) {
  const message = `Akademia: ${studentName}'s report card has been released and emailed to you.`;
  return send({ tenantId, to, message, templateKey: 'RESULT_RELEASED', retryPayload: { studentName } });
}

export async function sendFeeReminderSms({ tenantId, to, studentName, balance }) {
  const message = `Akademia: ${studentName}'s report card is on hold. Outstanding balance: GHS ${balance.toFixed(2)}. Please pay to release it.`;
  return send({ tenantId, to, message, templateKey: 'FEE_REMINDER', retryPayload: { studentName, balance } });
}
