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

router.use(requireAuth, attachTenant, requireActiveSubscription);

// Teacher portal: the caller's own assignments (STAFF) — MUST be before /:id.
router.get('/mine', requireRole('STAFF'), controller.listMyAssignments);

// ── Assignments (admin only; MUST come before /:id) ──────────────────────────
router.get('/assignments',                  requireRole('SCHOOL_ADMIN'), controller.listAssignments);
router.post('/assignments',                 requireRole('SCHOOL_ADMIN'), validate({ body: controller.assignSchema }), controller.assign);
router.delete('/assignments/:assignmentId', requireRole('SCHOOL_ADMIN'), controller.removeAssignment);

// ── Teacher CRUD ──────────────────────────────────────────────────────────────
router.get('/',       requireRole('SCHOOL_ADMIN'), controller.listTeachers);
router.post('/',      requireRole('SCHOOL_ADMIN'), validate({ body: controller.createTeacherSchema }), controller.createTeacher);
router.delete('/:id', requireRole('SCHOOL_ADMIN'), controller.deactivateTeacher);

export default router;
