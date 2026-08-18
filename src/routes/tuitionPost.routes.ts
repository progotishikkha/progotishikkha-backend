import { Router } from "express";
import * as tuitionPostController from "../controllers/tuitionPost.controller";
import * as applicationController from "../controllers/application.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  createTuitionPostSchema,
  updateTuitionPostSchema,
  tuitionFiltersSchema,
} from "../validators/tuitionPost.validator";

const router = Router();

router.use(protect);

router.get("/mine", authorize("student"), tuitionPostController.listMine);
router.get("/saved", authorize("tutor"), applicationController.listSaved);
router.get("/", validateQuery(tuitionFiltersSchema), tuitionPostController.listLive);
router.get("/:id", tuitionPostController.getById);

router.post(
  "/",
  authorize("student"),
  validateBody(createTuitionPostSchema),
  tuitionPostController.create
);
router.post("/:id/save", authorize("tutor"), applicationController.save);
router.patch(
  "/:id",
  authorize("student"),
  validateBody(updateTuitionPostSchema),
  tuitionPostController.update
);
router.delete("/:id", authorize("student"), tuitionPostController.remove);
router.delete("/:id/save", authorize("tutor"), applicationController.unsave);

export default router;
