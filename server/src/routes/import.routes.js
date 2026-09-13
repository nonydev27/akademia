/**
 * routes/import.routes.js — AI-assisted bulk import of student records.
 * Feature-gated by the `aiImport` plan feature.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { attachTenant } from '../middleware/tenant.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { requireActiveSubscription, requireFeature } from '../middleware/subscription.middleware.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/import.controller.js';

const router = Router();

router.use(
  requireAuth,
  attachTenant,
  requireActiveSubscription,
  requireRole('SCHOOL_ADMIN', 'STAFF'),
  requireFeature('aiImport'),
);

router.post('/preview', validate({ body: controller.previewSchema }), controller.preview);
router.post('/commit', validate({ body: controller.commitSchema }), controller.commit);

export default router;
