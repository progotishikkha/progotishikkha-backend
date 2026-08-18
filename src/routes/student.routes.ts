import { Router } from "express";
import * as profileController from "../controllers/profile.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { upload } from "../middleware/upload.middleware";
import { updateStudentProfileSchema } from "../validators/profile.validator";

const router = Router();

router.patch(
  "/me",
  protect,
  authorize("student"),
  validateBody(updateStudentProfileSchema),
  profileController.updateMyStudentProfile
);
// Was missing entirely — students had no endpoint to upload/change a
// profile photo. `protect` + `authorize("student")` + using req.user.id
// (never a client-supplied id) means only the authenticated student can
// ever touch their own photo.
router.post(
  "/me/photo",
  protect,
  authorize("student"),
  upload.single("photo"),
  profileController.uploadMyStudentPhoto
);

export default router;
