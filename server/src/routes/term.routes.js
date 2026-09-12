/**
 * routes/term.routes.js — read terms as labelled dropdown options.
 */

import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { attachTenant } from "../middleware/tenant.middleware.js";
import { requireActiveSubscription } from "../middleware/subscription.middleware.js";
import * as controller from "../controllers/term.controller.js";

const router = Router();

router.use(requireAuth, attachTenant, requireActiveSubscription);
router.get("/", controller.listTerms);

export default router;
