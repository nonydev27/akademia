/**
 * controllers/subscription.controller.js — subscription status, self-serve
 * renewal, and payment confirmation (PRD 5.6 & 7).
 *
 * Two ways to confirm a renewal payment, both funnelling into the same
 * activateSubscription() so neither path can under- or over-extend a tenant:
 *  - verifyByReference: client calls this after the Paystack checkout
 *    redirects back — works without a public webhook URL, so it's the path
 *    that works for local/free-tier development.
 *  - webhook: Paystack calls this directly in production once a public URL
 *    exists; signature-verified before trusting the payload.
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { initializeRenewalPayment, verifyPayment, verifyPaystackWebhookSignature } from '../services/payment.service.js';

const RENEWAL_AMOUNT_GHS = 500;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export async function status(req, res) {
  const subscription = await prisma.subscription.findUnique({ where: { tenantId: req.tenantId } });
  if (!subscription) throw ApiError.notFound('No subscription found');

  const now = Date.now();
  const daysRemaining = Math.ceil((subscription.expiresAt.getTime() - now) / (24 * 60 * 60 * 1000));

  res.json({
    status: subscription.status,
    expiresAt: subscription.expiresAt,
    graceEndsAt: subscription.graceEndsAt,
    daysRemaining,
  });
}

export const renewSchema = z.object({
  email: z.string().email(),
  callbackUrl: z.string().url(),
});

export async function renewSelfServe(req, res) {
  const { email, callbackUrl } = req.body;
  const { checkoutUrl, reference } = await initializeRenewalPayment({
    tenantId: req.tenantId,
    amount: RENEWAL_AMOUNT_GHS,
    email,
    callbackUrl,
  });
  res.json({ checkoutUrl, reference });
}

async function activateSubscription(tenantId, reference) {
  const currentSubscription = await prisma.subscription.findUnique({ where: { tenantId } });
  const base =
    currentSubscription && currentSubscription.expiresAt > new Date() ? currentSubscription.expiresAt.getTime() : Date.now();

  return prisma.subscription.update({
    where: { tenantId },
    data: {
      status: 'ACTIVE',
      expiresAt: new Date(base + ONE_YEAR_MS),
      graceEndsAt: null,
      lastPaymentRef: reference,
    },
  });
}

export const verifyQuerySchema = z.object({
  reference: z.string().min(1),
});

export async function verifyByReference(req, res) {
  const { reference } = req.query;
  const result = await verifyPayment(reference);
  if (!result.success) throw ApiError.badRequest('Payment could not be verified');

  const subscription = await activateSubscription(req.tenantId, reference);
  res.json({ message: 'Subscription renewed', subscription });
}

export async function webhook(req, res) {
  if (env.PAYMENT_PROVIDER === 'paystack') {
    const signature = req.headers['x-paystack-signature'];
    const valid = signature && verifyPaystackWebhookSignature(req.body, signature);
    if (!valid) return res.status(401).json({ message: 'Invalid signature' });

    const event = JSON.parse(req.body.toString('utf8'));
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      const tenantId = reference.split('_')[1];
      await activateSubscription(tenantId, reference);
    }
  }

  res.json({ received: true });
}
