/**
 * controllers/tenant.controller.js — Super Admin tenant management.
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { createTenantWithAdmin, provisionTenantAdmin } from '../services/tenant.service.js';
import { invalidateCached } from '../middleware/subscription.middleware.js';
import { PLAN_LIST, planFeatures, isValidPlan } from '../config/plans.js';
import { supabaseAdmin } from '../config/supabase.js';
import logger from '../utils/logger.js';

export const createTenantSchema = z.object({
  schoolName: z.string().min(2),
  schoolLevel: z.enum(['PRIMARY', 'JHS', 'SHS']),
  adminFullName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  adminPhone: z.string().optional(),
  adminContact: z.string().optional(),
  plan: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).optional(),
});

export async function listPlans(req, res) {
  res.json({ plans: PLAN_LIST });
}

export async function create(req, res) {
  const result = await createTenantWithAdmin(req.body);
  res.status(201).json({
    tenant: result.tenant,
    admin: { id: result.admin.id, email: result.admin.email, fullName: result.admin.fullName },
  });
}

export async function list(req, res) {
  const tenants = await prisma.tenant.findMany({
    include: { subscription: true, _count: { select: { students: true, users: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ tenants });
}

export async function getById(req, res) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.params.id },
    include: {
      subscription: true,
      users: { select: { id: true, fullName: true, email: true, role: true } },
      _count: {
        select: {
          students: true,
          users: true,
          academicYears: true,
          classes: true,
          subjects: true,
          guardians: true,
          feeStructures: true,
          communications: true,
        },
      },
    },
  });
  if (!tenant) throw ApiError.notFound('Tenant not found');
  res.json({ tenant });
}

export const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  schoolLevel: z.enum(['PRIMARY', 'JHS', 'SHS']).optional(),
  slogan: z.string().max(200).optional(),
});

export async function update(req, res) {
  const tenant = await prisma.tenant.update({ where: { id: req.params.id }, data: req.body });
  res.json({ tenant });
}

export const updateSubscriptionSchema = z.object({
  status: z.enum(['ACTIVE', 'EXPIRED_IN_GRACE', 'EXPIRED_LOCKED']).optional(),
  expiresAt: z.coerce.date().optional(),
  graceEndsAt: z.coerce.date().nullable().optional(),
});

export const createTenantAdminSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

export async function createTenantAdmin(req, res) {
  const user = await provisionTenantAdmin(req.params.id, req.body);
  res.status(201).json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
    },
  });
}

export const updateFeaturesSchema = z.record(z.string(), z.boolean());

export async function updateFeatures(req, res) {
  invalidateCached(req.params.id);
  const updated = await prisma.subscription.update({
    where: { tenantId: req.params.id },
    data: { features: req.body },
  });
  res.json({ features: updated.features, subscription: updated });
}

export const updatePlanSchema = z.object({
  plan: z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
});

/**
 * Assign a plan to a school. Writes the plan AND resets the feature map to the
 * plan defaults, so picking a plan always results in a consistent feature set.
 * Optionally extends the expiry (used when a plan is chosen on signup).
 */
export async function updatePlan(req, res) {
  const { plan } = req.body;
  if (!isValidPlan(plan)) throw ApiError.badRequest('Unknown plan');

  invalidateCached(req.params.id);
  const existing = await prisma.subscription.findUnique({ where: { tenantId: req.params.id }});
  if (!existing) throw ApiError.notFound('No subscription found for this school');

  const subscription = await prisma.subscription.update({
    where: { tenantId: req.params.id },
    data: { plan, features: planFeatures(plan) },
  });
  res.json({ subscription });
}

export async function updateSubscription(req, res) {
  invalidateCached(req.params.id);
  const subscription = await prisma.subscription.update({
    where: { tenantId: req.params.id },
    data: req.body,
  });
  res.json({ subscription });
}
