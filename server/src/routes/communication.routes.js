/**
 * routes/communication.routes.js — communications log (PRD 5.5).
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { attachTenant } from '../middleware/tenant.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { requireFeature } from '../middleware/subscription.middleware.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/communication.controller.js';

const router = Router();

router.use(requireAuth, attachTenant);

// Reading the delivery log is always allowed; sending/retrying needs the
// email feature to be part of the school's plan.
router.get('/', validate({ query: controller.listQuerySchema }), controller.list);
router.post('/retry/:id', requireRole('SCHOOL_ADMIN'), requireFeature('email'), controller.retry);
router.post('/send', requireRole('SCHOOL_ADMIN'), requireFeature('email'), validate({ body: controller.sendSchema }), controller.send);

export default router;
