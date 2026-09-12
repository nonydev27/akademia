/**
 * services/tenant.service.js
 */

import prisma from '../config/db.js';
import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSchoolCode } from './code.service.js';

export async function createTenantWithAdmin({
  schoolName, schoolLevel, adminFullName, adminEmail, adminPassword, adminPhone, adminContact,
  schoolCode,
}) {
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) throw ApiError.badRequest('A user with that email already exists');

  // Human-facing school code (initials). Unique across the platform.
  const code = await uniqueSchoolCode(schoolCode, schoolName);

  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });
  if (error) throw ApiError.badRequest(error.message);

  try {
    return await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: schoolName, code, schoolLevel, adminPhone, adminContact },
      });
      const admin = await tx.user.create({
        data: {
          tenantId:   tenant.id,
          role:       'SCHOOL_ADMIN',
          fullName:   adminFullName,
          email:      adminEmail,
          supabaseId: authUser.user.id,
          phone:      adminPhone,
        },
      });
      const subscription = await tx.subscription.create({
        data: { tenantId: tenant.id, status: 'ACTIVE', expiresAt },
      });
      return { tenant, admin, subscription };
    });
  } catch (err) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id).catch(() => {});
    throw err;
  }
}

export async function provisionTenantAdmin(tenantId, { fullName, email, password, phone }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.badRequest('A user with that email already exists');

  const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { fullName, role: 'SCHOOL_ADMIN', tenantId },
  });
  if (error) throw ApiError.badRequest(`Could not create account: ${error.message}`);

  const user = await prisma.user.create({
    data: {
      tenantId,
      role: 'SCHOOL_ADMIN',
      fullName,
      email,
      phone: phone || null,
      supabaseId: authUser.user.id,
    },
  });

  return user;
}
