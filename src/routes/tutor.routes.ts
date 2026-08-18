import { Router } from "express";
import * as profileController from "../controllers/profile.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { validateBody, validateQuery } from "../middleware/validate";
import { upload } from "../middleware/upload.middleware";
import { authRateLimiter } from "../middleware/rateLimiter";
import { updateTutorProfileSchema, tutorFiltersSchema } from "../validators/profile.validator";

const router = Router();

// Public marketplace — search/filter/paginate approved tutors.
router.get("/", validateQuery(tutorFiltersSchema), profileController.listTutors);

// `/me/*` routes must be registered before the `/:id` catch-all below, or
// Express would try to look up a TutorProfile with id "me".
router.get("/me/analytics", protect, authorize("tutor"), profileController.getMyContactAnalytics);
router.patch(
  "/me",
  protect,
  authorize("tutor"),
  validateBody(updateTutorProfileSchema),
  profileController.updateMyTutorProfile
);
router.post(
  "/me/photo",
  protect,
  authorize("tutor"),
  upload.single("photo"),
  profileController.uploadMyTutorPhoto
);

// Public — logging profile view / call click / WhatsApp click. Rate-limited
// (shares the auth limiter's budget) so it can't be used to spam-write the
// ContactEvent collection.
router.post("/:id/contact-events", authRateLimiter, profileController.trackContactEvent);

router.get("/:id", profileController.getTutorById); // public — no `protect`, so guests can view tutor profiles

export default router;
