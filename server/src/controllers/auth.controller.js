import { z } from 'zod';
import prisma from '../config/db.js';
import { createTenantWithAdmin } from '../services/tenant.service.js';
import { supabaseAdmin } from '../config/supabase.js';

export const registerTenantSchema = z.object({
  schoolName:     z.string().min(2),
  schoolLevel:    z.enum(['PRIMARY', 'JHS', 'SHS']),
  adminFullName:  z.string().min(2),
  adminEmail:     z.string().email(),
  adminPassword:  z.string().min(8),
  adminPhone:     z.string().optional(),
  adminContact:   z.string().optional(),
});

export async function registerTenant(req, res) {
  const result = await createTenantWithAdmin(req.body);
  res.status(201).json({
    tenant: result.tenant,
    admin: { id: result.admin.id, email: result.admin.email, fullName: result.admin.fullName },
  });
}

export async function me(req, res) {
  let tenantName = null;
  let tenantSlogan = null;
  let features = {};
  if (req.user.tenantId) {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.user.tenantId }, select: { name: true, slogan: true } });
    tenantName = tenant?.name ?? null;
    tenantSlogan = tenant?.slogan ?? null;
    const sub = await prisma.subscription.findUnique({ where: { tenantId: req.user.tenantId }, select: { features: true } });
    features = sub?.features || {};
  }
  res.json({ user: { ...req.user, tenantName, tenantSlogan, features } });
}
