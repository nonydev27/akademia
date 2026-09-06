/**
 * routes/grade.routes.js — grading (PRD 5.4).
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { attachTenant } from '../middleware/tenant.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { requireActiveSubscription } from '../middleware/subscription.middleware.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/grade.controller.js';

const router = Router();

router.use(requireAuth, attachTenant, requireActiveSubscription);

router.post('/ca', requireRole('STAFF', 'SCHOOL_ADMIN'), validate({ body: controller.caSchema }), controller.submitCa);
router.post(
  '/exam',
  requireRole('STAFF', 'SCHOOL_ADMIN'),
  validate({ body: controller.examSchema }),
  controller.submitExam
);
router.post('/finalize/:studentId/:termId', requireRole('STAFF', 'SCHOOL_ADMIN'), controller.finalize);
router.get('/class/:classId/:termId', controller.classGradeSheet);

export default router;
