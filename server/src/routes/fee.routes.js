/**
 * routes/fee.routes.js — fee ledger (PRD 5.3).
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { attachTenant } from '../middleware/tenant.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { requireActiveSubscription, requireFeature } from '../middleware/subscription.middleware.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/fee.controller.js';

const router = Router();

router.use(requireAuth, attachTenant, requireActiveSubscription, requireFeature('fees'));

router.post(
  '/structures',
  requireRole('SCHOOL_ADMIN'),
  validate({ body: controller.createStructureSchema }),
  controller.createStructure
);
router.get('/students/:id', controller.getStudentAccount);
router.post(
  '/payments',
  requireRole('SCHOOL_ADMIN'),
  validate({ body: controller.recordPaymentSchema }),
  controller.createPayment
);
router.get('/outstanding', requireRole('SCHOOL_ADMIN'), controller.outstanding);
router.post(
  '/students/:id/override',
  requireRole('SCHOOL_ADMIN'),
  validate({ body: controller.overrideSchema }),
  controller.override
);

export default router;
