/**
 * routes/auth.routes.js — public + session routes.
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
router.post('/login', validate({ body: controller.loginSchema }), controller.login);
router.post('/refresh-token', controller.refreshToken);
router.post('/logout', controller.logout);
router.get('/me', requireAuth, controller.me);

export default router;
