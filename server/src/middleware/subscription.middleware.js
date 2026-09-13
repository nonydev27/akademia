/**
 * middleware/subscription.middleware.js — enforces per-tenant licensing (PRD 5.6 & 7).
 *
 * Must run AFTER attachTenant. Super Admin routes should not use this at all.
 *
 * Uses a short TTL in-memory cache to avoid hitting the DB on every request —
 * Supabase free-tier pooler adds significant latency, and subscription status
 * rarely changes. Cache TTL is 30s which catches status changes within a minute.
 */

import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { effectiveFeatures } from '../config/plans.js';

const SUBSCRIPTION_CACHE = new Map();
const CACHE_TTL_MS = 30000;

function getCached(tenantId) {
  const entry = SUBSCRIPTION_CACHE.get(tenantId);
  if (entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS) {
    return entry.subscription;
  }
  SUBSCRIPTION_CACHE.delete(tenantId);
  return null;
}

function setCached(tenantId, subscription) {
  SUBSCRIPTION_CACHE.set(tenantId, { subscription, fetchedAt: Date.now() });
}

function invalidateCached(tenantId) {
  SUBSCRIPTION_CACHE.delete(tenantId);
}

export async function requireActiveSubscription(req, res, next) {
  const tenantId = req.tenantId;

  let subscription = getCached(tenantId);

  if (!subscription) {
    subscription = await prisma.subscription.findUnique({ where: { tenantId } });
    if (subscription) setCached(tenantId, subscription);
  }

  if (!subscription) {
    throw ApiError.forbidden('No subscription found for this school. Contact the platform administrator.');
  }

  const now = new Date();

  if (subscription.status === 'ACTIVE' && subscription.expiresAt > now) {
    req.subscriptionFeatures = effectiveFeatures(subscription);
    return next();
  }

  // Subscription is expired or expired in grace — fetch fresh from DB and update status
  invalidateCached(tenantId);
  const fresh = await prisma.subscription.findUnique({ where: { tenantId } });
  if (fresh) setCached(tenantId, fresh);

  const graceEndsAt =
    fresh?.graceEndsAt ??
    new Date(subscription.expiresAt.getTime() + env.SUBSCRIPTION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  if (now <= graceEndsAt) {
    req.subscriptionWarning = {
      status: 'EXPIRED_IN_GRACE',
      graceEndsAt,
    };
    if (subscription.status !== 'EXPIRED_IN_GRACE') {
      await prisma.subscription.update({
        where: { tenantId },
        data: { status: 'EXPIRED_IN_GRACE', graceEndsAt },
      });
      invalidateCached(tenantId);
      const updated = await prisma.subscription.findUnique({ where: { tenantId } });
      if (updated) setCached(tenantId, updated);
    }
    req.subscriptionFeatures = effectiveFeatures(fresh || subscription);
    return next();
  }

  if (subscription.status !== 'EXPIRED_LOCKED') {
    await prisma.subscription.update({
      where: { tenantId },
      data: { status: 'EXPIRED_LOCKED' },
    });
    invalidateCached(tenantId);
  }

  throw new ApiError(402, 'Your school\'s subscription has expired. Please renew to continue.');
}

export function requireFeature(feature) {
  return async (req, res, next) => {
    // Features are normally attached by requireActiveSubscription. When a route
    // uses requireFeature without it (e.g. the communications log), load the
    // subscription here so the gate is still accurate.
    let features = req.subscriptionFeatures;
    if (!features) {
      const sub = await prisma.subscription.findUnique({ where: { tenantId: req.tenantId }});
      features = sub ? effectiveFeatures(sub) : {};
      req.subscriptionFeatures = features;
    }
    if (features[feature] === true) return next();
    throw ApiError.forbidden(`This school's subscription does not include access to ${feature}. Contact the platform administrator.`);
  };
}

export { invalidateCached };
