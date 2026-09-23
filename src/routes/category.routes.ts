import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { createCategorySchema } from "../validators/category.validator";

const router = Router();

router.get("/", categoryController.list);
router.post("/", protect, authorize("admin"), validateBody(createCategorySchema), categoryController.create);
router.delete("/:id", protect, authorize("admin"), categoryController.remove);

export default router;
