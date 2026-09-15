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

  // Mark subscription as PENDING before payment — activation requires
  // Super Admin confirmation when using test-mode keys.
  await prisma.subscription.update({
    where: { tenantId: req.tenantId },
    data: { status: 'PENDING', lastPaymentRef: null },
  });

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

  // Payment verified — keep subscription PENDING. Activation requires
  // Super Admin confirmation when using test-mode keys.
  const subscription = await prisma.subscription.update({
    where: { tenantId: req.tenantId },
    data: {
      status: 'PENDING',
      lastPaymentRef: reference,
      lastPaymentAt: new Date(),
      lastPaymentAmt: result.amount ?? null,
    },
  });

  // Notify Super Admin to confirm the payment
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN', active: true },
      select: { email: true, fullName: true },
    });
    const superAdminEmails = superAdmins.map((a) => a.email);
    if (superAdminEmails.length > 0) {
      await sendAdminNotification({
        tenantId: req.tenantId,
        to: superAdminEmails,
        subject: `Pending Subscription — ${tenant?.name ?? 'School'}`,
        templateKey: 'SUBSCRIPTION_RENEWED',
        data: {
          schoolName: tenant?.name ?? 'Akademia',
          plan: subscription.plan,
          amount: subscription.lastPaymentAmt,
          reference: subscription.lastPaymentRef,
          expiresAt: subscription.expiresAt,
        },
      });
    }
  } catch (err) { /* non-fatal: notification failure should not block */ }

  res.json({ message: 'Payment received — pending Super Admin confirmation', subscription });
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
      // Always hold as PENDING for Super Admin confirmation in test mode.
      // In production with live keys, the webhook auto-activates.
      if (env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_')) {
        await prisma.subscription.update({
          where: { tenantId },
          data: { status: 'PENDING', lastPaymentRef: reference, lastPaymentAmt: amount },
        });
      } else {
        await activateSubscription(tenantId, reference, amount, plan);
      }
    }
  }

  res.json({ received: true });
}

export const confirmSchema = z.object({
  reference: z.string().min(1),
});

export async function confirm(req, res) {
  const { reference } = req.body;
  const result = await verifyPayment(reference);
  if (!result.success) throw ApiError.badRequest('Payment could not be verified');

  const subscription = await prisma.subscription.findFirst({
    where: {
      tenantId: req.params.tenantId,
      status: 'PENDING',
      lastPaymentRef: reference,
    },
  });
  if (!subscription) throw ApiError.notFound('No pending subscription found for this reference');

  invalidateCached(req.params.tenantId);
  const plan = subscription.plan;
  const amount = result.amount ?? planPrice(plan);
  const base = subscription.expiresAt > new Date() ? subscription.expiresAt.getTime() : Date.now();

  const updated = await prisma.subscription.update({
    where: { tenantId: req.params.tenantId },
    data: {
      status: 'ACTIVE',
      features: planFeatures(plan),
      expiresAt: new Date(base + ONE_YEAR_MS),
      graceEndsAt: null,
      lastPaymentRef: reference,
      lastPaymentAt: new Date(),
      lastPaymentAmt: amount,
    },
  });

  res.json({ message: 'Subscription activated', subscription: updated });
}

export async function pendingList(req, res) {
  const pending = await prisma.subscription.findMany({
    where: { status: 'PENDING' },
    include: {
      tenant: {
        include: {
          users: { select: { id: true, fullName: true, email: true, role: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  res.json({
    pending: pending.map((s) => ({
      id: s.id,
      tenantId: s.tenantId,
      schoolName: s.tenant?.name ?? 'Unknown',
      plan: s.plan,
      amount: s.lastPaymentAmt,
      reference: s.lastPaymentRef,
      paymentAt: s.lastPaymentAt,
      requestedBy: s.tenant?.users?.[0]?.email ?? 'Unknown',
    })),
  });
}
