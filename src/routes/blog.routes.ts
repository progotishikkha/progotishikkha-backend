import { Router } from "express";
import * as blogController from "../controllers/blog.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { upload } from "../middleware/upload.middleware";
import { createBlogSchema, updateBlogSchema, createCommentSchema } from "../validators/blog.validator";

const router = Router();

// --- Public ---
router.get("/", blogController.listPublished);
router.get("/admin/all", protect, authorize("admin"), blogController.listAllForAdmin);
router.get("/:slug", blogController.getBySlug);
router.get("/:slug/comments", blogController.listComments);

// --- Admin only ---
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("featuredImage"),
  validateBody(createBlogSchema),
  blogController.create
);
router.patch(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("featuredImage"),
  validateBody(updateBlogSchema),
  blogController.update
);
router.delete("/:id", protect, authorize("admin"), blogController.remove);

// --- Authenticated comment ---
router.post(
  "/:slug/comments",
  protect,
  validateBody(createCommentSchema),
  blogController.addComment
);

export default router;
