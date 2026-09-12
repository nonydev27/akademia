/**
 * routes/gradeBands.routes.js — configurable grade scales (admin only).
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { attachTenant } from '../middleware/tenant.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { requireActiveSubscription } from '../middleware/subscription.middleware.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/gradeBand.controller.js';

const router = Router();

router.use(requireAuth, attachTenant, requireActiveSubscription);

router.get('/', requireRole('SCHOOL_ADMIN'), controller.listBands);
router.post('/', requireRole('SCHOOL_ADMIN'), validate({ body: controller.createBandsSchema }), controller.setBands);
router.delete('/:id', requireRole('SCHOOL_ADMIN'), controller.deleteBand);

export default router;
