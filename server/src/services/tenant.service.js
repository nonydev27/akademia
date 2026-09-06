/**
 * services/tenant.service.js — shared tenant + first-admin bootstrap logic,
 * used by both auth.controller.registerTenant and tenant.controller.create.
 */

import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

export async function createTenantWithAdmin({ schoolName, schoolLevel, adminFullName, adminEmail, adminPassword }) {
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) throw ApiError.badRequest('A user with that email already exists');

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({ data: { name: schoolName, schoolLevel } });
    const admin = await tx.user.create({
      data: { tenantId: tenant.id, role: 'SCHOOL_ADMIN', fullName: adminFullName, email: adminEmail, passwordHash },
    });
    const subscription = await tx.subscription.create({
      data: { tenantId: tenant.id, status: 'ACTIVE', expiresAt },
    });
    return { tenant, admin, subscription };
  });
}
