import { Router } from "express";
import * as contactController from "../controllers/contact.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { authRateLimiter } from "../middleware/rateLimiter";
import { createContactMessageSchema, updateContactStatusSchema } from "../validators/contact.validator";

const router = Router();

router.post("/", authRateLimiter, validateBody(createContactMessageSchema), contactController.submit);
router.get("/", protect, authorize("admin"), contactController.listAll);
router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  validateBody(updateContactStatusSchema),
  contactController.updateStatus
);

export default router;
