/**
 * middleware/subscription.middleware.js — enforces per-tenant licensing (PRD 5.6 & 7).
 *
 * Must run AFTER attachTenant. Super Admin routes should not use this at all.
 */

import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export async function requireActiveSubscription(req, res, next) {
  const subscription = await prisma.subscription.findUnique({ where: { tenantId: req.tenantId } });

  if (!subscription) {
    throw ApiError.forbidden('No subscription found for this school. Contact the platform administrator.');
  }

  const now = new Date();

  if (subscription.status === 'ACTIVE' && subscription.expiresAt > now) {
    return next();
  }

  const graceEndsAt =
    subscription.graceEndsAt ??
    new Date(subscription.expiresAt.getTime() + env.SUBSCRIPTION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  if (now <= graceEndsAt) {
    req.subscriptionWarning = {
      status: 'EXPIRED_IN_GRACE',
      graceEndsAt,
    };
    if (subscription.status !== 'EXPIRED_IN_GRACE') {
      await prisma.subscription.update({
        where: { tenantId: req.tenantId },
        data: { status: 'EXPIRED_IN_GRACE', graceEndsAt },
      });
    }
    return next();
  }

  if (subscription.status !== 'EXPIRED_LOCKED') {
    await prisma.subscription.update({
      where: { tenantId: req.tenantId },
      data: { status: 'EXPIRED_LOCKED' },
    });
  }

  throw new ApiError(402, 'Your school\'s subscription has expired. Please renew to continue.');
}
