/**
 * routes/attendance.routes.js
 */

import { Router } from 'express';
import { requireAuth }               from '../middleware/auth.middleware.js';
import { attachTenant }              from '../middleware/tenant.middleware.js';
import { requireRole }               from '../middleware/role.middleware.js';
import { requireActiveSubscription, requireFeature } from '../middleware/subscription.middleware.js';
import { validate }                  from '../middleware/validate.js';
import * as controller               from '../controllers/attendance.controller.js';

const router = Router();

router.use(requireAuth, attachTenant, requireActiveSubscription, requireFeature('attendance'));

// Staff or Admin: submit attendance (staff must be assigned to the subject)
router.post('/', requireRole('STAFF', 'SCHOOL_ADMIN'), validate({ body: controller.submitSchema }), controller.submit);

// Roster for a class on a date (optionally filtered by subjectId)
router.get('/class/:classId', controller.forClass);

// Admin-only: summary stats (total/present/absent per student)
router.get('/summary', requireRole('SCHOOL_ADMIN'), controller.summary);

// Per-student attendance history
router.get('/student/:id', controller.forStudent);

export default router;
