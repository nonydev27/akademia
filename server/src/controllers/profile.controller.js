/**
 * controllers/profile.controller.js — edit own profile (name, phone).
 * Password change goes through Supabase client-side (supabase.auth.updateUser).
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

// The image may be an absolute URL (link) OR a data: URL produced by a local
// upload, so we must not force a plain URL here. Cap the length to keep the
// JSON body reasonable (data URLs for avatars are small).
export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone:    z.string().optional(),
  image:    z.string().max(2_000_000).optional(),
});

export async function updateProfile(req, res) {
  const { fullName, phone, image } = req.body;

  const data = {};
  if (fullName) data.fullName = fullName;
  if (phone !== undefined) data.phone = phone || null;
  if (image !== undefined) {
    // A data: URL (local upload) is stored via uploadAvatar and arrives here as
    // an http(s) URL afterwards. If a raw data: URL slips through, accept it too.
    data.image = image || null;
  }

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

export const uploadAvatarSchema = z.object({
  imageBase64: z.string().optional(),
  imageUrl:    z.string().url().optional(),
});

export async function uploadAvatar(req, res) {
  const { imageBase64, imageUrl } = req.body;

  if (imageUrl) {
    if (!/^https?:\/\//i.test(imageUrl)) throw ApiError.badRequest('URL must start with http:// or https://');
    await prisma.user.update({
      where: { id: req.user.id },
      data: { image: imageUrl },
    });
    res.json({ image: imageUrl });
    return;
  }

  if (!imageBase64) throw ApiError.badRequest('No image provided');

  const match = imageBase64.match(/^data:(image\/[\w.+-]+);base64,(.+)$/s);
  if (!match) throw ApiError.badRequest('Invalid image format. Use JPEG, PNG or WebP.');

  const contentType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 5 * 1024 * 1024) throw ApiError.badRequest('Image must be under 5 MB');

  const ext = (contentType.split('/')[1] || 'png').replace('jpeg', 'jpg');
  const path = `avatars/${req.user.id}/${Date.now()}.${ext}`;

  const bucket = env.SUPABASE_AVATARS_BUCKET || 'avatars';

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: true });
  if (error) throw ApiError.badRequest(`Upload failed: ${error.message || 'storage error'}`);

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { image: data.publicUrl },
  });

  res.json({ image: data.publicUrl });
}
