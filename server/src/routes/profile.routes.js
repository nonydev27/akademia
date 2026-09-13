import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware.js';
import { attachTenantOptional } from '../middleware/tenant.middleware.js';
import { validate }    from '../middleware/validate.js';
import * as controller from '../controllers/profile.controller.js';

const router = Router();
// Profile is user-scoped, so it works for Super Admin (who has no tenant) too.
router.use(requireAuth, attachTenantOptional);

router.get('/',  controller.getProfile);
router.put('/',  validate({ body: controller.updateProfileSchema }), controller.updateProfile);
router.post('/upload-avatar', validate({ body: { imageBase64: z.string().optional(), imageUrl: z.string().url().optional() } }), controller.uploadAvatar);

export default router;
