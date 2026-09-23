import { Router } from "express";
import * as donationController from "../controllers/donation.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { donationPaymentSchema } from "../validators/donation.validator";

const router = Router();

router.get("/instructions", donationController.instructions);
router.get("/mine", protect, authorize("tutor"), donationController.listMine);
router.get("/:id", protect, authorize("tutor"), donationController.getOne);
router.post("/:id/payment", protect, authorize("tutor"), validateBody(donationPaymentSchema), donationController.submitPayment);

export default router;
