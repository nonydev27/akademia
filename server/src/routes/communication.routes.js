/**
 * routes/communication.routes.js — communications log (PRD 5.5).
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { attachTenant } from '../middleware/tenant.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/communication.controller.js';

const router = Router();

router.use(requireAuth, attachTenant);

router.get('/', validate({ query: controller.listQuerySchema }), controller.list);
router.post('/retry/:id', requireRole('SCHOOL_ADMIN'), controller.retry);

export default router;
