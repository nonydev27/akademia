/**
 * routes/class.routes.js — School Admin class management.
 * Classes carry a human-facing Class ID (code), never a UUID.
 */

import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { attachTenant } from "../middleware/tenant.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { requireActiveSubscription } from "../middleware/subscription.middleware.js";
import { validate } from "../middleware/validate.js";
import * as controller from "../controllers/class.controller.js";

const router = Router();

router.use(requireAuth, attachTenant, requireActiveSubscription);

// Admins manage classes; staff may list them (needed to pick a class).
router.get("/", controller.list);
router.post(
  "/",
  requireRole("SCHOOL_ADMIN"),
  validate({ body: controller.createClassSchema }),
  controller.create,
);
router.put(
  "/:id",
  requireRole("SCHOOL_ADMIN"),
  validate({ body: controller.updateClassSchema }),
  controller.update,
);
router.delete("/:id", requireRole("SCHOOL_ADMIN"), controller.remove);

export default router;
