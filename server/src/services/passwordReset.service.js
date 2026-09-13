/**
 * services/passwordReset.service.js — password reset token management.
 *
 * Generates time-limited tokens, validates them, and invalidates after use.
 * Tokens are stored in the PasswordResetToken table.
 */

import crypto from 'node:crypto';

const TOKEN_LENGTH = 32;
const ONE_HOUR_MS = 60 * 60 * 1000;

export function generateToken() {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

export function getTokenExpiry() {
  return new Date(Date.now() + ONE_HOUR_MS);
}

export function isValidToken(token, expiresAt, used) {
  if (used) return false;
  if (!expiresAt) return false;
  return expiresAt.getTime() > Date.now();
}

export function sanitizeTokenForLog(token) {
  if (!token || token.length < 8) return '***';
  return token.slice(0, 4) + '***' + token.slice(-4);
}
