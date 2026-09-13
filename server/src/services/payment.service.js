/**
 * services/payment.service.js — subscription renewal payments (Paystack/Flutterwave).
 */

import crypto from 'node:crypto';
import { env } from '../config/env.js';

async function initializePaystack({ email, amount, reference, callbackUrl, metadata }) {
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
      metadata: metadata || {},
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
    plan: body.data?.metadata?.plan,
  };
}

async function initializeFlutterwave({ email, amount, reference, callbackUrl, metadata }) {
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
      meta: metadata || {},
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
    plan: body.data?.meta?.plan,
  };
}

/**
 * True when no live payment provider is configured. In this mode renewal is
 * simulated locally so the whole subscription flow remains usable in
 * development and on free tiers without a Paystack/Flutterwave account. Set a
 * real secret key in .env to switch to live payments automatically.
 */
export function isDemoPaymentMode() {
  if (env.PAYMENT_PROVIDER === 'flutterwave') return !env.FLUTTERWAVE_SECRET_KEY;
  return !env.PAYSTACK_SECRET_KEY;
}

function makeReference(tenantId) {
  return `akademia_${tenantId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

export async function initializeRenewalPayment({ tenantId, amount, email, callbackUrl, metadata }) {
  const reference = makeReference(tenantId);

  if (isDemoPaymentMode()) {
    // No provider keys — return a self-contained checkout URL that points back
    // to the client so it can immediately verify and activate.
    const url = new URL(callbackUrl);
    url.searchParams.set('reference', reference);
    url.searchParams.set('demo', '1');
    return { checkoutUrl: url.toString(), reference, demo: true };
  }

  if (env.PAYMENT_PROVIDER === 'flutterwave') {
    return initializeFlutterwave({ email, amount, reference, callbackUrl, metadata });
  }
  return initializePaystack({ email, amount, reference, callbackUrl, metadata });
}

export async function verifyPayment(reference) {
  if (isDemoPaymentMode()) {
    // Nothing to verify against a provider; treat the local reference as paid.
    return { success: true, amount: null, reference, plan: null, demo: true };
  }

  if (env.PAYMENT_PROVIDER === 'flutterwave') {
    return verifyFlutterwave(reference);
  }
  return verifyPaystack(reference);
}

export function verifyPaystackWebhookSignature(rawBody, signatureHeader) {
  const hash = crypto.createHmac('sha512', env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
  return hash === signatureHeader;
}
