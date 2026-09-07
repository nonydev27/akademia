/**
 * routes/staff.routes.js — teacher management (School Admin only).
 *
 * /api/v1/staff-members
 *
 * ORDERING MATTERS: specific paths (/assignments, /assignments/:id) must be
 * registered BEFORE the parameterized catch-all (/:id), otherwise Express
 * routes DELETE /assignments/:assignmentId to deactivateTeacher with id="assignments".
 */

import { Router } from 'express';
import { requireAuth }               from '../middleware/auth.middleware.js';
import { attachTenant }              from '../middleware/tenant.middleware.js';
import { requireRole }               from '../middleware/role.middleware.js';
import { requireActiveSubscription } from '../middleware/subscription.middleware.js';
import { validate }                  from '../middleware/validate.js';
import * as controller               from '../controllers/staff.controller.js';

const router = Router();

router.use(requireAuth, attachTenant, requireActiveSubscription, requireRole('SCHOOL_ADMIN'));

// ── Assignments (MUST come before /:id to avoid param collision) ──────────────
router.get('/assignments',                  controller.listAssignments);
router.post('/assignments',                 validate({ body: controller.assignSchema }), controller.assign);
router.delete('/assignments/:assignmentId', controller.removeAssignment);

// ── Teacher CRUD ──────────────────────────────────────────────────────────────
router.get('/',       controller.listTeachers);
router.post('/',      validate({ body: controller.createTeacherSchema }), controller.createTeacher);
router.delete('/:id', controller.deactivateTeacher);

export default router;
