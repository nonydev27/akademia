/**
 * controllers/profile.controller.js — edit own profile (name, phone).
 * Password change goes through Supabase client-side (supabase.auth.updateUser).
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { supabaseAdmin } from '../config/supabase.js';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone:    z.string().optional(),
});

export async function updateProfile(req, res) {
  const { fullName, phone } = req.body;

  const data = {};
  if (fullName) data.fullName = fullName;
  if (phone !== undefined) data.phone = phone || null;

  const user = await prisma.user.update({ where: { id: req.user.id }, data });

  // Keep Supabase user_metadata in sync with fullName
  if (fullName) {
    await supabaseAdmin.auth.admin.updateUserById(user.supabaseId, {
      user_metadata: { fullName },
    }).catch(() => {});
  }

  res.json({
    user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role },
  });
}

export async function getProfile(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, fullName: true, email: true, phone: true, role: true, createdAt: true },
  });
  res.json({ user });
}
