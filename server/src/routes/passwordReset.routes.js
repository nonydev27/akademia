import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/passwordReset.controller.js';

const router = Router();

router.post(
  '/forgot-password',
  validate({ body: controller.forgotPasswordSchema }),
  controller.forgotPassword
);
router.post(
  '/reset-password',
  validate({ body: controller.resetPasswordSchema }),
  controller.resetPassword
);

export default router;
