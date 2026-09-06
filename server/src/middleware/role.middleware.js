/**
 * middleware/role.middleware.js — role-based access control (RBAC).
 */

import { ApiError } from '../utils/ApiError.js';

export function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }
    next();
  };
}
