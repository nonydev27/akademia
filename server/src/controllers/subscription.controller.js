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
import { invalidateCached } from '../middleware/subscription.middleware.js';
import { initializeRenewalPayment, verifyPayment, verifyPaystackWebhookSignature } from '../services/payment.service.js';
import { planPrice, planFeatures, effectiveFeatures, isValidPlan } from '../config/plans.js';
import { sendAdminNotification } from '../services/email.service.js';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const ADMIN_NOTIFICATION_EMAILS = ['karldjansi123@gmail.com', 'djansikarl@gmail.com'];

export async function status(req, res) {
  const subscription = await prisma.subscription.findUnique({ where: { tenantId: req.tenantId } });
  if (!subscription) throw ApiError.notFound('No subscription found');

  const now = Date.now();
  const daysRemaining = Math.ceil((subscription.expiresAt.getTime() - now) / (24 * 60 * 60 * 1000));

  res.json({
    status: subscription.status,
    plan: subscription.plan,
    features: effectiveFeatures(subscription),
    expiresAt: subscription.expiresAt,
    graceEndsAt: subscription.graceEndsAt,
    daysRemaining,
    lastPaymentRef: subscription.lastPaymentRef,
    lastPaymentAt: subscription.lastPaymentAt,
    lastPaymentAmt: subscription.lastPaymentAmt,
  });
}

export const renewSchema = z.object({
  email: z.string().email(),
  callbackUrl: z.string().url(),
  plan: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).optional(),
});

export async function renewSelfServe(req, res) {
  const { email, callbackUrl } = req.body;

  const subscription = await prisma.subscription.findUnique({ where: { tenantId: req.tenantId }});
  if (!subscription) throw ApiError.notFound('No subscription found');

  // A school may self-serve an upgrade to a different plan; otherwise renew
  // whatever plan the Super Admin assigned. The amount always follows the plan.
  const plan = isValidPlan(req.body.plan) ? req.body.plan : subscription.plan || 'BASIC';
  const amount = planPrice(plan);

  const { checkoutUrl, reference } = await initializeRenewalPayment({
    tenantId: req.tenantId,
    amount,
    email,
    callbackUrl,
    metadata: { plan },
  });
  res.json({ checkoutUrl, reference, amount, plan });
}

async function activateSubscription(tenantId, reference, amount, plan) {
  invalidateCached(tenantId);
  const currentSubscription = await prisma.subscription.findUnique({ where: { tenantId }});
  const base =
    currentSubscription && currentSubscription.expiresAt > new Date()
      ? currentSubscription.expiresAt.getTime()
      : Date.now();

  const chosenPlan = isValidPlan(plan) ? plan : (currentSubscription?.plan || 'BASIC');

  return prisma.subscription.update({
    where: { tenantId },
    data: {
      status:        'ACTIVE',
      plan:          chosenPlan,
      features:      planFeatures(chosenPlan),
      expiresAt:     new Date(base + ONE_YEAR_MS),
      graceEndsAt:   null,
      lastPaymentRef: reference,
      lastPaymentAt: new Date(),
      lastPaymentAmt: amount ?? planPrice(chosenPlan),
    },
  });
}

export const verifyQuerySchema = z.object({
  reference: z.string().min(1),
  plan: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).optional(),
});

export async function verifyByReference(req, res) {
  const { reference, plan } = req.query;
  const result = await verifyPayment(reference);
  if (!result.success) throw ApiError.badRequest('Payment could not be verified');

  const subscription = await activateSubscription(
    req.tenantId,
    reference,
    result.amount,
    result.plan || plan,
  );

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    await sendAdminNotification({
      tenantId: req.tenantId,
      to: ADMIN_NOTIFICATION_EMAILS,
      subject: `Subscription Renewed — ${tenant?.name ?? 'School'}`,
      templateKey: 'SUBSCRIPTION_RENEWED',
      data: {
        schoolName: tenant?.name ?? 'Akademia',
        plan: subscription.plan,
        amount: subscription.lastPaymentAmt,
        reference: subscription.lastPaymentRef,
        expiresAt: subscription.expiresAt,
      },
    });
  } catch { /* non-fatal: notification failure should not block renewal */ }

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
      const amount    = (event.data.amount || 0) / 100;
      const plan      = event.data?.metadata?.plan;
      const tenantId  = reference.split('_')[1];
      await activateSubscription(tenantId, reference, amount, plan);
    }
  }

  res.json({ received: true });
}
