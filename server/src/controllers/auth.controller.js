/**
 * controllers/auth.controller.js
 *
 * Handles register-tenant, login, refresh, logout, me.
 */

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from '../services/auth.service.js';
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

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');

  const tokenPayload = { userId: user.id, tenantId: user.tenantId, role: user.role };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  res.json({
    accessToken,
    user: { id: user.id, tenantId: user.tenantId, role: user.role, fullName: user.fullName, email: user.email },
  });
}

export async function refreshToken(req, res) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = verifyRefreshToken(token);
    if (payload.type !== 'refresh') throw new Error('wrong token type');
  } catch {
    throw ApiError.unauthorized();
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw ApiError.unauthorized();

  const tokenPayload = { userId: user.id, tenantId: user.tenantId, role: user.role };
  const accessToken = signAccessToken(tokenPayload);
  const newRefreshToken = signRefreshToken(tokenPayload);

  res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions());
  res.json({
    accessToken,
    user: { id: user.id, tenantId: user.tenantId, role: user.role, fullName: user.fullName, email: user.email },
  });
}

export async function logout(req, res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
  res.json({ message: 'Logged out' });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw ApiError.unauthorized();
  res.json({
    user: { id: user.id, tenantId: user.tenantId, role: user.role, fullName: user.fullName, email: user.email },
  });
}
