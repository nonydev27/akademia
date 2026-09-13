/**
 * routes/tenant.routes.js — Super Admin only.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/tenant.controller.js';

const router = Router();

router.use(requireAuth, requireRole('SUPER_ADMIN'));

router.get('/', controller.list);
router.post('/', validate({ body: controller.createTenantSchema }), controller.create);
router.get('/:id', controller.getById);
router.patch('/:id', validate({ body: controller.updateTenantSchema }), controller.update);
router.patch(
  '/:id/subscription',
  validate({ body: controller.updateSubscriptionSchema }),
  controller.updateSubscription
);
router.patch('/:id/features', validate({ body: controller.updateFeaturesSchema }), controller.updateFeatures);
router.post('/:id/admin', requireRole('SUPER_ADMIN'), validate({ body: controller.createTenantAdminSchema }), controller.createTenantAdmin);

export default router;
