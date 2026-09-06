/**
 * middleware/tenant.middleware.js — enforces tenant isolation.
 *
 * THIS IS THE MOST SECURITY-CRITICAL FILE IN THE PROJECT (see PRD sections 3 & 4).
 * Must run AFTER requireAuth. Never derive tenantId from req.body/query/params.
 */

import { ApiError } from '../utils/ApiError.js';

export function attachTenant(req, res, next) {
  if (!req.user) throw ApiError.unauthorized();
  if (!req.user.tenantId) {
    throw ApiError.forbidden('This account is not associated with a school tenant');
  }
  req.tenantId = req.user.tenantId;
  next();
}
