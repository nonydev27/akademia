import { z } from 'zod';
import { createTenantWithAdmin } from '../services/tenant.service.js';

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
  let features = {};
  if (req.user.tenantId) {
    const tenant = await import('../config/db.js').then((m) =>
      m.default.tenant.findUnique({ where: { id: req.user.tenantId }, select: { name: true } })
    );
    tenantName = tenant?.name ?? null;
    const sub = await import('../config/db.js').then((m) =>
      m.default.subscription.findUnique({ where: { tenantId: req.user.tenantId }, select: { features: true } })
    );
    features = sub?.features || {};
  }
  res.json({ user: { ...req.user, tenantName, features } });
}
