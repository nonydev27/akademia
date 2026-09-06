/**
 * routes/attendance.routes.js — daily attendance (PRD 5.2).
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { attachTenant } from '../middleware/tenant.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { requireActiveSubscription } from '../middleware/subscription.middleware.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/attendance.controller.js';

const router = Router();

router.use(requireAuth, attachTenant, requireActiveSubscription);

router.post(
  '/',
  requireRole('STAFF', 'SCHOOL_ADMIN'),
  validate({ body: controller.submitSchema }),
  controller.submit
);
router.get('/class/:classId', validate({ query: controller.classQuerySchema }), controller.forClass);
router.get('/student/:id', controller.forStudent);

export default router;
