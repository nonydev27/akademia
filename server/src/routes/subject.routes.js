/**
 * routes/subject.routes.js
 *
 * ORDERING: static paths (/verify-by-code) MUST come before param routes (/:id).
 */

import { Router } from 'express';
import { requireAuth }               from '../middleware/auth.middleware.js';
import { attachTenant }              from '../middleware/tenant.middleware.js';
import { requireRole }               from '../middleware/role.middleware.js';
import { requireActiveSubscription } from '../middleware/subscription.middleware.js';
import { validate }                  from '../middleware/validate.js';
import * as controller               from '../controllers/subject.controller.js';

const router = Router();

router.use(requireAuth, attachTenant, requireActiveSubscription);

// Static routes FIRST
router.get('/',    requireRole('SCHOOL_ADMIN'), controller.listSubjects);
router.post('/',   requireRole('SCHOOL_ADMIN'), validate({ body: controller.createSubjectSchema }), controller.createSubject);

// Verify by code (teacher portal) — must be before /:id
router.post('/verify-by-code', validate({ body: controller.verifyByCodeSchema }), controller.verifyByCode);

// Parameterized routes
router.put('/:id',    requireRole('SCHOOL_ADMIN'), validate({ body: controller.updateSubjectSchema }), controller.updateSubject);
router.delete('/:id', requireRole('SCHOOL_ADMIN'), controller.deleteSubject);
router.post('/:id/pin',        validate({ body: controller.setPinSchema }),    controller.setPin);
router.post('/:id/verify-pin', validate({ body: controller.verifyPinSchema }), controller.verifyPin);

export default router;
