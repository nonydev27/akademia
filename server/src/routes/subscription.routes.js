/**
 * routes/subscription.routes.js — subscription & licensing (PRD 5.6 & 7).
 *
 * Deliberately does NOT use requireActiveSubscription — a locked tenant must
 * still be able to check its status and renew.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { attachTenant } from '../middleware/tenant.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/subscription.controller.js';

const router = Router();

// Public: Paystack calls this directly, no user session involved. Body is
// raw (see app.js) so the signature can be verified.
router.post('/webhook', controller.webhook);

router.use(requireAuth, attachTenant);

router.get('/status', controller.status);
router.post('/renew/self-serve', requireRole('SCHOOL_ADMIN'), validate({ body: controller.renewSchema }), controller.renewSelfServe);
router.get(
  '/renew/verify',
  requireRole('SCHOOL_ADMIN'),
  validate({ query: controller.verifyQuerySchema }),
  controller.verifyByReference
);

export default router;
