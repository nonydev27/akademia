/**
 * routes/auth.routes.js — tenant registration + own-profile lookup.
 *
 * Login/logout/token refresh are handled client-side directly against
 * Supabase Auth and never touch this API.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/auth.controller.js';

const router = Router();

router.post(
  '/register-tenant',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  validate({ body: controller.registerTenantSchema }),
  controller.registerTenant
);
router.get('/me', requireAuth, controller.me);

export default router;
