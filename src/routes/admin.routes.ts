import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { broadcastNotificationSchema } from "../validators/admin.validator";

const router = Router();

router.use(protect, authorize("admin"));

router.get("/analytics", adminController.getAnalytics);
router.get("/students", adminController.listStudents);
router.get("/tutors", adminController.listTutors);
router.patch("/tutors/:id/approve", adminController.approveTutor);
router.patch("/users/:id/suspend", adminController.toggleSuspendUser);
router.delete("/users/:id", adminController.deleteUser);
router.post(
  "/notifications/broadcast",
  validateBody(broadcastNotificationSchema),
  adminController.broadcastNotification
);

export default router;
