/**
 * services/auth.service.js — JWT signing/verification helpers.
 *
 * Access tokens are short-lived and returned in the response body (kept in
 * memory client-side). Refresh tokens are longer-lived and set as an httpOnly
 * cookie so they're never reachable from client JS (mitigates XSS token theft).
 */

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken({ userId, tenantId, role }) {
  return jwt.sign({ userId, tenantId, role, type: 'access' }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export function signRefreshToken({ userId, tenantId, role }) {
  return jwt.sign({ userId, tenantId, role, type: 'refresh' }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET);
}

export const REFRESH_COOKIE_NAME = 'akademia_refresh';

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}
