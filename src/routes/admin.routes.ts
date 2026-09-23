import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { broadcastNotificationSchema, verificationActionSchema, donationVerificationSchema, donationSalaryReceivedSchema } from "../validators/admin.validator";

const router = Router();
router.use(protect, authorize("admin"));

router.get("/analytics", adminController.getAnalytics);
router.get("/students", adminController.listStudents);
router.get("/tutors", adminController.listTutors);
router.patch("/students/:id/verification", validateBody(verificationActionSchema), adminController.verifyStudent);
router.patch("/tutors/:id/verification", validateBody(verificationActionSchema), adminController.verifyTutor);
router.patch("/tutors/:id/approve", adminController.verifyTutor);
router.get("/users/:id/contact", adminController.getUserContact);
router.patch("/users/:id/suspend", adminController.toggleSuspendUser);
router.delete("/users/:id", adminController.deleteUser);

router.get("/tuition-posts", adminController.listTuitionPosts);
router.get("/tuition-posts/:id", adminController.getTuitionPostDetail);
router.delete("/tuition-posts/:id", adminController.deleteTuitionPost);

// Admin mediation / connection state machine (spec section 9).
router.patch("/applications/:id/contact-start", adminController.startApplicationContact);
router.patch("/applications/:id/connect", adminController.markApplicationConnected);
router.patch("/applications/:id/connection-failed", adminController.markApplicationConnectionFailed);
router.patch("/applications/:id/cancel", adminController.cancelApplicationConnection);

router.get("/donations", adminController.listDonations);
router.patch("/donations/:id/salary-received", validateBody(donationSalaryReceivedSchema), adminController.markDonationSalaryReceived);
router.patch("/donations/:id/verify", validateBody(donationVerificationSchema), adminController.verifyDonationPayment);
router.patch("/donations/:id/overdue", adminController.markDonationOverdue);
router.patch("/donations/:id/remind", adminController.remindDonation);
router.patch("/donations/:id/suspend", adminController.suspendDonationTutor);
router.patch("/donations/:id/reinstate", adminController.reinstateTutor);

router.post(
  "/notifications/broadcast",
  validateBody(broadcastNotificationSchema),
  adminController.broadcastNotification
);

// Audit trail (spec section 23) — admin-only, read-only.
router.get("/audit-logs", adminController.listAudit);

export default router;
