/**
 * controllers/auth.controller.js
 *
 * Sign-in/sign-out happen client-side directly against Supabase Auth — this
 * controller only handles registering new tenants (which provisions a
 * Supabase Auth user for the admin) and returning the caller's own profile.
 */

import { z } from 'zod';
import { createTenantWithAdmin } from '../services/tenant.service.js';

export const registerTenantSchema = z.object({
  schoolName: z.string().min(2),
  schoolLevel: z.enum(['PRIMARY', 'JHS', 'SHS']),
  adminFullName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});

export async function registerTenant(req, res) {
  const result = await createTenantWithAdmin(req.body);

  res.status(201).json({
    tenant: result.tenant,
    admin: { id: result.admin.id, email: result.admin.email, fullName: result.admin.fullName },
  });
}

export async function me(req, res) {
  res.json({ user: req.user });
}
