import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware.js';
import { attachTenant } from '../middleware/tenant.middleware.js';
import { validate }    from '../middleware/validate.js';
import * as controller from '../controllers/profile.controller.js';

const router = Router();
router.use(requireAuth, attachTenant);

router.get('/',  controller.getProfile);
router.put('/',  validate({ body: controller.updateProfileSchema }), controller.updateProfile);
router.post('/upload-avatar', validate({ body: { imageBase64: z.string() } }), controller.uploadAvatar);

export default router;
