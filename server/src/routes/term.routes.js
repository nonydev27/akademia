/**
 * routes/term.routes.js — academic year + term management.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { attachTenant } from '../middleware/tenant.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { requireActiveSubscription, requireFeature } from '../middleware/subscription.middleware.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/term.controller.js';

const router = Router();

router.use(requireAuth, attachTenant, requireActiveSubscription, requireFeature('terms'));

router.get('/', controller.listTerms);
router.post('/', requireRole('SCHOOL_ADMIN'), validate({ body: controller.createTermSchema }), controller.createTerm);
router.put('/:id', requireRole('SCHOOL_ADMIN'), validate({ body: controller.updateTermSchema }), controller.updateTerm);
router.delete('/:id', requireRole('SCHOOL_ADMIN'), controller.deleteTerm);

export default router;
