/**
 * routes/reportcard.routes.js — report cards + the Result-Fee Intercept (PRD section 6).
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { attachTenant } from '../middleware/tenant.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { requireActiveSubscription } from '../middleware/subscription.middleware.js';
import * as controller from '../controllers/reportcard.controller.js';

const router = Router();

router.use(requireAuth, attachTenant, requireActiveSubscription);

router.post('/publish/:studentId/:termId', requireRole('SCHOOL_ADMIN'), controller.publish);
router.get('/:studentId/:termId', controller.getOne);
router.get('/:studentId/:termId/pdf', controller.downloadPdf);

export default router;
