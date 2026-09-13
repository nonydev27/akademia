import crypto from 'node:crypto';
import { z } from 'zod';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { sendPasswordResetEmail } from '../services/email.service.js';
import { logCommunication } from '../services/communication.service.js';
import logger from '../utils/logger.js';

const ONE_HOUR_MS = 60 * 60 * 1000;

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function forgotPassword(req, res) {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(200).json({ message: 'If an account exists, a reset link has been sent' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + ONE_HOUR_MS);

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  try {
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail({
      tenantId: user.tenantId,
      to: email,
      resetUrl,
      fullName: user.fullName,
    });
  } catch (err) {
    logger.warn('Password reset email failed to send', { email });
  }

  res.status(200).json({ message: 'If an account exists, a reset link has been sent' });
}

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function resetPassword(req, res) {
  const { token, newPassword } = req.body;

  const resetRecord = await prisma.passwordResetToken.findFirst({
    where: {
      token,
      expiresAt: { gt: new Date() },
      used: false,
    },
    include: { user: true },
  });

  if (!resetRecord) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  const { user } = resetRecord;

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.supabaseId, {
    password: newPassword,
  });
  if (error) {
    throw ApiError.badRequest(`Failed to update password: ${error.message}`);
  }

  await prisma.passwordResetToken.update({
    where: { id: resetRecord.id },
    data: { used: true },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { active: true },
  });

  logger.info('Password reset', { userId: user.id, email: user.email });

  res.json({ message: 'Password reset successfully' });
}
