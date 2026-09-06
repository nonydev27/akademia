/**
 * services/payment.service.js — subscription renewal payments (Paystack/Flutterwave).
 */

import crypto from 'node:crypto';
import { env } from '../config/env.js';

async function initializePaystack({ email, amount, reference, callbackUrl }) {
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100), // Paystack expects kobo/pesewas
      reference,
      callback_url: callbackUrl,
    }),
  });
  const body = await res.json();
  if (!res.ok || !body.status) {
    throw new Error(`Paystack initialize failed: ${JSON.stringify(body)}`);
  }
  return { checkoutUrl: body.data.authorization_url, reference: body.data.reference };
}

async function verifyPaystack(reference) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Paystack verify failed: ${JSON.stringify(body)}`);
  }
  return {
    success: body.data?.status === 'success',
    amount: (body.data?.amount || 0) / 100,
    reference: body.data?.reference,
  };
}

async function initializeFlutterwave({ email, amount, reference, callbackUrl }) {
  const res = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref: reference,
      amount,
      currency: 'GHS',
      redirect_url: callbackUrl,
      customer: { email },
    }),
  });
  const body = await res.json();
  if (!res.ok || body.status !== 'success') {
    throw new Error(`Flutterwave initialize failed: ${JSON.stringify(body)}`);
  }
  return { checkoutUrl: body.data.link, reference };
}

async function verifyFlutterwave(reference) {
  const res = await fetch(
    `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}` } }
  );
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Flutterwave verify failed: ${JSON.stringify(body)}`);
  }
  return {
    success: body.data?.status === 'successful',
    amount: body.data?.amount || 0,
    reference: body.data?.tx_ref,
  };
}

export async function initializeRenewalPayment({ tenantId, amount, email, callbackUrl }) {
  const reference = `akademia_${tenantId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  if (env.PAYMENT_PROVIDER === 'flutterwave') {
    return initializeFlutterwave({ email, amount, reference, callbackUrl });
  }
  return initializePaystack({ email, amount, reference, callbackUrl });
}

export async function verifyPayment(reference) {
  if (env.PAYMENT_PROVIDER === 'flutterwave') {
    return verifyFlutterwave(reference);
  }
  return verifyPaystack(reference);
}

export function verifyPaystackWebhookSignature(rawBody, signatureHeader) {
  const hash = crypto.createHmac('sha512', env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
  return hash === signatureHeader;
}
