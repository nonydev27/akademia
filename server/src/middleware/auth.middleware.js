/**
 * middleware/auth.middleware.js — verifies the JWT and attaches the user.
 */

import { verifyAccessToken } from '../services/auth.service.js';
import { ApiError } from '../utils/ApiError.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized();
  }

  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== 'access') throw new Error('wrong token type');
    req.user = { id: payload.userId, tenantId: payload.tenantId ?? null, role: payload.role };
    next();
  } catch {
    throw ApiError.unauthorized();
  }
}
