/**
 * controllers/tenant.controller.js — Super Admin tenant management.
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { createTenantWithAdmin } from '../services/tenant.service.js';

export const createTenantSchema = z.object({
  schoolName: z.string().min(2),
  schoolLevel: z.enum(['PRIMARY', 'JHS', 'SHS']),
  adminFullName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});

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
    include: { subscription: true, users: { select: { id: true, fullName: true, email: true, role: true } } },
  });
  if (!tenant) throw ApiError.notFound('Tenant not found');
  res.json({ tenant });
}

export const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  schoolLevel: z.enum(['PRIMARY', 'JHS', 'SHS']).optional(),
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

export async function updateSubscription(req, res) {
  const subscription = await prisma.subscription.update({
    where: { tenantId: req.params.id },
    data: req.body,
  });
  res.json({ subscription });
}
