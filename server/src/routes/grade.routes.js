/**
 * routes/grade.routes.js — grading (PRD 5.4).
 */

import { Router } from 'express';
import { requireAuth }               from '../middleware/auth.middleware.js';
import { attachTenant }              from '../middleware/tenant.middleware.js';
import { requireRole }               from '../middleware/role.middleware.js';
import { requireActiveSubscription } from '../middleware/subscription.middleware.js';
import { validate }                  from '../middleware/validate.js';
import * as controller               from '../controllers/grade.controller.js';

const router = Router();

router.use(requireAuth, attachTenant, requireActiveSubscription);

// ── Grade sheet (Excel-like) ──────────────────────────────────────────────────
// Load all students + existing grades for a class/subject/term in one call
router.get(
  '/sheet/:classId/:subjectId/:termId',
  controller.classGradeSheet
);

// Bulk upsert — saves the whole spreadsheet at once
router.post(
  '/sheet',
  requireRole('STAFF', 'SCHOOL_ADMIN'),
  validate({ body: controller.bulkUpsertSchema }),
  controller.bulkUpsertSheet
);

// Finalize all grades for a class/subject/term (locks editing)
router.post(
  '/finalize/:classId/:subjectId/:termId',
  requireRole('STAFF', 'SCHOOL_ADMIN'),
  controller.finalizeSheet
);

// ── Legacy single-record endpoints (backward compat) ─────────────────────────
router.post('/ca',   requireRole('STAFF', 'SCHOOL_ADMIN'), validate({ body: controller.caSchema }),   controller.submitCa);
router.post('/exam', requireRole('STAFF', 'SCHOOL_ADMIN'), validate({ body: controller.examSchema }), controller.submitExam);
router.post('/finalize/:studentId/:termId', requireRole('STAFF', 'SCHOOL_ADMIN'), controller.finalize);

// Admin/staff can still read old class sheet route
router.get('/class/:classId/:termId', controller.classGradeSheet);

export default router;
