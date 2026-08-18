import { Router } from "express";
import * as applicationController from "../controllers/application.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { applyToTuitionSchema } from "../validators/application.validator";

const router = Router();

router.use(protect);

router.post("/", authorize("tutor"), validateBody(applyToTuitionSchema), applicationController.apply);
router.get("/mine", authorize("tutor"), applicationController.listMine);
router.get("/post/:postId", authorize("student"), applicationController.listForPost);
router.patch("/:id/hire", authorize("student"), applicationController.hire);
router.patch("/:id/reject", authorize("student"), applicationController.reject);

export default router;
