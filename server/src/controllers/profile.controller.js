/**
 * controllers/profile.controller.js — edit own profile (name, phone).
 * Password change goes through Supabase client-side (supabase.auth.updateUser).
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone:    z.string().optional(),
  image:    z.string().url().optional().or(z.literal('')),
});

export async function updateProfile(req, res) {
  const { fullName, phone, image } = req.body;

  const data = {};
  if (fullName) data.fullName = fullName;
  if (phone !== undefined) data.phone = phone || null;
  if (image !== undefined) data.image = image || null;

  const user = await prisma.user.update({ where: { id: req.user.id }, data });

  if (fullName) {
    await supabaseAdmin.auth.admin.updateUserById(user.supabaseId, {
      user_metadata: { fullName },
    }).catch(() => {});
  }

  res.json({
    user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, image: user.image },
  });
}

export async function getProfile(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, fullName: true, email: true, phone: true, role: true, image: true, createdAt: true },
  });
  res.json({ user });
}

export async function uploadAvatar(req, res) {
  const { imageBase64 } = req.body;
  if (!imageBase64) throw ApiError.badRequest('No image provided');

  const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw ApiError.badRequest('Invalid image format. Use JPEG or PNG.');

  const contentType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const ext = contentType.split('/')[1];
  const path = `avatars/${req.user.id}/${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(path, buffer, { contentType, upsert: true });
  if (error) throw ApiError.badRequest('Upload failed');

  const { data } = supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET).getPublicUrl(path);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { image: data.publicUrl },
  });

  res.json({ image: data.publicUrl });
}
