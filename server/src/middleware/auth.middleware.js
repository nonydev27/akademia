/**
 * middleware/auth.middleware.js — verifies the Supabase access token and
 * attaches the matching Prisma user profile (tenant + role) to the request.
 */

import { supabaseAdmin } from '../config/supabase.js';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized();
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) throw ApiError.unauthorized();

  const profile = await prisma.user.findUnique({ where: { supabaseId: data.user.id } });
  if (!profile) throw ApiError.unauthorized();

  req.user = {
    id: profile.id,
    supabaseId: profile.supabaseId,
    tenantId: profile.tenantId,
    role: profile.role,
    fullName: profile.fullName,
    email: profile.email,
  };
  next();
}
