import { Router } from "express";
import * as reviewController from "../controllers/review.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { createReviewSchema } from "../validators/review.validator";

const router = Router();

router.get("/admin/all", protect, authorize("admin"), reviewController.listAllForAdmin);
router.get("/tutor/:tutorId", reviewController.listForTutor);
router.post("/", protect, authorize("student"), validateBody(createReviewSchema), reviewController.create);
router.delete("/:id", protect, authorize("admin"), reviewController.remove);

export default router;
