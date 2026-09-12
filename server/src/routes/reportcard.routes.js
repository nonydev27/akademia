/**
 * routes/reportcard.routes.js — submit + approve workflow
 */

import { Router } from 'express';
import { requireAuth }               from '../middleware/auth.middleware.js';
import { attachTenant }              from '../middleware/tenant.middleware.js';
import { requireRole }               from '../middleware/role.middleware.js';
import { requireActiveSubscription } from '../middleware/subscription.middleware.js';
import * as controller               from '../controllers/reportcard.controller.js';

const router = Router();

router.use(requireAuth, attachTenant, requireActiveSubscription);

// Admin: list all report cards for a term (optionally filtered by status)
router.get('/', requireRole('SCHOOL_ADMIN'), controller.listForTerm);

// Teacher: submit for review
router.post('/submit/:studentId/:termId', requireRole('STAFF', 'SCHOOL_ADMIN'), controller.submit);

// Admin: approve (triggers fee check + release/withhold)
router.post('/approve/:studentId/:termId', requireRole('SCHOOL_ADMIN'), controller.approve);

// Admin: reject back to DRAFT
router.post('/reject/:studentId/:termId', requireRole('SCHOOL_ADMIN'), controller.reject);

// Admin legacy direct publish (same as approve)
router.post('/publish/:studentId/:termId', requireRole('SCHOOL_ADMIN'), controller.publish);

router.get('/:studentId/:termId', controller.getOne);
router.get('/:studentId/:termId/pdf', controller.downloadPdf);

export default router;
