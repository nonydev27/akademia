/**
 * routes/student.routes.js — student records (PRD 5.1).
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { attachTenant } from '../middleware/tenant.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { requireActiveSubscription } from '../middleware/subscription.middleware.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/student.controller.js';

const router = Router();

router.use(requireAuth, attachTenant, requireActiveSubscription);

router.get('/', validate({ query: controller.listQuerySchema }), controller.list);
router.get('/next-student-id', controller.getNextStudentId);
router.post('/', requireRole('SCHOOL_ADMIN'), validate({ body: controller.createStudentSchema }), controller.create);
router.post('/bulk-delete', requireRole('SCHOOL_ADMIN'), validate({ body: controller.bulkDeleteSchema }), controller.bulkDelete);
router.post('/check-duplicate', requireRole('SCHOOL_ADMIN'), validate({ body: controller.checkDuplicateSchema }), controller.checkDuplicate);
router.get('/:id', controller.getById);
router.patch(
  '/:id',
  requireRole('SCHOOL_ADMIN'),
  validate({ body: controller.updateStudentSchema }),
  controller.update
);
router.delete('/:id', requireRole('SCHOOL_ADMIN'), controller.deactivate);
router.post(
  '/:id/guardians',
  requireRole('SCHOOL_ADMIN'),
  validate({ body: controller.addGuardianSchema }),
  controller.addGuardian
);

export default router;
